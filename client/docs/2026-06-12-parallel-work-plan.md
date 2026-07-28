---
generated: 2026-06-12
source: wws-backlog-triage workflow (26 agents, 25 issues)
note: internal planning artifact — parallel work while #7 Twilio A2P is in review
---

# Parallel Work Plan

_A2P review is the only thing blocking #7. Everything below runs in parallel with zero dependency on that review._

---

## 1. Knock out now
Fully-implementable small wins, best-first.

1. **#35 Cleaning-fee → flat ≥35 auto** — Collapse the `>=50` / `>=35 && eventIntent` split to a single `>=35 → $150` in `booking-flow.js` `getCleaningFee()` + `create-checkout.js` (264-268), strip all "reach out to waive" + "2.5-hour buffer" copy (booking-flow.js 1193/1270/1307/1326/1356, notify-owner.js 194, acuity.js 282). **S.** Drew gets: a live, unambiguous cleaning-fee rule matching his 2026-06-11 decision.
2. **#17 "How did you hear about us?" field** — Clean zero-state feature: add `leadSource` to `state`, radio group in Step 3 of both booking HTMLs, handlers + `isStepComplete(3)` validation, thread through `create-checkout.js` → `buildAppointmentNotes()` (acuity.js) + `buildEmailBody()` (notify-owner.js). **S.** Drew gets: lead source on every Acuity appt note + owner email. (Note: this also unblocks F2/#19.)
3. **#31 Remove deprecated booking-callback path** — Delete the 29-line `api/booking-callback.js` stub, drop dead `createPaymentLink`/`deletePaymentLink` exports from `square.js`, fix stale "Called from booking-callback.js" comments (notify-owner.js:2, quickbooks.js:201), update CLAUDE.md + system-design-document.md. **S.** Drew gets: nothing visible — internal hygiene. (30-sec pre-check: confirm no alertFailure hits since 2026-05-19.)
4. **#10 Staging auto-deploy GitHub Action** — Write `.github/workflows/deploy-staging.yml` (push to `staging` → `vercel deploy --target=staging`). **S.** Internal dev win, not Drew-facing. **Blocked one step:** needs `VERCEL_TOKEN` added as a GH repo secret first (Andrew, one-time) — so write the YAML now, merge once the secret lands.

---

## 2. Research / plan deliverables to draft now
No Drew input required to produce any of these.

**Coupon cluster — do #29 FIRST, it unblocks #13/#14/#20 in one shot.**
- **#29 Square coupon-capability assessment** — Read Square Promotions/Discounts/Loyalty/Gift-Card API docs; answer the six capability questions (programmatic one-use codes, per-customer limits, location + **booking-date** scoping, non-stackable, expiry, "discount OR free-add-on" dual mode). Likely finding: native handles expiry/location/one-use but **not booking-date restriction** and **not dual-mode** → server-side fallback in `create-checkout.js`. Write `client/docs/square-coupon-feasibility.md`, update STATUS.md. **S.**
- **#13 C1 / #14 C2** are answered *by* #29 — don't scope them separately. C2's "free add-on up to $70" half almost certainly resolves to a second code or a $70 gift card (no native dual-mode discount type).
- **#20 Revenue-recovery** — also downstream of #29. The *parallel* piece here is the `GET /api/weekend-availability` endpoint spec (see Prototypes).

**Messaging cluster — #27 + #28 resolve together; B2/B3 wait on them.**
- **#27 Sub-daily scheduler brief** — Compare Vercel Pro ($20/mo) vs QStash (free tier, HTTP-delayed delivery, fits ~50 bookings/mo) vs Watson-side cron. Recommend **QStash** (no plan change, clean HTTP POST to a Vercel endpoint at a future timestamp — same pattern as CLAUDE.md's unpaid-appointment cleanup idea). **S.**
- **#28** is effectively already decided (Twilio for B1/B2/B3, documented revision-status.md:306) — see Verify & Close. State explicitly in the #27 brief: Twilio-in-review tips the scheduler toward QStash.
- **#12 B3 plan** — Draft `client/comms/2026-06-12-b3-implementation-plan.md`. Key insight: **email leg is unblocked today** via Resend's `scheduled_at` field (no external scheduler needed); only the SMS leg needs #27. Plan should split the problem and call out the static checklist-page stub as parallel work (see Prototypes).
- **#11 B2** stays `blocked-external` — its "add-on payment link" target is an undesigned open question for Drew. Don't draft a build plan yet.

**Legal**
- **#16 / #26 Finding 3 — D2 content-use permission** — Draft the new Waiver Section 13 + T&C clause (`client/comms/2026-06-12-d2-content-permission-draft.md`), plus a recommendation on opt-in checkbox vs baked-into-signature. Drafting needs no attorney; *shipping* needs the SC-attorney pass (#26). This becomes review material for that pass.

**Other research**
- **#36 Membership/recurring feasibility** — Fetch Square Subscriptions API docs, compare vs scheduled `chargeCardOnFile` MIT (we already store Customer ID + Card ID in Acuity notes). Document scheduler constraint (Hobby daily-cron + date check) + the list of product decisions Drew must make. `client/comms/2026-06-12-membership-feasibility-research.md`. **S.**
- **#18 F1 SEO plan** — `client/comms/2026-06-12-seo-plan.md` ranking the 10 fixes by effort×impact, then ship in one PR. Top wins: JSON-LD `LocalBusiness`/`PhotographyBusiness` on both location pages (zero native schema today), missing **H1 on index.html**, geo-keywords in powdersville/taylors-mill titles, canonical tags, trim 3 overlong meta descriptions (<155), sitemap lastmod. 100% in-repo, no Drew input.
- **#19 F2** — Draft the 5-source mapping doc (PostHog/GA4/GSC/GBP/UTMs) now, but the build is blocked on Drew access grants + GA4-vs-PostHog decision. Flag the **`POSTHOG_API_KEY` not set in Vercel Production** gap — server-side events silently no-op today (quick escalation regardless of F2 priority).

---

## 3. Prototype candidates
Dark proofs-of-concept worth standing up now.

- **`GET /api/weekend-availability` (#20)** — ~60 lines using the existing `acuityGet` helper + calendarID pattern. Accepts `?weekend=YYYY-MM-DD&location=…`, queries Sat/Sun appointments (7:30a–6:30p), returns booked vs open hours per the qualification logic. Watson-callable, no new deps, answers #20 questions 1 & 6 conclusively. Build it dark.
- **B3 email leg via Resend `scheduled_at` (#12)** — Prototype scheduling the end-of-session email at booking time (sessionEnd − 15 min). Ships the email half without waiting on the #27 scheduler decision. SMS leg follows once QStash lands.
- **Checkout/reset checklist static pages (#12)** — `/checkout-checklist-powdersville` + `/checkout-checklist-taylors-mill` static HTML stubs, so the B3 reminder link targets exist before the reminder fires. Andrew owns content entirely; no Drew input to stub.
- **UTM capture (#19)** — Self-contained add to `booking-flow.js`: read `utm_source/medium/campaign` on init, pass through to PostHog events + `create-checkout.js` metadata. Knock-out-able independently of the full F2 plan.

---

## 4. Blocked on Drew / external
Batch these to Drew as one message:

- **#8 QuickBooks re-auth** — "Visit https://whitewallstudios.co/api/qbo-auth and sign in with your Intuit account." (Then Andrew copies fresh tokens → Vercel Production `QBO_ACCESS_TOKEN`/`QBO_REFRESH_TOKEN`, redeploys. Already in escalations.md.)
- **#30 Acuity lighting price** — "In Acuity → Settings → Add-ons, change 'Lighting Package (2 Fixtures)' (ID 6723268) from $100 → $125." (Cosmetic — Square already charges $125; affects only Acuity/QBO internal reporting.)
- **#33 Cancel Squarespace** — "Before cancelling Squarespace, confirm whether Acuity Business is billed *through* Squarespace or independently — if bundled, cancelling kills the Acuity API key. Check squarespace.com → Billing and acuityscheduling.com → Subscription." ⚠️ Hard pre-check, do not cancel until confirmed.
- **#32 External booking links** — "Update Google Business Profile booking URL **and** Instagram bio link → https://whitewallstudios.co/book-powdersville." (Andrew drafts exact copy; needs Drew's platform logins.)
- **#26 Attorney sign-off** — "Engage an SC-licensed attorney to review T&C v2, Waiver v2, the $130/15-min clause, damage-notice step, and the new D2 content-use clause in one pass." (External; Pip's AI review is done.)
- **#11 B2** — "What should the post-booking 'add forgotten add-ons' payment link actually link to?" (Undesigned — no post-booking upsell checkout exists.)
- **#19 F2** — "Grant Andrew access to Google Search Console + Google Business Profile; and: GA4 alongside PostHog, or PostHog-only?"
- **#15 D1 Google Drive folders** — "Answer Q7 (safest per-client upload-folder approach), and have Watson stand up Drive OAuth/service-account." (Also downstream of #13 thank-you email.)

**Andrew-owned (not Drew), do today:**
- **#9 Acuity scheduler takedown** — Andrew has admin; disable public scheduling in Acuity → Scheduling Page settings. Sequence this **before** Drew repoints external links (#32) so there's no booking gap. Optional follow-on: delete the dead `schedulerUrl`/`fallbackSchedulerUrl`/`accountUrl` keys from booking-config.js (171-228).

---

## 5. Verify & close
- **#25 (A1 legal pre-req)** — **Close as done.** Entire scope live in production (PRs #42+#43, 2026-06-12); consent attestation + stored-credential disclosure verified live. GitHub state still OPEN despite board showing Done. Findings 3-5 belong to #16/#26, not here.
- **#28 (SMS provider)** — **Close as superseded.** Decision made: Twilio for B1/B2/B3 (`notify-customer-sms.js`, rationale in revision-status.md:306); Watson/BB stays owner-only; Acuity SMS rejected. Closing comment should point to #27 as the live B2/B3 blocker.
- **#22 (PR #2 functional testing)** — **Close as superseded.** "Zero testing" claim is stale — PRs #37-#43 exercised the full card-on-file chain end-to-end on staging and caught the >45-char idempotency-key prod bug. Remaining 3DS + iOS-Safari scenarios live in the cutover runbook under Drew's real-card preview step. Old `test-plan.md` covers the retired Payment-Link architecture — not the acceptance checklist.

---

## 6. Recommended first batch
Start these RIGHT NOW, in priority order:

1. **#35 cleaning-fee flat ≥35** — Real client-facing bug: the live site still shows "may reach out to waive" copy that contradicts Drew's explicit 2026-06-11 decision. Highest correctness value, fully spec'd, S. Worktree `worker/cleaning-fee-35-auto`.
2. **#29 Square coupon-capability research** — Single highest-leverage *unblock*: clears the gate on #13, #14, AND #20 at once. Pure doc research, no Drew, no account. Do this before any coupon code gets written.
3. **#17 "How did you hear about us?"** — Clean S feature, no dependencies, ships real value to Drew (lead attribution on every booking) AND unblocks F2/#19. Visible win to relay to the client.
4. **#18 SEO plan + PR** — Big invisible-to-user ROI (zero native JSON-LD, no homepage H1), 100% in-repo, one session, no Drew. Tangible deliverable while A2P sits in review.
5. **Close #25, #28, #22** — Five-minute hygiene; corrects three board-vs-GitHub status mismatches and shrinks the open-issue noise so the real backlog is legible.

_Quick wins to fold in opportunistically: #31 (dead-code cleanup) and #9 (Acuity takedown, Andrew-owned) are both S and dependency-free — slot between the above. Batch all Drew asks from §4 into one message so the external-blocked items move in parallel._