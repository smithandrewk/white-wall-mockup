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
  ACUITY_ADDON_IDS,
  isStartBeforeEarliest,
  isEndAfterClose,
  SETUP_CREW_PLACEMENT_ITEMS
} = require("./_lib/acuity");
const { computeCart } = require("./_lib/cart");
const pricingShared = require("../scripts/pricing-shared");
const {
  findOrCreateCustomer,
  createPayment,
  createCardOnFile,
  refundPayment
} = require("./_lib/square");
const { validateCoupon, sessionDiscountCents } = require("./_lib/coupons");
const { isStaging, stagingSinkEmail, stagingCalendarID } = require("./_lib/env");
const { buildWaiverText } = require("./_lib/waiver-text");
const { notifyOwner } = require("./notify-owner");
const { notifyCleaner } = require("./_lib/notify-cleaner");
const { notifyOwnerSMS } = require("./_lib/notify-sms");
const { notifyCustomerSMS } = require("./_lib/notify-customer-sms");
const { alertFailure } = require("./_lib/alert");
const { captureServerEvent, flushPostHog } = require("./_lib/posthog");
const sbDB = require("./_lib/supabase");
const { enrollBooking } = require("./_lib/campaign-enroll");
const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};

  // V3 item 2 — multi-session cart path. ADDITIVE: when req.body.sessions is a
  // non-empty array we route to the cart handler below; the single-session path
  // (everything after this guard) is byte-for-byte unchanged. When `sessions`
  // is absent the original flow runs exactly as before.
  if (Array.isArray(body.sessions) && body.sessions.length > 0) {
    return handleCartCheckout(req, res, body);
  }

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
    cardholderName,
    squareToken,
    clientIdempotencyKey,
    consent,
    couponCode
  } = body;

  // Cardholder name as entered on the payment panel ("Name on card"). May
  // differ from the booker (business card, spouse, planner). Falls back to
  // the booker name when blank. Used only for the Square card-on-file label
  // and payment note — the Acuity appointment still uses contact first/last.
  var cardLabelName =
    (typeof cardholderName === "string" && cardholderName.trim()) ||
    (contact ? (contact.firstName + " " + (contact.lastName || "")).trim() : "");

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
  // Earliest-start floor (e.g. 8h Flagship must start >= 12:30pm ET). Server is
  // authoritative — reject a too-early start even if the client UI is bypassed.
  if (isStartBeforeEarliest(appointmentTypeID, datetime)) {
    return res.status(400).json({ error: "Selected start time is before the earliest allowed for this session" });
  }
  // Studio close cap (V3 item 2): the session must not END after 22:30 ET. Server
  // is authoritative — reject a too-late end even if the client UI is bypassed.
  if (isEndAfterClose(appointmentTypeID, datetime)) {
    return res.status(400).json({ error: "Selected start time would end after the studio closes" });
  }
  // Studio Setup Crew (V3 item 5): events-only, and every placement must be
  // chosen. Guard server-side so a crafted POST can't bypass the event gate or
  // omit the placement choices Drew relies on.
  if (addons && addons["setup-crew"] && addons["setup-crew"].selected) {
    if (eventIntent !== "yes") {
      return res.status(400).json({ error: "Studio Setup Crew is only available for event bookings" });
    }
    var crewPlacements = addons["setup-crew"].placements || {};
    for (var pi = 0; pi < SETUP_CREW_PLACEMENT_ITEMS.length; pi++) {
      var pItem = SETUP_CREW_PLACEMENT_ITEMS[pi];
      var chosen = crewPlacements[pItem.id];
      if (!chosen || pItem.options.indexOf(chosen) === -1) {
        return res.status(400).json({ error: "Studio Setup Crew requires a placement choice for each item" });
      }
    }
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

    // Server-side cleaning fee — authoritative. The flat $150 fee applies
    // automatically whenever effectiveCount >= 35 (per Drew 2026-06-10).
    // The server recomputes from participant counts rather than trusting the
    // client-sent cleaningFee, so a parser bug or stale client can't change
    // the total. Real incident: Molly Hensley booked Nov 14 2026 with "35 +"
    // — client didn't apply the fee. Server-side guard prevents this.
    function parseCount(v) {
      if (v == null) return 0;
      const m = String(v).match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    }
    const intakeParticipants = (intake && intake.participants) || "";
    const effectiveCount = Math.max(parseCount(participants), parseCount(intakeParticipants));
    let effectiveCleaningFee = null;
    if (effectiveCount >= 35) {
      effectiveCleaningFee = { label: "Cleaning fee", amount: 150, note: "" };
      if (!cleaningFee || !cleaningFee.amount) {
        console.warn("create-checkout: server-applied cleaning fee (35+ ppl)", { count: effectiveCount, customer: contact && contact.email });
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

    let totalCents = lineItems.reduce(function (sum, li) {
      return sum + (li.amount * (li.quantity || 1));
    }, 0);

    // Promo code (#20, Phase 1 MVP) — the discount is RE-VALIDATED here and the
    // amount is RE-COMPUTED server-side. The client may send a code but never a
    // discount amount, so a forged client discount is ignored entirely. The
    // discount applies ONLY to the raw session line item (the catalog item that
    // buildSquareLineItems puts first), never add-ons or the cleaning fee. This
    // whole block is isolated and fail-open: any problem leaves totalCents
    // exactly as it was (a normal, no-coupon booking is never affected).
    let appliedCoupon = null;
    let couponDiscountCents = 0;
    if (couponCode && String(couponCode).trim()) {
      try {
        var couponResult = await validateCoupon(couponCode, { location: location });
        if (couponResult.valid) {
          // Session line item = the one carrying the catalog object id; fall
          // back to the first item, which buildSquareLineItems guarantees is
          // the session. Add-on items never carry catalogObjectId.
          var sessionItem = null;
          for (var ci = 0; ci < lineItems.length; ci++) {
            if (lineItems[ci].catalogObjectId) { sessionItem = lineItems[ci]; break; }
          }
          if (!sessionItem) sessionItem = lineItems[0];
          var sessionAmount = sessionItem ? (sessionItem.amount * (sessionItem.quantity || 1)) : 0;
          couponDiscountCents = sessionDiscountCents(sessionAmount, couponResult.percentOff);
          // Clamp defensively — never discount more than the session, never below 0.
          if (couponDiscountCents > sessionAmount) couponDiscountCents = sessionAmount;
          if (couponDiscountCents < 0) couponDiscountCents = 0;
          // Defensive floor (belt-and-suspenders): Square rejects a $0 charge,
          // so the charged total must never drop below 1 cent. The 99% cap in
          // coupons.js already prevents this in the realistic case (99% of a
          // $130 session still leaves ~$1.30), but this guard means no future or
          // misconfigured coupon can ever post a $0 charge. If the discount would
          // zero/negative the total, clamp the DISCOUNT so totalCents stays >= 1.
          if (couponDiscountCents >= totalCents) {
            console.warn("create-checkout: coupon discount would zero the total — clamping to keep totalCents >= 1", {
              code: couponResult.code,
              totalCents: totalCents,
              requestedDiscountCents: couponDiscountCents
            });
            couponDiscountCents = totalCents - 1;
          }
          if (couponDiscountCents < 0) couponDiscountCents = 0;
          if (couponDiscountCents > 0) {
            totalCents = totalCents - couponDiscountCents;
            appliedCoupon = {
              code: couponResult.code,
              percentOff: couponResult.percentOff,
              discountCents: couponDiscountCents
            };
          }
        } else {
          console.warn("create-checkout: promo code rejected", {
            code: String(couponCode).slice(0, 32),
            reason: couponResult.reason
          });
        }
      } catch (couponErr) {
        // Coupon failures must never break a booking — ignore and charge full.
        console.error("create-checkout: coupon validation error (ignored):", couponErr.message);
        appliedCoupon = null;
        couponDiscountCents = 0;
      }
    }

    // Idempotency: keyed on a stable client-generated booking-attempt ID
    // (falls back to the token tail). Survives tokenize retries so a
    // resubmit after a lost response never double-charges. Square dedupes
    // on this key.
    const idempotencySeed = clientIdempotencyKey || String(squareToken).slice(-16);
    // Square caps idempotency_key at 45 chars; a full sha256 hex is 64 and
    // gets rejected with a 400 ("Field must not be greater than 45 length"),
    // which would fail EVERY card-on-file charge. Truncate to 45 — still
    // 180 bits of entropy, far more than enough to dedupe.
    const idempotencyKey = crypto.createHash("sha256")
      .update(appointmentTypeID + "|" + datetime + "|" + contact.email + "|" + idempotencySeed)
      .digest("hex")
      .slice(0, 45);

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
        note: "WhiteWall booking — " + cardLabelName + " — " + datetime
      });

      // 5. Save the card on file for later merchant-initiated fees
      //    (damage / early-late / unauthorized add-ons / cleaning).
      cardOnFile = await createCardOnFile({
        paymentId: payment.id,
        customerId: customerId,
        cardholderName: cardLabelName
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
      if (appliedCoupon) {
        notes += "\n\nPromo code: " + appliedCoupon.code +
          " (" + appliedCoupon.percentOff + "% off session, -$" +
          (appliedCoupon.discountCents / 100).toFixed(2) + ")";
      }

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
        "\nname_on_card: " + cardLabelName +
        "\ncardholder_authorization: confirmed (booker attested they are the cardholder or are authorized by them)" +
        "\nconsent_text_hash: " + consentTextHash +
        "\n--- END CONSENT ---";

      // STAGING isolation (ported from the retired booking-callback.js): stamp
      // the name, sink the customer email, and force the STAGING calendar. We
      // ALWAYS pass calendarID so Acuity can't default-misroute to the first
      // calendar of a multi-calendar appointment type (see Lisa Brantly incident,
      // 2026-05-22) — this also hardens the prod path, which previously passed none.
      var apptFirstName = contact.firstName;
      var apptEmail = contact.email;
      var stagingCalID = stagingCalendarID();
      var stagingMocked = isStaging() && !stagingCalID;
      if (isStaging()) {
        apptFirstName = "[STAGING] " + apptFirstName;
        apptEmail = stagingSinkEmail();
        notes = "*** STAGING BOOKING — DO NOT FULFILL ***\n" + notes;
      }

      if (stagingMocked) {
        // Fail-safe: STAGING=1 but no STAGING calendar configured → mock the
        // Acuity write entirely rather than risk falling through to a prod calendar.
        appointment = { id: "staging-mock-" + Date.now() };
        console.warn("create-checkout: ACUITY_STAGING_CALENDAR_ID unset — mocking Acuity write");
      } else {
        appointment = await acuityPost("/appointments?admin=true", {
          appointmentTypeID: appointmentTypeID,
          datetime: datetime,
          firstName: apptFirstName,
          lastName: contact.lastName || "",
          email: apptEmail,
          phone: contact.phone || "",
          calendarID: stagingCalID || CALENDAR_IDS[location],
          addonIDs: addonIDs,
          fields: fields,
          notes: notes,
          noPayment: true
        });
      }

      captureServerEvent(contact.email, "booking_completed_server", {
        appointment_id: appointment.id,
        location: location,
        appointment_type_id: appointmentTypeID,
        datetime: datetime,
        square_payment_id: payment.id,
        square_card_id: cardOnFile.id,
        participants: participants || "",
        addon_count: addonIDs.length,
        has_cleaning_fee: !!(effectiveCleaningFee && effectiveCleaningFee.amount > 0),
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        coupon_discount_cents: appliedCoupon ? appliedCoupon.discountCents : 0
      });

      // Cleaning fee → 2.5h cleaner buffer block (PV + TM, per Drew 2026-05-05).
      // Skipped in staging-mock mode (no real appointment exists to buffer).
      if (effectiveCleaningFee && effectiveCleaningFee.amount > 0 && !stagingMocked) {
        try {
          var durMin = TYPE_TO_DURATION[String(appointmentTypeID)] || 60;
          var sEnd = new Date(new Date(datetime).getTime() + durMin * 60000);
          var bEnd = new Date(sEnd.getTime() + 150 * 60000);
          await acuityPost("/blocks", {
            start: sEnd.toISOString(),
            end: bEnd.toISOString(),
            calendarID: stagingCalID || CALENDAR_IDS[location],
            notes: (isStaging() ? "[STAGING] " : "") + "Cleaning buffer (auto-created for booking #" + appointment.id + ")"
          });
        } catch (e) {
          console.error("buffer block failed:", e.message);
        }
      }

      // Notifications — isolated so one failure can't break a paid booking
      try { await notifyOwner(bookingState, appointment.id); } catch (e) { console.error("notifyOwner:", e.message); }
      try { await notifyCleaner(bookingState, appointment.id); } catch (e) { console.error("notifyCleaner:", e.message); }
      try { await notifyOwnerSMS(bookingState, appointment.id); } catch (e) { console.error("notifyOwnerSMS:", e.message); }
      try { await notifyCustomerSMS(bookingState, appointment.id); } catch (e) { console.error("notifyCustomerSMS:", e.message); }

      // Persist the booking to Supabase so it shows in the customer's profile
      // (V3 items 2/6/7). Best-effort + isolated: a failure here NEVER breaks a
      // paid booking (same discipline as the notify-* calls). customer_id is
      // null until the customer creates/links an account with this email; the
      // session row carries the Acuity appointment id. Skipped in staging-mock.
      if (sbDB.isConfigured() && !stagingMocked) {
        try {
          var bookingRows = await sbDB.serviceInsert("bookings", {
            email: contact.email,
            status: "confirmed",
            event_intent: (eventIntent === "yes") ? "yes" : "no",
            subtotal_cents: totalCents,
            total_cents: totalCents,
            payment_mode: "full",
            square_customer_id: customerId,
            square_card_id: cardOnFile.id,
            square_payment_id: payment.id
          });
          var bookingRow = Array.isArray(bookingRows) ? bookingRows[0] : bookingRows;
          if (bookingRow && bookingRow.id) {
            var sessionCents = (lineItems[0] && lineItems[0].amount) ? lineItems[0].amount : totalCents;
            await sbDB.serviceInsert("booking_sessions", {
              booking_id: bookingRow.id,
              acuity_appointment_id: String(appointment.id),
              location: location,
              appointment_type_id: String(appointmentTypeID),
              starts_at: datetime,
              duration_min: TYPE_TO_DURATION[String(appointmentTypeID)] || 60,
              day_index: 0,
              session_price_cents: sessionCents
            });

            // V3 item 6 — enqueue the 4-touch add-on campaign (this is a
            // full-payment booking, so no balance auto-charge / reminders).
            // DARK: only fires when CAMPAIGN_ENROLL_ENABLED === "1" (default off
            // → this branch is never entered and the booking flow is unchanged).
            // Best-effort + isolated: an enroll failure NEVER breaks a paid
            // booking. enrollBooking is itself idempotent + flag-gated.
            if (process.env.CAMPAIGN_ENROLL_ENABLED === "1") {
              try {
                await enrollBooking({
                  id: bookingRow.id,
                  created_at: bookingRow.created_at,
                  first_session_start: datetime,
                  payment_mode: "full",
                  balance_due_cents: null
                });
              } catch (enrollErr) {
                console.error("campaign enroll (single):", enrollErr.message);
              }
            }
          }
        } catch (e) {
          console.error("supabase booking persist:", e.message);
        }
      }

      // Coupon redemptions are NOT reported from here. The "Promo code: X" line
      // written into the Acuity appointment notes above is the redemption
      // signal — the WWS dashboard derives redemptions from its Acuity ingest,
      // so the booking site never phones home (Phase 3 redux, #20).

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

// ===========================================================================
// V3 item 2 — multi-session cart checkout (ADDITIVE; single-session path above
// is untouched). One cart = ONE Square charge (full cart total, or the 60%
// deposit in deposit mode) + ONE saved card + N Acuity appointments (one per
// session, each passing calendarID to dodge the documented multi-calendar
// misroute) + ONE bookings row + N booking_sessions (+ per-session
// booking_session_addons) in Supabase.
//
// Partial-failure contract: the charge happens FIRST, then appointments are
// created in a loop. If appointment k fails after the charge succeeded, we
// refund the WHOLE charge, alert, and mark the booking failed — no partial
// fulfillment, mirroring the single-session auto-refund discipline.
//
// Expected body shape:
//   {
//     sessions: [ { appointmentTypeID, datetime, location, addons,
//                   eventIntent, intake, participants, eventDescription,
//                   foodDrinks } ],
//     universal: { contact, waiverSigned, termsSignature, consent,
//                  cardholderName, squareToken, clientIdempotencyKey },
//     paymentMode: 'full' | 'deposit'   // 'deposit' = event bookings only
//   }
//   (universal.* may also be sent flat on the body; universal wins if present.)
// ===========================================================================
async function handleCartCheckout(req, res, body) {
  const sessions = body.sessions;
  const universal = body.universal || {};
  // Universal fields: prefer the `universal` envelope, fall back to top-level
  // body so a flatter client payload still works.
  const contact = universal.contact || body.contact;
  const waiverSigned = (universal.waiverSigned != null) ? universal.waiverSigned : body.waiverSigned;
  const termsSignature = universal.termsSignature || body.termsSignature || "";
  const consent = universal.consent || body.consent;
  const cardholderName = universal.cardholderName || body.cardholderName || "";
  const squareToken = universal.squareToken || body.squareToken;
  const clientIdempotencyKey = universal.clientIdempotencyKey || body.clientIdempotencyKey;
  const paymentMode = (body.paymentMode === "deposit") ? "deposit" : "full";
  // NOTE: promo codes are intentionally NOT applied on the cart path in v1 (the
  // single-session path handles coupons; multi-day discount math already runs
  // via computeCart). Wire coupons into the cart in a later reviewed step.

  var cardLabelName =
    (typeof cardholderName === "string" && cardholderName.trim()) ||
    (contact ? (contact.firstName + " " + (contact.lastName || "")).trim() : "");

  // ---- Validation (universal + per session) --------------------------------
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

  // Normalize + validate each session. computeCart re-validates the
  // earliest-start floor and prices authoritatively, but the per-field guards
  // (valid type, known location, setup-crew event gate) must run here so a
  // crafted POST can't slip through.
  var normalized;
  try {
    normalized = sessions.map(function (s, idx) {
      if (!s || typeof s !== "object") {
        throw new Error("session " + idx + " is malformed");
      }
      if (!s.appointmentTypeID || !isValidAppointmentTypeID(s.appointmentTypeID)) {
        throw new Error("session " + idx + ": invalid appointmentTypeID");
      }
      if (!s.datetime) {
        throw new Error("session " + idx + ": missing datetime");
      }
      var loc = s.location;
      if (!loc || !["powdersville", "taylors-mill"].includes(loc)) {
        throw new Error("session " + idx + ": invalid location");
      }
      if (isStartBeforeEarliest(s.appointmentTypeID, s.datetime)) {
        throw new Error("session " + idx + ": start is before the earliest allowed for this session");
      }
      if (isEndAfterClose(s.appointmentTypeID, s.datetime)) {
        throw new Error("session " + idx + ": session would end after the studio closes");
      }
      var addons = s.addons || {};
      var sEventIntent = (s.eventIntent === "yes") ? "yes" : "no";
      // Studio Setup Crew: events-only + every placement chosen (same guard as
      // the single-session path, applied per session).
      if (addons["setup-crew"] && addons["setup-crew"].selected) {
        if (sEventIntent !== "yes") {
          throw new Error("session " + idx + ": Studio Setup Crew is only available for event bookings");
        }
        var crewPlacements = addons["setup-crew"].placements || {};
        for (var pi = 0; pi < SETUP_CREW_PLACEMENT_ITEMS.length; pi++) {
          var pItem = SETUP_CREW_PLACEMENT_ITEMS[pi];
          var chosen = crewPlacements[pItem.id];
          if (!chosen || pItem.options.indexOf(chosen) === -1) {
            throw new Error("session " + idx + ": Studio Setup Crew requires a placement choice for each item");
          }
        }
      }
      return {
        appointmentTypeID: String(s.appointmentTypeID),
        datetime: s.datetime,
        location: loc,
        addons: addons,
        eventIntent: sEventIntent,
        intake: s.intake || {},
        participants: s.participants || (s.intake && s.intake.participants) || "",
        eventDescription: s.eventDescription || "",
        foodDrinks: s.foodDrinks != null ? s.foodDrinks : false
      };
    });
  } catch (vErr) {
    return res.status(400).json({ error: vErr.message });
  }

  // Deposit (V3 item 6) is EVENT bookings only. A cart is an event booking if
  // any session is an event. Reject deposit mode on a non-event cart.
  var cartIsEvent = normalized.some(function (s) { return s.eventIntent === "yes"; });
  if (paymentMode === "deposit" && !cartIsEvent) {
    return res.status(400).json({ error: "A deposit is only available for event bookings" });
  }

  try {
    // ---- 1. Server-authoritative pricing -----------------------------------
    // computeCart sorts sessions chronologically, assigns day_index, reuses the
    // single-session line builder, and applies the per-day add-on discount via
    // pricing-shared. It throws on a too-early start or invalid datetime.
    //
    // computeCart prices PER LOCATION; a cross-location cart (deferred for v1
    // per Drew) would need per-location grouping. We pass each session's own
    // location into the builder by computing line items per session here and
    // letting computeCart group by the session's own location — computeCart
    // takes a single `location`, so for v1 we require a single-location cart
    // and pass that location. Cross-location is rejected.
    var locations = normalized.map(function (s) { return s.location; });
    var uniqueLocations = locations.filter(function (l, i) { return locations.indexOf(l) === i; });
    if (uniqueLocations.length > 1) {
      return res.status(400).json({ error: "All sessions in one cart must be at the same location" });
    }
    var cartLocation = uniqueLocations[0];

    var priced = computeCart(
      normalized.map(function (s) {
        return { appointmentTypeID: s.appointmentTypeID, datetime: s.datetime, addons: s.addons };
      }),
      cartLocation
    );

    var totalCents = priced.totals.total;
    // Charge amount: full cart total, or the 60% deposit in deposit mode.
    var chargeCents = (paymentMode === "deposit") ? priced.deposit.depositCents : totalCents;
    var balanceDueCents = (paymentMode === "deposit") ? priced.deposit.balanceDueCents : null;

    // Earliest session start (chronological) → balance fires 48h before it.
    // priced.sessions is already chronologically ordered by computeCart.
    var firstStartIso = priced.sessions[0].datetime;
    var balanceChargeAt = (paymentMode === "deposit")
      ? new Date(new Date(firstStartIso).getTime() - 48 * 3600 * 1000).toISOString()
      : null;

    // ---- 2. Idempotency ----------------------------------------------------
    // Keyed on the whole cart (sorted type|datetime pairs) + email + seed so a
    // resubmit after a lost response never double-charges.
    var cartKey = priced.sessions.map(function (s) {
      return s.appointmentTypeID + "@" + s.datetime;
    }).join(",");
    var idempotencySeed = clientIdempotencyKey || String(squareToken).slice(-16);
    var idempotencyKey = crypto.createHash("sha256")
      .update("cart|" + paymentMode + "|" + cartKey + "|" + contact.email + "|" + idempotencySeed)
      .digest("hex")
      .slice(0, 45);

    var customerId, payment, cardOnFile;
    var createdAppointments = []; // { id, sessionIndex } collected as we go
    var failedAppointment = false;

    try {
      // ---- 3. Square customer (reused by email) ---------------------------
      customerId = await findOrCreateCustomer({
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName || "",
        phone: contact.phone || ""
      });

      // ---- 4. ONE charge for the whole cart (or the deposit) --------------
      payment = await createPayment({
        sourceId: squareToken,
        amountCents: chargeCents,
        customerId: customerId,
        idempotencyKey: idempotencyKey,
        note: "WhiteWall cart (" + priced.sessions.length + " session"
          + (priced.sessions.length === 1 ? "" : "s") + ") — "
          + cardLabelName + (paymentMode === "deposit" ? " — 60% deposit" : "")
      });

      // ---- 5. ONE saved card ----------------------------------------------
      cardOnFile = await createCardOnFile({
        paymentId: payment.id,
        customerId: customerId,
        cardholderName: cardLabelName
      });

      // ---- 6. N Acuity appointments — one per session --------------------
      // ALWAYS pass calendarID (staging override else the session's location)
      // so Acuity can't default-misroute to the first calendar of a
      // multi-calendar type (Lisa Brantly incident, 2026-05-22).
      var stagingCalID = stagingCalendarID();
      var stagingMocked = isStaging() && !stagingCalID;

      // Consent proof hash binds to the exact waiver text the customer saw.
      var consentTextHash = crypto.createHash("sha256")
        .update(buildWaiverText({
          fullName: (contact.firstName + " " + (contact.lastName || "")).trim(),
          locationSlug: cartLocation,
          signedAt: (consent && consent.timestamp) || ""
        }))
        .digest("hex");

      for (var si = 0; si < priced.sessions.length; si++) {
        var ps = priced.sessions[si]; // priced (chronological) session
        // Match the priced session back to its normalized record (same
        // appointmentTypeID + datetime) to recover intake / event fields.
        var src = normalized.find(function (n) {
          return n.appointmentTypeID === ps.appointmentTypeID && n.datetime === ps.datetime;
        }) || normalized[si];

        var sessionState = {
          appointmentTypeID: src.appointmentTypeID,
          datetime: src.datetime,
          location: src.location,
          contact: contact,
          intake: src.intake || {},
          addons: src.addons || {},
          eventIntent: src.eventIntent,
          participants: src.participants || "",
          eventDescription: src.eventDescription || "",
          foodDrinks: src.foodDrinks,
          waiverSigned: true
        };

        var addonIDs = buildAcuityAddonIDs(sessionState.addons, sessionState.location);
        var fields = buildAcuityFields(sessionState.intake || {}, sessionState.location);
        var notes = buildAppointmentNotes(sessionState);

        // Cart context so Drew sees this is one session of a multi-session order.
        notes += "\n\n[MULTI-SESSION CART: session " + (si + 1) + " of "
          + priced.sessions.length + ", day index " + ps.dayIndex
          + (paymentMode === "deposit" ? ", 60% deposit paid" : "") + "]";

        notes += "\n\n--- CARD-ON-FILE CONSENT (auto, do not edit) ---" +
          "\nsquare_customer_id: " + customerId +
          "\nsquare_card_id: " + cardOnFile.id +
          "\nsquare_payment_id: " + payment.id +
          "\nconsent_timestamp: " + ((consent && consent.timestamp) || "") +
          "\nconsent_ip: " + (req.headers["x-forwarded-for"] || "") +
          "\nconsent_user_agent: " + ((consent && consent.userAgent) || "") +
          "\nterms_signature: " + (termsSignature || "") +
          "\nwaiver_signed_name: " + (contact.firstName + " " + (contact.lastName || "")).trim() +
          "\nname_on_card: " + cardLabelName +
          "\ncardholder_authorization: confirmed (booker attested they are the cardholder or are authorized by them)" +
          "\nconsent_text_hash: " + consentTextHash +
          "\n--- END CONSENT ---";

        var apptFirstName = contact.firstName;
        var apptEmail = contact.email;
        if (isStaging()) {
          apptFirstName = "[STAGING] " + apptFirstName;
          apptEmail = stagingSinkEmail();
          notes = "*** STAGING BOOKING — DO NOT FULFILL ***\n" + notes;
        }

        if (stagingMocked) {
          createdAppointments.push({ id: "staging-mock-" + Date.now() + "-" + si, sessionIndex: si });
          console.warn("create-checkout(cart): ACUITY_STAGING_CALENDAR_ID unset — mocking Acuity write for session " + si);
        } else {
          var appt = await acuityPost("/appointments?admin=true", {
            appointmentTypeID: src.appointmentTypeID,
            datetime: src.datetime,
            firstName: apptFirstName,
            lastName: contact.lastName || "",
            email: apptEmail,
            phone: contact.phone || "",
            calendarID: stagingCalID || CALENDAR_IDS[src.location],
            addonIDs: addonIDs,
            fields: fields,
            notes: notes,
            noPayment: true
          });
          createdAppointments.push({ id: appt.id, sessionIndex: si });
        }
      }
    } catch (apptErr) {
      // A session appointment failed AFTER the charge succeeded → refund the
      // WHOLE charge, alert, mark booking failed. No partial fulfillment.
      failedAppointment = !!payment;
      console.error("create-checkout(cart) failed:", apptErr.message);
      if (payment) {
        try {
          await refundPayment(payment.id, payment.amount_money.amount, "Cart booking creation failed — automatic full refund");
        } catch (refundErr) {
          await alertFailure("critical", "REFUND FAILED after cart booking error — manual refund needed", {
            payment_id: payment.id,
            amount: payment.amount_money && payment.amount_money.amount,
            customer: contact.email,
            appointments_created: createdAppointments.map(function (a) { return a.id; }),
            error: refundErr.message
          });
        }
      }
      await alertFailure("critical", "Cart booking failed in create-checkout", {
        customer: (contact.firstName || "") + " " + (contact.lastName || ""),
        email: contact.email,
        location: cartLocation,
        sessions: priced.sessions.length,
        appointments_created: createdAppointments.map(function (a) { return a.id; }),
        error: apptErr.message,
        refunded: !!payment
      });
      // Best-effort: persist a failed booking row for the audit trail so a
      // partial Acuity write (orphan appointments) is visible to Drew.
      if (sbDB.isConfigured() && createdAppointments.length > 0) {
        try {
          await sbDB.serviceInsert("bookings", {
            email: contact.email,
            status: "failed",
            event_intent: cartIsEvent ? "yes" : "no",
            subtotal_cents: totalCents,
            total_cents: totalCents,
            payment_mode: paymentMode,
            square_customer_id: customerId || null,
            square_card_id: cardOnFile ? cardOnFile.id : null,
            square_payment_id: payment ? payment.id : null,
            notes: "Cart booking failed: " + apptErr.message
              + " | orphan Acuity appts: " + createdAppointments.map(function (a) { return a.id; }).join(", ")
          });
        } catch (e) {
          console.error("supabase failed-booking persist:", e.message);
        }
      }
      return res.status(500).json({
        error: payment
          ? "We couldn't finalize your booking and have refunded your payment. Please try again or contact us."
          : "Your card was not charged. Please try again.",
        refunded: !!payment
      });
    }

    // ---- 7. Persist ONE bookings row + N sessions (+ addons) -------------
    // Best-effort + isolated, same discipline as the single-session path: a
    // Supabase failure NEVER unwinds a paid+booked cart. Skipped in staging-mock.
    var stagingMockedFinal = isStaging() && !stagingCalendarID();
    if (sbDB.isConfigured() && !stagingMockedFinal) {
      try {
        var bookingRows = await sbDB.serviceInsert("bookings", {
          email: contact.email,
          status: "confirmed",
          event_intent: cartIsEvent ? "yes" : "no",
          subtotal_cents: totalCents,
          total_cents: totalCents,
          payment_mode: paymentMode,
          deposit_cents: (paymentMode === "deposit") ? priced.deposit.depositCents : null,
          balance_due_cents: balanceDueCents,
          balance_charge_at: balanceChargeAt,
          balance_status: (paymentMode === "deposit") ? "scheduled" : "none",
          square_customer_id: customerId,
          square_card_id: cardOnFile.id,
          square_payment_id: payment.id
        });
        var bookingRow = Array.isArray(bookingRows) ? bookingRows[0] : bookingRows;
        if (bookingRow && bookingRow.id) {
          for (var wi = 0; wi < priced.sessions.length; wi++) {
            var wps = priced.sessions[wi];
            var apptId = (createdAppointments[wi] && createdAppointments[wi].id) || null;
            var sessionRows = await sbDB.serviceInsert("booking_sessions", {
              booking_id: bookingRow.id,
              acuity_appointment_id: apptId != null ? String(apptId) : null,
              location: cartLocation,
              appointment_type_id: String(wps.appointmentTypeID),
              starts_at: wps.datetime,
              duration_min: TYPE_TO_DURATION[String(wps.appointmentTypeID)] || 60,
              day_index: wps.dayIndex,
              session_price_cents: wps.sessionCents
            });
            var sessionRow = Array.isArray(sessionRows) ? sessionRows[0] : sessionRows;
            if (sessionRow && sessionRow.id && wps.addons && wps.addons.length) {
              var addonRows = wps.addons.map(function (a) {
                var fullCents = a.cents; // full (undiscounted) line value
                var discounted = pricingShared.discountedAddonCents(fullCents, wps.dayIndex, a.addonId);
                var unit = (a.quantity && a.quantity > 0) ? Math.round(fullCents / a.quantity) : fullCents;
                return {
                  booking_session_id: sessionRow.id,
                  addon_id: a.addonId,
                  quantity: a.quantity || 1,
                  unit_cents: unit,
                  discount_cents: fullCents - discounted
                };
              });
              await sbDB.serviceInsert("booking_session_addons", addonRows);
            }
          }

          // V3 item 6 — enqueue the 4-touch add-on campaign, and (for a deposit
          // cart) the 40% balance auto-charge wake-up + the every-6h payment
          // reminders. fire-times come from the chronological first session.
          // DARK: only fires when CAMPAIGN_ENROLL_ENABLED === "1" (default off →
          // this branch is never entered and the cart flow is unchanged).
          // Best-effort + isolated: an enroll failure NEVER breaks a paid+booked
          // cart. enrollBooking is itself idempotent + flag-gated.
          if (process.env.CAMPAIGN_ENROLL_ENABLED === "1") {
            try {
              await enrollBooking({
                id: bookingRow.id,
                created_at: bookingRow.created_at,
                first_session_start: priced.sessions[0].datetime,
                payment_mode: paymentMode,
                balance_due_cents: balanceDueCents,
                balance_charge_at: balanceChargeAt
              });
            } catch (enrollErr) {
              console.error("campaign enroll (cart):", enrollErr.message);
            }
          }
        }
      } catch (e) {
        console.error("supabase cart persist:", e.message);
      }
    }

    // Analytics — one event for the cart.
    captureServerEvent(contact.email, "cart_booking_completed_server", {
      location: cartLocation,
      session_count: priced.sessions.length,
      appointment_ids: createdAppointments.map(function (a) { return a.id; }),
      square_payment_id: payment.id,
      square_card_id: cardOnFile.id,
      payment_mode: paymentMode,
      total_cents: totalCents,
      charged_cents: chargeCents,
      balance_due_cents: balanceDueCents || 0
    });
    await flushPostHog();

    var fn = encodeURIComponent(contact.firstName);
    var ln = encodeURIComponent(contact.lastName || "");
    var firstApptId = (createdAppointments[0] && createdAppointments[0].id) || "";
    return res.status(200).json({
      success: true,
      sessionCount: priced.sessions.length,
      appointmentIds: createdAppointments.map(function (a) { return a.id; }),
      paymentMode: paymentMode,
      totalCents: totalCents,
      chargedCents: chargeCents,
      balanceDueCents: balanceDueCents || 0,
      redirect: "/booking-confirmation?id=" + firstApptId + "&location=" + cartLocation
        + "&fn=" + fn + "&ln=" + ln + "&sessions=" + priced.sessions.length
    });
  } catch (err) {
    // Pre-charge failure (pricing/validation) — no money moved.
    console.error("create-checkout(cart) pre-payment error:", err.message);
    await alertFailure("alert", "create-checkout cart pre-payment failure", {
      customer: contact ? contact.email : "unknown",
      error: err.message
    });
    // computeCart throws plain Errors on bad input — surface as 400 when it's
    // clearly a client-data problem (too-early start, invalid datetime), else 500.
    var isClientErr = /computeCart:/.test(err.message || "");
    return res.status(isClientErr ? 400 : 500).json({
      error: isClientErr ? err.message : "Failed to start checkout. Please try again."
    });
  }
}
