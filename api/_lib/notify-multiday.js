// Event-level notifications for a MULTI-DAY EVENT booking (Drew spec 2026-07-11,
// client/comms/2026-07-11-drew-backend-spec.md). The multi-day cart path
// (create-checkout.js handleCartCheckout) creates N Acuity appointments + ONE
// Square charge but — unlike the single-session path — sent NO owner email,
// owner SMS, customer recap, or cleaner email. This module fills that gap and
// fires each notification ONCE per event (not once per appointment).
//
// Why a dedicated module instead of adapting the single-session notifiers:
// the single-session notifiers (notify-owner, notify-sms, notify-customer-sms,
// notify-cleaner) are shared with the LIVE single-session booking path. Rather
// than reshape them (and risk the live path), we compose event-shaped messages
// here and REUSE the low-level transports that are already proven:
//   - sendOwnerSMS  (Watson / Blue Bubbles)  from ./notify-sms
//   - buildIcs      (cleaner calendar invite) from ./notify-cleaner
//   - Resend        (email) — same raw-fetch pattern as notify-owner
//
// SENSITIVE: these send REAL owner/customer/cleaner comms on PROD. On STAGING
// the transports self-suppress (RESEND_API_KEY / Watson / CLEANER_EMAIL env are
// deliberately unset), AND we additionally sink every email recipient to the
// staging sink address as belt-and-suspenders — so staging verifies WIRING only,
// never delivering to a real person.
//
// Env vars: RESEND_API_KEY, NOTIFICATION_EMAIL (owner), CLEANER_EMAIL, plus the
// Watson/Blue-Bubbles vars used by sendOwnerSMS.

const { SESSION_PRICES, TYPE_TO_DURATION, SETUP_CREW_PLACEMENT_ITEMS } = require("./acuity");
const { sendOwnerSMS } = require("./notify-sms");
const { buildIcs } = require("./notify-cleaner");
const { isStaging, stagingSinkEmail } = require("./env");

const STUDIO_ADDRESS = {
  powdersville: "WhiteWall Studios — 2699 Powdersville Rd, Easley, SC 29642",
  "taylors-mill": "WhiteWall Studios — 250 Mill St, Ste BL1223, Taylors, SC 29687"
};

// Back-end buffer minutes (must match the block created in handleCartCheckout).
const BACK_BUFFER_MIN_CREW = 240;    // 4h: crew reset + April's cleaning (Drew)
const BACK_BUFFER_MIN_PLAIN = 150;   // 2.5h: cleaning only (existing behavior)
const CLEANER_ARRIVE_AFTER_END_MIN_CREW = 90;  // April arrives 1.5h after end (Drew)
const CREW_FRONT_LEAD_MIN = 120;     // recommend crew start 2h before day-1 start

// --------------------------------------------------------------------------
// Formatting helpers (America/New_York, matching the other notifiers)
// --------------------------------------------------------------------------
function fmtMoney(cents) { return "$" + ((Number(cents) || 0) / 100).toFixed(2); }

function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York", weekday: "long", month: "long",
      day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short"
    });
  } catch (e) { return String(iso); }
}

function fmtTimeOnly(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      timeZone: "America/New_York", hour: "numeric", minute: "2-digit"
    });
  } catch (e) { return String(iso); }
}

function partsInTZ(iso) {
  // { month:"Oct", day:"3", year:"2026" } in ET, for range formatting.
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short" }),
    day: d.toLocaleDateString("en-US", { timeZone: "America/New_York", day: "numeric" }),
    year: d.toLocaleDateString("en-US", { timeZone: "America/New_York", year: "numeric" })
  };
}

// "Oct 3–5, 2026" (same month), "Oct 30 – Nov 2, 2026" (cross month), or a
// single date when the event is one day.
function fmtDateRange(firstIso, lastIso) {
  if (!firstIso) return "—";
  const a = partsInTZ(firstIso);
  if (!lastIso || firstIso === lastIso) return a.month + " " + a.day + ", " + a.year;
  const b = partsInTZ(lastIso);
  if (a.month === b.month && a.year === b.year) {
    return a.month + " " + a.day + "–" + b.day + ", " + b.year;
  }
  return a.month + " " + a.day + " – " + b.month + " " + b.day + ", " + b.year;
}

function locationLabel(slug) {
  return slug === "powdersville" ? "Flagship Location (Powdersville)" : "Taylor's Mill";
}

function endOfSession(iso, typeId) {
  const dur = TYPE_TO_DURATION[String(typeId)] || 60;
  return new Date(new Date(iso).getTime() + dur * 60000);
}

// Compact, human add-on list for one day (raw addons object). Setup crew is
// shown so the customer sees it on their recap; placement detail goes to the
// owner/crew, not the customer recap.
function describeDayAddons(addons) {
  if (!addons) return [];
  const lines = [];
  if (addons.backdrops) {
    if (addons.backdrops.mode === "all") lines.push("All backdrops");
    else if (addons.backdrops.colors && addons.backdrops.colors.length) lines.push("Backdrops (" + addons.backdrops.colors.length + ")");
  }
  if (addons.lighting && addons.lighting.selected) lines.push("Lighting rental");
  if (addons["rolling-walls"]) {
    if (addons["rolling-walls"].mode === "all") lines.push("All rolling walls");
    else if (addons["rolling-walls"].walls && addons["rolling-walls"].walls.length) lines.push("Rolling walls (" + addons["rolling-walls"].walls.length + ")");
  }
  if (addons.chairs && addons.chairs.selection) lines.push("Chairs (" + addons.chairs.selection + ")");
  if (addons.tables && addons.tables.quantity > 0) lines.push("8ft tables (" + addons.tables.quantity + ")");
  if (addons.tv && addons.tv.selected) lines.push("86\" Rolling TV");
  if (addons["pa-system"] && addons["pa-system"].selected) lines.push("PA system");
  if (addons["setup-crew"] && addons["setup-crew"].selected) lines.push("Event Setup and Reset Crew");
  return lines;
}

function fullName(contact) {
  contact = contact || {};
  return ((contact.firstName || "") + " " + (contact.lastName || "")).trim();
}

// --------------------------------------------------------------------------
// Cleaner timing — where April slots in relative to the event's last-day end.
// Crew added: 4h window, arrive 1.5h after end (crew resets first). Otherwise:
// 2.5h window starting at end. Returned times drive both the email + the .ics.
// --------------------------------------------------------------------------
function cleanerTiming(lastEnd, crewAdded) {
  if (crewAdded) {
    return {
      arrive: new Date(lastEnd.getTime() + CLEANER_ARRIVE_AFTER_END_MIN_CREW * 60000),
      windowEnd: new Date(lastEnd.getTime() + BACK_BUFFER_MIN_CREW * 60000),
      windowHours: "4",
      crew: true
    };
  }
  return {
    arrive: new Date(lastEnd.getTime()),
    windowEnd: new Date(lastEnd.getTime() + BACK_BUFFER_MIN_PLAIN * 60000),
    windowHours: "2.5",
    crew: false
  };
}

// --------------------------------------------------------------------------
// Body builders (exported for unit testing)
// --------------------------------------------------------------------------

// The per-day breakdown shared by the customer + owner recap emails.
function buildEventRecapLines(ctx) {
  const lines = [];
  ctx.days.forEach(function (d, i) {
    const session = SESSION_PRICES[String(d.typeId)] || { label: "Session" };
    lines.push("Day " + (i + 1) + " — " + session.label);
    lines.push("  " + fmtDateTime(d.datetime));
    lines.push("  Session: " + fmtMoney(d.sessionCents));
    const addonLines = describeDayAddons(d.addons);
    if (addonLines.length) lines.push("  Add-ons: " + addonLines.join(", "));
    lines.push("");
  });
  if (ctx.cleaningFeeCents > 0) lines.push("Cleaning fee: " + fmtMoney(ctx.cleaningFeeCents));
  // Multi-day discount (Drew 2026-07-13): $100 off per day the event spans.
  if (ctx.multiDayDiscountCents > 0) {
    lines.push(
      "Multi-day discount (" + ctx.days.length + " days x $100): -" +
        fmtMoney(ctx.multiDayDiscountCents)
    );
  }
  lines.push("─────");
  lines.push("Total: " + fmtMoney(ctx.totalCents));
  if (ctx.paymentMode === "deposit") {
    lines.push("Paid today: " + fmtMoney(ctx.chargeCents) + " (60% deposit)");
    lines.push("Balance remaining: " + fmtMoney(ctx.balanceDueCents));
  }
  return lines;
}

function buildCustomerRecapEmail(ctx) {
  const contact = ctx.contact || {};
  const sections = [
    "Hi " + (contact.firstName || "there") + ",",
    "",
    "Your multi-day event at WhiteWall Studios is confirmed. Here is a recap of everything we have on file — please save this email.",
    "",
    "Location:    " + locationLabel(ctx.location),
    "Event dates: " + fmtDateRange(ctx.days[0].datetime, ctx.days[ctx.days.length - 1].datetime),
    "Guests:      " + (ctx.headcount || "—"),
    ""
  ];
  if (ctx.eventDescription) sections.push("What you're using the space for: " + ctx.eventDescription, "");
  sections.push("═══════════════════════════════════════", "YOUR EVENT, DAY BY DAY", "═══════════════════════════════════════");
  buildEventRecapLines(ctx).forEach(function (l) { sections.push(l); });
  sections.push(
    "",
    "Each day above is its own appointment on our calendar; you'll also receive a confirmation for each from our scheduler.",
    "",
    "Questions? Reply to this email or text (803) 873-8153. See you soon!",
    "",
    "— WhiteWall Studios"
  );
  return sections.join("\n");
}

function buildOwnerRecapEmail(ctx) {
  const contact = ctx.contact || {};
  const sections = [
    "New MULTI-DAY EVENT booking on whitewallstudios.co.",
    "",
    "Customer:    " + (fullName(contact) || "—"),
    "Email:       " + (contact.email || "—"),
    "Phone:       " + (contact.phone || "—"),
    "Location:    " + locationLabel(ctx.location),
    "Event dates: " + fmtDateRange(ctx.days[0].datetime, ctx.days[ctx.days.length - 1].datetime),
    "Guests:      " + (ctx.headcount || "—"),
    "Using for:   " + (ctx.eventDescription || "—"),
    "Food/drinks: " + (ctx.foodDrinks ? "Yes" : "No"),
    "",
    "═══════════════════════════════════════", "DAY BY DAY", "═══════════════════════════════════════"
  ];
  buildEventRecapLines(ctx).forEach(function (l) { sections.push(l); });
  if (ctx.crewAdded && ctx.crewPlacements) {
    sections.push("", "═══════════════════════════════════════", "EVENT SETUP AND RESET CREW — PLACEMENTS", "═══════════════════════════════════════");
    SETUP_CREW_PLACEMENT_ITEMS.forEach(function (item) {
      if (ctx.crewPlacements[item.id]) sections.push("  " + item.label + " -> " + ctx.crewPlacements[item.id]);
    });
  }
  sections.push(
    "",
    "Acuity appointments: " + ctx.days.map(function (d) { return d.appointmentId; }).join(", "),
    "Square payment: " + ctx.square.paymentId + "  ·  customer " + ctx.square.customerId + "  ·  card " + ctx.square.cardId,
    "",
    "Cleaners have been emailed for the post-event reset window.",
    "",
    "Booked via whitewallstudios.co"
  );
  return sections.join("\n");
}

// Item 2 — owner Watson SMS, fired for every multi-day event booking.
function buildOwnerEventSms(ctx) {
  const lines = [
    "[WhiteWall] Multi-day event booked",
    fullName(ctx.contact) || "(no name)",
    "Dates: " + fmtDateRange(ctx.days[0].datetime, ctx.days[ctx.days.length - 1].datetime),
    "People: " + (ctx.headcount || "?"),
    "Use: " + (ctx.eventDescription || "(not specified)")
  ];
  if (ctx.paymentMode === "deposit") {
    lines.push("Paid: " + fmtMoney(ctx.chargeCents) + " (60% deposit) · Balance " + fmtMoney(ctx.balanceDueCents));
  } else {
    lines.push("Total: " + fmtMoney(ctx.totalCents));
  }
  lines.push("Cleaners emailed ✓");
  lines.push(ctx.days.length + " appointments (Acuity #" + ctx.days[0].appointmentId + " …)");
  return lines.join("\n");
}

// Item 3 — SECOND, back-to-back owner Watson SMS, ONLY when the setup crew was
// added. Placement choices + recommended front-end crew start + back-end reset.
function buildCrewSms(ctx) {
  const day1Start = new Date(ctx.days[0].datetime);
  const crewStart = new Date(day1Start.getTime() - CREW_FRONT_LEAD_MIN * 60000);
  const lastEnd = endOfSession(ctx.days[ctx.days.length - 1].datetime, ctx.days[ctx.days.length - 1].typeId);
  const lines = [
    "[WhiteWall] Setup crew — " + (fullName(ctx.contact) || "event"),
    "Where each item goes (from intake):"
  ];
  const pl = ctx.crewPlacements || {};
  SETUP_CREW_PLACEMENT_ITEMS.forEach(function (item) {
    if (pl[item.id]) lines.push("• " + item.label + ": " + pl[item.id]);
  });
  lines.push("Recommended crew start: " + fmtDateTime(crewStart) + " (2h before the event start)");
  lines.push("Back-end reset: crew can start at " + fmtDateTime(lastEnd) + " (the event ends then)");
  return lines.join("\n");
}

// Item 4 — April cleaner email, keyed to the LAST day's end + crew-aware.
function buildCleanerEmailBody(ctx, timing) {
  const contact = ctx.contact || {};
  const lastEnd = endOfSession(ctx.days[ctx.days.length - 1].datetime, ctx.days[ctx.days.length - 1].typeId);
  const lines = [
    "Hi April,",
    "",
    "A multi-day event at our " + locationLabel(ctx.location) + " location needs a full studio reset & clean after it wraps.",
    "",
    "Customer:      " + (fullName(contact) || "(no name)"),
    "Event size:    " + (ctx.headcount || "—") + " people",
    "Event dates:   " + fmtDateRange(ctx.days[0].datetime, ctx.days[ctx.days.length - 1].datetime),
    "Event ends:    " + fmtDateTime(lastEnd.toISOString()),
    ""
  ];
  if (timing.crew) {
    lines.push(
      "IMPORTANT — a setup crew will be in the studio immediately after the event ends to move all furniture back and reset. So you don't overlap them, please arrive 1.5 hours after the event ends to start cleaning.",
      "",
      "Your cleaning window: " + fmtDateTime(timing.arrive.toISOString()) + " → " + fmtDateTime(timing.windowEnd.toISOString()),
      "                      (a " + timing.windowHours + " hour buffer is blocked on the calendar for the crew + your cleaning)"
    );
  } else {
    lines.push(
      "Your cleaning window: " + fmtDateTime(timing.arrive.toISOString()) + " → " + fmtDateTime(timing.windowEnd.toISOString()),
      "                      (a " + timing.windowHours + " hour buffer is blocked on the calendar)"
    );
  }
  lines.push(
    "",
    "Studio: " + (STUDIO_ADDRESS[ctx.location] || ""),
    "",
    "An .ics attachment is included — open it on your phone or computer to add this to your calendar in one tap.",
    "",
    "Please reply to confirm you've got it on your calendar so we know you're set.",
    "",
    "Thanks,",
    "WhiteWall Studios",
    "",
    "—",
    "Acuity appointment ID (last day): " + ctx.days[ctx.days.length - 1].appointmentId
  );
  return lines.join("\n");
}

// Item 7 FALLBACK (Andrew-gated auto-charge is NOT armed) — a Watson reminder to
// Drew to MANUALLY charge the 40% balance: amount, the exact card, which event.
// Built here so it's ready the moment a deposit booking exists; the SCHEDULING of
// it (fire ~48h before the event) rides on the item-6 scheduler, which stays dark
// until Andrew arms it. Do NOT tell the customer it auto-charges until armed.
function buildManualChargeReminderSms(ctx) {
  return [
    "[WhiteWall] ACTION: manually charge event balance",
    fullName(ctx.contact) || "(no name)",
    "Event: " + fmtDateRange(ctx.days[0].datetime, ctx.days[ctx.days.length - 1].datetime),
    "Charge now: " + fmtMoney(ctx.balanceDueCents) + " (remaining 40%)",
    "Card on file: Square customer " + ctx.square.customerId + " · card " + ctx.square.cardId,
    "Original deposit payment: " + ctx.square.paymentId,
    "(Auto-charge is not live yet — charge this in the Square dashboard.)"
  ].join("\n");
}

// --------------------------------------------------------------------------
// Transport — Resend email (env-gated, best-effort, never throws).
// --------------------------------------------------------------------------
async function sendResend(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn("notify-multiday: RESEND_API_KEY not set, skipping email"); return; }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("notify-multiday: Resend API error", res.status, errText.slice(0, 500));
    }
  } catch (err) {
    console.error("notify-multiday: email send failed", err.message);
  }
}

// --------------------------------------------------------------------------
// Which sub-notifications should actually fire for this booking (DREW-29).
// The owner/customer copy this module builds is MULTI-DAY shaped (a date RANGE,
// a day-by-day recap, "Multi-day event booked"), so those sends belong ONLY to a
// genuine multi-day event (>= 2 days). The cleaner heads-up is orthogonal: April
// is needed whenever there is a real cleaning fee (multi-day OR 35+ attendees),
// never for a one-day, no-fee session. A single-session booking — a photo/short
// session, or a 1-hour session the operator happened to tag "event" in the Step-1
// gate — must therefore fire NEITHER the multi-day text NOR the cleaner email.
// Each concern is gated by its OWN correct condition so no case is over- or
// under-notified (the old code fired the whole bundle on any-event, which sent a
// "multi-day event booked" text + cleaner email for a one-hour session).
function multidaySendPlan(ctx) {
  const days = (ctx && ctx.days && ctx.days.length) || 0;
  const isMultiDay = days >= 2;
  const cleaningNeeded = (Number(ctx && ctx.cleaningFeeCents) || 0) > 0;
  const crew = !!(ctx && ctx.crewAdded && ctx.crewPlacements);
  return {
    customerRecap: isMultiDay,
    ownerRecap: isMultiDay,
    ownerSms: isMultiDay,
    crewSms: isMultiDay && crew,
    cleaner: cleaningNeeded
  };
}

// --------------------------------------------------------------------------
// Orchestrator — fire ALL event-level notifications ONCE. Every send is isolated
// so one failure never blocks the others or the (already committed) booking.
// Each send is gated by multidaySendPlan(ctx) so a single-session/no-fee booking
// fires nothing (DREW-29).
// --------------------------------------------------------------------------
async function notifyMultidayEvent(ctx) {
  if (!ctx || !ctx.days || !ctx.days.length) return;

  const staging = isStaging();
  const sink = staging ? stagingSinkEmail() : null;
  const contact = ctx.contact || {};
  const name = fullName(contact) || "event";
  const range = fmtDateRange(ctx.days[0].datetime, ctx.days[ctx.days.length - 1].datetime);
  const firstApptId = ctx.days[0].appointmentId;
  const plan = multidaySendPlan(ctx);

  // ---- Item 1: customer recap email (multi-day only) ----
  try {
    const to = staging ? sink : contact.email;
    if (plan.customerRecap && to) {
      await sendResend({
        from: "WhiteWall Studios <contact@whitewallstudios.co>",
        to: [to],
        reply_to: ["contact@whitewallstudios.co"],
        subject: "Your WhiteWall multi-day event is confirmed — " + range,
        text: buildCustomerRecapEmail(ctx)
      });
    }
  } catch (e) { console.error("notify-multiday: customer recap failed", e.message); }

  // ---- Item 2 (companion): owner recap email (multi-day only) ----
  try {
    const ownerTo = staging ? sink : process.env.NOTIFICATION_EMAIL;
    if (plan.ownerRecap && ownerTo) {
      await sendResend({
        from: "WhiteWall Studios <contact@whitewallstudios.co>",
        to: [ownerTo],
        subject: "[White Wall] MULTI-DAY EVENT — " + name + " — " + range,
        text: buildOwnerRecapEmail(ctx)
      });
    }
  } catch (e) { console.error("notify-multiday: owner recap failed", e.message); }

  // ---- Item 4: April cleaner email (keyed to last day + crew-aware) ----
  // Sent BEFORE the owner SMS so the SMS's "cleaners emailed" line is truthful.
  // Gated on plan.cleaner (a real cleaning fee), NOT on event-ness, so a no-fee
  // session never emails April (DREW-29).
  try {
    const cleanerTo = staging ? sink : process.env.CLEANER_EMAIL;
    if (plan.cleaner && cleanerTo && process.env.RESEND_API_KEY) {
      const lastDay = ctx.days[ctx.days.length - 1];
      const lastEnd = endOfSession(lastDay.datetime, lastDay.typeId);
      const timing = cleanerTiming(lastEnd, ctx.crewAdded);
      const ics = buildIcs({
        appointmentId: lastDay.appointmentId,
        start: timing.arrive,
        end: timing.windowEnd,
        summary: "WhiteWall cleaning — " + name + " (event)",
        description: name + " event (" + (ctx.headcount || "?") + " ppl) ends " + fmtDateTime(lastEnd.toISOString())
          + (timing.crew ? ". Setup crew resets first; arrive 1.5h after end." : ".") + " Acuity ID " + lastDay.appointmentId,
        location: STUDIO_ADDRESS[ctx.location] || ""
      });
      await sendResend({
        from: "WhiteWall Studios <contact@whitewallstudios.co>",
        to: [cleanerTo],
        reply_to: ["contact@whitewallstudios.co"],
        subject: "Cleaning needed (event) — " + name + " — " + fmtDateTime(timing.arrive.toISOString()),
        text: buildCleanerEmailBody(ctx, timing),
        attachments: [{
          filename: "wws-cleaning-" + lastDay.appointmentId + ".ics",
          content: Buffer.from(ics, "utf8").toString("base64"),
          content_type: "text/calendar; method=REQUEST; charset=UTF-8"
        }]
      });
    }
  } catch (e) { console.error("notify-multiday: cleaner email failed", e.message); }

  // ---- Item 2: owner Watson SMS (event summary, multi-day only) ----
  if (plan.ownerSms) {
    try {
      await sendOwnerSMS(buildOwnerEventSms(ctx), "mdevt-" + firstApptId);
    } catch (e) { console.error("notify-multiday: owner SMS failed", e.message); }
  }

  // ---- Item 3: SECOND owner Watson SMS — ONLY if the setup crew was added ----
  if (plan.crewSms) {
    try {
      await sendOwnerSMS(buildCrewSms(ctx), "mdcrew-" + firstApptId);
    } catch (e) { console.error("notify-multiday: crew SMS failed", e.message); }
  }
}

module.exports = {
  notifyMultidayEvent,
  multidaySendPlan,
  buildEventRecapLines,
  buildCustomerRecapEmail,
  buildOwnerRecapEmail,
  buildOwnerEventSms,
  buildCrewSms,
  buildCleanerEmailBody,
  buildManualChargeReminderSms,
  cleanerTiming,
  fmtDateRange
};
