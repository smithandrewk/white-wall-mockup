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
//  - Per-day add-on discount by chronological day index: Day1 100%, Day2 80%,
//    Day3+ 60% (Drew raised this from 85%/70% on 2026-07-13). Applies ONLY to the
//    listed add-ons (rolling walls, chairs, tables, PA, TV, backdrops). The Event
//    Setup and Reset Crew and any future add-ons are flat — "fixed cost or one-time
//    fee" add-ons are never discounted, which is exactly the carve-out Drew asked
//    for. Session price is never discounted.

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

  // Day index -> multiplier. Day1 (0) full, Day2 (1) -20%, Day3+ (>=2) -40%.
  //
  // Drew RAISED this ladder 2026-07-13 (msg 19f5e1ef38252d34) from 15%/30% to
  // 20%/40%, and sent his own worked example as the spec — a $190 add-on over
  // five days: $190, $152, $114, $114, $114 = $684. That example is pinned in
  // pricing-shared.test.js; if this ladder changes again, that test is the
  // statement of what the customer was promised.
  function dayDiscountMultiplier(dayIndex) {
    if (dayIndex <= 0) return 1.0;
    if (dayIndex === 1) return 0.80;
    return 0.60;
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
  // "For every consecutive day impacted, they get $N off the total amount."
  // Drew RAISED the rate $100 -> $160/day the same evening (msg 19f5e16ccb04f1c3),
  // with these examples: 3d = $480, 4d = $640, 5d = $800, 6d = $960, 7d = $1,120.
  // All exactly 160 x days, so the rule's SHAPE is unchanged — only the rate moved.
  //   2-day event  -> $320 off   (he listed from 3 days up; linear implies this, and
  //                   MIN_DAYS has always been 2. Confirmed to him in writing.)
  //   3-day event  -> $480 off
  //   5-day event  -> $800 off
  //
  // Because he has now changed this rate twice in one day, the customer-facing COPY
  // is derived from the constant below (see perDayLabel/multiDayCopy) instead of
  // hardcoding the dollars in the page text. The math already lived in one place; the
  // WORDS did not, and stale copy promising the old rate is a money bug.
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
  var MULTIDAY_DISCOUNT_PER_DAY_CENTS = 16000; // $160 per impacted day (Drew, 2026-07-13)
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

  /**
   * The per-day rate as customer-facing text, e.g. "$160". Whole dollars when the rate
   * is whole dollars (it always has been), cents only if it ever isn't.
   *
   * Every place the site SAYS the rate — the builder intro, the live discount line, the
   * cart summary, the Good-to-Know clause, the Acuity note — calls this. So changing
   * MULTIDAY_DISCOUNT_PER_DAY_CENTS above changes the words too, and the page can never
   * promise a rate we don't actually charge.
   */
  function multiDayPerDayLabel() {
    var c = MULTIDAY_DISCOUNT_PER_DAY_CENTS;
    return c % 100 === 0 ? "$" + (c / 100) : "$" + (c / 100).toFixed(2);
  }

  return {
    DISCOUNT_ELIGIBLE_ADDONS: DISCOUNT_ELIGIBLE_ADDONS,
    multiDayPerDayLabel: multiDayPerDayLabel,
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
