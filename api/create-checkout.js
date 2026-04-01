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

      // Filter out cancelled appointments and appointments starting exactly at buffer end
      // (an appointment starting at bufferEnd is fine — cleaners finish right as it begins)
      var activeInBuffer = (bufferAppts || []).filter(function (a) {
        if (a.canceled) return false;
        var apptStart = new Date(a.datetime).getTime();
        if (apptStart >= bufferEnd.getTime()) return false;
        return true;
      });

      if (activeInBuffer.length > 0) {
        var nextAppt = activeInBuffer[0];
        var nextStart = new Date(nextAppt.datetime);
        // Latest possible start: next appointment minus session duration minus 2.5hr buffer
        var latestStart = new Date(nextStart.getTime() - (durationMin + 150) * 60000);

        // Fetch actual available time slots for this day
        var date = datetime.slice(0, 10);
        var availTimes = await acuityGet("/availability/times", {
          appointmentTypeID: appointmentTypeID,
          date: date,
          timezone: "America/New_York"
        });

        // Find the latest available slot that starts at or before latestStart
        var suggestedSlot = null;
        for (var i = 0; i < (availTimes || []).length; i++) {
          var slotTime = new Date(availTimes[i].time);
          if (slotTime <= latestStart) {
            suggestedSlot = availTimes[i].time;
          }
        }

        var nextTime = nextStart.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/New_York"
        });

        if (suggestedSlot) {
          var suggestedDisplay = new Date(suggestedSlot).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: "America/New_York"
          });
          return res.status(409).json({
            error: "buffer-conflict",
            message: "Your session requires a 2.5-hour cleaning buffer afterward, but there\u2019s a booking at " + nextTime + ". We can move you to " + suggestedDisplay + " to fit the buffer.",
            suggestedStart: suggestedSlot,
            nextBookingStart: nextStart.toISOString()
          });
        } else {
          return res.status(409).json({
            error: "buffer-conflict",
            message: "Your session requires a 2.5-hour cleaning buffer afterward, but there\u2019s a booking at " + nextTime + " and no earlier time slot fits. Please pick a different day.",
            suggestedStart: null,
            nextBookingStart: nextStart.toISOString()
          });
        }
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
