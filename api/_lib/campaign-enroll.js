// api/_lib/campaign-enroll.js — V3 item 6 enrollment.
//
// Given a freshly-created, paid booking, enqueue the scheduled_jobs rows that
// the unified dispatcher (/api/scheduler-run, api/_lib/scheduler-dispatch.js)
// will later act on:
//   - the 4 add-on campaign touches            (kind='campaign_touch')
//   - the 40% balance auto-charge wake-up       (kind='balance_charge')  [deposit only]
//   - the every-6h payment-update reminders     (kind='payment_reminder')[deposit only]
// plus the campaign_enrollments rollup row. Fire-times come straight from the
// PURE api/_lib/campaign-schedule.js — this module decides WHICH jobs to enqueue
// and writes them; it computes no times itself.
//
// DARK DISCIPLINE (non-negotiable): enrollBooking writes NOTHING unless
// CAMPAIGN_ENROLL_ENABLED === "1". With the flag off (the default) it is a
// dry-run: it returns the plan it WOULD have inserted ({ dryRun:true }) and
// touches no DB row. The create-checkout wiring ALSO gates on the same flag, so
// with the flag off the booking flow is byte-identical to today (this is never
// even called). Belt and suspenders.
//
// IDEMPOTENT: enrollment is keyed on (booking_id, campaign) — a re-enroll of an
// already-enrolled booking is a no-op (pre-checked via the campaign_enrollments
// row; the unique (booking_id,campaign) index in 0003 is the DB-level backstop).
// Each scheduled_jobs row also carries a stable sha256-truncated-to-45
// idempotency_key (matching the create-checkout / square charge convention) so a
// partial re-enqueue can't duplicate a job either (scheduled_jobs unique index on
// idempotency_key, 0003).
//
// SKIP-OVERDUE: campaign-schedule flags a fire-time already in the past as
// skipped; we persist those as status='skipped' (never 'pending', so the
// dispatcher's due-index — WHERE status='pending' — never picks them up) rather
// than bunching them forward. A last-minute booking degrades gracefully.

const crypto = require("crypto");
const { computeCampaignSchedule } = require("./campaign-schedule");
const sbDB = require("./supabase");

const CAMPAIGN = "addon_4touch";

// Stable per-job dedupe key. sha256 over kind|bookingId|discriminator, truncated
// to 45 (Square's idempotency cap; still ~180 bits) — same convention used for
// the Square charge idempotency key in create-checkout / balance-charge.
function jobIdempotencyKey(kind, bookingId, discriminator) {
  return crypto
    .createHash("sha256")
    .update("job|" + kind + "|" + bookingId + "|" + discriminator)
    .digest("hex")
    .slice(0, 45);
}

function firstStartOf(booking) {
  return booking.first_session_start || booking.starts_at || null;
}

// planEnrollment(booking, opts) — PURE. Decides which jobs this booking gets and
// resolves their fire-times via campaign-schedule. Returns a descriptor; writes
// nothing. A deposit booking with a positive balance also gets the balance
// auto-charge wake-up + the 6h reminders; a full-payment booking gets only the 4
// add-on campaign touches.
//   booking: { id, created_at, first_session_start|starts_at,
//              payment_mode, balance_due_cents, balance_charge_at }
//   opts:    { now, autochargeLeadHours, reminderIntervalHours }
function planEnrollment(booking, opts) {
  booking = booking || {};
  opts = opts || {};
  if (!booking.id) throw new Error("campaign-enroll: booking.id required");
  var firstStart = firstStartOf(booking);
  if (!firstStart) {
    throw new Error("campaign-enroll: first_session_start (or starts_at) required");
  }
  // created_at defaults to "now" so a representation that omitted it still works.
  var createdAt =
    booking.created_at || new Date(typeof opts.now === "number" ? opts.now : Date.now()).toISOString();

  var sched = computeCampaignSchedule(
    { created_at: createdAt, first_session_start: firstStart },
    opts
  );

  var isDeposit =
    booking.payment_mode === "deposit" && Number(booking.balance_due_cents) > 0;

  return {
    bookingId: booking.id,
    campaign: CAMPAIGN,
    isDeposit: isDeposit,
    touches: sched.touches,
    balanceChargeAt: isDeposit ? sched.balanceChargeAt : null,
    reminders: isDeposit ? sched.reminders : []
  };
}

// buildJobRows(plan, enrollmentId) — PURE. Maps a plan descriptor into
// scheduled_jobs row objects ready for insert. enrollmentId links the campaign
// touches back to their campaign_enrollments rollup.
function buildJobRows(plan, enrollmentId) {
  var rows = [];

  plan.touches.forEach(function (t) {
    rows.push({
      booking_id: plan.bookingId,
      kind: "campaign_touch",
      fire_at: t.fireAt,
      status: t.skipped ? "skipped" : "pending",
      idempotency_key: jobIdempotencyKey("campaign_touch", plan.bookingId, "touch" + t.touchNo),
      payload: { enrollment_id: enrollmentId || null, touch_no: t.touchNo, label: t.label }
    });
  });

  if (plan.balanceChargeAt) {
    var b = plan.balanceChargeAt;
    rows.push({
      booking_id: plan.bookingId,
      kind: "balance_charge",
      fire_at: b.fireAt,
      status: b.skipped ? "skipped" : "pending",
      idempotency_key: jobIdempotencyKey("balance_charge", plan.bookingId, "balance"),
      payload: { kind: "balance_charge" }
    });
  }

  plan.reminders.forEach(function (r) {
    rows.push({
      booking_id: plan.bookingId,
      kind: "payment_reminder",
      fire_at: r.fireAt,
      status: r.skipped ? "skipped" : "pending",
      idempotency_key: jobIdempotencyKey("payment_reminder", plan.bookingId, "reminder" + r.reminderNo),
      payload: { reminder_no: r.reminderNo }
    });
  });

  return rows;
}

// enrollBooking(booking, opts) — async IO. The one entry point create-checkout
// calls. opts: { now, env, db, autochargeLeadHours, reminderIntervalHours }
// (env/db injectable for tests). Returns:
//   { enrolled:false, dryRun:true, reason:'disarmed', plan }        (flag OFF — DARK)
//   { enrolled:false, reason:'already-enrolled', enrollmentId }     (idempotent no-op)
//   { enrolled:true,  enrollmentId, jobsInserted, breakdown }
async function enrollBooking(booking, opts) {
  opts = opts || {};
  var env = opts.env || process.env;
  var db = opts.db || sbDB;

  var plan = planEnrollment(booking, opts);

  var breakdown = {
    touches: plan.touches.length,
    balanceCharge: plan.balanceChargeAt ? 1 : 0,
    reminders: plan.reminders.length
  };

  // DARK GATE: write nothing unless explicitly armed.
  if (env.CAMPAIGN_ENROLL_ENABLED !== "1") {
    return { enrolled: false, dryRun: true, reason: "disarmed", plan: plan, breakdown: breakdown };
  }

  // Idempotency pre-check: an existing enrollment for this booking+campaign is a
  // no-op (the unique (booking_id,campaign) index is the DB-level backstop).
  var existing = await db.serviceSelect(
    "campaign_enrollments",
    "booking_id=eq." + encodeURIComponent(plan.bookingId) +
      "&campaign=eq." + encodeURIComponent(plan.campaign) +
      "&select=id"
  );
  if (Array.isArray(existing) && existing.length > 0) {
    return { enrolled: false, reason: "already-enrolled", enrollmentId: existing[0].id };
  }

  // 1. The campaign rollup row.
  var enrollRows = await db.serviceInsert("campaign_enrollments", {
    booking_id: plan.bookingId,
    campaign: plan.campaign,
    touches_total: plan.touches.length
  });
  var enrollRow = Array.isArray(enrollRows) ? enrollRows[0] : enrollRows;
  var enrollmentId = enrollRow && enrollRow.id;

  // 2. The scheduled_jobs rows (touches + balance + reminders).
  var jobRows = buildJobRows(plan, enrollmentId);
  if (jobRows.length > 0) {
    await db.serviceInsert("scheduled_jobs", jobRows);
  }

  return {
    enrolled: true,
    enrollmentId: enrollmentId,
    jobsInserted: jobRows.length,
    breakdown: breakdown
  };
}

module.exports = {
  CAMPAIGN: CAMPAIGN,
  jobIdempotencyKey: jobIdempotencyKey,
  planEnrollment: planEnrollment,
  buildJobRows: buildJobRows,
  enrollBooking: enrollBooking
};
