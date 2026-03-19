// GET /api/booking-callback
//
// Step 2 of Block → Pay → Book:
//   1. Verify HMAC signature on state param (tamper protection)
//   2. Verify Square order is COMPLETED (payment confirmed)
//   3. Delete Acuity calendar block (free the hold)
//   4. Create Acuity appointment with all booking data (admin=true for notes)
//   5. Redirect to confirmation page
//
// Square appends these query params to our redirect URL:
//   checkoutId, orderId, transactionId, referenceId
//
// If Acuity appointment creation fails (slot conflict after payment),
// redirect to error page. Drew refunds manually, or we auto-refund.

const {
  verifyAndDecodeState,
  acuityPost,
  acuityDelete,
  buildAcuityAddonIDs,
  buildAcuityFields,
  buildAppointmentNotes
} = require("./_lib/acuity");
const { getOrder } = require("./_lib/square");

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
  if (!orderId) {
    return res.redirect(302, "/booking-error?reason=missing-order");
  }

  try {
    var order = await getOrder(orderId);
    if (order.state !== "COMPLETED") {
      console.error("booking-callback: order " + orderId + " state is " + order.state);
      return res.redirect(302, "/booking-error?reason=payment-incomplete");
    }
  } catch (err) {
    console.error("booking-callback: Square verification failed", err.message);
    return res.redirect(302, "/booking-error?reason=payment-verification-failed");
  }

  // 3. Delete the Acuity block (free the hold)
  if (bookingState.blockId) {
    try {
      await acuityDelete("/blocks/" + bookingState.blockId);
    } catch (err) {
      // Non-fatal — block may have been cleaned up by cron already
      console.warn("booking-callback: block delete failed (may be already cleaned up)", err.message);
    }
  }

  // 4. Create the Acuity appointment
  try {
    var addonIDs = buildAcuityAddonIDs(bookingState.addons, bookingState.location);
    var fields = buildAcuityFields(bookingState.intake || {}, bookingState.location);
    var notes = buildAppointmentNotes(bookingState);

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

    var locationSlug = bookingState.location;
    return res.redirect(302, "/booking-confirmation?id=" + appointment.id + "&location=" + locationSlug);
  } catch (err) {
    console.error("booking-callback: Acuity appointment creation failed", err.message);
    // Payment was received but appointment couldn't be created (slot conflict)
    // Drew refunds manually via Square dashboard, or we could auto-refund here
    return res.redirect(302, "/booking-error?reason=slot-conflict&orderId=" + orderId);
  }
};
