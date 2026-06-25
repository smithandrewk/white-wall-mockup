// api/_lib/campaign-enroll.test.js — standalone (node api/_lib/campaign-enroll.test.js).
//
// Proves the item-6 enrollment library:
//   1. DARK: flag OFF => dry-run, ZERO DB writes (the default; this is what keeps
//      create-checkout byte-identical to today).
//   2. Deposit booking (flag ON) => 1 enrollment + 4 campaign touches + 1
//      balance_charge + N reminders; all kinds present; idempotency keys unique.
//   3. Full-payment booking => ONLY the 4 add-on campaign touches (no
//      balance_charge, no reminders — nothing is owed).
//   4. Idempotent: an already-enrolled booking is a no-op (no inserts).
//   5. Skip-overdue: a last-minute booking enqueues overdue jobs as status
//      'skipped' (never 'pending'), and never bunches them forward.

const assert = require("assert");
const {
  planEnrollment,
  buildJobRows,
  enrollBooking,
  jobIdempotencyKey
} = require("./campaign-enroll");

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

// ---- fake db (captures inserts; configurable existing-enrollment) -----------
function makeDB(opts) {
  opts = opts || {};
  var captured = { inserts: [], selects: [] };
  return {
    captured: captured,
    serviceSelect: async function (table, query) {
      captured.selects.push({ table: table, query: query });
      if (table === "campaign_enrollments" && opts.existingEnrollment) {
        return [{ id: "enrollment_existing" }];
      }
      return [];
    },
    serviceInsert: async function (table, rows) {
      captured.inserts.push({ table: table, rows: rows });
      if (table === "campaign_enrollments") return [{ id: "enrollment_new_1" }];
      return Array.isArray(rows) ? rows : [rows];
    }
  };
}

function depositBooking() {
  return {
    id: "booking_dep_1",
    created_at: "2026-07-01T00:00:00Z",
    first_session_start: "2026-08-01T00:00:00Z", // 31 days out
    payment_mode: "deposit",
    balance_due_cents: 40000,
    balance_charge_at: "2026-07-30T00:00:00Z"
  };
}
function fullBooking() {
  return {
    id: "booking_full_1",
    created_at: "2026-07-01T00:00:00Z",
    starts_at: "2026-08-01T00:00:00Z",
    payment_mode: "full",
    balance_due_cents: null
  };
}

const created = Date.parse("2026-07-01T00:00:00Z");

async function run() {
  var passed = 0;

  // ---- Test 1: DARK — flag OFF => dry-run, zero writes ----------------------
  {
    var db = makeDB();
    var res = await enrollBooking(depositBooking(), { now: created, env: {}, db: db });
    assert.strictEqual(res.dryRun, true, "T1: flag off => dryRun");
    assert.strictEqual(res.enrolled, false, "T1: nothing enrolled");
    assert.strictEqual(db.captured.inserts.length, 0, "T1: ZERO inserts when disarmed");
    assert.strictEqual(db.captured.selects.length, 0, "T1: no DB reads when disarmed");
    assert.ok(res.plan, "T1: returns the plan it WOULD have inserted");
    passed++; console.log("ok 1 - flag OFF: dry-run, zero DB writes");
  }

  // ---- Test 2: deposit booking enrolled (flag ON) --------------------------
  {
    var db2 = makeDB();
    var res2 = await enrollBooking(depositBooking(), {
      now: created,
      env: { CAMPAIGN_ENROLL_ENABLED: "1" },
      db: db2
    });
    assert.strictEqual(res2.enrolled, true, "T2: enrolled");
    assert.strictEqual(res2.enrollmentId, "enrollment_new_1", "T2: enrollment id returned");

    var enrollIns = db2.captured.inserts.filter(function (i) { return i.table === "campaign_enrollments"; });
    assert.strictEqual(enrollIns.length, 1, "T2: exactly ONE campaign_enrollments row");

    var jobIns = db2.captured.inserts.filter(function (i) { return i.table === "scheduled_jobs"; });
    assert.strictEqual(jobIns.length, 1, "T2: scheduled_jobs inserted in one batch");
    var jobs = jobIns[0].rows;
    var touches = jobs.filter(function (j) { return j.kind === "campaign_touch"; });
    var balance = jobs.filter(function (j) { return j.kind === "balance_charge"; });
    var reminders = jobs.filter(function (j) { return j.kind === "payment_reminder"; });
    assert.strictEqual(touches.length, 4, "T2: 4 campaign touches");
    assert.strictEqual(balance.length, 1, "T2: 1 balance_charge (deposit)");
    assert.strictEqual(reminders.length, 7, "T2: 7 reminders (every 6h, 48h->start)");
    assert.strictEqual(res2.jobsInserted, jobs.length, "T2: jobsInserted matches");

    // Touches link to the enrollment.
    touches.forEach(function (t) {
      assert.strictEqual(t.payload.enrollment_id, "enrollment_new_1", "T2: touch links enrollment");
    });
    // Balance wake-up fires 48h before start; healthy booking => pending.
    assert.strictEqual(
      balance[0].fire_at,
      new Date(Date.parse("2026-08-01T00:00:00Z") - 48 * HOUR).toISOString(),
      "T2: balance wake-up = first start - 48h"
    );
    assert.strictEqual(balance[0].status, "pending", "T2: balance pending for healthy booking");

    // Every idempotency key is unique and 45 chars.
    var keys = jobs.map(function (j) { return j.idempotency_key; });
    keys.forEach(function (k) { assert.strictEqual(k.length, 45, "T2: key truncated to 45"); });
    assert.strictEqual(new Set(keys).size, keys.length, "T2: all idempotency keys unique");
    // Stable: recomputing yields the same key.
    assert.strictEqual(
      balance[0].idempotency_key,
      jobIdempotencyKey("balance_charge", "booking_dep_1", "balance"),
      "T2: balance key is stable/deterministic"
    );
    passed++; console.log("ok 2 - deposit booking: enrollment + 4 touches + balance + 7 reminders, unique keys");
  }

  // ---- Test 3: full-payment booking => touches only ------------------------
  {
    var db3 = makeDB();
    var res3 = await enrollBooking(fullBooking(), {
      now: created,
      env: { CAMPAIGN_ENROLL_ENABLED: "1" },
      db: db3
    });
    assert.strictEqual(res3.enrolled, true, "T3: enrolled");
    var jobs3 = db3.captured.inserts.filter(function (i) { return i.table === "scheduled_jobs"; })[0].rows;
    assert.strictEqual(jobs3.length, 4, "T3: only the 4 campaign touches");
    assert.ok(jobs3.every(function (j) { return j.kind === "campaign_touch"; }), "T3: no balance/reminder jobs on a full-payment booking");
    assert.strictEqual(res3.breakdown.balanceCharge, 0, "T3: breakdown shows no balance");
    assert.strictEqual(res3.breakdown.reminders, 0, "T3: breakdown shows no reminders");
    passed++; console.log("ok 3 - full-payment booking: 4 touches only, no balance/reminders");
  }

  // ---- Test 4: idempotent — already enrolled => no-op ----------------------
  {
    var db4 = makeDB({ existingEnrollment: true });
    var res4 = await enrollBooking(depositBooking(), {
      now: created,
      env: { CAMPAIGN_ENROLL_ENABLED: "1" },
      db: db4
    });
    assert.strictEqual(res4.enrolled, false, "T4: not re-enrolled");
    assert.strictEqual(res4.reason, "already-enrolled", "T4: reason");
    assert.strictEqual(res4.enrollmentId, "enrollment_existing", "T4: returns existing id");
    assert.strictEqual(db4.captured.inserts.length, 0, "T4: ZERO inserts on re-enroll");
    passed++; console.log("ok 4 - idempotent: already-enrolled booking is a no-op");
  }

  // ---- Test 5: skip-overdue — last-minute booking --------------------------
  {
    // Booked 3h before start, evaluated AT booking time. 7d/1d touches, the
    // balance wake-up (48h out), and every reminder are all in the past.
    var lm = {
      id: "booking_lastminute_1",
      created_at: "2026-07-31T21:00:00Z",
      first_session_start: "2026-08-01T00:00:00Z",
      payment_mode: "deposit",
      balance_due_cents: 40000
    };
    var lmCreated = Date.parse("2026-07-31T21:00:00Z");
    var db5 = makeDB();
    await enrollBooking(lm, {
      now: lmCreated,
      env: { CAMPAIGN_ENROLL_ENABLED: "1" },
      db: db5
    });
    var jobs5 = db5.captured.inserts.filter(function (i) { return i.table === "scheduled_jobs"; })[0].rows;
    var balance5 = jobs5.filter(function (j) { return j.kind === "balance_charge"; })[0];
    assert.strictEqual(balance5.status, "skipped", "T5: overdue balance wake-up => skipped, not pending");
    // Overdue 7d-before touch is skipped and keeps its raw past time (no bunching).
    var sevenDay = jobs5.filter(function (j) {
      return j.kind === "campaign_touch" && j.payload.touch_no === 3;
    })[0];
    assert.strictEqual(sevenDay.status, "skipped", "T5: 7d touch overdue => skipped");
    assert.strictEqual(
      sevenDay.fire_at,
      new Date(Date.parse("2026-08-01T00:00:00Z") - 7 * DAY).toISOString(),
      "T5: overdue touch keeps its raw past fire_at (not bunched forward)"
    );
    // No 'pending' reminder should exist for a 3h-out booking.
    var pendingReminders = jobs5.filter(function (j) {
      return j.kind === "payment_reminder" && j.status === "pending";
    });
    assert.strictEqual(pendingReminders.length, 0, "T5: all reminders overdue => none pending");
    passed++; console.log("ok 5 - skip-overdue: overdue jobs status=skipped, raw times kept");
  }

  // ---- pure-fn guards ------------------------------------------------------
  assert.throws(function () { planEnrollment({ first_session_start: "x" }); }, /booking.id required/);
  assert.throws(function () { planEnrollment({ id: "b" }); }, /first_session_start/);

  console.log("\nAll " + passed + " campaign-enroll assertions passed.");
}

run().catch(function (e) {
  console.error("FAILED:", (e && e.stack) || e);
  process.exit(1);
});
