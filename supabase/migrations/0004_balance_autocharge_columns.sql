-- 0004 — balance auto-charge retry state on bookings (item 6).
--
-- AUTHORED, NOT APPLIED (see README). Additive columns only; no existing
-- behavior changes. These are written only by the dark balance-charge library
-- (api/_lib/balance-charge.js, called by /api/scheduler-run) which makes NO
-- Square charge unless DEPOSIT_AUTOCHARGE_ARMED === "1" AND SCHEDULER_ARMED ===
-- "1". Until then these stay at their defaults.
--
-- The 0001 bookings table already carries the balance itself
-- (balance_due_cents, balance_charge_at, balance_status in
-- 'none'|'scheduled'|'charged'|'failed'|'refunded'). This adds the retry
-- bookkeeping for the locked manager rule: auto-charge the 40% at first-session
-- start minus 48h, and on a declined/expired card retry x3 then LOCK OUT
-- (balance_status='failed' + balance_attempts>=3 — the customer then pays via
-- the profile; the appointment is never cancelled).

alter table public.bookings
  add column if not exists balance_attempts integer not null default 0;

alter table public.bookings
  add column if not exists balance_last_error text;

-- When the most recent auto-charge attempt fired — drives the retry backoff
-- (the scheduler re-enqueues the next attempt relative to this) and is shown in
-- the dashboard's item-6 visibility surface.
alter table public.bookings
  add column if not exists balance_last_attempt_at timestamptz;
