// Coupon / promo-code validation — server-side source of truth.
//
// Phase 1 MVP (#20): percentage discount applied to the RAW SESSION line item
// only (never add-ons or cleaning fees). The server is authoritative — the
// client may send a *code*, but never a discount amount. create-checkout.js
// re-validates every code here before applying any discount.
//
// Phase 3 (#20): coupons can ALSO come from the WWS dashboard API
// (wws.entrpy.co). When WWS_DASHBOARD_URL + both Cloudflare Access service-token
// creds are set, getActiveCoupons() fetches the live, already-filtered coupon
// list from the dashboard (same shape as the COUPONS env array) and caches it
// for 60s. The dashboard is the source of truth when configured. If it is
// unset, unreachable, slow, or errors in ANY way, we fall back to the COUPONS
// env var EXACTLY as before — this is the dark-launch state. recordRedemption()
// likewise POSTs to the dashboard and fail-opens: a redemption-log failure can
// NEVER break a paid booking.
//
// Coupon definitions (whether from the dashboard or the env var) are a JSON
// array of
//   { code, percentOff, location, validFrom, validUntil }
// where:
//   - code        string, customer-typed (normalized: trim + uppercase)
//   - percentOff  number 1..100 (whole-number percent off the session)
//   - location    "powdersville" | "taylors-mill" | "any"
//   - validFrom   ISO date "YYYY-MM-DD" (or full ISO) or null = no lower bound
//   - validUntil  ISO date "YYYY-MM-DD" (or full ISO) or null = no upper bound
//
// Validity dates are interpreted in America/New_York (both studios' timezone).
// Date-only bounds are inclusive of the whole ET day (validFrom from 00:00 ET,
// validUntil through 23:59:59 ET).
//
// SAFE-BY-DEFAULT: if no source yields coupons (env unset/empty/malformed AND
// the dashboard is unconfigured/unreachable), NO code is ever valid. This is
// the dark-launch state — the field can ship before any codes exist and simply
// rejects everything.
//
// No external dependencies (raw JS only — consistent with the rest of api/_lib).

// Parse + cache the COUPONS env var. Returns [] on any problem (safe default).
var _couponsCache = null;
var _couponsCacheRaw = null;

function loadCoupons() {
  var raw = process.env.COUPONS;
  if (!raw || !String(raw).trim()) return [];
  // Cache by raw string so a config change (new deploy) is picked up but we
  // don't re-parse on every request within a warm lambda.
  if (_couponsCache !== null && _couponsCacheRaw === raw) return _couponsCache;
  var parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("coupons: COUPONS env is not valid JSON — no codes will validate");
    _couponsCache = [];
    _couponsCacheRaw = raw;
    return _couponsCache;
  }
  if (!Array.isArray(parsed)) {
    console.error("coupons: COUPONS env is not a JSON array — no codes will validate");
    _couponsCache = [];
    _couponsCacheRaw = raw;
    return _couponsCache;
  }
  _couponsCache = parsed;
  _couponsCacheRaw = raw;
  return _couponsCache;
}

// ---------------------------------------------------------------------------
// Dashboard API integration (Phase 3) — optional, dark-launched.
//
// Until WWS_DASHBOARD_URL + both CF service-token creds are set, every helper
// below short-circuits to the COUPONS env behavior above. Nothing here ever
// throws; the worst case is a fall back to the env var.
// ---------------------------------------------------------------------------

var DASHBOARD_TIMEOUT_MS = 3000;
var DASHBOARD_CACHE_TTL_MS = 60 * 1000; // 60s — warm lambdas reuse the fetch.

// Cache of the last successful dashboard fetch.
var _dashboardCache = null;        // array of coupons
var _dashboardCacheAt = 0;         // epoch ms of the fetch

// True only when all three dashboard env vars are present.
function dashboardConfigured() {
  return !!(
    process.env.WWS_DASHBOARD_URL &&
    process.env.WWS_DASHBOARD_CF_ACCESS_CLIENT_ID &&
    process.env.WWS_DASHBOARD_CF_ACCESS_CLIENT_SECRET
  );
}

function dashboardHeaders(extra) {
  var h = {
    "CF-Access-Client-Id": process.env.WWS_DASHBOARD_CF_ACCESS_CLIENT_ID,
    "CF-Access-Client-Secret": process.env.WWS_DASHBOARD_CF_ACCESS_CLIENT_SECRET
  };
  if (extra) {
    for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) h[k] = extra[k]; }
  }
  return h;
}

function dashboardBase() {
  return String(process.env.WWS_DASHBOARD_URL).replace(/\/$/, "");
}

// getActiveCoupons() — async. Returns the authoritative coupon array.
//
//   - Dashboard configured: fetch GET ${WWS_DASHBOARD_URL}/api/coupons with the
//     CF service-token headers and a 3s timeout. On success, cache (60s TTL) and
//     return data.coupons. On ANY error/timeout/bad-shape, fall back to the
//     COUPONS env parse.
//   - Dashboard unconfigured: return the COUPONS env parse (exactly as before).
//
// Never throws.
async function getActiveCoupons() {
  if (!dashboardConfigured()) {
    return loadCoupons();
  }

  // Serve from the warm-instance cache if still fresh.
  var now = Date.now();
  if (_dashboardCache !== null && (now - _dashboardCacheAt) < DASHBOARD_CACHE_TTL_MS) {
    return _dashboardCache;
  }

  var controller = new AbortController();
  var timeoutId = setTimeout(function () { controller.abort(); }, DASHBOARD_TIMEOUT_MS);
  try {
    var res = await fetch(dashboardBase() + "/api/coupons", {
      method: "GET",
      signal: controller.signal,
      headers: dashboardHeaders()
    });
    if (!res.ok) {
      console.error("coupons: dashboard /api/coupons returned " + res.status + " — falling back to COUPONS env");
      return loadCoupons();
    }
    var data = await res.json();
    if (!data || !Array.isArray(data.coupons)) {
      console.error("coupons: dashboard /api/coupons bad shape — falling back to COUPONS env");
      return loadCoupons();
    }
    _dashboardCache = data.coupons;
    _dashboardCacheAt = Date.now();
    return _dashboardCache;
  } catch (err) {
    console.error("coupons: dashboard /api/coupons fetch failed (" + (err && err.message) + ") — falling back to COUPONS env");
    return loadCoupons();
  } finally {
    clearTimeout(timeoutId);
  }
}

// recordRedemption({ code, email, bookingId, discountCents }) — async.
// POSTs the redemption to the dashboard so it can track usage. FAIL-OPEN:
// swallows every error (logs only) and no-ops entirely when the dashboard is
// unconfigured. Must NEVER throw or break a paid booking.
async function recordRedemption(payload) {
  if (!dashboardConfigured()) return;
  payload = payload || {};

  var controller = new AbortController();
  var timeoutId = setTimeout(function () { controller.abort(); }, DASHBOARD_TIMEOUT_MS);
  try {
    var res = await fetch(dashboardBase() + "/api/coupons/redeem", {
      method: "POST",
      signal: controller.signal,
      headers: dashboardHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        code: payload.code,
        email: payload.email,
        bookingId: payload.bookingId,
        discountCents: payload.discountCents
      })
    });
    if (!res.ok) {
      var txt = "";
      try { txt = await res.text(); } catch (e2) { /* ignore */ }
      console.error("coupons: dashboard /api/coupons/redeem returned " + res.status, String(txt).slice(0, 300));
    }
  } catch (err) {
    console.error("coupons: recordRedemption failed (ignored):", err && err.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeCode(code) {
  if (code == null) return "";
  return String(code).trim().toUpperCase();
}

// Current calendar date in America/New_York as "YYYY-MM-DD".
function etDateString(nowDate) {
  // en-CA locale yields ISO-style YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(nowDate);
}

// Compare "now" against a coupon bound. Date-only bounds ("YYYY-MM-DD") are
// compared as ET calendar dates (inclusive on both ends). Full ISO timestamps
// fall back to absolute Date comparison.
function isDateOnly(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s).trim());
}

function withinValidity(coupon, now) {
  var from = coupon.validFrom;
  var until = coupon.validUntil;
  var etToday = etDateString(now);

  if (from != null && String(from).trim() !== "") {
    if (isDateOnly(from)) {
      // Valid from the start of this ET day → today must be >= from.
      if (etToday < String(from).trim()) return false;
    } else {
      var fromTs = Date.parse(from);
      if (!isNaN(fromTs) && now.getTime() < fromTs) return false;
    }
  }

  if (until != null && String(until).trim() !== "") {
    if (isDateOnly(until)) {
      // Valid through the end of this ET day → today must be <= until.
      if (etToday > String(until).trim()) return false;
    } else {
      var untilTs = Date.parse(until);
      if (!isNaN(untilTs) && now.getTime() > untilTs) return false;
    }
  }

  return true;
}

// validateCouponAgainst(code, coupons, opts) — PURE matching/validity logic.
//   code:     customer-typed code
//   coupons:  [{ code, percentOff, location, validFrom, validUntil }]
//   opts:     { location, nowISO }
//
// This is the original validateCoupon body, refactored to take the coupon
// array as a parameter so the source (env var vs. dashboard) is decoupled from
// the matching rules. Semantics are UNCHANGED.
//
// Returns:
//   { valid: true,  code, percentOff, label }
//   { valid: false, reason }
function validateCouponAgainst(code, coupons, opts) {
  opts = opts || {};
  var normalized = normalizeCode(code);
  if (!normalized) {
    return { valid: false, reason: "Enter a promo code." };
  }

  coupons = coupons || [];
  if (!coupons.length) {
    return { valid: false, reason: "That promo code isn’t valid." };
  }

  var now = opts.nowISO ? new Date(opts.nowISO) : new Date();
  if (isNaN(now.getTime())) now = new Date();

  // Find the coupon by normalized code.
  var match = null;
  for (var i = 0; i < coupons.length; i++) {
    var c = coupons[i];
    if (c && normalizeCode(c.code) === normalized) { match = c; break; }
  }
  if (!match) {
    return { valid: false, reason: "That promo code isn’t valid." };
  }

  // percentOff must be a sane whole-ish number 1..100.
  var pct = Number(match.percentOff);
  if (!isFinite(pct) || pct <= 0 || pct > 100) {
    console.error("coupons: coupon " + normalized + " has invalid percentOff", match.percentOff);
    return { valid: false, reason: "That promo code isn’t valid." };
  }

  // Location scope.
  var scope = (match.location == null ? "any" : String(match.location).trim().toLowerCase());
  if (scope !== "any") {
    var loc = (opts.location == null ? "" : String(opts.location).trim().toLowerCase());
    if (scope !== loc) {
      return { valid: false, reason: "That promo code isn’t valid for this location." };
    }
  }

  // Validity window (America/New_York).
  if (!withinValidity(match, now)) {
    return { valid: false, reason: "That promo code has expired or isn’t active yet." };
  }

  return {
    valid: true,
    code: normalized,
    percentOff: pct,
    label: pct + "% off session (" + normalized + ")"
  };
}

// validateCoupon(code, { location, nowISO }) — async.
//   location: "powdersville" | "taylors-mill" (the booking's location)
//   nowISO:   optional ISO string to override "now" (testing); defaults to Date.now()
//
// Resolves the active coupon list (dashboard-or-env) then runs the pure
// validation. Returns:
//   { valid: true,  code, percentOff, label }
//   { valid: false, reason }
async function validateCoupon(code, opts) {
  var coupons = await getActiveCoupons();
  return validateCouponAgainst(code, coupons, opts);
}

// Compute the discount in cents off a session price, given a validated percent.
// Floors to whole cents (Square percentage discounts round down per line item;
// flooring keeps our preview consistent and never over-discounts).
function sessionDiscountCents(sessionCents, percentOff) {
  var s = Number(sessionCents);
  var p = Number(percentOff);
  if (!isFinite(s) || s <= 0 || !isFinite(p) || p <= 0) return 0;
  return Math.floor(s * p / 100);
}

// hasActiveCoupon(location, nowISO) — async. True if ANY active coupon is
// currently valid for this location. Used to gate the promo-code UI so the
// field only appears while a campaign is live (no dead "invalid code" box
// between campaigns).
async function hasActiveCoupon(location, nowISO) {
  var coupons = await getActiveCoupons();
  if (!coupons.length) return false;

  var now = nowISO ? new Date(nowISO) : new Date();
  if (isNaN(now.getTime())) now = new Date();
  var loc = (location == null ? "" : String(location).trim().toLowerCase());

  for (var i = 0; i < coupons.length; i++) {
    var c = coupons[i];
    if (!c) continue;
    var pct = Number(c.percentOff);
    if (!isFinite(pct) || pct <= 0 || pct > 100) continue;
    var scope = (c.location == null ? "any" : String(c.location).trim().toLowerCase());
    if (scope !== "any" && scope !== loc) continue;
    if (!withinValidity(c, now)) continue;
    return true;
  }
  return false;
}

module.exports = {
  validateCoupon,
  validateCouponAgainst,
  getActiveCoupons,
  recordRedemption,
  normalizeCode,
  sessionDiscountCents,
  hasActiveCoupon
};
