// Coupon / promo-code validation — server-side source of truth.
//
// Phase 1 MVP (#20): percentage discount applied to the RAW SESSION line item
// only (never add-ons or cleaning fees). The server is authoritative — the
// client may send a *code*, but never a discount amount. create-checkout.js
// re-validates every code here before applying any discount.
//
// Phase 3 redux (#20): coupons come from a Vercel Edge Config store. The WWS
// dashboard PUSHES the active, already-filtered coupon list into Edge Config
// under the key "coupons"; the booking site READS it here. Edge Config reads
// are Vercel-native and edge-cached — the checkout path never touches the
// self-hosted mini / dashboard at request time.
//
// SAFE-BY-DEFAULT / DARK-LAUNCH: if EDGE_CONFIG is unset, the read throws, or
// it returns null/undefined/a non-array, getActiveCoupons() falls back to the
// COUPONS env var EXACTLY as before. With no Edge Config store connected AND no
// COUPONS env var, NO code is ever valid — the field can ship before any codes
// exist and simply rejects everything. Nothing here ever throws.
//
// Coupon definitions (whether from Edge Config or the env var) are a JSON
// array of
//   { code, percentOff?, amountOff?, comp?, location, validFrom, validUntil }
// where exactly ONE discount mechanism applies, in precedence comp > amountOff >
// percentOff:
//   - code        string, customer-typed (normalized: trim + uppercase)
//   - amountOff   number of CENTS off the WHOLE ORDER total (session + add-ons +
//                 fees). A flat-dollar coupon (e.g. SHARON200 = 20000 = $200 off).
//                 Takes precedence over percentOff. The charged total is still
//                 floored to >= 1 cent in create-checkout.js, so an amountOff that
//                 exceeds the order just zeroes it to that floor. Only present on
//                 flat-dollar codes; percentOff is omitted when amountOff is set.
//   - percentOff  number 1..99 (whole-number percent off the session). Capped
//                 at 99, never 100: a 100%-off code on an add-on-free session
//                 would post a $0 charge to Square, which Square rejects. A
//                 partial discount ALWAYS still charges a card.
//   - comp        boolean. When true, the code is a FULL-COMP code (e.g.
//                 WWSHUNDRED): it wipes the ENTIRE booking (session + add-ons +
//                 fees) to $0 and takes a payment-free path in create-checkout
//                 (no card, no Square charge). A comp code BYPASSES the 1..99
//                 percentOff cap (percentOff is ignored when comp===true) but
//                 still honors location scope + the validity window. This is the
//                 ONLY way a $0 / payment-skipped booking is ever allowed, and
//                 it only happens when the SERVER validates the comp coupon.
//   - location    "powdersville" | "taylors-mill" | "any"
//   - validFrom   ISO date "YYYY-MM-DD" (or full ISO) or null = no lower bound
//   - validUntil  ISO date "YYYY-MM-DD" (or full ISO) or null = no upper bound
//
// Validity dates are interpreted in America/New_York (both studios' timezone).
// Date-only bounds are inclusive of the whole ET day (validFrom from 00:00 ET,
// validUntil through 23:59:59 ET).
//
// Redemptions are NOT reported from here. create-checkout writes "Promo code: X"
// into the Acuity appointment notes; the dashboard derives redemptions from its
// Acuity ingest. The booking site no longer phones home.
//
// Only dependency: @vercel/edge-config (Vercel-native SDK). Everything else is
// raw JS, consistent with the rest of api/_lib.

const { get } = require("@vercel/edge-config");

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
// Edge Config integration (Phase 3 redux) — Vercel-native, dark-launched.
//
// The dashboard pushes the active coupon array into the store under key
// "coupons". We read it here. Until EDGE_CONFIG is set (Vercel auto-injects
// the connection string when an Edge Config store is connected to the project),
// or until the "coupons" key exists, every read falls back to the COUPONS env
// behavior above. Nothing here ever throws.
// ---------------------------------------------------------------------------

// getActiveCoupons() — async. Returns the authoritative coupon array.
//
//   - EDGE_CONFIG set: read the "coupons" key from Edge Config (edge-cached,
//     fast). On success with an array, return it. On ANY error, or a
//     null/undefined/non-array value, fall back to the COUPONS env parse.
//   - EDGE_CONFIG unset: return the COUPONS env parse (exactly as before).
//
// Never throws.
async function getActiveCoupons() {
  if (!process.env.EDGE_CONFIG) {
    return loadCoupons();
  }

  try {
    var coupons = await get("coupons");
    if (!Array.isArray(coupons)) {
      // Missing key (undefined), null, or a malformed non-array value → fall
      // back to the env var. Only log on a present-but-malformed value; a
      // not-yet-populated key is the normal dark-launch state.
      if (coupons != null) {
        console.error("coupons: Edge Config 'coupons' is not an array — falling back to COUPONS env");
      }
      return loadCoupons();
    }
    return coupons;
  } catch (err) {
    console.error("coupons: Edge Config read failed (" + (err && err.message) + ") — falling back to COUPONS env");
    return loadCoupons();
  }
}

function normalizeCode(code) {
  if (code == null) return "";
  return String(code).trim().toUpperCase();
}

// Normalize an email for the "Who?" restriction compare (DREW-52 part 3): trim +
// lowercase, matching how the dashboard stores coupon.restricted_email. "" when
// absent/blank.
function normalizeEmail(email) {
  if (email == null) return "";
  return String(email).trim().toLowerCase();
}

// Normalize a phone for the contact-list compare: digits only (matches how the
// dashboard stores coupon.blocked_contacts / allowed_contacts phones). "" when
// absent/blank.
function normalizePhone(phone) {
  if (phone == null) return "";
  return String(phone).replace(/\D+/g, "");
}

// True iff the booking's email OR phone matches any entry in a coupon contact
// list ("Who?" allowedContacts or "Boycott" blockedContacts). Each stored entry
// is an email (contains "@") or a phone; we normalize BOTH sides the same way
// (email lowercased, phone digits-only) so the compare is like-for-like even if a
// hand-authored COUPONS env carried un-normalized values. Empty/absent list =>
// no match.
function contactListMatches(contacts, email, phone) {
  if (!Array.isArray(contacts) || contacts.length === 0) return false;
  var e = normalizeEmail(email);
  var p = normalizePhone(phone);
  for (var i = 0; i < contacts.length; i++) {
    if (contacts[i] == null) continue;
    var c = String(contacts[i]).trim();
    if (!c) continue;
    if (c.indexOf("@") !== -1) {
      if (e && e === c.toLowerCase()) return true;
    } else {
      var cp = c.replace(/\D+/g, "");
      if (cp && p && cp === p) return true;
    }
  }
  return false;
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
//   coupons:  [{ code, percentOff, location, validFrom, validUntil, allowedContacts?, blockedContacts?, restrictedEmail?, maxUses? }]
//   opts:     { location, nowISO, email, phone }  // email + phone = the booking
//             contact, matched against the code's "Who?" allow-list + "Boycott"
//             block-list (DREW-53). Unbound codes ignore them.
//
// This is the original validateCoupon body, refactored to take the coupon
// array as a parameter so the source (env var vs. Edge Config) is decoupled
// from the matching rules. Semantics are UNCHANGED.
//
// Returns:
//   { valid: true,  code, percentOff, label }   (non-comp percentage coupon)
//   { valid: true,  code, comp: true, label }    (full-comp coupon)
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

  // A full-comp coupon (comp === true) BYPASSES the 1..99 percentOff cap — it is
  // the ONE code allowed to zero the booking. percentOff is ignored for comp
  // codes. Comp codes still honor location scope + validity (checked below).
  var isComp = (match.comp === true);

  // Flat-dollar coupon (e.g. SHARON200): `amountOff` is a positive integer number
  // of CENTS taken off the WHOLE ORDER total (session + add-ons + fees), not just
  // the session line — unlike percentOff, which is session-only. It takes
  // precedence over percentOff (percentOff is ignored when amountOff is set); comp
  // still wins over both. The charged total is floored to >= 1 cent in
  // create-checkout.js (Square rejects a $0 charge), so an amountOff larger than
  // the order simply zeroes it to the floor. Location scope + validity apply the
  // same as any other coupon (checked below).
  var amt = Number(match.amountOff);
  var isAmount = !isComp && isFinite(amt) && amt > 0;

  // For plain PERCENTAGE coupons (not comp, not flat-dollar), percentOff must be a
  // sane whole-ish number 1..99. The upper bound is 99 (not 100) on purpose: a
  // 100%-off NON-comp code would drive a session-only (add-on-free) booking's
  // charged total to $0, which Square rejects → the booking fails. Capping at 99%
  // guarantees a charge of at least ~1% of the session, so the floor in
  // create-checkout.js never has to engage in the realistic case. (A true $0
  // booking only happens via a comp code.)
  var pct = Number(match.percentOff);
  if (!isComp && !isAmount) {
    if (!isFinite(pct) || pct <= 0 || pct > 99) {
      console.error("coupons: coupon " + normalized + " has invalid percentOff", match.percentOff);
      return { valid: false, reason: "That promo code isn’t valid." };
    }
  }

  // Location scope (applies to comp and non-comp alike). A null OR "all"
  // location means company-wide (valid at either studio).
  var scope = (match.location == null ? "any" : String(match.location).trim().toLowerCase());
  if (scope === "all") scope = "any";
  if (scope !== "any") {
    var loc = (opts.location == null ? "" : String(opts.location).trim().toLowerCase());
    if (scope !== loc) {
      return { valid: false, reason: "That promo code isn’t valid for this location." };
    }
  }

  // Validity window (America/New_York) — applies to comp and non-comp alike.
  if (!withinValidity(match, now)) {
    return { valid: false, reason: "That promo code has expired or isn’t active yet." };
  }

  // Email restriction ("Who?", DREW-52 part 3). A code bound to one customer
  // (restrictedEmail set) is honored ONLY when the booking email matches
  // (normalized). This is the AIRTIGHT, stateless half — the booking site already
  // knows the booking email, so it rejects a mismatched code at the instant of
  // checkout with no coupling to the mini. An UNBOUND code (no restrictedEmail) is
  // completely unaffected, so every existing company-wide code behaves exactly as
  // before. Applies to comp / flat-dollar / percent alike.
  var boundEmail = normalizeEmail(match.restrictedEmail);
  if (boundEmail) {
    if (normalizeEmail(opts.email) !== boundEmail) {
      return { valid: false, reason: "That promo code is reserved for a specific customer." };
    }
  }

  // "Who?" allow-list (allowedContacts, DREW-53) — email AND/OR phone, same logic
  // as the boycott below. When present, the code is honored ONLY if the booking
  // email OR phone matches an entry. Supersedes the single restrictedEmail above
  // (both honored). An UNBOUND code (no allow-list) is completely unaffected.
  // Applies to comp / flat-dollar / percent alike.
  var allowed = match.allowedContacts;
  if (Array.isArray(allowed) && allowed.length > 0) {
    if (!contactListMatches(allowed, opts.email, opts.phone)) {
      return { valid: false, reason: "That promo code is reserved for a specific customer." };
    }
  }

  // "Boycott" block-list (blockedContacts, DREW-53 item 1) — email AND/OR phone.
  // When the booking email OR phone matches an entry, the code is REJECTED even
  // though it stays live for everyone else. Checked AFTER the allow-list. The
  // reason is the generic "isn't valid" so a boycotted abuser is not tipped off
  // that they were specifically barred. A code with no block-list hits ZERO new
  // logic (Array.isArray guard) — every existing code behaves exactly as before.
  if (contactListMatches(match.blockedContacts, opts.email, opts.phone)) {
    return { valid: false, reason: "That promo code isn’t valid." };
  }

  if (isComp) {
    return {
      valid: true,
      code: normalized,
      comp: true,
      label: "Full comp (" + normalized + ")"
    };
  }

  if (isAmount) {
    var amtCents = Math.round(amt);
    return {
      valid: true,
      code: normalized,
      amountOff: amtCents,
      label: "$" + (amtCents / 100).toFixed(2).replace(/\.00$/, "") + " off (" + normalized + ")"
    };
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
// Resolves the active coupon list (Edge-Config-or-env) then runs the pure
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
    // A comp code is "active" regardless of percentOff (it has none); a non-comp
    // code counts if it carries either a positive flat-dollar amountOff OR a sane
    // 1..99 percentOff.
    if (c.comp !== true) {
      var amt = Number(c.amountOff);
      var okAmt = isFinite(amt) && amt > 0;
      var pct = Number(c.percentOff);
      var okPct = isFinite(pct) && pct > 0 && pct <= 99;
      if (!okAmt && !okPct) continue;
    }
    var scope = (c.location == null ? "any" : String(c.location).trim().toLowerCase());
    if (scope === "all") scope = "any";
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
  normalizeCode,
  sessionDiscountCents,
  hasActiveCoupon
};
