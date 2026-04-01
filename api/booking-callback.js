// GET /api/booking-callback
//
// Pay → Book callback:
//   1. Verify HMAC signature on state param (tamper protection)
//   2. Verify Square order is paid (payment confirmed)
//   3. Create Acuity appointment with all booking data
//   4. Redirect to confirmation page
//
// Square appends these query params to our redirect URL:
//   checkoutId, orderId, transactionId, referenceId
//
// If Acuity appointment creation fails (slot conflict after payment),
// redirect to error page. Drew refunds manually via Square Dashboard.

const {
  verifyAndDecodeState,
  acuityPost,
  buildAcuityAddonIDs,
  buildAcuityFields,
  buildAppointmentNotes,
  TYPE_TO_DURATION,
  CALENDAR_IDS,
  ACUITY_ADDON_IDS
} = require("./_lib/acuity");
const { getOrder } = require("./_lib/square");
const { notifyOwner } = require("./notify-owner");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Collect structured logs — returned as JSON when ?debug=1
  var logs = [];
  function log(step, msg, data) {
    var entry = { step: step, msg: msg, time: new Date().toISOString() };
    if (data) entry.data = data;
    logs.push(entry);
    console.log("booking-callback [" + step + "]: " + msg + (data ? " " + JSON.stringify(data) : ""));
  }

  var debug = req.query.debug === "1" || process.env.BOOKING_DEBUG === "1";
  const { state, sig, orderId } = req.query;

  // 1. Verify signature
  if (!state || !sig) {
    log("signature", "missing state or sig params");
    if (debug) return res.status(400).json({ error: "missing-params", logs: logs });
    return res.redirect(302, "/booking-error?reason=missing-params");
  }

  var bookingState;
  try {
    bookingState = verifyAndDecodeState(state, sig);
    log("signature", "verified OK", { location: bookingState.location, contact: bookingState.contact.firstName + " " + (bookingState.contact.lastName || "") });
  } catch (err) {
    log("signature", "FAILED: " + err.message);
    if (debug) return res.status(400).json({ error: "invalid-signature", logs: logs });
    return res.redirect(302, "/booking-error?reason=invalid-signature");
  }

  // 2. Verify payment with Square
  var isSandbox = process.env.SQUARE_ENVIRONMENT !== "production";
  if (!orderId && !isSandbox) {
    log("square", "missing orderId in production");
    if (debug) return res.status(400).json({ error: "missing-order", logs: logs });
    return res.redirect(302, "/booking-error?reason=missing-order");
  }

  if (orderId) {
    try {
      var order = await getOrder(orderId);
      log("square", "order verified", { orderId: orderId, state: order.state });
      if (order.state !== "COMPLETED" && order.state !== "OPEN") {
        log("square", "order not paid: " + order.state);
        if (debug) return res.status(400).json({ error: "payment-incomplete", logs: logs });
        return res.redirect(302, "/booking-error?reason=payment-incomplete");
      }
    } catch (err) {
      log("square", "verification FAILED: " + err.message);
      if (debug) return res.status(500).json({ error: "payment-verification-failed", logs: logs });
      return res.redirect(302, "/booking-error?reason=payment-verification-failed");
    }
  } else {
    log("square", "sandbox mode — skipping order verification");
  }

  // 3. Create the Acuity appointment
  try {
    var addonIDs = buildAcuityAddonIDs(bookingState.addons, bookingState.location);

    // Add cleaning fee add-on to Acuity appointment (so it shows on QBO invoice)
    if (bookingState.cleaningFee && bookingState.cleaningFee.amount > 0) {
      addonIDs.push(ACUITY_ADDON_IDS["cleaning-fee"]);
      log("acuity", "cleaning fee add-on attached", { amount: bookingState.cleaningFee.amount });
    }

    var fields = buildAcuityFields(bookingState.intake || {}, bookingState.location);
    var notes = buildAppointmentNotes(bookingState);

    var participantCount = Number(bookingState.participants) || 0;
    if (participantCount >= 50) {
      notes += "\n\n[CAPACITY ALERT: " + participantCount + " participants — follow-up required]";
    } else if (participantCount >= 25) {
      notes += "\n\n[HIGH TRAFFIC: " + participantCount + " participants]";
    }
    if (bookingState.highTrafficNote) {
      notes += "\nCustomer note: " + bookingState.highTrafficNote;
    }
    if (bookingState.tmHighTrafficNote) {
      notes += "\nTM high-traffic note: " + bookingState.tmHighTrafficNote;
    }

    log("acuity", "creating appointment", { typeID: bookingState.appointmentTypeID, datetime: bookingState.datetime, addons: addonIDs.length });

    var appointment = await acuityPost("/appointments?admin=true", {
      appointmentTypeID: bookingState.appointmentTypeID,
      datetime: bookingState.datetime,
      firstName: bookingState.contact.firstName,
      lastName: bookingState.contact.lastName || "",
      email: bookingState.contact.email,
      phone: bookingState.contact.phone || "",
      addonIDs: addonIDs,
      fields: fields,
      notes: notes,
      noPayment: true
    });

    log("acuity", "appointment created", { id: appointment.id });

    // PV cleaning fee: block 2.5 hours after session for cleaners
    if (bookingState.location === "powdersville" && bookingState.cleaningFee && bookingState.cleaningFee.amount > 0) {
      try {
        var durationMin = TYPE_TO_DURATION[String(bookingState.appointmentTypeID)] || 60;
        var sessionEnd = new Date(new Date(bookingState.datetime).getTime() + durationMin * 60000);
        var bufferEnd = new Date(sessionEnd.getTime() + 150 * 60000);
        await acuityPost("/blocks", {
          start: sessionEnd.toISOString(),
          end: bufferEnd.toISOString(),
          calendarID: CALENDAR_IDS.powdersville,
          notes: "Cleaning buffer (auto-created for booking #" + appointment.id + ")"
        });
        log("cleaning", "buffer block created");
      } catch (err) {
        log("cleaning", "buffer block FAILED: " + err.message);
      }
    }

    // Send owner notification for high-traffic bookings (35+ participants)
    try {
      var participantsForNotify = Number(bookingState.participants) || 0;
      if (participantsForNotify >= 35) {
        await notifyOwner(bookingState, appointment.id);
        log("notify", "owner notification sent", { participants: participantsForNotify });
      } else {
        log("notify", "skipped (participants: " + participantsForNotify + ", threshold: 35)");
      }
    } catch (err) {
      log("notify", "owner notification FAILED: " + err.message);
    }

    // QBO invoice marking happens from the confirmation page via /api/qbo-mark-paid
    // (separate function invocation so Vercel doesn't kill it after redirect)

    log("done", "all steps complete — redirecting");

    if (debug) return res.status(200).json({ success: true, appointmentId: appointment.id, logs: logs });

    var locationSlug = bookingState.location;
    var firstName = encodeURIComponent(bookingState.contact.firstName);
    var lastName = encodeURIComponent(bookingState.contact.lastName || "");
    return res.redirect(302, "/booking-confirmation?id=" + appointment.id + "&location=" + locationSlug + "&fn=" + firstName + "&ln=" + lastName);
  } catch (err) {
    log("acuity", "appointment creation FAILED: " + err.message);
    if (debug) return res.status(500).json({ error: "appointment-creation-failed", logs: logs });
    return res.redirect(302, "/booking-error?reason=slot-conflict&orderId=" + (orderId || ""));
  }
};
