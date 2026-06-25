// Tests for api/account/booking-edit.js (V3 item-7 edit endpoint).
//
// Covers (1) the pure decideCharge gate and (2) the headline money-safety
// invariant end to end: an edit that ADDS cost while WWS_ITEM7_CHARGE_ARMED is
// OFF must 409 and make NO Square call. The handler's dependencies are the same
// cached module objects this test requires, so we spy on them in place — no
// network, no Square, no Acuity, no Supabase.
//
// Run: node api/account/booking-edit.test.js
"use strict";

var assert = require("assert");

// isConfigured() reads these — set before requiring anything that snapshots env.
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
process.env.SUPABASE_ANON_KEY = "anon-key";
delete process.env.WWS_ITEM7_CHARGE_ARMED; // gate OFF by default

var handler = require("./booking-edit");
var sb = require("../_lib/supabase");
var sq = require("../_lib/square");
var acuity = require("../_lib/acuity");

// ---- 1. decideCharge pure matrix ------------------------------------------
(function () {
  var d = handler.decideCharge;
  assert.deepStrictEqual(d(0, false), { charge: false, blocked: false }, "zero delta = nothing");
  assert.deepStrictEqual(d(0, true), { charge: false, blocked: false }, "zero delta armed = nothing");
  assert.deepStrictEqual(d(-100, true), { charge: false, blocked: false }, "negative delta = nothing");
  assert.deepStrictEqual(d(7500, false), { charge: false, blocked: true }, "delta>0 unarmed = blocked");
  assert.deepStrictEqual(d(7500, true), { charge: true, blocked: false }, "delta>0 armed = charge");
})();

// ---- helpers: in-place spies + mock req/res --------------------------------
function makeRes() {
  return {
    _status: null, _json: null,
    status: function (c) { this._status = c; return this; },
    json: function (o) { this._json = o; return this; }
  };
}

// A booking owned by user "user-1": one 4h PV session ($350) + lighting ($125).
function bookingFixture() {
  return {
    id: "booking-1",
    customer_id: "user-1",
    status: "confirmed",
    total_cents: 47500,
    subtotal_cents: 47500,
    square_customer_id: "sqc-1",
    square_card_id: "card-1",
    booking_sessions: [{
      id: "session-1",
      acuity_appointment_id: "appt-1",
      location: "powdersville",
      appointment_type_id: "89114517", // 4h Flagship, $350
      starts_at: "2026-07-01T13:00:00-04:00",
      duration_min: 240,
      session_price_cents: 35000,
      booking_session_addons: [
        { id: "a1", addon_id: "lighting-powdersville", quantity: 1, unit_cents: 12500 }
      ]
    }]
  };
}

// ---- 2. delta>0 + gate OFF -> 409 and NO Square call -----------------------
(async function () {
  var chargeCalls = 0;
  var origGetUser = sb.getUserFromToken;
  var origSelect = sb.serviceSelect;
  var origUpdate = sb.serviceUpdate;
  var origInsert = sb.serviceInsert;
  var origCharge = sq.chargeCardOnFile;
  var origGet = acuity.acuityGet;

  sb.getUserFromToken = async function () { return { id: "user-1", email: "drew@example.com" }; };
  sb.serviceSelect = async function () { return [bookingFixture()]; };
  sb.serviceUpdate = async function () { throw new Error("serviceUpdate must not run when blocked"); };
  sb.serviceInsert = async function () { throw new Error("serviceInsert must not run when blocked"); };
  sq.chargeCardOnFile = async function () { chargeCalls++; throw new Error("Square must NOT be called when the gate is OFF"); };
  acuity.acuityGet = async function () { throw new Error("Acuity must not run for an add-only blocked edit"); };

  var req = {
    method: "POST",
    headers: { authorization: "Bearer fake-jwt" },
    // add a $40 PA system: delta = 4000 > 0
    body: { bookingId: "booking-1", sessionId: "session-1", addAddons: [{ addonId: "pa-system", quantity: 1 }] }
  };
  var res = makeRes();
  await handler(req, res);

  try {
    assert.strictEqual(res._status, 409, "delta>0 with gate OFF must return 409");
    assert.strictEqual(chargeCalls, 0, "Square chargeCardOnFile must NOT be called");
    assert.ok(/not enabled yet/i.test(res._json && res._json.error), "409 body explains the gate");
  } finally {
    sb.getUserFromToken = origGetUser;
    sb.serviceSelect = origSelect;
    sb.serviceUpdate = origUpdate;
    sb.serviceInsert = origInsert;
    sq.chargeCardOnFile = origCharge;
    acuity.acuityGet = origGet;
  }
})().then(function () {

  // ---- 3. ownership: a booking owned by someone else -> 403 ----------------
  return (async function () {
    var origGetUser = sb.getUserFromToken;
    var origSelect = sb.serviceSelect;
    sb.getUserFromToken = async function () { return { id: "intruder", email: "x@y.com" }; };
    sb.serviceSelect = async function () { return [bookingFixture()]; };
    var req = {
      method: "POST",
      headers: { authorization: "Bearer fake-jwt" },
      body: { bookingId: "booking-1", sessionId: "session-1", addAddons: [] }
    };
    var res = makeRes();
    await handler(req, res);
    try {
      assert.strictEqual(res._status, 403, "another user's booking must 403");
    } finally {
      sb.getUserFromToken = origGetUser;
      sb.serviceSelect = origSelect;
    }
  })();

}).then(function () {

  // ---- 4. add-on removal (add-only violation) -> 400 -----------------------
  return (async function () {
    var origGetUser = sb.getUserFromToken;
    var origSelect = sb.serviceSelect;
    var origCharge = sq.chargeCardOnFile;
    var chargeCalls = 0;
    sb.getUserFromToken = async function () { return { id: "user-1", email: "drew@example.com" }; };
    // saved booking has lighting; a removal can't be expressed via addAddons, so
    // assert a session DOWNGRADE is rejected instead (same validateBookingEdit gate).
    sb.serviceSelect = async function () { return [bookingFixture()]; };
    sq.chargeCardOnFile = async function () { chargeCalls++; return { id: "p" }; };
    var req = {
      method: "POST",
      headers: { authorization: "Bearer fake-jwt" },
      // 4h ($350) -> 2h ($200) is a downgrade
      body: { bookingId: "booking-1", sessionId: "session-1", newAppointmentTypeID: "89113116" }
    };
    var res = makeRes();
    await handler(req, res);
    try {
      assert.strictEqual(res._status, 400, "session downgrade must 400");
      assert.strictEqual(chargeCalls, 0, "no charge on a rejected edit");
    } finally {
      sb.getUserFromToken = origGetUser;
      sb.serviceSelect = origSelect;
      sq.chargeCardOnFile = origCharge;
    }
  })();

}).then(function () {
  console.log("booking-edit.test.js: ALL TESTS PASSED (decideCharge matrix + 409 gate + 403 ownership + 400 downgrade)");
}).catch(function (e) {
  console.error("booking-edit.test.js FAILED:", e && e.message);
  process.exit(1);
});
