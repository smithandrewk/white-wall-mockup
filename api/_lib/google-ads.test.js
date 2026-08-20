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

// --- formatConversionDateTime: 'yyyy-MM-dd HH:mm:ss+00:00' (offset required) ---
var dt = G.formatConversionDateTime(new Date("2026-08-19T14:05:09Z"));
assert.strictEqual(dt, "2026-08-19 14:05:09+00:00", "UTC format with offset");
assert.ok(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+00:00$/.test(G.formatConversionDateTime(new Date())),
  "now() matches required shape");

// --- isConfigured: dark unless every credential + action id is present ---
assert.strictEqual(G.isConfigured(), false, "dark by default (no env set in test)");

console.log("google-ads.test.js: all assertions passed");
