// booking-edit.js — pure rules for V3 item-7 live profile edits.
//
// Drew's spec (T018, 2026-06-22): from their account a customer can EDIT a booking
// live, but only in the "add value" direction —
//   - add-ons can be ADDED, never removed or refunded (add-only);
//   - a session can be rescheduled/changed only to the SAME or a HIGHER price tier
//     (no downgrade — "downgrade made hard");
//   - any net increase is charged IMMEDIATELY to the card on file (delta charge).
//
// This module is intentionally pure and price-table-free: the caller (the edit
// endpoint) resolves session/add-on prices from api/_lib/acuity.js (SESSION_PRICES /
// ADDON_PRICES) and the saved booking, then passes plain { cents } shapes in. That
// keeps the money rules unit-testable with zero Acuity/Square calls — same discipline
// as cart.js / pricing-shared.js. Date/time availability is validated separately
// (verify-availability.js); this module owns only the tier/add-only/delta rules.
//
// Shapes:
//   booking  = { sessionCents:int, addons:[{ id:string, cents:int }] }
//   editReq  = { sessionCents:int, addons:[{ id:string, cents:int }] }  // desired END state
//
// All amounts are integer cents. Never trust the client total — the endpoint must
// rebuild editReq from authoritative prices before calling these.

"use strict";

function sumAddonsCents(addons) {
  return (addons || []).reduce(function (acc, a) {
    return acc + (Number.isInteger(a && a.cents) ? a.cents : 0);
  }, 0);
}

function bookingTotalCents(b) {
  return (b && Number.isInteger(b.sessionCents) ? b.sessionCents : 0) + sumAddonsCents(b && b.addons);
}

function addonIdSet(addons) {
  return new Set((addons || []).map(function (a) { return a.id; }));
}

// Validate a requested edit against the add-only + no-downgrade rules.
// Returns { ok, errors:[...] }. errors is empty when ok.
function validateBookingEdit(current, requested) {
  var errors = [];
  if (!current || !Number.isInteger(current.sessionCents)) {
    errors.push("current booking is missing a valid sessionCents");
  }
  if (!requested || !Number.isInteger(requested.sessionCents)) {
    errors.push("requested edit is missing a valid sessionCents");
  }
  if (errors.length) return { ok: false, errors: errors };

  // No downgrade: the session price may not drop (reschedule to same-or-higher tier only).
  if (requested.sessionCents < current.sessionCents) {
    errors.push("session downgrade is not allowed (reschedule to the same or a higher tier only)");
  }

  // Add-only: every current add-on must still be present in the requested set.
  var requestedIds = addonIdSet(requested.addons);
  addonIdSet(current.addons).forEach(function (id) {
    if (!requestedIds.has(id)) {
      errors.push("add-on \"" + id + "\" cannot be removed (add-ons are add-only, no refunds)");
    }
  });

  // The net change must never decrease the total (defence-in-depth: the two rules
  // above already guarantee it, but a malformed price could slip through).
  if (bookingTotalCents(requested) < bookingTotalCents(current)) {
    errors.push("an edit may not reduce the booking total");
  }

  return { ok: errors.length === 0, errors: errors };
}

// The amount to charge immediately for a valid edit: the net increase, in cents.
// >= 0 by construction once validateBookingEdit passes. A zero delta (e.g. a pure
// date/time reschedule within the same tier with no new add-ons) means NO charge.
function computeEditDeltaCents(current, requested) {
  var delta = bookingTotalCents(requested) - bookingTotalCents(current);
  return delta > 0 ? delta : 0;
}

module.exports = {
  sumAddonsCents: sumAddonsCents,
  bookingTotalCents: bookingTotalCents,
  validateBookingEdit: validateBookingEdit,
  computeEditDeltaCents: computeEditDeltaCents
};
