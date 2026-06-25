// api/_lib/campaign-send.js — V3 item 6 Resend send helper (DARK by default).
//
// The single place a customer campaign / reminder email is actually handed to
// Resend. It is GATED: it sends NOTHING unless the relevant env flag === "1".
//   - sendCampaignEmail  -> gated by CAMPAIGN_SEND_ENABLED (the 4 add-on touches)
//   - sendReminderEmail  -> gated by REMINDERS_ENABLED      (the balance chase)
// With the flag off (the default) the call is a NO-OP that returns
// { skipped:true, reason:"...-disabled" } and makes NO outbound request. This
// mirrors the dispatcher's own per-behavior gate so the send path is dark from
// every angle.
//
// SUPPRESSION. Even with the flag on, a send is skipped when the recipient is
// suppressed: an unsubscribed / cancelled campaign_enrollments row, or an explicit
// suppressed flag passed by the caller. Suppression is checked BEFORE the gate
// matters for delivery, so an unsubscribed customer is never emailed regardless of
// flag state. The dashboard already tracks list-level unsubscribes; this is the
// booking-side, per-enrollment equivalent.
//
// The actual transport is injectable (opts.sendImpl) so tests assert gating /
// suppression without any network call. The default transport is raw fetch to
// Resend, matching api/notify-owner.js house style.

"use strict";

var sbDB = require("./supabase");

var DEFAULT_FROM = "White Wall Studios <booking@whitewallstudios.co>";

// ---------------------------------------------------------------------------
// suppression (pure + IO)
// ---------------------------------------------------------------------------
// A campaign_enrollments row suppresses delivery when the customer opted out or
// the enrollment was cancelled. PURE — no IO.
function evaluateSuppression(enrollment) {
  if (!enrollment) return false;
  if (enrollment.unsubscribed_at) return true;
  var s = enrollment.status;
  return s === "unsubscribed" || s === "cancelled";
}

// Look up whether a booking's add-on campaign enrollment is suppressed. Returns
// false on any read error (fail-open for the LOOKUP only — the flag gate is the
// real guard, and a missing enrollment is simply "not suppressed").
async function isBookingSuppressed(db, bookingId, opts) {
  opts = opts || {};
  if (!bookingId) return false;
  var dbi = db || sbDB;
  var campaign = opts.campaign || "addon_4touch";
  try {
    var rows = await dbi.serviceSelect(
      "campaign_enrollments",
      "booking_id=eq." + encodeURIComponent(bookingId) +
        "&campaign=eq." + encodeURIComponent(campaign) +
        "&select=status,unsubscribed_at"
    );
    var row = Array.isArray(rows) && rows.length ? rows[0] : null;
    return evaluateSuppression(row);
  } catch (e) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// default Resend transport — only ever reached AFTER the gate + suppression
// checks pass (gatedSend calls it). Injectable for tests.
// ---------------------------------------------------------------------------
async function defaultSendImpl(payload) {
  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("campaign-send: RESEND_API_KEY unset, skipping send");
    return { sent: false, reason: "no-resend-key" };
  }
  var body = {
    from: payload.from || process.env.NOTIFICATION_FROM || DEFAULT_FROM,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html
  };
  if (payload.text) body.text = payload.text;
  if (payload.replyTo) body.reply_to = Array.isArray(payload.replyTo) ? payload.replyTo : [payload.replyTo];

  var res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    var txt = await res.text();
    throw new Error("Resend " + res.status + ": " + txt);
  }
  return { sent: true };
}

// ---------------------------------------------------------------------------
// core gated send. `enabled` is the resolved boolean of the relevant flag.
//   opts: { to, subject, html, text, from, replyTo, suppressed, sendImpl }
// Returns:
//   { skipped:true, reason:"...-disabled" }   flag OFF (DARK)
//   { skipped:true, reason:"suppressed" }      recipient opted out
//   { skipped:true, reason:"no-recipient" }    no `to`
//   { sent:true }                              delivered
// ---------------------------------------------------------------------------
async function gatedSend(opts, enabled, disabledReason) {
  opts = opts || {};
  if (opts.suppressed) {
    return { skipped: true, sent: false, reason: "suppressed" };
  }
  if (!enabled) {
    return { skipped: true, sent: false, reason: disabledReason };
  }
  if (!opts.to) {
    return { skipped: true, sent: false, reason: "no-recipient" };
  }
  var sendImpl = opts.sendImpl || defaultSendImpl;
  var result = await sendImpl({
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    from: opts.from,
    replyTo: opts.replyTo
  });
  // Normalize: a transport that no-ops (e.g. no API key) reports sent:false.
  if (result && result.sent === false) {
    return { skipped: true, sent: false, reason: result.reason || "transport-noop" };
  }
  return { sent: true, skipped: false };
}

// The 4-touch add-on campaign email. Gated by CAMPAIGN_SEND_ENABLED.
//   opts also accepts `env` (defaults to process.env) for testability.
async function sendCampaignEmail(opts) {
  opts = opts || {};
  var env = opts.env || process.env;
  var enabled = env.CAMPAIGN_SEND_ENABLED === "1";
  return gatedSend(opts, enabled, "campaign-send-disabled");
}

// The deposit / balance reminder email. Gated by REMINDERS_ENABLED.
async function sendReminderEmail(opts) {
  opts = opts || {};
  var env = opts.env || process.env;
  var enabled = env.REMINDERS_ENABLED === "1";
  return gatedSend(opts, enabled, "reminders-disabled");
}

module.exports = {
  sendCampaignEmail: sendCampaignEmail,
  sendReminderEmail: sendReminderEmail,
  evaluateSuppression: evaluateSuppression,
  isBookingSuppressed: isBookingSuppressed,
  // exported for reuse / tests
  gatedSend: gatedSend,
  defaultSendImpl: defaultSendImpl,
  DEFAULT_FROM: DEFAULT_FROM
};
