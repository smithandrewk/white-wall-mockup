// api/_lib/square-errors.test.js — standalone (node api/_lib/square-errors.test.js).
// WW-29: benign customer card decline vs. real system/config failure classification.
// The load-bearing invariants: the real WW-29 decline is benign (no page); WW-28's
// TRANSACTION_LIMIT is NOT (still pages); an unknown or mixed code set fails loud.

const assert = require("assert");
const { classifySquarePaymentError } = require("./square-errors");

// Mirror how square.js builds the thrown Error: structured .squareCodes +
// .squareStep, plus the message string carrying each code in single quotes.
function paymentErr(codes) {
  const detail = codes.map(function (c) { return "Authorization error: '" + c + "'"; }).join(", ");
  const e = new Error("Square createPayment 400: " + detail);
  e.squareStep = "createPayment";
  e.squareStatus = 400;
  e.squareCodes = codes;
  return e;
}
// Same, but WITHOUT the structured field — forces the message-string fallback.
function paymentErrStringOnly(codes) {
  const detail = codes.map(function (c) { return "Authorization error: '" + c + "'"; }).join(", ");
  return new Error("Square createPayment 400: " + detail);
}

// --- benign customer declines: no ops page, friendly retry ---
assert.strictEqual(classifySquarePaymentError(paymentErr(["GENERIC_DECLINE", "CVV_FAILURE"])).isBenignDecline, true,
  "WW-29 Lauren West GENERIC_DECLINE+CVV_FAILURE must be benign");
assert.strictEqual(classifySquarePaymentError(paymentErr(["INSUFFICIENT_FUNDS"])).isBenignDecline, true);
assert.strictEqual(classifySquarePaymentError(paymentErr(["CARD_EXPIRED"])).isBenignDecline, true);
assert.strictEqual(classifySquarePaymentError(paymentErr(["ADDRESS_VERIFICATION_FAILURE"])).isBenignDecline, true);
assert.strictEqual(classifySquarePaymentError(paymentErr(["CARD_TOKEN_EXPIRED"])).isBenignDecline, true);

// --- real failures: STILL page (default-deny) ---
assert.strictEqual(classifySquarePaymentError(paymentErr(["TRANSACTION_LIMIT"])).isBenignDecline, false,
  "WW-28 TRANSACTION_LIMIT must remain a real failure (pages CRITICAL)");
assert.strictEqual(classifySquarePaymentError(paymentErr(["GENERIC_DECLINE", "TRANSACTION_LIMIT"])).isBenignDecline, false,
  "a mixed benign+real set must page (never partially swallow)");
assert.strictEqual(classifySquarePaymentError(paymentErr(["SOME_BRAND_NEW_CODE"])).isBenignDecline, false,
  "an unknown code must fail loud, not be assumed benign");
assert.strictEqual(classifySquarePaymentError(paymentErr([])).isBenignDecline, false,
  "no recoverable code => page");

// --- only createPayment errors are ever benign-classified ---
const cardErr = new Error("Square createCard 400: Authorization error: 'GENERIC_DECLINE'");
cardErr.squareStep = "createCard";
cardErr.squareCodes = ["GENERIC_DECLINE"];
assert.strictEqual(classifySquarePaymentError(cardErr).isBenignDecline, false,
  "a card-on-file (non-charge) failure is never a benign decline");
assert.strictEqual(classifySquarePaymentError(new Error("Acuity 500: internal")).isBenignDecline, false,
  "a non-Square error is never a benign decline");

// --- message-string fallback (Error without structured .squareCodes) ---
assert.strictEqual(classifySquarePaymentError(paymentErrStringOnly(["GENERIC_DECLINE", "CVV_FAILURE"])).isBenignDecline, true);
assert.deepStrictEqual(classifySquarePaymentError(paymentErrStringOnly(["GENERIC_DECLINE", "CVV_FAILURE"])).codes,
  ["GENERIC_DECLINE", "CVV_FAILURE"], "codes are scraped from the message when the structured field is absent");
assert.strictEqual(classifySquarePaymentError(paymentErrStringOnly(["TRANSACTION_LIMIT"])).isBenignDecline, false);

// --- customer message is specific and always states the card was not charged ---
const cvvMsg = classifySquarePaymentError(paymentErr(["CVV_FAILURE"])).customerMessage;
assert.ok(/CVV|security code/i.test(cvvMsg), "CVV decline message names the CVV");
assert.ok(/not charged/i.test(cvvMsg), "message reassures the card was not charged");
assert.ok(/insufficient funds/i.test(classifySquarePaymentError(paymentErr(["INSUFFICIENT_FUNDS"])).customerMessage));

console.log("square-errors.test.js: all assertions passed");
