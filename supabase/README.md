# WWS booking platform — Supabase (V3 items 2/6/7)

Customer accounts, multi-day bookings, deposits/balances, and the saved-card
handle for the booking site. This is a **separate Supabase project** from the
Entrpy financial project — separate database and keys, same org for billing only.

## Project

- **Name / ref:** `wws-booking` / `phncotylbsmztfbfhwhi`
- **URL:** `https://phncotylbsmztfbfhwhi.supabase.co`
- **Org:** Entrpy, LLC (`zhnfbzeisysjcxdrxyye`) · **Region:** us-east-1 · **Plan:** Free
- **Credentials (NOT in git):** project URL + anon + service_role keys + DB password at
  `~/.config/wws/supabase-project.env` (chmod 600); management PAT at `~/.config/wws/supabase.env`.

Free-tier note: no automated backups until Pro. Interim safety = version-controlled
migrations here + a nightly `pg_dump` to the mini (to be set up). Upgrade to Pro before
this is charging real customers at volume.

## Schema (migration 0001)

- `customers` — one row per Supabase Auth user (auto-created by the `on_auth_user_created`
  trigger). Holds name/phone/instagram + `square_customer_id`. The queryable home for the
  saved-card handle that today lives only in Acuity notes text.
- `bookings` — the cart/order container (one checkout, N sessions). Carries pricing,
  deposit/balance accounting (item 6), the Square card handle, and consent proof.
- `booking_sessions` — each day/session in a booking; maps 1:1 to a stitched Acuity
  appointment. `day_index` drives the item-4 per-day add-on discount.
- `booking_session_addons` — per-session add-on selections (+ `meta` for backdrop colors,
  wall ids, setup-crew placements; `discount_cents` for item 4).
- `scheduled_jobs` — relative-time work queue pg_cron will scan (item 6): 48h balance
  auto-charge, the 4 add-on campaign touches, the every-6h payment reminders. Server-only.
- `payment_events` — audit log of Square money movements. Server-only.

**RLS:** on for every table. Browser (anon key + logged-in JWT) sees only the signed-in
customer's own rows. `scheduled_jobs` and `payment_events` have no client policies — the
booking-site server functions touch them with the `service_role` key (bypasses RLS).

## Schema (migrations 0003-0006, item 6 — AUTHORED, NOT YET APPLIED)

These four migrations are version-controlled but **have NOT been applied to the live
DB.** They are the dormant item-6 machinery (60/40 deposit auto-charge + 4-touch add-on
campaign + every-6h payment reminders); every code path that reads/writes them sits behind
an env flag that defaults OFF, so applying the schema changes no behavior on its own. Apply
them (and only then) as part of the reviewed item-6 ship, via the curl/Management-API recipe
below. They form one linear sequence after the foundation's 0001/0002:

- `0003_campaign_scheduler.sql` — `bookings.access_token` (secure per-booking token for the
  tokenized add-on email links); `campaign_enrollments` (per-booking 4-touch campaign state +
  unsubscribe); `scheduled_jobs.idempotency_key` + the `idempotency_keys` ledger the unified
  scheduler keys every Square charge / Resend send on (the double-fire guard). Reuses the
  existing `scheduled_jobs` kinds (`balance_charge` / `campaign_touch` / `payment_reminder`) —
  no new kind. New tables are server-only (RLS on, no client policies).
- `0004_balance_autocharge_columns.sql` — adds `balance_attempts`, `balance_last_error`,
  `balance_last_attempt_at` to `bookings` for the retry-x3-then-lock-out auto-charge rule.
- `0005_balance_reminder_state.sql` — `balance_reminder_state`, the per-booking touch-state
  for the every-6h payment-update reminders (stops when the balance is settled or the session
  starts). Server-only.
- `0006_pgcron_scheduler.sql` — **the dark arming step.** Contains NO executable SQL: the
  single pg_cron schedule that POSTs `/api/scheduler-run` lives entirely inside a commented
  `-- ARMING (do not apply) --` fence, so applying the file is a no-op. Arming the cron is a
  separate manual step taken only after the deposit-policy legal sign-off + a staging dry-run +
  flipping the booking-site env flags to `"1"`. There must be exactly ONE schedule — the
  dispatcher handles all three job kinds; there is no second `/api/charge-balance` cron.

## Applying migrations

The live DB is the source of truth; these files version-control it. Apply via the
Management API query endpoint (Cloudflare blocks non-curl user-agents — use curl):

```
python3 -c "import json; json.dump({'query': open('supabase/migrations/0001_wws_foundation.sql').read()}, open('/tmp/m.json','w'))"
curl -s -X POST "https://api.supabase.com/v1/projects/phncotylbsmztfbfhwhi/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" --data @/tmp/m.json
```

## Status

- [x] Project provisioned, schema + RLS + auth trigger applied and verified (2026-06-22).
- [x] Auth: email+password enabled; `site_url` + redirect allow-list set to the booking domains.
- [x] Env wired into Vercel (staging custom env + preview + production): `SUPABASE_URL`,
      `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Public-config endpoint serves URL + anon key.
- [x] App surface: `/login` (sign in + create account), `/account` (profile: account info,
      bookings/sessions, card-on-file slot), `scripts/account.js`, `api/account/{create,profile}`.
- [x] **Smoke-tested end to end on staging (2026-06-22):** create account -> sign in (JWT) ->
      profile returns enriched customer; RLS holds; test user cleaned up.
- [ ] Google login: needs a Google Cloud OAuth client id+secret (Andrew). Email+password works without it.
- [ ] In-flow post-payment account prompt (the "set a password" step) in booking-flow.js +
      a confirmation-page CTA — kept off the live payment path until reviewed.
- [ ] Bookings populate the profile once checkout writes to Supabase (the cart build, item 2).
- [ ] Card-on-file last4 (Square lookup); custom SMTP (Resend) for auth emails at volume.
- [ ] Prod merge of PR #65 (after review) + nightly pg_dump backup (free-tier safety net).
