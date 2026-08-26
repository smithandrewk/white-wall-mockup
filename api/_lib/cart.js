// api/_lib/cart.js — PURE, isolated multi-session cart pricing (V3 item 2 + 4).
//
// computeCart(sessions, location) is the server-authoritative recompute for a
// multi-day cart. It is intentionally NOT wired into create-checkout yet — it's
// built and unit-tested in isolation first, then adopted by the N-session
// checkout in a later step.
//
// Design (mirrors client/comms/2026-06-23-item2-cart-build-plan.md):
//  - Sessions are sorted CHRONOLOGICALLY (by datetime) to assign day_index
//    deterministically, regardless of the order the customer added them.
//  - Per session, buildSquareLineItems(appointmentTypeID, addons, location)
//    produces the session line (items[0], addonId === null) and one line per
//    add-on group (each tagged with its addonId). This is the SAME builder the
//    single-session checkout uses, so line math can't drift between paths.
//  - The per-day add-on discount (Day1 100% / Day2 85% / Day3+ 70%, only the
//    five eligible add-on ids; Setup Crew + future are flat) is applied by
//    pricing-shared via computeCartTotals — this module just hands it the
//    normalized { sessions:[{ sessionCents, dayIndex, addons:[{addonId,cents}] }] }
//    shape. Session price is never discounted.
//  - isStartBeforeEarliest is enforced PER SESSION (the 8h Flagship 12:30pm floor,
//    V3 item 3) — a too-early start is rejected here, not silently priced.
//    (No studio close cap: Drew 2026-06-25 clarified neither studio closes at
//    10:30pm; a solo late booking is fine. The 10:30pm cap is ONLY a future
//    multi-day pre-event-day BILLING window, not an availability rejection.)
//
// Returns:
//   { sessions: [ { appointmentTypeID, datetime, dayIndex, sessionCents,
//                    addons: [ { addonId, cents, quantity } ],
//                    sessionAddonFull } ],
//     totals: { sessionTotal, addonTotalFull, addonDiscount, addonTotal, total },
//     deposit: { depositCents, balanceDueCents } }   (all cents)

const {
  buildSquareLineItems,
  isStartBeforeEarliest,
} = require("./acuity");

const pricing = require("../../scripts/pricing-shared");

// Chronological comparator on ISO datetime. Stable for equal timestamps.
function byDatetime(a, b) {
  var ta = new Date(a.datetime).getTime();
  var tb = new Date(b.datetime).getTime();
  return ta - tb;
}

// computeCart — pure. Throws on a too-early session or an invalid datetime.
function computeCart(sessions, location) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    throw new Error("computeCart: sessions must be a non-empty array");
  }

  // Sort chronologically (copy — don't mutate caller's array) so day_index is
  // deterministic regardless of add order.
  var ordered = sessions.slice().sort(byDatetime);

  var normalizedSessions = ordered.map(function (s, dayIndex) {
    if (!s || !s.datetime) {
      throw new Error("computeCart: each session needs a datetime");
    }
    if (isNaN(new Date(s.datetime).getTime())) {
      throw new Error("computeCart: invalid datetime: " + s.datetime);
    }

    // Enforce the per-type earliest-start floor (e.g. 8h Flagship 12:30pm ET).
    // DREW-93: skip it for a session carrying the owner's earlyStartOverride.
    // create-checkout only sets that flag from a signature-verified offer
    // (offer && s.earlyStartOverride), so it can't be reached from a raw POST —
    // the floor still holds for every ordinary booking.
    if (!s.earlyStartOverride && isStartBeforeEarliest(s.appointmentTypeID, s.datetime)) {
      throw new Error(
        "computeCart: session start " + s.datetime +
        " is before the earliest allowed start for type " + s.appointmentTypeID
      );
    }

    // Reuse the single-session line-item builder. items[0] is always the
    // session line (addonId === null); the rest are add-on lines, each tagged
    // with addonId. Quantity-priced add-ons carry quantity > 1, so the full
    // line value is amount * quantity.
    var lineItems = buildSquareLineItems(s.appointmentTypeID, s.addons, location);

    var sessionCents = lineItems[0].amount; // session line, quantity always 1
    var addons = lineItems.slice(1).map(function (li) {
      return {
        addonId: li.addonId,
        cents: li.amount * (li.quantity || 1), // FULL (undiscounted) line value
        quantity: li.quantity || 1
      };
    });

    var sessionAddonFull = addons.reduce(function (sum, a) {
      return sum + a.cents;
    }, 0);

    return {
      appointmentTypeID: s.appointmentTypeID,
      datetime: s.datetime,
      dayIndex: dayIndex,
      sessionCents: sessionCents,
      addons: addons,
      sessionAddonFull: sessionAddonFull
    };
  });

  // pricing-shared expects { sessions:[{ sessionCents, dayIndex, addons:[{addonId,cents}] }] }
  // where each add-on `cents` is the FULL line value — it applies the per-day
  // discount internally by addonId + dayIndex.
  var totals = pricing.computeCartTotals({ sessions: normalizedSessions });
  var deposit = pricing.depositSplit(totals.total);

  return {
    sessions: normalizedSessions,
    totals: totals,
    deposit: deposit
  };
}

module.exports = { computeCart };
