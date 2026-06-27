// Sends an iMessage notification to Drew via Blue Bubbles running on
// Watson (Drew's Mac mini). Watson is exposed publicly via Cloudflare
// Tunnel; Cloudflare Access service-token gates inbound traffic at the
// edge, so unauthenticated requests never reach Blue Bubbles.
//
// Triggers:
//   - 35+ event booking, OR
//   - any 3+ hour shoot (kept deliberately broad — over-notify rather than
//     under-notify; events 3hr+ still text Drew even under 35 people)
//
// Two layers of auth on every call:
//   1. CF-Access-Client-Id + CF-Access-Client-Secret — verified at Cloudflare's
//      edge before any traffic reaches Watson.
//   2. Blue Bubbles password (`guid` query param) — verified by BB once the
//      request lands.
//
// Env vars:
//   WATSON_SMS_URL                     Cloudflare Tunnel hostname for BB
//                                      (e.g. https://wws-bb.entrpy.co)
//   WATSON_CF_ACCESS_CLIENT_ID         Cloudflare Access service token ID
//   WATSON_CF_ACCESS_CLIENT_SECRET     Cloudflare Access service token secret
//   BLUEBUBBLES_PASSWORD               BB Server API password
//   OWNER_PHONE                        Drew's iMessage handle, e.g. "+18038738153"

const { TYPE_TO_DURATION, SESSION_PRICES, buildSquareLineItems } = require("./acuity");

const SMS_DURATION_THRESHOLD_MIN = 180;     // 3+ hour shoot
const SMS_PARTICIPANT_THRESHOLD = 35;       // 35+ event

function shouldNotifyOwnerSMS(bookingState) {
  const durationMin = TYPE_TO_DURATION[String(bookingState.appointmentTypeID)] || 0;
  const participants = Number(bookingState.participants) || Number((bookingState.intake || {}).participants) || 0;
  const isLongShoot = durationMin >= SMS_DURATION_THRESHOLD_MIN;
  const isHighTrafficEvent = bookingState.eventIntent === "yes" && participants >= SMS_PARTICIPANT_THRESHOLD;
  return isLongShoot || isHighTrafficEvent;
}

function fmtShortDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch (e) { return iso; }
}

function buildSmsText(bookingState, appointmentId) {
  const contact = bookingState.contact || {};
  const fullName = ((contact.firstName || "") + " " + (contact.lastName || "")).trim() || "(no name)";
  const session = SESSION_PRICES[String(bookingState.appointmentTypeID)] || { label: "Session" };
  const durationMin = TYPE_TO_DURATION[String(bookingState.appointmentTypeID)] || 0;
  const participants = Number(bookingState.participants) || Number((bookingState.intake || {}).participants) || 0;
  const locName = bookingState.location === "powdersville" ? "Flagship" : "TM";

  // Trigger reason — show why this fired. Flag events whenever eventIntent is
  // "yes" (not just at the 35+ threshold) so a long event under 35 people still
  // reads as an event in the header, not just a "3hr shoot".
  const reasons = [];
  if (bookingState.eventIntent === "yes") {
    reasons.push(participants ? "event " + participants + "ppl" : "event");
  }
  if (durationMin >= SMS_DURATION_THRESHOLD_MIN) {
    reasons.push((durationMin / 60).toFixed(0) + "hr shoot");
  }

  // Total
  let totalCents = 0;
  try {
    const items = buildSquareLineItems(bookingState.appointmentTypeID, bookingState.addons, bookingState.location);
    totalCents = items.reduce(function (s, li) { return s + li.amount * (li.quantity || 1); }, 0);
    if (bookingState.cleaningFee && bookingState.cleaningFee.amount > 0) totalCents += bookingState.cleaningFee.amount * 100;
  } catch (e) { /* fall through with 0 */ }

  const lines = [
    "[WhiteWall] " + reasons.join(" + ") + " booking",
    fullName + " — " + locName,
    fmtShortDateTime(bookingState.datetime) + " (" + session.label + ")",
    "Total: $" + (totalCents / 100).toFixed(2),
    "Acuity #" + appointmentId
  ];
  if (bookingState.eventDescription) lines.push("\"" + bookingState.eventDescription + "\"");
  return lines.join("\n");
}

// Full-comp alert (Drew round 7): when a 100%-off code (WWSHUNDRED) is used, text
// Drew unconditionally — there is no threshold gate, because a comped booking is
// always notable. Built from the booking state. Best-effort (never throws).
//
//   "Yo, WhiteWall just had a 100% off code used. Client name <name>, <photo or
//    event> booking, <duration> shoot starting <time> on <date>. Add-ons: <list
//    or 'none'>."
function fmtCompDateTime(iso) {
  if (!iso) return "(unknown time) on (unknown date)";
  try {
    const d = new Date(iso);
    const time = d.toLocaleTimeString("en-US", {
      timeZone: "America/New_York", hour: "numeric", minute: "2-digit"
    });
    const date = d.toLocaleDateString("en-US", {
      timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric"
    });
    return time + " on " + date;
  } catch (e) { return iso; }
}

function fmtDurationLabel(durationMin) {
  const m = Number(durationMin) || 0;
  if (m <= 0) return "session";
  if (m % 60 === 0) return (m / 60) + "hr";
  return m + "min";
}

// Compact, human add-on list for the comp alert. Mirrors the labels in
// acuity.buildAppointmentNotes but kept short for a text message.
function compAddonSummary(addons) {
  addons = addons || {};
  const parts = [];
  if (addons.backdrops) {
    if (addons.backdrops.mode === "all") parts.push("All backdrops");
    else if (addons.backdrops.colors && addons.backdrops.colors.length) parts.push("Backdrops (" + addons.backdrops.colors.length + ")");
  }
  if (addons.lighting && addons.lighting.selected) parts.push("Lighting");
  if (addons["rolling-walls"]) {
    if (addons["rolling-walls"].mode === "all") parts.push("All walls");
    else if (addons["rolling-walls"].walls && addons["rolling-walls"].walls.length) parts.push("Walls (" + addons["rolling-walls"].walls.length + ")");
  }
  if (addons.chairs && addons.chairs.selection) parts.push("Chairs (" + addons.chairs.selection + ")");
  if (addons.tables && addons.tables.quantity > 0) parts.push(addons.tables.quantity + "x table");
  if (addons.tv && addons.tv.selected) parts.push("TV");
  if (addons["pa-system"] && addons["pa-system"].selected) parts.push("PA");
  if (addons["setup-crew"] && addons["setup-crew"].selected) parts.push("Setup crew");
  return parts.length ? parts.join(", ") : "none";
}

function buildCompSmsText(bookingState) {
  const contact = bookingState.contact || {};
  const fullName = ((contact.firstName || "") + " " + (contact.lastName || "")).trim() || "(no name)";
  const kind = bookingState.eventIntent === "yes" ? "event" : "photo";
  const durationMin = TYPE_TO_DURATION[String(bookingState.appointmentTypeID)] || 0;
  const duration = fmtDurationLabel(durationMin);
  const when = fmtCompDateTime(bookingState.datetime);
  const addons = compAddonSummary(bookingState.addons);

  return "Yo, WhiteWall just had a 100% off code used. Client name " + fullName
    + ", " + kind + " booking, " + duration + " shoot starting " + when
    + ". Add-ons: " + addons + ".";
}

// sendOwnerSMS(body, appointmentId) — the raw Watson/Blue Bubbles transport,
// shared by the threshold-gated owner alert and the comp alert. Env-gated and
// best-effort: missing env or a transport error logs and returns (never throws).
async function sendOwnerSMS(body, appointmentId) {
  const url = process.env.WATSON_SMS_URL;
  const cfId = process.env.WATSON_CF_ACCESS_CLIENT_ID;
  const cfSecret = process.env.WATSON_CF_ACCESS_CLIENT_SECRET;
  const bbPassword = process.env.BLUEBUBBLES_PASSWORD;
  const ownerPhone = process.env.OWNER_PHONE;

  if (!url || !cfId || !cfSecret || !bbPassword || !ownerPhone) {
    console.warn("notify-sms: one or more required env vars missing, skipping",
      { url: !!url, cfId: !!cfId, cfSecret: !!cfSecret, bbPassword: !!bbPassword, ownerPhone: !!ownerPhone });
    return;
  }

  // Blue Bubbles API: POST /api/v1/message/text?guid=<password>
  // chatGuid format for iMessage to a phone number: "iMessage;-;<+phone>"
  const tempGuid = "wws-" + appointmentId + "-" + Date.now();
  const endpoint = url.replace(/\/$/, "") + "/api/v1/message/text?password=" + encodeURIComponent(bbPassword);

  // Hard timeout — BB occasionally hangs in validateText for ~120s when its
  // primary AppleScript falls back. Don't let that wedge the booking flow.
  const controller = new AbortController();
  const timeoutId = setTimeout(function () { controller.abort(); }, 8000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "CF-Access-Client-Id": cfId,
        "CF-Access-Client-Secret": cfSecret
      },
      body: JSON.stringify({
        // "any;-;" lets BB pick the right service. "iMessage;-;" forces
        // iMessage but breaks BB's primary AppleScript path on first send
        // and forces the slow fallback that times out validateText (~120s).
        chatGuid: "any;-;" + ownerPhone,
        tempGuid: tempGuid,
        message: body,
        method: "apple-script"
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("notify-sms: Watson/BB error", res.status, errText.slice(0, 500));
    }
  } catch (err) {
    // Note: BB occasionally returns 500 / aborts after sending the message
    // (validateText timeout). The message often went out anyway. Logged for
    // observability but not surfaced to the booking flow.
    console.error("notify-sms: failed to send", err.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

// Threshold-gated owner alert (long shoot / large event). Unchanged behavior:
// env-gated + threshold-gated, then sends the standard booking summary.
async function notifyOwnerSMS(bookingState, appointmentId) {
  if (!shouldNotifyOwnerSMS(bookingState)) return;
  const body = buildSmsText(bookingState, appointmentId);
  return sendOwnerSMS(body, appointmentId);
}

// Comp alert — fired ONLY for a successful 100%-off (comp) booking. No threshold
// gate. Best-effort: must never block or fail the booking.
async function notifyOwnerCompSMS(bookingState, appointmentId) {
  const body = buildCompSmsText(bookingState);
  return sendOwnerSMS(body, appointmentId);
}

module.exports = {
  notifyOwnerSMS,
  notifyOwnerCompSMS,
  shouldNotifyOwnerSMS,
  buildSmsText,
  buildCompSmsText,
  sendOwnerSMS
};
