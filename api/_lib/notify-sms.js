// Sends an iMessage notification to Drew via Blue Bubbles running on
// Watson (Drew's Mac mini). Watson is exposed publicly via Cloudflare
// Tunnel; Cloudflare Access service-token gates inbound traffic at the
// edge, so unauthenticated requests never reach Blue Bubbles.
//
// Triggers:
//   - 35+ event booking, OR
//   - any 3+ hour shoot (default — narrow to photo/video only if Drew confirms)
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

  // Trigger reason — show why this fired
  const reasons = [];
  if (bookingState.eventIntent === "yes" && participants >= SMS_PARTICIPANT_THRESHOLD) {
    reasons.push("event " + participants + "ppl");
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

async function notifyOwnerSMS(bookingState, appointmentId) {
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

  if (!shouldNotifyOwnerSMS(bookingState)) return;

  const body = buildSmsText(bookingState, appointmentId);

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

module.exports = { notifyOwnerSMS, shouldNotifyOwnerSMS, buildSmsText };
