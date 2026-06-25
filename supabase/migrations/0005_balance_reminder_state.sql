-- 0005 — payment-update reminder touch-state, one row per booking (item 6,
-- Drew round-2: "payment-update reminder every 6h leading to start").
--
-- AUTHORED, NOT APPLIED (see README). Additive table only; no existing behavior
-- changes. Written/read only by the dark reminder path in /api/scheduler-run,
-- which sends NOTHING unless REMINDERS_ENABLED === "1" AND SCHEDULER_ARMED ===
-- "1". Until then this table just stays empty / inert.
--
-- The individual reminder fire-times are scheduled_jobs rows
-- (kind='payment_reminder' — existing kind from 0001); this row is the
-- per-booking rollup the scheduler uses to decide whether the next 6h reminder
-- is still warranted and to stop the cadence the moment the balance is settled.
-- The reminder cadence exists to chase an UNCOLLECTED balance after the auto-
-- charge could not complete, so it stops as soon as the balance is no longer
-- owed (paid in profile, finally charged) or the session has started.

create table if not exists public.balance_reminder_state (
  booking_id       uuid primary key references public.bookings(id) on delete cascade,
  enrolled         boolean not null default false,
  reminders_sent   integer not null default 0,
  last_reminder_at timestamptz,
  next_reminder_at timestamptz,
  stopped_at       timestamptz,
  stop_reason      text
                     check (stop_reason in ('balance_paid','charged','start_passed','unsubscribed')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
-- The scheduler scans for the next due reminder across all enrolled bookings.
create index if not exists balance_reminder_state_next_idx
  on public.balance_reminder_state (next_reminder_at)
  where enrolled = true and stopped_at is null;
create trigger balance_reminder_state_set_updated_at before update on public.balance_reminder_state
  for each row execute function public.set_updated_at();

-- Server-only (service_role), mirroring scheduled_jobs / payment_events.
alter table public.balance_reminder_state enable row level security;
