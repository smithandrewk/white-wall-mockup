# White Wall Studios — Engagement Status & Strategy

_Assessment date: 2026-06-05. Generated from a full read of `client/comms/`, `api/`, `vault/`, `client/revision-status.md`, GitHub issues #4–#20, and the memory knowledge base._

---

## Timeline

```
[2026-03-04] Engagement kicks off — Squarespace → Vercel migration scoped; Drew delivers specs via PDF + video walkthroughs + Drive photo assets
[2026-03-14] Standing directive codified: Powdersville first everywhere (never reverse without explicit instruction)
[2026-03-20] Square/Acuity architecture locked after multi-day research: Pay → Book via Square Payment Links (Acuity payment page rejected — premature emails, no add-on passthrough, broken mark-paid endpoint)
[2026-03-31] QBO sandbox auto-mark-paid verified end-to-end; pre-launch checklist drained
[2026-04-01] Site live on whitewallstudios.co — but custom booking flow runs Square SANDBOX, not production
[2026-05-05] Site delivered + invoiced ~$3.2K paid ($2K + $1.2K); enters post-delivery revision phase; 7 free refinements + Molly Hensley underbilling fix
[2026-05-11] Drew's high-impact email: new 19-point T&C + 12-section waiver + card-on-file requirement
[2026-05-18] PR 1 (T&C v2 + waiver v2 copy swap) merged + live in production
[2026-05-19] PR 2 (card-on-file via Square Web Payments SDK) code-complete — UNVERIFIED, blocked on Square Application IDs
[2026-05-21] Staging environment stood up: staging.whitewallstudios.co, sandbox Square, dedicated STAGING calendar 14110701, suppressed notifications, banner, noindex
[2026-05-22] PRODUCTION INCIDENT — Lisa Brantly TM booking misrouted to STAGING calendar (Acuity multi-calendar default); fixed ~20 min (c7a4749) + broader audit (e48ba94); rule codified: always pass calendarID
[2026-05-22] Drew + Max deliver 4-phase / 11-item wishlist (A1 card-on-file → F2 analytics), mapped to GitHub issues #4–#19
[2026-05-25] Revenue-recovery campaign spec (#20): Watson-driven weekend last-minute discounting, 10 open platform questions

Site is live, delivered, and paid (~$3.2K), but the custom booking flow is NOT yet
taking real money — Square remains in SANDBOX and PR #2 (card-on-file) is unverified
and blocked. Real bookings currently flow through Drew's still-live direct Acuity
scheduler, which works but saves no card-on-file. The engagement has shifted from
polish into a scoped 11-item / 4-phase feature roadmap led by the card-on-file critical path.
```

---

## Strategy

**Where it stands.** The site is delivered, live on whitewallstudios.co, and paid (~$3.2K across two invoices). Since 2026-05-22 the engagement is no longer ad-hoc polish — it is a scoped 11-item, 4-phase roadmap (Drew + Max) tracked as GitHub issues #4–#20, with **card-on-file (A1 / #4) as the critical path** that gates the Phase 1 messaging automations.

**The single most important production-safety gap — VERIFIED, HIGH confidence.** The custom whitewallstudios.co booking flow **cannot take real money.** `SQUARE_ENVIRONMENT=sandbox` is the value in every canonical source of truth: `vault/Credentials & Accounts.md`, `vault/Square.md`, `CLAUDE.md`, and the live code (`api/_lib/square.js` routes to `connect.squareupsandbox.com`). The earlier claim that "Square production was verified via real paid bookings (Angela Anderson, Molly Hensley)" is **rejected** — those are real _Acuity_ appointments pulled read-only for cleaning-fee audits, not production Square charges through the custom flow. Net effect: every real dollar today flows through Drew's still-live **direct Acuity scheduler URL** (Acuity's separate Square connection), which works but saves no card-on-file and bypasses the custom UI.

**Biggest risks.**
1. **PR #2 card-on-file has had ZERO functional testing** and is blocked on two unset public Square Application IDs in Vercel — a cheap unblock hiding real verification risk (10 untested scenarios, 3DS UX, iOS Safari iframe, SearchCustomer dedup, the $0 CreateCard pending-charge unknown).
2. **Acuity URL takedown (#9)** is a hard prerequisite for card-on-file to actually protect the business — until it executes, customers route around the card-on-file guarantee. Drew confirmed this in the 2026-05-11 email but never executed it.
3. **Vercel function-timeout risk** on the new ~5-call `create-checkout` chain on the free 10s tier.
4. **Pip's legal review** of T&C v2 + waiver v2 (and the new post-booking charges language) is still pending before production cutover.

**Highest-leverage next 3 moves.**
1. Set `SQUARE_SANDBOX_APPLICATION_ID` + `SQUARE_APPLICATION_ID` in Vercel, deploy PR #2 to preview, and run the 10-scenario sandbox suite — this unblocks everything downstream. _(Andrew)_
2. Get Drew to (a) greenlight the card-on-file budget and (b) take down the direct Acuity scheduler URL (#9) — both pure Drew decisions blocking the critical path.
3. Execute the production cutover sequence: Pip legal review → Drew real-card preview test → swap to production Square tokens + `SQUARE_ENVIRONMENT=production` → merge PR #2 → 24h monitoring with rollback ready. Only after this is the site actually taking money on its own infrastructure.

---

## Production-Readiness Checklist

| Item | Status | Owner |
|---|---|---|
| Custom 5-step booking UI (T&C v2 + waiver v2, both locations) | ✅ done | Andrew |
| Acuity appointment creation with multi-calendar calendarID safeguard | ✅ done | Andrew |
| Resend email notifications (owner + customer + cleaner .ics + failure alerts) | ✅ done | Andrew |
| PostHog server-side analytics | ✅ done | Andrew |
| Cleaning-fee logic ($150 auto at 35+/50+, 2.5hr buffer block, both locations) | ✅ done | Andrew |
| Staging environment (isolated sandbox, STAGING calendar, mock fail-safe) | ✅ done | Andrew |
| PR 1: T&C v2 (19-point) + Waiver v2 (12-section) live in production | ✅ done | Andrew |
| **Square PRODUCTION cutover** (custom flow cannot take real money until done) | 🔴 blocked | Andrew |
| **PR #2: set public Square Application IDs in Vercel** | 🔴 blocked | Andrew |
| PR #2: 10-scenario sandbox functional test (zero testing so far) | 🟡 pending | Andrew |
| PR #2: Drew real-card preview test on production Square | 🟡 pending | Drew |
| PR #2: merge to main + 24h production monitoring with rollback plan | 🟡 pending | Andrew |
| Card-on-file budget greenlight (~3–7 hrs) | 🔴 blocked | Drew |
| Take down direct Acuity scheduler URL (#9) | 🔴 blocked | Drew |
| Pip legal review of T&C v2 + Waiver v2 + charges language before cutover | 🔴 blocked | Drew |
| Vercel function-timeout mitigation on create-checkout | 🟡 pending | Andrew |
| Watson SMS Cloudflare Tunnel + CF Access service token (#5) | 🔴 blocked | Watson |
| Acuity lighting add-on price sync (6723268: $100 Acuity vs $125 site) | 🟡 pending | Drew |
| Mobile Safari end-to-end booking verification (T15) | 🟡 pending | Andrew |
| QuickBooks production OAuth (Intuit questionnaire; low priority) | 🔴 blocked | Andrew |
| Staging auto-deploy routing quirk (#10; workaround exists) | 🟡 pending | Andrew |
| Squarespace subscription cancellation (final cleanup) | 🟡 pending | Drew |

---

## Critical Path (dependency-ordered)

**Gate 0 — Drew-side decisions (start now, long lead time):** #9 scheduler takedown + external-link repoint · SMS provider + sub-daily scheduler decisions · kick off Pip attorney review.

**Gate 1 — Ship card-on-file (Production Go-Live):** set Square App IDs → fix create-checkout timeout headroom → 10-scenario sandbox test → Drew real-card test → merge PR #2 → Square production cutover → 24h monitored rollout.

**Gate 2 — Phase 1 messaging:** #5 Watson CF tunnel → #7 B1 confirmation SMS → #11 B2 + #12 B3 (need scheduler) → #6 trigger narrowing.

**Gate 3 — Phase 2 retention:** run the Square coupon-capability check ONCE (unblocks #13/#14/#20) → C1 → C2 → D1 Drive folder.

**Gate 4 — Phase 3 legal + attribution:** #16 D2 content-permission (post-Pip) · #17 E1 lead-source field _(low-effort, unblocked today — pull forward as a quick win; it also feeds F2)_.

**Gate 5 — Phase 4 growth (net-new billable, lowest urgency):** #18 F1 SEO · #19 F2 reporting (consumes E1) · #8 QBO auto-mark-paid.

> **The one bottleneck to resolve early:** the Square coupon-capability check. Three separate issues (#13, #14, #20) silently depend on it.
