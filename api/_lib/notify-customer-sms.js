// Sends a booking-confirmation SMS to the CUSTOMER via Twilio, immediately
// after the Acuity appointment is created. This is B1 (issue #7) — a text in
// ADDITION to Acuity's confirmation email, carrying the key booking details
// plus relevant instructional video links.
//
// Our Pay -> Book architecture guarantees the appointment (and therefore this
// SMS) only exists after payment, so this never fires for an abandoned cart.
//
// IMPORTANT — not live until Twilio A2P 10DLC registration is approved.
// Sending SMS to US numbers requires a registered brand + campaign. Until the
// env vars below are set in Vercel, this no-ops gracefully (same pattern as
// notifyOwnerSMS / the Watson tunnel).
//
// Env vars:
//   TWILIO_ACCOUNT_SID    Twilio account SID (starts "AC...")
//   TWILIO_AUTH_TOKEN     Twilio auth token
//   TWILIO_FROM_NUMBER    The registered Twilio sending number, E.164 (+1...)
//
// No SDK — raw fetch to Twilio's REST API to keep the serverless bundle small
// (same rationale as the Square integration).

const { TYPE_TO_DURATION, SESSION_PRICES } = require("./acuity");
const { isStaging } = require("./env");

const LOCATION_INFO = {
  powdersville: {
    name: "White Wall Studios — Powdersville (Flagship)",
    address: "2699 Powdersville Rd, Easley, SC 29642"
  },
  taylorsMill: {
    name: "White Wall Studios — Taylor's Mill",
    address: "250 Mill St, Ste. BL1223, Taylors, SC 29687"
  }
};

// Instructional videos (theresavideoforthat.html). Attached conditionally so a
// customer only gets links relevant to what they booked.
const VIDEO_LINKS = {
  lighting: { label: "Lighting setup", url: "https://youtu.be/EmN3ppbh-lk" },
  chairs:   { label: "Chair rental",   url: "https://youtu.be/aNTLiqzGxp4" },
  events:   { label: "Hosting an event", url: "https://youtu.be/BsyruYsoA-I" },
  studio:   { label: "What's in the studio", url: "https://youtu.be/K810lp2kEYc" }
};

// Normalize free-text phone input to E.164 for Twilio. Returns null if we can't
// confidently build a US number, so we skip rather than send to a bad address.
function toE164(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d]/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits[0] === "1") return "+" + digits;
  if (String(raw).trim().startsWith("+")) return "+" + digits; // already intl
  return null;
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch (e) { return iso; }
}

function relevantVideos(bookingState) {
  const addons = bookingState.addons || {};
  const vids = [];
  if (addons.lighting && addons.lighting.selected) vids.push(VIDEO_LINKS.lighting);
  if (addons.chairs && addons.chairs.selection) vids.push(VIDEO_LINKS.chairs);
  if (bookingState.eventIntent === "yes") vids.push(VIDEO_LINKS.events);
  vids.push(VIDEO_LINKS.studio); // always useful
  return vids;
}

// DRAFT customer-facing copy — pending Drew sign-off before go-live.
function buildCustomerSms(bookingState) {
  const contact = bookingState.contact || {};
  const first = (contact.firstName || "").trim() || "there";
  const session = SESSION_PRICES[String(bookingState.appointmentTypeID)] || { label: "Session" };
  const durationMin = TYPE_TO_DURATION[String(bookingState.appointmentTypeID)] || 0;
  const loc = bookingState.location === "powdersville" ? LOCATION_INFO.powdersville : LOCATION_INFO.taylorsMill;

  const lines = [
    "Hi " + first + "! Your White Wall Studios booking is confirmed.",
    "",
    session.label + (durationMin ? " (" + (durationMin / 60).toFixed(durationMin % 60 ? 1 : 0) + " hr)" : ""),
    fmtDateTime(bookingState.datetime),
    loc.name,
    loc.address
  ];

  const vids = relevantVideos(bookingState);
  if (vids.length) {
    lines.push("");
    lines.push("Helpful before your shoot:");
    vids.forEach(function (v) { lines.push("• " + v.label + ": " + v.url); });
  }

  lines.push("");
  lines.push("Questions? Just reply to this text. See you soon!");
  return lines.join("\n");
}

async function notifyCustomerSMS(bookingState, appointmentId) {
  // Never text a real customer from staging — phone numbers aren't sunk the way
  // emails are, so a [STAGING] test booking with a real phone must not send.
  if (isStaging()) {
    console.log("notify-customer-sms: staging, skipping customer SMS");
    return;
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    console.warn("notify-customer-sms: Twilio env vars missing, skipping",
      { sid: !!sid, token: !!token, from: !!from });
    return;
  }

  const to = toE164((bookingState.contact || {}).phone);
  if (!to) {
    console.warn("notify-customer-sms: could not normalize customer phone, skipping", { appointmentId: appointmentId });
    return;
  }

  const body = buildCustomerSms(bookingState);
  const endpoint = "https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(sid) + "/Messages.json";
  const auth = Buffer.from(sid + ":" + token).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: body });

  // Hard timeout so a slow Twilio call can't wedge the booking response.
  const controller = new AbortController();
  const timeoutId = setTimeout(function () { controller.abort(); }, 8000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: "Basic " + auth,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    if (!res.ok) {
      const text = await res.text().catch(function () { return ""; });
      console.error("notify-customer-sms: Twilio returned " + res.status, text.slice(0, 300));
    }
  } catch (e) {
    console.error("notify-customer-sms: send failed", e.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { notifyCustomerSMS, buildCustomerSms, toE164 };
