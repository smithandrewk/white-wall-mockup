# Item 2 — Multi-session cart: implementation plan

Concrete build plan for the heaviest V3 piece, written so the rewrite of the
2,400-line `scripts/booking-flow.js` state machine is a clean execution rather
than an improvised one. Source: Drew's V3 answers (2026-06-22, logged in this
folder) + the T018 impl sketch. **Persistence + pricing engine already exist**
(see PR #65), so this is mostly the UI/state refactor + the N-appointment loop.

## What's already in place (don't rebuild)
- `scripts/pricing-shared.js` — day-discount + cart totals + deposit split, tested.
- Supabase tables `bookings` / `booking_sessions` / `booking_session_addons`.
- `create-checkout.js` already writes ONE bookings + ONE booking_sessions row
  after a successful single booking (best-effort). The cart extends this to N.
- `/account` profile already renders `booking_sessions` per booking.

## Drew's locked rules (don't re-litigate)
- Session prices are the existing FLAT per-duration prices, charged per day.
  The 5am/10:30pm "billing floors" are duration-SELECTION rules (pick a duration
  long enough to cover the reserved window), NOT a per-hour formula.
- One cart = ONE Square payment. Sessions are stitched as N daily Acuity appts.
- Per-day add-on discount via `pricing-shared` (Day1 100/Day2 85/Day3+ 70), only
  the five listed add-ons; Setup Crew + future never discounted.
- Cross-location-in-one-cart is LATER (v1 = single location per cart is fine).
- Add-ons appear EARLY in the flow (right after photo/event choice).

## Phase 1 — cart state model (additive, no checkout change yet)
- Refactor `state` so a booking is `state.cart = { sessions: [], universal: {} }`,
  each session = `{ location, durationId, selectedDate, selectedTime, addons:{},
  perSessionIntake:{attendees, useCase} }`, and `universal` = name/email/phone/IG/
  waiver/terms collected ONCE.
- Introduce `state.cart.activeIndex` and an `activeSession()` accessor. Re-point
  the existing per-step render fns (renderDurations, renderScheduleStep,
  renderAddons, renderOrderSummary, the validators) to read `activeSession()`
  instead of top-level `state.*`. This is the bulk of the work — do it as a
  mechanical, test-after-each-fn re-point, keeping the single-session path working
  the whole time (cart with exactly one session === today's behavior).
- Keep a back-compat shim so the live single-session flow is byte-identical until
  the multi-session UI is switched on.

## Phase 2 — the loop + cart summary UI
- After a session's add-ons step, add a branch: "Add another session" vs "Review
  cart". (Today setStep only goes 1..5 linearly — this is the missing branch.)
- Cart-summary view: list each session (date/time/location/duration + its add-ons)
  with per-session + cart totals, using `pricing-shared.computeCartTotals`.
- Move the add-ons step EARLY (right after photo/event intent) per Drew.
- "Review each piece of the cart and confirm, then book" (Drew's words).

## Phase 3 — N-session checkout
- Extend `create-checkout.js` to accept `{ sessions:[...], universal:{...}, consent }`.
  Server RE-COMPUTES every session price + cart total + (item-4) discounts via
  `pricing-shared` — never trust the client total.
- ONE `createPayment` for the cart total; ONE `createCardOnFile`.
- LOOP Acuity `POST /appointments` — one per session — each passing
  `calendarID` from `stagingCalID || CALENDAR_IDS[location]` (the misroute gotcha
  is non-negotiable; see the Lisa Brantly incident).
- Write ONE `bookings` row + N `booking_sessions` rows + per-session
  `booking_session_addons` rows to Supabase (extends the persistence already in
  place). Stamp `day_index` by chronological session order.
- Partial-failure path: if appt k of N fails after the charge, define behavior
  (refund whole cart vs keep succeeded + alert). Mirror the existing single-charge
  auto-refund; alert via alertFailure for partial multi-appt failure.

## Edge cases / tests
- Day-index assigned by chronological sort of sessions (deterministic regardless
  of add order). Unit-test client vs server totals are byte-identical for a 3-day
  mixed cart (the parity invariant — pricing-shared already tested standalone).
- A 1-session cart must equal today's single-session totals + flow exactly.
- Staging: build a 2-day cart, confirm ONE Square charge, TWO Acuity appts on the
  STAGING calendar (14110701), and both sessions appear under one booking in the
  profile.

## Sequencing
Phase 1 is the risk (re-pointing the state machine). Do it incrementally on PR #65,
staging-testing the single-session path after each step so the live flow never
breaks. Phases 2–3 are additive on top. Do NOT merge to prod until a full 2-day
staging cart books cleanly and the single-session path is re-verified.
