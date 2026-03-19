// POST /api/create-checkout
//
// Step 1 of Block → Pay → Book:
//   1. Create Acuity calendar block (holds the time slot, no emails)
//   2. Build Square line items from booking state (server-side pricing)
//   3. HMAC-sign the booking state + block ID into the redirect URL
//   4. Create Square Payment Link with redirect to /api/booking-callback
//   5. Return checkout URL to client for redirect
//
// The block prevents double-booking while the customer is on Square's page.
// If they abandon, the cron job cleans up the block + payment link.

const {
  acuityPost,
  isValidAppointmentTypeID,
  TYPE_TO_CALENDAR,
  TYPE_TO_DURATION,
  buildSquareLineItems,
  signState
} = require("./_lib/acuity");
const { createPaymentLink } = require("./_lib/square");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const {
    appointmentTypeID,
    datetime,
    location,
    contact,
    intake,
    addons,
    eventIntent,
    participants,
    eventDescription,
    waiverSigned
  } = body;

  // Validate
  if (!appointmentTypeID || !isValidAppointmentTypeID(appointmentTypeID)) {
    return res.status(400).json({ error: "Invalid appointmentTypeID" });
  }
  if (!datetime) {
    return res.status(400).json({ error: "Missing datetime" });
  }
  if (!location || !["powdersville", "taylors-mill"].includes(location)) {
    return res.status(400).json({ error: "Invalid location" });
  }
  if (!contact || !contact.firstName || !contact.email) {
    return res.status(400).json({ error: "Missing contact info" });
  }
  if (!waiverSigned) {
    return res.status(400).json({ error: "Waiver must be signed" });
  }

  try {
    // 1. Create Acuity block to hold the slot
    const calendarID = TYPE_TO_CALENDAR[String(appointmentTypeID)];
    const durationMin = TYPE_TO_DURATION[String(appointmentTypeID)] || 60;
    const startDate = new Date(datetime);
    const endDate = new Date(startDate.getTime() + durationMin * 60000);

    const block = await acuityPost("/blocks", {
      start: datetime,
      end: endDate.toISOString(),
      calendarID: calendarID,
      notes: "Payment hold — whitewallstudios.co"
    });

    // 2. Build Square line items (server-side pricing is authoritative)
    const lineItems = buildSquareLineItems(appointmentTypeID, addons, location);

    // 3. Sign the full booking state for the callback
    const bookingState = {
      appointmentTypeID,
      datetime,
      location,
      contact,
      intake: intake || {},
      addons: addons || {},
      eventIntent: eventIntent || "no",
      participants: participants || "",
      eventDescription: eventDescription || "",
      waiverSigned: true,
      blockId: block.id
    };

    const { encoded, sig } = signState(bookingState);

    // 4. Build redirect URL — Square appends orderId + transactionId
    // Use the production alias, not VERCEL_URL (which points to preview deployments)
    const baseUrl = "https://white-wall-mockup.vercel.app";
    const redirectUrl = baseUrl + "/api/booking-callback?state=" + encoded + "&sig=" + sig;

    // 5. Create Square Payment Link
    const { checkoutUrl, paymentLinkId } = await createPaymentLink(
      lineItems,
      redirectUrl,
      contact.email
    );

    return res.status(200).json({ checkoutUrl });
  } catch (err) {
    console.error("create-checkout error:", err.message);
    return res.status(500).json({ error: "Failed to create checkout" });
  }
};
