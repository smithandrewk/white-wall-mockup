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
  CALENDAR_IDS
} = require("./_lib/acuity");
const { getOrder } = require("./_lib/square");
const { notifyOwner } = require("./notify-owner");
const { markInvoicePaid } = require("./_lib/quickbooks");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { state, sig, orderId } = req.query;

  // 1. Verify signature
  if (!state || !sig) {
    return res.redirect(302, "/booking-error?reason=missing-params");
  }

  var bookingState;
  try {
    bookingState = verifyAndDecodeState(state, sig);
  } catch (err) {
    console.error("booking-callback: invalid signature", err.message);
    return res.redirect(302, "/booking-error?reason=invalid-signature");
  }

  // 2. Verify payment with Square
  // In production, Square appends orderId to the redirect URL.
  // In sandbox, the testing panel doesn't append it — skip verification in sandbox.
  var isSandbox = process.env.SQUARE_ENVIRONMENT !== "production";
  if (!orderId && !isSandbox) {
    return res.redirect(302, "/booking-error?reason=missing-order");
  }

  if (orderId) {
    try {
      var order = await getOrder(orderId);
      if (order.state !== "COMPLETED" && order.state !== "OPEN") {
        console.error("booking-callback: order " + orderId + " state is " + order.state);
        return res.redirect(302, "/booking-error?reason=payment-incomplete");
      }
    } catch (err) {
      console.error("booking-callback: Square verification failed", err.message);
      return res.redirect(302, "/booking-error?reason=payment-verification-failed");
    }
  }

  // 3. Create the Acuity appointment
  try {
    var addonIDs = buildAcuityAddonIDs(bookingState.addons, bookingState.location);
    var fields = buildAcuityFields(bookingState.intake || {}, bookingState.location);
    var notes = buildAppointmentNotes(bookingState);

    // Append high-traffic / capacity alerts to notes
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
      noPayment: true  // Payment already collected via Square
    });

    // PV cleaning fee: block 2.5 hours after session for cleaners
    if (bookingState.location === "powdersville" && bookingState.cleaningFee && bookingState.cleaningFee.amount > 0) {
      try {
        var durationMin = TYPE_TO_DURATION[String(bookingState.appointmentTypeID)] || 60;
        var sessionEnd = new Date(new Date(bookingState.datetime).getTime() + durationMin * 60000);
        var bufferEnd = new Date(sessionEnd.getTime() + 150 * 60000); // 2.5 hours
        await acuityPost("/blocks", {
          start: sessionEnd.toISOString(),
          end: bufferEnd.toISOString(),
          calendarID: CALENDAR_IDS.powdersville,
          notes: "Cleaning buffer (auto-created for booking #" + appointment.id + ")"
        });
      } catch (err) {
        console.error("booking-callback: cleaning buffer block failed", err.message);
      }
    }

    // Send owner notification for high-traffic bookings
    try {
      await notifyOwner(bookingState, appointment.id);
    } catch (err) {
      console.error("booking-callback: notifyOwner error", err.message);
    }

    // Redirect now — customer sees confirmation page while QBO processes
    var locationSlug = bookingState.location;
    res.redirect(302, "/booking-confirmation?id=" + appointment.id + "&location=" + locationSlug);

    // Mark QuickBooks invoice as paid (runs after redirect sent but before function exits)
    // This takes up to 30s due to Acuity→QBO sync delay, so we do it last
    try {
      await markInvoicePaid(bookingState);
    } catch (err) {
      console.error("booking-callback: markInvoicePaid error", err.message);
    }
  } catch (err) {
    console.error("booking-callback: Acuity appointment creation failed", err.message);
    return res.redirect(302, "/booking-error?reason=slot-conflict&orderId=" + (orderId || ""));
  }
};
