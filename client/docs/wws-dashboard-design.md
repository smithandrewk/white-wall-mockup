# White Wall Studios — Internal Ops Dashboard

**Design Document + Build Plan**
Target: `wws.entrpy.co` — self-hosted on the pip Mac mini, cloned from `pip-dashboard`.
Date: 2026-06-11 · Status: proposed, ready to build.

---

## 1. Summary

We are building an internal, single-user ops dashboard for White Wall Studios that lets Drew (and Andrew) see the health of the business at a glance: **Bookings, Clients, Revenue, and Repeat visits**. It is a **read-only viewer** over the booking system's source-of-truth data (Acuity for bookings, Square for money, with QBO as a reconciliation layer) — it never writes back to Acuity/Square/QBO and therefore cannot corrupt a live booking. It is cloned from the `pip-dashboard` template (Next.js 16 + local Postgres + Cloudflare Tunnel + Access), runs under launchd on the same mini, and is gated entirely at Cloudflare's edge (no in-app auth). History comes from a one-time backfill of `acuity-full-backup.csv`; ongoing freshness comes from a launchd-timed incremental poller. The look is Linear-inspired (dense, hairline borders, one accent, keyboard-first) built on the newest shadcn components on top of pip-dashboard's existing token system.

---

## 2. Stack & repo layout

### Exact stack (pin to pip-dashboard's versions for consistency)

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | `16.2.3` |
| React | React + ReactDOM | `19.2.4` |
| Language | TypeScript (strict) | `^5` |
| DB driver | `pg` (node-postgres), **no ORM** | `^8.21.0` (+ `@types/pg`) |
| Charts | Recharts (via shadcn `chart` wrapper) | `^2.15.0` |
| Icons | lucide-react | `^0.469.0` |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) + `tw-animate-css` | `^4` |
| Dates | date-fns | `^4.1.0` |
| Class utils | clsx, tailwind-merge, class-variance-authority | — |
| CSV parse (backfill) | `csv-parse` (Node, dev/ingest only) | `^5` |
| Runtime (mini) | node | `v26` |

**Deliberately absent** (matching pip): no Prisma/Drizzle, no React Query/SWR, no NextAuth/Clerk, no Supabase client. Reads happen in async Server Components via raw SQL; writes (dashboard-owned state only) in Route Handlers; auth is at the edge.

**One deviation from pip:** pip-dashboard hand-rolled its components without installing shadcn. For WWS we **do** run `shadcn init` (Tailwind v4, Rhea style) and pull real shadcn components (`sidebar`, `data-table`, `chart`, `card`, `badge`, `command`, etc.), because the owner explicitly asked for "newest shadcn components + Linear feel." We keep pip's `cn()`/`usd()`, the `lib/db.ts` pattern, the registry idea, and the launchd/Cloudflare ops verbatim — but let shadcn own the component primitives.

### New repo location

```
/Users/pip/code/wws-dashboard
```

Separate git repo (not a worktree of the booking site). The booking site (`/Users/pip/code/white-wall-mockup`) stays untouched — the dashboard only *reads* its exported data and the same upstream APIs.

### Folder structure

```
/Users/pip/code/wws-dashboard
├── app/
│   ├── layout.tsx                 # shell: shadcn Sidebar + CommandPalette + header date-range
│   ├── globals.css                # Tailwind v4 @theme; WWS tokens + --chart-1..5 + type accents
│   ├── page.tsx                   # "/" Overview (KPIs + revenue chart + recent + upcoming)
│   ├── bookings/page.tsx          # Bookings data-table lens
│   ├── clients/page.tsx           # Clients list/leaderboard
│   ├── clients/[id]/page.tsx      # one client: profile + booking history
│   ├── revenue/page.tsx           # Revenue charts + reconciliation
│   ├── repeat/page.tsx            # Repeat-visit cohort/retention
│   └── api/
│       ├── snapshot/route.ts      # whole-state JSON (debug / future LLM)
│       └── health/route.ts        # freshness + upstream-status probe (anvil pattern)
├── components/
│   ├── ui/                        # shadcn primitives (added via CLI)
│   ├── app-sidebar.tsx            # from sidebar block, nav swapped to WWS lenses
│   ├── kpi-card.tsx               # stat tile (label + tabular-nums value + delta badge)
│   ├── bookings-table.tsx         # data-table client component
│   ├── clients-table.tsx
│   ├── revenue-charts.tsx         # area-interactive + bar (by location / add-on)
│   ├── cohort-grid.tsx            # retention heatmap
│   └── freshness-banner.tsx       # "data as of HH:MM · Acuity OK · Square sandbox"
├── lib/
│   ├── db.ts                      # pg pool on globalThis + q() + dbEnabled()  [copy from pip]
│   ├── utils.ts                   # cn(), usd()  [copy from pip]
│   ├── types.ts                   # hand-typed schema contract
│   ├── nav.ts                     # sidebar lens registry
│   ├── metrics/                   # PURE compute (range buckets, cohorts, attach rate) — unit tested
│   │   ├── range.ts               # range presets + auto-granularity + zero-filled buckets
│   │   ├── revenue.ts
│   │   ├── repeat.ts
│   │   └── *.test.ts
│   └── data/                      # IO loaders (dbEnabled() ? SQL : seed)
│       ├── bookings.ts
│       ├── clients.ts
│       ├── revenue.ts
│       └── seed.ts                # hand-written seed so UI renders with no DB
├── ingest/
│   ├── backfill-csv.ts            # one-time history load from acuity-full-backup.csv
│   ├── poll-acuity.ts            # incremental appointment pull per calendar
│   ├── poll-square.ts            # incremental order/payment/refund pull
│   ├── resolve-clients.ts        # email-normalized identity layer
│   └── _claim.ts                 # atomic claim-guard helper
├── supabase/migrations/          # 0001_schema.sql, 0002_ingest_state.sql  (psql -f at deploy)
├── deploy/
│   ├── run-wws.sh
│   ├── run-poll.sh
│   ├── co.entrpy.wws-dashboard.plist
│   ├── co.entrpy.wws-cloudflared.plist
│   └── co.entrpy.wws-poll.plist
├── bin/_resolve-hook.mjs         # plain-node @/ alias shim (copy from pip)
├── bin/_empty.mjs                # copy from pip
├── next.config.ts                # empty {}
├── tsconfig.json                 # strict, @/* alias, allowImportingTsExtensions
├── postcss.config.mjs            # @tailwindcss/postcss
├── components.json               # shadcn config (Rhea style)
└── package.json                  # start -p 18794
```

### Copy from pip-dashboard vs build new

| Copy verbatim / lightly adapt | Build new for WWS |
|---|---|
| `lib/db.ts` (pool, custom type parsers, `q()`, `dbEnabled()`) | All migrations (WWS relational schema) |
| `lib/utils.ts` (`cn`, `usd`) | All `ingest/*` (CSV backfill + pollers) |
| `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` | All `lib/metrics/*` + `lib/data/*` |
| `bin/_resolve-hook.mjs`, `bin/_empty.mjs` | All page lenses + WWS components |
| Seed-vs-live dual-mode loader convention | shadcn UI layer (init fresh, Rhea style) |
| All `deploy/*` ops (plists, run-scripts, claim guard) | `freshness-banner` + `/api/health` (anvil pattern) |
| The dual pure-compute / IO split convention | — |

---

## 3. Data model

### Decision: purpose-built relational schema — **not** pip's generic object/link/event graph.

**Rationale.** pip's generic `object`+`link`+`event` graph is the right call for pip because pip ingests ~60 heterogeneous, evolving entity types (people, projects, notes, goals, recordings…) where adding a type must cost zero migration. WWS is the opposite: a **small, fixed, well-understood relational domain** — bookings, clients, payments, locations — with strong foreign keys and heavy aggregation (revenue by location × month, cohort retention, attach rate). Those queries are far cleaner, faster, and easier to index on real columns than on a `properties jsonb` bag inside a UNION view. We know the schema; there is no churn to absorb. A relational schema also makes the email-normalized client-resolution join a first-class FK instead of a `link` row.

We **do** keep two ideas from pip: (1) a thin **`ingest_event` / sync-state** spine for idempotent, observable ingestion, and (2) a `properties jsonb` escape hatch on the wide tables for fields we don't want to model yet (parsed notes flags, intake extras).

### CREATE TABLE migrations sketch

`supabase/migrations/0001_schema.sql`:

```sql
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- client name search (Cmd-K)

-- ── locations (the venue dimension) ────────────────────────────────
create table location (
  id            text primary key,          -- acuity calendarID as text: '6255578'
  name          text not null,             -- 'Powdersville' | "Taylor's Mill"
  slug          text not null unique,      -- 'powdersville' | 'taylors-mill'
  is_staging    boolean not null default false
);
-- seed: 6255578 Powdersville, 6252295 Taylor's Mill, 14110701 STAGING(is_staging=true)

-- ── clients (one person, keyed by normalized email) ────────────────
create table client (
  id            uuid primary key default gen_random_uuid(),
  email_norm    text unique,               -- lower(trim(email)); nullable when absent
  display_name  text not null,
  first_name    text,
  last_name     text,
  phone         text,
  business_name text,                       -- intake field 10764621
  instagram     text,                       -- intake field 10764624
  first_seen    timestamptz,               -- min(booking.starts_at)
  last_seen     timestamptz,               -- max(booking.starts_at)
  properties    jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index client_name_trgm on client using gin (display_name gin_trgm_ops);

-- ── bookings (one appointment — the spine) ─────────────────────────
create table booking (
  id                  text primary key,     -- acuity appointment id (text)
  client_id           uuid references client(id),
  location_id         text not null references location(id),
  appointment_type_id text,
  type_label          text,                 -- acuity 'type' text (legacy-safe)
  duration_min        integer,
  starts_at           timestamptz not null,
  ends_at             timestamptz,
  list_price          numeric(10,2),        -- acuity price/priceSold (list value)
  paid_flag           boolean,              -- acuity paid==yes (UNRELIABLE — see revenue)
  canceled            boolean not null default false,
  participants        integer,              -- intake 10764623 / notes
  is_event            boolean not null default false,
  source              text,                 -- 'custom-flow' | 'legacy' | 'csv'
  notes               text,
  properties          jsonb not null default '{}',  -- parsed flags: capacity_alert, food, etc.
  created_at          timestamptz,          -- acuity MetaData create time when known
  ingested_at         timestamptz not null default now()
);
create index booking_starts_idx   on booking(starts_at);
create index booking_location_idx on booking(location_id, starts_at);
create index booking_client_idx   on booking(client_id, starts_at);

-- ── booking add-ons (attach-rate dimension) ────────────────────────
-- quantities encoded as N rows (mirrors Acuity duplicate-addonID convention)
create table booking_addon (
  id          uuid primary key default gen_random_uuid(),
  booking_id  text not null references booking(id) on delete cascade,
  addon_id    text,                          -- acuity addon id e.g. '6881547'
  name        text not null,                 -- 'Cleaning Fee', 'All Backdrops', ...
  unit_price  numeric(10,2),
  detail      text                           -- parsed from notes: colors, wall #s
);
create index booking_addon_booking_idx on booking_addon(booking_id);

-- ── payments (CASH TRUTH — Square is authoritative) ────────────────
create table payment (
  id            text primary key,           -- square order_id (or payment id)
  booking_id    text references booking(id),
  source        text not null,              -- 'square' | 'square-legacy' | 'csv-estimate'
  gross_amount  numeric(10,2) not null,     -- order total_money
  fee_amount    numeric(10,2),              -- 2.9% + $0.30 (or Square-reported)
  net_amount    numeric(10,2),              -- gross - fee - refunds
  refunded      numeric(10,2) not null default 0,
  state         text,                       -- COMPLETED | OPEN | CANCELED
  paid_at       timestamptz,
  line_items    jsonb not null default '[]',-- itemized: session + each add-on
  properties    jsonb not null default '{}',
  ingested_at   timestamptz not null default now()
);
create index payment_paid_idx    on payment(paid_at);
create index payment_booking_idx on payment(booking_id);
```

`supabase/migrations/0002_ingest_state.sql` — the idempotency + observability spine:

```sql
-- per-source incremental cursor (last successful sync watermark)
create table sync_state (
  source        text primary key,           -- 'acuity:6255578' | 'square' | 'csv'
  cursor        text,                        -- lastSyncTime / Square cursor
  last_run_at   timestamptz,
  last_ok_at    timestamptz,
  last_error    text,
  rows_seen     integer
);

-- append-only ingest log (freshness banner + audit; mirrors pip's event spine)
create table ingest_event (
  id          bigserial primary key,
  source      text not null,
  verb        text not null,                -- 'backfill' | 'poll' | 'upsert' | 'error'
  summary     text,
  data        jsonb,
  at          timestamptz not null default now()
);

-- claim guard for the poller (atomic, single-writer; mirrors pip's task claim)
create table ingest_lock (
  source      text primary key,
  status      text not null default 'idle', -- 'idle' | 'running'
  claimed_at  timestamptz
);
```

Idempotency is structural: `booking.id`/`payment.id` are the upstream IDs, so every ingest is `insert ... on conflict (id) do update`. Re-running a poll or the backfill converges to the same state.

---

## 4. Data ingestion

Three mechanisms, layered (the anvil "snapshot puller decouples dashboard from upstream" + pip "claim-guarded launchd worker" patterns combined). The dashboard always reads **local Postgres**, never a live upstream API on page load.

### 4.1 CSV backfill (one-time history) — `ingest/backfill-csv.ts`

Loads `acuity-full-backup.csv` (~2,600 rows, Nov 2021→present) into `booking`/`client`/`booking_addon` with **estimated** payments (`payment.source='csv-estimate'`, from `priceSold`).

Hard rules (from the data-source research):
- Parse with a **real CSV parser** (`csv-parse`) — `notes`/`forms_summary` carry embedded commas/newlines.
- **Scrub PII/PAN**: legacy `forms_summary` contains raw card numbers/CVV — strip before storing; never persist card data.
- **Exclude STAGING** (calendar `14110701`, `[STAGING]` names, staging notes) and the "Jane McTest" example row.
- `amountPaid` is unreliable (`0.00` even when `paid=yes`) → use `price`/`priceSold` as list value, mark payment as estimate, and let the Square poller overwrite real cash later by `booking_id`.
- Unknown/legacy `appointmentTypeID` → bucket by `calendar`/`type` text; store raw in `type_label`.
- Run once, manually, with a `--scrub-report` that prints how many PAN fields were stripped.

```bash
DATABASE_URL=postgresql://wws@localhost:5432/wws \
  node --experimental-strip-types ingest/backfill-csv.ts \
  --file /Users/pip/code/white-wall-mockup/client/acuity-full-backup.csv
```

### 4.2 Ongoing poller — `ingest/poll-acuity.ts` + `ingest/poll-square.ts`

A single launchd-timed process that incrementally pulls both upstreams since the last watermark and upserts. **Poll, not webhook, is the baseline** (webhooks carry only IDs and can miss edited/cancelled events; polling is idempotent and catches post-hoc edits). Webhooks are a Phase-3 add-on for a real-time ticker, with polling as the safety net.

- **Acuity:** `GET /appointments?minDate=<cursor>&calendarID=<id>` **per calendar** (always pass `calendarID` — the multi-calendar misroute gotcha / Lisa Brantly incident). Upsert into `booking` + `booking_addon`; resolve/attach `client` by normalized email.
- **Square:** `SearchOrders` / `ListPayments` since cursor; upsert `payment`, joining to `booking_id` and overwriting any `csv-estimate` row with real cash (gross/fee/net/refunds). **Trust Square over Acuity `amountPaid`.**
- **Client resolution** (`ingest/resolve-clients.ts`): key on `lower(trim(email))`, fallback phone, fallback lowercased name. Recompute `first_seen`/`last_seen`. Flag ambiguous merges into `properties` rather than silently merging.
- Stamp `sync_state` (cursor, `last_ok_at`, `last_error`, `rows_seen`) and append an `ingest_event` each run — this drives the freshness banner.

### 4.3 launchd timer pattern (copy pip's ingestor shape)

`StartInterval = 3600` (hourly — ample at ~50 bookings/month; anvil uses hourly), `RunAtLoad = true`, **no `KeepAlive`** (one-shot per fire, not a daemon). Plain-node entry with the resolve-hook shim so the ingestor can `import "@/lib/..."`:

```bash
node --experimental-strip-types --import ./bin/_resolve-hook.mjs ingest/poll-acuity.ts
```

Run-script `deploy/run-poll.sh` mirrors pip's `run-plaud-ingest.sh`: exports PATH (homebrew + postgres bin), `DATABASE_URL`, the Acuity/Square creds (from env, never hardcoded), `NODE_ENV`, then runs both pollers in sequence.

### 4.4 Idempotency / claim-guard

Two layers, both from pip:

1. **Structural idempotency** — upstream IDs are the PKs; every write is `on conflict do update`. A run with no new upstream state is a no-op.
2. **Atomic claim guard** — before doing work, the poller claims its source so two overlapping launchd fires can't double-run:

```sql
UPDATE ingest_lock SET status='running', claimed_at=now()
 WHERE source=$1 AND status='idle';
-- rowCount 1 → we won the claim; 0 → another run holds it, exit cleanly.
```

Released in a `finally`. A crashed run leaves a stale lock → the poller treats `claimed_at` older than `interval × 3` as reclaimable (anvil's stalled-loop heuristic). Atomic writes for any file snapshot (`.tmp` then `rename`) if we ever cache JSON.

---

## 5. Pages & UI

**Shell.** shadcn `sidebar` block (`SidebarProvider` + `SidebarInset` + `app-sidebar`, `sidebar-07` icon-collapse variant). Left nav lenses: **Overview · Bookings · Clients · Revenue · Repeat visits**. `site-header` carries a global **date-range picker** (`date-picker` range) top-right and a `freshness-banner` ("data as of 14:32 · Acuity OK · Square sandbox · QBO token stale"). Global **`command`** palette (Cmd-K) to jump to a client, set a location filter (Powdersville first), or change the range; `kbd` hints next to actions. Start from the **`dashboard-01`** block as the skeleton, then swap in WWS data.

**Linear feel (applied globally):** Rhea (dense) style; Inter / Inter Display ~weight 510/590; tight line-height; **cards = `border border-border/60 shadow-sm`, never filled**; one accent rationed to a single primary action per view; status pills = `Badge variant="outline"` + a 1.5px low-saturation dot; `tabular-nums` on every number; `min-w-0 truncate` discipline; `duration-150 ease-out` motion; `sonner` for quiet toasts.

**Range presets** (`lib/metrics/range.ts`, from anvil): today/7d/30d/90d/wtd/mtd/lastmonth/qtd/ytd/1y/all/custom; granularity auto-derived (≤31d→day, ≤180d→week, else month); zero-filled bucket spine so empty days still render. Cohort-by-creation-date vs event-by-its-own-timestamp: bookings counted by created date, revenue series by `paid_at`, cleaning-fee events by appointment date.

### Page: Overview (`/`)
KPI grid (`card` + `kpi-card`) → Total Bookings · Revenue (period, net) · New vs Repeat clients · Avg Booking Value · Repeat Rate, each with a delta `badge` (+12% / −4%, low-sat) and a tiny Recharts sparkline. Below: **revenue-over-time** `chart-area-interactive` (range toggle) on the left, **upcoming bookings** list on the right; then **recent bookings** mini `data-table` and **top clients** leaderboard. Components: `card`, `badge`, `chart`, `skeleton`, `data-table`.

### Page: Bookings (`/bookings`)
`data-table` (TanStack): Date · Client · Location · Duration/Type · Add-ons · Status · Amount. Status pills (Paid / Unpaid hold / Refunded / Cancelled) as outline `badge`s. Faceted filters via `dropdown-menu` (location — **Powdersville first**, type, status), `date-picker` range, `hover-card` client preview on row hover, row → client detail. Compact Rhea rows, hairline separators, no zebra. Footer totals (count + summed amount). Components: `data-table`, `badge`, `dropdown-menu`, `date-picker`, `hover-card`.

### Page: Clients (`/clients`)
`data-table` / `card` grid: Name · First visit · Last visit · # Bookings · LTV · Location loyalty. `avatar` + `badge` tags (New / Repeat / VIP / Business). Trgm-backed search. Row → `/clients/[id]`: profile (business, Instagram, participants) + that client's booking history as a mini `data-table` + their lifetime revenue. Components: `data-table`, `avatar`, `badge`, `dialog`/route, `command`.

### Page: Revenue (`/revenue`)
`chart-area-interactive` revenue-over-time (gross + net toggle); **bar** charts for revenue by location (Powdersville first) and by add-on category; **pie/radial** for session-type mix. **Session vs add-on** split from Square `line_items`. Cleaning-fee revenue tile ($150 events). **Reconciliation widget**: Acuity booked-value vs Square collected vs QBO outstanding AR — surfaces unpaid holds / sandbox-vs-prod gaps / name-join mismatches. All chart colors from `--chart-1..5` (one accent, rest gray). Components: `chart`, `card`, `tabs`, `tooltip`.

### Page: Repeat visits (`/repeat`)
**Cohort retention heatmap** (`cohort-grid.tsx`): rows = first-booking month cohort, columns = months-since, cells = tinted `badge`/cell with retention %; `tabs` to switch cohort dimension (by month / location / session type); `ChartTooltipContent` for exact counts. Plus a repeat-rate trend `line` chart and tiles for avg visits/client, median time-between-visits, cross-location repeat, win-back targets (inactive > N months). Components: `chart` (custom cell grid in `ChartContainer`), `table`, `badge`, `tabs`, `tooltip`.

**Seed-vs-live everywhere:** every loader checks `dbEnabled()` and returns hand-written `lib/data/seed.ts` when `DATABASE_URL` is unset, so the whole UI renders end-to-end in local dev with no database (pip convention).

---

## 6. Deployment runbook

Port for WWS app: **`18794`** (pip is `18794`'s neighbor `18793`; confirm free first). All launchd labels `co.entrpy.wws-*`. Logs to `/tmp/wws-*.{out,err}.log`.

### Scripted on the mini

```bash
# ── 0. confirm port is free ───────────────────────────────────────
lsof -nP -iTCP:18794 -sTCP:LISTEN          # must print nothing

# ── 1. code ───────────────────────────────────────────────────────
cd /Users/pip/code && git clone <wws-dashboard repo> wws-dashboard
cd /Users/pip/code/wws-dashboard && npm install

# ── 2. postgres (Postgres 16, trust auth, separate db+role) ───────
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
psql -d postgres -c "CREATE ROLE wws LOGIN;"
psql -d postgres -c "CREATE DATABASE wws OWNER wws;"
for m in supabase/migrations/0*.sql; do echo ">> $m"; psql -d wws -f "$m"; done
# DATABASE_URL=postgresql://wws@localhost:5432/wws  (lives in run-scripts, not .env)

# ── 3. backfill history (one-time) ────────────────────────────────
DATABASE_URL=postgresql://wws@localhost:5432/wws \
  node --experimental-strip-types ingest/backfill-csv.ts \
  --file /Users/pip/code/white-wall-mockup/client/acuity-full-backup.csv

# ── 4. cloudflare tunnel (AFTER Access app exists — see below) ────
cloudflared tunnel create wws-dashboard          # note the printed UUID
#   write ~/.cloudflared/wws-config.yml:
#     tunnel: wws-dashboard
#     credentials-file: /Users/pip/.cloudflared/<UUID>.json
#     ingress:
#       - hostname: wws.entrpy.co
#         service: http://127.0.0.1:18794
#       - service: http_status:404
cloudflared tunnel route dns wws-dashboard wws.entrpy.co

# ── 5. build + install launchd services ───────────────────────────
npm run build
cp deploy/co.entrpy.wws-dashboard.plist   ~/Library/LaunchAgents/
cp deploy/co.entrpy.wws-cloudflared.plist ~/Library/LaunchAgents/
cp deploy/co.entrpy.wws-poll.plist        ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/co.entrpy.wws-dashboard.plist
launchctl load ~/Library/LaunchAgents/co.entrpy.wws-cloudflared.plist
launchctl load ~/Library/LaunchAgents/co.entrpy.wws-poll.plist

# ── 6. verify ─────────────────────────────────────────────────────
lsof -nP -iTCP:18794 -sTCP:LISTEN
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:18794
launchctl list | grep entrpy
tail -f /tmp/cloudflared-wws.err.log        # watch for "Registered tunnel connection"
```

**App plist** `deploy/co.entrpy.wws-dashboard.plist` — `RunAtLoad` + `KeepAlive` true (always-on, restart-on-crash), runs `deploy/run-wws.sh` which exports PATH/`DATABASE_URL`/`NODE_ENV` then `exec npm run start` (port pinned via `"start": "next start -p 18794"`). **Tunnel plist** `co.entrpy.wws-cloudflared.plist` runs `cloudflared --config ~/.cloudflared/wws-config.yml tunnel run wws-dashboard` (do NOT edit pip's `config.yml`). **Poll plist** `co.entrpy.wws-poll.plist` — `StartInterval 3600`, `RunAtLoad` true, no `KeepAlive`, runs `deploy/run-poll.sh`.

**Redeploy loop:**
```bash
cd /Users/pip/code/wws-dashboard && git pull && npm install && npm run build
launchctl kickstart -k gui/$(id -u)/co.entrpy.wws-dashboard
```

### Andrew must do in Cloudflare dashboard

These zero-trust steps are dashboard-only (`cloudflared` can't create them) and must happen **before** the `route dns` step, so the hostname is never publicly reachable.

1. **Zero Trust → Access → Applications → Add an application → Self-hosted.**
2. **Application name:** `wws-dashboard`. **Session duration:** 24h–1mo (your call).
3. **Application domain:** subdomain `wws`, domain `entrpy.co`, path blank (whole host).
4. **Identity providers:** ensure **Google** is enabled (already configured at account level for pip — reuse it; no new Google Cloud Console work).
5. **Policies → Add a policy:** name `andrew-only`, action **Allow**, Include → **Emails** → `andrew@entrpy.co` (single-user). Optionally add a default **Block** for everything else.
6. Save. Then run the scripted `cloudflared tunnel route dns ...` step. Final check: `https://wws.entrpy.co` → Google Access login → only `andrew@entrpy.co` reaches the app.

(If Drew should ever have his own login, add his email to the Allow policy — a one-line dashboard change, no code.)

---

## 7. Phased build plan

### Phase 1 — simple, ship-it (minimal viable dashboard)

Goal: one working dashboard at `wws.entrpy.co` showing real history from the CSV backfill, four lenses, read-only. **Square stays sandbox / QBO stale — Phase 1 uses CSV history + Acuity list values; real-cash reconciliation lands in Phase 2 once Square prod is live.**

- [ ] Clone pip-dashboard scaffolding into `/Users/pip/code/wws-dashboard`; copy `lib/db.ts`, `lib/utils.ts`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `bin/_resolve-hook.mjs`, `bin/_empty.mjs`. Init git repo.
- [ ] `shadcn init` (Tailwind v4, Rhea style); add `sidebar dashboard-01 data-table chart card badge command date-picker dropdown-menu hover-card tabs avatar skeleton sonner tooltip kbd separator breadcrumb`.
- [ ] Write `globals.css` tokens: warm-gray neutrals, one accent, `--chart-1..5`, WWS type accents (`--color-booking/client/revenue`). Inter / Inter Display.
- [ ] Write migrations `0001_schema.sql` + `0002_ingest_state.sql`; create `wws` db/role; apply.
- [ ] `ingest/backfill-csv.ts` — parse, **scrub PAN**, exclude STAGING + test row, resolve clients by email, load `booking`/`client`/`booking_addon` + `csv-estimate` payments. Run it.
- [ ] `lib/metrics/range.ts` (presets + auto-granularity + zero-fill) + `revenue.ts` + `repeat.ts`, with `*.test.ts` (Node test runner).
- [ ] `lib/data/{bookings,clients,revenue,seed}.ts` — dual-mode (`dbEnabled() ? SQL : seed`).
- [ ] Shell: `app/layout.tsx` (sidebar + Cmd-K + header date-range + freshness banner), `lib/nav.ts` (Overview/Bookings/Clients/Revenue/Repeat).
- [ ] Pages: Overview (KPIs + revenue area chart + recent/upcoming), Bookings (`data-table` + filters, **Powdersville first**), Clients (table + `/clients/[id]`), Revenue (area + by-location/add-on bars), Repeat (cohort grid + repeat-rate trend).
- [ ] `/api/health` + `freshness-banner` (data-as-of + upstream status).
- [ ] `ingest/poll-acuity.ts` + `poll-square.ts` + `resolve-clients.ts` + claim guard; `deploy/run-poll.sh`.
- [ ] All `deploy/*` plists + run-scripts. Stand up Postgres, build, launchd, tunnel.
- [ ] **Andrew:** create the Cloudflare Access app (§6) before DNS route. Verify end-to-end at `wws.entrpy.co`.

### Phase 2+ — enhancements

- **Real cash & reconciliation** — once Square prod is live, switch poller to prod tokens; overwrite `csv-estimate` payments with real gross/fee/net/refunds; light up the Acuity-vs-Square-vs-QBO reconciliation widget. Re-auth QBO (`/api/qbo-auth`) so AR widgets work.
- **Add-on analytics** — per-add-on attach rate (PV-only denominators for walls/chairs/tables/TV/PA), parsed-notes detail (backdrop colors, wall numbers, table counts).
- **Utilization / occupancy** — booked hours ÷ available hours per location/day via `/availability`; cleaning-buffer block occupancy.
- **Webhooks** — Acuity + Square signature-verified webhooks for a real-time booking feed / revenue ticker (polling remains the safety net).
- **Health banner upgrades** — "Acuity unreachable", "QBO token stale", "last poll >2h", "callback errors today > 0"; optional browser push on new booking (anvil's `notify()`).
- **Funnel** — booking funnel (started→details→waiver→add-ons→paid→completed) by location, if checkout funnel events are logged.
- **Updates changelog** — `/updates` page from a hand-maintained `updates.yaml` (anvil), for Drew.
- **Multi-viewer** — if a cleaner/staff ever needs access, split money behind a role-gated endpoint (anvil: money lives on a separate endpoint, not redacted client-side) and add their email to a scoped Access policy.

---

## 8. Open questions for Andrew

1. **Who logs in?** Phase 1 assumes single-user `andrew@entrpy.co` (mirrors pip). Should Drew get his own Google login on the Access policy now, or later?
2. **Square prod timing.** The live flow is still sandbox. Phase 1 ships on CSV history + Acuity list values (no real-cash reconciliation). OK to ship that way and light up real revenue in Phase 2 when Square prod cuts over? Or hold the dashboard until Square is live?
3. **QBO reconciliation — worth it?** Drew has said he doesn't care about invoicing customers, and the QBO refresh token is currently stale. Should the reconciliation widget include QBO AR at all, or just Acuity-booked vs Square-collected?
4. **Poll cadence.** Hourly is ample at ~50 bookings/month. Do you ever want it faster (and accept the upstream API chatter), or is hourly fine?
5. **Refresh of CSV tail.** The CSV is a static export. Once the poller runs, do we keep the CSV strictly as a one-time historical seed, or periodically re-export from Acuity to backfill any pre-poller gaps?
6. **Repo home.** New standalone repo at `/Users/pip/code/wws-dashboard` — confirm it's its own GitHub repo (not a folder of the booking-site repo).
7. **"Repeat visit" definition.** Default: a client with ≥2 non-canceled, non-staging bookings. Should a same-day double-booking count as one visit or two? Should canceled bookings ever count toward repeat status?
8. **PII retention.** Backfill scrubs card/CVV outright. Are you fine storing client email/phone/Instagram/business-name in local Postgres (it never leaves the mini, gated by Access), or do you want any of those redacted/hashed?
