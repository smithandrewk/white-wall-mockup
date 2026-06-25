// Tests for booking-edit-pricing.js (V3 item-7 authoritative edit pricing).
// Run: node api/_lib/booking-edit-pricing.test.js
"use strict";

var assert = require("assert");
var P = require("./booking-edit-pricing");
var E = require("./booking-edit");

// Baseline saved booking: a 4h Powdersville session (89114517 = $350) with
// lighting-powdersville ($125) already on it.
var currentSession = { appointment_type_id: "89114517", session_price_cents: 35000 };
var savedAddons = [{ addon_id: "lighting-powdersville", quantity: 1 }];

// 1. Add an add-on (pa-system $40). Current is re-priced from the tables, the
//    requested end-state carries both add-ons, and it feeds a +$40 delta.
(function () {
  var out = P.resolveEditPricing(currentSession, savedAddons, {
    addAddons: [{ addonId: "pa-system", quantity: 1 }]
  });
  assert.strictEqual(out.current.sessionCents, 35000, "current session re-priced from SESSION_PRICES");
  assert.deepStrictEqual(out.current.addons, [{ id: "lighting-powdersville", cents: 12500 }], "current add-ons re-priced");
  assert.strictEqual(out.requested.sessionCents, 35000, "session unchanged on a pure add-on add");
  assert.deepStrictEqual(out.requested.addons, [
    { id: "lighting-powdersville", cents: 12500 },
    { id: "pa-system", cents: 4000 }
  ], "requested carries the existing + new add-on");

  var v = E.validateBookingEdit(out.current, out.requested);
  assert.strictEqual(v.ok, true, "adding an add-on is a valid edit");
  assert.strictEqual(E.computeEditDeltaCents(out.current, out.requested), 4000, "delta = added add-on price");
})();

// 2. Upgrade the session tier (4h $350 -> 6h $500) with no add-on change.
(function () {
  var out = P.resolveEditPricing(currentSession, savedAddons, {
    newAppointmentTypeID: "89114539"
  });
  assert.strictEqual(out.requested.sessionCents, 50000, "requested session re-priced to the 6h tier");
  assert.deepStrictEqual(out.requested.addons, [{ id: "lighting-powdersville", cents: 12500 }], "add-ons preserved through upgrade");

  var v = E.validateBookingEdit(out.current, out.requested);
  assert.strictEqual(v.ok, true, "tier upgrade is a valid edit");
  assert.strictEqual(E.computeEditDeltaCents(out.current, out.requested), 15000, "delta = session price diff");
})();

// 3. Quantity-priced add-on: adding 2x table ($15 each) reads as one line at the
//    full value and a +$30 delta.
(function () {
  var out = P.resolveEditPricing(currentSession, savedAddons, {
    addAddons: [{ addonId: "table", quantity: 2 }]
  });
  var tableLine = out.requested.addons.find(function (a) { return a.id === "table"; });
  assert.deepStrictEqual(tableLine, { id: "table", cents: 3000 }, "2x table priced as full line value");
  assert.strictEqual(E.computeEditDeltaCents(out.current, out.requested), 3000, "delta = 2x table");
})();

// 4. Saved add-on quantity is honored when re-pricing the current state (2x table
//    already on the booking -> $30 current line).
(function () {
  var out = P.resolveEditPricing(currentSession, [{ addon_id: "table", quantity: 2 }], {});
  assert.deepStrictEqual(out.current.addons, [{ id: "table", cents: 3000 }], "current 2x table re-priced authoritatively");
  assert.strictEqual(E.computeEditDeltaCents(out.current, out.requested), 0, "no-op edit = zero delta");
})();

// 5. Reject an unknown appointment type.
(function () {
  assert.throws(function () {
    P.resolveEditPricing(currentSession, savedAddons, { newAppointmentTypeID: "99999999" });
  }, function (err) {
    return err && err.reject === true && err.code === "UNKNOWN_APPOINTMENT_TYPE";
  }, "unknown appointment type must be rejected");
})();

// 6. Reject an unknown add-on id.
(function () {
  assert.throws(function () {
    P.resolveEditPricing(currentSession, savedAddons, { addAddons: [{ addonId: "gold-plated-unicorn", quantity: 1 }] });
  }, function (err) {
    return err && err.reject === true && err.code === "UNKNOWN_ADDON";
  }, "unknown add-on must be rejected");
})();

// 7. Reject a malformed (non-positive) quantity rather than silently flooring it.
(function () {
  assert.throws(function () {
    P.resolveEditPricing(currentSession, savedAddons, { addAddons: [{ addonId: "tv", quantity: 0 }] });
  }, function (err) {
    return err && err.reject === true && err.code === "INVALID_QUANTITY";
  }, "non-positive quantity must be rejected");
})();

// 8. Combined upgrade + add feeds booking-edit.js a correct positive summed delta.
(function () {
  var out = P.resolveEditPricing(currentSession, savedAddons, {
    newAppointmentTypeID: "89114539",                 // 4h -> 6h: +$150
    addAddons: [{ addonId: "tv", quantity: 1 }]        // +$50
  });
  var v = E.validateBookingEdit(out.current, out.requested);
  assert.strictEqual(v.ok, true, "combined upgrade + add is valid");
  assert.strictEqual(E.computeEditDeltaCents(out.current, out.requested), 20000, "delta sums upgrade + new add-on");
})();

console.log("booking-edit-pricing.test.js: ALL TESTS PASSED (8 cases)");
