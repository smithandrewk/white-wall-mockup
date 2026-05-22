# Staging Site Plan — `staging.whitewallstudios.co`

**Date:** 2026-05-21
**Owner:** Andrew (internal infra)
**Goal:** Fully operational staging deployment of whitewallstudios.co — same code path as prod, safe to test against without affecting real customers, calendar, or money.

---

## TL;DR

| Layer            | Strategy                                                                       |
|------------------|--------------------------------------------------------------------------------|
| URL              | `staging.whitewallstudios.co` (custom subdomain, scoped to `staging` branch)   |
| Vercel env       | Custom environment named `staging`, auto-deploys from git branch `staging`     |
| Square           | **Sandbox** — `SQUARE_ENVIRONMENT=sandbox`, uses existing sandbox creds        |
| Acuity           | **Prod tenant** (no sandbox exists), routed to a dedicated **STAGING calendar** + duplicate appointment types |
| QuickBooks       | **Disabled** — no `QBO_*` env vars in staging scope, mark-paid no-ops          |
| Resend (email)   | **Disabled** — no `RESEND_API_KEY` in staging scope, all notify-* functions no-op |
| Watson SMS       | **Disabled** — no Watson creds in staging scope                                |
| Acuity email     | **Sink** — customer email overridden to a sink address before calling Acuity, so Acuity's own confirmation email goes to a controlled inbox, not whoever's typed in the test form |
| Visual           | Yellow `STAGING — NOT THE LIVE SITE` banner on every page                      |
| SEO              | `noindex` meta + `Disallow: /` in robots.txt when on staging host              |

---

## Why this design

1. **Square sandbox** is free, full E2E, no real charges. Test cards work end-to-end through Payment Links + callback.
2. **Acuity has no sandbox.** One tenant, one set of customer-facing scheduler URLs. The only way to keep test bookings off Drew's real Powdersville/Taylor's Mill calendars is to put them on a separate calendar within the same tenant.
3. **All notification functions already guard on env-var presence** (`notify-owner.js:236`, `notify-cleaner.js:112`, `notify-sms.js:91`, `alert.js:15`) — they log "skipping" and return. So omitting `RESEND_API_KEY` / `WATSON_*` / `OWNER_PHONE` in staging means notifications are suppressed for free, no code changes required.
4. **Acuity sends its own confirmation email** when an appointment is created and we can't suppress it (`noEmail` doesn't work — documented in CLAUDE.md). To honor "no outbound to real third parties", staging overrides the customer email to a sink address. The test booker won't get the Acuity confirmation, but neither will a random gmail address that someone typed in.

---

## Architecture

### Vercel side

- **Project:** existing `white-wall-mockup` project (`prj_FZFBMvFrAsGNntQI3IH46iv1bhNZ`). No new project.
- **Custom environment:** `staging`, configured in the Vercel dashboard (Settings → Environments → Add Custom Environment). Vercel supports this — env vars and branch assignment are per-environment.
- **Branch binding:** `staging` git branch → `staging` environment.
- **Domain:** `staging.whitewallstudios.co` attached to the `staging` environment (Settings → Domains → Add → select "staging" env).
- **DNS:** CNAME `staging.whitewallstudios.co` → `cname.vercel-dns.com` at the domain registrar.

### Code side

The code needs to know "am I on staging?" so it can:
- Route Acuity appointments to the staging calendar / staging appointment types.
- Stamp `[STAGING]` into the client name and notes (visual safety net).
- Override the customer email to a sink before calling Acuity.
- Render the visible banner + noindex meta.

Detection: `process.env.VERCEL_ENV === "preview"` AND `process.env.STAGING === "1"` (the explicit `STAGING=1` env var is set only in the `staging` Vercel environment, so it acts as the canonical flag).

### Env var matrix

| Variable                       | Production            | Staging              | Notes                                                                            |
|--------------------------------|-----------------------|----------------------|----------------------------------------------------------------------------------|
| `STAGING`                      | (unset)               | `1`                  | Explicit flag the code reads                                                     |
| `SQUARE_ENVIRONMENT`           | `production`          | `sandbox`            |                                                                                  |
| `SQUARE_PROD_ACCESS_TOKEN`     | set                   | (unset)              |                                                                                  |
| `SQUARE_PROD_LOCATION_ID`      | set                   | (unset)              |                                                                                  |
| `SQUARE_SANDBOX_ACCESS_TOKEN`  | set (for fallback)    | set                  | Already in Vercel — copy to staging scope                                        |
| `SQUARE_SANDBOX_LOCATION_ID`   | set (for fallback)    | set                  | Already in Vercel — copy to staging scope                                        |
| `ACUITY_USER_ID`               | `36967128`            | `36967128`           | Same tenant                                                                      |
| `ACUITY_API_KEY`               | set                   | set                  | Same tenant                                                                      |
| `ACUITY_STAGING_TYPE_MAP`      | (unset)               | JSON map             | `{"prodID":"stagingID",...}` — drives appointment-type translation               |
| `ACUITY_STAGING_CALENDAR_PV`   | (unset)               | new staging cal ID   | Used for cleaning-buffer block                                                   |
| `ACUITY_STAGING_CALENDAR_TM`   | (unset)               | new staging cal ID   | Or same as PV staging cal — staging doesn't need per-location separation         |
| `ACUITY_STAGING_SINK_EMAIL`    | (unset)               | `andrew+wws-staging@…`| Sink for Acuity confirmation emails                                              |
| `BOOKING_SECRET`               | set                   | set (new value)      | HMAC key; separate value so staging-signed states can't be replayed on prod      |
| `RESEND_API_KEY`               | set                   | (unset)              | All notify-* gracefully no-op                                                    |
| `NOTIFICATION_EMAIL`           | set                   | (unset)              |                                                                                  |
| `CLEANER_EMAIL`                | set                   | (unset)              |                                                                                  |
| `ALERT_EMAILS`                 | set                   | (unset)              | If we want staging alerts to me, set to `andrewsmith1025@gmail.com`              |
| `WATSON_SMS_URL`               | set                   | (unset)              |                                                                                  |
| `WATSON_CF_ACCESS_CLIENT_ID`   | set                   | (unset)              |                                                                                  |
| `WATSON_CF_ACCESS_CLIENT_SECRET`| set                  | (unset)              |                                                                                  |
| `OWNER_PHONE`                  | set                   | (unset)              |                                                                                  |
| `QBO_*`                        | set                   | (unset)              | qbo-mark-paid no-ops when client ID missing                                      |
| `POSTHOG_API_KEY`              | set                   | (unset, or test key) | Set to a separate PostHog project if we want staging analytics                   |

---

## Code changes

### 1. `api/_lib/env.js` (new)

```js
exports.isStaging = function () {
  return process.env.STAGING === "1";
};
exports.isProduction = function () {
  return process.env.VERCEL_ENV === "production" && process.env.STAGING !== "1";
};
exports.stagingSinkEmail = function () {
  return process.env.ACUITY_STAGING_SINK_EMAIL || "staging-bookings@invalid.local";
};
```

### 2. `api/booking-callback.js`

Before the `acuityPost("/appointments?admin=true", ...)` call:

```js
var { isStaging, stagingSinkEmail } = require("./_lib/env");

// Translate prod appointment type ID → staging ID if a map is configured
var apptTypeID = bookingState.appointmentTypeID;
if (isStaging() && process.env.ACUITY_STAGING_TYPE_MAP) {
  try {
    var map = JSON.parse(process.env.ACUITY_STAGING_TYPE_MAP);
    if (map[String(apptTypeID)]) apptTypeID = map[String(apptTypeID)];
  } catch (e) { log("acuity", "STAGING type map parse error: " + e.message); }
}

// Stamp the client name + email + notes when staging
var firstName = bookingState.contact.firstName;
var email = bookingState.contact.email;
var stagedNotes = notes;
if (isStaging()) {
  firstName = "[STAGING] " + firstName;
  email = stagingSinkEmail();
  stagedNotes = "*** STAGING BOOKING — DO NOT FULFILL ***\nOriginal email: " + bookingState.contact.email + "\n\n" + notes;
}

var appointment = await acuityPost("/appointments?admin=true", {
  appointmentTypeID: apptTypeID,
  ...
  firstName: firstName,
  email: email,
  notes: stagedNotes,
  ...
});
```

Cleaning-buffer block: when staging, use `ACUITY_STAGING_CALENDAR_PV/TM` instead of `CALENDAR_IDS[location]`. (Or skip the block entirely on staging — staging doesn't need cleaning logistics.)

### 3. Frontend banner + noindex

In a small inline `<script>` at top of `<head>` on every HTML page (or a shared `scripts/staging-banner.js` included on every page):

```js
if (location.hostname.startsWith("staging.")) {
  document.documentElement.dataset.staging = "1";
  var meta = document.createElement("meta");
  meta.name = "robots";
  meta.content = "noindex,nofollow";
  document.head.appendChild(meta);
  document.addEventListener("DOMContentLoaded", function () {
    var bar = document.createElement("div");
    bar.textContent = "STAGING — NOT THE LIVE SITE";
    bar.style.cssText = "position:fixed;top:0;left:0;right:0;background:#f59e0b;color:#000;padding:6px;text-align:center;font:600 13px/1 system-ui;z-index:99999;letter-spacing:0.05em;";
    document.body.appendChild(bar);
    document.body.style.paddingTop = "32px";
  });
}
```

### 4. `robots.txt`

We already serve a static site. Add a route or function so `robots.txt` returns `Disallow: /` when host = `staging.whitewallstudios.co`. Cheapest: a Vercel rewrite/edge function, or just a `<meta name="robots">` (already covered above) — noindex meta is sufficient for googlebot.

---

## Manual steps (Andrew)

These I can't do via API — they need dashboard or DNS access.

1. **Acuity dashboard — set up STAGING calendar + appointment types**
   - Acuity → Business Settings → Calendars → "+" → name it `STAGING`
   - Acuity → Appointment Types → for each of the 8 prod types, click "Copy" or create a new one with the same duration + (optional) reduced price
     - Powdersville: 30min, 1hr, 2hr, 3hr, 4hr, 8hr
     - Taylor's Mill: 30min, 1hr (whatever the existing TM types are)
   - Assign each new staging type to the STAGING calendar only
   - Record the new appointment-type IDs and the calendar ID — I'll need them for the env vars

2. **Vercel dashboard — create custom environment**
   - Vercel → white-wall-mockup → Settings → Environments → "Add Custom Environment"
   - Name: `staging`. Branch: `staging`.
   - (CLI doesn't expose this in v50; dashboard-only)

3. **Vercel dashboard — populate staging env vars per the matrix above**
   - Easiest: copy from Production scope, then override per matrix. The CLI can do this once the environment exists (`vercel env add NAME staging`).

4. **Vercel dashboard — add custom domain to staging env**
   - Settings → Domains → Add → `staging.whitewallstudios.co` → assign to `staging` environment

5. **DNS — add CNAME at registrar**
   - `staging.whitewallstudios.co` → `cname.vercel-dns.com`
   - Vercel will surface the exact record; just paste it at your DNS host

6. **(Optional) PostHog — create staging project**
   - PostHog dashboard → New project "WWS Staging" → grab API key, add to staging env vars as `POSTHOG_API_KEY`

---

## Rollout sequence

1. ✅ Plan reviewed (this doc)
2. Code changes on `staging` branch:
   - `api/_lib/env.js` helper
   - `api/booking-callback.js` staging guards
   - Frontend banner + noindex injection
3. Push `staging` branch
4. Andrew: Vercel custom environment + env vars (without ACUITY_STAGING_* — they require Acuity setup first)
5. Andrew: Acuity setup → collect IDs → add `ACUITY_STAGING_TYPE_MAP` + calendar IDs to staging env
6. Andrew: DNS CNAME + domain attach
7. Smoke test: open `staging.whitewallstudios.co`, run a booking with sandbox card, confirm:
   - Banner visible
   - Appointment lands on STAGING calendar (not Powdersville/TM)
   - Customer name prefixed `[STAGING]`
   - Customer email replaced with sink
   - No Resend / Watson / QBO calls (logs show "skipping")
   - Confirmation page renders

---

## Open questions

None at this point — all three forks resolved (2026-05-21):
- URL → `staging.whitewallstudios.co`
- Acuity → dedicated STAGING calendar + duplicated appointment types
- Notifications → suppress all outbound
