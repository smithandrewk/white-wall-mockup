// api/_lib/campaign-schedule.js — PURE fire-time computation for V3 item 6:
// the 4-touch add-on email campaign + the deposit/balance reminder cadence.
// NEW file, no callers wired yet.
//
// Given a booking's created_at and its first session start, compute every
// fire-time the unified scheduler (api/_lib/scheduler-dispatch.js) will enqueue
// as scheduled_jobs rows. This module decides ONLY when things fire — it sends
// nothing and writes nothing.
//
// The 4 add-on campaign touches (plan impl-sketch):
//   touch 1 — next day (created_at + 24h)
//   touch 2 — 50% point between booking date and first start
//   touch 3 — 7 days before first start
//   touch 4 — 1 day before first start
//
// Balance machinery:
//   balanceChargeAt — first start − 48h (the 40% auto-charge; mirrors
//                     bookings.balance_charge_at).
//   reminders       — every 6h AFTER the auto-charge moment up to (but not at)
//                     the first start (Drew round-2: "payment-update reminder
//                     every 6h leading to start"). These chase an uncollected
//                     balance; the dispatcher only actually sends one if the
//                     balance is still owed.
//
// SKIP-OVERDUE RULE (documented default): a fire-time already in the past is
// SKIPPED (skipped:true), never bunched forward or merged into the next touch.
// This is what makes a last-minute booking degrade gracefully — several touches
// simply drop instead of all firing at once.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function toMs(value, label) {
  var ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (isNaN(ms)) {
    throw new Error("campaign-schedule: invalid " + label + ": " + value);
  }
  return ms;
}

// One fire-time descriptor. skipped is computed against `now` per the
// skip-overdue rule; the raw fireAt is always returned so the caller can log
// what WOULD have fired.
function mark(fireAtMs, nowMs, extra) {
  var d = {
    fireAt: new Date(fireAtMs).toISOString(),
    fireAtMs: fireAtMs,
    skipped: fireAtMs <= nowMs
  };
  if (extra) {
    for (var k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) d[k] = extra[k];
    }
  }
  return d;
}

// computeCampaignSchedule(booking, opts) — PURE.
// booking: { created_at, first_session_start }  (first_session_start | starts_at)
// opts:    { now, autochargeLeadHours=48, reminderIntervalHours=6 }
// Returns: { touches:[...4], balanceChargeAt:{...}, reminders:[...] }
function computeCampaignSchedule(booking, opts) {
  booking = booking || {};
  opts = opts || {};
  var now = typeof opts.now === "number" ? opts.now : Date.now();
  var leadHours = opts.autochargeLeadHours || 48;
  var intervalHours = opts.reminderIntervalHours || 6;

  if (!booking.created_at) throw new Error("campaign-schedule: created_at required");
  var startRaw = booking.first_session_start || booking.starts_at;
  if (!startRaw) throw new Error("campaign-schedule: first_session_start required");

  var createdMs = toMs(booking.created_at, "created_at");
  var startMs = toMs(startRaw, "first_session_start");

  // --- 4 add-on campaign touches ---
  var touches = [
    mark(createdMs + DAY_MS, now, { touchNo: 1, label: "next_day" }),
    mark(createdMs + Math.round((startMs - createdMs) / 2), now, {
      touchNo: 2,
      label: "midpoint"
    }),
    mark(startMs - 7 * DAY_MS, now, { touchNo: 3, label: "seven_days_before" }),
    mark(startMs - 1 * DAY_MS, now, { touchNo: 4, label: "one_day_before" })
  ];

  // --- 40% balance auto-charge ---
  var chargeMs = startMs - leadHours * HOUR_MS;
  var balanceChargeAt = mark(chargeMs, now, { kind: "balance_charge" });

  // --- every-6h reminders, from after the auto-charge up to first start ---
  var reminders = [];
  var stepMs = intervalHours * HOUR_MS;
  var n = 1;
  var t = chargeMs + stepMs;
  while (t < startMs) {
    reminders.push(mark(t, now, { kind: "payment_reminder", reminderNo: n }));
    n++;
    t += stepMs;
  }

  return {
    touches: touches,
    balanceChargeAt: balanceChargeAt,
    reminders: reminders
  };
}

module.exports = {
  computeCampaignSchedule: computeCampaignSchedule
};
