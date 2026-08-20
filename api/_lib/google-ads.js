// api/_lib/google-ads.js — server-side offline conversion upload (WWA-3, step 4)
//
// THE REWARD. On a CONFIRMED booking (Square card charged + Acuity appointment
// created) create-checkout.js calls reportBooking(), which uploads an offline
// conversion attributed to the ad click:
//   - matched by gclid (or wbraid/gbraid),
//   - valued at WW's actual MARGIN, not gross (see computeMarginCents),
//   - deduplicated by transactionId = the Acuity appointment id,
//   - server → Google, immune to client-side tag flakiness.
//
// This targets Google's **Data Manager API** (datamanager.googleapis.com), NOT
// the legacy Google Ads API ConversionUploadService — Google closed that service
// to new integrations (May 2026; our probe got CUSTOMER_NOT_ALLOWLISTED_FOR_THIS_
// FEATURE and was told to use Data Manager). Differences that matter here:
//   - endpoint: POST /v1/events:ingest
//   - auth: Authorization: Bearer only. NO developer-token, NO login-customer-id
//     header (the account relationship moves into the request body).
//   - scope: the refresh token MUST carry https://www.googleapis.com/auth/datamanager
//     (mint it with ops/google-ads/reauth-datamanager.js — the adwords-only token
//     the Ads API uses will 403 here).
//   - conversion action is referenced by its NUMERIC id (productDestinationId),
//     not a resource name; value is currency units (dollars), not micros.
//
// DARK BY DEFAULT. isConfigured() is false until the OAuth creds + the conversion
// action id are set in Vercel, so on today's prod every call is a clean no-op.
// Nothing here can throw into or slow down a booking — the caller invokes it
// best-effort + isolated, exactly like the notify-* helpers.
//
// Required Vercel env (add before go-live; see the PR / WWA-3):
//   GOOGLE_ADS_CLIENT_ID
//   GOOGLE_ADS_CLIENT_SECRET
//   GOOGLE_ADS_REFRESH_TOKEN                   (MUST include the datamanager scope)
//   GOOGLE_ADS_BOOKING_CONVERSION_ACTION_ID    (numeric, e.g. 7727263911 = "Booking (value)")
//   GOOGLE_ADS_CUSTOMER_ID          (default 5061656241 — White Wall's account)
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID    (default = GOOGLE_ADS_CUSTOMER_ID; direct access)
// (No developer token needed at runtime — Data Manager doesn't use it.)

const INGEST_URL = "https://datamanager.googleapis.com/v1/events:ingest";

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
  // Numeric conversion action id — used as productDestinationId.
  return (process.env.GOOGLE_ADS_BOOKING_CONVERSION_ACTION_ID || "").replace(/[^0-9]/g, "");
}

function isConfigured() {
  return !!(
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
// The refresh token must carry the datamanager scope (see file header).
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

// Data Manager wants RFC 3339 (e.g. 2026-08-19T15:07:01.000Z). ISO-8601 from
// Date.toISOString() is RFC-3339-compliant (fractional seconds + Z allowed).
function formatEventTimestamp(d) {
  var dt = (d instanceof Date && !isNaN(d)) ? d : new Date();
  return dt.toISOString();
}

// Build the Data Manager destinations[] entry pointing at White Wall's Google
// Ads account + the "Booking (value)" conversion action.
function bookingDestination() {
  return {
    reference: "wws-booking",
    operatingAccount: { accountType: "GOOGLE_ADS", accountId: customerId() },
    loginAccount: { accountType: "GOOGLE_ADS", accountId: loginCustomerId() },
    productDestinationId: conversionActionId()
  };
}

// Low-level ingest. Throws on HTTP/API error or a surfaced field warning that
// indicates rejection. Callers should use reportBooking. `validateOnly` runs a
// dry-run (no data written) when true.
async function ingestConversion(opts) {
  var token = await getAccessToken();
  var adIdentifiers = {};
  if (opts.gclid) adIdentifiers.gclid = opts.gclid;
  else if (opts.wbraid) adIdentifiers.wbraid = opts.wbraid;
  else if (opts.gbraid) adIdentifiers.gbraid = opts.gbraid;

  var event = {
    destinationReferences: ["wws-booking"],
    transactionId: String(opts.orderId),
    eventTimestamp: opts.eventTimestamp,
    eventSource: "WEB",
    currency: "USD",
    conversionValue: Math.round(opts.valueCents) / 100, // currency units, not micros
    adIdentifiers: adIdentifiers,
    // US (South Carolina) traffic; we don't collect explicit ad-data consent, so
    // report UNSPECIFIED rather than over-claim GRANTED. Google treats unspecified
    // as full-use outside the EEA.
    consent: { adUserData: "CONSENT_STATUS_UNSPECIFIED", adPersonalization: "CONSENT_STATUS_UNSPECIFIED" }
  };

  var body = {
    destinations: [bookingDestination()],
    events: [event],
    validateOnly: !!opts.validateOnly
  };

  var res = await fetch(INGEST_URL, {
    method: "POST",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  var data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error("events:ingest HTTP " + res.status + ": " + JSON.stringify(data).slice(0, 500));
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
//   orderId          : Acuity appointment id (dedupe key → transactionId)
//   whenIso          : booking timestamp (ISO) — defaults to now
//   validateOnly     : dry-run when true (no data written)
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
    var result = await ingestConversion({
      gclid: attr.gclid,
      wbraid: attr.wbraid,
      gbraid: attr.gbraid,
      valueCents: valueCents,
      orderId: opts.orderId,
      eventTimestamp: formatEventTimestamp(when),
      validateOnly: !!opts.validateOnly
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
  formatEventTimestamp: formatEventTimestamp,
  bookingDestination: bookingDestination,
  ingestConversion: ingestConversion,
  reportBooking: reportBooking,
  CLEANING_PASSTHROUGH_CENTS: CLEANING_PASSTHROUGH_CENTS,
  SQUARE_FEE_RATE: SQUARE_FEE_RATE,
  SQUARE_FEE_FIXED_CENTS: SQUARE_FEE_FIXED_CENTS
};
