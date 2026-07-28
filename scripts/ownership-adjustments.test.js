// Ownership add-on / discount math (DREW-19/21) — pins Drew's own worked
// examples as the spec, plus the clamp semantics the dashboard's
// ownershipCents/ownershipAddCents defined and the offer-link charge path
// (api/create-checkout.js) now relies on. If these change, the dashboard's
// flow-pricing (generated copy) and every signed offer link change with them —
// regenerate the dashboard module and expect old links to fail the price
// assert (by design).
const test = require("node:test");
const assert = require("node:assert");
const pricing = require("./pricing-shared");

const { ownershipAdjustments, ownershipDiscountAmount, ownershipAddonAmount } = pricing;

test("Drew's worked example — addon-first: $3,546 build + $1,000 add-on, 10% discount", () => {
  const r = ownershipAdjustments(
    354600,
    { mode: "dollar", value: 1000 },
    { mode: "percent", value: 10 },
    "addon-first"
  );
  assert.strictEqual(r.addonCents, 100000);
  // 10% of $4,546 = $454.60
  assert.strictEqual(r.discountCents, 45460);
  assert.strictEqual(r.finalCents, 354600 + 100000 - 45460);
});

test("Drew's worked example — discount-first: 10% off $3,546, then $1,000 add-on", () => {
  const r = ownershipAdjustments(
    354600,
    { mode: "dollar", value: 1000 },
    { mode: "percent", value: 10 },
    "discount-first"
  );
  // 10% of $3,546 = $354.60
  assert.strictEqual(r.discountCents, 35460);
  assert.strictEqual(r.addonCents, 100000);
  assert.strictEqual(r.finalCents, 354600 - 35460 + 100000);
});

test("DREW-19 live-verify example: 10% of $1,130 addon-first vs $130 discount-first", () => {
  // $130 base + $1,000 add-on: addon-first discounts $113, discount-first $13.
  const addonFirst = ownershipAdjustments(13000, { mode: "dollar", value: 1000 }, { mode: "percent", value: 10 }, "addon-first");
  assert.strictEqual(addonFirst.discountCents, 11300);
  const discountFirst = ownershipAdjustments(13000, { mode: "dollar", value: 1000 }, { mode: "percent", value: 10 }, "discount-first");
  assert.strictEqual(discountFirst.discountCents, 1300);
});

test("discount clamps to the running base — never a negative charge", () => {
  const r = ownershipAdjustments(20000, null, { mode: "dollar", value: 500 }, "addon-first");
  assert.strictEqual(r.discountCents, 20000); // $500 requested, $200 available
  assert.strictEqual(r.finalCents, 0);
});

test("discount percent caps at 100", () => {
  assert.strictEqual(ownershipDiscountAmount({ mode: "percent", value: 250 }, 10000), 10000);
});

test("addon sanity bounds: 1000% and $1M caps, no clamp to base", () => {
  assert.strictEqual(ownershipAddonAmount({ mode: "percent", value: 5000 }, 10000), 100000); // capped at 1000%
  assert.strictEqual(ownershipAddonAmount({ mode: "dollar", value: 2000000 }, 10000), 100000000); // capped at $1M
  assert.strictEqual(ownershipAddonAmount({ mode: "dollar", value: 1000 }, 0), 100000); // add-on exceeds base freely
});

test("null/zero/negative adjustments are no-ops", () => {
  const r = ownershipAdjustments(12345, null, null, "addon-first");
  assert.deepStrictEqual(r, { addonCents: 0, discountCents: 0, finalCents: 12345 });
  const z = ownershipAdjustments(12345, { mode: "dollar", value: 0 }, { mode: "percent", value: -5 }, "discount-first");
  assert.deepStrictEqual(z, { addonCents: 0, discountCents: 0, finalCents: 12345 });
});

test("order default (unknown applyOrder) behaves as addon-first", () => {
  const a = ownershipAdjustments(354600, { mode: "dollar", value: 1000 }, { mode: "percent", value: 10 }, "addon-first");
  const b = ownershipAdjustments(354600, { mode: "dollar", value: 1000 }, { mode: "percent", value: 10 }, "whatever");
  assert.deepStrictEqual(a, b);
});
