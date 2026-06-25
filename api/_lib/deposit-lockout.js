// api/_lib/deposit-lockout.js — PURE retry-x3-then-lockout decision for the 40%
// balance auto-charge (V3 item 6). NEW file, no callers wired yet.
//
// Locked rule (manager + Drew, 2026-06-22): when the 48h auto-charge fails
// (declined / expired card), RETRY up to 3 attempts, then LOCK OUT. The lockout
// is a fan-out, NOT a cancellation — the appointment is NEVER cancelled (the 60%
// deposit is non-refundable; the balance is simply chased). Fan-out:
//   1. email the customer (update your card / pay your balance)
//   2. expose the pay-balance control in the customer's profile
//   3. alert the White Wall studio inbox
//   4. Watson-text Drew
//
// This module ONLY DECIDES. It performs no sends and reads no env: the unified
// dispatcher (api/_lib/scheduler-dispatch.js) takes the returned fan-out
// descriptors and executes each behind its own dark flag. Keeping it pure makes
// the retry/lockout matrix exhaustively unit-testable.

const MAX_ATTEMPTS = 3;

// Outcomes that mean the charge did not collect and another attempt (or lockout)
// is warranted. 'succeeded' short-circuits to no further action.
const RETRYABLE_OUTCOMES = ["declined", "expired", "error"];

// Build the lockout fan-out descriptors. PURE — recipients for the customer come
// off the booking row; the studio inbox + Drew's handle are passed in by the
// dispatcher (defaulting to null here so the lib stays env-free and
// deterministic). Every descriptor carries never_cancel:true to make the
// no-cancellation invariant impossible to miss downstream.
function buildLockoutFanout(booking, opts) {
  booking = booking || {};
  opts = opts || {};
  var bookingId = booking.id || null;
  var amountCents = booking.balance_due_cents || null;

  return [
    {
      channel: "email_customer",
      to: booking.email || booking.customer_email || null,
      bookingId: bookingId,
      amountCents: amountCents,
      never_cancel: true
    },
    {
      // A state change, not a send: surface the "pay balance" action in the
      // logged-in customer's profile so they can self-settle.
      channel: "expose_pay_balance",
      bookingId: bookingId,
      amountCents: amountCents,
      never_cancel: true
    },
    {
      channel: "alert_studio_email",
      to: opts.studioEmail || null,
      bookingId: bookingId,
      amountCents: amountCents,
      never_cancel: true
    },
    {
      channel: "watson_text_drew",
      to: opts.drewHandle || null,
      bookingId: bookingId,
      amountCents: amountCents,
      never_cancel: true
    }
  ];
}

// decideLockout(state, opts) — PURE.
// state: { attempts, lastOutcome, booking }
//   attempts    — total attempts MADE so far, including the one that just failed.
//   lastOutcome — 'succeeded' | 'declined' | 'expired' | 'error'.
//   booking     — the booking row (for fan-out recipients / amount).
// opts:  { maxAttempts, studioEmail, drewHandle }
// Returns:
//   { action: 'none',    reason }                              (charge succeeded)
//   { action: 'retry',   nextAttemptNo, attemptsRemaining }    (attempts < max)
//   { action: 'lockout', balanceStatus:'failed', cancelAppointment:false, fanout:[...] }
function decideLockout(state, opts) {
  state = state || {};
  opts = opts || {};
  var maxAttempts = opts.maxAttempts || MAX_ATTEMPTS;
  var attempts = state.attempts || 0;

  if (state.lastOutcome === "succeeded") {
    return { action: "none", reason: "charged" };
  }

  // Unknown / non-retryable outcome with no failure recorded: do nothing rather
  // than guess. (A genuine failure always carries a retryable outcome.)
  if (RETRYABLE_OUTCOMES.indexOf(state.lastOutcome) === -1 && attempts === 0) {
    return { action: "none", reason: "no-failure" };
  }

  if (attempts < maxAttempts) {
    return {
      action: "retry",
      nextAttemptNo: attempts + 1,
      attemptsRemaining: maxAttempts - attempts
    };
  }

  return {
    action: "lockout",
    balanceStatus: "failed",
    // The load-bearing invariant: lockout NEVER cancels the appointment.
    cancelAppointment: false,
    fanout: buildLockoutFanout(state.booking, opts)
  };
}

module.exports = {
  MAX_ATTEMPTS: MAX_ATTEMPTS,
  RETRYABLE_OUTCOMES: RETRYABLE_OUTCOMES,
  buildLockoutFanout: buildLockoutFanout,
  decideLockout: decideLockout
};
