// Coupon / promo-code validation — server-side source of truth.
//
// Phase 1 MVP (#20): percentage discount applied to the RAW SESSION line item
// only (never add-ons or cleaning fees). The server is authoritative — the
// client may send a *code*, but never a discount amount. create-checkout.js
// re-validates every code here before applying any discount.
//
// Coupon definitions live entirely in the COUPONS env var: a JSON array of
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
// SAFE-BY-DEFAULT: if COUPONS is unset, empty, or malformed JSON, NO code is
// ever valid. This is the dark-launch state — the field can ship before any
// codes exist and simply rejects everything.
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

// validateCoupon(code, { location, nowISO })
//   location: "powdersville" | "taylors-mill" (the booking's location)
//   nowISO:   optional ISO string to override "now" (testing); defaults to Date.now()
//
// Returns:
//   { valid: true,  code, percentOff, label }
//   { valid: false, reason }
function validateCoupon(code, opts) {
  opts = opts || {};
  var normalized = normalizeCode(code);
  if (!normalized) {
    return { valid: false, reason: "Enter a promo code." };
  }

  var coupons = loadCoupons();
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

// Compute the discount in cents off a session price, given a validated percent.
// Floors to whole cents (Square percentage discounts round down per line item;
// flooring keeps our preview consistent and never over-discounts).
function sessionDiscountCents(sessionCents, percentOff) {
  var s = Number(sessionCents);
  var p = Number(percentOff);
  if (!isFinite(s) || s <= 0 || !isFinite(p) || p <= 0) return 0;
  return Math.floor(s * p / 100);
}

module.exports = {
  validateCoupon,
  normalizeCode,
  sessionDiscountCents
};
