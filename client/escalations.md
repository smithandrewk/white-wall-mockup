# Escalations & Manual Actions

Items that need Andrew's manual intervention or can't be resolved programmatically.

## Pending

### 2026-06-12 — PostHog server-side events no-op — POSTHOG_API_KEY not set in Vercel Production (issue #19 / F2)
- **Symptom:** Every `captureServerEvent()` call in `api/create-checkout.js` (fires on `booking_completed_server` and `booking_failed_server`) is silently dropped. `api/_lib/posthog.js` `getClient()` checks `process.env.POSTHOG_API_KEY` at call time; when the var is absent it logs `"posthog: POSTHOG_API_KEY not set, skipping"` and returns `null`, so the event is never sent. No error is surfaced to the caller — the booking flow continues normally.
- **Env vars needed:**
  - `POSTHOG_API_KEY` — project API key from PostHog dashboard (Project Settings > Project API key). Required.
  - The host is hardcoded to `https://us.i.posthog.com` in `api/_lib/posthog.js`; no separate env var needed unless the host changes.
- **Fix:** Set `POSTHOG_API_KEY` in Vercel **Production** (and optionally staging if server-side funnel events are wanted there), then redeploy. Client-side PostHog (`scripts/booking-flow.js`) is a separate snippet loaded in the browser and is unaffected by this var.
- **Why it matters:** This gates F2 / issue #19 (lead-source + conversion reporting). Server-side `booking_completed_server` events are the reliable signal for conversion attribution (fires after payment, not subject to ad blockers or page-close timing). Until the var is set, there is no server-side funnel data in PostHog.

### 2026-06-12 — Twilio A2P 10DLC registration for customer confirmation SMS (issue #7 / B1)
- **What's blocked:** Customer booking-confirmation SMS code is built and merged (`api/_lib/notify-customer-sms.js`, wired into `create-checkout.js`), but it no-ops until Twilio is provisioned. It cannot legally send to US numbers without A2P 10DLC registration.
- **Action (manual, needs Drew's business info):**
  1. Create/confirm a Twilio account.
  2. Register A2P 10DLC **brand** (legal business name, EIN, address) + **campaign** (use case: booking confirmations; provide sample message). Carrier approval typically takes days–weeks.
  3. Buy a sending number (or use an existing Twilio number) attached to the approved campaign.
  4. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` in Vercel **Production** (leave unset in staging).
- **Also pending:** Drew sign-off on the draft SMS copy in `buildCustomerSms()` before go-live.
- **Note:** no rush on our side — code ships dark and activates the moment the env vars land.

### 2026-06-10 — QBO mark-paid broken: refresh token stale, re-auth needed
- **Symptom:** `/api/qbo-test` returns `invalid_grant` ("Incorrect or invalid refresh token"). Every booking since the token went stale has left its QBO draft invoice unpaid.
- **Cause:** Intuit rotates refresh tokens on use; the rotated value can't be persisted back into Vercel env vars (tokens last set ~2026-03-31), so the stored one died. Will recur until token storage moves out of env vars.
- **Fix (manual, needs Drew's Intuit login):** visit `https://whitewallstudios.co/api/qbo-auth`, sign in as Drew, approve; copy fresh tokens from `/api/qbo-callback`; update `QBO_ACCESS_TOKEN` + `QBO_REFRESH_TOKEN` in Vercel (Production); redeploy; verify with `/api/qbo-test`.
- **Note:** NOT the Intuit questionnaire — that was completed and prod has been live since 2026-03-31 (docs reconciled 2026-06-10, commit 1a28fc4). Low priority per Drew (he does not invoice customers), but unpaid drafts pile up.

## Resolved

### 2026-05-05 — Molly Hensley (Nov 14 booking) underbilled $150 cleaning fee
- **Booking:** Acuity #1696694829 — Molly Hensley, Nov 14 2026, PV Full Day, "35 +" event guests
- **Was charged:** $1,030 (Full Day $980 + All Backdrops $50). Should have been $1,180.
- **Cause:** customer typed `"35 +"` in the participants field. `Number("35 +")` = NaN; the >=35/>=50 threshold checks silently failed. Buffer block also missed.
- **Code fix shipped:** `parseCount()` helper, `beforeinput` keystroke blocker, server-side cleaning-fee recompute in create-checkout.js. (Commits 299eaaa, 905dd03.)
- **Owner action:** Drew remediated directly with Molly (2026-05-05).
