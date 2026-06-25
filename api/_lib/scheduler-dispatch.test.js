// api/_lib/scheduler-dispatch.test.js — standalone (node api/_lib/scheduler-dispatch.test.js).
//
// Proves the unified dispatcher (the single charging authority):
//   1. DARK: SCHEDULER_ARMED off => pure dry-run. Due jobs are SELECTED but NO
//      charge fn, NO send fn, and ZERO DB writes (no claim, no status change).
//   2. ARMED balance_charge due => charge fires exactly once; job->done; ledger
//      ->succeeded; booking balance_status->charged.
//   3. Belt-and-suspenders: SCHEDULER_ARMED on but DEPOSIT_AUTOCHARGE_ARMED off
//      => NO Square charge (balance-charge.js dry-run), job left pending.
//   4. Retry then lockout-after-3: a declining card retries while attempts<3,
//      then locks out at the 3rd (job->failed, booking->failed, NEVER cancelled).
//   5. Idempotency: a job whose key is already 'succeeded' makes NO charge.
//   6. Campaign touch: armed + CAMPAIGN_SEND_ENABLED off => no send (dry-run);
//      flag on => exactly one send.

const assert = require("assert");
const { dispatchTick } = require("./scheduler-dispatch");

const NOW = Date.parse("2026-07-10T12:00:00Z");

// ---- fake db -----------------------------------------------------------------
// Captures inserts/updates; serves configurable rows for selects. Idempotency
// inserts can be made to conflict (simulating an existing ledger row).
function makeDB(opts) {
  opts = opts || {};
  var captured = { inserts: [], updates: [], selects: [] };
  var jobs = opts.jobs || [];
  var bookingsById = opts.bookingsById || {};
  var idempotencyRows = opts.idempotencyRows || {}; // key -> { status }

  return {
    captured: captured,
    serviceSelect: async function (table, query) {
      captured.selects.push({ table: table, query: query });
      if (table === "scheduled_jobs") return jobs.slice();
      if (table === "bookings") {
        var m = /id=eq\.([^&]+)/.exec(query);
        var id = m ? decodeURIComponent(m[1]) : null;
        return bookingsById[id] ? [bookingsById[id]] : [];
      }
      if (table === "idempotency_keys") {
        var km = /key=eq\.([^&]+)/.exec(query);
        var key = km ? decodeURIComponent(km[1]) : null;
        return idempotencyRows[key] ? [idempotencyRows[key]] : [];
      }
      return [];
    },
    serviceInsert: async function (table, rows) {
      if (table === "idempotency_keys") {
        var key = rows.key;
        if (idempotencyRows[key]) {
          var err = new Error("duplicate key value violates unique constraint");
          err.status = 409;
          throw err;
        }
        idempotencyRows[key] = { status: rows.status };
      }
      captured.inserts.push({ table: table, rows: rows });
      return Array.isArray(rows) ? rows : [rows];
    },
    serviceUpdate: async function (table, match, patch) {
      captured.updates.push({ table: table, match: match, patch: patch });
      if (table === "idempotency_keys" && match.key) {
        var key = String(match.key).replace(/^eq\./, "");
        idempotencyRows[key] = idempotencyRows[key] || {};
        idempotencyRows[key].status = patch.status;
      }
      return [patch];
    }
  };
}

function depositBooking(extra) {
  return Object.assign({
    id: "bk-1",
    payment_mode: "deposit",
    balance_status: "scheduled",
    balance_due_cents: 40000,
    balance_charge_at: "2026-07-10T11:00:00Z", // 1h past => due
    square_customer_id: "cust_1",
    square_card_id: "card_1",
    email: "c@example.com",
    access_token: "tok_abc"
  }, extra || {});
}

function balanceJob(extra) {
  return Object.assign({
    id: "job-bal-1",
    booking_id: "bk-1",
    kind: "balance_charge",
    fire_at: "2026-07-10T11:00:00Z",
    status: "pending",
    attempts: 0,
    idempotency_key: "idem_balance_job_1",
    payload: { kind: "balance_charge" }
  }, extra || {});
}

function campaignJob(extra) {
  return Object.assign({
    id: "job-camp-1",
    booking_id: "bk-1",
    kind: "campaign_touch",
    fire_at: "2026-07-10T11:00:00Z",
    status: "pending",
    attempts: 0,
    idempotency_key: "idem_campaign_job_1",
    payload: { enrollment_id: "enr_1", touch_no: 2, label: "midpoint" }
  }, extra || {});
}

async function run() {
  var passed = 0;

  // ---- Test 1: DARK — SCHEDULER_ARMED off => dry-run, zero writes -----------
  {
    var charged = false;
    var sent = false;
    var db = makeDB({ jobs: [balanceJob()], bookingsById: { "bk-1": depositBooking() } });
    var res = await dispatchTick({
      now: NOW,
      env: {}, // SCHEDULER_ARMED unset
      db: db,
      chargeCardOnFile: async function () { charged = true; return { id: "x" }; },
      sendEmail: async function () { sent = true; return { sent: true }; }
    });
    assert.strictEqual(res.dryRun, true, "T1: dryRun");
    assert.strictEqual(res.armed, false, "T1: not armed");
    assert.strictEqual(res.due, 1, "T1: one due job selected");
    assert.strictEqual(charged, false, "T1: NO charge fn called");
    assert.strictEqual(sent, false, "T1: NO send fn called");
    assert.strictEqual(db.captured.inserts.length, 0, "T1: ZERO inserts (no ledger claim)");
    assert.strictEqual(db.captured.updates.length, 0, "T1: ZERO updates (no job status change)");
    assert.strictEqual(res.dispatched[0].would, "charge", "T1: reports the intent it WOULD fire");
    passed++; console.log("ok 1 - DARK: scheduler disarmed => select+log only, zero side effects");
  }

  // ---- Test 2: ARMED balance charge due => fires once, books the result -----
  {
    var capture = null;
    var db2 = makeDB({ jobs: [balanceJob()], bookingsById: { "bk-1": depositBooking() } });
    var res2 = await dispatchTick({
      now: NOW,
      env: { SCHEDULER_ARMED: "1", DEPOSIT_AUTOCHARGE_ARMED: "1" },
      db: db2,
      chargeCardOnFile: async function (opts) { capture = opts; return { id: "pay_real", status: "COMPLETED" }; }
    });
    var r = res2.dispatched[0];
    assert.strictEqual(r.charged, true, "T2: charged");
    assert.strictEqual(r.amountCents, 40000, "T2: 40% amount");
    assert.strictEqual(capture.amountCents, 40000, "T2: charge fn got the amount");
    assert.strictEqual(capture.customerId, "cust_1", "T2: customer handle");
    assert.strictEqual(capture.cardId, "card_1", "T2: card handle");
    // ledger claimed in_flight then set succeeded
    var ledgerIns = db2.captured.inserts.filter(function (i) { return i.table === "idempotency_keys"; });
    assert.strictEqual(ledgerIns.length, 1, "T2: ledger claimed once");
    assert.strictEqual(ledgerIns[0].rows.scope, "balance_charge", "T2: ledger scope");
    var jobDone = db2.captured.updates.filter(function (u) { return u.table === "scheduled_jobs" && u.patch.status === "done"; });
    assert.strictEqual(jobDone.length, 1, "T2: job marked done");
    var bookingCharged = db2.captured.updates.filter(function (u) { return u.table === "bookings" && u.patch.balance_status === "charged"; });
    assert.strictEqual(bookingCharged.length, 1, "T2: booking balance_status->charged");
    assert.strictEqual(res2.summary.charged, 1, "T2: summary counts one charge");
    passed++; console.log("ok 2 - ARMED: balance charge fires once, job done, booking charged");
  }

  // ---- Test 3: belt-and-suspenders — autocharge flag off => no charge -------
  {
    var charged3 = false;
    var db3 = makeDB({ jobs: [balanceJob()], bookingsById: { "bk-1": depositBooking() } });
    var res3 = await dispatchTick({
      now: NOW,
      env: { SCHEDULER_ARMED: "1" }, // DEPOSIT_AUTOCHARGE_ARMED NOT set
      db: db3,
      chargeCardOnFile: async function () { charged3 = true; return { id: "x" }; }
    });
    var r3 = res3.dispatched[0];
    assert.strictEqual(charged3, false, "T3: NO Square charge when autocharge flag off");
    assert.strictEqual(r3.dryRun, true, "T3: reported as dry-run");
    assert.strictEqual(r3.reason, "autocharge-disarmed", "T3: reason");
    var jobDone3 = db3.captured.updates.filter(function (u) { return u.table === "scheduled_jobs" && u.patch.status === "done"; });
    assert.strictEqual(jobDone3.length, 0, "T3: job NOT marked done (left pending for a later armed tick)");
    passed++; console.log("ok 3 - belt+suspenders: SCHEDULER_ARMED on but autocharge off => no charge, job pending");
  }

  // ---- Test 4: retry then lockout-after-3 ----------------------------------
  {
    function declineCharge() { var e = new Error("Square chargeCardOnFile 402: CARD_DECLINED card declined"); throw e; }

    // Attempt while attempts=1 (so this failure makes attempts=2) => RETRY.
    var dbR = makeDB({ jobs: [balanceJob({ attempts: 1 })], bookingsById: { "bk-1": depositBooking() } });
    var resR = await dispatchTick({
      now: NOW, env: { SCHEDULER_ARMED: "1", DEPOSIT_AUTOCHARGE_ARMED: "1" }, db: dbR,
      chargeCardOnFile: async function () { declineCharge(); }
    });
    var rr = resR.dispatched[0];
    assert.strictEqual(rr.retry, true, "T4a: 2nd failure => retry (attempts<3)");
    assert.strictEqual(rr.outcome, "declined", "T4a: outcome classified declined");
    var jobPending = dbR.captured.updates.filter(function (u) { return u.table === "scheduled_jobs" && u.patch.status === "pending"; });
    assert.strictEqual(jobPending.length, 1, "T4a: job re-queued pending");
    assert.strictEqual(jobPending[0].patch.attempts, 2, "T4a: attempts bumped to 2");

    // Attempt while attempts=2 (this failure makes attempts=3) => LOCKOUT.
    var dbL = makeDB({ jobs: [balanceJob({ attempts: 2 })], bookingsById: { "bk-1": depositBooking() } });
    var alerted = false;
    var resL = await dispatchTick({
      now: NOW, env: { SCHEDULER_ARMED: "1", DEPOSIT_AUTOCHARGE_ARMED: "1" }, db: dbL,
      chargeCardOnFile: async function () { declineCharge(); },
      alert: async function () { alerted = true; },
      studioEmail: "studio@wws.test"
    });
    var rl = resL.dispatched[0];
    assert.strictEqual(rl.lockout, true, "T4b: 3rd failure => lockout");
    assert.strictEqual(rl.cancelAppointment, false, "T4b: NEVER cancels the appointment");
    var jobFailed = dbL.captured.updates.filter(function (u) { return u.table === "scheduled_jobs" && u.patch.status === "failed"; });
    assert.strictEqual(jobFailed.length, 1, "T4b: job marked failed");
    var bookingFailed = dbL.captured.updates.filter(function (u) { return u.table === "bookings" && u.patch.balance_status === "failed"; });
    assert.strictEqual(bookingFailed.length, 1, "T4b: booking balance_status->failed");
    assert.strictEqual(alerted, true, "T4b: studio alert fired in the lockout fan-out");
    passed++; console.log("ok 4 - retry x3 then lockout: never cancels, alerts studio, marks failed");
  }

  // ---- Test 5: idempotency — key already 'succeeded' => no charge ----------
  {
    var charged5 = false;
    var db5 = makeDB({
      jobs: [balanceJob()],
      bookingsById: { "bk-1": depositBooking() },
      idempotencyRows: { idem_balance_charge_already: { status: "succeeded" } }
    });
    // Pre-seed the ledger with the key balance-charge.js will compute for this booking.
    var { computeBalanceIdempotencyKey } = require("./balance-charge");
    var realKey = computeBalanceIdempotencyKey(depositBooking());
    db5 = makeDB({
      jobs: [balanceJob()],
      bookingsById: { "bk-1": depositBooking() },
      idempotencyRows: (function () { var o = {}; o[realKey] = { status: "succeeded" }; return o; })()
    });
    var res5 = await dispatchTick({
      now: NOW, env: { SCHEDULER_ARMED: "1", DEPOSIT_AUTOCHARGE_ARMED: "1" }, db: db5,
      chargeCardOnFile: async function () { charged5 = true; return { id: "x" }; }
    });
    var r5 = res5.dispatched[0];
    assert.strictEqual(charged5, false, "T5: NO charge when ledger key already succeeded");
    assert.strictEqual(r5.skipped, true, "T5: skipped");
    assert.ok(/idempotent/.test(r5.reason), "T5: reason flags idempotent skip");
    passed++; console.log("ok 5 - idempotency: a succeeded ledger key blocks a second charge");
  }

  // ---- Test 6: campaign touch gating + send --------------------------------
  {
    // 6a: armed but CAMPAIGN_SEND_ENABLED off => no send, dry-run.
    var sent6a = false;
    var db6a = makeDB({ jobs: [campaignJob()], bookingsById: { "bk-1": depositBooking() } });
    var res6a = await dispatchTick({
      now: NOW, env: { SCHEDULER_ARMED: "1" }, db: db6a,
      sendEmail: async function () { sent6a = true; return { sent: true }; }
    });
    assert.strictEqual(sent6a, false, "T6a: no send when campaign flag off");
    assert.strictEqual(res6a.dispatched[0].reason, "campaign-send-disabled", "T6a: reason");

    // 6b: flag on => exactly one send, job done, ledger claimed.
    var sendCount = 0; var sendTo = null;
    var db6b = makeDB({ jobs: [campaignJob()], bookingsById: { "bk-1": depositBooking() } });
    var res6b = await dispatchTick({
      now: NOW, env: { SCHEDULER_ARMED: "1", CAMPAIGN_SEND_ENABLED: "1" }, db: db6b,
      sendEmail: async function (p) { sendCount++; sendTo = p.to; return { sent: true }; }
    });
    assert.strictEqual(sendCount, 1, "T6b: exactly one campaign email sent");
    assert.strictEqual(sendTo, "c@example.com", "T6b: sent to the booker");
    assert.strictEqual(res6b.dispatched[0].sent, true, "T6b: reported sent");
    var campLedger = db6b.captured.inserts.filter(function (i) { return i.table === "idempotency_keys"; });
    assert.strictEqual(campLedger[0].rows.scope, "campaign_send", "T6b: ledger scope campaign_send");
    passed++; console.log("ok 6 - campaign touch: gated off => no send; flag on => one send");
  }

  console.log("\nAll " + passed + " scheduler-dispatch assertions passed.");
}

run().catch(function (e) {
  console.error("FAILED:", (e && e.stack) || e);
  process.exit(1);
});
