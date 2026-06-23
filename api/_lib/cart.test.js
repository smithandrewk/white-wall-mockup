// api/_lib/cart.test.js — standalone (node api/_lib/cart.test.js).
// Exercises computeCart with a 3-day mixed-add-on Powdersville cart, including:
//  - chronological day_index assignment from sessions added OUT of order
//  - the per-day add-on discount (eligible vs flat add-ons)
//  - a quantity-priced add-on (2 tables)
//  - the too-early-start rejection (8h Flagship 12:30pm floor, V3 item 3)
//
// Expected totals were computed independently from pricing-shared (the parity
// invariant — see cart.js header).

const assert = require("assert");
const { computeCart } = require("./cart");

function approxLog(label, value) {
  console.log("  " + label + ": " + value);
}

// --- 3-day mixed-add-on cart, deliberately added out of chronological order ---
// Day 1 (earliest): 2hr ($200) + All Rolling Walls ($70, eligible) + Setup Crew ($750, FLAT)
// Day 2:            3hr ($270) + TV ($50, eligible) + PA ($40, eligible)
// Day 3 (latest):   1hr ($130) + 2x 8ft Table ($15 ea = $30, eligible) + All Backdrops ($50, FLAT)
const sessions = [
  // intentionally listed Day3, Day1, Day2 to prove the sort drives day_index
  {
    appointmentTypeID: "89113040", // PV 1hr — $130
    datetime: "2026-07-03T15:00:00-04:00",
    addons: { tables: { quantity: 2 }, backdrops: { mode: "all" } }
  },
  {
    appointmentTypeID: "89113116", // PV 2hr — $200
    datetime: "2026-07-01T15:00:00-04:00",
    addons: { "rolling-walls": { mode: "all" }, "setup-crew": { selected: true } }
  },
  {
    appointmentTypeID: "89114444", // PV 3hr — $270
    datetime: "2026-07-02T15:00:00-04:00",
    addons: { tv: { selected: true }, "pa-system": { selected: true } }
  }
];

const result = computeCart(sessions, "powdersville");

console.log("Cart result:");
console.log(JSON.stringify(result, null, 2));

// day_index is by chronological order, not insertion order.
assert.strictEqual(result.sessions.length, 3);
assert.strictEqual(result.sessions[0].appointmentTypeID, "89113116", "Day1 = 2hr (Jul 1)");
assert.strictEqual(result.sessions[0].dayIndex, 0);
assert.strictEqual(result.sessions[1].appointmentTypeID, "89114444", "Day2 = 3hr (Jul 2)");
assert.strictEqual(result.sessions[1].dayIndex, 1);
assert.strictEqual(result.sessions[2].appointmentTypeID, "89113040", "Day3 = 1hr (Jul 3)");
assert.strictEqual(result.sessions[2].dayIndex, 2);

// Session line cents (flat per-duration prices).
assert.strictEqual(result.sessions[0].sessionCents, 20000);
assert.strictEqual(result.sessions[1].sessionCents, 27000);
assert.strictEqual(result.sessions[2].sessionCents, 13000);

// Quantity-priced add-on: 2 tables = full line of $30.
const day3Table = result.sessions[2].addons.find(function (a) { return a.addonId === "table"; });
assert.ok(day3Table, "day3 has a table add-on line");
assert.strictEqual(day3Table.quantity, 2);
assert.strictEqual(day3Table.cents, 3000, "2 tables = $30 full");

// Setup Crew on Day1 is flat (eligible-ineligible boundary): its line is full $750.
const day1Crew = result.sessions[0].addons.find(function (a) { return a.addonId === "setup-crew"; });
assert.strictEqual(day1Crew.cents, 75000);

// --- Totals (independently computed from pricing-shared) ---
// sessionTotal = 200 + 270 + 130 = $600
// addonTotalFull = (70 + 750) + (50 + 40) + (30 + 50) = $990
// addonDiscount: Day1 walls full ($0 off, dayIndex 0), Setup Crew flat ($0).
//   Day2 tv -15% = $7.50, pa -15% = $6.00.
//   Day3 table -30% = $9.00, backdrops flat ($0). Total discount = $22.50.
// addonTotal = 990 - 22.50 = $967.50 ; total = 600 + 967.50 = $1567.50
assert.strictEqual(result.totals.sessionTotal, 60000);
assert.strictEqual(result.totals.addonTotalFull, 99000);
assert.strictEqual(result.totals.addonDiscount, 2250);
assert.strictEqual(result.totals.addonTotal, 96750);
assert.strictEqual(result.totals.total, 156750);

// Deposit split (60/40 on cart total).
assert.strictEqual(result.deposit.depositCents, 94050);
assert.strictEqual(result.deposit.balanceDueCents, 62700);

approxLog("sessionTotal", result.totals.sessionTotal);
approxLog("addonDiscount", result.totals.addonDiscount);
approxLog("total", result.totals.total);
approxLog("deposit", result.deposit.depositCents);

// --- too-early-start rejection (8h Flagship floor = 12:30pm ET) ---
let threw = false;
try {
  computeCart([
    {
      appointmentTypeID: "94823049", // 8h Flagship, earliest 12:30pm ET
      datetime: "2026-07-05T11:00:00-04:00", // 11:00 ET — too early
      addons: {}
    }
  ], "powdersville");
} catch (e) {
  threw = true;
  assert.ok(/before the earliest allowed start/.test(e.message), "rejects with earliest-start message");
}
assert.ok(threw, "computeCart rejects a too-early 8h start");

// A 12:30pm start for the same type must be accepted.
const okEarly = computeCart([
  { appointmentTypeID: "94823049", datetime: "2026-07-05T12:30:00-04:00", addons: {} }
], "powdersville");
assert.strictEqual(okEarly.sessions[0].sessionCents, 75000);

// Empty / invalid input guards.
assert.throws(function () { computeCart([], "powdersville"); }, /non-empty/);
assert.throws(function () { computeCart([{ appointmentTypeID: "89113040" }], "powdersville"); }, /datetime/);

console.log("\nAll cart.test.js assertions passed.");
