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
const { isStaging, stagingSinkEmail, stagingCalendarID } = require("./_lib/env");
const { notifyOwner } = require("./notify-owner");
const { notifyCleaner } = require("./_lib/notify-cleaner");
const { notifyOwnerSMS } = require("./_lib/notify-sms");
const { alertFailure } = require("./_lib/alert");
const { captureServerEvent, flushPostHog } = require("./_lib/posthog");

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
      captureServerEvent(bookingState.contact.email, "payment_verified_server", {
        order_id: orderId,
        order_state: order.state,
        location: bookingState.location
      });
      if (order.state !== "COMPLETED" && order.state !== "OPEN") {
        log("square", "order not paid: " + order.state);
        await alertFailure("alert", "Square order not in paid state", {
          orderId: orderId,
          orderState: order.state,
          customer: bookingState.contact ? bookingState.contact.email : "unknown"
        });
        if (debug) return res.status(400).json({ error: "payment-incomplete", logs: logs });
        return res.redirect(302, "/booking-error?reason=payment-incomplete");
      }
    } catch (err) {
      log("square", "verification FAILED: " + err.message);
      await alertFailure("alert", "Square payment verification failed", {
        orderId: orderId,
        error: err.message,
        customer: bookingState.contact ? bookingState.contact.email : "unknown"
      });
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

    // Staging guards: stamp the client name + notes, override email to a
    // sink (Acuity's confirmation email is unsuppressible — better it land
    // at our sink than at whatever the form said). Force calendarID to
    // the STAGING calendar so the appointment doesn't land on Powdersville
    // or Taylor's Mill. No-op in production.
    var stagedFirstName = bookingState.contact.firstName;
    var stagedEmail = bookingState.contact.email;
    var stagedNotes = notes;
    var stagingCalID = stagingCalendarID();
    var stagingMocked = isStaging() && !stagingCalID;
    if (isStaging()) {
      stagedFirstName = "[STAGING] " + stagedFirstName;
      stagedEmail = stagingSinkEmail();
      stagedNotes = "*** STAGING BOOKING — DO NOT FULFILL ***\n" +
        "Original email: " + bookingState.contact.email + "\n\n" +
        notes;
      log("staging", "applying staging guards", {
        calendarID: stagingCalID || "(unset — will mock)",
        email_sink: stagedEmail
      });
    }

    log("acuity", "creating appointment", { typeID: bookingState.appointmentTypeID, datetime: bookingState.datetime, addons: addonIDs.length });

    var appointment;
    if (stagingMocked) {
      // Fail-safe: staging with no STAGING calendar configured → mock the
      // write entirely instead of polluting a prod calendar.
      appointment = { id: "staging-mock-" + Date.now() };
      log("staging", "ACUITY_STAGING_CALENDAR_ID unset — mocking Acuity write", {
        would_have_sent: {
          appointmentTypeID: bookingState.appointmentTypeID,
          datetime: bookingState.datetime,
          firstName: stagedFirstName,
          email: stagedEmail,
          addonIDs: addonIDs,
          notes_length: stagedNotes.length
        }
      });
    } else {
      // ALWAYS pass calendarID explicitly. Appointment types are members of
      // multiple calendars (e.g. Drew added the STAGING calendar to the prod
      // types), and Acuity picks the FIRST calendar in the type's calendarIDs
      // array when none is specified — which silently misroutes bookings to
      // the wrong calendar. The 2026-05-22 Lisa Brantly incident landed a
      // real prod booking on STAGING because of this default behavior.
      var calendarID = stagingCalID || CALENDAR_IDS[bookingState.location];
      var acuityBody = {
        appointmentTypeID: bookingState.appointmentTypeID,
        datetime: bookingState.datetime,
        calendarID: calendarID,
        firstName: stagedFirstName,
        lastName: bookingState.contact.lastName || "",
        email: stagedEmail,
        phone: bookingState.contact.phone || "",
        addonIDs: addonIDs,
        fields: fields,
        notes: stagedNotes,
        noPayment: true
      };
      appointment = await acuityPost("/appointments?admin=true", acuityBody);
    }

    log("acuity", "appointment created", { id: appointment.id });
    captureServerEvent(bookingState.contact.email, "booking_completed_server", {
      appointment_id: appointment.id,
      location: bookingState.location,
      appointment_type_id: bookingState.appointmentTypeID,
      datetime: bookingState.datetime,
      order_id: orderId || "",
      participants: bookingState.participants || "",
      addon_count: addonIDs.length,
      has_cleaning_fee: !!(bookingState.cleaningFee && bookingState.cleaningFee.amount > 0)
    });

    // Cleaning fee: block 2.5 hours after session for April. Fires at PV and
    // TM — Drew confirmed (2026-05-05) that April covers both locations.
    // Skipped in staging-mock mode (no real appointment was created).
    if (bookingState.cleaningFee && bookingState.cleaningFee.amount > 0 && !stagingMocked) {
      try {
        var durationMin = TYPE_TO_DURATION[String(bookingState.appointmentTypeID)] || 60;
        var sessionEnd = new Date(new Date(bookingState.datetime).getTime() + durationMin * 60000);
        var bufferEnd = new Date(sessionEnd.getTime() + 150 * 60000);
        await acuityPost("/blocks", {
          start: sessionEnd.toISOString(),
          end: bufferEnd.toISOString(),
          calendarID: stagingCalID || CALENDAR_IDS[bookingState.location],
          notes: (isStaging() ? "[STAGING] " : "") + "Cleaning buffer (auto-created for booking #" + appointment.id + ")"
        });
        log("cleaning", "buffer block created", { location: bookingState.location });
      } catch (err) {
        log("cleaning", "buffer block FAILED: " + err.message);
      }
    }

    // Send confirmation emails (every booking — owner + customer)
    try {
      await notifyOwner(bookingState, appointment.id);
      log("notify", "confirmation emails sent");
    } catch (err) {
      log("notify", "confirmation email FAILED: " + err.message);
    }

    // Notify cleaner (April) when a cleaning fee + buffer is in play
    try {
      await notifyCleaner(bookingState, appointment.id);
      log("notify", "cleaner notification handled");
    } catch (err) {
      log("notify", "cleaner notification FAILED: " + err.message);
    }

    // SMS Drew via Blue Bubbles (35+ event OR 3+ hour shoot)
    try {
      await notifyOwnerSMS(bookingState, appointment.id);
      log("notify", "owner SMS handled");
    } catch (err) {
      log("notify", "owner SMS FAILED: " + err.message);
    }

    // QBO invoice marking happens from the confirmation page via /api/qbo-mark-paid
    // (separate function invocation so Vercel doesn't kill it after redirect)

    log("done", "all steps complete — redirecting");
    await flushPostHog();

    if (debug) return res.status(200).json({ success: true, appointmentId: appointment.id, logs: logs });

    var locationSlug = bookingState.location;
    var firstName = encodeURIComponent(bookingState.contact.firstName);
    var lastName = encodeURIComponent(bookingState.contact.lastName || "");
    return res.redirect(302, "/booking-confirmation?id=" + appointment.id + "&location=" + locationSlug + "&fn=" + firstName + "&ln=" + lastName);
  } catch (err) {
    log("acuity", "appointment creation FAILED: " + err.message);
    captureServerEvent(bookingState.contact.email, "booking_failed_server", {
      location: bookingState.location,
      order_id: orderId || "",
      error: err.message,
      failure_type: "appointment-creation-failed"
    });
    await flushPostHog();
    var contact = bookingState.contact || {};
    await alertFailure("critical", "Appointment creation failed — manual refund needed", {
      customer: (contact.firstName || "") + " " + (contact.lastName || ""),
      email: contact.email || "",
      phone: contact.phone || "",
      location: bookingState.location,
      datetime: bookingState.datetime,
      orderId: orderId || "",
      error: err.message,
      action: "Refund via Square Dashboard, then manually create appointment in Acuity if slot is still open"
    });
    if (debug) return res.status(500).json({ error: "appointment-creation-failed", logs: logs });
    return res.redirect(302, "/booking-error?reason=slot-conflict&orderId=" + (orderId || ""));
  }
};
