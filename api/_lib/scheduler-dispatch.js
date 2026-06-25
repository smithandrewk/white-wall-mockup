// api/_lib/scheduler-dispatch.js — THE UNIFIED DISPATCHER (V3 item 6).
//
// This is the SINGLE charging authority for the whole item-6 machine. pg_cron
// (migration 0006, dark) POSTs /api/scheduler-run every ~15 min; that endpoint
// authenticates the caller and calls dispatchTick() here. On each tick the
// dispatcher selects every due scheduled_jobs row (status='pending',
// fire_at <= now) and dispatches it by kind:
//   - 'balance_charge'   -> the 40% auto-charge, via api/_lib/balance-charge.js,
//                           with retry-x3-then-lockout per api/_lib/deposit-lockout.js
//   - 'campaign_touch'   -> one of the 4 add-on campaign emails (Resend)
//   - 'payment_reminder' -> the every-6h "update your payment" chase (Resend)
// There is deliberately NO /api/charge-balance endpoint — balance-charge.js is a
// LIBRARY this dispatcher calls. One charging authority, one pg_cron schedule.
//
// DARK DISCIPLINE (non-negotiable). TWO independent gates protect every money/
// email side effect, and both default OFF:
//   1. SCHEDULER_ARMED — the master switch. When it is not "1", dispatchTick is a
//      pure DRY-RUN: it SELECTS the due jobs and returns what it WOULD do, but
//      fires NO Square charge, NO Resend send, and makes NO DB write (no job
//      status change, no idempotency claim, no booking update). The default tick
//      is therefore observably inert.
//   2. the per-behavior flags — DEPOSIT_AUTOCHARGE_ARMED (Square charge, enforced
//      inside balance-charge.js), CAMPAIGN_SEND_ENABLED (campaign email),
//      REMINDERS_ENABLED (reminder email). Even with SCHEDULER_ARMED="1", a
//      behavior whose flag is OFF is a dry-run-within-armed: it logs, sends/charges
//      nothing, and LEAVES the job pending so nothing is lost when it is later
//      armed. Belt and suspenders: arming the clock alone moves no money.
//
// IDEMPOTENCY. Before any armed side effect the dispatcher CLAIMS the job's key in
// the public.idempotency_keys ledger (0003). A key already marked 'succeeded' (or
// 'in_flight' from an overlapping tick) is skipped — the single guard against a
// double-charge / double-send when pg_cron ticks overlap. A 'failed' key is
// re-acquired so the lockout retry can proceed; the Square idempotency_key
// (forwarded from balance-charge.js) is the hard backstop against an actual
// duplicate charge at Square's side.
//
// INVARIANTS preserved: lockout NEVER cancels the appointment (deposit-lockout.js
// is authoritative); the client is never trusted (the dispatcher only ever reads
// server-side rows keyed by service_role); no secrets here.

const sbDB = require("./supabase");
const {
  decideBalanceCharge,
  executeBalanceCharge
} = require("./balance-charge");
const { decideLockout } = require("./deposit-lockout");

const DEFAULT_LIMIT = 200;
const SITE_URL_DEFAULT = "https://whitewallstudios.co";

// ---------------------------------------------------------------------------
// Small DB helpers — all best-effort writes are wrapped so a single failed
// bookkeeping update can never wedge a tick (the idempotency ledger + job status
// converge on the next tick). Reads (selectDueJobs/loadBooking) are allowed to
// throw up to dispatchTick, which surfaces them.
// ---------------------------------------------------------------------------
async function selectDueJobs(db, nowMs, limit) {
  var nowIso = new Date(nowMs).toISOString();
  var q =
    "status=eq.pending" +
    "&fire_at=lte." + encodeURIComponent(nowIso) +
    "&order=fire_at.asc" +
    "&limit=" + (limit || DEFAULT_LIMIT);
  return await db.serviceSelect("scheduled_jobs", q);
}

async function loadBooking(db, bookingId) {
  var rows = await db.serviceSelect(
    "bookings",
    "id=eq." + encodeURIComponent(bookingId) + "&select=*"
  );
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function markJob(db, job, status, lastError, extra) {
  var patch = { status: status };
  if (lastError !== undefined && lastError !== null) {
    patch.last_error = String(lastError).slice(0, 500);
  }
  if (extra) Object.assign(patch, extra);
  try {
    await db.serviceUpdate("scheduled_jobs", { id: "eq." + job.id }, patch);
  } catch (e) {
    console.error("scheduler-dispatch: markJob failed", job.id, e.message);
  }
}

async function updateBooking(db, bookingId, patch) {
  try {
    await db.serviceUpdate("bookings", { id: "eq." + bookingId }, patch);
  } catch (e) {
    console.error("scheduler-dispatch: updateBooking failed", bookingId, e.message);
  }
}

async function recordPaymentEvent(db, bookingId, kind, amountCents, payment, status) {
  try {
    await db.serviceInsert("payment_events", {
      booking_id: bookingId,
      kind: kind,
      amount_cents: amountCents,
      square_payment_id: (payment && payment.id) || null,
      status: status,
      detail: payment ? { square_status: payment.status } : null
    });
  } catch (e) {
    console.error("scheduler-dispatch: recordPaymentEvent failed", bookingId, e.message);
  }
}

// Claim the idempotency ledger key BEFORE a side effect. Returns
// { claimed:true } when this tick owns the side effect, or { claimed:false,
// reason } when another tick already did it (or is doing it). A 'failed' key is
// re-acquired so a lockout retry may proceed.
async function claimIdempotency(db, opts) {
  try {
    await db.serviceInsert("idempotency_keys", {
      key: opts.key,
      scope: opts.scope,
      booking_id: opts.bookingId || null,
      scheduled_job_id: opts.jobId || null,
      status: "in_flight"
    });
    return { claimed: true, fresh: true };
  } catch (err) {
    var dup =
      err &&
      (err.status === 409 ||
        /duplicate|already exists|23505/i.test((err.message || "") + JSON.stringify(err.supabase || "")));
    if (!dup) throw err;
    var rows = await db.serviceSelect(
      "idempotency_keys",
      "key=eq." + encodeURIComponent(opts.key) + "&select=status"
    );
    var status = rows && rows[0] && rows[0].status;
    if (status === "succeeded") return { claimed: false, reason: "already-succeeded" };
    if (status === "in_flight") return { claimed: false, reason: "in-flight" };
    // 'failed' (or anything else): allow a retry, re-acquire the claim.
    try {
      await db.serviceUpdate("idempotency_keys", { key: "eq." + opts.key }, { status: "in_flight" });
    } catch (e) {
      /* best-effort */
    }
    return { claimed: true, retry: true };
  }
}

async function setLedgerStatus(db, key, status, result) {
  try {
    await db.serviceUpdate(
      "idempotency_keys",
      { key: "eq." + key },
      { status: status, result: result || null }
    );
  } catch (e) {
    console.error("scheduler-dispatch: setLedgerStatus failed", key, e.message);
  }
}

// ---------------------------------------------------------------------------
// Default Resend sender — gated by the CALLER (dispatch* checks the behavior
// flag before ever invoking this). Injectable for tests so no email is sent.
// ---------------------------------------------------------------------------
async function defaultSendEmail(payload) {
  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("scheduler-dispatch: RESEND_API_KEY unset, skipping send");
    return { sent: false, reason: "no-resend-key" };
  }
  var res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: payload.from || process.env.NOTIFICATION_FROM || "White Wall Studios <booking@whitewallstudios.co>",
      to: payload.to,
      subject: payload.subject,
      html: payload.html
    })
  });
  if (!res.ok) {
    var txt = await res.text();
    throw new Error("Resend " + res.status + ": " + txt);
  }
  return { sent: true };
}

function addonMenuUrl(baseUrl, booking) {
  return baseUrl + "/addon-menu?token=" + encodeURIComponent(booking.access_token || "");
}

function bookingEmail(booking) {
  return booking.email || booking.customer_email || null;
}

// A deposit booking still owes money only while its balance_status is one
// balance-charge.js would still act on AND a positive balance remains.
function balanceOwed(booking) {
  if (!booking || booking.payment_mode !== "deposit") return false;
  if (!(Number(booking.balance_due_cents) > 0)) return false;
  return booking.balance_status === "scheduled" || booking.balance_status === "failed";
}

// ---------------------------------------------------------------------------
// balance_charge dispatch
// ---------------------------------------------------------------------------
async function dispatchBalanceCharge(job, booking, ctx) {
  var db = ctx.db;
  var decision = decideBalanceCharge(booking, ctx.now);

  if (!decision.due) {
    // Nothing to collect (already charged / not owed / not yet due). Retire the
    // job only when armed; in dry-run we touch nothing.
    if (ctx.armed && decision.reason !== "not-yet-due") {
      await markJob(db, job, "done", "balance-not-due:" + decision.reason);
    }
    return {
      jobId: job.id, kind: "balance_charge", dryRun: !ctx.armed,
      charged: false, skipped: true, reason: decision.reason
    };
  }

  if (!ctx.armed) {
    return {
      jobId: job.id, kind: "balance_charge", dryRun: true,
      would: "charge", intent: decision.intent, idempotencyKey: decision.idempotencyKey
    };
  }

  // Armed: claim the ledger before charging.
  var claim = await claimIdempotency(db, {
    key: decision.idempotencyKey, scope: "balance_charge",
    bookingId: booking.id, jobId: job.id
  });
  if (!claim.claimed) {
    await markJob(db, job, "done", "idempotent:" + claim.reason);
    return { jobId: job.id, kind: "balance_charge", charged: false, skipped: true, reason: "idempotent:" + claim.reason };
  }

  var result;
  try {
    // executeBalanceCharge enforces DEPOSIT_AUTOCHARGE_ARMED internally: with that
    // flag OFF it returns { dryRun:true } and makes NO Square charge.
    result = await executeBalanceCharge(booking, {
      now: ctx.now, env: ctx.env, chargeCardOnFile: ctx.chargeCardOnFile
    });
  } catch (err) {
    return await handleChargeFailure(job, booking, ctx, decision, err);
  }

  if (result && result.dryRun) {
    // SCHEDULER_ARMED on but DEPOSIT_AUTOCHARGE_ARMED off. Release the claim so a
    // later (fully armed) tick can re-acquire, and LEAVE the job pending.
    await setLedgerStatus(db, decision.idempotencyKey, "failed", { reason: "autocharge-disarmed" });
    return { jobId: job.id, kind: "balance_charge", charged: false, dryRun: true, reason: "autocharge-disarmed", intent: result.intent };
  }

  // Charged for real.
  await setLedgerStatus(db, decision.idempotencyKey, "succeeded", { payment_id: result.payment && result.payment.id });
  await markJob(db, job, "done", null, { attempts: (job.attempts || 0) + 1 });
  await updateBooking(db, booking.id, { balance_status: "charged" });
  await recordPaymentEvent(db, booking.id, "balance", decision.intent.amountCents, result.payment, "succeeded");
  return {
    jobId: job.id, kind: "balance_charge", charged: true,
    amountCents: decision.intent.amountCents, payment: result.payment
  };
}

// Classify a Square failure into a retryable outcome for deposit-lockout.js.
function classifyOutcome(err) {
  var m = ((err && err.message) || "").toLowerCase();
  if (/declin/.test(m)) return "declined";
  if (/expir/.test(m)) return "expired";
  return "error";
}

async function handleChargeFailure(job, booking, ctx, decision, err) {
  var db = ctx.db;
  var outcome = classifyOutcome(err);
  var attempts = (job.attempts || 0) + 1; // include the attempt that just failed

  // The ledger row was claimed but the charge did not collect -> mark 'failed' so
  // a later tick can re-acquire and retry.
  await setLedgerStatus(db, decision.idempotencyKey, "failed", { outcome: outcome, error: (err && err.message) || String(err) });

  var lock = decideLockout(
    { attempts: attempts, lastOutcome: outcome, booking: booking },
    { studioEmail: ctx.studioEmail, drewHandle: ctx.drewHandle }
  );

  if (lock.action === "retry") {
    // Re-queue: keep the job pending, bump attempts, mark the balance 'failed'
    // (still chargeable per balance-charge.js CHARGEABLE_STATUSES).
    await markJob(db, job, "pending", outcome + ": " + ((err && err.message) || ""), { attempts: attempts });
    await updateBooking(db, booking.id, { balance_status: "failed" });
    return {
      jobId: job.id, kind: "balance_charge", charged: false, retry: true,
      outcome: outcome, nextAttemptNo: lock.nextAttemptNo, attemptsRemaining: lock.attemptsRemaining
    };
  }

  // Lockout: NEVER cancel the appointment. Fan out the chase (gated), park the job.
  await markJob(db, job, "failed", outcome + " (locked out): " + ((err && err.message) || ""), { attempts: attempts });
  await updateBooking(db, booking.id, { balance_status: "failed" });
  var fired = await fireLockoutFanout(lock.fanout, ctx, booking);
  return {
    jobId: job.id, kind: "balance_charge", charged: false, lockout: true,
    cancelAppointment: false, outcome: outcome, fanout: fired
  };
}

// Execute the lockout fan-out descriptors. The internal studio alert fires when
// armed (operational, safe); the customer-facing "update your card" email fires
// only when armed AND REMINDERS_ENABLED==="1"; Watson/profile descriptors are
// returned as intents (not wired here). NEVER cancels — descriptors carry
// never_cancel:true straight from deposit-lockout.js.
async function fireLockoutFanout(fanout, ctx, booking) {
  var out = [];
  for (var i = 0; i < fanout.length; i++) {
    var d = fanout[i];
    if (!ctx.armed) { out.push({ channel: d.channel, dryRun: true }); continue; }
    try {
      if (d.channel === "alert_studio_email") {
        await ctx.alert("warning", "WWS balance auto-charge locked out", {
          bookingId: d.bookingId, amountCents: d.amountCents, never_cancel: true
        });
        out.push({ channel: d.channel, sent: true });
      } else if (d.channel === "email_customer" && d.to && ctx.env.REMINDERS_ENABLED === "1") {
        await ctx.sendEmail({
          to: d.to,
          subject: "Action needed: update your card for your White Wall session",
          html:
            "<p>We were unable to collect the remaining balance for your booking." +
            " Please update your card or settle the balance from your account:" +
            " <a href=\"" + ctx.baseUrl + "/account\">" + ctx.baseUrl + "/account</a></p>"
        });
        out.push({ channel: d.channel, sent: true });
      } else {
        out.push({ channel: d.channel, sent: false, reason: "not-wired-or-flag-off" });
      }
    } catch (e) {
      out.push({ channel: d.channel, error: e.message });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// campaign_touch dispatch (Resend, gated by CAMPAIGN_SEND_ENABLED)
// ---------------------------------------------------------------------------
async function dispatchCampaignTouch(job, booking, ctx) {
  var db = ctx.db;
  var to = bookingEmail(booking);
  var touchNo = (job.payload && job.payload.touch_no) || null;

  if (!ctx.armed) {
    return { jobId: job.id, kind: "campaign_touch", dryRun: true, would: "send", to: to, touchNo: touchNo };
  }
  if (ctx.env.CAMPAIGN_SEND_ENABLED !== "1") {
    // Dry-run-within-armed: send nothing, leave the job pending.
    return { jobId: job.id, kind: "campaign_touch", dryRun: true, reason: "campaign-send-disabled", to: to, touchNo: touchNo };
  }
  if (!to) {
    await markJob(db, job, "skipped", "no-recipient");
    return { jobId: job.id, kind: "campaign_touch", sent: false, skipped: true, reason: "no-recipient" };
  }

  var claim = await claimIdempotency(db, {
    key: job.idempotency_key, scope: "campaign_send", bookingId: booking.id, jobId: job.id
  });
  if (!claim.claimed) {
    await markJob(db, job, "done", "idempotent:" + claim.reason);
    return { jobId: job.id, kind: "campaign_touch", sent: false, skipped: true, reason: "idempotent:" + claim.reason };
  }

  try {
    await ctx.sendEmail({
      to: to,
      subject: "Make the most of your White Wall session",
      html:
        "<p>Add lighting, backdrops, and more to your upcoming session in one click:" +
        " <a href=\"" + addonMenuUrl(ctx.baseUrl, booking) + "\">view add-ons</a>.</p>"
    });
  } catch (err) {
    await setLedgerStatus(db, job.idempotency_key, "failed", { error: err.message });
    await markJob(db, job, "pending", "send-failed: " + err.message, { attempts: (job.attempts || 0) + 1 });
    return { jobId: job.id, kind: "campaign_touch", sent: false, retry: true, error: err.message };
  }

  await setLedgerStatus(db, job.idempotency_key, "succeeded", null);
  await markJob(db, job, "done", null, { attempts: (job.attempts || 0) + 1 });
  // Best-effort campaign rollup bump.
  if (job.payload && job.payload.enrollment_id) {
    try {
      await db.serviceUpdate(
        "campaign_enrollments",
        { id: "eq." + job.payload.enrollment_id },
        { last_touch_no: touchNo, last_touch_at: new Date(ctx.now).toISOString() }
      );
    } catch (e) { /* best-effort */ }
  }
  return { jobId: job.id, kind: "campaign_touch", sent: true, to: to, touchNo: touchNo };
}

// ---------------------------------------------------------------------------
// payment_reminder dispatch (Resend, gated by REMINDERS_ENABLED). The cadence
// chases an UNCOLLECTED balance, so it stops the moment the balance is settled.
// ---------------------------------------------------------------------------
async function dispatchPaymentReminder(job, booking, ctx) {
  var db = ctx.db;
  var to = bookingEmail(booking);
  var reminderNo = (job.payload && job.payload.reminder_no) || null;

  if (!ctx.armed) {
    return { jobId: job.id, kind: "payment_reminder", dryRun: true, would: "send", to: to, reminderNo: reminderNo };
  }
  if (ctx.env.REMINDERS_ENABLED !== "1") {
    return { jobId: job.id, kind: "payment_reminder", dryRun: true, reason: "reminders-disabled", to: to, reminderNo: reminderNo };
  }

  // Stop the cadence if the balance is no longer owed.
  if (!balanceOwed(booking)) {
    await markJob(db, job, "done", "balance-settled");
    try {
      await db.serviceUpdate(
        "balance_reminder_state",
        { booking_id: "eq." + booking.id },
        { stopped_at: new Date(ctx.now).toISOString(), stop_reason: "balance_paid" }
      );
    } catch (e) { /* best-effort */ }
    return { jobId: job.id, kind: "payment_reminder", sent: false, skipped: true, reason: "balance-settled" };
  }
  if (!to) {
    await markJob(db, job, "skipped", "no-recipient");
    return { jobId: job.id, kind: "payment_reminder", sent: false, skipped: true, reason: "no-recipient" };
  }

  var claim = await claimIdempotency(db, {
    key: job.idempotency_key, scope: "reminder_send", bookingId: booking.id, jobId: job.id
  });
  if (!claim.claimed) {
    await markJob(db, job, "done", "idempotent:" + claim.reason);
    return { jobId: job.id, kind: "payment_reminder", sent: false, skipped: true, reason: "idempotent:" + claim.reason };
  }

  try {
    await ctx.sendEmail({
      to: to,
      subject: "Reminder: settle the balance for your White Wall session",
      html:
        "<p>Your session is coming up and a balance remains. Update your card or pay now" +
        " from your account: <a href=\"" + ctx.baseUrl + "/account\">" + ctx.baseUrl + "/account</a>.</p>"
    });
  } catch (err) {
    await setLedgerStatus(db, job.idempotency_key, "failed", { error: err.message });
    await markJob(db, job, "pending", "send-failed: " + err.message, { attempts: (job.attempts || 0) + 1 });
    return { jobId: job.id, kind: "payment_reminder", sent: false, retry: true, error: err.message };
  }

  await setLedgerStatus(db, job.idempotency_key, "succeeded", null);
  await markJob(db, job, "done", null, { attempts: (job.attempts || 0) + 1 });
  try {
    await db.serviceUpdate(
      "balance_reminder_state",
      { booking_id: "eq." + booking.id },
      { last_reminder_at: new Date(ctx.now).toISOString() }
    );
  } catch (e) { /* best-effort */ }
  return { jobId: job.id, kind: "payment_reminder", sent: true, to: to, reminderNo: reminderNo };
}

// ---------------------------------------------------------------------------
// per-job router
// ---------------------------------------------------------------------------
async function dispatchJob(job, ctx) {
  var booking = await loadBooking(ctx.db, job.booking_id);
  if (!booking) {
    if (ctx.armed) await markJob(ctx.db, job, "failed", "booking-not-found");
    return { jobId: job.id, kind: job.kind, skipped: true, reason: "no-booking" };
  }
  switch (job.kind) {
    case "balance_charge":   return await dispatchBalanceCharge(job, booking, ctx);
    case "campaign_touch":   return await dispatchCampaignTouch(job, booking, ctx);
    case "payment_reminder": return await dispatchPaymentReminder(job, booking, ctx);
    default:
      return { jobId: job.id, kind: job.kind, skipped: true, reason: "unknown-kind" };
  }
}

function summarize(dispatched) {
  var s = { charged: 0, sent: 0, retried: 0, lockedOut: 0, skipped: 0, dryRun: 0, errors: 0 };
  dispatched.forEach(function (r) {
    if (r.error) s.errors++;
    if (r.charged) s.charged++;
    if (r.sent) s.sent++;
    if (r.retry) s.retried++;
    if (r.lockout) s.lockedOut++;
    if (r.skipped) s.skipped++;
    if (r.dryRun) s.dryRun++;
  });
  return s;
}

// dispatchTick(opts) — the one entry point /api/scheduler-run calls.
// opts: { now, env, db, limit, chargeCardOnFile, sendEmail, alert,
//         studioEmail, drewHandle, baseUrl }  (all injectable for tests)
async function dispatchTick(opts) {
  opts = opts || {};
  var now = typeof opts.now === "number" ? opts.now : Date.now();
  var env = opts.env || process.env;
  var db = opts.db || sbDB;
  var armed = env.SCHEDULER_ARMED === "1";

  var ctx = {
    now: now,
    env: env,
    db: db,
    armed: armed,
    chargeCardOnFile: opts.chargeCardOnFile, // forwarded to balance-charge.js (defaults there)
    sendEmail: opts.sendEmail || defaultSendEmail,
    alert: opts.alert || require("./alert").alertFailure,
    studioEmail: opts.studioEmail || env.STUDIO_EMAIL || env.NOTIFICATION_EMAIL || null,
    drewHandle: opts.drewHandle || env.OWNER_PHONE || null,
    baseUrl: opts.baseUrl || env.SITE_URL || SITE_URL_DEFAULT
  };

  var jobs = await selectDueJobs(db, now, opts.limit);

  var dispatched = [];
  for (var i = 0; i < jobs.length; i++) {
    var r;
    try {
      r = await dispatchJob(jobs[i], ctx);
    } catch (e) {
      console.error("scheduler-dispatch: job error", jobs[i] && jobs[i].id, e.message);
      r = { jobId: jobs[i] && jobs[i].id, kind: jobs[i] && jobs[i].kind, error: e.message };
    }
    dispatched.push(r);
  }

  return {
    armed: armed,
    dryRun: !armed,
    due: jobs.length,
    dispatched: dispatched,
    summary: summarize(dispatched)
  };
}

module.exports = {
  dispatchTick: dispatchTick,
  // exported for unit tests / reuse
  claimIdempotency: claimIdempotency,
  classifyOutcome: classifyOutcome,
  balanceOwed: balanceOwed,
  summarize: summarize
};
