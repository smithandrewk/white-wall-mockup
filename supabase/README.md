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
- [ ] Google login: needs a Google Cloud OAuth client id+secret (Andrew). Email+password works without it.
- [ ] Wire `SUPABASE_URL` + anon key (client, via a public-config endpoint) and `service_role`
      (server functions only) into the booking-site Vercel env — done in the auth-code phase.
- [ ] App: post-payment account creation, login page, customer profile (account info,
      upcoming sessions, card on file).
- [ ] Nightly pg_dump backup to the mini (free-tier safety net).
