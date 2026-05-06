// Sends a cleaning-window notification to April (lead cleaner) whenever a
// booking triggers a cleaning fee. Includes an .ics attachment so she can
// add the cleaning window to her calendar in one tap.
//
// Triggers whenever bookingState.cleaningFee.amount > 0 — fires at both
// Powdersville and Taylor's Mill (Drew confirmed 2026-05-05 that April
// covers both locations).
//
// Env vars: RESEND_API_KEY, CLEANER_EMAIL (April's email address)

const STUDIO_ADDRESS = {
  powdersville: "WhiteWall Studios — 2699 Powdersville Rd, Easley, SC 29642",
  "taylors-mill": "WhiteWall Studios — 250 Mill St, Ste BL1223, Taylors, SC 29687"
};

const CLEANING_BUFFER_MINUTES = 150; // matches booking-callback.js block size

function pad(n) { return n < 10 ? "0" + n : "" + n; }

function toICalUTC(d) {
  return d.getUTCFullYear()
    + pad(d.getUTCMonth() + 1)
    + pad(d.getUTCDate())
    + "T"
    + pad(d.getUTCHours())
    + pad(d.getUTCMinutes())
    + pad(d.getUTCSeconds())
    + "Z";
}

function escIcs(s) {
  return String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildIcs(opts) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WhiteWall Studios//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    "UID:cleaning-" + opts.appointmentId + "@whitewallstudios.co",
    "DTSTAMP:" + toICalUTC(new Date()),
    "DTSTART:" + toICalUTC(opts.start),
    "DTEND:" + toICalUTC(opts.end),
    "SUMMARY:" + escIcs(opts.summary),
    "DESCRIPTION:" + escIcs(opts.description),
    "LOCATION:" + escIcs(opts.location),
    "STATUS:CONFIRMED",
    "ORGANIZER;CN=WhiteWall Studios:mailto:contact@whitewallstudios.co",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:WhiteWall cleaning starts in 30 minutes",
    "TRIGGER:-PT30M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  return lines.join("\r\n");
}

function fmtLocal(iso) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    });
  } catch (e) { return iso; }
}

function buildCleanerEmailBody(opts) {
  return [
    "Hi April,",
    "",
    "A new booking at our " + opts.locationName + " location needs a full studio reset & clean after the session ends.",
    "",
    "Customer:        " + opts.customerName,
    "Event size:      " + opts.participants + " people",
    "",
    "Session ends:    " + fmtLocal(opts.sessionEnd.toISOString()),
    "Cleaning window: " + fmtLocal(opts.sessionEnd.toISOString()) + " → " + fmtLocal(opts.bufferEnd.toISOString()),
    "                 (2.5 hour buffer is blocked on the calendar)",
    "",
    "Studio:          " + opts.address,
    "",
    "An .ics attachment is included — open it on your phone or computer to add this to your calendar in one tap.",
    "",
    "Please reply to confirm you've got it on your calendar so we know you're set.",
    "",
    "Thanks,",
    "WhiteWall Studios",
    "",
    "—",
    "Acuity appointment ID: " + opts.appointmentId
  ].join("\n");
}

async function notifyCleaner(bookingState, appointmentId) {
  const apiKey = process.env.RESEND_API_KEY;
  const cleanerEmail = process.env.CLEANER_EMAIL;
  if (!apiKey || !cleanerEmail) {
    console.warn("notify-cleaner: RESEND_API_KEY or CLEANER_EMAIL not set, skipping");
    return;
  }

  // Only fire when there's actually a cleaning fee + buffer block
  if (!bookingState.cleaningFee || bookingState.cleaningFee.amount <= 0) return;

  const TYPE_TO_DURATION = require("./acuity").TYPE_TO_DURATION;
  const durationMin = TYPE_TO_DURATION[String(bookingState.appointmentTypeID)] || 60;
  const sessionStart = new Date(bookingState.datetime);
  const sessionEnd = new Date(sessionStart.getTime() + durationMin * 60000);
  const bufferEnd = new Date(sessionEnd.getTime() + CLEANING_BUFFER_MINUTES * 60000);

  const contact = bookingState.contact || {};
  const customerName = ((contact.firstName || "") + " " + (contact.lastName || "")).trim() || "(no name)";
  const participants = Number(bookingState.participants) || Number((bookingState.intake || {}).participants) || 0;
  const locationName = bookingState.location === "powdersville" ? "Flagship (Powdersville)" : "Taylor's Mill";
  const address = STUDIO_ADDRESS[bookingState.location] || "";

  const ics = buildIcs({
    appointmentId: appointmentId,
    start: sessionEnd,
    end: bufferEnd,
    summary: "WhiteWall cleaning — " + customerName + " session",
    description: customerName + " session (" + participants + " ppl) ends at " + fmtLocal(sessionEnd.toISOString()) + ". Full studio reset & clean. Acuity ID " + appointmentId,
    location: address
  });

  const body = buildCleanerEmailBody({
    locationName: locationName,
    customerName: customerName,
    participants: participants,
    sessionEnd: sessionEnd,
    bufferEnd: bufferEnd,
    address: address,
    appointmentId: appointmentId
  });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "WhiteWall Studios <contact@whitewallstudios.co>",
        to: [cleanerEmail],
        reply_to: ["contact@whitewallstudios.co"],
        subject: "Cleaning needed — " + customerName + " — " + fmtLocal(sessionEnd.toISOString()),
        text: body,
        attachments: [{
          filename: "wws-cleaning-" + appointmentId + ".ics",
          content: Buffer.from(ics, "utf8").toString("base64"),
          content_type: "text/calendar; method=REQUEST; charset=UTF-8"
        }]
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("notify-cleaner: Resend API error", res.status, errText);
    }
  } catch (err) {
    console.error("notify-cleaner: failed to send", err.message);
  }
}

module.exports = { notifyCleaner, buildIcs, buildCleanerEmailBody };
