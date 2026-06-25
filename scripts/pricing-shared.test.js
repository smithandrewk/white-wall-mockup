// Unit tests for scripts/pricing-shared.js (multi-day cart pricing, V3 items 2/4/6).
// Run: node scripts/pricing-shared.test.js
var assert = require("assert");
var P = require("./pricing-shared");

// day discount multipliers
assert.strictEqual(P.dayDiscountMultiplier(0), 1.0, "day1 full");
assert.strictEqual(P.dayDiscountMultiplier(1), 0.85, "day2 -15%");
assert.strictEqual(P.dayDiscountMultiplier(2), 0.70, "day3 -30%");
assert.strictEqual(P.dayDiscountMultiplier(5), 0.70, "day6 still -30%");

// eligibility: the five listed add-ons discount; crew + future do not
assert.ok(P.isDiscountEligible("tv"));
assert.ok(P.isDiscountEligible("pa-system"));
assert.ok(P.isDiscountEligible("chairs-50"));
assert.ok(!P.isDiscountEligible("setup-crew"), "setup crew never discounted");
assert.ok(!P.isDiscountEligible("lighting"), "lighting not in the listed five");

// discounted add-on cents
assert.strictEqual(P.discountedAddonCents(5000, 0, "tv"), 5000, "day1 tv full");
assert.strictEqual(P.discountedAddonCents(5000, 1, "tv"), 4250, "day2 tv -15%");
assert.strictEqual(P.discountedAddonCents(5000, 2, "tv"), 3500, "day3 tv -30%");
assert.strictEqual(P.discountedAddonCents(75000, 1, "setup-crew"), 75000, "crew never discounted");
// rounding to nearest cent
assert.strictEqual(P.discountedAddonCents(3333, 1, "tv"), 2833, "round 2833.05 -> 2833");

// whole-cart totals: 3-day event, $750 8h session each day, mixed add-ons
var cart = {
  sessions: [
    { sessionCents: 75000, dayIndex: 0, addons: [ { addonId: "tv", cents: 5000 }, { addonId: "pa-system", cents: 4000 } ] },
    { sessionCents: 75000, dayIndex: 1, addons: [ { addonId: "tv", cents: 5000 } ] },
    { sessionCents: 75000, dayIndex: 2, addons: [ { addonId: "chairs-50", cents: 19000 }, { addonId: "setup-crew", cents: 75000 } ] }
  ]
};
var t = P.computeCartTotals(cart);
assert.strictEqual(t.sessionTotal, 225000, "3x 750 sessions");
// add-ons full: 5000+4000 + 5000 + 19000+75000 = 108000
assert.strictEqual(t.addonTotalFull, 108000, "addon full total");
// discounts: day0 none; day1 tv 5000*.15=750; day2 chairs 19000*.30=5700, crew 0 -> 6450
assert.strictEqual(t.addonDiscount, 750 + 5700, "addon discount total");
assert.strictEqual(t.addonTotal, 108000 - 6450, "addon discounted total");
assert.strictEqual(t.total, 225000 + (108000 - 6450), "cart total");

// deposit split 60/40
var d = P.depositSplit(t.total);
assert.strictEqual(d.depositCents + d.balanceDueCents, t.total, "split sums to total");
assert.strictEqual(d.depositCents, Math.round(t.total * 0.6), "60% deposit");

console.log("pricing-shared: ALL TESTS PASSED (total = $" + (t.total / 100).toFixed(2) + ", deposit = $" + (d.depositCents / 100).toFixed(2) + ")");
