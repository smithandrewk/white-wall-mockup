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

  // Add-on ids eligible for the per-day multi-day discount. Backdrops added
  // 2026-07-10 per Drew: mirror chairs/tables (full price day 1, then the same
  // progressive discount on continuous days). Setup Crew stays flat (per booking).
  var DISCOUNT_ELIGIBLE_ADDONS = {
    "rolling-walls": true,
    "walls-all": true,
    "walls-single": true,
    "chairs": true,
    "chairs-25": true, "chairs-50": true, "chairs-75": true, "chairs-100": true,
    "table": true, "tables": true,
    "pa-system": true,
    "tv": true,
    "backdrops": true
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

  // ---------------------------------------------------------------------------
  // MULTI-DAY EVENT DISCOUNT (Drew, 2026-07-13)
  //
  // "For every consecutive day impacted, they get $100 off the total amount."
  //   2-day event  -> $200 off
  //   3-day event  -> $300 off  (his Oct 3 afternoon -> Oct 5 end-of-day example)
  //   5-day event  -> $500 off
  //   10-day event -> $1,000 off ("you essentially get one of those days free" —
  //                   a full day is $980, so the math checks out)
  //
  // Day LENGTH is deliberately irrelevant: "doesn't matter how long the first day
  // or last day are booked for, because the event impacts five days in total."
  // A short evening first day and an early-checkout last day each still count as
  // one impacted day. So the multiplier is the COUNT OF CALENDAR DAYS the event
  // spans, which in the range flow is exactly the number of day-sessions.
  //
  // Multi-day EVENTS only (>= 2 days). A single-day event or a photo session gets
  // nothing (a 1-day "event" is not a multi-day event, and Drew framed this
  // strictly as a multi-day incentive).
  //
  // This lives in pricing-shared — the ONE module both the browser and
  // api/create-checkout.js load — so the number the customer is shown and the
  // number we actually charge are computed by the same code and cannot drift.
  // The server still recomputes it independently and never trusts the client.
  // ---------------------------------------------------------------------------
  var MULTIDAY_DISCOUNT_PER_DAY_CENTS = 10000; // $100 per impacted day
  var MULTIDAY_DISCOUNT_MIN_DAYS = 2;          // multi-day only

  /**
   * @param {number} dayCount  calendar days the event spans (= day-session count)
   * @param {number} [preDiscountTotalCents]  grand total BEFORE this discount.
   *        When supplied, the discount is clamped so it can never exceed it —
   *        a discount must never produce a negative charge.
   * @returns {number} discount in cents (0 when not a qualifying multi-day event)
   */
  function multiDayDiscountCents(dayCount, preDiscountTotalCents) {
    var days = Math.floor(Number(dayCount) || 0);
    if (days < MULTIDAY_DISCOUNT_MIN_DAYS) return 0;
    var raw = days * MULTIDAY_DISCOUNT_PER_DAY_CENTS;
    if (preDiscountTotalCents == null) return raw;
    var cap = Math.max(0, Math.floor(Number(preDiscountTotalCents) || 0));
    return Math.min(raw, cap);
  }

  return {
    DISCOUNT_ELIGIBLE_ADDONS: DISCOUNT_ELIGIBLE_ADDONS,
    dayDiscountMultiplier: dayDiscountMultiplier,
    isDiscountEligible: isDiscountEligible,
    discountedAddonCents: discountedAddonCents,
    addonDiscountCents: addonDiscountCents,
    computeCartTotals: computeCartTotals,
    depositSplit: depositSplit,
    MULTIDAY_DISCOUNT_PER_DAY_CENTS: MULTIDAY_DISCOUNT_PER_DAY_CENTS,
    MULTIDAY_DISCOUNT_MIN_DAYS: MULTIDAY_DISCOUNT_MIN_DAYS,
    multiDayDiscountCents: multiDayDiscountCents
  };
});
