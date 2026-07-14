// Unit tests for scripts/pricing-shared.js (multi-day cart pricing, V3 items 2/4/6).
// Run: node scripts/pricing-shared.test.js
var assert = require("assert");
var P = require("./pricing-shared");

// day discount multipliers (Drew raised the ladder to 20%/40% on 2026-07-13)
assert.strictEqual(P.dayDiscountMultiplier(0), 1.0, "day1 full");
assert.strictEqual(P.dayDiscountMultiplier(1), 0.80, "day2 -20%");
assert.strictEqual(P.dayDiscountMultiplier(2), 0.60, "day3 -40%");
assert.strictEqual(P.dayDiscountMultiplier(5), 0.60, "day6 still -40%");

// eligibility: the five listed add-ons discount; crew + future do not
assert.ok(P.isDiscountEligible("tv"));
assert.ok(P.isDiscountEligible("pa-system"));
assert.ok(P.isDiscountEligible("chairs-50"));
assert.ok(!P.isDiscountEligible("setup-crew"), "setup crew never discounted");
assert.ok(!P.isDiscountEligible("lighting"), "lighting not in the listed five");

// discounted add-on cents
assert.strictEqual(P.discountedAddonCents(5000, 0, "tv"), 5000, "day1 tv full");
assert.strictEqual(P.discountedAddonCents(5000, 1, "tv"), 4000, "day2 tv -20%");
assert.strictEqual(P.discountedAddonCents(5000, 2, "tv"), 3000, "day3 tv -40%");
assert.strictEqual(P.discountedAddonCents(75000, 1, "setup-crew"), 75000, "crew never discounted");
// rounding to nearest cent
assert.strictEqual(P.discountedAddonCents(3333, 1, "tv"), 2666, "round 2666.4 -> 2666");

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
// discounts: day0 none; day1 tv 5000*.20=1000; day2 chairs 19000*.40=7600, crew 0 -> 8600
assert.strictEqual(t.addonDiscount, 1000 + 7600, "addon discount total");
assert.strictEqual(t.addonTotal, 108000 - 8600, "addon discounted total");
assert.strictEqual(t.total, 225000 + (108000 - 8600), "cart total");

// The invariant the new summary leans on: retail minus savings IS the charged total.
// Drew's summary now shows "subtotal at retail" and "savings" as separate lines, and
// this is what guarantees those lines reconcile to the number we charge.
assert.strictEqual(t.addonTotalFull - t.addonDiscount, t.addonTotal, "retail - savings = charged");
assert.strictEqual(t.sessionTotal + t.addonTotalFull - t.addonDiscount, t.total, "summary reconciles to total");

// deposit split 60/40
var d = P.depositSplit(t.total);
assert.strictEqual(d.depositCents + d.balanceDueCents, t.total, "split sums to total");
assert.strictEqual(d.depositCents, Math.round(t.total * 0.6), "60% deposit");

// ---------------------------------------------------------------------------
// ADD-ON DAY LADDER — Day1 full, Day2 20% off, Day3+ 40% off (Drew, 2026-07-13,
// raised from 15%/30%; msg 19f5e1ef38252d34). This is HIS worked example, sent as a
// screenshot and used as the spec: a $190 add-on over five days.
var CHAIRS = 19000; // chairs-50, the add-on he used
assert.strictEqual(P.dayDiscountMultiplier(0), 1.0, "Day 1 full price");
assert.strictEqual(P.dayDiscountMultiplier(1), 0.80, "Day 2 = 20% off");
assert.strictEqual(P.dayDiscountMultiplier(2), 0.60, "Day 3 = 40% off");
assert.strictEqual(P.dayDiscountMultiplier(4), 0.60, "Day 5 still 40% off (stays flat)");

assert.strictEqual(P.discountedAddonCents(CHAIRS, 0, "chairs-50"), 19000, "Day 1 -> $190 (Drew)");
assert.strictEqual(P.discountedAddonCents(CHAIRS, 1, "chairs-50"), 15200, "Day 2 -> $152 (Drew)");
assert.strictEqual(P.discountedAddonCents(CHAIRS, 2, "chairs-50"), 11400, "Day 3 -> $114 (Drew)");
assert.strictEqual(P.discountedAddonCents(CHAIRS, 3, "chairs-50"), 11400, "Day 4 -> $114 (Drew)");
assert.strictEqual(P.discountedAddonCents(CHAIRS, 4, "chairs-50"), 11400, "Day 5 -> $114 (Drew)");
// His five-day total: $190 + $152 + $114 + $114 + $114 = $684.
var fiveDay = [0,1,2,3,4].reduce(function (sum, i) {
  return sum + P.discountedAddonCents(CHAIRS, i, "chairs-50");
}, 0);
assert.strictEqual(fiveDay, 68400, "Drew's five-day add-on total = $684");

// "All add-ons across the board, EXCEPT fixed cost / one-time fee" — the Setup Crew
// is the flat one and must never taper, on any day.
assert.strictEqual(P.isDiscountEligible("setup-crew"), false, "setup crew is flat");
assert.strictEqual(P.discountedAddonCents(75000, 4, "setup-crew"), 75000, "flat add-on never tapers");

// ---------------------------------------------------------------------------
// MULTI-DAY EVENT DISCOUNT — $160 per impacted day (Drew, 2026-07-13, raised from
// $100 the same evening). These are HIS numbers, quoted from msg 19f5e16ccb04f1c3,
// so if someone changes the rate again this test tells them exactly what Drew was
// promised. The 2-day case is the one he did NOT list (his table starts at 3 days);
// it is the linear implication of his own arithmetic and was confirmed to him.
assert.strictEqual(P.multiDayDiscountCents(2), 32000, "2 days -> $320 (inferred, linear)");
assert.strictEqual(P.multiDayDiscountCents(3), 48000, "3 days -> $480 (Drew)");
assert.strictEqual(P.multiDayDiscountCents(4), 64000, "4 days -> $640 (Drew)");
assert.strictEqual(P.multiDayDiscountCents(5), 80000, "5 days -> $800 (Drew)");
assert.strictEqual(P.multiDayDiscountCents(6), 96000, "6 days -> $960 (Drew)");
assert.strictEqual(P.multiDayDiscountCents(7), 112000, "7 days -> $1,120 (Drew)");

// Not a multi-day event -> nothing. A 1-day "event" is not multi-day.
assert.strictEqual(P.multiDayDiscountCents(1), 0, "1 day -> no discount");
assert.strictEqual(P.multiDayDiscountCents(0), 0, "0 days -> no discount");

// Clamp: a discount can NEVER exceed the total (no negative charge). A 10-day event
// discounts $1,600, so against a $500 total it must clamp to $500, not refund $1,100.
assert.strictEqual(P.multiDayDiscountCents(10, 50000), 50000, "clamped to the total");
assert.strictEqual(P.multiDayDiscountCents(3, 100000), 48000, "under the cap, unclamped");

// The customer-facing copy is DERIVED from the rate, so the page cannot promise a
// rate the checkout won't charge. This is the assertion that catches copy drift.
assert.strictEqual(P.multiDayPerDayLabel(), "$160", "per-day label matches the rate");
assert.strictEqual(
  P.multiDayPerDayLabel(),
  "$" + P.MULTIDAY_DISCOUNT_PER_DAY_CENTS / 100,
  "label is derived from the constant, not typed"
);

console.log("pricing-shared: ALL TESTS PASSED (total = $" + (t.total / 100).toFixed(2) + ", deposit = $" + (d.depositCents / 100).toFixed(2) + ", multi-day rate = " + P.multiDayPerDayLabel() + "/day)");
