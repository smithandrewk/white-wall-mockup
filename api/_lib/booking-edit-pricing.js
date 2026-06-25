// booking-edit-pricing.js — V3 item-7 live-edit price resolver.
//
// The edit endpoint never trusts a client-sent total. This module takes a saved
// booking's CURRENT session + add-ons (straight off the booking_sessions /
// booking_session_addons rows) plus a RAW client edit request, and rebuilds both
// the current and the requested end-state purely from the authoritative price
// tables in api/_lib/acuity.js (SESSION_PRICES / ADDON_PRICES). The output is the
// exact { sessionCents, addons:[{ id, cents }] } shape that booking-edit.js's
// validateBookingEdit / computeEditDeltaCents consume — so the endpoint can hand
// these two objects straight to the add-only / no-downgrade / delta-charge rules.
//
// It is pure: it reads the in-memory price tables only (no Acuity/Square/DB calls,
// no env). requiring acuity.js does not touch the network — getAuthHeader() is the
// only env reader and we never call it.
//
// Shapes:
//   currentSession = { appointment_type_id, session_price_cents? }  // booking_sessions row
//   savedAddons    = [{ addon_id, quantity }]                        // booking_session_addons rows
//   editRequest    = { newAppointmentTypeID?, addAddons?: [{ addonId, quantity }] }
//
// Add-ons are keyed by addon_id (the ADDON_PRICES key, e.g. "lighting-powdersville",
// "table", "setup-crew") and collapsed to ONE { id, cents } entry per id with
// cents = authoritative unit price x quantity. Quantity-priced add-ons (table,
// backdrops-single) therefore carry their full line value, and "add more of an
// existing add-on" reads as the same id at a higher cents — which booking-edit.js
// scores as a positive delta while still satisfying its add-only id check.
//
// Unknown appointment-type IDs or add-on IDs (in the saved booking OR the request)
// are rejected by throwing — we cannot authoritatively price what we don't know.

"use strict";

var acuity = require("./acuity");
var SESSION_PRICES = acuity.SESSION_PRICES;
var ADDON_PRICES = acuity.ADDON_PRICES;

function rejectError(message, code) {
  var err = new Error(message);
  err.code = code;
  err.reject = true; // endpoint can map this to a 400
  return err;
}

function sessionCentsFor(appointmentTypeID) {
  var entry = SESSION_PRICES[String(appointmentTypeID)];
  if (!entry) {
    throw rejectError("unknown appointment type: " + appointmentTypeID, "UNKNOWN_APPOINTMENT_TYPE");
  }
  return entry.cents;
}

function addonUnitCents(addonId) {
  var entry = ADDON_PRICES[String(addonId)];
  if (!entry) {
    throw rejectError("unknown add-on: " + addonId, "UNKNOWN_ADDON");
  }
  return entry.cents;
}

// Coerce a quantity to a positive integer. Absent -> 1. A present-but-invalid
// quantity (zero, negative, fractional, NaN) is rejected rather than silently
// floored, so a crafted request can't sneak a value past the price math.
function normalizeQuantity(q) {
  if (q == null) return 1;
  if (!Number.isInteger(q) || q < 1) {
    throw rejectError("invalid add-on quantity: " + q, "INVALID_QUANTITY");
  }
  return q;
}

// Build an ordered { ids:[...], qty:{id->quantity} } from saved add-on rows,
// aggregating duplicate addon_ids by summing quantity. Validates every id.
function indexSavedAddons(savedAddons) {
  var ids = [];
  var qty = Object.create(null);
  (savedAddons || []).forEach(function (row) {
    var id = String(row && row.addon_id);
    addonUnitCents(id); // validate it's priceable (throws on unknown)
    var n = normalizeQuantity(row && row.quantity);
    if (qty[id] == null) { ids.push(id); qty[id] = 0; }
    qty[id] += n;
  });
  return { ids: ids, qty: qty };
}

// Turn an ordered { ids, qty } index into the [{ id, cents }] list booking-edit.js
// expects, pricing each line authoritatively as unit x quantity.
function toAddonList(index) {
  return index.ids.map(function (id) {
    return { id: id, cents: addonUnitCents(id) * index.qty[id] };
  });
}

// Resolve authoritative current + requested pricing for an item-7 edit.
// Returns { current:{ sessionCents, addons:[{id,cents}] },
//           requested:{ sessionCents, addons:[{id,cents}] } }.
// Throws (err.reject === true) on any unknown type / add-on id / bad quantity.
function resolveEditPricing(currentSession, savedAddons, editRequest) {
  if (!currentSession || currentSession.appointment_type_id == null) {
    throw rejectError("current session is missing appointment_type_id", "MISSING_CURRENT_SESSION");
  }
  editRequest = editRequest || {};

  // Current end-state, re-priced from the tables (saved *_cents columns ignored).
  var currentTypeID = String(currentSession.appointment_type_id);
  var currentSessionCents = sessionCentsFor(currentTypeID);
  var currentIndex = indexSavedAddons(savedAddons);

  // Requested end-state = current, plus the requested mutations.
  var requestedTypeID = editRequest.newAppointmentTypeID != null
    ? String(editRequest.newAppointmentTypeID)
    : currentTypeID;
  var requestedSessionCents = sessionCentsFor(requestedTypeID);

  // Clone the current add-on index, then fold in additions (add-only: this path
  // never removes; booking-edit.js enforces that downstream too).
  var requestedIds = currentIndex.ids.slice();
  var requestedQty = Object.create(null);
  currentIndex.ids.forEach(function (id) { requestedQty[id] = currentIndex.qty[id]; });

  (editRequest.addAddons || []).forEach(function (add) {
    var id = String(add && add.addonId);
    addonUnitCents(id); // validate (throws on unknown)
    var n = normalizeQuantity(add && add.quantity);
    if (requestedQty[id] == null) { requestedIds.push(id); requestedQty[id] = 0; }
    requestedQty[id] += n;
  });

  return {
    current: {
      sessionCents: currentSessionCents,
      addons: toAddonList(currentIndex)
    },
    requested: {
      sessionCents: requestedSessionCents,
      addons: toAddonList({ ids: requestedIds, qty: requestedQty })
    }
  };
}

module.exports = {
  resolveEditPricing: resolveEditPricing,
  sessionCentsFor: sessionCentsFor,
  addonUnitCents: addonUnitCents
};
