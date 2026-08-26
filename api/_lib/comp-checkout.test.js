// Test harness for the FREE-COMP path in api/create-checkout.js (Drew round 7).
// Stubs Square / Acuity-write / Supabase / notifications / coupons in the require
// cache BEFORE loading create-checkout, then drives the exported handler.
//
// Run: node api/_lib/comp-checkout.test.js
//
// What it proves (money-critical):
//   1. Single-session COMP code -> ZERO Square calls (no findOrCreateCustomer /
//      createPayment / createCardOnFile), Acuity appointment created, $0 booking
//      persisted, comp Watson alert fired, 200 + redirect. No squareToken/consent
//      required.
//   2. A NORMAL single-session booking with NO comp + NO squareToken -> 400
//      "Missing payment token" (the card guard is intact for non-comp).
//   3. A NORMAL single-session booking WITH squareToken -> charges (createPayment
//      called), byte-for-byte paid path unchanged.
//   4. Cart COMP code -> ZERO Square calls, N Acuity appointments, $0 booking, 200.

const path = require("path");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..", "..");
function R(p) { return path.join(ROOT, p); }

let calls;
function resetCalls() {
  calls = {
    customers: [],
    payments: [],
    cards: [],
    refunds: [],
    appointments: [],
    inserts: [],
    alerts: [],
    ownerSMS: [],
    compSMS: []
  };
}

function stub(relPath, exportsObj) {
  const abs = require.resolve(R(relPath));
  require.cache[abs] = { id: abs, filename: abs, loaded: true, exports: exportsObj };
}

function installStubs() {
  // Exercise the REAL acuity pure helpers (pricing/line items/notes/earliest
  // start) but stub the side-effecting acuityGet/acuityPost.
  const realAcuity = require(R("api/_lib/acuity.js"));
  const stubAcuityPost = async function (urlPath, payload) {
    if (urlPath.indexOf("/appointments") === 0) {
      calls.appointments.push(payload);
      return { id: "appt-" + calls.appointments.length };
    }
    return {};
  };
  const wrappedAcuity = Object.assign({}, realAcuity, {
    acuityGet: async function () { return []; },
    acuityPost: stubAcuityPost,
    // create-checkout calls createAppointment (resilient wrapper). Route it
    // through the same stub so appointment creations are captured/mocked.
    createAppointment: async function (payload) { return stubAcuityPost("/appointments?admin=true", payload); }
  });
  stub("api/_lib/acuity.js", wrappedAcuity);

  stub("api/_lib/square.js", {
    findOrCreateCustomer: async function (opts) { calls.customers.push(opts); return "cust_123"; },
    createPayment: async function (opts) {
      calls.payments.push(opts);
      return { id: "pay_1", amount_money: { amount: opts.amountCents, currency: "USD" } };
    },
    createCardOnFile: async function (opts) { calls.cards.push(opts); return { id: "card_1" }; },
    refundPayment: async function (id, amount, reason) { calls.refunds.push({ id, amount, reason }); return { id: "refund_1" }; }
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
      if (table === "bookings") return [{ id: "booking_uuid_1" }];
      if (table === "booking_sessions") return [{ id: "session_uuid_" + calls.inserts.length }];
      return Array.isArray(rows) ? rows : [rows];
    },
    serviceUpdate: async function () { return []; },
    serviceSelect: async function () { return []; }
  });

  // Comp coupon stub: WWSHUNDRED validates as a full comp; everything else fails.
  stub("api/_lib/coupons.js", {
    validateCoupon: async function (code) {
      if (String(code).trim().toUpperCase() === "WWSHUNDRED") {
        return { valid: true, code: "WWSHUNDRED", comp: true, label: "Full comp (WWSHUNDRED)" };
      }
      return { valid: false, reason: "invalid" };
    },
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
  stub("api/_lib/notify-sms.js", {
    notifyOwnerSMS: async function (s, id) { calls.ownerSMS.push({ id }); },
    notifyOwnerCompSMS: async function (s, id) { calls.compSMS.push({ bookingState: s, id }); }
  });
  stub("api/_lib/notify-customer-sms.js", { notifyCustomerSMS: async function () {} });
  stub("api/_lib/campaign-enroll.js", { enrollBooking: async function () {} });
}

function loadHandler() {
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

const acuityReal = require(R("api/_lib/acuity.js"));
const validTypes = Object.keys(acuityReal.SESSION_PRICES);
const TYPE_A = validTypes[0];
const priceA = acuityReal.SESSION_PRICES[TYPE_A].cents;

const CONTACT = { firstName: "Comp", lastName: "Tester", email: "comp-test@example.com", phone: "8035551212" };

// Afternoon (after any 12:30pm floor) far-future datetime.
const DT = "2026-09-10T18:00:00Z";

async function run() {
  let passed = 0;

  // ---- T1: single-session COMP -> no Square, Acuity created, $0 booking ------
  resetCalls();
  installStubs();
  let handler = loadHandler();
  let res = fakeRes();
  await handler({
    method: "POST",
    headers: {},
    body: {
      appointmentTypeID: TYPE_A,
      datetime: DT,
      location: "powdersville",
      contact: CONTACT,
      waiverSigned: true,
      couponCode: "WWSHUNDRED",
      addons: { lighting: { selected: true } },
      // WWA-12: a comp booking that arrived from an ad click must still record
      // its gclid on the Acuity record for per-booking paid-vs-organic analysis.
      attribution: { gclid: "TeSt_Gclid_123", utm_source: "google", ts: Date.now() }
      // NOTE: deliberately NO squareToken and NO consent — comp must not need them.
    }
  }, res);
  assert.strictEqual(res.statusCode, 200, "T1: comp booking returns 200, got " + res.statusCode + " " + JSON.stringify(res.body));
  assert.strictEqual(calls.customers.length, 0, "T1: NO findOrCreateCustomer for comp");
  assert.strictEqual(calls.payments.length, 0, "T1: NO createPayment for comp (no charge)");
  assert.strictEqual(calls.cards.length, 0, "T1: NO createCardOnFile for comp");
  assert.strictEqual(calls.appointments.length, 1, "T1: Acuity appointment created");
  assert.ok(calls.appointments[0].calendarID, "T1: appointment passes calendarID (misroute gotcha)");
  assert.ok(/FULL COMP/.test(calls.appointments[0].notes), "T1: notes mark the booking as full comp");
  assert.ok(/--- AD ATTRIBUTION/.test(calls.appointments[0].notes), "T1: WWA-12 ad-attribution block stamped on comp booking");
  assert.ok(/gclid: TeSt_Gclid_123/.test(calls.appointments[0].notes), "T1: WWA-12 gclid recorded on comp booking notes");
  const compBooking = calls.inserts.find(function (c) { return c.table === "bookings"; });
  assert.ok(compBooking, "T1: a bookings row was persisted");
  const cRow = Array.isArray(compBooking.rows) ? compBooking.rows[0] : compBooking.rows;
  assert.strictEqual(cRow.total_cents, 0, "T1: booking persisted at $0");
  assert.strictEqual(cRow.payment_mode, "comp", "T1: payment_mode=comp");
  assert.strictEqual(cRow.square_payment_id, null, "T1: no square_payment_id");
  assert.strictEqual(calls.compSMS.length, 1, "T1: comp Watson alert fired exactly once");
  assert.ok(/booking-confirmation/.test(res.body.redirect), "T1: same redirect shape as paid path");
  assert.strictEqual(res.body.success, true, "T1: success:true");
  passed++; console.log("ok 1 - single comp: no Square calls, Acuity created, $0 booking, comp alert, 200");

  // ---- T2: NORMAL booking, no comp, no squareToken -> 400 --------------------
  resetCalls();
  installStubs();
  handler = loadHandler();
  res = fakeRes();
  await handler({
    method: "POST",
    headers: {},
    body: {
      appointmentTypeID: TYPE_A,
      datetime: DT,
      location: "powdersville",
      contact: CONTACT,
      waiverSigned: true
      // no couponCode, no squareToken
    }
  }, res);
  assert.strictEqual(res.statusCode, 400, "T2: non-comp booking without a card is rejected");
  assert.strictEqual(res.body.error, "Missing payment token", "T2: the squareToken guard fires for non-comp");
  assert.strictEqual(calls.payments.length, 0, "T2: nothing charged");
  assert.strictEqual(calls.appointments.length, 0, "T2: no appointment created");
  passed++; console.log("ok 2 - normal booking w/o comp still requires squareToken (400)");

  // ---- T3: NORMAL booking WITH squareToken -> charges ------------------------
  resetCalls();
  installStubs();
  handler = loadHandler();
  res = fakeRes();
  await handler({
    method: "POST",
    headers: {},
    body: {
      appointmentTypeID: TYPE_A,
      datetime: DT,
      location: "powdersville",
      contact: CONTACT,
      waiverSigned: true,
      squareToken: "cnon_testtoken_abcdefgh",
      consent: { cardOnFile: true, timestamp: "2026-09-01T00:00:00Z", userAgent: "test" },
      cardholderName: "Comp Tester"
    }
  }, res);
  assert.strictEqual(res.statusCode, 200, "T3: paid booking succeeds, got " + res.statusCode + " " + JSON.stringify(res.body));
  assert.strictEqual(calls.payments.length, 1, "T3: paid path charges exactly once");
  assert.strictEqual(calls.payments[0].amountCents, priceA, "T3: charged the session price");
  assert.strictEqual(calls.cards.length, 1, "T3: paid path saves the card on file");
  assert.strictEqual(calls.compSMS.length, 0, "T3: NO comp alert for a paid booking");
  passed++; console.log("ok 3 - normal booking with squareToken charges + saves card (paid path intact)");

  // ---- T4: cart COMP -> no Square, N appointments, $0 booking ----------------
  resetCalls();
  installStubs();
  handler = loadHandler();
  res = fakeRes();
  const TYPE_B = validTypes[1] || validTypes[0];
  await handler({
    method: "POST",
    headers: {},
    body: {
      sessions: [
        { appointmentTypeID: TYPE_A, datetime: "2026-09-10T18:00:00Z", location: "powdersville", eventIntent: "yes", participants: "10", addons: {} },
        { appointmentTypeID: TYPE_B, datetime: "2026-09-11T18:00:00Z", location: "powdersville", eventIntent: "yes", participants: "10", addons: {} }
      ],
      universal: {
        contact: CONTACT,
        waiverSigned: true,
        couponCode: "WWSHUNDRED"
        // no squareToken / consent — comp cart must not need them
      },
      paymentMode: "full"
    }
  }, res);
  assert.strictEqual(res.statusCode, 200, "T4: comp cart returns 200, got " + res.statusCode + " " + JSON.stringify(res.body));
  assert.strictEqual(calls.customers.length, 0, "T4: NO findOrCreateCustomer for comp cart");
  assert.strictEqual(calls.payments.length, 0, "T4: NO charge for comp cart");
  assert.strictEqual(calls.cards.length, 0, "T4: NO saved card for comp cart");
  assert.strictEqual(calls.appointments.length, 2, "T4: N=2 Acuity appointments");
  calls.appointments.forEach(function (a, i) {
    assert.ok(a.calendarID, "T4: appointment " + i + " passes calendarID");
  });
  const cartCompBooking = calls.inserts.find(function (c) { return c.table === "bookings"; });
  const ccRow = Array.isArray(cartCompBooking.rows) ? cartCompBooking.rows[0] : cartCompBooking.rows;
  assert.strictEqual(ccRow.total_cents, 0, "T4: cart booking persisted at $0");
  assert.strictEqual(ccRow.payment_mode, "comp", "T4: payment_mode=comp");
  assert.strictEqual(calls.compSMS.length, 1, "T4: comp Watson alert fired for the cart");
  assert.strictEqual(res.body.paymentMode, "comp", "T4: response paymentMode=comp");
  passed++; console.log("ok 4 - comp cart: no Square calls, N appts w/ calendarID, $0 booking, comp alert");

  console.log("\nAll " + passed + " comp-checkout assertions passed.");
}

run().catch(function (e) {
  console.error("FAILED:", e && e.stack || e);
  process.exit(1);
});
