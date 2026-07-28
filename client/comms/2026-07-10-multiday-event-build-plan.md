# Build plan — flagship multi-day event booking flow (Drew, 2026-07-10)

Source requests (verbatim logs):
`2026-07-10-drew-email-booking-type-first-and-multiday-events.md`,
`...-multiday-event-refinements-and-confirm.md`, `...-multiday-GO-and-deposit-terms.md`.
Drew gave GO (msg `19f4d89d0d2a7e53`). Full-steam, but **staging-verified before prod** (booking-logic +
payment path). Autonomous per Andrew's 2026-07-10 order (never ask Andrew; the 40% auto-charge keeps its
own staging-dry-run safety rail).

## Target flow (flagship / Powdersville booking page)

**Step 1 — "What are you booking?" (NEW first step, before duration/date):**
- **Photo / Video Session** — subtext: "If you will be booking a multi-day photo/video session, please select Event."
- **Event**

Photo/Video → today's flow unchanged (duration → schedule → details → waiver → pay).

**Step 1b — Event → "Single-day event?" vs "Multi-day event?"** (only when Event chosen):
- Single-day — subtext: "If your event will be started and completed on the same day for a set duration, select this option." → today's normal flow.
- Multi-day — subtext: "If your event is going to go overnight into the next day, select this option." → the day-by-day builder.

**Multi-day builder** (leans on the EXISTING multi-session cart `state.cart.sessions[]`):
- Menu-style: first ask start day + start time; then build the event day by day — each day its own duration (2/3/4/6/8h/full day) + start time.
- Each day = one cart session (existing `commitActiveSessionToCart`/`loadCartSessionIntoDraft`).
- Add-ons **per day** EXCEPT Setup Crew (once/booking). Per-day add-ons use the existing progressive discount.
- One combined checkout + 60/40 event deposit.

## Pricing (mostly EXISTS — `scripts/pricing-shared.js`, unit-tested `api/_lib/cart.js` + `cart.test.js`)
- Per-day add-on discount by chronological day index: **Day1 100% / Day2 85% / Day3+ 70%**.
- Eligible add-ons today: rolling-walls/chairs/tables/PA/TV. **CHANGE: add `backdrops`** (Drew: mirror
  chairs/tables). Add-on line id for backdrops is `"backdrops"` (config `id`), tagged in `buildPricingCart`.
- Setup Crew flat/once. Session price never discounted.
- `depositSplit(total)` = 60% deposit / 40% balance (exists).

## Deposit terms disclosure (Drew: publicize)
- At checkout, clearly state: **the 60% deposit is non-refundable**, and **the remaining 40% is automatically
  charged to the card on file** (48h before booking). Copy lives with the event/deposit UI.
- LEGAL/refund-policy delta → ships (Drew's money/policy call) but recorded as a soft "open for Andrew" so the
  legal text is visible. Existing draft: `2026-06-25-deposit-refund-policy-draft.md`.

## 40% auto-charge (item-6) — the guarded piece
- Machinery is built DARK (behind flags; `WWS_ITEM7_CHARGE_ARMED`/deposit auto-charge scheduler, per T018).
- Drew: "verify that internally within our system." → **staging dry-run** (sandbox Square + staging Acuity
  cal 14110701) proving the 40% auto-pull works, BEFORE it charges any real card. Only arm live after a clean
  dry-run. Never blind-arm. Non-blocking FYI to Andrew sent (live payment flow).

## Build order (staging-first; prod only after full staging pass)
1. **[DONE this turn]** Backdrops → discount-eligible in `pricing-shared.js` (+ verify `cart.test.js`).
2. Step-1 restructure: booking type first (move `eventIntent` selection to a new first step) + Photo/Video subtext.
3. Event → Single/Multi-day sub-choice (+ subtext). Single-day = existing path; Multi-day = builder.
4. Multi-day day-by-day builder UI on the cart; per-day add-ons; Setup Crew once.
5. Deposit disclosure copy (non-refundable + auto-charge) at review/checkout.
6. Verify per-day pricing (incl. backdrops) end-to-end on staging; verify the multi-day booking creates the
   right per-day Acuity appts (calendarID always passed — Lisa Brantly rule).
7. 40% auto-charge staging dry-run; arm live only after clean.
8. Prod ship via PR; confirm to Drew ("live" only after deploy + prod spot-check).

## Invariants
- READ-ONLY upstreams; every Acuity call with appointmentTypeID passes calendarID; no secrets; PAN scrub.
- Single-session + photo/video paths must stay byte-identical (empty cart === today).
