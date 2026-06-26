// scripts/pricing-shared.js — single source of truth for multi-day cart pricing
// (V3 items 2 + 4). UMD: loads as a browser global (window.WWSPricing) AND as a
// CommonJS module (require) so the client display and the server-authoritative
// recompute use IDENTICAL math. The price-parity invariant is where multi-day
// pricing would break, so it lives here once.
//
// Drew's spec (2026-06-22):
//  - Session prices are the existing FLAT per-duration prices, per day. The
//    5am/10:30pm "billing floors" are availability/duration-selection rules,
//    NOT a per-hour billing formula — there is no custom hours math here.
//  - Per-day add-on discount by chronological day index: Day1 100%, Day2 85%,
//    Day3+ 70%. Applies ONLY to the five listed add-ons (rolling walls, chairs,
//    tables, PA, TV). The Event Setup and Reset Crew and any future add-ons are flat,
//    never discounted. Session price is never discounted.

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.WWSPricing = factory();
})(typeof self !== "undefined" ? self : this, function () {

  // Add-on ids eligible for the per-day multi-day discount (Drew's five).
  var DISCOUNT_ELIGIBLE_ADDONS = {
    "rolling-walls": true,
    "walls-all": true,
    "walls-single": true,
    "chairs": true,
    "chairs-25": true, "chairs-50": true, "chairs-75": true, "chairs-100": true,
    "table": true, "tables": true,
    "pa-system": true,
    "tv": true
  };

  // Day index -> multiplier. Day1 (0) full, Day2 (1) -15%, Day3+ (>=2) -30%.
  function dayDiscountMultiplier(dayIndex) {
    if (dayIndex <= 0) return 1.0;
    if (dayIndex === 1) return 0.85;
    return 0.70;
  }

  function isDiscountEligible(addonId) {
    return Boolean(DISCOUNT_ELIGIBLE_ADDONS[addonId]);
  }

  // Discounted add-on amount in cents. Rounds to the nearest cent. Non-eligible
  // add-ons (setup-crew, future) and Day 1 return the full amount.
  function discountedAddonCents(fullCents, dayIndex, addonId) {
    if (!isDiscountEligible(addonId)) return fullCents;
    var m = dayDiscountMultiplier(dayIndex);
    return Math.round(fullCents * m);
  }

  // The discount taken off a single add-on line (full - discounted), in cents.
  function addonDiscountCents(fullCents, dayIndex, addonId) {
    return fullCents - discountedAddonCents(fullCents, dayIndex, addonId);
  }

  // Compute a whole cart total from a normalized shape:
  //   { sessions: [ { sessionCents, dayIndex, addons: [ { addonId, cents } ] } ] }
  // dayIndex should be assigned by chronological session order before calling.
  // Returns { sessionTotal, addonTotalFull, addonDiscount, addonTotal, total } (cents).
  function computeCartTotals(cart) {
    var sessionTotal = 0, addonTotalFull = 0, addonDiscount = 0;
    (cart.sessions || []).forEach(function (s) {
      sessionTotal += s.sessionCents || 0;
      (s.addons || []).forEach(function (a) {
        var full = a.cents || 0;
        addonTotalFull += full;
        addonDiscount += addonDiscountCents(full, s.dayIndex || 0, a.addonId);
      });
    });
    var addonTotal = addonTotalFull - addonDiscount;
    return {
      sessionTotal: sessionTotal,
      addonTotalFull: addonTotalFull,
      addonDiscount: addonDiscount,
      addonTotal: addonTotal,
      total: sessionTotal + addonTotal
    };
  }

  // Deposit split (V3 item 6): 60% deposit, 40% balance, on the whole cart total.
  function depositSplit(totalCents) {
    var deposit = Math.round(totalCents * 0.60);
    return { depositCents: deposit, balanceDueCents: totalCents - deposit };
  }

  return {
    DISCOUNT_ELIGIBLE_ADDONS: DISCOUNT_ELIGIBLE_ADDONS,
    dayDiscountMultiplier: dayDiscountMultiplier,
    isDiscountEligible: isDiscountEligible,
    discountedAddonCents: discountedAddonCents,
    addonDiscountCents: addonDiscountCents,
    computeCartTotals: computeCartTotals,
    depositSplit: depositSplit
  };
});
