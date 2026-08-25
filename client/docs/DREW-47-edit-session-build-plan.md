# DREW-47 — "Edit Session" button build plan (card-charge slice, fully specced)

Drew's full spec (verbatim in `client/comms/2026-08-25-drew-reschedule-in-calendar-and-edit-session-spec.md`,
msg `1a03b4cb4b1f7948`). This is the DEFERRED card-charge slice of DREW-47, now specced end
to end. Andrew blanket-approved the money architecture + delivered the risk/liability
disclosure to Drew IN WRITING (Round 114) — **no new escalation**. The remaining gate is
OUR-side: a Square-sandbox charge + refund proof before arming, then the build.

## What Drew wants (the "Edit Session" button)
1. A button **named "Edit Session"** in **both** `/bookings/[id]` AND the Calendar day-detail
   panel (same two surfaces the Reschedule button now lives in — DREW-87).
2. It performs the "intense" money-moving edits:
   - **Shorten** the session (drop a time tier / duration) → **refund** the difference,
     with a **suggested refund amount**.
   - **Extend** the session (raise a time tier / duration) → **charge extra**, with a
     **suggested charge amount**.
   - **Add / remove add-ons** in either direction → charge or refund each add-on's retail price.
   - The charge/refund hits the **card tied to that booking** (card-on-file handle from the
     booking notes; PAN-scrubbed — we only hold Square's card id/last-4).
3. **Confirm-before-commit:** a dialog that summarizes EVERY change, the suggested
   refund/charge amount, and the **reason**, before anything is charged or changed.
4. **Persist** all progress + transaction data in that booking's detail record (an
   append-only edit/transaction log on the booking).
5. **Suggested prices come from retail site pricing** (time tiers + add-on prices), computed
   as diffs. "6h → full day" = the known price discrepancy; add-ons either direction likewise.

## Pieces already in the repo (reuse, do not rebuild)
- **Reschedule** (time-move only) — `components/reschedule-session-button.tsx` +
  `POST /api/calendar/edit-session {action:"reschedule"}` + `lib/acuity-edit.ts`
  (`ACUITY_EDIT_ARMED=1`, LIVE). The Edit Session button is the SUPERSET: reschedule is the
  time-move leg without the money.
- **Retail pricing engine** — `lib/session-builder/pricing-shared.generated.ts` +
  `pricing.ts` + `flow-pricing.ts` + `catalog.generated.ts` (mirror of the booking-site
  retail pricing; kept in sync via `npm run sync-booking-pricing`, memory
  `[[session-builder-generated-pricing]]`). This is Drew's "retail pricing on the site" — the
  price-diff calculator reads tiers + add-on unit prices from here. DO NOT hardcode prices.
- **Square charge** — `lib/square-charge.ts` exists ONLY on the STALE branch
  `worker/drew-47-phase2-edit-charge` (PR #143, commit `22bfb06`). ⚠️ **Do NOT merge #143** —
  it was built on an old main and reverts recent work. **Re-apply `lib/square-charge.ts` fresh
  on current main** (cherry-pick the file, not the branch), then prove it.

## Build steps (proposed)
1. **Price-diff engine** — `lib/edit-session/price-diff.ts` (pure, unit-tested; inject the
   pricing tables). Input: current session (duration tier + add-ons, from the booking) →
   proposed session (new tier + add-ons). Output: line-itemized diff (each change, +/- retail
   $), net delta, and whether it's a net charge or net refund. Grounds every "suggested amount"
   Drew sees. NO I/O.
2. **Transaction log** — migration `00NN_booking_edit_log.sql`: `booking_edit_log`
   (booking_id, created_at, actor, kind [charge|refund|addon|duration|reschedule], summary
   JSON, square_txn_id, amount_cents, reason). Rendered on `/bookings/[id]` under the detail
   (Drew: "save ALL that progress and transaction data in the booking details").
3. **Square charge/refund** — re-apply `lib/square-charge.ts` on current main; add the refund
   path (`/v2/refunds`, we already read refunds for DREW-85). Both arm-gated
   (`SQUARE_CHARGE_ARMED`, default OFF), per-charge sanity cap, card handle from notes, every
   move a deliberate human click. Acuity duration change = `lib/acuity-edit.ts` extended for
   `action:"resize"` (change appointment type / duration; ALWAYS pass calendarID).
4. **Route** — extend `POST /api/calendar/edit-session` with `action:"edit"` carrying the full
   proposed change; server recomputes the price diff (never trust the client amount), executes
   Acuity change + Square charge/refund atomically-as-possible, writes `booking_edit_log`.
   Honest 403 when disarmed.
5. **UI** — `components/edit-session-button.tsx` (Edit Session): pick new duration + add-ons →
   live price-diff summary → confirm dialog (every change + suggested $ + reason field) →
   submit. Mounted on BOTH `/bookings/[id]` and the Calendar day-detail (same gating as
   Reschedule). Reschedule stays as the light time-only action; Edit Session is the money one.
6. **VERIFY (the go-live gate):** a Square-**sandbox** charge AND refund proof against a
   throwaway card (dashboard prod Square token is LIVE, so the first real charge must not be
   the test). Then merge + arm `SQUARE_CHARGE_ARMED`. Unit tests for the price-diff engine +
   injected-fetch wire proof (no real money in tests).

## Money/liability (settled — do not re-escalate)
Andrew's Round 114 blanket go covers charge + refund on the card on file; the risk/liability
disclosure was delivered to Drew in writing (msg `1a0306b324b3e8ce`): White Wall owns the
customer's card authorization + chargeback/dispute/refund risk; every charge is a deliberate
human click. Refunds ride the same approval. The ONLY remaining gate is the sandbox proof.
