// Focused regression test for the DREW-25 price-stability fix in
// api/create-checkout.js (offer / locked-link money path).
//
// THE BUG IT LOCKS OUT: in offer mode the customer may now FILL the participant
// count when the operator (Drew) left it blank. The $150 cleaning fee triggers
// at 35+ attendees on a single-day event. If the server priced that fee from the
// CUSTOMER's entry, a customer typing 50 into a blank-count offer would add $150
// the signed link never included, the recomputed total would no longer equal the
// signed finalTotalCents, and create-checkout would refuse the booking with the
// price-drift 409 ("This offer's pricing has changed"). Legitimate customers
// would be unable to pay.
//
// THE FIX (create-checkout.js ~L1196): in offer mode `cartMaxAttendees` is pinned
// to offer.participants (the SIGNED count) — never the customer's entry — so the
// cleaning-fee threshold cannot flip. The customer's real count still flows to
// the Acuity notes (offerCartBody -> normalized[].participants), it just can't
// move the price.
//
// This drives the REAL exported handler with a REAL HMAC-signed offer token
// (OFFERS env seam as the active-entry source, exactly like the staging dry-run
// and offers.test.js), stubbing only the side-effecting Square/Acuity-write/
// Supabase/notification modules. It exercises the true offerCartBody +
// cartMaxAttendees + offer-price-assert code path end to end.
//
// Run: node api/_lib/offer-price-stability.test.js

const path = require("path");
const assert = require("assert");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..", "..");
function R(p) { return path.join(ROOT, p); }

// Offer verification needs BOOKING_SECRET (signature) and the OFFERS env seam as
// the active-entry source. EDGE_CONFIG must be unset so getOfferEntry falls back
// to OFFERS (the same seam the staging dry-run uses).
process.env.BOOKING_SECRET = process.env.BOOKING_SECRET || "test-secret-for-offer-tests";
delete process.env.EDGE_CONFIG;

// ---- capture buckets --------------------------------------------------------
let calls;
function resetCalls() {
  calls = { payments: [], refunds: [], cards: [], appointments: [], inserts: [], alerts: [] };
}

function stub(relPath, exportsObj) {
  const abs = require.resolve(R(relPath));
  require.cache[abs] = { id: abs, filename: abs, loaded: true, exports: exportsObj };
}

function installStubs() {
  const realAcuity = require(R("api/_lib/acuity.js"));
  const stubAcuityPost = async function (urlPath, payload) {
    if (urlPath.indexOf("/appointments") === 0) {
      calls.appointments.push(payload);
      return { id: "appt-" + calls.appointments.length };
    }
    return {};
  };
  // Wrap the REAL acuity module (keeps SESSION_PRICES, pricing, signing,
  // buildAcuityAddonIDs, verifyAndDecodeState, ...); only side-effecting writes
  // are stubbed.
  const wrappedAcuity = Object.assign({}, realAcuity, {
    acuityGet: async function () { return []; },
    acuityPost: stubAcuityPost,
    createAppointment: async function (payload) { return stubAcuityPost("/appointments?admin=true", payload); }
  });
  stub("api/_lib/acuity.js", wrappedAcuity);

  stub("api/_lib/square.js", {
    findOrCreateCustomer: async function () { return "cust_123"; },
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

  // No coupon in the offer path (offerCartBody forces couponCode=""). Stub anyway.
  stub("api/_lib/coupons.js", {
    validateCoupon: async function () { return { valid: false }; },
    sessionDiscountCents: function () { return 0; }
  });

  stub("api/_lib/alert.js", { alertFailure: async function (sev, msg, meta) { calls.alerts.push({ sev, msg, meta }); } });
  stub("api/_lib/posthog.js", { captureServerEvent: function () {}, flushPostHog: async function () {} });
  stub("api/notify-owner.js", { notifyOwner: async function () {} });
  stub("api/_lib/notify-cleaner.js", { notifyCleaner: async function () {} });
  stub("api/_lib/notify-sms.js", { notifyOwnerSMS: async function () {} });
  stub("api/_lib/notify-customer-sms.js", { notifyCustomerSMS: async function () {} });
  stub("api/_lib/notify-multiday.js", { notifyMultidayEvent: async function () {} });
  stub("api/_lib/campaign-enroll.js", { enrollBooking: async function () {} });
}

function loadHandler() {
  delete require.cache[require.resolve(R("api/create-checkout.js"))];
  return require(R("api/create-checkout.js"));
}

function fakeRes() {
  return {
    statusCode: null, body: null,
    status: function (c) { this.statusCode = c; return this; },
    json: function (b) { this.body = b; return this; }
  };
}

// Real pricing so expectations track the live catalog, not a hardcoded number.
const acuityReal = require(R("api/_lib/acuity.js"));
const pricingShared = require(R("scripts/pricing-shared.js"));

const CLEANING_FEE_CENTS = 15000;
const CLEANING_FEE_ADDON_ID = acuityReal.ACUITY_ADDON_IDS["cleaning-fee"];

// A SINGLE-day Powdersville event. Full Day PV = the base session price.
const TYPE_ID = "89114581";
const BASE_CENTS = acuityReal.SESSION_PRICES[TYPE_ID].cents; // 98000
// Afternoon (2pm EDT = 18:00Z) so the earliest-start floor never trips.
const SLOT_ISO = "2026-09-10T18:00:00Z";

// Sign an offer payload the way the dashboard does (signState -> encoded+sig),
// and return the "<encoded>.<sig>" token plus its Edge-Config/OFFERS hash.
function signOffer(payload) {
  const { encoded, sig } = acuityReal.signState(payload);
  return { token: encoded + "." + sig, encoded };
}

// Activate an offer in the OFFERS env seam. DREW-24: the entry now also carries
// `tok` (the full signed token) so the short-link resolver works; verifyOfferToken
// only needs { h, t }, but we mirror production and include tok.
const { payloadHash } = require(R("api/_lib/offers.js"));
function activate(id, encoded, token, finalTotalCents) {
  process.env.OFFERS = JSON.stringify({
    [id]: { h: payloadHash(encoded), t: finalTotalCents, tok: token }
  });
}

function baseOffer(overrides) {
  return Object.assign({
    v: 1,
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    name: "Blank-count single-day event",
    locationSlug: "powdersville",
    bookingType: "event",
    eventMode: "single",
    ownershipAddon: null,
    override: null,
    applyOrder: "addon-first",
    sessions: [{ appointmentTypeID: TYPE_ID, selectedTime: SLOT_ISO, addons: {} }],
    flowState: {},
    issuedAt: "2026-07-28T00:00:00.000Z"
  }, overrides || {});
}

function universalWith(customerParticipants) {
  return {
    contact: { firstName: "Offer", lastName: "Tester", email: "offer-test@example.com", phone: "8035551212" },
    waiverSigned: true,
    termsSignature: "Offer Tester",
    consent: { cardOnFile: true, timestamp: "2026-09-01T00:00:00Z", userAgent: "test" },
    cardholderName: "Offer Tester",
    squareToken: "cnon_testtoken_abcdefgh",
    clientIdempotencyKey: "idem-offer-1",
    // The customer fills the count Drew left blank. Rides in offerCustomer;
    // reaches only the Acuity notes — must NOT reprice.
    offerCustomer: { participants: customerParticipants }
  };
}

// A dummy client `sessions` array is required so the top-level handler routes to
// the cart branch; offerCartBody discards it and rebuilds from the token.
function bodyFor(token, universal) {
  return {
    sessions: [{ appointmentTypeID: TYPE_ID, datetime: SLOT_ISO, location: "powdersville" }],
    offerToken: token,
    universal: universal
  };
}

async function run() {
  let passed = 0;

  // ==========================================================================
  // T1 — THE FIX: offer.participants BLANK, customer submits 50, single-day
  // event. finalTotalCents is the base (NO fee, because the signed count is
  // blank). Must charge exactly the signed total, add NO cleaning fee, NOT 409.
  // ==========================================================================
  resetCalls();
  installStubs();
  {
    // Drew left the count blank -> participants omitted (blank). The signed price
    // is the plain session price with no cleaning fee.
    const offer = baseOffer({ id: "aaaaaaaa-0000-0000-0000-000000000001", participants: "", finalTotalCents: BASE_CENTS });
    const { token, encoded } = signOffer(offer);
    activate(offer.id, encoded, token, offer.finalTotalCents);

    const handler = loadHandler();
    const res = fakeRes();
    await handler({ method: "POST", headers: {}, body: bodyFor(token, universalWith("50")) }, res);

    assert.strictEqual(res.statusCode, 200,
      "T1: expected 200 (no price-drift 409), got " + res.statusCode + " " + JSON.stringify(res.body));
    assert.strictEqual(calls.payments.length, 1, "T1: exactly one charge");
    assert.strictEqual(calls.payments[0].amountCents, BASE_CENTS,
      "T1: charged the SIGNED total (" + BASE_CENTS + "), NOT base+fee (" + (BASE_CENTS + CLEANING_FEE_CENTS) + ")");
    assert.strictEqual(calls.appointments.length, 1, "T1: one Acuity appointment");
    const apptAddons = calls.appointments[0].addonIDs || [];
    assert.ok(apptAddons.indexOf(CLEANING_FEE_ADDON_ID) === -1,
      "T1: cleaning-fee add-on (" + CLEANING_FEE_ADDON_ID + ") MUST NOT be attached — customer's 50 must not add the fee");
    // The customer's real count still reaches the Acuity notes.
    assert.ok(/Event guests:\s*50/.test(calls.appointments[0].notes || ""),
      "T1: customer's participant count (50) still flows to the Acuity notes");
    passed++;
    console.log("ok 1 - blank signed count + customer 50 -> signed total charged, no fee, count in notes, no 409");
  }

  // ==========================================================================
  // T2 — CONTROL (proves the fee logic is genuinely wired to offer.participants,
  // not globally dead): Drew LOCKS 50 in the offer, signs a price that INCLUDES
  // the $150 fee. Server must reproduce base+fee and accept it (200).
  // ==========================================================================
  resetCalls();
  installStubs();
  {
    const offer = baseOffer({ id: "aaaaaaaa-0000-0000-0000-000000000002", participants: "50", finalTotalCents: BASE_CENTS + CLEANING_FEE_CENTS });
    const { token, encoded } = signOffer(offer);
    activate(offer.id, encoded, token, offer.finalTotalCents);

    const handler = loadHandler();
    const res = fakeRes();
    // Customer echoes 50 here too, but the price is driven by the SIGNED 50.
    await handler({ method: "POST", headers: {}, body: bodyFor(token, universalWith("50")) }, res);

    assert.strictEqual(res.statusCode, 200,
      "T2: expected 200, got " + res.statusCode + " " + JSON.stringify(res.body));
    assert.strictEqual(calls.payments[0].amountCents, BASE_CENTS + CLEANING_FEE_CENTS,
      "T2: signed 35+ count DOES include the $150 cleaning fee");
    const apptAddons = calls.appointments[0].addonIDs || [];
    assert.ok(apptAddons.indexOf(CLEANING_FEE_ADDON_ID) !== -1,
      "T2: cleaning-fee add-on IS attached when the SIGNED count is 35+");
    passed++;
    console.log("ok 2 - signed count 50 -> fee IS priced from offer.participants (mechanism is live)");
  }

  // ==========================================================================
  // T3 — GUARD (proves the pre-fix behavior would have been caught): a link that
  // signs the base price but locks 50 attendees is INTERNALLY inconsistent (the
  // recompute produces base+fee). This is exactly the drift the 409 exists for.
  // Confirms the price-assert still fires when the numbers genuinely disagree —
  // i.e. the fix did not neuter the drift guard.
  // ==========================================================================
  resetCalls();
  installStubs();
  {
    const offer = baseOffer({ id: "aaaaaaaa-0000-0000-0000-000000000003", participants: "50", finalTotalCents: BASE_CENTS /* WRONG: omits the fee */ });
    const { token, encoded } = signOffer(offer);
    activate(offer.id, encoded, token, offer.finalTotalCents);

    const handler = loadHandler();
    const res = fakeRes();
    await handler({ method: "POST", headers: {}, body: bodyFor(token, universalWith("50")) }, res);

    assert.strictEqual(res.statusCode, 409, "T3: a genuinely inconsistent signed price still trips the drift 409");
    assert.strictEqual(res.body.offerReason, "changed", "T3: 409 reason is 'changed'");
    assert.strictEqual(calls.payments.length, 0, "T3: no charge on a drift-refused offer");
    passed++;
    console.log("ok 3 - genuine price drift still refused with 409 (guard intact)");
  }

  console.log("\nAll " + passed + " offer price-stability assertions passed.");
}

run().catch(function (e) {
  console.error("FAILED:", (e && e.stack) || e);
  process.exit(1);
});
