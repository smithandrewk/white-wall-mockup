# DREW-85 — Subtract same-day refunds from "Today's Money" (build plan)

Drew (msg 1a03a92026718d28, 2026-08-25): "Today's Money" on the Overview shows the sum of
today's collected cash but does NOT subtract refunds we issued today (e.g. a same-day
cancellation). Build the automation so today's figure reflects refunds. He left the source to
us; **Square refunds is the efficient, authoritative path** (already-plumbed, read-only).

## Root cause (confirmed in code + DB)
- `ingest/poll.ts:pollSquare()` stores `payment.refunded` (aggregate) and computes
  `net_amount = gross − fee − refunded`, dated by `p.created_at` (the ORIGINAL payment date).
- `lib/stats/glance.ts` "today" = `Σ net_amount where paid_at::ET = today` (weekRowsP query).
- So a refund of a payment collected on an EARLIER day lowers that earlier day's net, NOT
  today. Today's Money never sees a same-day refund of a prior booking. (226 payments already
  carry refunds totaling $37,961, so refunds ARE captured — just attributed to the wrong date.)
- Maegan Lamm case: canceled #2811 (paid $345 on Jul 21) shows `refunded 0.00` as of last
  sync — refund not yet issued/synced, so even a perfect build shows $0 today until it posts.

## The correct model (internally consistent, reconciles to YTD)
Treat each cash event on its own date:
  per-day cash = Σ(gross − fee for payments paid that day) − Σ(refund.amount for refunds dated that day)
- Same-day pay+refund: collection counts today, refund subtracts today → same net as now. ✓
- Prior-day pay, today refund: refund subtracts today; today's collections unaffected → today
  drops correctly. ✓
- Σ over all days = Σ(gross−fee) − Σ(all refunds) = Σ net_amount = **YTD unchanged**. ✓
So daily figures still sum to the YTD net Drew has seen — no reconciliation break.

## Build steps
1. **Migration `0026_payment_refund.sql`** — new table
   `payment_refund(id text pk, payment_id text, booking_id text null, amount numeric(10,2),
   status text, created_at timestamptz, ingested_at timestamptz default now())` + index on
   `(created_at)` and `(payment_id)`. Additive/if-not-exists.
2. **Ingest** — `pollSquare` (or a sibling `pollSquareRefunds`) pulls Square
   `GET /v2/refunds` (ListPaymentRefunds; read-only, watermarked by `sync_state` source
   `square-refunds`), upserts by refund id with the refund's OWN `created_at`. Only settled
   (`COMPLETED`) refunds count as cash out. Link `booking_id` via the parent payment's
   booking_id when known. NEVER call the create-refund endpoint (READ-ONLY invariant).
3. **Reader** — a `lib/stats/refunds-data.ts` helper: refunds-by-ET-date sums (today / week /
   month / range), scoped by location via payment→booking→location.
4. **Wire the daily/period net** — in `glance.ts` (today, weekToDate, monthToDate) and the
   Overview `dailyOps.netToday/Week/Month` (overview.ts): subtract refunds dated in the period.
   Decide: either switch the payment side to gross−fee + subtract refunds-by-date (fully
   consistent), OR the minimal adjustment (keep net_amount, subtract only refunds-by-date on
   payments paid BEFORE the period start, to avoid double-counting same-day refunds already in
   net_amount). The gross−fee model is cleaner and reconciles; prefer it but verify historical
   daily values don't shift the numbers Drew already trusts beyond the refund reattribution.
5. **Display** — show a "− $X refunded today" line under Today's Money (and Net to Our Bank
   sits below both cleaning/crew costs AND refunds). Honest zero when no refunds.
6. **Live** — apply `0026` to live `wws`, run the poll once to backfill refunds, verify the
   today figure reconciles by hand against Square for a known refund day.

## Verify
- Unit tests for the refunds-by-date aggregation + the per-day cash model (same-day vs
  cross-day refund cases).
- `npm run build`; live-DB spot check that YTD net is UNCHANGED after the rewrite and that a
  day with a known cross-day refund now shows it.

## Note to Drew when shipped
Refunds now land on the day they happen. For Maegan specifically, it will only show once the
$345 refund actually posts in Square (as of build time it had not).
