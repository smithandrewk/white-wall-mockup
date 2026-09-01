// Tests for classifyPaymentError — the Square payment-error classifier that
// keeps a normal card decline (WW-28 TRANSACTION_LIMIT, WW-29 GENERIC_DECLINE /
// CVV_FAILURE) from paging a CRITICAL ops incident, and gives the booker a
// recoverable message, while genuine account/system errors stay CRITICAL.
const assert = require("assert");
const { classifyPaymentError } = require("./payment-error");
let n = 0; function ok(l){n++;console.log("ok "+n+" - "+l);}

// Simulate what square.js now attaches to a thrown createPayment error.
function sqErr(context, status, code, category, detail) {
  var e = new Error("Square " + context + " " + status + ": " + (detail || ("Authorization error: '" + code + "'")));
  e.squareStatus = status;
  e.squareErrors = [{ code: code, category: category, detail: detail || ("Authorization error: '" + code + "'") }];
  e.squareCode = code;
  e.squareCategory = category;
  return e;
}

// --- The WW-28 incident itself: TRANSACTION_LIMIT (card issuer, customer-side) ---
var t = classifyPaymentError(sqErr("createPayment", 400, "TRANSACTION_LIMIT", "PAYMENT_METHOD_ERROR"));
assert.strictEqual(t.kind, "card_declined", "TRANSACTION_LIMIT is a card decline");
assert.strictEqual(t.isCardDecline, true, "TRANSACTION_LIMIT is customer-recoverable");
assert.strictEqual(t.severity, "warning", "TRANSACTION_LIMIT does NOT page critical");
assert.ok(/limit on the card/i.test(t.customerMessage), "TRANSACTION_LIMIT message names the card limit");
ok("TRANSACTION_LIMIT -> card decline, warning, recoverable message");

// --- The WW-29 siblings ---
["GENERIC_DECLINE", "CVV_FAILURE", "INSUFFICIENT_FUNDS", "CARD_EXPIRED", "CARD_DECLINED"].forEach(function (code) {
  var r = classifyPaymentError(sqErr("createPayment", 402, code, "PAYMENT_METHOD_ERROR"));
  assert.strictEqual(r.isCardDecline, true, code + " is a card decline");
  assert.strictEqual(r.severity, "warning", code + " does not page critical");
  assert.ok(r.customerMessage && r.customerMessage.length > 0, code + " has a customer message");
});
ok("GENERIC_DECLINE / CVV_FAILURE / INSUFFICIENT_FUNDS / CARD_EXPIRED / CARD_DECLINED -> card declines");

// --- An unlisted PAYMENT_METHOD_ERROR code still counts as a card decline ---
var u = classifyPaymentError(sqErr("createPayment", 402, "SOME_NEW_DECLINE_CODE", "PAYMENT_METHOD_ERROR"));
assert.strictEqual(u.isCardDecline, true, "unlisted PAYMENT_METHOD_ERROR is still a card decline");
assert.strictEqual(u.severity, "warning", "unlisted decline does not page critical");
ok("unlisted PAYMENT_METHOD_ERROR code -> generic card decline (no critical page)");

// --- Merchant/account-config error stays CRITICAL (real ops problem) ---
var acct = classifyPaymentError(sqErr("createPayment", 400, "PAYMENT_LIMIT_EXCEEDED", "PAYMENT_METHOD_ERROR"));
assert.strictEqual(acct.kind, "account_config", "PAYMENT_LIMIT_EXCEEDED is the merchant account limit");
assert.strictEqual(acct.isCardDecline, false, "account limit is NOT a customer decline");
assert.strictEqual(acct.severity, "critical", "account limit stays critical");
ok("PAYMENT_LIMIT_EXCEEDED (merchant account) -> account_config, critical");

// --- Unknown / non-Square error fails loud (critical) ---
var unk = classifyPaymentError(new Error("Acuity 500: something broke"));
assert.strictEqual(unk.kind, "unknown", "non-Square error is unknown");
assert.strictEqual(unk.isCardDecline, false, "unknown is not a decline");
assert.strictEqual(unk.severity, "critical", "unknown fails loud");
ok("unknown / non-Square error -> critical (fail loud)");

// --- Fallback: no structured fields, code only in the message string ---
var scan = classifyPaymentError(new Error("Square createPayment 400: Authorization error: 'TRANSACTION_LIMIT'"));
assert.strictEqual(scan.isCardDecline, true, "message-scan fallback still finds TRANSACTION_LIMIT");
ok("message-scan fallback classifies a decline when structured fields are absent");

// --- Longest-code-wins: the verification-required variant is not shadowed ---
var vr = classifyPaymentError(sqErr("createPayment", 402, "CARD_DECLINED_VERIFICATION_REQUIRED", "PAYMENT_METHOD_ERROR"));
assert.strictEqual(vr.code, "CARD_DECLINED_VERIFICATION_REQUIRED", "specific verification code preserved");
assert.strictEqual(vr.isCardDecline, true, "verification-required is a recoverable decline");
ok("CARD_DECLINED_VERIFICATION_REQUIRED classified specifically, not as CARD_DECLINED");

console.log("1.." + n);
