// Internal module — classify a Square payment (createPayment) failure as a
// BENIGN customer card decline vs. a REAL system / config / account failure that
// ops needs to see. (WW-29.)
//
// Why this exists: `create-checkout.js` used to fire a CRITICAL ops alert for
// EVERY failure in the charge→book try block. But an ordinary card decline
// (`GENERIC_DECLINE`, `CVV_FAILURE`, insufficient funds, expired card, bad ZIP)
// is expected — the customer just needs to try another card, and nothing was
// charged. Paging CRITICAL for those is noise that buries the alerts that
// actually need Andrew (e.g. WW-28's real `TRANSACTION_LIMIT`, which IS a system
// problem the account owner has to fix).
//
// Design = conservative whitelist. Only the codes we KNOW are benign customer
// declines are treated as benign; ANY other code — including an unrecognized one
// — is treated as a real failure and still pages. Better to over-alert on an
// unknown code than to silently swallow a genuine failure.
//
// Square attaches a machine-readable `code` to each error in a CreatePayment
// 4xx response. `square.js` copies those onto the thrown Error as `.squareCodes`.
// We fall back to scraping codes out of the message string (Square's `detail`
// text carries the code in single quotes, e.g. "Authorization error:
// 'GENERIC_DECLINE'") so classification still works on an Error that predates the
// structured field.

// Card / customer decline codes — the buyer must try another card (or fix a
// mistyped field). Sourced from Square's CreatePayment error reference. These are
// NOT system failures: no money moved, no ops action, no page.
var BENIGN_DECLINE_CODES = {
  GENERIC_DECLINE: 1,
  CARD_DECLINED: 1,
  CARD_DECLINED_CALL_ISSUER: 1,
  CARD_DECLINED_VERIFICATION_REQUIRED: 1,
  CVV_FAILURE: 1,
  ADDRESS_VERIFICATION_FAILURE: 1,
  INVALID_ACCOUNT: 1,
  INSUFFICIENT_FUNDS: 1,
  CARD_EXPIRED: 1,
  EXPIRATION_FAILURE: 1,
  INVALID_EXPIRATION: 1,
  INVALID_EXPIRATION_YEAR: 1,
  INVALID_EXPIRATION_DATE: 1,
  INVALID_CARD: 1,
  INVALID_CARD_DATA: 1,
  PAN_FAILURE: 1,
  INVALID_PIN: 1,
  ALLOWABLE_PIN_TRIES_EXCEEDED: 1,
  INVALID_POSTAL_CODE: 1,
  CARD_NOT_SUPPORTED: 1,
  VOICE_FAILURE: 1,
  BLOCKED_BY_BLOCKLIST: 1,
  BUYER_REFUSED_PAYMENT: 1,
  // Single-use token problems — transient; the customer re-enters the card and
  // retries. Not a system failure.
  CARD_TOKEN_EXPIRED: 1,
  CARD_TOKEN_USED: 1,
  TEMPORARY_ERROR: 1
};

// Codes we explicitly KNOW are real system / config / account problems worth a
// page. This map is documentation + intent — the classifier does NOT need it
// (anything not in BENIGN_DECLINE_CODES already pages). It exists so the WW-28
// TRANSACTION_LIMIT class is pinned to the CRITICAL path on purpose, not by
// accident, and so a future reader sees where these belong.
var REAL_FAILURE_CODES = {
  TRANSACTION_LIMIT: 1,               // account per-transaction limit (WW-28) — needs Andrew
  PAYMENT_LIMIT_EXCEEDED: 1,
  DELAYED_TRANSACTION_LIMIT_EXCEEDED: 1,
  AMOUNT_TOO_HIGH: 1,
  INSUFFICIENT_PERMISSIONS: 1,
  UNAUTHORIZED: 1,
  FORBIDDEN: 1,
  INVALID_LOCATION: 1,
  LOCATION_MISMATCH: 1,
  CURRENCY_MISMATCH: 1,
  CARD_PROCESSING_NOT_ENABLED: 1,
  BAD_REQUEST: 1,
  MISSING_REQUIRED_PARAMETER: 1,
  INTERNAL_SERVER_ERROR: 1,
  SERVICE_UNAVAILABLE: 1,
  GATEWAY_TIMEOUT: 1
};

// Pull the Square error codes off an Error — structured field first, message
// string second.
function extractCodes(err) {
  if (err && Array.isArray(err.squareCodes) && err.squareCodes.length) {
    return err.squareCodes.filter(Boolean);
  }
  var msg = (err && err.message) || "";
  var codes = [];
  var re = /'([A-Z][A-Z0-9_]+)'/g; // 'GENERIC_DECLINE'
  var m;
  while ((m = re.exec(msg)) !== null) codes.push(m[1]);
  return codes;
}

// Is this specifically a Square createPayment (charge) failure? We only ever
// benign-classify a CHARGE decline; a failure in any other step (customer
// create, card-on-file save, Acuity write) keeps its existing CRITICAL handling.
function isSquarePaymentError(err) {
  if (err && err.squareStep === "createPayment") return true;
  var msg = (err && err.message) || "";
  return /Square createPayment/.test(msg);
}

// A friendly, actionable customer message for a benign decline. Tailored to the
// specific decline reason where we can, generic otherwise. Always makes clear the
// card was NOT charged so the customer retries without fear of a double charge.
function benignMessage(codes) {
  var has = function (c) { return codes.indexOf(c) !== -1; };
  if (has("CVV_FAILURE") || has("INVALID_PIN")) {
    return "Your card was declined — the security code (CVV) didn’t match. Please re-check the code and try again, or use a different card. Your card was not charged.";
  }
  if (has("INSUFFICIENT_FUNDS")) {
    return "Your card was declined for insufficient funds. Please try a different card. Your card was not charged.";
  }
  if (has("CARD_EXPIRED") || has("EXPIRATION_FAILURE") || has("INVALID_EXPIRATION") ||
      has("INVALID_EXPIRATION_YEAR") || has("INVALID_EXPIRATION_DATE")) {
    return "Your card was declined — the expiration date looks incorrect or the card has expired. Please double-check it or use a different card. Your card was not charged.";
  }
  if (has("ADDRESS_VERIFICATION_FAILURE") || has("INVALID_POSTAL_CODE")) {
    return "Your card was declined — the billing ZIP/postal code didn’t match. Please re-enter it or try a different card. Your card was not charged.";
  }
  if (has("CARD_TOKEN_EXPIRED") || has("CARD_TOKEN_USED") || has("TEMPORARY_ERROR")) {
    return "We couldn’t complete that charge — please re-enter your card details and try again. Your card was not charged.";
  }
  return "Your card was declined. Please check your card details or try a different card. Your card was not charged.";
}

// classifySquarePaymentError(err) -> { isBenignDecline, codes, customerMessage }
//
// isBenignDecline is true ONLY when: it is a createPayment error, we recovered at
// least one code, and EVERY recovered code is on the benign whitelist. A mixed
// set (one benign + one unknown), an empty set, or a non-payment error all
// resolve to isBenignDecline=false, i.e. keep the CRITICAL path.
function classifySquarePaymentError(err) {
  var codes = extractCodes(err);
  var benign = isSquarePaymentError(err) &&
    codes.length > 0 &&
    codes.every(function (c) { return BENIGN_DECLINE_CODES[c] === 1; });
  return {
    isBenignDecline: benign,
    codes: codes,
    customerMessage: benignMessage(codes)
  };
}

module.exports = {
  classifySquarePaymentError,
  isSquarePaymentError,
  BENIGN_DECLINE_CODES,
  REAL_FAILURE_CODES
};
