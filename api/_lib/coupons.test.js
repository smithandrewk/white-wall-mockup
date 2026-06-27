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

console.log("\nAll " + passed + " coupon assertions passed.");
