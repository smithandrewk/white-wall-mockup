// api/_lib/campaign-schedule.test.js — standalone (node api/_lib/campaign-schedule.test.js).
// Fire-time matrix for the 4 touches + balance auto-charge + every-6h reminders,
// including the last-minute-booking SKIP-overdue (not bunched) rule.

const assert = require("assert");
const { computeCampaignSchedule } = require("./campaign-schedule");

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

// --- healthy booking: made a month ahead, evaluated AT booking time (nothing overdue) ---
const created = Date.parse("2026-07-01T00:00:00Z");
const start = Date.parse("2026-08-01T00:00:00Z"); // 31 days later
const diff = start - created;

const sched = computeCampaignSchedule(
  { created_at: "2026-07-01T00:00:00Z", first_session_start: "2026-08-01T00:00:00Z" },
  { now: created }
);

// 4 touches, correct fire-times, none overdue.
assert.strictEqual(sched.touches.length, 4);
assert.strictEqual(sched.touches[0].touchNo, 1);
assert.strictEqual(sched.touches[0].fireAtMs, created + DAY, "touch1 = next day");
assert.strictEqual(sched.touches[1].fireAtMs, created + Math.round(diff / 2), "touch2 = midpoint");
assert.strictEqual(sched.touches[2].fireAtMs, start - 7 * DAY, "touch3 = 7d before");
assert.strictEqual(sched.touches[3].fireAtMs, start - 1 * DAY, "touch4 = 1d before");
sched.touches.forEach(function (t) {
  assert.strictEqual(t.skipped, false, "nothing overdue at booking time");
});

// balance auto-charge at start - 48h.
assert.strictEqual(sched.balanceChargeAt.fireAtMs, start - 48 * HOUR);
assert.strictEqual(sched.balanceChargeAt.skipped, false);

// reminders: every 6h after the auto-charge up to (not at) start => 7 of them.
assert.strictEqual(sched.reminders.length, 7);
assert.strictEqual(sched.reminders[0].fireAtMs, start - 42 * HOUR, "first reminder 6h after charge");
assert.strictEqual(
  sched.reminders[6].fireAtMs,
  start - 6 * HOUR,
  "last reminder 6h before start"
);
sched.reminders.forEach(function (r, i) {
  assert.strictEqual(r.reminderNo, i + 1);
  assert.strictEqual(r.kind, "payment_reminder");
});

// --- last-minute booking: SKIP overdue, do NOT bunch ---
// Booked 3h before start; evaluated at booking time.
const lmCreated = Date.parse("2026-07-31T21:00:00Z");
const lmStart = Date.parse("2026-08-01T00:00:00Z"); // 3h later
const lm = computeCampaignSchedule(
  { created_at: "2026-07-31T21:00:00Z", first_session_start: "2026-08-01T00:00:00Z" },
  { now: lmCreated }
);

// Still exactly 4 touches — overdue ones are flagged skipped, never collapsed.
assert.strictEqual(lm.touches.length, 4, "touch count unchanged — not bunched");

// touch3 (7d before) and touch4 (1d before) are in the past => skipped, and their
// raw fire-times are UNCHANGED (no forward bunching).
const t3 = lm.touches[2];
assert.strictEqual(t3.skipped, true, "7d-before touch is overdue => skipped");
assert.strictEqual(t3.fireAtMs, lmStart - 7 * DAY, "overdue touch keeps its raw past time");
const t4 = lm.touches[3];
assert.strictEqual(t4.skipped, true, "1d-before touch is overdue => skipped");

// touch2 (midpoint, +1.5h) is still in the future => NOT skipped.
assert.strictEqual(lm.touches[1].fireAtMs, lmCreated + Math.round((lmStart - lmCreated) / 2));
assert.strictEqual(lm.touches[1].skipped, false);

// The 40% auto-charge (start - 48h) is long past => skipped, not moved.
assert.strictEqual(lm.balanceChargeAt.skipped, true);
assert.strictEqual(lm.balanceChargeAt.fireAtMs, lmStart - 48 * HOUR);

// Every reminder window is already past for this booking => all skipped.
assert.ok(lm.reminders.length > 0, "reminder slots still computed");
lm.reminders.forEach(function (r) {
  assert.strictEqual(r.skipped, true, "all reminder slots overdue for a 3h-out booking");
});

// --- input guards ---
assert.throws(function () { computeCampaignSchedule({ first_session_start: "2026-08-01" }); }, /created_at/);
assert.throws(function () { computeCampaignSchedule({ created_at: "2026-07-01" }); }, /first_session_start/);
assert.throws(
  function () {
    computeCampaignSchedule({ created_at: "nope", first_session_start: "2026-08-01T00:00:00Z" });
  },
  /invalid created_at/
);

console.log("All campaign-schedule.test.js assertions passed.");
