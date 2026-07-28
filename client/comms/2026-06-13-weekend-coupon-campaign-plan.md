# Weekend Coupon Campaign — Implementation Plan

- **Date:** 2026-06-13
- **Maps to:** Issue **#20** (Revenue Recovery — last-minute weekend discount campaigns), with coupon mechanics from **#13 (C1)** / **#14 (C2)**, building on **#29** (Square coupon feasibility — *corrected below*).
- **Source spec:** `client/comms/2026-05-25-drew-email-revenue-recovery.md` (Drew's May 25 "Last-Minute Email Discounts" spec).
- **Trigger:** Drew (2026-06-13) asked to prioritize "emailing clients about the upcoming weekend with a potential coupon code."

---

## Corrected findings (supersedes the #29 doc)

The #29 agent concluded "Square has no coupon system → build server-side from scratch." The premise was **wrong**; the conclusion is **directionally right for a different reason**. Verified against Drew's live production Square account (read-only, 2026-06-13):

1. **Square DOES have coupons.** Drew's Flagship account has **16 active coupon codes** created via **Square Marketing** (e.g. `20OFF`, `25OFF`, `50OFF`, `WW10`, `WWS50`, `FERNANDO25`). Several are scoped to the **"Booking Sessions" category** and several carry **expiry dates** — so Square natively supports codes, category-scoping, and expiry.
2. **Our checkout is already wired for catalog-targeted discounts.** A prior session built a "Booking Sessions" catalog (`scripts/square-catalog-setup.js`) and our payment-link line items already attach the session's `catalogObjectId` (`api/_lib/acuity.js:399` — *"so Square coupons can target it"*, via the `SQUARE_CATALOG_SESSIONS` prod map).
3. **BUT the code is not API-redeemable into our flow.** Each Marketing coupon is a `PRICING_RULE` (`application_mode: ATTACHED`) + `DISCOUNT` + `PRODUCT_SET`. **The redeemable code exists only in the discount's `name` string — there is no structured `code` field, no public API to redeem a coupon by code against an order, and no API to read per-customer one-use state.** Square's native code-entry field lives on **Square Online** checkout, which we don't use (we use custom Payment Links).

**Therefore:** redemption + rule-enforcement must live on **our** side. We can optionally *reference* Drew's existing Square `DISCOUNT` objects when applying, so Square reporting reconciles — but the code→discount decision, date/studio scoping, and one-use enforcement are ours to own.

---

## Architecture decision

**We own a thin coupon layer.** Coupon definitions (code, %, studio, date-window, one-use) are the source of truth on our side; on redemption we apply the discount to the Payment Link order, scoped to the **raw session line item only** (add-ons/cleaning fees excluded — matches Drew's "raw studio time only" rule, and the session line item is already catalog-tagged).

Why we-manage rather than lean on Square Marketing: Drew's weekend spec needs **Watson-generated** codes that are **studio+date specific**, **one-use per customer**, and **expire Sunday noon** — none of which Square Marketing exposes for programmatic redemption in a custom checkout.

---

## Scope (phased)

### Phase 1 — Coupon redemption at checkout *(the foundation — unblocks every campaign)*
- **UI:** "Promo code" input in Step 5 (order summary) on `book-powdersville.html` / `book-taylors-mill.html` + `scripts/booking-flow.js`. Apply button → shows discounted total.
- **Server (`api/create-checkout.js` + new `api/_lib/coupons.js`):** validate the code, recompute the discount **server-side** (never trust client), apply it to the session line item on the payment-link order. Re-verify at checkout creation.
- **Definitions store:** start minimal — a small coupon list (config or lightweight KV/table) keyed by `code → {percentOff, studio, validFrom, validUntil}`.
- **Deliverable to Drew:** a working promo code at checkout. He can run *any* manual campaign immediately.

### Phase 2 — Campaign rules
- Studio + date scoping; expiry (incl. "Sunday noon"); **one-use-per-customer** (needs our own redemption tracking — store redeemed `code + customer email`).
- "Raw studio time only" (already handled — discount targets the session line item, not add-ons/fees).

### Phase 3 — Watson weekend automation (Watson-side, per Drew's spec)
- **Weekend availability analysis:** new `api/weekend-availability.js` — query Acuity Sat/Sun 7:30 AM–6:30 PM per studio; qualify if **<5 booked hours AND ≥4 open usable hours**. (Prototype was already scoped in the parallel-work plan.)
- **Code generation:** `FS-SAT-MAY30-25` pattern → writes into our coupon store.
- **Approval loop:** Tuesday 25% → Watson texts Drew a summary, waits for **YES / NO / EDIT**. Friday → 50% escalation if still qualifying, with analytics.
- **The send:** email (and optionally text) blast to the client list.

---

## Decisions needed

1. **Email send channel.** Drew said "emailing clients." Options: **(a)** Drew sends via **Square Marketing** (his existing tool, familiar, handles the list) while our checkout honors the code; **(b)** we send programmatically via **Resend** (already wired for booking emails); **(c)** Watson sends per the full spec. Recommendation: Square Marketing for the *send* to start (no list-management build), our layer for the *redemption*.
2. **Customer list / exclusions.** Source of the email list (Square customer directory? Acuity?), and Drew's exclusions (unsubscribed / "problem" customers from his spec).
3. **One-use-per-customer enforcement** — match on email at checkout?
4. **MVP vs. full automation** — ship Phase 1 (manual campaign with working code) first, or build through Watson automation?
5. **Text (SMS) leg** — note the campaign's *text* version hits the **same Twilio A2P** dependency as #7 (in review). **Email is unblocked today**; SMS follows A2P.

---

## Files touched (estimate)
- `scripts/booking-flow.js`, `book-powdersville.html`, `book-taylors-mill.html` — promo-code UI
- `api/create-checkout.js` — validate + apply discount on the order
- `api/_lib/coupons.js` *(new)* — definitions, validation, discount computation
- coupon + redemption store *(new — config/KV/table)*
- `api/weekend-availability.js` *(new, Phase 3)* — Acuity weekend analysis
- `client/docs/square-coupon-feasibility.md` — **correct the #29 conclusion**

## Decisions locked (Andrew, 2026-06-13)
- **Scope:** build **Phase 1 MVP first** — promo-code-at-checkout applying a % discount to the session line item, with a simple code list. Layer Phase 2 rules + Phase 3 Watson after.
- **Email send (Phase 3):** **we send via Resend** (already wired for booking emails). Needs the customer-list source + exclusion handling — pending Drew's answers below.

## Recommended first step
**Phase 1 MVP:** promo code at checkout applying a % discount to the session line item, with a simple code list. Ship + test on **staging** before merging (merge = prod deploy). Then Phase 2 rules, then Phase 3 (Watson analysis + Resend send).
