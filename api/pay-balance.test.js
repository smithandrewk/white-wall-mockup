// api/pay-balance.test.js — standalone (node api/pay-balance.test.js).
// Covers the PURE decidePayBalance matrix for the customer-initiated 40% balance
// payment. No DB, no Square, no network.

const assert = require("assert");
const { decidePayBalance } = require("./pay-balance");

function payable(extra) {
  return Object.assign(
    {
      id: "bk-1",
      customer_id: "user-1",
      payment_mode: "deposit",
      balance_status: "scheduled",
      balance_due_cents: 40000,
      square_customer_id: "cust_1",
      square_card_id: "card_1"
    },
    extra || {}
  );
}

// --- happy path: a scheduled deposit balance is payable ---
const ok = decidePayBalance(payable());
assert.strictEqual(ok.payable, true, "scheduled deposit w/ card => payable");
assert.strictEqual(ok.amountCents, 40000, "amount comes from the booking row");
assert.strictEqual(ok.cardHandle.customerId, "cust_1");
assert.strictEqual(ok.cardHandle.cardId, "card_1");

// --- the lockout case is the WHOLE point: a 'failed' (locked-out) balance is
//     still payable by the customer from their profile ---
assert.strictEqual(
  decidePayBalance(payable({ balance_status: "failed" })).payable,
  true,
  "locked-out 'failed' balance is the customer pay path => payable"
);

// --- not-payable matrix ---
assert.strictEqual(decidePayBalance(null).reason, "no-booking");
assert.strictEqual(decidePayBalance({}).reason, "no-booking");
assert.strictEqual(
  decidePayBalance(payable({ payment_mode: "full" })).reason,
  "not-a-deposit-booking",
  "a paid-in-full booking has no balance to settle"
);
assert.strictEqual(
  decidePayBalance(payable({ balance_status: "charged" })).reason,
  "balance-status:charged",
  "an already-charged balance is not re-payable"
);
assert.strictEqual(
  decidePayBalance(payable({ balance_status: "none" })).reason,
  "balance-status:none"
);
assert.strictEqual(
  decidePayBalance(payable({ balance_status: "refunded" })).reason,
  "balance-status:refunded"
);
assert.strictEqual(
  decidePayBalance(payable({ balance_due_cents: 0 })).reason,
  "no-balance-due"
);
assert.strictEqual(
  decidePayBalance(payable({ balance_due_cents: null })).reason,
  "no-balance-due"
);
assert.strictEqual(
  decidePayBalance(payable({ square_card_id: null })).reason,
  "missing-card-handle"
);
assert.strictEqual(
  decidePayBalance(payable({ square_customer_id: null })).reason,
  "missing-card-handle"
);

// payable() never leaks a card handle when not payable
assert.strictEqual(decidePayBalance(payable({ payment_mode: "full" })).cardHandle, undefined);

console.log("All pay-balance.test.js assertions passed.");
