-- WWS booking platform — foundation schema (V3 items 2/6/7)
-- Project: wws-booking (ref phncotylbsmztfbfhwhi), Entrpy org, free tier.
-- Designed once for the whole 2/6/7 build (accounts, multi-day cart, deposits,
-- profile). Money lives in cents (int). All times timestamptz (UTC); display
-- is America/New_York at the app layer. RLS on everywhere; the booking-site
-- server functions use the service_role key (bypasses RLS) for writes, the
-- browser uses the anon key (gated by the policies below).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- customers — one row per Supabase Auth user. The queryable home for the
-- saved-card handle that today lives only in Acuity notes text.
-- ---------------------------------------------------------------------------
create table public.customers (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text not null,
  full_name          text,
  phone              text,
  instagram          text,
  square_customer_id text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index customers_email_key on public.customers (lower(email));
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- Auto-create a minimal customers row when an auth user is created. The server
-- later enriches it (name/phone/square_customer_id) at account creation.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.customers (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- bookings — the cart/order container. One checkout = one booking, which may
-- hold N sessions/days (item 2). Carries the deposit/balance accounting (item
-- 6) and the saved-card handle (items 6/7).
-- ---------------------------------------------------------------------------
create table public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references public.customers(id) on delete cascade,
  status              text not null default 'pending'
                        check (status in ('pending','confirmed','cancelled','failed')),
  event_intent        text not null default 'no' check (event_intent in ('yes','no')),
  -- pricing (server-authoritative, cents)
  subtotal_cents      integer not null default 0,
  total_cents         integer not null default 0,
  -- deposit / balance (item 6); null balance fields = paid-in-full booking
  payment_mode        text not null default 'full' check (payment_mode in ('full','deposit')),
  deposit_cents       integer,
  balance_due_cents   integer,
  balance_charge_at   timestamptz,
  balance_status      text not null default 'none'
                        check (balance_status in ('none','scheduled','charged','failed','refunded')),
  -- card handle + payment refs (Square)
  square_customer_id  text,
  square_card_id      text,
  square_payment_id   text,
  -- consent proof (mirrors the existing create-checkout consent block)
  consent_proof       jsonb,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index bookings_customer_id_idx on public.bookings (customer_id);
create index bookings_status_idx on public.bookings (status);
create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- booking_sessions — each day/session inside a booking. One row maps to one
-- stitched Acuity appointment (item 2: one cart -> N appointments). day_index
-- drives the per-day add-on discount (item 4).
-- ---------------------------------------------------------------------------
create table public.booking_sessions (
  id                    uuid primary key default gen_random_uuid(),
  booking_id            uuid not null references public.bookings(id) on delete cascade,
  acuity_appointment_id text,
  location              text not null check (location in ('powdersville','taylors-mill')),
  appointment_type_id   text not null,
  starts_at             timestamptz not null,
  duration_min          integer not null,
  day_index             integer not null default 0,
  session_price_cents   integer not null,
  created_at            timestamptz not null default now()
);
create index booking_sessions_booking_id_idx on public.booking_sessions (booking_id);
create index booking_sessions_starts_at_idx on public.booking_sessions (starts_at);

-- ---------------------------------------------------------------------------
-- booking_session_addons — per-session add-on selections. meta holds the
-- shape-specific extras (backdrop colors, wall ids, setup-crew placements).
-- ---------------------------------------------------------------------------
create table public.booking_session_addons (
  id                 uuid primary key default gen_random_uuid(),
  booking_session_id uuid not null references public.booking_sessions(id) on delete cascade,
  addon_id           text not null,
  quantity           integer not null default 1,
  unit_cents         integer not null,
  discount_cents     integer not null default 0,  -- item 4 per-day discount applied
  meta               jsonb,
  created_at         timestamptz not null default now()
);
create index booking_session_addons_session_idx on public.booking_session_addons (booking_session_id);

-- ---------------------------------------------------------------------------
-- scheduled_jobs — the relative-time work queue pg_cron scans (item 6):
-- the 48h balance auto-charge, the 4 add-on campaign touches, and the
-- every-6h payment-update reminders. Server-only (no client access).
-- ---------------------------------------------------------------------------
create table public.scheduled_jobs (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  kind        text not null
                check (kind in ('balance_charge','campaign_touch','payment_reminder')),
  fire_at     timestamptz not null,
  status      text not null default 'pending'
                check (status in ('pending','done','failed','skipped','cancelled')),
  attempts    integer not null default 0,
  last_error  text,
  payload     jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index scheduled_jobs_due_idx on public.scheduled_jobs (fire_at) where status = 'pending';
create trigger scheduled_jobs_set_updated_at before update on public.scheduled_jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- payment_events — audit log of every Square money movement on a booking
-- (deposit, balance, add-on, refund). Server-only.
-- ---------------------------------------------------------------------------
create table public.payment_events (
  id               uuid primary key default gen_random_uuid(),
  booking_id       uuid not null references public.bookings(id) on delete cascade,
  kind             text not null check (kind in ('deposit','balance','addon','refund','full')),
  amount_cents     integer not null,
  square_payment_id text,
  status           text not null check (status in ('succeeded','failed')),
  detail           jsonb,
  created_at       timestamptz not null default now()
);
create index payment_events_booking_idx on public.payment_events (booking_id);

-- ---------------------------------------------------------------------------
-- Row Level Security. Browser (anon key + a logged-in JWT) can only ever see
-- the signed-in customer's own data. Server functions use service_role, which
-- bypasses RLS, for all inserts/writes and the scheduler.
-- ---------------------------------------------------------------------------
alter table public.customers              enable row level security;
alter table public.bookings               enable row level security;
alter table public.booking_sessions       enable row level security;
alter table public.booking_session_addons enable row level security;
alter table public.scheduled_jobs         enable row level security;
alter table public.payment_events         enable row level security;

-- customers: read + update your own row
create policy customers_select_own on public.customers
  for select using (auth.uid() = id);
create policy customers_update_own on public.customers
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- bookings: read your own
create policy bookings_select_own on public.bookings
  for select using (auth.uid() = customer_id);

-- booking_sessions: read sessions belonging to your bookings
create policy booking_sessions_select_own on public.booking_sessions
  for select using (exists (
    select 1 from public.bookings b
    where b.id = booking_sessions.booking_id and b.customer_id = auth.uid()
  ));

-- booking_session_addons: read add-ons under your sessions
create policy booking_session_addons_select_own on public.booking_session_addons
  for select using (exists (
    select 1 from public.booking_sessions s
    join public.bookings b on b.id = s.booking_id
    where s.id = booking_session_addons.booking_session_id and b.customer_id = auth.uid()
  ));

-- scheduled_jobs and payment_events: NO client policies (server/service_role only).
