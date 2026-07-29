// Test harness for the multi-session cart path in api/create-checkout.js
// (V3 item 2 + deposit, item 6). Stubs Square / Acuity-write / Supabase /
// notifications in the require cache BEFORE loading create-checkout, then
// drives the exported handler with a body carrying `sessions`.
//
// Run: node api/_lib/cart-checkout.test.js
//
// What it proves:
//   1. Full mode  -> ONE createPayment for the WHOLE cart total; N Acuity
//      appointments, EACH passing calendarID (misroute gotcha); ONE bookings
//      row + N booking_sessions persisted.
//   2. Deposit mode (event cart) -> charges 60%; persists deposit_cents /
//      balance_due_cents / balance_charge_at (= first session start - 48h) /
//      balance_status='scheduled' / payment_mode='deposit'.
//   3. Partial failure (appt 2 throws after the charge) -> WHOLE charge refunded,
//      booking NOT confirmed.
//   4. Deposit rejected on a non-event cart (400).
//   5. Single-session path (no `sessions`) does NOT enter the cart branch.

const path = require("path");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..", ".."); // repo root (worktree)
function R(p) { return path.join(ROOT, p); }

// ---- capture buckets --------------------------------------------------------
let calls;
function resetCalls() {
  calls = {
    payments: [],
    refunds: [],
    cards: [],
    appointments: [],
    inserts: [],
    alerts: [],
    multiday: []
  };
}

// ---- stub a module in the require cache -------------------------------------
function stub(relPath, exportsObj) {
  const abs = require.resolve(R(relPath));
  require.cache[abs] = { id: abs, filename: abs, loaded: true, exports: exportsObj };
}

// Acuity write behavior is configurable per test (to force a failure).
let acuityPostBehavior = null;

function installStubs() {
  // Real pure modules we WANT to exercise: acuity.js (pricing/line items/
  // earliest-start), cart.js, pricing-shared.js, waiver-text.js. We only stub
  // the side-effecting parts of acuity (acuityPost/acuityGet) by wrapping the
  // real module.
  const realAcuity = require(R("api/_lib/acuity.js"));
  const stubAcuityPost = async function (urlPath, payload) {
    if (urlPath.indexOf("/appointments") === 0) {
      calls.appointments.push(payload);
      if (acuityPostBehavior) return acuityPostBehavior(payload, calls.appointments.length);
      return { id: "appt-" + calls.appointments.length };
    }
    return {};
  };
  const wrappedAcuity = Object.assign({}, realAcuity, {
    acuityGet: async function () { return []; },
    acuityPost: stubAcuityPost,
    // create-checkout calls createAppointment (resilient wrapper). Route it
    // through the same stub so appointment creations are captured/mocked
    // (incl. the acuityPostBehavior failure simulation for the refund tests).
    createAppointment: async function (payload) { return stubAcuityPost("/appointments?admin=true", payload); }
  });
  stub("api/_lib/acuity.js", wrappedAcuity);

  stub("api/_lib/square.js", {
    findOrCreateCustomer: async function () { return "cust_123"; },
    createPayment: async function (opts) {
      const p = { id: "pay_1", amount_money: { amount: opts.amountCents, currency: "USD" } };
      calls.payments.push(opts);
      return p;
    },
    createCardOnFile: async function (opts) {
      calls.cards.push(opts);
      return { id: "card_1" };
    },
    refundPayment: async function (id, amount, reason) {
      calls.refunds.push({ id, amount, reason });
      return { id: "refund_1" };
    }
  });

  stub("api/_lib/env.js", {
    isStaging: function () { return false; },
    isProduction: function () { return true; },
    stagingSinkEmail: function () { return "sink@example.com"; },
    stagingCalendarID: function () { return null; }
  });

  stub("api/_lib/supabase.js", {
    isConfigured: function () { return true; },
    serviceInsert: async function (table, rows) {
      calls.inserts.push({ table, rows });
      // bookings/booking_sessions return a row with an id (representation).
      if (table === "bookings") return [{ id: "booking_uuid_1" }];
      if (table === "booking_sessions") return [{ id: "session_uuid_" + calls.inserts.length }];
      return Array.isArray(rows) ? rows : [rows];
    },
    serviceUpdate: async function () { return []; },
    serviceSelect: async function () { return []; }
  });

  stub("api/_lib/coupons.js", {
    validateCoupon: async function () { return { valid: false }; },
    sessionDiscountCents: function () { return 0; }
  });

  stub("api/_lib/alert.js", {
    alertFailure: async function (sev, msg, meta) { calls.alerts.push({ sev, msg, meta }); }
  });
  stub("api/_lib/posthog.js", {
    captureServerEvent: function () {},
    flushPostHog: async function () {}
  });
  stub("api/notify-owner.js", { notifyOwner: async function () {} });
  stub("api/_lib/notify-cleaner.js", { notifyCleaner: async function () {} });
  stub("api/_lib/notify-sms.js", { notifyOwnerSMS: async function () {} });
  stub("api/_lib/notify-customer-sms.js", { notifyCustomerSMS: async function () {} });
  // DREW-29: capture whether the cart path invokes the multi-day event notifier
  // at all, so we can assert the call-site gate (a single-session/no-fee booking
  // must not reach notifyMultidayEvent).
  stub("api/_lib/notify-multiday.js", {
    notifyMultidayEvent: async function (ctx) { calls.multiday.push(ctx); }
  });
}

function loadHandler() {
  // Drop create-checkout from cache so it re-binds the freshly-stubbed deps.
  delete require.cache[require.resolve(R("api/create-checkout.js"))];
  return require(R("api/create-checkout.js"));
}

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status: function (c) { this.statusCode = c; return this; },
    json: function (b) { this.body = b; return this; }
  };
}

// Two valid Powdersville event sessions on consecutive days. pv-6 ($500) type.
// Use the real SESSION_PRICES from acuity.js so totals are authoritative.
const acuityReal = require(R("api/_lib/acuity.js"));
const pricingShared = require(R("scripts/pricing-shared.js"));

// The 60/40 deposit (V3 item-6) is DARK on production: create-checkout forces
// paymentMode to "full" off-staging unless WWS_ITEM6_DEPOSIT_ARMED=1, so that no
// customer is ever promised a 40% auto-charge the scheduler cannot yet run. The
// deposit MACHINERY still has to work when it is armed, which is what T2 covers —
// so arm it here. (Without this, T2 would silently be testing the full-payment
// path while claiming to test the deposit.)
process.env.WWS_ITEM6_DEPOSIT_ARMED = "1";
// Pick two valid appointment type IDs from the live allowlist.
const validTypes = Object.keys(acuityReal.SESSION_PRICES);
const TYPE_A = validTypes[0];
const TYPE_B = validTypes[1] || validTypes[0];
const priceA = acuityReal.SESSION_PRICES[TYPE_A].cents;
const priceB = acuityReal.SESSION_PRICES[TYPE_B].cents;

// The fixture cart is a 2-day EVENT, so the authoritative charge is not just the
// session prices — it composes every event-level pricing rule:
//   sessions
//   + $150 cleaning fee   (Drew 2026-07-11: mandatory on ANY multi-day event)
//   - $160 x 2 days       (Drew 2026-07-13: multi-day discount, $320 here)
// This test previously asserted `priceA + priceB` and had been FAILING on main
// since the cleaning fee shipped — it was never updated. Derive the expectation
// from the same shared pricing module the server charges from, so it tracks the
// rules instead of hardcoding a number that silently rots.
const CLEANING_FEE_CENTS = 15000;
const MULTIDAY_DISCOUNT_CENTS = pricingShared.multiDayDiscountCents(
  2,
  priceA + priceB + CLEANING_FEE_CENTS
);
const EXPECTED_TOTAL =
  priceA + priceB + CLEANING_FEE_CENTS - MULTIDAY_DISCOUNT_CENTS;

// Use far-future afternoon datetimes (after 12:30pm ET) so no earliest-start
// floor trips. 2pm ET ~= 18:00Z (EDT) — safe.
function sessionsFixture() {
  return [
    {
      appointmentTypeID: TYPE_A,
      datetime: "2026-09-10T18:00:00Z",
      location: "powdersville",
      eventIntent: "yes",
      participants: "10",
      addons: {}
    },
    {
      appointmentTypeID: TYPE_B,
      datetime: "2026-09-11T18:00:00Z",
      location: "powdersville",
      eventIntent: "yes",
      participants: "10",
      addons: {}
    }
  ];
}

const UNIVERSAL = {
  contact: { firstName: "Cart", lastName: "Tester", email: "cart-test@example.com", phone: "8035551212" },
  waiverSigned: true,
  termsSignature: "Cart Tester",
  consent: { cardOnFile: true, timestamp: "2026-09-01T00:00:00Z", userAgent: "test" },
  cardholderName: "Cart Tester",
  squareToken: "cnon_testtoken_abcdefgh",
  clientIdempotencyKey: "idem-test-1"
};

async function run() {
  let passed = 0;

  // ---- Test 1: FULL mode -----------------------------------------------------
  resetCalls();
  acuityPostBehavior = null;
  installStubs();
  let handler = loadHandler();
  let res = fakeRes();
  await handler(
    { method: "POST", headers: {}, body: { sessions: sessionsFixture(), universal: UNIVERSAL, paymentMode: "full" } },
    res
  );
  assert.strictEqual(res.statusCode, 200, "T1: expected 200, got " + res.statusCode + " " + JSON.stringify(res.body));
  assert.strictEqual(calls.payments.length, 1, "T1: exactly ONE createPayment");
  assert.strictEqual(calls.payments[0].amountCents, EXPECTED_TOTAL, "T1: charged sessions + cleaning fee - multi-day discount");
  assert.strictEqual(calls.cards.length, 1, "T1: exactly ONE createCardOnFile");
  assert.strictEqual(calls.appointments.length, 2, "T1: N=2 Acuity appointments");
  calls.appointments.forEach(function (a, i) {
    assert.ok(a.calendarID, "T1: appointment " + i + " MUST pass calendarID (misroute gotcha)");
    assert.strictEqual(String(a.calendarID), String(acuityReal.CALENDAR_IDS["powdersville"]), "T1: calendarID is the PV calendar");
  });
  const bookingInsert = calls.inserts.find(function (c) { return c.table === "bookings"; });
  assert.ok(bookingInsert, "T1: a bookings row was inserted");
  const bRow = Array.isArray(bookingInsert.rows) ? bookingInsert.rows[0] : bookingInsert.rows;
  assert.strictEqual(bRow.payment_mode, "full", "T1: payment_mode=full");
  assert.strictEqual(bRow.balance_status, "none", "T1: balance_status=none in full mode");
  assert.strictEqual(bRow.total_cents, EXPECTED_TOTAL, "T1: total_cents persisted (fee-inclusive, discount-applied)");
  const sessionInserts = calls.inserts.filter(function (c) { return c.table === "booking_sessions"; });
  assert.strictEqual(sessionInserts.length, 2, "T1: N=2 booking_sessions rows");
  assert.strictEqual(res.body.sessionCount, 2, "T1: response sessionCount=2");
  passed++; console.log("ok 1 - full mode: one charge for cart total, N appts w/ calendarID, one booking + N sessions");

  // ---- Test 2: DEPOSIT mode (event cart) ------------------------------------
  resetCalls();
  acuityPostBehavior = null;
  installStubs();
  handler = loadHandler();
  res = fakeRes();
  await handler(
    { method: "POST", headers: {}, body: { sessions: sessionsFixture(), universal: UNIVERSAL, paymentMode: "deposit" } },
    res
  );
  assert.strictEqual(res.statusCode, 200, "T2: expected 200, got " + res.statusCode + " " + JSON.stringify(res.body));
  const total = EXPECTED_TOTAL;
  const expectDeposit = Math.round(total * 0.60);
  assert.strictEqual(calls.payments[0].amountCents, expectDeposit, "T2: charged 60% deposit");
  const bRow2 = (function () {
    const ci = calls.inserts.find(function (c) { return c.table === "bookings"; });
    return Array.isArray(ci.rows) ? ci.rows[0] : ci.rows;
  })();
  assert.strictEqual(bRow2.payment_mode, "deposit", "T2: payment_mode=deposit");
  assert.strictEqual(bRow2.deposit_cents, expectDeposit, "T2: deposit_cents stored");
  assert.strictEqual(bRow2.balance_due_cents, total - expectDeposit, "T2: balance_due_cents stored");
  assert.strictEqual(bRow2.balance_status, "scheduled", "T2: balance_status=scheduled");
  assert.strictEqual(bRow2.total_cents, total, "T2: total_cents is the FULL total, not the deposit");
  // balance_charge_at = first (chronological) session start - 48h => Sep 8 18:00Z
  const expectedChargeAt = new Date(new Date("2026-09-10T18:00:00Z").getTime() - 48 * 3600 * 1000).toISOString();
  assert.strictEqual(bRow2.balance_charge_at, expectedChargeAt, "T2: balance_charge_at = first start - 48h");
  passed++; console.log("ok 2 - deposit mode: 60% charged, deposit/balance/charge_at/status persisted");

  // ---- Test 3: partial failure (appt 2 throws) ------------------------------
  resetCalls();
  acuityPostBehavior = function (payload, n) {
    if (n === 2) throw new Error("Acuity 500 on session 2");
    return { id: "appt-" + n };
  };
  installStubs();
  handler = loadHandler();
  res = fakeRes();
  await handler(
    { method: "POST", headers: {}, body: { sessions: sessionsFixture(), universal: UNIVERSAL, paymentMode: "full" } },
    res
  );
  assert.strictEqual(res.statusCode, 500, "T3: expected 500 on partial failure");
  assert.strictEqual(calls.payments.length, 1, "T3: one charge happened");
  assert.strictEqual(calls.refunds.length, 1, "T3: the WHOLE charge was refunded");
  assert.strictEqual(calls.refunds[0].amount, EXPECTED_TOTAL, "T3: refund amount == full charge");
  assert.strictEqual(res.body.refunded, true, "T3: response flags refunded");
  const confirmedBooking = calls.inserts.find(function (c) {
    if (c.table !== "bookings") return false;
    const r = Array.isArray(c.rows) ? c.rows[0] : c.rows;
    return r.status === "confirmed";
  });
  assert.ok(!confirmedBooking, "T3: NO confirmed booking row on failure");
  passed++; console.log("ok 3 - partial failure: whole charge refunded, no confirmed booking");

  // ---- Test 4: deposit rejected on a NON-event cart -------------------------
  resetCalls();
  acuityPostBehavior = null;
  installStubs();
  handler = loadHandler();
  res = fakeRes();
  const photoSessions = sessionsFixture().map(function (s) { return Object.assign({}, s, { eventIntent: "no" }); });
  await handler(
    { method: "POST", headers: {}, body: { sessions: photoSessions, universal: UNIVERSAL, paymentMode: "deposit" } },
    res
  );
  assert.strictEqual(res.statusCode, 400, "T4: deposit on non-event cart is rejected");
  assert.strictEqual(calls.payments.length, 0, "T4: no charge on rejected deposit");
  passed++; console.log("ok 4 - deposit rejected on non-event cart (400, no charge)");

  // ---- Test 5: single-session path NOT diverted -----------------------------
  // No `sessions` key => must fall through to the original single-session
  // validation. We send an otherwise-empty body and expect the FIRST
  // single-session validation error (Invalid appointmentTypeID), proving the
  // cart branch was not taken.
  resetCalls();
  acuityPostBehavior = null;
  installStubs();
  handler = loadHandler();
  res = fakeRes();
  await handler({ method: "POST", headers: {}, body: {} }, res);
  assert.strictEqual(res.statusCode, 400, "T5: single-session path runs its own validation");
  assert.strictEqual(res.body.error, "Invalid appointmentTypeID", "T5: hit the single-session validator, not the cart one");
  assert.strictEqual(calls.payments.length, 0, "T5: no charge");
  passed++; console.log("ok 5 - single-session path untouched when `sessions` absent");

  // ---- Test 6: single-session EVENT cart fires NO multi-day notifier --------
  // DREW-29 incident: a paid ONE-HOUR session, tagged "event" in the Step-1 gate
  // and booked via an offer link, must NOT trigger notifyMultidayEvent — no
  // "multi-day event booked" owner text, no cleaner email. One session (< 2 days)
  // with a small headcount (< 35) means cartIsMultiDayEvent=false AND
  // cleaningFeeCents=0, so the call-site gate must skip the notifier entirely.
  resetCalls();
  acuityPostBehavior = null;
  installStubs();
  handler = loadHandler();
  res = fakeRes();
  const oneHourEvent = [Object.assign({}, sessionsFixture()[0], { eventIntent: "yes", participants: "6" })];
  await handler(
    { method: "POST", headers: {}, body: { sessions: oneHourEvent, universal: UNIVERSAL, paymentMode: "full" } },
    res
  );
  assert.strictEqual(res.statusCode, 200, "T6: single-session event books fine, got " + res.statusCode + " " + JSON.stringify(res.body));
  assert.strictEqual(calls.payments.length, 1, "T6: the session was charged (booking still works)");
  assert.strictEqual(calls.appointments.length, 1, "T6: exactly one Acuity appointment");
  assert.strictEqual(calls.multiday.length, 0, "T6: notifyMultidayEvent NOT invoked for a 1-session, no-fee booking (the fix)");
  passed++; console.log("ok 6 - single-session event fires no multi-day text / cleaner (DREW-29)");

  // ---- Test 7: genuine 2-day event STILL fires the multi-day notifier -------
  resetCalls();
  acuityPostBehavior = null;
  installStubs();
  handler = loadHandler();
  res = fakeRes();
  await handler(
    { method: "POST", headers: {}, body: { sessions: sessionsFixture(), universal: UNIVERSAL, paymentMode: "full" } },
    res
  );
  assert.strictEqual(res.statusCode, 200, "T7: 2-day event books fine");
  assert.strictEqual(calls.multiday.length, 1, "T7: notifyMultidayEvent invoked exactly once for a real multi-day event");
  assert.strictEqual(calls.multiday[0].cleaningFeeCents, CLEANING_FEE_CENTS, "T7: the notifier gets the real cleaning fee so its cleaner sub-send fires");
  passed++; console.log("ok 7 - genuine multi-day event still notifies (no over-suppression)");

  console.log("\nAll " + passed + " cart-checkout assertions passed.");
}

run().catch(function (e) {
  console.error("FAILED:", e && e.stack || e);
  process.exit(1);
});
