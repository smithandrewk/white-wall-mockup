// Internal module — sends booking confirmation emails after a successful booking.
// Called from booking-callback.js, not exposed as an endpoint.
//
// Two recipients:
//   1. Owner (Drew) — every booking, full detail. NOTIFICATION_EMAIL env var.
//   2. Customer    — same content, framed as their confirmation. They reply-to.
//
// 35+ participant bookings get a "HIGH TRAFFIC" subject prefix so Drew can filter.
//
// Uses Resend API (raw fetch, no SDK needed).
// Env vars: RESEND_API_KEY, NOTIFICATION_EMAIL

const { SESSION_PRICES, buildSquareLineItems } = require("./_lib/acuity");
const { buildWaiverText } = require("./_lib/waiver-text");

function fmtMoney(cents) {
  return "$" + (cents / 100).toFixed(2);
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    });
  } catch (e) { return iso; }
}

function locationLabel(slug) {
  return slug === "powdersville" ? "Flagship Location (Powdersville)" : "Taylor's Mill";
}

// Pretty-print add-on selections — what specifically the customer chose.
function describeAddons(addons) {
  if (!addons) return [];
  const lines = [];

  if (addons.backdrops) {
    if (addons.backdrops.mode === "all") {
      lines.push("Backdrops: ALL backdrops");
    } else if (addons.backdrops.colors && addons.backdrops.colors.length) {
      lines.push("Backdrops (" + addons.backdrops.colors.length + "): " + addons.backdrops.colors.join(", "));
    }
  }
  if (addons.lighting && addons.lighting.selected) lines.push("Lighting Rental");
  if (addons["rolling-walls"]) {
    if (addons["rolling-walls"].mode === "all") {
      lines.push("Rolling Walls: ALL walls");
    } else if (addons["rolling-walls"].walls && addons["rolling-walls"].walls.length) {
      lines.push("Rolling Walls (" + addons["rolling-walls"].walls.length + "): " + addons["rolling-walls"].walls.join(", "));
    }
  }
  if (addons.chairs && addons.chairs.selection) lines.push("Chairs: " + addons.chairs.selection + " chair tier");
  if (addons.tables && addons.tables.quantity > 0) lines.push("8ft Folding Tables: " + addons.tables.quantity);
  if (addons.tv && addons.tv.selected) lines.push("86\" Rolling TV");
  if (addons["pa-system"] && addons["pa-system"].selected) lines.push("PA System");

  return lines;
}

function buildPricingBreakdown(bookingState) {
  const lineItems = buildSquareLineItems(
    bookingState.appointmentTypeID,
    bookingState.addons,
    bookingState.location
  );
  const lines = lineItems.map(function (li) {
    const lineTotal = (li.amount * (li.quantity || 1)) / 100;
    const qtyLabel = li.quantity > 1 ? " × " + li.quantity : "";
    return "  " + li.name + qtyLabel + "  —  $" + lineTotal.toFixed(2);
  });
  let total = lineItems.reduce(function (sum, li) {
    return sum + li.amount * (li.quantity || 1);
  }, 0);
  if (bookingState.cleaningFee && bookingState.cleaningFee.amount > 0) {
    lines.push("  Cleaning Fee  —  $" + bookingState.cleaningFee.amount.toFixed(2));
    total += bookingState.cleaningFee.amount * 100;
  }
  lines.push("  ─────");
  lines.push("  TOTAL  —  $" + (total / 100).toFixed(2));
  return lines.join("\n");
}

function buildEmailBody(bookingState, appointmentId, recipientType) {
  const contact = bookingState.contact || {};
  const intake = bookingState.intake || {};
  const addons = bookingState.addons || {};
  const fullName = ((contact.firstName || "") + " " + (contact.lastName || "")).trim();
  const session = SESSION_PRICES[String(bookingState.appointmentTypeID)] || { label: "Session" };
  const participantsForFlag = Number(bookingState.participants) || Number(intake.participants) || 0;
  const isHighTraffic = participantsForFlag >= 35;

  const sections = [];

  // Header
  if (recipientType === "customer") {
    sections.push(
      "Hi " + (contact.firstName || "there") + ",",
      "",
      "Your booking at WhiteWall Studios is confirmed. Below is everything we have on file. Please save this email — it includes the waiver you signed.",
      "",
      "If you need to reach us: contact@whitewallstudios.co or text (803) 873-8153."
    );
  } else {
    sections.push(
      "New booking on whitewallstudios.co.",
      "",
      isHighTraffic
        ? ">>> HIGH TRAFFIC: " + participantsForFlag + " participants — review for follow-up <<<"
        : "Standard booking."
    );
  }

  // Session
  sections.push(
    "",
    "═══════════════════════════════════════",
    "SESSION",
    "═══════════════════════════════════════",
    "Customer:     " + (fullName || "—"),
    "Email:        " + (contact.email || "—"),
    "Phone:        " + (contact.phone || "—"),
    "",
    "Location:     " + locationLabel(bookingState.location),
    "Date/Time:    " + fmtDateTime(bookingState.datetime),
    "Session:      " + session.label,
    "Acuity ID:    " + (appointmentId || "—")
  );

  // Intake
  sections.push(
    "",
    "═══════════════════════════════════════",
    "INTAKE FORM",
    "═══════════════════════════════════════",
    "Business name:        " + (intake.business || "—"),
    "Total participants:   " + (intake.participants || "—"),
    "Instagram:            " + (intake.instagram || "—"),
    "Will read full email: " + (intake.readEmail ? "Yes" : "No")
  );

  // Event
  if (bookingState.eventIntent === "yes") {
    sections.push(
      "",
      "═══════════════════════════════════════",
      "EVENT DETAILS",
      "═══════════════════════════════════════",
      "Event guests:    " + (bookingState.participants || "—"),
      "Food/drinks:     " + (bookingState.foodDrinks ? "Yes" : "No"),
      "Description:     " + (bookingState.eventDescription || "—")
    );
    if (bookingState.highTrafficNote) {
      sections.push("Customer note (35+):", bookingState.highTrafficNote);
    }
  }
  if (bookingState.tmHighTrafficNote) {
    sections.push("", "TM high-traffic note:", bookingState.tmHighTrafficNote);
  }

  // Add-ons
  const addonLines = describeAddons(addons);
  if (addonLines.length) {
    sections.push(
      "",
      "═══════════════════════════════════════",
      "ADD-ONS",
      "═══════════════════════════════════════"
    );
    addonLines.forEach(function (l) { sections.push("  " + l); });
  }

  // Pricing
  sections.push(
    "",
    "═══════════════════════════════════════",
    "PRICING",
    "═══════════════════════════════════════",
    buildPricingBreakdown(bookingState)
  );

  // Cleaning fee context
  if (bookingState.cleaningFee && bookingState.cleaningFee.amount > 0) {
    sections.push(
      "",
      "Cleaning fee applies (" + (participantsForFlag >= 50 ? "50+" : "35+") + " participants).",
      "A 2.5-hour cleaning buffer has been blocked on the calendar after your session ends."
    );
  }

  // Signatures
  sections.push(
    "",
    "═══════════════════════════════════════",
    "SIGNATURES",
    "═══════════════════════════════════════",
    "Email-acknowledgment signature: " + (bookingState.emailAcknowledgment || "—"),
    "Terms signature:                " + (bookingState.termsSignature || "—"),
    "Waiver signed:                  " + (bookingState.waiverSigned ? "Yes" : "No")
  );

  // Waiver
  sections.push(
    "",
    "═══════════════════════════════════════",
    "LIABILITY WAIVER (FULL TEXT)",
    "═══════════════════════════════════════",
    buildWaiverText({
      fullName: fullName || (contact.firstName || ""),
      locationSlug: bookingState.location,
      signedAt: bookingState.datetime
    })
  );

  // Footer
  sections.push(
    "",
    "───────────────────────────────────────",
    "Booked via whitewallstudios.co"
  );

  return sections.join("\n");
}

async function notifyOwner(bookingState, appointmentId) {
  const apiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !ownerEmail) {
    console.warn("notify-owner: RESEND_API_KEY or NOTIFICATION_EMAIL not set, skipping");
    return;
  }

  const contact = bookingState.contact || {};
  const customerEmail = contact.email;
  const fullName = ((contact.firstName || "") + " " + (contact.lastName || "")).trim();
  const participants = Number(bookingState.participants) || Number((bookingState.intake || {}).participants) || 0;
  const isHighTraffic = participants >= 35;
  const locName = locationLabel(bookingState.location);

  const ownerSubject = isHighTraffic
    ? "[White Wall] HIGH TRAFFIC (" + participants + ") — " + fullName + " — " + locName
    : "[White Wall] New Booking — " + fullName + " — " + locName;

  const customerSubject = "Your WhiteWall Studios booking is confirmed";

  const ownerBody = buildEmailBody(bookingState, appointmentId, "owner");
  const customerBody = buildEmailBody(bookingState, appointmentId, "customer");

  // Send to owner
  await sendResend(apiKey, {
    from: "WhiteWall Studios <contact@whitewallstudios.co>",
    to: [ownerEmail],
    subject: ownerSubject,
    text: ownerBody
  });

  // Send to customer (if we have an email)
  if (customerEmail) {
    await sendResend(apiKey, {
      from: "WhiteWall Studios <contact@whitewallstudios.co>",
      to: [customerEmail],
      reply_to: ["contact@whitewallstudios.co"],
      subject: customerSubject,
      text: customerBody
    });
  }
}

async function sendResend(apiKey, payload) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("notify-owner: Resend API error", res.status, errText);
    }
  } catch (err) {
    // Don't let notification failure affect the booking flow
    console.error("notify-owner: failed to send", err.message);
  }
}

module.exports = { notifyOwner, buildEmailBody };
