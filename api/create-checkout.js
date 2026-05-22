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
const { stagingCalendarID } = require("./_lib/env");
const { alertFailure } = require("./_lib/alert");

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
    emailAcknowledgment,
    termsSignature,
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
    // 0. If cleaning fee applies, check that the 2.5hr buffer after session is clear.
    // On staging, route the conflict check to the STAGING calendar so staging
    // tests don't bump into real prod bookings (and vice-versa).
    if (cleaningFee && cleaningFee.amount > 0) {
      var calendarID = stagingCalendarID() || CALENDAR_IDS[location];
      var durationMin = TYPE_TO_DURATION[String(appointmentTypeID)] || 60;
      var sessionStart = new Date(datetime);
      var sessionEnd = new Date(sessionStart.getTime() + durationMin * 60000);
      var bufferEnd = new Date(sessionEnd.getTime() + 150 * 60000); // 2.5 hours

      // Query Acuity for appointments AND blocks in the buffer window
      var bufferAppts = await acuityGet("/appointments", {
        calendarID: calendarID,
        minDate: sessionEnd.toISOString(),
        maxDate: bufferEnd.toISOString()
      });
      var bufferBlocks = await acuityGet("/blocks", {
        calendarID: calendarID,
        minDate: sessionEnd.toISOString(),
        maxDate: bufferEnd.toISOString()
      });

      // Combine and filter — anything that occupies time in the buffer window
      var activeInBuffer = (bufferAppts || []).filter(function (a) {
        if (a.canceled) return false;
        var apptStart = new Date(a.datetime).getTime();
        if (apptStart >= bufferEnd.getTime()) return false;
        return true;
      }).map(function (a) { return { datetime: a.datetime, endTime: a.endTime, type: "appointment" }; });

      (bufferBlocks || []).forEach(function (b) {
        var blockStart = new Date(b.start).getTime();
        if (blockStart < bufferEnd.getTime()) {
          activeInBuffer.push({ datetime: b.start, endTime: b.end, type: "block" });
        }
      });

      if (activeInBuffer.length > 0) {
        var nextAppt = activeInBuffer[0];
        var nextStart = new Date(nextAppt.datetime);

        // Fetch all appointments AND blocks for this day to validate suggested slots
        var date = datetime.slice(0, 10);
        var dayStart = date + "T00:00:00";
        var dayEnd = date + "T23:59:59";
        var allDayAppts = await acuityGet("/appointments", {
          calendarID: calendarID,
          minDate: dayStart,
          maxDate: dayEnd
        });
        var allDayBlocks = await acuityGet("/blocks", {
          calendarID: calendarID,
          minDate: dayStart,
          maxDate: dayEnd
        });
        // Combine appointments and blocks into one list of occupied time ranges
        // Note: Acuity endTime is a display string ("4:00pm"), not ISO — calculate from datetime + duration
        var allDayActive = (allDayAppts || []).filter(function (a) { return !a.canceled; })
          .map(function (a) {
            var apptDur = Number(a.duration) || 60;
            var endMs = new Date(a.datetime).getTime() + apptDur * 60000;
            return { start: a.datetime, end: new Date(endMs).toISOString() };
          });
        (allDayBlocks || []).forEach(function (b) {
          allDayActive.push({ start: b.start, end: b.end });
        });

        // Fetch actual available time slots
        var availTimes = await acuityGet("/availability/times", {
          appointmentTypeID: appointmentTypeID,
          date: date,
          timezone: "America/New_York"
        });

        // Find valid slots where the entire buffer window is clear
        // Check both earlier and later times relative to the requested slot
        function isBufferClear(candidateTime) {
          var cStart = new Date(candidateTime);
          var cEnd = new Date(cStart.getTime() + durationMin * 60000);
          var cBufferEnd = new Date(cEnd.getTime() + 150 * 60000);
          for (var j = 0; j < allDayActive.length; j++) {
            var aStart = new Date(allDayActive[j].start).getTime();
            var aEnd = new Date(allDayActive[j].end).getTime();
            // Conflict if the occupied range overlaps the buffer window at all
            // (occupied starts before buffer ends AND occupied ends after buffer starts)
            if (aStart < cBufferEnd.getTime() && aEnd > cEnd.getTime()) {
              return false;
            }
          }
          return true;
        }

        var earlierSlot = null;
        var laterSlot = null;
        for (var i = (availTimes || []).length - 1; i >= 0; i--) {
          var cTime = new Date(availTimes[i].time).getTime();
          if (cTime < sessionStart.getTime() && isBufferClear(availTimes[i].time)) {
            earlierSlot = availTimes[i].time;
            break;
          }
        }
        for (var k = 0; k < (availTimes || []).length; k++) {
          var kTime = new Date(availTimes[k].time).getTime();
          if (kTime > sessionStart.getTime() && isBufferClear(availTimes[k].time)) {
            laterSlot = availTimes[k].time;
            break;
          }
        }

        var nextTime = nextStart.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/New_York"
        });

        if (earlierSlot || laterSlot) {
          var options = [];
          if (earlierSlot) options.push({ time: earlierSlot, label: new Date(earlierSlot).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) });
          if (laterSlot) options.push({ time: laterSlot, label: new Date(laterSlot).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) });

          var msg = "Your session requires a 2.5-hour cleaning buffer afterward, but there\u2019s a booking at " + nextTime + ".";
          return res.status(409).json({
            error: "buffer-conflict",
            message: msg,
            options: options,
            nextBookingStart: nextStart.toISOString()
          });
        } else {
          return res.status(409).json({
            error: "buffer-conflict",
            message: "Your session requires a 2.5-hour cleaning buffer afterward, but there\u2019s a booking at " + nextTime + " and no other time fits the buffer today. Please pick a different day.",
            options: [],
            nextBookingStart: nextStart.toISOString()
          });
        }
      }
    }

    // 1. Build Square line items (server-side pricing is authoritative)
    const lineItems = buildSquareLineItems(appointmentTypeID, addons, location);

    // Server-side cleaning fee fallback. The client computes cleaningFee, but
    // a parser bug there (e.g. customer typing "35 +" instead of a number) can
    // silently miss the threshold. Recompute and override if missing.
    // Real incident: Molly Hensley booked Nov 14 2026 with "35 +" — client
    // didn't apply the fee. Server-side guard prevents this.
    function parseCount(v) {
      if (v == null) return 0;
      const m = String(v).match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    }
    const intakeParticipants = (intake && intake.participants) || "";
    const effectiveCount = Math.max(parseCount(participants), parseCount(intakeParticipants));
    let effectiveCleaningFee = cleaningFee;
    if (!effectiveCleaningFee || !effectiveCleaningFee.amount) {
      if (effectiveCount >= 50) {
        effectiveCleaningFee = { label: "Cleaning fee", amount: 150, note: "" };
        console.warn("create-checkout: server-applied cleaning fee (50+ ppl)", { count: effectiveCount, customer: contact && contact.email });
      } else if (effectiveCount >= 35 && eventIntent === "yes") {
        effectiveCleaningFee = { label: "Cleaning fee", amount: 150, note: "Our team may reach out to waive this fee based on your booking details." };
        console.warn("create-checkout: server-applied cleaning fee (35+ event)", { count: effectiveCount, customer: contact && contact.email });
      }
    }

    if (effectiveCleaningFee && effectiveCleaningFee.amount > 0) {
      lineItems.push({ name: "Cleaning Fee", amount: effectiveCleaningFee.amount * 100, quantity: 1 });
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
      emailAcknowledgment: emailAcknowledgment || "",
      termsSignature: termsSignature || "",
      waiverSigned: true,
      cleaningFee: effectiveCleaningFee || null
    };

    const { encoded, sig } = signState(bookingState);

    // 3. Build redirect URL — Square appends orderId + transactionId.
    // Derive the base URL from the inbound request so prod, staging, and
    // preview deploys each redirect back to themselves. Square requires
    // an absolute https URL.
    const inboundHost = req.headers["x-forwarded-host"] || req.headers.host || "white-wall-mockup.vercel.app";
    const baseUrl = "https://" + inboundHost;
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
    await alertFailure("alert", "Square checkout creation failed", {
      location: location,
      customer: contact ? contact.email : "unknown",
      error: err.message
    });
    return res.status(500).json({ error: "Failed to create checkout" });
  }
};
