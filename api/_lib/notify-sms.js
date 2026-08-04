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

// Format the customer-entered phone as (xxx) xxx-xxxx when it is a clean US
// 10-digit number (or 11 digits with a leading 1). Anything else is shown as
// the customer typed it, trimmed; empty → "—". Illustrative only — never blocks.
function fmtPhone(raw) {
  const s = String(raw == null ? "" : raw).trim();
  if (!s) return "—";
  const digits = s.replace(/\D/g, "");
  const ten = digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits;
  if (ten.length === 10) {
    return "(" + ten.slice(0, 3) + ") " + ten.slice(3, 6) + "-" + ten.slice(6);
  }
  return s;
}

// Money for the owner texts, with thousands separators, matching the examples
// Drew approved (e.g. "$1,450.00", "$4,173.30"). Cents in → "$#,###.##".
function fmtUsd(cents) {
  const n = (Number(cents) || 0) / 100;
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Session Type line — locked to Drew's three options only (DREW-30). The
// single-session + comp builders can only ever produce Event or Photo/video;
// the multi-day builder hardcodes "Multi-day event" on its own.
function sessionTypeLabel(bookingState) {
  return bookingState && bookingState.eventIntent === "yes" ? "Event" : "Photo/video";
}

// Section 1 — large / long single booking. Reformatted 2026-07-30 (DREW-30) onto
// the labeled line-item skeleton Drew standardized on, matching the multi-day text:
//   [WhiteWall] New booking
//   Client Name / Session Type / Client Phone / Location / When / People / Use /
//   Total / Cleaners emailed / Acuity #
// People and Use lines are omitted when empty (never "People: 0"); "Cleaners
// emailed" reports whether the booking NEEDED the cleaners (hit the fee), not send
// success — the truthful reading Drew asked for.
function buildSmsText(bookingState, appointmentId) {
  const contact = bookingState.contact || {};
  const fullName = ((contact.firstName || "") + " " + (contact.lastName || "")).trim() || "(no name)";
  const session = SESSION_PRICES[String(bookingState.appointmentTypeID)] || { label: "Session" };
  const participants = Number(bookingState.participants) || Number((bookingState.intake || {}).participants) || 0;
  const locName = bookingState.location === "powdersville" ? "Flagship" : "TM";
  const cleanersNeeded = !!(bookingState.cleaningFee && bookingState.cleaningFee.amount > 0);

  // Total
  let totalCents = 0;
  try {
    const items = buildSquareLineItems(bookingState.appointmentTypeID, bookingState.addons, bookingState.location);
    totalCents = items.reduce(function (s, li) { return s + li.amount * (li.quantity || 1); }, 0);
    if (cleanersNeeded) totalCents += bookingState.cleaningFee.amount * 100;
  } catch (e) { /* fall through with 0 */ }

  const lines = [
    "[WhiteWall] New booking",
    "Client Name: " + fullName,
    "Session Type: " + sessionTypeLabel(bookingState),
    "Client Phone: " + fmtPhone(contact.phone),
    "Location: " + locName,
    "When: " + fmtShortDateTime(bookingState.datetime) + " (" + session.label + ")"
  ];
  if (participants) lines.push("People: " + participants);
  if (bookingState.eventDescription) lines.push("Use: " + bookingState.eventDescription);
  lines.push("Total: " + fmtUsd(totalCents));
  lines.push("Cleaners emailed: " + (cleanersNeeded ? "Yes" : "No"));
  lines.push("Acuity #" + appointmentId);
  return lines.join("\n");
}

// Full-comp alert (Drew round 7): when a 100%-off code (WWSHUNDRED) is used, text
// Drew unconditionally — there is no threshold gate, because a comped booking is
// always notable. Built from the booking state. Best-effort (never throws).
//
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

// Section 2 — 100%-off (comp) alert. Reformatted 2026-07-30 (DREW-30) onto the same
// labeled skeleton as Section 1, keeping the "100% off code used" header so a comp
// still jumps out, plus the Add-ons line, "Total: $0.00 (100% off)", the Acuity #,
// and the truthful Cleaners-emailed line.
function buildCompSmsText(bookingState, appointmentId) {
  const contact = bookingState.contact || {};
  const fullName = ((contact.firstName || "") + " " + (contact.lastName || "")).trim() || "(no name)";
  const session = SESSION_PRICES[String(bookingState.appointmentTypeID)] || { label: "Session" };
  const participants = Number(bookingState.participants) || Number((bookingState.intake || {}).participants) || 0;
  const locName = bookingState.location === "powdersville" ? "Flagship" : "TM";
  const cleanersNeeded = !!(bookingState.cleaningFee && bookingState.cleaningFee.amount > 0);

  const lines = [
    "[WhiteWall] 100% off code used",
    "Client Name: " + fullName,
    "Session Type: " + sessionTypeLabel(bookingState),
    "Client Phone: " + fmtPhone(contact.phone),
    "Location: " + locName,
    "When: " + fmtShortDateTime(bookingState.datetime) + " (" + session.label + ")"
  ];
  if (participants) lines.push("People: " + participants);
  if (bookingState.eventDescription) lines.push("Use: " + bookingState.eventDescription);
  lines.push("Add-ons: " + compAddonSummary(bookingState.addons));
  lines.push("Total: $0.00 (100% off)");
  lines.push("Cleaners emailed: " + (cleanersNeeded ? "Yes" : "No"));
  lines.push("Acuity #" + appointmentId);
  return lines.join("\n");
}

// Normalize a phone/handle for Blue Bubbles. OWNER_PHONE is already E.164
// ("+18038738153"); this makes MAX_PHONE forgiving of a "803-682-5691"-style
// value: a leading "+" is kept as-is; a bare 10-digit US number becomes +1…; an
// 11-digit 1-prefixed number gets a "+"; anything else is passed through trimmed.
function normalizeHandle(raw) {
  const s = String(raw == null ? "" : raw).trim();
  if (!s) return "";
  if (s[0] === "+") return s;
  const d = s.replace(/\D/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d[0] === "1") return "+" + d;
  return s;
}

// The owner-SMS recipients: Drew (OWNER_PHONE) always, plus Max (MAX_PHONE) when
// it is set — Drew asked that Max get the EXACT same texts Watson sends him
// (DREW-55). DARK by default: MAX_PHONE unset ⇒ Drew only, behavior unchanged.
// De-duped so a MAX_PHONE accidentally equal to OWNER_PHONE never double-texts.
function ownerRecipients() {
  const list = [];
  const owner = normalizeHandle(process.env.OWNER_PHONE);
  if (owner) list.push(owner);
  const max = normalizeHandle(process.env.MAX_PHONE);
  if (max && max !== owner) list.push(max);
  return list;
}

// POST one message to ONE handle via Blue Bubbles. Best-effort per recipient:
// its own 8s timeout, logs + swallows any error (never throws), so one bad
// recipient can't block another or the booking flow.
async function postBlueBubbles(url, cfId, cfSecret, bbPassword, phone, body, tempGuid) {
  const endpoint = url.replace(/\/$/, "") + "/api/v1/message/text?password=" + encodeURIComponent(bbPassword);
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
        // iMessage but breaks BB's primary AppleScript path on first send.
        chatGuid: "any;-;" + phone,
        tempGuid: tempGuid,
        message: body,
        method: "apple-script"
      })
    });
    if (!res.ok) {
      const errText = await res.text().catch(function () { return ""; });
      console.error("notify-sms: Watson/BB error", res.status, errText.slice(0, 500));
    }
  } catch (err) {
    // BB occasionally returns 500 / aborts after the message already went out
    // (validateText timeout). Logged for observability, never surfaced.
    console.error("notify-sms: failed to send to", phone, err.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

// sendOwnerSMS(body, appointmentId) — the raw Watson/Blue Bubbles transport,
// shared by the threshold-gated owner alert and the comp alert. Env-gated and
// best-effort: missing env logs and returns (never throws). Fans the SAME body
// out to every owner recipient (Drew, + Max when MAX_PHONE set).
async function sendOwnerSMS(body, appointmentId) {
  const url = process.env.WATSON_SMS_URL;
  const cfId = process.env.WATSON_CF_ACCESS_CLIENT_ID;
  const cfSecret = process.env.WATSON_CF_ACCESS_CLIENT_SECRET;
  const bbPassword = process.env.BLUEBUBBLES_PASSWORD;
  const recipients = ownerRecipients();

  if (!url || !cfId || !cfSecret || !bbPassword || recipients.length === 0) {
    console.warn("notify-sms: one or more required env vars missing, skipping",
      { url: !!url, cfId: !!cfId, cfSecret: !!cfSecret, bbPassword: !!bbPassword, ownerPhone: recipients.length > 0 });
    return;
  }

  for (let i = 0; i < recipients.length; i++) {
    const tempGuid = "wws-" + appointmentId + "-" + Date.now() + "-" + i;
    await postBlueBubbles(url, cfId, cfSecret, bbPassword, recipients[i], body, tempGuid);
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
  const body = buildCompSmsText(bookingState, appointmentId);
  return sendOwnerSMS(body, appointmentId);
}

module.exports = {
  notifyOwnerSMS,
  notifyOwnerCompSMS,
  shouldNotifyOwnerSMS,
  buildSmsText,
  buildCompSmsText,
  sendOwnerSMS,
  ownerRecipients,
  normalizeHandle,
  fmtPhone,
  fmtUsd,
  sessionTypeLabel
};
