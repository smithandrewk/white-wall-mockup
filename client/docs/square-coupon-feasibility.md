# Square Coupon / Discount Feasibility (Research — DOC ONLY)

**Date:** 2026-06-12
**Author:** Claude (Opus 4.8) — task #29
**Scope:** Research only. No application code changed. This documents whether Square's
APIs can natively power the coupon features Drew wants, and recommends an architecture.

## TL;DR

Square's APIs give us **ad-hoc discounts on an order/payment-link** (percentage or fixed
amount, order-wide or per-line-item) and **catalog pricing rules** with validity dates,
customer-group targeting, and minimum-subtotal gating. But Square has **no native
coupon-code system** — no customer-typed code, no per-customer usage limit, no one-time-use
redemption tracking, no booking-date restriction, and no "either % off OR a free add-on"
dual mode. Square staff confirmed this directly: *"there's no way to do this through our
APIs at this time (no way to create coupons or any codes)."*

**Recommendation: server-side coupon layer in `api/create-checkout.js`.** We already own
the pricing math there (we build the Square line items server-side with HMAC-signed state).
A coupon table + validation in that function gives us full control over codes, usage limits,
booking-date scope, non-stackability, expiry, and dual-mode — and we apply the resolved
discount as a Square **ad-hoc line-item discount** so the customer still sees an itemized,
correct total on Square's hosted checkout page. We do **not** use Square's catalog/loyalty
coupon machinery at all.

---

## Per-question findings

### 1) Can we programmatically generate one-time-use coupon codes via API?

**No — not natively.** Square has no coupon-code API. The catalog supports *discounts* and
*pricing rules* (`UpsertCatalogObject` with `type = DISCOUNT`, plus `CatalogPricingRule`),
but these are **automatically applied** based on product sets / time windows / customer
groups — there is no field for a redeemable code a customer types, and no redemption-count
tracking. A Square representative stated plainly on the developer forum: *"there's no way to
do this through our APIs at this time (no way to create coupons or any codes)."*

We *can* generate codes ourselves and store them in our own data layer. The redemption then
manifests in Square only as an **ad-hoc `OrderLineItemDiscount`** we attach when creating the
payment link.

- Evidence: https://developer.squareup.com/forums/t/v2-api-coupon-codes/1059
- Ad-hoc discount support: https://developer.squareup.com/reference/square/objects/OrderLineItemDiscount
- Catalog discount object: https://developer.squareup.com/reference/square/objects/CatalogDiscount

### 2) Per-customer usage limits?

**No native support.** `CatalogPricingRule` has **no usage-count or per-customer-limit
field**. Its only customer-targeting mechanism is `customer_group_ids_any` (apply only to
buyers in a named customer group) — that's group membership, not a redemption cap, and it
requires us to manage Square customer groups, which doesn't map to "this code may be used
once per email." Loyalty rewards are tied to a buyer's point balance, not shareable codes.

To enforce "one use per customer" (or N uses total) we must **track redemptions ourselves**
keyed by code + email/phone.

- `CatalogPricingRule` fields: https://developer.squareup.com/reference/square/objects/CatalogPricingRule
- Loyalty (no codes): https://developer.squareup.com/docs/loyalty-api/overview

### 3) Scoping to location AND to a specific booking date / date-range?

**Partial — and the part we need most is missing.**

- **Location scoping:** Achievable, but indirectly. `CatalogPricingRule` has no location field;
  Square pricing rules are catalog-wide unless gated via product sets / customer groups. In
  *our* world, location scoping is trivial server-side: `create-checkout.js` already knows
  Powdersville vs Taylor's Mill, so we gate a code by location in our own validation.
- **Booking date / date-range:** **Not supported in any useful form.** `CatalogPricingRule`'s
  `valid_from_date` / `valid_until_date` (+ `*_local_time` and `time_period_ids`) constrain
  **when the discount is *applied* / when the *purchase* happens** — i.e. a happy-hour window
  on the transaction. They do **not** constrain the **appointment/booking date** the customer
  is reserving. Square has no concept of our Acuity booking date. So "this coupon is only valid
  for sessions booked in July" is impossible natively.

This is the decisive gap: the booking-date restriction Drew wants lives only in our Acuity
booking state, which Square never sees.

- Time-based pricing rules: https://developer.squareup.com/docs/catalog-api/cookbook/auto-apply-discounts/timeframe-discounts
- `CatalogPricingRule` fields: https://developer.squareup.com/reference/square/objects/CatalogPricingRule

### 4) Non-stackable enforcement?

**No native "this coupon cannot combine with others" flag.** What Square offers:

- `CatalogPricingRule.exclude_strategy` and order `pricing_blocklists` / `blocked_discounts`
  let you exclude *specific products* from a rule — product-level blocking, not coupon-vs-coupon
  mutual exclusion.
- On an order, `applied_discounts` is a **list**, and Square will **stack** multiple discounts,
  applying them in a fixed sequence (item-% → order-% → order-fixed → item-fixed). Square does
  not prevent stacking; it just defines the math order.

Since we only ever attach **one** ad-hoc discount (the one our coupon layer resolved),
non-stackability is automatic and enforced by us: our code accepts at most one valid coupon
per checkout and rejects a second.

- Discount stacking / order: https://developer.squareup.com/docs/orders-api/discounts
- Auto-apply / blocklists: https://developer.squareup.com/docs/orders-api/apply-taxes-and-discounts/auto-apply-discounts

### 5) Expiry dates?

**Yes, natively — but only the kind we don't need.** `CatalogPricingRule.valid_until_date`
(RFC 3339 date) and `valid_until_local_time` give a hard cutoff on **when the rule applies at
purchase time**. That's a real expiry on the *transaction date*. It is the one coupon-ish
control Square does well. (Same caveat as #3: it's purchase-date expiry, not booking-date.)

In a server-side layer, expiry is a one-line timestamp check, so we get it either way.

- `CatalogPricingRule.valid_until_date`: https://developer.squareup.com/reference/square/objects/CatalogPricingRule

### 6) "Either % off OR a free add-on up to $70" dual-mode in one coupon?

**Not natively in a single Square object.** A `CatalogDiscount` / `OrderLineItemDiscount` is
exactly **one** `type`: `FIXED_PERCENTAGE`, `FIXED_AMOUNT`, `VARIABLE_PERCENTAGE`, or
`VARIABLE_AMOUNT`. There is no conditional/branching discount type and no "free product"
discount that auto-zeroes a chosen line item up to a cap. You'd have to model it as two
separate Square discounts and pick one — and Square has no logic to choose between them or to
enforce the "$70 cap on the free add-on."

This dual-mode is pure business logic that must live **server-side**:
- If customer chose **% off**: attach one ad-hoc `FIXED_PERCENTAGE` line-item/order discount.
- If customer chose **free add-on (≤ $70)**: attach one ad-hoc `FIXED_AMOUNT` discount equal
  to that add-on's price (capped at $70) against that add-on's line item.

Note the Orders API gotcha for the free-add-on path: a fixed-amount discount that exactly
equals an item's base price "might not fully apply" due to calculation order — Square
**recommends converting an item-fixed discount to an equivalent percentage** when it's close
to the item price. So to make an add-on truly free we either zero it via an equivalent
percentage on that single line item, or omit the add-on from the Square line items and just
note it on the Acuity appointment. Our code already itemizes add-ons, so this is a clean
branch.

- Discount type enum: https://developer.squareup.com/reference/square/objects/OrderLineItemDiscount
- "Making items free" caveat: https://developer.squareup.com/docs/orders-api/discounts

---

## What Square natively does vs. doesn't (summary table)

| Capability | Native Square? | Notes |
|---|---|---|
| Ad-hoc % or fixed discount on order/line item | **Yes** | `OrderLineItemDiscount`, no catalog object needed (must be `FIXED_PERCENTAGE`/`FIXED_AMOUNT`) |
| Customer-typed coupon code at checkout | **No** | No coupon API; hosted checkout has no code box |
| One-time-use / redemption-count tracking | **No** | No usage fields anywhere |
| Per-customer usage limit | **No** | Only `customer_group_ids_any` (group membership, not a cap) |
| Expiry on purchase/transaction date | **Yes** | `valid_until_date` / `valid_until_local_time` |
| Expiry / restriction on the **booking (appointment) date** | **No** | Square has no view of the Acuity booking date |
| Location scoping | Indirect | No location field on pricing rules; trivial in our server layer |
| Non-stackable enforcement | **No** | Discounts stack; only product-level exclusions exist |
| Dual-mode "% OR free add-on ≤ $70" in one coupon | **No** | One `type` per discount; no conditional/free-product discount |

---

## Recommendation: server-side coupon layer (with Square ad-hoc discounts as the apply step)

**Build the coupon system server-side in `api/create-checkout.js`.** Do **not** adopt Square's
catalog/loyalty coupon machinery — every feature Drew wants that Square supports natively
(expiry, location, one-use) is a few lines server-side, and the three features that matter
most (booking-date scope, real one-time-use, %-OR-free-add-on dual mode) are **impossible**
natively. A hybrid that leans on Square catalog rules would buy us nothing and add a second
source of truth.

Architecture fits what we already do: `create-checkout.js` is where we compute pricing
server-side and build itemized Square line items from HMAC-signed state. Add:

1. **Coupon store** — start with a small server-side definition (code → rules); upgrade to the
   ops dashboard's Postgres later if volume grows. Each coupon carries: `mode`
   (`percent` | `free_addon`), value (% or capped $), location scope (Powdersville / TM / both),
   purchase-expiry date, **booking-date window** (validated against the booking's Acuity date in
   our signed state), max total uses, per-customer limit, and `non_stackable: true`.
2. **Validation** (server-side, in the checkout request): code exists → not expired → location
   matches → booking date in window → under usage caps → not already used by this email/phone →
   only one coupon per checkout (non-stackable).
3. **Apply** as a single Square **ad-hoc `OrderLineItemDiscount`**:
   - `percent` mode → `FIXED_PERCENTAGE` on the order (or relevant line items).
   - `free_addon` mode → zero that add-on's line item via an equivalent percentage (avoids the
     fixed-amount-equals-price rounding caveat), capped at $70.
   The customer still sees an itemized, correct total on Square's hosted checkout — no
   client-trusted pricing, consistent with our existing server-authoritative model.
4. **Record redemption** after payment confirms (in the same place we create the Acuity
   appointment), keyed by code + customer, to enforce one-time/per-customer/total caps. Store
   the code in Acuity notes too for the paper trail.

**Why not native, restated:** booking-date restriction, true one-time-use, and dual-mode are
unbuildable on Square alone; the rest is trivial for us. One source of truth (our layer) beats
splitting logic between our code and Square's catalog.

### Implementation notes / cautions (for the future build, not this task)

- Keep pricing server-authoritative: validate and compute the discount in `create-checkout.js`;
  never trust a discount amount from the client. The coupon **code** may come from the client;
  the **resolved discount** must not.
- Booking date lives in our HMAC-signed checkout state (the Acuity slot), so booking-date
  scoping is enforceable only on the server — another reason the layer belongs there.
- For `free_addon`, prefer the equivalent-percentage zeroing to dodge Square's
  "fixed-amount discount close to item price might not fully apply" behavior.
- Redemption recording must be idempotent (same Vercel constraints as the rest of the
  callback path — no fire-and-forget; do it in the request that confirms payment).
- Persisting redemptions: a server-side map is fine to start; the `wws-dashboard` Postgres is
  the natural home once codes are issued at scale.

---

## What this unblocks

- **#13 (C1)** — coupon/discount codes feature: this research is the design basis; the layer
  above is the build path.
- **#14 (C2)** — promo / discount mechanics that depend on code generation + redemption rules:
  same server-side layer covers it.
- **#20 (revenue-recovery campaign)** — targeted, expiring, one-time-use offer codes (e.g.
  win-back a lapsed customer with "% off OR a free add-on, this location, book by <date>") are
  exactly the dual-mode + booking-date + one-time-use combination Square can't do natively and
  the server-side layer can.

## Sources

- [Checkout API — payment links / discounts behavior](https://developer.squareup.com/docs/orders-api/discounts)
- [Orders API — apply taxes and discounts / auto-apply](https://developer.squareup.com/docs/orders-api/apply-taxes-and-discounts/auto-apply-discounts)
- [Time-based (timeframe) discounts](https://developer.squareup.com/docs/catalog-api/cookbook/auto-apply-discounts/timeframe-discounts)
- [OrderLineItemDiscount object](https://developer.squareup.com/reference/square/objects/OrderLineItemDiscount)
- [CatalogPricingRule object](https://developer.squareup.com/reference/square/objects/CatalogPricingRule)
- [CatalogDiscount object](https://developer.squareup.com/reference/square/objects/CatalogDiscount)
- [Loyalty API overview](https://developer.squareup.com/docs/loyalty-api/overview)
- [Square forum — "V2 API Coupon Codes" (staff: no coupon API)](https://developer.squareup.com/forums/t/v2-api-coupon-codes/1059)
