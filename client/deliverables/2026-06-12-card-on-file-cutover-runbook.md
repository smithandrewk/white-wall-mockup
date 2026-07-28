# Card-on-File Production Cutover — Runbook

**Prepared:** 2026-06-12 · **Status:** PREP COMPLETE — not yet executed
**Cutover branch:** `cutover/card-on-file-prod` (off `main`, staging merged, verified)
**What it does:** replaces the production booking flow (old Square Payment Link redirect) with the card-on-file flow (Web Payments SDK → inline charge → save card → appointment).

---

## ⛔ Go-live blockers (must clear before executing)

1. ✅ **`SQUARE_APPLICATION_ID` set in Production** = `sq0idp-SvWwEb8uxNSXD9Ze-a4u4Q` (2026-06-12). Prod access token also refreshed; **validated read-only** against Square production API — token works, location `L6BM453HYK8Y2` ("WhiteWall Flagship") matches `SQUARE_PROD_LOCATION_ID`.
2. ✅ **`SQUARE_ENVIRONMENT` is already `production`** in the Production scope (set ~71 days ago). **No flip needed — but read the ⚠️ below.**
3. ⏳ **Licensed SC attorney sign-off** on the T&C / waiver / charge language (Gate 2). AI review + Findings 1–2 done; human sign-off still required before real charges. *(Drew)*
4. ⏳ **Drew real-card preview test** passes (see below).

> ⚠️ **Critical sequencing note (changed by finding #2).** Because `SQUARE_ENVIRONMENT` is *already* `production` in the prod scope, **the moment PR #43 merges to `main`, the live site charges REAL cards** — there is no sandbox safety net on prod and no separate "flip" step to stage it. Therefore: **Drew's real-card test MUST happen on a preview deployment first, and PR #43 must NOT merge until that passes + attorney signs off.** The only remaining Andrew-side work is done; the two open blockers are both Drew's.
>
> **Doc-reconciliation flag:** STATUS.md / CLAUDE.md (as of 2026-06-05) state the prod custom flow runs Square *sandbox*. The live Vercel prod env says `production`. The old Payment Link flow is still what's deployed on `main`, and real bookings route through Drew's direct Acuity scheduler — so it's unlikely real charges have occurred — but Drew should confirm no unexpected Square charges, and the docs should be reconciled.

---

## Pre-flight — confirm Production env (these power the *real* notifications, unlike staging)

On prod the flow is NOT suppressed — the first real booking sends real emails/SMS and writes a real Acuity appointment. Confirm in the Production scope:

| Var | Needed for | Note |
|---|---|---|
| `SQUARE_APPLICATION_ID` | card iframe | ✅ set (`sq0idp-SvWwEb8…`) 2026-06-12 |
| `SQUARE_ENVIRONMENT=production` | real charges | ✅ already `production` (see ⚠️ above) |
| `SQUARE_PROD_ACCESS_TOKEN` / `SQUARE_PROD_LOCATION_ID` | charge/save | ✅ set + token validated (loc `L6BM453HYK8Y2`) |
| `BOOKING_SECRET` | HMAC | confirm set |
| `RESEND_API_KEY` / `NOTIFICATION_EMAIL` / `CLEANER_EMAIL` | owner/customer/cleaner email | confirm set (real emails WILL send) |
| `OWNER_PHONE` / `WATSON_*` / `BLUEBUBBLES_PASSWORD` | owner SMS | confirm set |
| `POSTHOG_API_KEY` | analytics | optional |
| `QBO_*` | auto-mark-paid | ⚠️ refresh token stale (escalation) — QBO mark-paid will fail until re-auth; not a card-on-file blocker, drafts pile up unpaid |

> The card-on-file Square code already switches to prod token/URL/location when `SQUARE_ENVIRONMENT=production` (`api/_lib/square.js`). The STAGING isolation is inert on prod (no `STAGING=1`), but its `calendarID` hardening still applies — which **fixes the latent prod misroute** PR #2 originally had.

---

## Go-live sequence (execute in order)

1. **Set `SQUARE_APPLICATION_ID`** (`sq0idp-…`) in Vercel **Production**.
2. **Drew real-card preview test** — deploy `cutover/card-on-file-prod` to a Vercel **preview** with prod env (`SQUARE_ENVIRONMENT=production`). Drew books a real low-cost slot (e.g. 1-hr PV) with his own card. Verify:
   - card charges (his statement), appointment appears on the **real** Powdersville calendar, confirmation email arrives
   - saved card visible in Square Dashboard → Customers → Drew → Cards on file
   - Drew can charge the saved card a token amount from the Square Dashboard
   - **then refund + cancel** the test (Square Dashboard + Acuity)
3. **Flip `SQUARE_ENVIRONMENT=production`** in Production scope (if not already for the preview test).
4. **Merge `cutover/card-on-file-prod` → `main`** → Vercel auto-deploys production.
5. **Smoke-check prod:** `https://whitewallstudios.co/api/booking-public-config` returns the **prod** App ID + `https://web.squarecdn.com/...` SDK URL (not sandbox); load `/book-powdersville`, confirm the real card field renders.
6. **Monitor first 2–3 real bookings** + Vercel logs for 24h. Watch for: `create-checkout` 200s, appointments on the correct calendars, emails sending.
7. **Take down the direct Acuity scheduler URL (#9)** — repoint GBP / Instagram booking links to `/book-powdersville` so every booking saves a card.

---

## Rollback (kill switch)

- **Fastest:** Vercel → Deployments → **promote the previous production deployment** (~30s). Reverts to the old Payment Link flow.
- **Or:** revert the merge commit on `main` and push (auto-deploys).
- Either way, in-flight Square charges are unaffected; the old flow resumes.

---

## What changes for customers at go-live

- Checkout happens **on whitewallstudios.co** (no redirect to Square's hosted page).
- A card is **saved on file**; the consent checkbox requires cardholder attestation.
- Instagram is now **optional**; the "I'll read the confirmation email" checkbox is **required** (Drew's call).
- Post-session charges (damage / $130-15min late / cleaning / unauthorized add-ons) can be billed to the saved card from the Square Dashboard.

---

## Verification already done (staging, against real Square sandbox)

Happy path · merchant-initiated charge · declined card · idempotency dedup · auto-refund capability — all passed. Full chain verified on Acuity appointment notes (STAGING calendar, stamp, sink, saved card, payment, consent proof). The one production-breaking bug (idempotency_key >45 chars) was caught here and fixed.

**Not yet tested (do during Drew's real-card preview):** 3DS challenge UX, iOS Safari card iframe.
