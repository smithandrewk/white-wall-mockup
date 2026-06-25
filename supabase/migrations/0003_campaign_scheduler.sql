-- 0003 — campaign + reminder enrollment, tokenized add-on email links, and the
-- idempotency ledger the unified scheduler (/api/scheduler-run) keys every
-- side-effecting dispatch on. Item 6 (60/40 deposit auto-charge + 4-touch add-on
-- campaign + payment reminders).
--
-- AUTHORED, NOT APPLIED. The live DB is the source of truth; this file
-- version-controls a change to be applied later, after review (see README).
--
-- No new scheduled_jobs.kind is introduced: the campaign touches, the 48h
-- balance auto-charge, and the every-6h payment reminders all enqueue rows into
-- the existing public.scheduled_jobs with the existing kinds
-- ('balance_charge' | 'campaign_touch' | 'payment_reminder' — see 0001). This
-- migration only adds the per-booking enrollment + the dedupe machinery around
-- those jobs. Everything here is dormant: it is read/written only by code paths
-- gated behind env flags that default OFF (CAMPAIGN_ENROLL_ENABLED,
-- CAMPAIGN_SEND_ENABLED, REMINDERS_ENABLED, DEPOSIT_AUTOCHARGE_ARMED,
-- SCHEDULER_ARMED). Creating these tables/columns changes no existing behavior.

-- pgcrypto (gen_random_bytes / gen_random_uuid) was enabled in 0001; harmless to
-- re-assert so this file is self-contained.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- bookings.access_token — a secure, unguessable per-booking token that the
-- tokenized add-on campaign emails carry (".../addon-menu?token=..."). It lets
-- an un-authenticated recipient act on exactly one booking from an email link;
-- the booking-site server validates the token with the service_role key and
-- never trusts anything else the link carries. 32 random bytes -> 64 hex chars.
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists access_token text not null default encode(gen_random_bytes(32), 'hex');
create unique index if not exists bookings_access_token_key on public.bookings (access_token);

-- ---------------------------------------------------------------------------
-- campaign_enrollments — one row per booking enrolled in the 4-touch add-on
-- campaign (item 6). The four touch fire-times live as scheduled_jobs rows
-- (kind='campaign_touch', payload carries enrollment_id + touch_no); this row
-- is the campaign-level state: how many landed, and the unsubscribe stop-flag.
-- Server-only (service_role) — no client RLS policies.
-- ---------------------------------------------------------------------------
create table if not exists public.campaign_enrollments (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references public.bookings(id) on delete cascade,
  campaign        text not null default 'addon_4touch',
  status          text not null default 'enrolled'
                    check (status in ('enrolled','completed','cancelled','unsubscribed')),
  touches_total   integer not null default 4,
  touches_sent    integer not null default 0,
  last_touch_no   integer,
  last_touch_at   timestamptz,
  enrolled_at     timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (booking_id, campaign)
);
create index if not exists campaign_enrollments_booking_idx
  on public.campaign_enrollments (booking_id);
create index if not exists campaign_enrollments_status_idx
  on public.campaign_enrollments (status);
create trigger campaign_enrollments_set_updated_at before update on public.campaign_enrollments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- scheduled_jobs.idempotency_key — a stable per-job dedupe key so re-enqueuing
-- the same logical touch/charge is a no-op (insert ... on conflict do nothing).
-- Same sha256-truncated key convention used for Square charge idempotency.
-- ---------------------------------------------------------------------------
alter table public.scheduled_jobs
  add column if not exists idempotency_key text;
create unique index if not exists scheduled_jobs_idempotency_key_key
  on public.scheduled_jobs (idempotency_key) where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- idempotency_keys — the ledger /api/scheduler-run consults BEFORE it makes any
-- Square charge or Resend send. Insert the key first (unique PK); a duplicate
-- insert means the side effect already happened (or is in-flight) and the
-- dispatcher must skip it. This is the single guard against a double-charge /
-- double-send when pg_cron fires overlapping ticks or a job is retried.
-- Keys follow the existing sha256-truncated pattern (api/_lib square idempotency).
-- Server-only (service_role) — no client RLS policies.
-- ---------------------------------------------------------------------------
create table if not exists public.idempotency_keys (
  key              text primary key,
  scope            text not null
                     check (scope in ('balance_charge','campaign_send','reminder_send','addon_charge')),
  booking_id       uuid references public.bookings(id) on delete cascade,
  scheduled_job_id uuid references public.scheduled_jobs(id) on delete set null,
  status           text not null default 'in_flight'
                     check (status in ('in_flight','succeeded','failed')),
  result           jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idempotency_keys_booking_idx on public.idempotency_keys (booking_id);
create trigger idempotency_keys_set_updated_at before update on public.idempotency_keys
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: the three new server-only surfaces mirror scheduled_jobs / payment_events
-- — RLS enabled, NO client policies, so only the service_role key (booking-site
-- server functions + the scheduler) can ever read or write them.
-- ---------------------------------------------------------------------------
alter table public.campaign_enrollments enable row level security;
alter table public.idempotency_keys     enable row level security;
