// api/_lib/google-ads.js — server-side Google Ads offline conversion upload (WWA-3, steps 3-4)
//
// THE REWARD. On a CONFIRMED booking (Square card charged + Acuity appointment
// created) create-checkout.js calls reportBooking(), which uploads an OFFLINE
// CLICK CONVERSION back to Google Ads:
//   - matched to the ad click by gclid (or wbraid/gbraid),
//   - valued at WW's actual MARGIN, not gross (see computeMarginCents),
//   - deduplicated by order_id = the Acuity appointment id,
//   - immune to client-side tag flakiness (this is a server → Google POST).
//
// This is the "Booking (value)" conversion action, ONE_PER_CLICK, category
// PURCHASE — the ONLY primary bidding signal. See scripts/google-ads/ for the
// one-time action-creation script that provisions it on the account.
//
// DARK BY DEFAULT. isConfigured() is false until every Google Ads env var AND
// the conversion-action id are set in Vercel, so on today's prod every call is a
// clean no-op. Nothing here can ever throw into or slow down a booking — the
// caller invokes it best-effort + isolated, exactly like the notify-* helpers.
//
// Required Vercel env (add before go-live; see the PR / WWA-3):
//   GOOGLE_ADS_DEVELOPER_TOKEN
//   GOOGLE_ADS_CLIENT_ID
//   GOOGLE_ADS_CLIENT_SECRET
//   GOOGLE_ADS_REFRESH_TOKEN
//   GOOGLE_ADS_BOOKING_CONVERSION_ACTION_ID   (the "Booking (value)" action id)
//   GOOGLE_ADS_CUSTOMER_ID          (default 5061656241 — White Wall's account)
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID    (default = GOOGLE_ADS_CUSTOMER_ID; the account's own id, NOT the MCC)

const API_VERSION = "v22";

// White Wall's pass-through cleaning fee: $150 that WW earns $0 on (it goes
// straight to the cleaners). Never optimize bidding toward a fee we don't keep.
const CLEANING_PASSTHROUGH_CENTS = 15000;
// Square processing fee: 2.9% + $0.30 per transaction (per the booking-site
// Square config). WW nets the charge minus this, so margin subtracts it too.
const SQUARE_FEE_RATE = 0.029;
const SQUARE_FEE_FIXED_CENTS = 30;

function customerId() {
  return (process.env.GOOGLE_ADS_CUSTOMER_ID || "5061656241").replace(/-/g, "");
}
function loginCustomerId() {
  return (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || customerId()).replace(/-/g, "");
}
function conversionActionId() {
  return process.env.GOOGLE_ADS_BOOKING_CONVERSION_ACTION_ID || "";
}

function isConfigured() {
  return !!(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    conversionActionId()
  );
}

// WW's contribution margin on a booking, in cents. The value we upload to Google
// so Smart Bidding optimizes toward what WW actually keeps:
//   margin = gross total − pass-through cleaning fee − Square processing fee
// The Square fee is computed on the full booking value (a deposit booking's
// balance auto-charges later; the extra fixed $0.30 on that second charge is
// immaterial next to the 2.9% + $150 terms). Never returns negative.
function computeMarginCents(opts) {
  opts = opts || {};
  var totalCents = Math.max(0, Math.round(Number(opts.totalCents) || 0));
  var cleaningFeeCents = Math.max(0, Math.round(Number(opts.cleaningFeeCents) || 0));
  var squareFeeCents = Math.round(totalCents * SQUARE_FEE_RATE) + SQUARE_FEE_FIXED_CENTS;
  var margin = totalCents - cleaningFeeCents - squareFeeCents;
  return margin > 0 ? margin : 0;
}

// Validate/clamp the client-sent attribution object (never trust the browser).
// Returns { gclid?, wbraid?, gbraid?, utm_* } with only string fields ≤512 chars,
// or null when there is no usable click id.
function sanitizeAttribution(raw) {
  if (!raw || typeof raw !== "object") return null;
  var out = {};
  var keys = ["gclid", "wbraid", "gbraid",
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  for (var i = 0; i < keys.length; i++) {
    var v = raw[keys[i]];
    if (typeof v === "string" && v && v.length <= 512) out[keys[i]] = v;
  }
  if (!out.gclid && !out.wbraid && !out.gbraid) return null; // nothing to attribute
  return out;
}

// OAuth2 access token via the refresh-token grant. Cached in module scope until
// ~1 min before expiry so a burst of bookings doesn't re-mint on every call.
var _token = { value: "", expMs: 0 };
async function getAccessToken() {
  var now = Date.now();
  if (_token.value && now < _token.expMs - 60000) return _token.value;
  var res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN || "",
      grant_type: "refresh_token"
    }).toString()
  });
  if (!res.ok) {
    var errText = await res.text().catch(function () { return ""; });
    throw new Error("google-ads token grant failed: " + res.status + " " + errText.slice(0, 300));
  }
  var data = await res.json();
  _token.value = data.access_token;
  _token.expMs = now + (Number(data.expires_in || 3600) * 1000);
  return _token.value;
}

// Google Ads wants "yyyy-MM-dd HH:mm:ss+00:00" (offset REQUIRED). Emit UTC.
function formatConversionDateTime(d) {
  var dt = (d instanceof Date && !isNaN(d)) ? d : new Date();
  var p = function (n) { return String(n).padStart(2, "0"); };
  return dt.getUTCFullYear() + "-" + p(dt.getUTCMonth() + 1) + "-" + p(dt.getUTCDate()) +
    " " + p(dt.getUTCHours()) + ":" + p(dt.getUTCMinutes()) + ":" + p(dt.getUTCSeconds()) + "+00:00";
}

// Low-level upload. Throws on HTTP/API error. Callers should use reportBooking.
async function uploadClickConversion(opts) {
  var token = await getAccessToken();
  var cid = customerId();
  var conversion = {
    conversionAction: "customers/" + cid + "/conversionActions/" + conversionActionId(),
    conversionValue: (Math.round(opts.valueCents) / 100), // account currency units (USD dollars)
    currencyCode: "USD",
    conversionDateTime: opts.conversionDateTime,
    orderId: String(opts.orderId)
  };
  // Prefer gclid; fall back to wbraid/gbraid (iOS / in-app). Exactly one id.
  if (opts.gclid) conversion.gclid = opts.gclid;
  else if (opts.wbraid) conversion.wbraid = opts.wbraid;
  else if (opts.gbraid) conversion.gbraid = opts.gbraid;

  var url = "https://googleads.googleapis.com/" + API_VERSION +
    "/customers/" + cid + ":uploadClickConversions";
  var res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
      "login-customer-id": loginCustomerId(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ conversions: [conversion], partialFailureError: undefined, partialFailure: true })
  });
  var data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error("uploadClickConversions HTTP " + res.status + ": " + JSON.stringify(data).slice(0, 400));
  }
  // partialFailure surfaces per-row errors in partialFailureError even on a 200.
  if (data.partialFailureError) {
    throw new Error("uploadClickConversions partial failure: " + JSON.stringify(data.partialFailureError).slice(0, 400));
  }
  return data;
}

// Fire-and-forget-safe entry point. Uploads the confirmed booking's MARGIN,
// attributed to the ad click, deduped by the Acuity appointment id. NEVER throws
// and NEVER rejects — always resolves to a small status object the caller can log.
//
//   attribution      : sanitized {gclid|wbraid|gbraid,...} or the raw client object
//   totalCents       : gross booking total (charged + any scheduled balance)
//   cleaningFeeCents  : the $150 pass-through if it applied, else 0
//   orderId          : Acuity appointment id (dedupe key)
//   whenIso          : booking timestamp (ISO) — defaults to now
async function reportBooking(opts) {
  try {
    opts = opts || {};
    if (!isConfigured()) return { skipped: "unconfigured" };
    var attr = sanitizeAttribution(opts.attribution);
    if (!attr) return { skipped: "no_click_id" };
    if (!opts.orderId) return { skipped: "no_order_id" };
    var valueCents = computeMarginCents({
      totalCents: opts.totalCents,
      cleaningFeeCents: opts.cleaningFeeCents
    });
    if (valueCents <= 0) return { skipped: "non_positive_margin" };
    var when = opts.whenIso ? new Date(opts.whenIso) : new Date();
    var result = await uploadClickConversion({
      gclid: attr.gclid,
      wbraid: attr.wbraid,
      gbraid: attr.gbraid,
      valueCents: valueCents,
      orderId: opts.orderId,
      conversionDateTime: formatConversionDateTime(when)
    });
    return { uploaded: true, valueCents: valueCents, orderId: String(opts.orderId), result: result };
  } catch (e) {
    // Best-effort: log and swallow. A conversion-upload failure must NEVER affect
    // a paid, booked appointment.
    try { console.error("google-ads reportBooking failed:", e && e.message); } catch (e2) {}
    return { error: (e && e.message) || "unknown" };
  }
}

module.exports = {
  isConfigured: isConfigured,
  computeMarginCents: computeMarginCents,
  sanitizeAttribution: sanitizeAttribution,
  getAccessToken: getAccessToken,
  formatConversionDateTime: formatConversionDateTime,
  uploadClickConversion: uploadClickConversion,
  reportBooking: reportBooking,
  CLEANING_PASSTHROUGH_CENTS: CLEANING_PASSTHROUGH_CENTS,
  SQUARE_FEE_RATE: SQUARE_FEE_RATE,
  SQUARE_FEE_FIXED_CENTS: SQUARE_FEE_FIXED_CENTS
};
