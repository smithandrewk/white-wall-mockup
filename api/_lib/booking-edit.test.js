// Tests for booking-edit.js (V3 item-7 live-edit rules). Run: node api/_lib/booking-edit.test.js
"use strict";

var assert = require("assert");
var E = require("./booking-edit");

// Baseline booking: a 4h Powdersville session ($350) + lighting ($125).
var current = {
  sessionCents: 35000,
  addons: [{ id: "lighting", cents: 12500 }]
};

// 1. Pure date/time reschedule (same tier, same add-ons) — allowed, zero delta.
(function () {
  var req = { sessionCents: 35000, addons: [{ id: "lighting", cents: 12500 }] };
  var v = E.validateBookingEdit(current, req);
  assert.strictEqual(v.ok, true, "same-tier reschedule should be allowed");
  assert.strictEqual(E.computeEditDeltaCents(current, req), 0, "same-tier reschedule charges nothing");
})();

// 2. Add an add-on — allowed, delta = the new add-on's price.
(function () {
  var req = { sessionCents: 35000, addons: [{ id: "lighting", cents: 12500 }, { id: "pa-system", cents: 7500 }] };
  var v = E.validateBookingEdit(current, req);
  assert.strictEqual(v.ok, true, "adding an add-on should be allowed");
  assert.strictEqual(E.computeEditDeltaCents(current, req), 7500, "delta should equal the added add-on price");
})();

// 3. Upgrade the session to a higher tier (4h -> 6h $500) — allowed, delta = price diff.
(function () {
  var req = { sessionCents: 50000, addons: [{ id: "lighting", cents: 12500 }] };
  var v = E.validateBookingEdit(current, req);
  assert.strictEqual(v.ok, true, "tier upgrade should be allowed");
  assert.strictEqual(E.computeEditDeltaCents(current, req), 15000, "delta should equal the session upgrade");
})();

// 4. Downgrade the session (4h -> 2h $200) — REJECTED.
(function () {
  var req = { sessionCents: 20000, addons: [{ id: "lighting", cents: 12500 }] };
  var v = E.validateBookingEdit(current, req);
  assert.strictEqual(v.ok, false, "tier downgrade must be rejected");
  assert.ok(v.errors.some(function (e) { return /downgrade/.test(e); }), "error should name the downgrade");
})();

// 5. Remove an existing add-on — REJECTED (add-only).
(function () {
  var req = { sessionCents: 35000, addons: [] };
  var v = E.validateBookingEdit(current, req);
  assert.strictEqual(v.ok, false, "removing an add-on must be rejected");
  assert.ok(v.errors.some(function (e) { return /lighting/.test(e) && /cannot be removed/.test(e); }), "error should name the removed add-on");
})();

// 6. Upgrade AND add in one edit — allowed, delta sums both.
(function () {
  var req = { sessionCents: 50000, addons: [{ id: "lighting", cents: 12500 }, { id: "tv", cents: 7500 }] };
  var v = E.validateBookingEdit(current, req);
  assert.strictEqual(v.ok, true, "combined upgrade + add should be allowed");
  assert.strictEqual(E.computeEditDeltaCents(current, req), 22500, "delta should sum the upgrade and the new add-on");
})();

// 7. Malformed input (missing sessionCents) — rejected, not thrown.
(function () {
  var v = E.validateBookingEdit({ addons: [] }, { sessionCents: 35000, addons: [] });
  assert.strictEqual(v.ok, false, "missing current sessionCents must be rejected");
})();

console.log("booking-edit.test.js: ALL TESTS PASSED (7 cases)");
