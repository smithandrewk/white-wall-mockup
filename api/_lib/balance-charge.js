// api/_lib/balance-charge.js — PURE decision + thin armed executor for the
// 40% balance auto-charge (V3 item 6). NEW file, no callers wired yet.
//
// This is a LIBRARY, not an endpoint. The unified dispatcher
// (/api/scheduler-run, api/_lib/scheduler-dispatch.js — sibling node) is the
// SINGLE charging authority; on each tick it calls decideBalanceCharge() to
// learn whether a booking's 40% is due, and executeBalanceCharge() to actually
// fire it. There is deliberately NO /api/charge-balance endpoint.
//
// DARK DISCIPLINE: executeBalanceCharge reaches Square's chargeCardOnFile ONLY
// when DEPOSIT_AUTOCHARGE_ARMED === "1". With the flag off (the default) it is a
// dry-run that makes NO charge and returns { dryRun: true } with the intent it
// WOULD have fired, for safe logging. decideBalanceCharge is always a pure,
// side-effect-free read of the booking row.
//
// Schema (supabase 0001 bookings + 0004 retry columns): the chargeable booking
// has payment_mode='deposit', balance_status='scheduled' (or a retryable
// 'failed'), a positive balance_due_cents, a balance_charge_at (= first session
// start − 48h), and the saved card handle (square_customer_id + square_card_id).
//
// Idempotency: the dispatcher's idempotency_keys ledger (0003) is the real
// double-charge guard; computeBalanceIdempotencyKey() produces the stable
// sha256-truncated-to-45 key for that ledger, mirroring the create-checkout.js
// pattern. It is also forwarded to the charge fn for forward-compatibility.

const crypto = require("crypto");

// balance_status values from which an auto-charge may still proceed. 'scheduled'
// is the normal armed state; 'failed' is retryable until the lockout lib
// (deposit-lockout.js) declares attempts exhausted. 'charged'/'refunded'/'none'
// are terminal/not-owed and never re-charged here.
const CHARGEABLE_STATUSES = ["scheduled", "failed"];

// Stable per-booking-balance idempotency key. sha256 over a fixed seed,
// truncated to 45 (Square's idempotency_key cap; still ~180 bits). The amount is
// included so a balance that changes (e.g. partial refund then re-bill) keys to
// a distinct charge.
function computeBalanceIdempotencyKey(booking) {
  if (!booking || !booking.id) {
    throw new Error("computeBalanceIdempotencyKey: booking.id required");
  }
  return crypto
    .createHash("sha256")
    .update("balance|" + booking.id + "|" + (booking.balance_due_cents || 0))
    .digest("hex")
    .slice(0, 45);
}

// decideBalanceCharge(booking, nowMs) — PURE.
// Returns either:
//   { due: false, reason: <string>, fireAtMs?: <number> }
//   { due: true,  intent: { bookingId, amountCents, cardHandle: { customerId, cardId } },
//                 idempotencyKey }
function decideBalanceCharge(booking, nowMs) {
  var now = typeof nowMs === "number" ? nowMs : Date.now();

  if (!booking || !booking.id) return { due: false, reason: "no-booking" };
  if (booking.payment_mode !== "deposit") {
    return { due: false, reason: "not-a-deposit-booking" };
  }
  if (CHARGEABLE_STATUSES.indexOf(booking.balance_status) === -1) {
    return { due: false, reason: "balance-status:" + booking.balance_status };
  }
  if (!booking.balance_due_cents || booking.balance_due_cents <= 0) {
    return { due: false, reason: "no-balance-due" };
  }
  if (!booking.square_customer_id || !booking.square_card_id) {
    return { due: false, reason: "missing-card-handle" };
  }
  if (!booking.balance_charge_at) {
    return { due: false, reason: "no-charge-time" };
  }
  var fireAtMs = new Date(booking.balance_charge_at).getTime();
  if (isNaN(fireAtMs)) {
    return { due: false, reason: "invalid-charge-time" };
  }
  if (fireAtMs > now) {
    return { due: false, reason: "not-yet-due", fireAtMs: fireAtMs };
  }

  return {
    due: true,
    intent: {
      bookingId: booking.id,
      amountCents: booking.balance_due_cents,
      cardHandle: {
        customerId: booking.square_customer_id,
        cardId: booking.square_card_id
      }
    },
    idempotencyKey: computeBalanceIdempotencyKey(booking)
  };
}

// executeBalanceCharge(booking, opts) — thin executor.
// opts: { now, env, chargeCardOnFile }  (all optional; injectable for tests)
// Returns:
//   { charged:false, skipped:true,  reason }                 (not due)
//   { charged:false, dryRun:true,   intent, idempotencyKey } (flag OFF — DARK)
//   { charged:true,  dryRun:false,  payment, intent, idempotencyKey }
async function executeBalanceCharge(booking, opts) {
  opts = opts || {};
  var now = typeof opts.now === "number" ? opts.now : Date.now();
  var env = opts.env || process.env;

  var decision = decideBalanceCharge(booking, now);
  if (!decision.due) {
    return { charged: false, skipped: true, reason: decision.reason, decision: decision };
  }

  // DARK GATE: no Square charge unless the arming flag is explicitly "1".
  if (env.DEPOSIT_AUTOCHARGE_ARMED !== "1") {
    return {
      charged: false,
      dryRun: true,
      reason: "disarmed",
      intent: decision.intent,
      idempotencyKey: decision.idempotencyKey
    };
  }

  var charge = opts.chargeCardOnFile || require("./square").chargeCardOnFile;
  var payment = await charge({
    customerId: decision.intent.cardHandle.customerId,
    cardId: decision.intent.cardHandle.cardId,
    amountCents: decision.intent.amountCents,
    idempotencyKey: decision.idempotencyKey,
    note: "WWS 40% balance — booking " + booking.id
  });

  return {
    charged: true,
    dryRun: false,
    payment: payment,
    intent: decision.intent,
    idempotencyKey: decision.idempotencyKey
  };
}

module.exports = {
  CHARGEABLE_STATUSES: CHARGEABLE_STATUSES,
  computeBalanceIdempotencyKey: computeBalanceIdempotencyKey,
  decideBalanceCharge: decideBalanceCharge,
  executeBalanceCharge: executeBalanceCharge
};
