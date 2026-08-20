// Unit tests for api/_lib/google-ads.js (WWA-3 margin + attribution sanitize).
// Run: node api/_lib/google-ads.test.js
var assert = require("assert");
var G = require("./google-ads");

// --- computeMarginCents: margin = total − pass-through cleaning − Square fee ---
// $500 booking, no cleaning fee. Square fee = round(50000*0.029)+30 = 1450+30 = 1480.
assert.strictEqual(
  G.computeMarginCents({ totalCents: 50000, cleaningFeeCents: 0 }),
  50000 - 1480,
  "no cleaning: margin = total − square fee"
);

// $500 booking WITH the $150 pass-through cleaning fee. Fee is computed on the
// gross total (Smart Bidding is optimized on the whole transaction), then the
// $150 pass-through is removed because WW keeps $0 of it.
assert.strictEqual(
  G.computeMarginCents({ totalCents: 50000, cleaningFeeCents: 15000 }),
  50000 - 15000 - 1480,
  "cleaning: margin = total − $150 − square fee"
);

// Never negative: a tiny booking swamped by the fixed $0.30 fee floors at 0.
assert.strictEqual(
  G.computeMarginCents({ totalCents: 20, cleaningFeeCents: 0 }),
  0,
  "margin floors at 0, never negative"
);

// Garbage inputs coerce to 0, never NaN/throw.
assert.strictEqual(G.computeMarginCents({}), 0, "empty opts → 0");
assert.strictEqual(G.computeMarginCents({ totalCents: "abc" }), 0, "non-numeric → 0");

// A gross-value booking (cleaning NOT subtracted) would be strictly larger —
// proves we are NOT uploading gross.
var marginWithFee = G.computeMarginCents({ totalCents: 50000, cleaningFeeCents: 15000 });
var grossLike = G.computeMarginCents({ totalCents: 50000, cleaningFeeCents: 0 });
assert.ok(marginWithFee < grossLike, "margin strictly below gross-based value");

// --- sanitizeAttribution ---
assert.strictEqual(G.sanitizeAttribution(null), null, "null → null");
assert.strictEqual(G.sanitizeAttribution({}), null, "no click id → null");
assert.strictEqual(G.sanitizeAttribution({ utm_source: "google" }), null, "utm only, no click id → null");

var a = G.sanitizeAttribution({ gclid: "abc123", utm_source: "google", junk: "x", ts: 123 });
assert.deepStrictEqual(a, { gclid: "abc123", utm_source: "google" }, "keeps click id + utm, drops unknown keys");

var b = G.sanitizeAttribution({ wbraid: "w1", gbraid: "g1" });
assert.deepStrictEqual(b, { wbraid: "w1", gbraid: "g1" }, "wbraid/gbraid kept");

var tooLong = "x".repeat(600);
assert.strictEqual(G.sanitizeAttribution({ gclid: tooLong }), null, "over-long gclid dropped → null");

// --- formatEventTimestamp: RFC 3339 (ISO-8601, Data Manager API) ---
var dt = G.formatEventTimestamp(new Date("2026-08-19T14:05:09Z"));
assert.strictEqual(dt, "2026-08-19T14:05:09.000Z", "RFC 3339 / ISO UTC");
assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(G.formatEventTimestamp(new Date())),
  "now() matches RFC 3339 shape");

// --- bookingDestination: Google Ads account + conversion action (no dashes) ---
process.env.GOOGLE_ADS_BOOKING_CONVERSION_ACTION_ID = "7727263911";
process.env.GOOGLE_ADS_CUSTOMER_ID = "506-165-6241";
var dest = G.bookingDestination();
assert.strictEqual(dest.operatingAccount.accountId, "5061656241", "customer id stripped of dashes");
assert.strictEqual(dest.operatingAccount.accountType, "GOOGLE_ADS", "GOOGLE_ADS account type");
assert.strictEqual(dest.productDestinationId, "7727263911", "conversion action numeric id");
delete process.env.GOOGLE_ADS_BOOKING_CONVERSION_ACTION_ID;
delete process.env.GOOGLE_ADS_CUSTOMER_ID;

// --- isConfigured: dark unless every credential + action id is present ---
assert.strictEqual(G.isConfigured(), false, "dark by default (no env set in test)");

console.log("google-ads.test.js: all assertions passed");
