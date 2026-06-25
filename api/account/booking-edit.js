// POST /api/account/booking-edit
//
// V3 item-7 live profile edit. A signed-in customer edits ONE session inside one
// of their bookings, but only in the "add value" direction (Drew's spec, T018):
//   - add-ons can be ADDED, never removed/refunded (add-only);
//   - the session may move to the SAME or a HIGHER price tier (no downgrade);
//   - a date/time change reschedules the Acuity appointment after re-checking
//     availability;
//   - any net increase is charged IMMEDIATELY to the card on file.
//
// MONEY SAFETY: the delta charge sits behind WWS_ITEM7_CHARGE_ARMED (DEFAULT OFF).
// When OFF and the computed delta > 0 the endpoint returns 409 and makes NO Square
// call. A pure reschedule / zero-delta edit works regardless. The charge decision
// is the pure helper decideCharge() below so it is unit-testable without Square.
//
// Body: {
//   bookingId: uuid,            // the booking to edit
//   sessionId: uuid,            // which booking_sessions row inside it
//   newAppointmentTypeID?: str, // tier change (same-or-higher only)
//   newDatetime?: ISO8601,      // date/time change -> Acuity reschedule
//   addAddons?: [{ addonId, quantity }]
// }
//
// Never trust the client total: current + requested money shapes are rebuilt from
// the authoritative price tables (api/_lib/acuity.js) by booking-edit-pricing.js.

var sb = require("../_lib/supabase");
var sq = require("../_lib/square");
var acuity = require("../_lib/acuity");
var edit = require("../_lib/booking-edit");
var pricing = require("../_lib/booking-edit-pricing");
var env = require("../_lib/env");

// Pure charge decision. delta is the net increase in cents (>= 0). armed is the
// WWS_ITEM7_CHARGE_ARMED gate. Returns one of:
//   { charge:false, blocked:false } -> nothing to charge (zero/negative delta)
//   { charge:false, blocked:true  } -> would charge, but the gate is OFF (-> 409)
//   { charge:true,  blocked:false } -> charge the delta to the card on file
// Exported so the money gate can be tested with no Square call.
function decideCharge(deltaCents, armed) {
  if (!(deltaCents > 0)) return { charge: false, blocked: false };
  if (!armed) return { charge: false, blocked: true };
  return { charge: true, blocked: false };
}

function isChargeArmed() {
  return process.env.WWS_ITEM7_CHARGE_ARMED === "1";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!sb.isConfigured()) {
    return res.status(503).json({ error: "Accounts are not configured yet" });
  }

  // --- Authenticate the customer (Supabase JWT) ---
  var auth = req.headers["authorization"] || req.headers["Authorization"] || "";
  var token = auth.replace(/^Bearer\s+/i, "").trim();
  var user = await sb.getUserFromToken(token);
  if (!user || !user.id) {
    return res.status(401).json({ error: "Not signed in" });
  }

  var body = req.body || {};
  var bookingId = (body.bookingId || "").trim();
  var sessionId = (body.sessionId || "").trim();
  if (!bookingId || !sessionId) {
    return res.status(400).json({ error: "bookingId and sessionId are required" });
  }

  var newAppointmentTypeID = body.newAppointmentTypeID != null ? String(body.newAppointmentTypeID) : null;
  var newDatetime = body.newDatetime != null ? String(body.newDatetime) : null;
  var addAddons = Array.isArray(body.addAddons) ? body.addAddons : [];

  if (newAppointmentTypeID && !acuity.isValidAppointmentTypeID(newAppointmentTypeID)) {
    return res.status(400).json({ error: "Invalid appointmentTypeID" });
  }

  try {
    // --- Load the booking + its sessions/add-ons, then AUTHORIZE ownership ---
    var bookings = await sb.serviceSelect(
      "bookings",
      "id=eq." + encodeURIComponent(bookingId) +
      "&select=id,customer_id,status,total_cents,subtotal_cents,square_customer_id,square_card_id," +
      "booking_sessions(id,acuity_appointment_id,location,appointment_type_id,starts_at,duration_min,session_price_cents," +
      "booking_session_addons(id,addon_id,quantity,unit_cents))"
    );
    var booking = (bookings || [])[0];
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (booking.customer_id !== user.id) {
      // Don't leak existence — but the row was found, so 403 is accurate here.
      return res.status(403).json({ error: "That booking is not yours" });
    }

    var session = (booking.booking_sessions || []).find(function (s) { return s.id === sessionId; });
    if (!session) {
      return res.status(404).json({ error: "Session not found on this booking" });
    }

    // --- Build authoritative current + requested money shapes (never trust client) ---
    var savedAddons = (session.booking_session_addons || []).map(function (a) {
      return { addon_id: a.addon_id, quantity: a.quantity };
    });
    var priced;
    try {
      priced = pricing.resolveEditPricing(
        { appointment_type_id: session.appointment_type_id },
        savedAddons,
        { newAppointmentTypeID: newAppointmentTypeID, addAddons: addAddons }
      );
    } catch (e) {
      if (e && e.reject) return res.status(400).json({ error: e.message });
      throw e;
    }

    // --- Validate add-only / no-downgrade ---
    var verdict = edit.validateBookingEdit(priced.current, priced.requested);
    if (!verdict.ok) {
      return res.status(400).json({ error: "Edit not allowed", details: verdict.errors });
    }

    var deltaCents = edit.computeEditDeltaCents(priced.current, priced.requested);

    // --- Money gate (BEFORE any Acuity write or Square call) ---
    // If the edit adds cost and the charge gate is OFF, refuse cleanly and touch
    // nothing — no reschedule, no charge, no DB write.
    var decision = decideCharge(deltaCents, isChargeArmed());
    if (decision.blocked) {
      return res.status(409).json({ error: "Adding paid items from your profile is not enabled yet" });
    }

    var requestedTypeID = newAppointmentTypeID || String(session.appointment_type_id);

    // --- Date/time change: re-check availability, then reschedule in Acuity ---
    if (newDatetime) {
      // Earliest-start floor (never trust the client; e.g. 8h Flagship >= 12:30pm ET).
      if (acuity.isStartBeforeEarliest(requestedTypeID, newDatetime)) {
        return res.status(400).json({ error: "Selected start time is before the earliest allowed for this session" });
      }
      // ALWAYS pass calendarID (multi-calendar misroute gotcha).
      var calendarID = env.stagingCalendarID() ||
        acuity.TYPE_TO_CALENDAR[requestedTypeID] ||
        acuity.CALENDAR_IDS[session.location];
      if (!calendarID) {
        return res.status(400).json({ error: "Could not resolve a calendar for this session" });
      }

      var date = newDatetime.slice(0, 10);
      var times = await acuity.acuityGet("/availability/times", {
        appointmentTypeID: requestedTypeID,
        date: date,
        calendarID: calendarID,
        timezone: "America/New_York"
      });
      var available = (times || []).some(function (t) { return t.time === newDatetime; });
      if (!available) {
        return res.status(409).json({ error: "That time is no longer available" });
      }

      if (session.acuity_appointment_id) {
        await acuity.rescheduleAppointment(session.acuity_appointment_id, {
          datetime: newDatetime,
          calendarID: calendarID
        });
      }
    }

    // --- Charge the delta (only when armed; gate already enforced above) ---
    var squarePaymentId = null;
    if (decision.charge) {
      if (!booking.square_customer_id || !booking.square_card_id) {
        return res.status(409).json({ error: "No card on file for this booking" });
      }
      var payment = await sq.chargeCardOnFile({
        customerId: booking.square_customer_id,
        cardId: booking.square_card_id,
        amountCents: deltaCents,
        note: "White Wall profile edit — booking " + booking.id
      });
      squarePaymentId = payment && payment.id ? payment.id : null;
      // Audit the money movement (best-effort; the charge already succeeded).
      try {
        await sb.serviceInsert("payment_events", [{
          booking_id: booking.id,
          kind: "addon",
          amount_cents: deltaCents,
          square_payment_id: squarePaymentId,
          status: "succeeded",
          detail: { source: "item7-profile-edit", session_id: sessionId }
        }]);
      } catch (e) { /* non-fatal — the charge is what matters */ }
    }

    // --- Persist the session/add-on/notes changes ---
    var sessionPatch = {};
    if (newAppointmentTypeID && newAppointmentTypeID !== String(session.appointment_type_id)) {
      sessionPatch.appointment_type_id = requestedTypeID;
      sessionPatch.session_price_cents = priced.requested.sessionCents;
      var durMin = acuity.TYPE_TO_DURATION[requestedTypeID];
      if (durMin != null) sessionPatch.duration_min = durMin;
    }
    if (newDatetime) {
      sessionPatch.starts_at = newDatetime;
    }
    if (Object.keys(sessionPatch).length) {
      await sb.serviceUpdate("booking_sessions", { id: "eq." + sessionId }, sessionPatch);
    }

    // Insert each newly added add-on as its own row (add-only; existing rows untouched).
    if (addAddons.length) {
      var addonRows = addAddons.map(function (a) {
        var addonId = String(a && a.addonId);
        var qty = Number.isInteger(a && a.quantity) && a.quantity > 0 ? a.quantity : 1;
        return {
          booking_session_id: sessionId,
          addon_id: addonId,
          quantity: qty,
          unit_cents: pricing.addonUnitCents(addonId)
        };
      });
      await sb.serviceInsert("booking_session_addons", addonRows);
    }

    // Roll the net increase into the booking totals.
    if (deltaCents > 0) {
      await sb.serviceUpdate("bookings", { id: "eq." + booking.id }, {
        total_cents: (booking.total_cents || 0) + deltaCents,
        subtotal_cents: (booking.subtotal_cents || 0) + deltaCents
      });
    }

    // --- Return the updated booking ---
    var refreshed = await sb.serviceSelect(
      "bookings",
      "id=eq." + encodeURIComponent(booking.id) +
      "&select=id,status,event_intent,total_cents,subtotal_cents,payment_mode,square_card_id,created_at," +
      "booking_sessions(id,location,appointment_type_id,starts_at,duration_min,day_index,session_price_cents," +
      "booking_session_addons(id,addon_id,quantity,unit_cents,discount_cents,meta))"
    );
    return res.status(200).json({
      booking: (refreshed || [])[0] || null,
      chargedCents: decision.charge ? deltaCents : 0,
      squarePaymentId: squarePaymentId
    });
  } catch (err) {
    return res.status(500).json({ error: "Could not apply edit", detail: String(err && err.message || err) });
  }
};

module.exports.decideCharge = decideCharge;
