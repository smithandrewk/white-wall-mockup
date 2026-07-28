# Drew — two new dashboard tabs: lead-source tracking + coupon tracking

- **Source:** Gmail, thread `19f424228b20d389`  ·  **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Mon, 13 Jul 2026 13:41:17 -0400  ·  **Msg id:** `19f5c91dccb387e5`
- **Attachment:** `2026-07-13-drew-dashboard-attachments/drew-screenshot-2026-07-13.png`
- **Triage:** change-request (wws-dashboard). No money/architecture/legal/customer-scale gate → Foreman builds + ships. Read-only lenses over data the dashboard already ingests.

## VERBATIM
> Pip, take a look at this screenshot. Can we setup a tab on our dashboard that tracks this so we can see it live?
>
> Can we also setup a tab that says Coupon Tracking: where all coupon code are, and we can track when it's used, who used it, and the date/session it was applied to.

## What the screenshot shows
The dashboard's Watson AI chat ("Ask the data anything"). Drew asked: *"out of all the sessions we've had in the past 2 months, how many of them answered the question 'how did you hear about us' during booking. additionally, give me the quantity of each answer."*

Watson's answer: **38 of 108** sessions in the past 2 months answered (about 35%). Breakdown:

| Answer | Count |
|---|---|
| Friend / Referral | 14 |
| Other | 10 |
| Instagram | 9 |
| Google Search | 3 |
| Facebook | 1 |
| Drove by | 1 |

(non-canceled bookings at Powdersville + Taylor's Mill, staging excluded; the other 70 had no "Heard about us" line in their notes)

## The two asks
1. **Lead-source tab** — make that breakdown a LIVE tab (not a one-off Watson query): counts per answer + % of sessions that answered, over a time range.
2. **Coupon Tracking tab** — every coupon code, and per redemption: when it was used, WHO used it, and the date/session it was applied to.

## Data sources (both already ingested)
- Lead source: the booking site writes `Heard about us: X` into the Acuity appointment notes (`api/_lib/acuity.js` `buildAppointmentNotes`, from the required Step-3 "How did you hear about us?" select). The dashboard ingests Acuity notes → parse from there.
- Coupons: codes live in the dashboard (coupon API → prod Edge Config); redemptions are derived from `Promo code: X` in the Acuity notes (see `reconcile-redemptions.ts` + the redemption ledger).

## Disposition — SHIPPED + LIVE (dashboard PR #79, squash `58c84d7`)
Acked to Drew (`19f5cae6b7b3f6df`) → built → **deployed + confirmed LIVE** (`19f5cbb77c6af845`). Read-only lenses; no schema change, no booking-site change, Acuity/Square/QBO read-only invariant intact.

**1. Lead Source — `/stats/lead-source`** (new Stats sub-tab, after Clients & Repeat)
- `lib/stats/lead-source.ts` parses `Heard about us: X` out of `booking.notes` (it was ingested but never parsed) and aggregates by answer × location × year. Scope (Powdersville first) + year toggles; KPIs (sessions / answered / no-answer / top source); HBars chart; table with each answer's share of the answered set and of all sessions.
- **Verified against the LIVE DB — reproduces Watson's answer exactly:** past 2 months = **38 answered of 108**; Friend/Referral 14, Other 10, Instagram 9, Google Search 3, Facebook 1, Drove by 1.
- Coverage stated honestly in the UI: the question is newer than the booking history and direct-Acuity bookings never carry one, so all-time reads 38 of 2,556.

**2. Coupon Tracking — `/coupons/tracking`** (new Campaigns sub-tab)
- `lib/coupons-tracking.ts`: every code + times actually used (zero-use codes included), and the per-use ledger — who, when, and the exact session (booking ref/date/type/studio). Click a code to filter. Joins redemptions by CODE (`coupon_id` nullable) and resolves the person via `client_id` (`email_norm` is null on the ingest path). Staging excluded.
- Live data: **21 codes, 3 redemptions, 18 never used** — incl. SWITCH20 (TM→Powdersville convert code) used by Lindsey Thorne, $54 off WW-2797.

**Verification:** `npm run build` passes; **98 unit tests pass**; both routes 200 against the live `wws` Postgres on a non-prod port, then 200 on prod `:18794` after `launchctl kickstart`; screenshotted both tabs; zero console errors.
**Bug caught in review:** `usd()` takes DOLLARS not cents — the discount totals were rendering **100× too high** ($11,400 instead of $114). Fixed + re-verified before merge.
