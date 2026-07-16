# Build plan — Dashboard Overview R&D (Drew 2026-07-16, thread 19f6b708fb71898c)

Repo: `wws-dashboard`. Branch: `worker/overview-glance-scope-yoy-calendar`. One PR.
All READ-ONLY lenses over existing data. No schema change. Not §4-gated (internal, no money
spent, no platform architecture). Verify = `npm run build` + run against live DB + screenshots.

## Ground truth (from repo, verified 2026-07-16)
- Andrew's non-slop overview = the glance at `app/overview/page.tsx` (route `/overview`),
  data `lib/stats/glance.ts` (`getGlance` + `getGlanceBookings`), components `GlanceView`
  (`components/glance/glance-view.tsx`: AtAGlance + MonthChartCard cumulative line + WeekChartCard
  bars) + `BookingsWeekCard` rail. Official overview (`app/page.tsx`, `/`) = the "slop".
- Charts = Recharts + shadcn `ChartContainer`. Studio colors: Powdersville=GREEN
  (`#16a34a`/`#22c55e`), Taylors Mill=BLUE (`#2563eb`/`#3b82f6`) via `lib/location-colors.ts`
  tokens `loc-powdersville-*`/`loc-taylorsmill-*`. Scope machinery: `components/stats/
  scope-year-controls.tsx` (`Scope`, `SCOPES`, `scopeToLocationId`, `<ScopeYearControls>`).
- Schema: `booking(location_id TEXT, type_label, duration_min INT, starts_at, ends_at,
  list_price, canceled, is_event, client_id)`; `payment(booking_id, source, gross_amount,
  fee_amount, net_amount, paid_at)`. PV location_id `6255578`, TM `6252295`.
- MONEY RULE: every revenue dollar = `sum(net_amount) where source like 'square%'`, ET calendar
  date. Keep net everywhere (calendar per-booking "paid" = net_amount too, for one money contract;
  fall back to booked list_price w/ a "booked" tag when unpaid). Note the choice to Drew.

## Items → implementation
1. **Glance → official Overview.** Rewrite `app/page.tsx` to load `getGlancePage()` (all 3 scopes)
   and render new `<GlancePage>`. `app/overview/page.tsx` → `redirect("/")`. Remove the
   "Overview (non slop version)" entry from `lib/nav.ts`. Slop components left in tree, unrouted.
2. **Page-wide scope toggle** (Company Wide / Powdersville / Taylors Mill). `getGlancePage()`
   returns `{ company, powdersville, "taylors-mill" }`, each `{ glance, yoy, calendar }`. New
   client `components/glance/glance-page.tsx` holds `useState<Scope>`, renders `<ScopeYearControls>`
   at top, slices the bundle. Thread a `location_id` filter through the scoped queries (join
   payment→booking→location for studio scope; company = current unscoped incl. Unassigned).
3. **YoY net-total chart** — new `components/glance/year-chart-card.tsx` + `computeYoy` in glance.ts.
   12-month line Jan..Dec: 2026 solid through last COMPLETED month, dotted from there (current
   month = forecast projection, future months = avgMonth) — clean solid→dotted handoff, no partial-
   month dip. Muted prior-year (2025) reference line. Headline: this-year net total (YTD) + %
   change vs prior-year-same-period. Clone the MonthChartCard style (ReferenceDot/dashed lines).
4. **Week bar avg line** — add `weekAvg` to `GlanceData` (avg of non-future day values), draw a
   horizontal dashed `<ReferenceLine y={weekAvg}>` in `WeekChartCard`.
5+6. **Full-width month calendar** at the bottom, replacing `BookingsWeekCard`. New
   `getMonthCalendar(scope)` (all non-canceled bookings this ET month; per booking: time,
   clientName, locationSlug/Name, isEvent, typeLabel, durationMin, amountPaid=net gross-fallback,
   paid flag). New client `components/glance/month-calendar-card.tsx`: Apple-style month grid,
   per-booking dot colored by studio (green PV / blue TM, canon), tap a day → unfold bookings
   (name, start time, studio, length, amount paid, photo/video-vs-event), tap to collapse.

## Verify
`node`/tsc via `npm run build`; unit tests for `computeYoy`, `weekAvg`, calendar assembly, scoped
glance; run against live DB on a non-prod port, screenshot each scope + a tapped day; then merge
→ deploy (`git pull && npm install && npm run build && launchctl kickstart -k
gui/$(id -u)/co.entrpy.wws-dashboard`) → spot-check prod → confirm live to Drew (open promise).
