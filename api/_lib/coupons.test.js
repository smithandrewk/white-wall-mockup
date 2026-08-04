// Unit tests for the PURE coupon matcher in api/_lib/coupons.js
// (validateCouponAgainst). No network — we pass the coupon array directly.
//
// Run: node api/_lib/coupons.test.js
//
// What it proves (Drew round 7 — comp coupons):
//   1. A comp coupon (comp:true) validates → { valid:true, comp:true, label }.
//   2. A normal 50% coupon still validates with percentOff (unchanged).
//   3. A 100% NON-comp coupon is STILL rejected (the 1..99 cap is unchanged).
//   4. A comp coupon honors location scope (wrong location → invalid).
//   5. A comp coupon honors the validity window (expired → invalid).
//   6. A comp coupon bypasses the percentOff cap even with a bogus percentOff.

const assert = require("assert");

// coupons.js requires @vercel/edge-config at top level (for getActiveCoupons),
// which isn't installed in worktrees. These tests only exercise the PURE
// validateCouponAgainst (no network), so shim the module so the require resolves.
const Module = require("module");
const _origLoad = Module._load;
Module._load = function (request) {
  if (request === "@vercel/edge-config") {
    return { get: async function () { return undefined; } };
  }
  return _origLoad.apply(this, arguments);
};

const { validateCouponAgainst } = require("./coupons");

let passed = 0;
function ok(label) { passed++; console.log("ok " + passed + " - " + label); }

// All "now" comparisons pinned so validity-window tests are deterministic.
const NOW = "2026-06-26T12:00:00-04:00";

// ---- 1. comp coupon validates ----------------------------------------------
(function () {
  const coupons = [{ code: "WWSHUNDRED", comp: true, location: "all", validFrom: null, validUntil: null }];
  const r = validateCouponAgainst("wwshundred", coupons, { location: "powdersville", nowISO: NOW });
  assert.strictEqual(r.valid, true, "comp coupon should validate");
  assert.strictEqual(r.comp, true, "comp result carries comp:true");
  assert.strictEqual(r.code, "WWSHUNDRED", "comp result is normalized (uppercased)");
  assert.strictEqual(typeof r.label, "string", "comp result has a label");
  assert.ok(/WWSHUNDRED/.test(r.label), "label mentions the code");
  assert.strictEqual(r.percentOff, undefined, "comp result carries NO percentOff");
  ok("comp coupon (comp:true) validates with comp:true and no percentOff");
})();

// ---- 2. normal 50% still works ---------------------------------------------
(function () {
  const coupons = [{ code: "WWS50", percentOff: 50, location: "all", validFrom: null, validUntil: null }];
  const r = validateCouponAgainst("WWS50", coupons, { location: "taylors-mill", nowISO: NOW });
  assert.strictEqual(r.valid, true, "50% coupon validates");
  assert.strictEqual(r.percentOff, 50, "percentOff preserved");
  assert.ok(!r.comp, "50% coupon is NOT comp");
  ok("normal 50% coupon still validates with percentOff:50, no comp flag");
})();

// ---- 3. 100% NON-comp still rejected ---------------------------------------
(function () {
  const coupons = [{ code: "ONEHUNDRED", percentOff: 100, location: "all", validFrom: null, validUntil: null }];
  const r = validateCouponAgainst("ONEHUNDRED", coupons, { location: "powdersville", nowISO: NOW });
  assert.strictEqual(r.valid, false, "100% NON-comp coupon is rejected (1..99 cap unchanged)");
  ok("100% NON-comp coupon STILL rejected (no comp flag → cap enforced)");
})();

// ---- 4. comp honors location scope -----------------------------------------
(function () {
  const coupons = [{ code: "PVCOMP", comp: true, location: "powdersville", validFrom: null, validUntil: null }];
  const wrong = validateCouponAgainst("PVCOMP", coupons, { location: "taylors-mill", nowISO: NOW });
  assert.strictEqual(wrong.valid, false, "comp coupon scoped to PV is invalid at TM");
  const right = validateCouponAgainst("PVCOMP", coupons, { location: "powdersville", nowISO: NOW });
  assert.strictEqual(right.valid, true, "same comp coupon valid at its own location");
  assert.strictEqual(right.comp, true, "scoped comp still returns comp:true");
  ok("comp coupon honors location scope (wrong location rejected, right one comps)");
})();

// ---- 5. comp honors validity window ----------------------------------------
(function () {
  const coupons = [{ code: "EXPIRED", comp: true, location: "all", validFrom: null, validUntil: "2026-06-01" }];
  const r = validateCouponAgainst("EXPIRED", coupons, { location: "powdersville", nowISO: NOW });
  assert.strictEqual(r.valid, false, "expired comp coupon is rejected");

  const future = [{ code: "NOTYET", comp: true, location: "all", validFrom: "2026-12-01", validUntil: null }];
  const f = validateCouponAgainst("NOTYET", future, { location: "powdersville", nowISO: NOW });
  assert.strictEqual(f.valid, false, "not-yet-active comp coupon is rejected");
  ok("comp coupon honors validity window (expired + not-yet-active both rejected)");
})();

// ---- 6. comp bypasses the percentOff cap even with a junk percentOff --------
(function () {
  const coupons = [{ code: "WWSHUNDRED", comp: true, percentOff: 100, location: "all", validFrom: null, validUntil: null }];
  const r = validateCouponAgainst("WWSHUNDRED", coupons, { location: "powdersville", nowISO: NOW });
  assert.strictEqual(r.valid, true, "comp:true bypasses the 1..99 percentOff check even when percentOff=100");
  assert.strictEqual(r.comp, true, "still comp");
  ok("comp coupon bypasses the 1..99 cap (percentOff ignored when comp:true)");
})();

// ---- 7. flat-dollar coupon validates with amountOff (cents) -----------------
(function () {
  const coupons = [{ code: "SHARON200", amountOff: 20000, location: "any", validFrom: null, validUntil: null }];
  const r = validateCouponAgainst("sharon200", coupons, { location: "powdersville", nowISO: NOW });
  assert.strictEqual(r.valid, true, "flat-dollar coupon validates");
  assert.strictEqual(r.amountOff, 20000, "amountOff (cents) preserved");
  assert.strictEqual(r.code, "SHARON200", "code normalized");
  assert.strictEqual(r.percentOff, undefined, "flat-dollar result carries NO percentOff");
  assert.ok(!r.comp, "flat-dollar is not comp");
  assert.ok(/\$200 off/.test(r.label), "label reads '$200 off', got: " + r.label);
  ok("flat-dollar coupon validates with amountOff cents, no percentOff");
})();

// ---- 8. amountOff takes precedence over a percentOff on the same coupon -----
(function () {
  const coupons = [{ code: "BOTH", amountOff: 5000, percentOff: 25, location: "any", validFrom: null, validUntil: null }];
  const r = validateCouponAgainst("BOTH", coupons, { location: "taylors-mill", nowISO: NOW });
  assert.strictEqual(r.valid, true, "coupon with both fields validates");
  assert.strictEqual(r.amountOff, 5000, "amountOff wins over percentOff");
  assert.strictEqual(r.percentOff, undefined, "percentOff not surfaced when amountOff present");
  ok("amountOff takes precedence over percentOff");
})();

// ---- 9. flat-dollar honors location scope + validity -----------------------
(function () {
  const scoped = [{ code: "PV50", amountOff: 5000, location: "powdersville", validFrom: null, validUntil: null }];
  assert.strictEqual(validateCouponAgainst("PV50", scoped, { location: "taylors-mill", nowISO: NOW }).valid, false, "flat-dollar scoped to PV invalid at TM");
  assert.strictEqual(validateCouponAgainst("PV50", scoped, { location: "powdersville", nowISO: NOW }).valid, true, "flat-dollar valid at its own location");

  const expired = [{ code: "OLD", amountOff: 5000, location: "any", validFrom: null, validUntil: "2026-06-01" }];
  assert.strictEqual(validateCouponAgainst("OLD", expired, { location: "powdersville", nowISO: NOW }).valid, false, "expired flat-dollar rejected");
  ok("flat-dollar coupon honors location scope + validity window");
})();

// ---- 10. zero / negative amountOff is not a valid flat-dollar --------------
(function () {
  // amountOff:0 with no valid percentOff → falls through to the percentOff check
  // and is rejected (no discount mechanism at all).
  const zero = [{ code: "ZERO", amountOff: 0, location: "any", validFrom: null, validUntil: null }];
  assert.strictEqual(validateCouponAgainst("ZERO", zero, { location: "powdersville", nowISO: NOW }).valid, false, "amountOff:0 with no percentOff is rejected");
  ok("zero amountOff with no percentOff is rejected");
})();

// ---- 11. "Who?" — email-restricted coupon (DREW-52 part 3) -----------------
(function () {
  // Bound to sharon@example.com. Matching email (any case/whitespace) → valid.
  const bound = [{ code: "SHARON200", amountOff: 20000, location: "any", validFrom: null, validUntil: null, restrictedEmail: "sharon@example.com" }];
  assert.strictEqual(
    validateCouponAgainst("SHARON200", bound, { location: "powdersville", nowISO: NOW, email: "  Sharon@Example.COM " }).valid,
    true,
    "email-bound code valid when the booking email matches (normalized)"
  );
  // Different email → rejected with the reserved-for reason.
  const wrong = validateCouponAgainst("SHARON200", bound, { location: "powdersville", nowISO: NOW, email: "someone@else.com" });
  assert.strictEqual(wrong.valid, false, "email-bound code rejected for a mismatched email");
  assert.ok(/specific customer/i.test(wrong.reason), "mismatch reason mentions a specific customer");
  // No email provided → rejected (can't prove the match).
  assert.strictEqual(
    validateCouponAgainst("SHARON200", bound, { location: "powdersville", nowISO: NOW }).valid,
    false,
    "email-bound code rejected when no booking email is provided"
  );
  ok("email-restricted coupon honors the Who? binding");
})();

// ---- 12. unbound coupon is completely unaffected by email -------------------
(function () {
  // No restrictedEmail → every existing company-wide code behaves as before,
  // regardless of whether an email is passed or not.
  const open = [{ code: "WW10", percentOff: 10, location: "any", validFrom: null, validUntil: null }];
  assert.strictEqual(validateCouponAgainst("WW10", open, { location: "powdersville", nowISO: NOW }).valid, true, "unbound code valid with no email");
  assert.strictEqual(validateCouponAgainst("WW10", open, { location: "powdersville", nowISO: NOW, email: "anyone@x.com" }).valid, true, "unbound code valid with any email");
  ok("unbound coupon is unaffected by the email restriction");
})();

// ---- 13. "Who?" allow-list (allowedContacts) — email OR phone (DREW-53) -----
(function () {
  // Allow-list holds one email + one phone (both normalized). A booking matches
  // by EITHER. Bar everyone else.
  const coupons = [{
    code: "VIPONLY", percentOff: 30, location: "any", validFrom: null, validUntil: null,
    allowedContacts: ["vip@example.com", "8038738153"],
  }];
  // Match by email (case/space-insensitive).
  assert.strictEqual(
    validateCouponAgainst("VIPONLY", coupons, { location: "powdersville", nowISO: NOW, email: " VIP@Example.com " }).valid,
    true, "allow-list matches by email"
  );
  // Match by phone (any formatting → digits).
  assert.strictEqual(
    validateCouponAgainst("VIPONLY", coupons, { location: "powdersville", nowISO: NOW, phone: "(803) 873-8153" }).valid,
    true, "allow-list matches by phone regardless of formatting"
  );
  // Neither matches → reserved-for-a-specific-customer.
  const no = validateCouponAgainst("VIPONLY", coupons, { location: "powdersville", nowISO: NOW, email: "nobody@x.com", phone: "8645550000" });
  assert.strictEqual(no.valid, false, "allow-list rejects a non-listed booker");
  assert.ok(/specific customer/i.test(no.reason), "reason mentions a specific customer");
  ok("Who? allow-list honors email OR phone (DREW-53)");
})();

// ---- 14. "Boycott" block-list (blockedContacts) — the inverse (DREW-53 item 1) ----
(function () {
  // A live company code that boycotts one abuser by BOTH email and phone.
  const coupons = [{
    code: "COMP100", comp: true, location: "any", validFrom: null, validUntil: null,
    blockedContacts: ["abuser@example.com", "18035551234"],
  }];
  // The blocked email → rejected (generic "isn't valid" so the abuser isn't tipped off).
  const byEmail = validateCouponAgainst("COMP100", coupons, { location: "powdersville", nowISO: NOW, email: "Abuser@Example.com" });
  assert.strictEqual(byEmail.valid, false, "boycott rejects the blocked email");
  assert.ok(/isn.t valid/i.test(byEmail.reason), "boycott reason is the generic invalid message");
  // The blocked phone (any format) → rejected.
  assert.strictEqual(
    validateCouponAgainst("COMP100", coupons, { location: "powdersville", nowISO: NOW, phone: "+1 (803) 555-1234" }).valid,
    false, "boycott rejects the blocked phone regardless of formatting"
  );
  // An UNRELATED booker → the code still comps normally (stays live for everyone else).
  const other = validateCouponAgainst("COMP100", coupons, { location: "powdersville", nowISO: NOW, email: "regular@customer.com", phone: "8645559999" });
  assert.strictEqual(other.valid, true, "boycotted code still valid for everyone else");
  assert.strictEqual(other.comp, true, "unrelated booker still gets the comp");
  ok("Boycott block-list bars a specific person while the code stays live for others");
})();

// ---- 15. allow-list + block-list on the SAME code (block wins over allow) ----
(function () {
  // Allow-listed by phone but ALSO boycotted by email → still rejected (block is
  // checked after allow, so a listed-then-barred contact can't use it).
  const coupons = [{
    code: "MIXED", percentOff: 20, location: "any", validFrom: null, validUntil: null,
    allowedContacts: ["8038738153"], blockedContacts: ["dupe@example.com"],
  }];
  const r = validateCouponAgainst("MIXED", coupons, { location: "powdersville", nowISO: NOW, phone: "8038738153", email: "dupe@example.com" });
  assert.strictEqual(r.valid, false, "boycott wins even when the phone is on the allow-list");
  ok("block-list is enforced after the allow-list (block wins)");
})();

// ---- 16. a code with neither list is completely unaffected ------------------
(function () {
  const open = [{ code: "OPEN", percentOff: 10, location: "any", validFrom: null, validUntil: null }];
  assert.strictEqual(validateCouponAgainst("OPEN", open, { location: "powdersville", nowISO: NOW, email: "a@b.com", phone: "8035551234" }).valid, true, "no lists → any booker valid");
  // Empty arrays behave the same as absent.
  const empty = [{ code: "OPEN2", percentOff: 10, location: "any", validFrom: null, validUntil: null, allowedContacts: [], blockedContacts: [] }];
  assert.strictEqual(validateCouponAgainst("OPEN2", empty, { location: "powdersville", nowISO: NOW, email: "a@b.com" }).valid, true, "empty lists → any booker valid");
  ok("a code with no allow/block lists is unaffected by the new logic");
})();

console.log("\nAll " + passed + " coupon assertions passed.");
