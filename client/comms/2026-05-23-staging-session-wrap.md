# Staging Site — Session Wrap

**Date range:** 2026-05-21 → 2026-05-23
**Goal:** Stand up a fully operational staging mirror of `whitewallstudios.co` so booking-pipeline changes can be tested without risking real customers, payments, or calendars.

---

## Final state

✅ **Staging site is live and operational** at `https://staging.whitewallstudios.co`
✅ **Production is hardened** against a class of bugs we discovered during the staging rollout
✅ **One real-customer incident** (Lisa Brantly) caught + resolved + documented

### What's running

| Layer | Production | Staging |
|---|---|---|
| URL | whitewallstudios.co | staging.whitewallstudios.co |
| Git branch | `main` | `staging` |
| Vercel env | Production | Custom env `staging` (id `env_tyxOrSgy4jxqkefMn39yF8WXNLiS`) |
| Square | Production tokens, real money | Sandbox tokens |
| Acuity calendar | PV 6255578 / TM 6252295 | STAGING 14110701 (single calendar serves both locations on staging) |
| Notifications | Real Resend / Watson SMS / QBO mark-paid | All self-suppressed (env vars unset) |
| Customer email | Customer's real address | Sink `andrewsmith1025+wws-staging@gmail.com` |
| First-name stamp | n/a | `[STAGING]` prefix |

---

## What got built

### Code (committed to `main` and `staging`)

1. **`9a6893c` — Staging scaffolding.** New `api/_lib/env.js` helpers (`isStaging`, `stagingCalendarID`, `stagingSinkEmail`). Booking-callback applies staging guards (sink email, name stamp, notes marker, calendarID override). New `scripts/staging-banner.js` mounts the yellow `STAGING — NOT THE LIVE SITE` bar and a `<meta robots noindex>` tag on every page when hostname starts with `staging.`. All 17 HTML pages include the banner script.
2. **`a8d6080` — Mock-Acuity fail-safe.** When `STAGING=1` but `ACUITY_STAGING_CALENDAR_ID` is unset, the booking-callback skips the Acuity write entirely and returns a synthetic `staging-mock-<ts>` ID — prevents staging bookings from leaking onto prod calendars if config is ever cleared.
3. **`fd786bc` — Staging Acuity routing.** Pass `calendarID = stagingCalendarID()` explicitly on appointment-create + cleaning-buffer block create. Drove staging bookings onto calendar 14110701.
4. **`228c0ef` — Square redirect URL fix.** `create-checkout.js` was hardcoding `https://white-wall-mockup.vercel.app` so staging payments redirected to prod's callback (where the staging-signed state failed HMAC verification). Now derives from `req.headers["x-forwarded-host"] || req.headers.host`.
5. **`c7a4749` — URGENT: always pass calendarID.** Production fix for the Lisa Brantly misroute. `POST /appointments` now always passes `calendarID`, never relies on Acuity's default behavior (which silently picks the first calendar in a type's `calendarIDs` array — STAGING in our case).
6. **`e48ba94` — URGENT: calendarID on availability + buffer + QBO.** Closed the same hole in `availability-dates.js`, `availability-times.js`, `verify-availability.js` (cross-calendar availability bleed), `create-checkout.js` cleaning-fee buffer check, and derived `baseUrl` from request headers in `qbo-auth.js` + `qbo-callback.js` (was hardcoded).
7. **`7c6621e` — Docs.** Updated CLAUDE.md, wrote the Lisa Brantly post-mortem, vault sync.

### Vercel side

- Custom environment `staging` created (slug `staging`, type Preview, branch tracking `equals "staging"`)
- 9 env vars set in staging scope: `STAGING=1`, `SQUARE_ENVIRONMENT=sandbox`, sandbox Square tokens, Acuity creds, `ACUITY_STAGING_CALENDAR_ID=14110701`, `ACUITY_STAGING_SINK_EMAIL`, fresh `BOOKING_SECRET`
- Domain `staging.whitewallstudios.co` attached to the staging environment
- DNS CNAME at GoDaddy → `cname.vercel-dns.com` added by Andrew
- SSL cert auto-issued by Vercel

### Acuity side (Drew)

- Created new calendar named "STAGING" (id 14110701)
- Added STAGING to the `calendarIDs` array of all 12 existing prod appointment types (rather than duplicating types, which simplified our env-var design — no type-ID translation map needed)

### Docs

- `vault/Staging.md` (new) — canonical staging reference
- `vault/Acuity.md` — multi-calendar gotcha rule added
- `vault/Credentials & Accounts.md` — STAGING calendar ID + staging env-var matrix
- `vault/System Architecture.md` + `vault/Home.md` — link to Staging doc
- `CLAUDE.md` — full "Staging Environment" section + "Acuity multi-calendar gotcha" rule
- `client/comms/2026-05-21-staging-site-plan.md` — original design doc with all the rejected alternatives
- `client/comms/2026-05-22-lisa-brantly-misroute-incident.md` — incident post-mortem
- Auto-memory: `project_staging_environment.md` + `feedback_always_pass_calendarID.md`

---

## The production incident — Lisa Brantly (2026-05-22)

**What happened.** A real customer (Lisa Brantly) booked Taylor's Mill - Two Hours on `whitewallstudios.co` and her appointment landed on the STAGING calendar with the **Powdersville address** in her confirmation email.

**Root cause.** When Drew added the STAGING calendar to the existing prod appointment types' `calendarIDs` arrays, every prod type became `[14110701, prod_cal_id]` with STAGING first. Acuity's `POST /appointments` defaults to the first calendar in the array when no `calendarID` is specified — silently misrouting every prod booking from that moment until we caught it.

**Resolution.** Drew dragged the appointment from STAGING to Taylor's Mill in the Acuity dashboard and sent Lisa a corrected confirmation. Code fix shipped within ~20 minutes (`c7a4749`). A broader audit caught a second class of the same bug in the availability endpoints (would have caused booking-error redirects after payment if a slot was free on one calendar but blocked on the other). Fixed in `e48ba94`.

**Lesson codified.** Every Acuity API call that takes `appointmentTypeID` must also pass `calendarID`. Documented in CLAUDE.md, vault/Acuity.md, vault/Staging.md, and as an auto-memory feedback entry.

---

## What's left (in priority order)

### Should fix (next time you're in here)

1. **Vercel auto-deploy routing.** Pushes to the `staging` git branch currently land in Vercel's `Preview` env scope, not the `staging` custom env, despite my `branchTracking: {type: "equals", pattern: "staging"}` config. Workaround: run `vercel deploy --target=staging --yes` after pushing the staging branch. Cleanup options (we discussed but didn't act on):
   - **A.** Vercel dashboard → Settings → Environments → staging → check the Git Branch field. Probably a 2-min fix.
   - **B.** GitHub Action on push-to-staging that runs `vercel deploy --target=staging`. Needs a Vercel token in repo secrets. Most reliable.
   - **C.** Vercel REST API PATCH with the correct `branchTracking` schema. Cleanest, but the API docs aren't great about the schema.

### Could fix (low impact)

2. **Cleanup the `[STAGING] Andrew Smith` smoke-test appointment.** Sitting on the STAGING calendar (id `1709314933`, dated 2026-05-22 14:00). Harmless — it's evidence the system works. Drew or Andrew can delete via dashboard whenever.
3. **`alert.js` environment label.** Currently labels alert emails by `SQUARE_ENVIRONMENT` (production/sandbox), not by `STAGING`. If staging ever has alerts enabled (it doesn't today), they'd say "sandbox" which is slightly misleading. Trivial fix: add `isStaging()` to the env label.
4. **Banner detection on `*.vercel.app` previews.** The banner only mounts when hostname starts with `staging.`. Preview deploys of the staging branch at `*-git-staging-*.vercel.app` URLs won't show the banner even though they have `STAGING=1` in scope. Documented as a "don't share those URLs" gotcha. A more robust detection would fetch a flag from a server endpoint.

### Already in the long-term roadmap (existed before this session)

5. **QBO production credentials.** Currently QBO mark-paid is wired for prod but uses production creds Drew obtained earlier. The "complete Intuit compliance questionnaire" item is unrelated to staging.
6. **Acuity webhooks.** Not currently used. If implemented, would need to be staging-aware (otherwise staging bookings would trigger webhooks to prod).
7. **Admin dashboard.** Future enhancement — a unified view of bookings, payments, Acuity state.

---

## Smoke-test cheat sheet (for future sessions)

### Verify staging is healthy

```bash
# Site reachable + banner script served
curl -sI https://staging.whitewallstudios.co/ | grep x-vercel-id
curl -s https://staging.whitewallstudios.co/ | grep -o 'staging-banner.js'

# Acuity availability filtered to STAGING calendar (should differ from prod)
curl -s "https://staging.whitewallstudios.co/api/availability-dates?appointmentTypeID=89113040&month=2026-06" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['dates']),'dates')"
curl -s "https://whitewallstudios.co/api/availability-dates?appointmentTypeID=89113040&month=2026-06" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['dates']),'dates')"

# Verify no recent prod bookings have leaked onto STAGING calendar
vercel env pull /tmp/.env-ac --environment=production --yes
set -a; source /tmp/.env-ac; set +a
AUTH=$(printf "%s:%s" "$ACUITY_USER_ID" "$ACUITY_API_KEY" | base64)
curl -s "https://acuityscheduling.com/api/v1/appointments?calendarID=14110701&max=20&direction=DESC" \
  -H "Authorization: Basic $AUTH" | python3 -c "
import sys, json
for a in json.load(sys.stdin):
    is_real = not (a.get('firstName','') or '').startswith('[STAGING]')
    print(('⚠️ REAL' if is_real else '   test'), a['id'], a.get('firstName'), a.get('lastName'), a.get('datetime'))
"
rm /tmp/.env-ac
```

### Run an end-to-end staging booking

1. Open `https://staging.whitewallstudios.co/book-powdersville` fresh (close any old tabs first — Square bakes the redirect URL into the payment link at creation time)
2. Verify yellow `STAGING — NOT THE LIVE SITE` bar visible
3. Walk through the booking flow
4. Pay with `4111 1111 1111 1111`, any future expiry, CVV `111`, ZIP `12345`
5. Square sandbox panel won't auto-redirect — click the redirect URL manually
6. Land on `/booking-confirmation`
7. Run the calendar-14110701 query above to confirm the appointment landed on STAGING

### Deploy a code change to staging

```bash
# After committing to the staging branch
git checkout staging
git push origin staging
vercel deploy --target=staging --yes   # the staging auto-deploy quirk — see "What's left" item 1
```
