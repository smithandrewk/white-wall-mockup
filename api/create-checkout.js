// POST /api/create-checkout
//
// Pay → Save card → Book flow (Square Web Payments SDK, card-on-file):
//   1. Buffer-conflict pre-check for cleaning-fee bookings (unchanged)
//   2. Build Square line items (server-side pricing is authoritative)
//   3. findOrCreateCustomer → createPayment (charges the tokenized card)
//   4. createCardOnFile (saves the card for later merchant-initiated fees)
//   5. Create the Acuity appointment + buffer block + notifications
//   6. Return { success, redirect } — the client navigates to confirmation
//
// The hosted Payment Link + /api/booking-callback redirect dance is gone:
// the card form is now embedded on our page via the Web Payments SDK, the
// browser POSTs a single-use token here, and the whole charge→save→book
// sequence runs inline in this one request. On any failure after the
// charge succeeds, the payment is automatically refunded.
//
// maxDuration is bumped in vercel.json — this handler makes ~5 sequential
// Square + Acuity calls and must not be killed at the 10s default.

const {
  isValidAppointmentTypeID,
  buildSquareLineItems,
  acuityGet,
  acuityPost,
  buildAcuityAddonIDs,
  buildAcuityFields,
  buildAppointmentNotes,
  TYPE_TO_DURATION,
  CALENDAR_IDS,
  ACUITY_ADDON_IDS
} = require("./_lib/acuity");
const {
  findOrCreateCustomer,
  createPayment,
  createCardOnFile,
  refundPayment
} = require("./_lib/square");
const { buildWaiverText } = require("./_lib/waiver-text");
const { notifyOwner } = require("./notify-owner");
const { notifyCleaner } = require("./_lib/notify-cleaner");
const { notifyOwnerSMS } = require("./_lib/notify-sms");
const { alertFailure } = require("./_lib/alert");
const { captureServerEvent, flushPostHog } = require("./_lib/posthog");
const crypto = require("crypto");

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
    cleaningFee,
    squareToken,
    clientIdempotencyKey,
    consent
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
  if (!squareToken) {
    return res.status(400).json({ error: "Missing payment token" });
  }
  if (!consent || consent.cardOnFile !== true) {
    return res.status(400).json({ error: "Card-on-file authorization is required to book" });
  }

  try {
    // 0. If cleaning fee applies, check that the 2.5hr buffer after session is clear
    if (cleaningFee && cleaningFee.amount > 0) {
      var calendarID = CALENDAR_IDS[location];
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

    // 2. Canonical booking state (drives notes + notifications)
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

    const totalCents = lineItems.reduce(function (sum, li) {
      return sum + (li.amount * (li.quantity || 1));
    }, 0);

    // Idempotency: keyed on a stable client-generated booking-attempt ID
    // (falls back to the token tail). Survives tokenize retries so a
    // resubmit after a lost response never double-charges. Square dedupes
    // on this key.
    const idempotencySeed = clientIdempotencyKey || String(squareToken).slice(-16);
    const idempotencyKey = crypto.createHash("sha256")
      .update(appointmentTypeID + "|" + datetime + "|" + contact.email + "|" + idempotencySeed)
      .digest("hex");

    var customerId, payment, cardOnFile, appointment;

    try {
      // 3. Square customer (reused if the email already exists)
      customerId = await findOrCreateCustomer({
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName || "",
        phone: contact.phone || ""
      });

      // 4. Charge the tokenized card. SCA/3DS already resolved client-side
      //    and baked into squareToken.
      payment = await createPayment({
        sourceId: squareToken,
        amountCents: totalCents,
        customerId: customerId,
        idempotencyKey: idempotencyKey,
        note: "WhiteWall booking — " + contact.firstName + " " + (contact.lastName || "") + " — " + datetime
      });

      // 5. Save the card on file for later merchant-initiated fees
      //    (damage / early-late / unauthorized add-ons / cleaning).
      cardOnFile = await createCardOnFile({
        paymentId: payment.id,
        customerId: customerId,
        cardholderName: (contact.firstName + " " + (contact.lastName || "")).trim()
      });

      // 6. Acuity appointment
      var addonIDs = buildAcuityAddonIDs(bookingState.addons, bookingState.location);
      if (effectiveCleaningFee && effectiveCleaningFee.amount > 0) {
        addonIDs.push(ACUITY_ADDON_IDS["cleaning-fee"]);
      }
      var fields = buildAcuityFields(bookingState.intake || {}, bookingState.location);
      var notes = buildAppointmentNotes(bookingState);

      if (effectiveCount >= 50) {
        notes += "\n\n[CAPACITY ALERT: " + effectiveCount + " participants — follow-up required]";
      } else if (effectiveCount >= 25) {
        notes += "\n\n[HIGH TRAFFIC: " + effectiveCount + " participants]";
      }
      if (highTrafficNote) notes += "\nCustomer note: " + highTrafficNote;
      if (tmHighTrafficNote) notes += "\nTM high-traffic note: " + tmHighTrafficNote;

      // Consent proof — survives chargebacks. The hash binds to the exact
      // waiver text the customer saw, so later waiver edits don't void it.
      var consentTextHash = crypto.createHash("sha256")
        .update(buildWaiverText({
          fullName: (contact.firstName + " " + (contact.lastName || "")).trim(),
          locationSlug: location,
          signedAt: (consent && consent.timestamp) || ""
        }))
        .digest("hex");
      notes += "\n\n--- CARD-ON-FILE CONSENT (auto, do not edit) ---" +
        "\nsquare_customer_id: " + customerId +
        "\nsquare_card_id: " + cardOnFile.id +
        "\nsquare_payment_id: " + payment.id +
        "\nconsent_timestamp: " + ((consent && consent.timestamp) || "") +
        "\nconsent_ip: " + (req.headers["x-forwarded-for"] || "") +
        "\nconsent_user_agent: " + ((consent && consent.userAgent) || "") +
        "\nterms_signature: " + (termsSignature || "") +
        "\nwaiver_signed_name: " + (contact.firstName + " " + (contact.lastName || "")).trim() +
        "\nconsent_text_hash: " + consentTextHash +
        "\n--- END CONSENT ---";

      appointment = await acuityPost("/appointments?admin=true", {
        appointmentTypeID: appointmentTypeID,
        datetime: datetime,
        firstName: contact.firstName,
        lastName: contact.lastName || "",
        email: contact.email,
        phone: contact.phone || "",
        addonIDs: addonIDs,
        fields: fields,
        notes: notes,
        noPayment: true
      });

      captureServerEvent(contact.email, "booking_completed_server", {
        appointment_id: appointment.id,
        location: location,
        appointment_type_id: appointmentTypeID,
        datetime: datetime,
        square_payment_id: payment.id,
        square_card_id: cardOnFile.id,
        participants: participants || "",
        addon_count: addonIDs.length,
        has_cleaning_fee: !!(effectiveCleaningFee && effectiveCleaningFee.amount > 0)
      });

      // Cleaning fee → 2.5h cleaner buffer block (PV + TM, per Drew 2026-05-05)
      if (effectiveCleaningFee && effectiveCleaningFee.amount > 0) {
        try {
          var durMin = TYPE_TO_DURATION[String(appointmentTypeID)] || 60;
          var sEnd = new Date(new Date(datetime).getTime() + durMin * 60000);
          var bEnd = new Date(sEnd.getTime() + 150 * 60000);
          await acuityPost("/blocks", {
            start: sEnd.toISOString(),
            end: bEnd.toISOString(),
            calendarID: CALENDAR_IDS[location],
            notes: "Cleaning buffer (auto-created for booking #" + appointment.id + ")"
          });
        } catch (e) {
          console.error("buffer block failed:", e.message);
        }
      }

      // Notifications — isolated so one failure can't break a paid booking
      try { await notifyOwner(bookingState, appointment.id); } catch (e) { console.error("notifyOwner:", e.message); }
      try { await notifyCleaner(bookingState, appointment.id); } catch (e) { console.error("notifyCleaner:", e.message); }
      try { await notifyOwnerSMS(bookingState, appointment.id); } catch (e) { console.error("notifyOwnerSMS:", e.message); }
      await flushPostHog();

      var fn = encodeURIComponent(contact.firstName);
      var ln = encodeURIComponent(contact.lastName || "");
      return res.status(200).json({
        success: true,
        redirect: "/booking-confirmation?id=" + appointment.id + "&location=" + location + "&fn=" + fn + "&ln=" + ln
      });
    } catch (innerErr) {
      console.error("create-checkout payment/booking failed:", innerErr.message);
      // Charged but a later step failed → refund automatically.
      if (payment && !appointment) {
        try {
          await refundPayment(payment.id, payment.amount_money.amount, "Booking creation failed — automatic refund");
        } catch (refundErr) {
          await alertFailure("critical", "REFUND FAILED after booking error — manual refund needed", {
            payment_id: payment.id,
            amount: payment.amount_money && payment.amount_money.amount,
            customer: contact.email,
            error: refundErr.message
          });
        }
      }
      captureServerEvent(contact.email, "booking_failed_server", {
        location: location,
        error: innerErr.message,
        stage: appointment ? "after_appointment" : (cardOnFile ? "after_card" : (payment ? "after_payment" : (customerId ? "after_customer" : "before_customer"))),
        refunded: !!(payment && !appointment)
      });
      await flushPostHog();
      await alertFailure("critical", "Booking failed in create-checkout", {
        customer: (contact.firstName || "") + " " + (contact.lastName || ""),
        email: contact.email,
        location: location,
        datetime: datetime,
        stage: appointment ? "after_appointment" : (payment ? "after_payment" : "before_payment"),
        error: innerErr.message,
        refunded: !!(payment && !appointment)
      });
      return res.status(500).json({
        error: payment && !appointment
          ? "We couldn't finalize your booking and have refunded your payment. Please try again or contact us."
          : "Your card was not charged. Please try again.",
        refunded: !!(payment && !appointment)
      });
    }
  } catch (err) {
    console.error("create-checkout pre-payment error:", err.message);
    await alertFailure("alert", "create-checkout pre-payment failure", {
      location: location,
      customer: contact ? contact.email : "unknown",
      error: err.message
    });
    return res.status(500).json({ error: "Failed to start checkout. Please try again." });
  }
};
