// api/_lib/deposit-lockout.test.js — standalone (node api/_lib/deposit-lockout.test.js).
// Exhaustive retry-x3-then-lockout matrix + the never-cancel invariant.

const assert = require("assert");
const { decideLockout, MAX_ATTEMPTS } = require("./deposit-lockout");

const booking = {
  id: "bk-9",
  email: "cust@example.com",
  balance_due_cents: 40000
};

// --- success short-circuits ---
assert.strictEqual(decideLockout({ attempts: 1, lastOutcome: "succeeded", booking }).action, "none");

// --- retry while attempts < 3 ---
const r1 = decideLockout({ attempts: 1, lastOutcome: "declined", booking });
assert.strictEqual(r1.action, "retry");
assert.strictEqual(r1.nextAttemptNo, 2);
assert.strictEqual(r1.attemptsRemaining, 2);

const r2 = decideLockout({ attempts: 2, lastOutcome: "expired", booking });
assert.strictEqual(r2.action, "retry");
assert.strictEqual(r2.nextAttemptNo, 3);
assert.strictEqual(r2.attemptsRemaining, 1);

// --- 3rd failure => LOCKOUT, never cancel ---
const lock = decideLockout(
  { attempts: 3, lastOutcome: "declined", booking },
  { studioEmail: "studio@whitewallstudios.co", drewHandle: "+18038738153" }
);
assert.strictEqual(lock.action, "lockout");
assert.strictEqual(lock.balanceStatus, "failed");
assert.strictEqual(lock.cancelAppointment, false, "lockout NEVER cancels the appointment");
assert.strictEqual(MAX_ATTEMPTS, 3);

// fan-out: exactly the 4 channels, in order, none of them a cancel
const channels = lock.fanout.map(function (f) { return f.channel; });
assert.deepStrictEqual(channels, [
  "email_customer",
  "expose_pay_balance",
  "alert_studio_email",
  "watson_text_drew"
]);
lock.fanout.forEach(function (f) {
  assert.strictEqual(f.never_cancel, true, "every fan-out item carries never_cancel");
  assert.notStrictEqual(f.channel, "cancel_appointment");
  assert.strictEqual(f.amountCents, 40000);
  assert.strictEqual(f.bookingId, "bk-9");
});

// recipients are resolved from booking + opts
const emailItem = lock.fanout.find(function (f) { return f.channel === "email_customer"; });
assert.strictEqual(emailItem.to, "cust@example.com");
const studioItem = lock.fanout.find(function (f) { return f.channel === "alert_studio_email"; });
assert.strictEqual(studioItem.to, "studio@whitewallstudios.co");
const drewItem = lock.fanout.find(function (f) { return f.channel === "watson_text_drew"; });
assert.strictEqual(drewItem.to, "+18038738153");

// opts omitted => studio/drew recipients null (dispatcher fills them), still locks out
const lockNoOpts = decideLockout({ attempts: 4, lastOutcome: "error", booking });
assert.strictEqual(lockNoOpts.action, "lockout");
assert.strictEqual(
  lockNoOpts.fanout.find(function (f) { return f.channel === "alert_studio_email"; }).to,
  null
);

// --- guard: unknown outcome with no prior attempt = do nothing (don't guess) ---
assert.strictEqual(decideLockout({ attempts: 0, lastOutcome: "unknown", booking }).action, "none");
assert.strictEqual(decideLockout({}).action, "none");

// custom maxAttempts honored
const r5 = decideLockout({ attempts: 1, lastOutcome: "declined", booking }, { maxAttempts: 1 });
assert.strictEqual(r5.action, "lockout", "maxAttempts=1 locks out after the first failure");

console.log("All deposit-lockout.test.js assertions passed.");
