// Event Setup and Reset Crew notifications (DREW-80, item 4b + 4c).
//
// Fires ONLY when a booking includes the "setup-crew" add-on. Two dedicated
// emails, both isolated + best-effort (a send failure never unwinds a paid,
// booked appointment), env-gated exactly like notify-owner / notify-cleaner:
//
//   1. Owner  (NOTIFICATION_EMAIL, Drew's inbox) — an "Action required"
//      heads-up whose FIRST line deep-links straight to this session's booking
//      in the ops dashboard, then the fields Drew needs to act (name, date,
//      amount, add-ons, phone, email). This is IN ADDITION to the every-booking
//      owner confirmation from notify-owner.
//   2. April  (CLEANER_EMAIL) — a short, event-scoped heads-up that she is
//      needed for the setup BEFORE the event and the reset/cleanup AFTER. This
//      is IN ADDITION to the crew section notify-cleaner appends to her existing
//      cleaning-fee email (which only fires when a cleaning fee applies).
//
// Placement questions were removed in DREW-80 — the crew coordinates item
// placement with the client directly, so nothing here lists placements.
//
// Env vars: RESEND_API_KEY, NOTIFICATION_EMAIL, CLEANER_EMAIL. Dashboard base
// URL is DASHBOARD_URL (defaults to the prod ops dashboard).

const { buildSquareLineItems } = require("./acuity");

const DASHBOARD_BASE_URL = process.env.DASHBOARD_URL || "https://wws.entrpy.co";

function hasCrewAddon(bookingState) {
  return !!(bookingState && bookingState.addons
    && bookingState.addons["setup-crew"] && bookingState.addons["setup-crew"].selected);
}

function locationLabel(slug) {
  return slug === "powdersville" ? "Flagship (Powdersville)" : "Taylor's Mill";
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    });
  } catch (e) { return iso; }
}

function fmtMoney(cents) {
  return "$" + (Number(cents || 0) / 100).toFixed(2);
}

// Full booking amount in cents. Prefer an explicit total (the multi-day cart
// passes the already-computed grand total); otherwise sum this session's Square
// line items + any cleaning fee, mirroring notify-owner's pricing math.
function amountCentsFor(bookingState, opts) {
  if (opts && Number.isFinite(opts.amountCents)) return opts.amountCents;
  var total = 0;
  try {
    var items = buildSquareLineItems(
      bookingState.appointmentTypeID,
      bookingState.addons,
      bookingState.location
    );
    total = items.reduce(function (sum, li) { return sum + li.amount * (li.quantity || 1); }, 0);
  } catch (e) { total = 0; }
  if (bookingState.cleaningFee && bookingState.cleaningFee.amount > 0) {
    total += Math.round(bookingState.cleaningFee.amount * 100);
  }
  return total;
}

// Add-on lines for the owner email. Reuses the Square line items so the wording
// matches the itemized checkout the customer paid; drops the base session line.
function addonLinesFor(bookingState) {
  var lines = [];
  try {
    var items = buildSquareLineItems(
      bookingState.appointmentTypeID,
      bookingState.addons,
      bookingState.location
    );
    items.forEach(function (li) {
      if (!li.addonId) return; // skip the base session
      var qty = (li.quantity && li.quantity > 1) ? " x " + li.quantity : "";
      lines.push("  " + li.name + qty + " — " + fmtMoney(li.amount * (li.quantity || 1)));
    });
  } catch (e) { /* fall through to empty */ }
  return lines;
}

function customerName(bookingState) {
  var c = bookingState.contact || {};
  return ((c.firstName || "") + " " + (c.lastName || "")).trim() || "(no name)";
}

// dateLabel: multi-day passes a range string; single-session formats datetime.
function dateLabelFor(bookingState, opts) {
  if (opts && opts.dateLabel) return opts.dateLabel;
  return fmtDateTime(bookingState.datetime);
}

// 4c — Owner "Action required" email. First line is the dashboard deep link.
function buildCrewOwnerEmail(bookingState, appointmentId, opts) {
  const contact = bookingState.contact || {};
  const deepLink = DASHBOARD_BASE_URL + "/bookings/" + (appointmentId || "");
  const addonLines = addonLinesFor(bookingState);

  const sections = [
    "Visit this session's booking in the dashboard: " + deepLink,
    "",
    "This booking includes the Event Setup and Reset Crew add-on, so it needs the crew scheduled for setup before the event and reset/cleanup after.",
    "",
    "Customer:    " + customerName(bookingState),
    "Date:        " + dateLabelFor(bookingState, opts),
    "Location:    " + locationLabel(bookingState.location),
    "Amount paid: " + fmtMoney(amountCentsFor(bookingState, opts)),
    "Phone:       " + (contact.phone || "—"),
    "Email:       " + (contact.email || "—"),
    ""
  ];
  if (addonLines.length) {
    sections.push("Add-ons:");
    addonLines.forEach(function (l) { sections.push(l); });
  } else {
    sections.push("Add-ons: Event Setup and Reset Crew");
  }
  sections.push(
    "",
    "—",
    "Acuity appointment ID: " + (appointmentId || "—"),
    "Booked via whitewallstudios.co"
  );

  return {
    subject: "Action required: SETUP/RESET ADD-ON for Session #" + (appointmentId || "—"),
    text: sections.join("\n")
  };
}

// 4b (dedicated) — short, event-scoped heads-up to April.
function buildCrewCleanerEmail(bookingState, appointmentId, opts) {
  const contact = bookingState.contact || {};
  const name = customerName(bookingState);
  const dateLabel = dateLabelFor(bookingState, opts);

  const text = [
    "Hi April,",
    "",
    "Heads-up: an upcoming event at our " + locationLabel(bookingState.location) + " location booked the Event Setup and Reset Crew add-on, so you're needed for this one.",
    "",
    "You're on for BOTH ends of this event:",
    "  • BEFORE the event — set the space up (tear down the standard floor plan, stage the rented items in the middle).",
    "  • AFTER the event — full reset and cleanup (pack everything back onto the dollies, return furniture to its normal places).",
    "",
    "Customer: " + name,
    "Event:    " + dateLabel,
    "Location: " + locationLabel(bookingState.location),
    "Phone:    " + (contact.phone || "—"),
    "",
    "We coordinate exactly what moves where with the client directly before the event, so you'll get the plan ahead of time.",
    "",
    "Please reply to confirm you've got this one.",
    "",
    "Thanks,",
    "WhiteWall Studios",
    "",
    "—",
    "Acuity appointment ID: " + (appointmentId || "—")
  ].join("\n");

  return {
    subject: "Setup + reset crew needed — " + name + " — " + dateLabel,
    text: text
  };
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
      console.error("notify-crew: Resend API error", res.status, errText);
    }
  } catch (err) {
    console.error("notify-crew: failed to send", err.message);
  }
}

// Fire the crew notifications. No-op unless the booking carries the crew add-on.
// Each send is isolated so one failure can't block the other or the booking.
async function notifyCrew(bookingState, appointmentId, opts) {
  if (!hasCrewAddon(bookingState)) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("notify-crew: RESEND_API_KEY not set, skipping");
    return;
  }

  const ownerEmail = process.env.NOTIFICATION_EMAIL;
  const cleanerEmail = process.env.CLEANER_EMAIL;

  if (ownerEmail) {
    const owner = buildCrewOwnerEmail(bookingState, appointmentId, opts);
    await sendResend(apiKey, {
      from: "WhiteWall Studios <contact@whitewallstudios.co>",
      to: [ownerEmail],
      subject: owner.subject,
      text: owner.text
    });
  } else {
    console.warn("notify-crew: NOTIFICATION_EMAIL not set, skipping owner email");
  }

  if (cleanerEmail) {
    const cleaner = buildCrewCleanerEmail(bookingState, appointmentId, opts);
    await sendResend(apiKey, {
      from: "WhiteWall Studios <contact@whitewallstudios.co>",
      to: [cleanerEmail],
      reply_to: ["contact@whitewallstudios.co"],
      subject: cleaner.subject,
      text: cleaner.text
    });
  } else {
    console.warn("notify-crew: CLEANER_EMAIL not set, skipping April email");
  }
}

module.exports = { notifyCrew, hasCrewAddon, buildCrewOwnerEmail, buildCrewCleanerEmail };
