// api/_lib/balance-charge.test.js — standalone (node api/_lib/balance-charge.test.js).
// Covers the decide matrix + the DARK gate on the executor (no real Square).

const assert = require("assert");
const {
  decideBalanceCharge,
  executeBalanceCharge,
  computeBalanceIdempotencyKey
} = require("./balance-charge");

const NOW = Date.parse("2026-07-10T12:00:00Z");

function chargeable(extra) {
  return Object.assign(
    {
      id: "bk-1",
      payment_mode: "deposit",
      balance_status: "scheduled",
      balance_due_cents: 40000,
      balance_charge_at: "2026-07-10T11:00:00Z", // 1h in the past => due
      square_customer_id: "cust_1",
      square_card_id: "card_1",
      email: "c@example.com"
    },
    extra || {}
  );
}

// --- decide: the happy path ---
const due = decideBalanceCharge(chargeable(), NOW);
assert.strictEqual(due.due, true, "scheduled + past charge_at => due");
assert.strictEqual(due.intent.bookingId, "bk-1");
assert.strictEqual(due.intent.amountCents, 40000);
assert.strictEqual(due.intent.cardHandle.customerId, "cust_1");
assert.strictEqual(due.intent.cardHandle.cardId, "card_1");
assert.ok(due.idempotencyKey && due.idempotencyKey.length <= 45, "idem key <= 45 chars");

// --- decide: not-due matrix ---
assert.strictEqual(decideBalanceCharge(null, NOW).reason, "no-booking");
assert.strictEqual(
  decideBalanceCharge(chargeable({ payment_mode: "full" }), NOW).reason,
  "not-a-deposit-booking"
);
assert.strictEqual(
  decideBalanceCharge(chargeable({ balance_status: "charged" }), NOW).reason,
  "balance-status:charged"
);
assert.strictEqual(
  decideBalanceCharge(chargeable({ balance_due_cents: 0 }), NOW).reason,
  "no-balance-due"
);
assert.strictEqual(
  decideBalanceCharge(chargeable({ square_card_id: null }), NOW).reason,
  "missing-card-handle"
);
assert.strictEqual(
  decideBalanceCharge(chargeable({ balance_charge_at: null }), NOW).reason,
  "no-charge-time"
);

// not-yet-due: charge_at in the FUTURE
const future = decideBalanceCharge(
  chargeable({ balance_charge_at: "2026-07-10T13:00:00Z" }),
  NOW
);
assert.strictEqual(future.due, false);
assert.strictEqual(future.reason, "not-yet-due");
assert.strictEqual(future.fireAtMs, Date.parse("2026-07-10T13:00:00Z"));

// retryable 'failed' status is still chargeable (lockout lib decides exhaustion)
assert.strictEqual(decideBalanceCharge(chargeable({ balance_status: "failed" }), NOW).due, true);

// --- idempotency key: stable + amount-sensitive ---
assert.strictEqual(
  computeBalanceIdempotencyKey(chargeable()),
  computeBalanceIdempotencyKey(chargeable()),
  "same booking+amount => same key"
);
assert.notStrictEqual(
  computeBalanceIdempotencyKey(chargeable()),
  computeBalanceIdempotencyKey(chargeable({ balance_due_cents: 50000 })),
  "different amount => different key"
);

// --- executor: DARK by default (flag OFF) makes NO charge ---
let charged = false;
async function fakeCharge() {
  charged = true;
  return { id: "pay_should_not_happen" };
}

(async function run() {
  const dry = await executeBalanceCharge(chargeable(), {
    now: NOW,
    env: {}, // DEPOSIT_AUTOCHARGE_ARMED unset
    chargeCardOnFile: fakeCharge
  });
  assert.strictEqual(dry.dryRun, true, "flag OFF => dryRun");
  assert.strictEqual(dry.charged, false);
  assert.strictEqual(charged, false, "NO charge fn called when disarmed");
  assert.ok(dry.intent, "dry-run still reports the intent it would fire");

  // executor: not-due short-circuits (still no charge)
  const skip = await executeBalanceCharge(chargeable({ payment_mode: "full" }), {
    now: NOW,
    env: { DEPOSIT_AUTOCHARGE_ARMED: "1" },
    chargeCardOnFile: fakeCharge
  });
  assert.strictEqual(skip.skipped, true);
  assert.strictEqual(skip.reason, "not-a-deposit-booking");
  assert.strictEqual(charged, false, "still no charge for a non-deposit booking");

  // executor: ARMED + due => fires the (injected) charge fn exactly once
  let capture = null;
  const armed = await executeBalanceCharge(chargeable(), {
    now: NOW,
    env: { DEPOSIT_AUTOCHARGE_ARMED: "1" },
    chargeCardOnFile: async function (opts) {
      capture = opts;
      return { id: "pay_real", status: "COMPLETED" };
    }
  });
  assert.strictEqual(armed.charged, true);
  assert.strictEqual(armed.dryRun, false);
  assert.strictEqual(armed.payment.id, "pay_real");
  assert.strictEqual(capture.amountCents, 40000);
  assert.strictEqual(capture.customerId, "cust_1");
  assert.strictEqual(capture.cardId, "card_1");
  assert.strictEqual(capture.idempotencyKey, armed.idempotencyKey, "forwards idem key");

  console.log("All balance-charge.test.js assertions passed.");
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
