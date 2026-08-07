// Square payment-error classifier (WW-28 / WW-29).
//
// A charge failure has three very different meanings that create-checkout used
// to collapse into ONE "[WhiteWall CRITICAL] Booking failed" page:
//
//   1. CARD DECLINE (the customer's card/issuer said no) — TRANSACTION_LIMIT
//      (issuer amount limit), GENERIC_DECLINE, CVV_FAILURE, INSUFFICIENT_FUNDS,
//      CARD_EXPIRED, etc. Nothing is wrong with our system or the account; the
//      booker just needs to try a different card. This is normal e-commerce and
//      must NOT page as a CRITICAL ops incident — it should show the customer a
//      clear, recoverable message and (at most) a WARNING follow-up to Drew.
//
//   2. ACCOUNT / MERCHANT-CONFIG problem — PAYMENT_LIMIT_EXCEEDED (the MERCHANT
//      account's processing limit), ACCOUNT_UNUSABLE, MERCHANT_SUBSCRIPTION_
//      NOT_FOUND, LOCATION mismatch, bad credentials. THIS is a real ops
//      incident that needs Andrew/Drew — keep it CRITICAL.
//
//   3. UNKNOWN — anything we can't positively classify. Fail LOUD (CRITICAL),
//      per the estate dev contract: a silently-swallowed real failure is worse
//      than a visible one. We only ever downgrade codes we KNOW are benign.
//
// Reference: Square ErrorCode enum + Payments API error codes.
//   TRANSACTION_LIMIT category = PAYMENT_METHOD_ERROR, meaning: "the card issuer
//   has determined the payment amount is either too high or too low" — i.e. the
//   customer's card, not the White Wall account.

// Card-decline codes: the issuer/card refused the charge. Customer-recoverable
// (retry with another card / contact their bank). Each maps to a specific,
// friendly, non-technical message shown DIRECTLY to the booker (the client
// renders the returned `error` string verbatim on the payment panel).
var CARD_DECLINE_MESSAGES = {
  TRANSACTION_LIMIT:
    "Your bank declined this charge because it exceeds a limit on the card. Please try a different card, or contact your bank and try again.",
  INSUFFICIENT_FUNDS:
    "Your card was declined for insufficient funds. Please try a different card.",
  CARD_DECLINED:
    "Your card was declined. Please try a different card or contact your bank.",
  GENERIC_DECLINE:
    "Your card was declined. Please try a different card or contact your bank.",
  CVV_FAILURE:
    "The security code (CVV) was incorrect. Please re-enter your card details and try again.",
  ADDRESS_VERIFICATION_FAILURE:
    "The billing ZIP/postal code did not match your card. Please re-enter your card details and try again.",
  INVALID_EXPIRATION:
    "The card expiration date was invalid. Please re-enter your card details and try again.",
  EXPIRATION_FAILURE:
    "The card expiration date was invalid. Please re-enter your card details and try again.",
  CARD_EXPIRED:
    "That card has expired. Please try a different card.",
  PAN_FAILURE:
    "The card number was invalid. Please re-enter your card details and try again.",
  CARD_NOT_SUPPORTED:
    "That card type isn't supported. Please try a different card.",
  INVALID_CARD:
    "The card details were invalid. Please re-enter your card and try again.",
  INVALID_CARD_DATA:
    "The card details were invalid. Please re-enter your card and try again.",
  CARD_DECLINED_CALL_ISSUER:
    "Your card was declined. Please contact your bank, or try a different card.",
  CARD_DECLINED_VERIFICATION_REQUIRED:
    "Your bank needs to verify this card. Please contact your bank, or try a different card.",
  ALLOWABLE_PIN_TRIES_EXCEEDED:
    "Your card was declined. Please try a different card or contact your bank.",
  VOICE_FAILURE:
    "Your card was declined. Please contact your bank, or try a different card.",
  CHIP_INSERTION_REQUIRED:
    "Your card was declined. Please try a different card.",
  TEMPORARY_ERROR:
    "The payment couldn't be processed right now. Please wait a moment and try again."
};

// Account / merchant-configuration codes: a genuine ops problem on OUR side.
// These stay CRITICAL. Notably PAYMENT_LIMIT_EXCEEDED = the MERCHANT account's
// processing limit (distinct from the card-issuer TRANSACTION_LIMIT above).
var ACCOUNT_CONFIG_CODES = {
  PAYMENT_LIMIT_EXCEEDED: true,
  ACCOUNT_UNUSABLE: true,
  MERCHANT_SUBSCRIPTION_NOT_FOUND: true,
  LOCATION_MISMATCH: true,
  UNAUTHORIZED: true,
  FORBIDDEN: true,
  INVALID_LOCATION: true,
  GATEWAY_DECLINE_RATE_LIMITED: true
};

var DEFAULT_DECLINE_MESSAGE =
  "Your card was declined. Please try a different card or contact your bank.";

// Pull a Square error code out of an Error. Prefer the structured field the
// square.js helper now attaches (err.squareCode); fall back to scanning the
// message for a KNOWN code token so errors thrown/re-wrapped elsewhere still
// classify. Returns an uppercase code string or null.
function extractCode(err) {
  if (!err) return null;
  if (err.squareCode) return String(err.squareCode).toUpperCase();
  var msg = (err.message || String(err)).toUpperCase();
  // Longest-first so the most specific code wins (e.g. prefer
  // CARD_DECLINED_VERIFICATION_REQUIRED over its CARD_DECLINED substring).
  var known = Object.keys(CARD_DECLINE_MESSAGES)
    .concat(Object.keys(ACCOUNT_CONFIG_CODES))
    .sort(function (a, b) { return b.length - a.length; });
  for (var i = 0; i < known.length; i++) {
    if (msg.indexOf(known[i]) !== -1) return known[i];
  }
  return null;
}

// classifyPaymentError(err) -> {
//   kind: "card_declined" | "account_config" | "unknown",
//   code: <string|null>,
//   category: <string|null>,
//   isCardDecline: <bool>,         // customer-recoverable; do NOT page critical
//   severity: "warning" | "critical",
//   customerMessage: <string>      // safe to show the booker verbatim
// }
function classifyPaymentError(err) {
  var code = extractCode(err);
  var category = err && err.squareCategory ? String(err.squareCategory).toUpperCase() : null;

  if (code && CARD_DECLINE_MESSAGES[code]) {
    return {
      kind: "card_declined",
      code: code,
      category: category || "PAYMENT_METHOD_ERROR",
      isCardDecline: true,
      severity: "warning",
      customerMessage: CARD_DECLINE_MESSAGES[code]
    };
  }

  if (code && ACCOUNT_CONFIG_CODES[code]) {
    return {
      kind: "account_config",
      code: code,
      category: category,
      isCardDecline: false,
      severity: "critical",
      customerMessage: "Your card was not charged. Please try again shortly or contact us."
    };
  }

  // A PAYMENT_METHOD_ERROR category with a code we don't have a bespoke message
  // for is STILL a card-side decline (the customer should retry with another
  // card), just with the generic decline copy. This keeps a new/unlisted Square
  // decline code from paging CRITICAL.
  if (category === "PAYMENT_METHOD_ERROR") {
    return {
      kind: "card_declined",
      code: code,
      category: category,
      isCardDecline: true,
      severity: "warning",
      customerMessage: DEFAULT_DECLINE_MESSAGE
    };
  }

  return {
    kind: "unknown",
    code: code,
    category: category,
    isCardDecline: false,
    severity: "critical",
    customerMessage: "Your card was not charged. Please try again."
  };
}

module.exports = { classifyPaymentError };
