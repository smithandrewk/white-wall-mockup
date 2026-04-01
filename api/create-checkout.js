// POST /api/create-checkout
//
// Pay → Book flow:
//   1. Build Square line items from booking state (server-side pricing)
//   2. HMAC-sign the booking state into the redirect URL
//   3. Create Square Payment Link with redirect to /api/booking-callback
//   4. Return checkout URL to client for redirect
//
// No appointment or block is created at this point. The appointment is
// only created in the callback after Square confirms payment.

const {
  isValidAppointmentTypeID,
  buildSquareLineItems,
  signState,
  acuityGet,
  TYPE_TO_DURATION,
  CALENDAR_IDS
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
    foodDrinks,
    highTrafficNote,
    tmHighTrafficNote,
    waiverSigned,
    cleaningFee
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
    // 0. If cleaning fee applies, check that the 2.5hr buffer after session is clear
    if (cleaningFee && cleaningFee.amount > 0 && location === "powdersville") {
      var durationMin = TYPE_TO_DURATION[String(appointmentTypeID)] || 60;
      var sessionStart = new Date(datetime);
      var sessionEnd = new Date(sessionStart.getTime() + durationMin * 60000);
      var bufferEnd = new Date(sessionEnd.getTime() + 150 * 60000); // 2.5 hours

      // Query Acuity for appointments on PV calendar in the buffer window
      var bufferAppts = await acuityGet("/appointments", {
        calendarID: CALENDAR_IDS.powdersville,
        minDate: sessionEnd.toISOString(),
        maxDate: bufferEnd.toISOString()
      });

      // Filter out cancelled appointments
      var activeInBuffer = (bufferAppts || []).filter(function (a) {
        return !a.canceled;
      });

      if (activeInBuffer.length > 0) {
        // There's a booking in the buffer window — suggest an earlier time
        var nextAppt = activeInBuffer[0];
        var nextStart = new Date(nextAppt.datetime);
        // Suggest starting 2.5hr + session duration before the next appointment
        var suggestedStart = new Date(nextStart.getTime() - (durationMin + 150) * 60000);
        var suggestedTime = suggestedStart.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/New_York"
        });
        var nextTime = nextStart.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/New_York"
        });

        return res.status(409).json({
          error: "buffer-conflict",
          message: "Your session requires a 2.5-hour cleaning buffer afterward, but there's a booking at " + nextTime + ". Try starting at " + suggestedTime + " or earlier, or pick a different day.",
          suggestedStart: suggestedStart.toISOString(),
          nextBookingStart: nextStart.toISOString()
        });
      }
    }

    // 1. Build Square line items (server-side pricing is authoritative)
    const lineItems = buildSquareLineItems(appointmentTypeID, addons, location);

    // Add cleaning fee line item if applicable (50+ participants = $150)
    if (cleaningFee && cleaningFee.amount > 0) {
      lineItems.push({ name: "Cleaning Fee", amount: cleaningFee.amount * 100, quantity: 1 });
    }

    // 2. Sign the full booking state for the callback
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
      foodDrinks: foodDrinks != null ? foodDrinks : false,
      highTrafficNote: highTrafficNote || "",
      tmHighTrafficNote: tmHighTrafficNote || "",
      waiverSigned: true,
      cleaningFee: cleaningFee || null
    };

    const { encoded, sig } = signState(bookingState);

    // 3. Build redirect URL — Square appends orderId + transactionId
    const baseUrl = "https://white-wall-mockup.vercel.app";
    const redirectUrl = baseUrl + "/api/booking-callback?state=" + encoded + "&sig=" + sig;

    // 4. Create Square Payment Link
    const { checkoutUrl } = await createPaymentLink(
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
