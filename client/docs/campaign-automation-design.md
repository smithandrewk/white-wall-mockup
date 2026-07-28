---
title: White Wall — Automated Campaign Engine (Design)
generated: 2026-06-14
source: campaign-engine-design workflow (5 agents) — grounded in Drew 2026-05-25 revenue-recovery spec
status: design / not yet built — foundation (coupon CRUD + Edge Config + campaign scaffold) is live
---

# White Wall — Automated Campaign Engine

> Build-ready design for the weekend revenue-recovery system. Engine lives in the **wws-dashboard** repo (`/Users/pip/code/wws-dashboard`), runs on the Mac mini's launchd cron, mints coupons through the existing Edge Config pipeline, and sends through Resend. Source spec: `/Users/pip/code/white-wall-mockup/client/comms/2026-05-25-drew-email-revenue-recovery.md`.

---

## 1. Vision

Drew loses money on quiet weekend slots that go empty because nobody knows they're open. His own fix — "Last-Minute Email Discounts" — is a weekly ritual: check which studio/day buckets are soft, mint a discount code, blast the past-customer list, and watch bookings recover. He does not want this to be a standing "10% off weekends" program that trains customers to wait; he wants it to feel like a **rare, last-minute offer**, and he wants final say on every send. The spec is explicit and load-bearing: *"Not automatic. Watson texts Drew a full summary and waits for approval."*

So the engine **auto-generates and forecasts, but never auto-sends.** Every Tuesday (and Friday for escalation) the mini runs a deterministic qualification pass over Acuity availability, an AI pass that judges whether each soft bucket is *worth* a discount, drafts the coupon codes and the email copy, and then **stops** at a `proposed` campaign that waits for Drew. Drew approves in the dashboard or by replying to a text. Only a human-authenticated approval flips the campaign to `approved` and fires the coupon-mint → Edge Config push → Resend blast.

The dashboard is built around making that approval moment fast and trustworthy. A **Weekend Radar** shows the next six weekends greyed-out with live countdowns to when each will be analyzed; a **Needs You** card mirrors exactly the text Drew gets; and the email **preview is the email** — one React Email template rendered through one function to both Resend and a sandboxed iframe, so what Drew approves is byte-for-byte what the customer receives. The whole system reuses what already exists (coupon CRUD, Edge Config sync, `campaign`/`campaign_recipient` schema, Resend, the Watson SMS bridge, the redemption-via-ingest pipeline) and adds only the automation engine, the AI layer, and the approval UI on top.

---

## 2. Grounded in Drew's Spec

### 2a. Qualification logic (deterministic — never AI)

- **Days:** Saturday and Sunday only. Friday is excluded from analysis (it's the escalation trigger, not a bucket).
- **Window:** 7:30 AM – 6:30 PM ET, both locations (Acuity tz `America/New_York`). 11 usable hours.
- **Threshold (both must hold):** `booked_hours < 5` **AND** `open_usable_hours ≥ 4`.
- **No minimum session length** — a 1-hour opening counts.
- **Four independent buckets per cycle:** FS-Sat, FS-Sun, TM-Sat, TM-Sun (FS = Flagship/Powdersville, calendar `6255578`; TM = Taylor's Mill, calendar `6252295`). Each qualifies or fails on its own.
- **Source of truth:** Acuity. The local `booking` table mirrors it within ~60 min via the hourly poll — close enough for the Tue→weekend window, but see the **padding gotcha** in §5d.

### 2b. Coupon rules (deterministic)

- **Code pattern:** `{STUDIO}-{DAY}-{MON}{DD}-{DISCOUNT}` — e.g. `FS-SAT-JUN20-25`, `TM-SUN-JUN21-50`. New codes every weekend (date is embedded → single-weekend by construction, not reusable later).
- **Scope:** raw studio time on **new bookings only**. Not add-ons, cleaning fees, equipment, other services, existing/past bookings, or out-of-window weekends. (Matches how `/coupons` already discounts only the session line item.)
- **One use per customer:** enforced by `code + customer email` at checkout against `coupon_redemption`. Requires a new `max_per_email` column (§5e).
- **Non-stackable:** checkout honors at most one valid coupon per order (already the rule).
- **Expiry:** **purchase-time cutoff of Sunday 12:00 PM ET** — the code must be *entered* before noon Sunday, regardless of when the session runs. A Sunday-evening session booked at 11:50 AM Sunday is valid.
- **Post-launch fills:** discounted bookings keep being accepted even if the studio climbs back above 5 booked hours after the campaign sends.

### 2c. What stays human-approved (the hard gate)

| Drew said **automate** (no approval) | Drew said **keep human-in-the-loop** |
|---|---|
| Availability analysis (Acuity query + threshold math) | **Every send decision**, Tue and Fri — "Not automatic… waits for approval" |
| Coupon-code generation (deterministic) | **Scope edits** — "EDIT with changes" lets Drew reshape before firing |
| Campaign draft + summary text to Drew | **Skip** — "NO to skip" |
| The Resend blast — **but only after Drew replies YES** | |
| Friday re-analysis + analytics delta | |

There is **no auto-send path under any condition** — no timeout-auto-approve, no send-in-Drew's-absence. Architecturally, the AI's terminal state is always `proposed`; coupon-mint and send are gated on `status === 'approved'` set by a human-authenticated action (Cloudflare Access already gates the dashboard; SMS approval is HMAC-token'd — §3c).

### 2d. Audience & exclusions

- **Channels:** email + text to the same list.
- **Exclude:** already booked that weekend, unsubscribed, do-not-contact, "problem customers."
- **Already-booked customer-facing copy (verbatim, mandatory in the email):** *"Already booked? You're all set with the time you chose. This last-minute offer is only for new bookings and cannot be applied to existing reservations."*
- Two items Drew left open and flagged for Andrew (decisions, not requirements): auto-excluding already-booked customers, and running approval through Watson replies. Both are answered by this design (yes, and yes — §3, §6). **List source remains the one true pending decision for Drew** — see §8.

### 2e. Analytics Drew named (for the Friday escalation)

Bookings created since Tuesday · coupon usage (which codes/studios redeemed) · email opens/clicks · text response/click rate · revenue attributed. All map onto `campaign_recipient`'s funnel columns + `coupon_redemption`.

---

## 3. Architecture — propose → approve → send → measure

```
            ┌───────────────────────── THE MAC MINI (launchd) ─────────────────────────┐
            │                                                                            │
  Tue 8 AM  │  co.entrpy.wws-campaign-tuesday.plist → run-campaign.sh tuesday           │
  Fri 8 AM  │  co.entrpy.wws-campaign-friday.plist  → run-campaign.sh friday            │
  (Thu fc)  │  co.entrpy.wws-campaign-forecast.plist → run-campaign.sh forecast         │
            │            (clones co.entrpy.wws-poll.plist's StartCalendarInterval shape)│
            └───────────────────────────────────┬────────────────────────────────────────┘
                                                 │
   ┌─────────────────────────────────────────────▼──────────────────────────────────────┐
   │ lib/campaigns/qualify.ts   (DETERMINISTIC — Postgres + Acuity, no LLM)              │
   │   → BucketAnalysis[] for FS-Sat / FS-Sun / TM-Sat / TM-Sun                          │
   │ lib/campaigns/audience.ts  (DETERMINISTIC SQL — exclusion anti-joins)               │
   │ lib/campaigns/ai.ts        (Opus 4.8 proposal + copy; Haiku 4.5 safety pre-screen)  │
   └─────────────────────────────────────────────┬──────────────────────────────────────┘
                                                 │   writes campaign + campaign_bucket
                                                 ▼   + campaign_recipient (status=proposed)
   ┌────────────────────────────────────────────────────────────────────────────────────┐
   │ APPROVAL  (human gate — nothing past here without an authenticated YES)             │
   │   • Dashboard /campaigns/[id]  → Approve & schedule / Edit / Skip                   │
   │   • Watson SMS  → "Reply YES / NO / EDIT"  (HMAC link or reply webhook)             │
   └─────────────────────────────────────────────┬──────────────────────────────────────┘
                                                 │  status → approved
                                                 ▼
   ┌────────────────────────────────────────────────────────────────────────────────────┐
   │ SEND   parseCouponBody() → coupon rows → syncCouponsToEdgeConfig() (existing path)  │
   │        → Resend batch send → stamp campaign_recipient.sent_at                       │
   │        status → sent · scheduled_for honored                                        │
   └─────────────────────────────────────────────┬──────────────────────────────────────┘
                                                 ▼
   ┌────────────────────────────────────────────────────────────────────────────────────┐
   │ MEASURE                                                                              │
   │   opens/clicks → Resend webhooks → opened_at / clicked_at                           │
   │   redemptions  → hourly Acuity ingest parses notes → coupon_redemption → redeemed_at│
   │   revenue      → matched booking.list_price (raw studio time)                       │
   │   Fri delta + post-mortem → Opus 4.8 narrative                                      │
   └────────────────────────────────────────────────────────────────────────────────────┘
```

**Why the mini, not Vercel:** Vercel Hobby crons are daily-only. The mini already runs `co.entrpy.wws-poll.plist` hourly via launchd, which natively supports `StartCalendarInterval` (Weekday + Hour). The Tue-afternoon / Fri-morning cadence Drew specified is only buildable here. The two new plists source `poll.env` and call a `run-campaign.sh` exactly like the poller.

**Coupon push:** on approval, the engine calls the existing `parseCouponBody` + `POST /api/coupons` write-path (validation, normalization, Edge Config push are already atomic and battle-tested) — campaigns are an automated coupon factory + audience + send, nothing more on the coupon side. `syncCouponsToEdgeConfig` is fired best-effort post-insert, same as the CRUD routes.

**Send channel:** Resend, same raw-`fetch` pattern as the booking site's `notify-owner.js` (`RESEND_API_KEY` already in env). Batched, one `campaign_recipient` row stamped per recipient.

**Engagement tracking (closing the funnel):**
- **Sent/Delivered** — Resend send response + delivery webhook.
- **Opened** — Resend open-tracking pixel → `email.opened` webhook → `opened_at`.
- **Clicked** — per-recipient booking link `?utm_campaign=<id>&r=<recipient_id>` → a thin dashboard redirect endpoint stamps `clicked_at`, 302s to `/book-powdersville` (Powdersville first).
- **Redeemed** — *already wired.* The hourly ingest parses coupon codes from Acuity booking notes into `coupon_redemption` (migration 0007). Join `coupon_redemption.code → campaign.coupon_code` and redeemer email → `campaign_recipient.email_norm` to stamp `redeemed_at` + `booking_id`. **This is the single highest-value wiring task and it reuses an existing pipeline.**

---

## 4. The AI Layer

**Governing principle: AI never touches money, calendars, or the send button.** The split is structural, not a guideline:

- **Deterministic code owns:** reading availability, the `<5 / ≥4` math, coupon minting, the exclusion query, Edge Config push, the Resend send, redemption attribution.
- **Claude owns: judgment and language only** — whether a soft bucket is *worth* a campaign, prioritization, the email copy, the approval summary, the post-mortem. Its output is always a `proposed` row that waits.
- **Fail-safe:** if the Anthropic API is down, the engine still qualifies weekends and falls back to a templated email. Claude is an enhancement layer, never a hard dependency in the money path — mirroring the existing `booking-callback` staging-mock fail-safe.

**SDK:** add `@anthropic-ai/sdk` (TypeScript) to the dashboard — no Anthropic dep exists there yet. `ANTHROPIC_API_KEY` as a dashboard env var (the project's no-hardcoded-keys rule applies). Models: `claude-opus-4-8` for judgment/copy/narrative, `claude-haiku-4-5` for the cheap safety pre-screen. Use **adaptive thinking** (`thinking: {type: "adaptive"}`) and `output_config: {effort: "high"}` on the Opus calls. Structured output via `output_config: {format: {type: "json_schema", schema: …}}` (supported on Opus 4.8). The whole engine runs **8×/month** (Tue + Fri × 4 buckets) — cost is cents; quality is the point. Do not downgrade the judgment calls to Haiku.

### 4a. Proposal — deterministic gate, AI framing

`qualify.ts` produces the read-only facts:

```ts
type BucketAnalysis = {
  location_id: string;       // Acuity calendarID — ALWAYS pass calendarID (Lisa Brantly rule)
  date: string;              // YYYY-MM-DD (ET)
  bookedHours: number;
  openUsableHours: number;
  openWindows: { start: string; end: string }[];
  qualifies: boolean;        // bookedHours < 5 && openUsableHours >= 4
  proposedCode: string;      // FS-SAT-JUN20-25 — minted deterministically
  expiresAt: string;         // Sunday 12:00 PM ET
};
```

The deterministic gate tells you *which* buckets qualify. It does **not** tell you whether a bucket is *unusually* weak or just normal-quiet — and firing a discount on a chronically-soft Sunday trains customers to wait, the exact failure Drew warned against. So Claude gets two inputs: this weekend's `BucketAnalysis[]`, and **8 weeks of the same four buckets' booked-hours history** (cheap Postgres query against `booking` — 2,574 rows back to 2021). It returns a structured prioritization:

```jsonc
{
  "weekend_summary": "string — 2-3 sentences; the headline for Drew's approval text",
  "buckets": [{
    "location_id": "string",
    "date": "string",
    "recommend_campaign": "boolean",          // CAN be false even when qualifies=true
    "priority": "integer",                     // 1 = lead with this (Powdersville first on ties)
    "weakness_verdict": "unusually_weak | normal_quiet | borderline",
    "weakness_reason": "string — grounded ONLY in the provided history numbers",
    "suppress_reason": "string|null"           // set when recommend=false despite qualifying
  }],
  "combine_into_single_email": "boolean",       // Drew allows combining FS + TM
  "recommended_discount_pct": "integer"         // clamped in code to {25, 50}
}
```

Key safety levers:
- **No availability number is ever generated by the model.** Every figure Claude states traces to `BucketAnalysis`; the prompt says use them verbatim. This is the biggest factual-safety move.
- **`recommend_campaign` can be `false` while `qualifies` is `true`** — the AI's real value ("eligible, but skip it, this Sunday is always like this"). Drew sees it in the approval text and can override.
- **The model cannot flip `false→true` past the gate.** Code drops any `recommend_campaign:true` on a non-qualifying bucket before it ever reaches a coupon.
- **Discount is clamped in code** to `{25 on Tue, 50 on Fri}` — the model is *told* the discount as a fact, it cannot choose it.

### 4b. Email copy generation

One Opus call per approved campaign (or per combined email). Cache-optimized per the prefix-match rule:

1. **Frozen system prompt (cached):** WhiteWall brand voice + hard rules + 2–3 few-shot examples of approved copy (warm, peer-to-peer photographer voice — the "Fernando-style" thank-you register from the wishlist, not corporate-promo). No interpolated dates/codes here, so the cache hits across all 8 monthly calls and both locations. `cache_control: {type: "ephemeral"}` on the last system block.
2. **Frozen format spec (cached):** the output schema.
3. **Volatile user turn:** this weekend's grounded facts — exact code, exact pct, exact `expiresAt`, the `/book-powdersville` or `/book-taylors-mill` link, open-window summary, qualifying buckets.

Output schema (these fields become the React Email props):

```jsonc
{
  "subject_variants": [ {"label":"A","text":"…"}, {"label":"B","text":"…"} ],  // for A/B, §4d
  "preheader": "string",
  "body_html": "string",
  "body_text": "string",                 // plaintext alt — deliverability
  "already_booked_block": "string",      // MUST contain Drew's verbatim sentence
  "cta_label": "string",
  "self_check": {                        // model echoes back what it actually wrote
    "discount_pct_stated": "integer",
    "code_stated": "string",
    "expiry_stated": "string"
  }
}
```

### 4c. Guardrails — layered, code wins

- **Self-check assert:** code asserts `self_check.discount_pct_stated === campaign.percent_off`, `self_check.code_stated === campaign.coupon_code`, `self_check.expiry_stated === expiresAt`. Mismatch → reject + regenerate (or escalate to Drew as "AI copy failed validation"). Catches the one failure that matters — email promising a different number than the coupon enforces — without a human reading every word.
- **Mandated legal sentence:** code does a substring assert that `already_booked_block` contains Drew's verbatim already-booked copy. Not present → reject. Same paper-trail discipline as the change-request protocol: the legal copy is the record, not a paraphrase.
- **Discount clamp:** even if the model emits 60, code overwrites with the campaign's actual `percent_off` before send.
- **Scope discipline:** prompt states raw-studio-time-only; the coupon itself enforces it (session line only — already how `/coupons` works).
- **Haiku pre-screen (§4e item 5):** an independent second model checks brand-safety + the four required facts before anything reaches Drew.

Four layers before a discount ships: **Opus writes → Haiku checks → code asserts → Drew approves.**

### 4d. Subject-line A/B + auto winner

Opus returns 2 subject variants. On send, `campaign_recipient` rows split 50/50 (or, on a small list, a 20% holdout test then the winner to the remaining 80% an hour later — the cron can stagger the send). Winner = higher open rate, read from `opened_at`. The post-mortem reports which won and why, so Drew builds intuition over time.

### 4e. Extras worth doing (Drew didn't ask, would love)

1. **Predictive underbooking forecast (Thursday-for-next-weekend).** Looks at booking velocity vs. same-week-historical and warns Drew *early*: "Next weekend's Flagship Saturday is filling 40% slower than usual — you'll likely want a campaign Tuesday." Lets Drew drum up bookings the cheaper way (a social post) before resorting to a discount. Powers the greyed Radar forecast. `claude-opus-4-8`.
2. **Cannibalization guard** (Opus check in the proposal): "would this booking likely happen at full price anyway?" If a bucket has strong forward-booking momentum despite a momentary dip under 5 hours, flag *don't discount*. Protects margin — the thing Drew most cares about.
3. **Post-campaign AI summary** (Opus, after Sunday-noon expiry): reads the funnel + attributed revenue and writes Drew a plain-English readout — *"FS-Sat 25% recovered $340 across 3 bookings; 22% open, subject B won; the Sunday code went unused — consider skipping FS-Sun next time."* This *is* the Friday analytics Drew asked for, now generated not hand-assembled, and it feeds next week's proposal smarter.
4. **Cheap Haiku safety pre-screen** (LLM-judge): structured pass/fail on (a) verbatim already-booked sentence present, (b) discount ≤ approved pct, (c) correct code, (d) on-brand tone. `claude-haiku-4-5`.

---

## 5. Data Model

Existing schema is the right shape — **no rebuild.** `campaign` (status lifecycle + `proposed_at/approved_at/sent_at`) and `campaign_recipient` (the `sent→opened→clicked→redeemed` funnel timestamps) map directly onto Drew's spec, and `coupon`/`coupon_redemption` (migrations 0004/0007) handle minting + attribution. The additions are all in one additive migration.

### 5a. `0008_campaign_lifecycle.sql` (additive — extends, doesn't replace)

On `campaign`:
- `forecasted_at timestamptz` — when the engine first *predicted* qualification (drives the greyed Radar).
- `scheduled_for timestamptz` — the planned send timestamp (**drives every UI countdown**).
- `measured_at timestamptz` — post-mortem complete.
- `sent_payload jsonb` — the exact React Email props snapshot at send, so a historical campaign re-renders as it actually went out even if the template later changes.
- `parent_campaign_id uuid` — links a Friday 50% escalation to its Tuesday 25% parent (the threaded pair).
- `subject_variant_a text`, `subject_variant_b text`, `winning_variant char(1)` — A/B.
- `body_html text`, `body_text text`, `preheader text` — the generated copy (schema currently has `subject` only).
- `ai_rationale jsonb` — the proposal's per-bucket verdicts/reasons, shown in the explainer popover.

Extend the `status` enum to the full lifecycle:
```
forecasted → proposed → approved → scheduled → sent → measured → (expired | skipped)
```
(`draft` from the scaffold is superseded; the new set covers it.)

### 5b. `campaign_bucket` (new table)

One row per (campaign, studio, day) — the 4 buckets per weekend the Radar renders:
`campaign_id`, `location_id`, `target_date`, `booked_hours`, `open_usable_hours`, `open_windows jsonb`, `qualifies bool`, `recommend_campaign bool`, `weakness_verdict text`, `coupon_code text`. This persists the analysis so the Radar and the qualify-popover read from Postgres, not a live recompute.

### 5c. Suppression — **blocking legal gap, must ship before any live send**

No unsubscribe mechanism exists anywhere in the schema. CAN-SPAM requires a working opt-out. Add to `client` (or a separate `suppression` table keyed by `email_norm`):
- `unsubscribed_at timestamptz`
- `do_not_contact boolean default false`
- `do_not_promo boolean default false` — Drew's "problem customers" flag (set manually or inferred from chargeback/no-show in ingest).

The recipient selector excludes `unsubscribed_at IS NOT NULL OR do_not_contact OR do_not_promo`. The email **must** carry an unsubscribe link, and a handler must stamp `unsubscribed_at`. This is the one hard legal gate.

### 5d. `ends_at` / padding (workaround, not blocking)

`upsertAcuityAppointment` never writes `ends_at`, so the availability query uses `starts_at + INTERVAL '1 minute' * duration_min` instead — equivalent and works now. **But** all appointment types have 15-min padding before and after; the local `duration_min` excludes it, so the Postgres count *undercounts booked hours by ~30 min per booking* (~2–2.5 hrs at 4–5 bookings). Since Drew named Acuity the source of truth, the cleanest fix is: at campaign-generation time, the runner makes **one `GET /availability/times` call per studio/day bucket** to get exact free slots (always passing `calendarID` — Lisa Brantly rule). The local DB drives the always-on Radar forecast; the authoritative Tue/Fri qualification uses the live Acuity call. (Fallback if you must stay DB-only: a fixed +30-min haircut per booking in the query.)

### 5e. `coupon.max_per_email` (one-use enforcement)

Add `max_per_email integer` to `coupon`; checkout checks `coupon_redemption` count by `email_norm + code` before honoring; Edge Config sync propagates the field. (Preferred over recipient-specific codes like `…-25-JORDAN`, which leak PII and break analytics.)

---

## 6. UI/UX

`/campaigns` stays home. Three stacked zones — future / now / past — above the existing table.

```
┌─ /campaigns ─────────────────────────────────────────────┐
│  Campaigns   [Live]   ⏱ Next analysis: Tue 8 AM (in 2d)   │
│  ▸ ZONE A — WEEKEND RADAR  (greyed upcoming + countdowns) │
│  ▸ ZONE B — NEEDS YOU      (proposed, awaiting approval)  │
│  ▸ ZONE C — ALL CAMPAIGNS  (existing CampaignsTable)      │
└───────────────────────────────────────────────────────────┘
```

Zone C *is* the current `CampaignsTable`, kept as-is and extended with the new statuses + a status filter.

### 6a. Zone A — Weekend Radar (the greyed-out, when-it-triggers view)

A horizontal timeline of the next ~6 weekends, each a card with up to 4 bucket mini-bars. **The greyed treatment is the heart of Andrew's ask:**

| Card state | Visual | Meaning |
|---|---|---|
| **Forecasted, future analysis** | whole card **desaturated, dashed border**, live **countdown** (`scheduled_for − now`, ticking client-side) | engine *predicts* qualification but the official Tue/Fri run hasn't fired |
| **Analyzed, qualifies** | card lifts to full color, amber **"Proposed — needs you"** chip | the run fired, ≥1 bucket qualified, a campaign was drafted |
| **Analyzed, all healthy** | stays muted, calm "No campaign — well booked" | nothing qualified; honest empty state |
| **Approved/Scheduled** | sky border, "Sending Tue 9 AM" + countdown | Drew approved; send queued |
| **Sent/Measured** | green, collapses to one-line funnel | done — lives in Zone C now |

The per-bucket bar is **11 segments = the 11 usable hours** in the 7:30–6:30 window; filled = booked, empty = open. Drew's `<5 booked AND ≥4 open` rule becomes visible at a glance, with a `●` on qualifying buckets. Clicking a bar opens a **"why this qualified" popover** with the raw arithmetic (booked vs. <5, open vs. ≥4, the open blocks, the proposed code, and "Source: 3 bookings, Acuity poll 2h ago") — deterministic, auditable, no black box. A **calendar/timeline toggle** offers the same forecast as a month view with qualifying weekends dotted.

### 6b. Zone B — Needs You (the approval surface)

A `proposed` campaign surfaces as a prominent card that **mirrors exactly the text Drew gets** — same payload, two channels:

```
┌─ NEEDS YOUR APPROVAL ──────────────────── proposed 2m ago ─┐
│  Memorial Weekend — 3 soft buckets — 25% off               │
│  WHAT WILL SEND                                            │
│   • Powdersville Sat + Sun, Taylor's Mill Sun              │
│   • Coupons: FS-SAT-MAY30-25, FS-SUN-MAY31-25, TM-SUN-…-25 │
│   • 218 recipients (after exclusions ▾)                    │
│   • Email + Text · sends Tue 9 AM if approved              │
│   [ 👁 Preview email ]   [ 👁 Preview text ]               │
│   [ ✓ Approve & schedule ]  [ ✎ Edit ]  [ ✕ Skip ]        │
│   ⓘ Also texted to Drew — reply YES / NO / EDIT           │
└─────────────────────────────────────────────────────────────┘
```

**Exclusions expand (▾)** to the audience math — `412 past clients − 38 already-booked − 9 unsubscribed − 4 DNC/problem = 218`. Powdersville-first ordering throughout (standing directive).

- **Approve & schedule** → `status=approved`, `scheduled_for` set, **and only now** are the coupons minted into the `coupon` table and synced to Edge Config via `syncCouponsToEdgeConfig`. An unapproved campaign references proposed codes that don't exist, so checkout can never accidentally honor an un-approved discount.
- **Edit** → inline editor: percent 25↔50, toggle individual buckets on/off (toggling off deletes that bucket's proposed coupon), edit subject/copy, adjust send time; preview re-renders live.
- **Skip** → `status=skipped`, logged with reason; the Radar card goes calm-grey.

### 6c. Approve-by-text (Watson, second channel)

The Tue/Fri job sends Drew the summary via the existing Watson SMS bridge (`WATSON_SMS_URL`, CF Access service token, `BLUEBUBBLES_PASSWORD`, `OWNER_PHONE` — all wired), ending with Drew's own line: *"Reply YES to send, NO to skip, or EDIT with changes."* Two implementation options:

- **Recommended — link approval:** the text includes `https://wws.entrpy.co/api/campaign-approve?id=<uuid>&token=<hmac>`. Drew taps; the endpoint verifies the HMAC and fires the same code path as the dashboard button. No BB reply-parsing, simplest to audit, and Cloudflare Access still fronts the dashboard.
- **Or — reply webhook:** a Blue Bubbles → dashboard `POST /api/campaign-approve` handler parses `YES`/`NO`/`EDIT <free text>`. `EDIT` is where the LLM earns its place: Drew texts *"make flagship 50% but leave TM at 25, send Wednesday"* → Opus maps it to structured mutations on the proposed campaign → texts back a confirmation diff for a final YES. The dashboard shows an "Edited via text" provenance chip so channels never silently diverge.

A thin **approval-log strip** on the detail page records proposed (engine) → edited (Drew) → approved (Drew, SMS) with timestamps. Paper trail, matching the project ethos.

### 6d. Pixel-perfect email preview (the mechanism)

**The preview is not a mockup of the email — it *is* the email.** One template, one render call, two consumers:

1. **One React Email template** — add `@react-email/components`; author `emails/WeekendRecovery.tsx` taking typed props `{ studioBuckets, coupons, percentOff, expiresAt, bookingUrl, recipientFirstName }`. Renders to table-based, inline-styled, client-safe HTML.
2. **One render fn** — `lib/emails/render.ts → renderWeekendRecovery(props): { html, subject, text }`. The **Resend send path** passes `html` straight to `resend.emails.send(...)`; the **dashboard preview** drops the same `html` into `<iframe srcdoc={html}>`. Same function, same props, same bytes — drift is structurally impossible.
3. **Iframe, not a div** — sandboxed `srcdoc` so the email's table/inline CSS renders in isolation; the dashboard's Tailwind can't leak in or "fix" broken email CSS. A `desktop 600px / mobile 375px` toggle just resizes the iframe.
4. **Real props, not lorem** — actual computed coupon codes, expiry, buckets, and a representative recipient ("previewing as: Megan Larson ▾" to spot-check merge fields). For `sent`/`measured` campaigns it renders from the stored `sent_payload` snapshot.

Detail page gains tabs: **Overview · Email · Text · Recipients**. The Text tab renders the SMS in an iMessage-style bubble from the same render fn's `text` output (so it can't drift either). Each AI-touched field carries a small **"AI-drafted · edit"** affordance.

### 6e. Funnel + recipients (engagement viz)

Extend the existing `FunnelCard` from 4 stages to **5 ending in money**: `Sent → Opened → Clicked → Redeemed → Booked ($X recovered)` — the last tile is revenue attributed (the whole point). Each stage shows count + % of previous (drop-off tells Drew whether copy or offer is weak), with a stacked narrowing-bar viz above. The existing `CampaignRecipientsTable` gains a filter-chip row (`All · Opened · Clicked · Redeemed · Booked`) so Drew answers "who actually booked off this?" in one click. A **"$X recovered across N campaigns"** ribbon at the top of Zone C is the scoreboard that justifies the feature.

### 6f. Status → visual system

| Status | Dot | Card | Countdown |
|---|---|---|---|
| Forecasted | grey hollow | desaturated, dashed | ⏱ to analysis |
| Proposed | amber | full color, pulses once | ⏱ to send window |
| Approved/Scheduled | sky | sky border | ⏱ to send |
| Sent | emerald | solid, funnel inline | — (live funnel) |
| Measured | emerald ring | solid, $ recovered | — |
| Expired/Skipped | grey | muted, struck | — |

Empty/greyed states are informative, never blank ("No campaign — both studios well booked," "Engine next runs Tue 8 AM," "Awaiting Drew — also texted"). A quiet dashboard reads as "all healthy," never "is this broken?"

---

## 7. Phased Roadmap

Smallest valuable slice first; each phase ships something real.

**Phase 0 — Foundations & the legal gate (blocking).**
`0008_campaign_lifecycle.sql` (lifecycle columns, `campaign_bucket`, `body_*`, `sent_payload`, `parent_campaign_id`). **Suppression migration + unsubscribe link + handler (§5c) — nothing live-sends until this exists.** `coupon.max_per_email` (§5e) + checkout enforcement + Edge Config propagation.

**Phase 1 — Deterministic engine, dark (no sends).**
`lib/campaigns/qualify.ts` (the ~60-line Postgres + Acuity availability gate, passing `calendarID` everywhere) and `lib/campaigns/audience.ts` (exclusion anti-joins). A **"what would send today" dry-run button** that shows results without proposing — lets Andrew sanity-check the engine any day. No coupons minted, no emails. Highest-confidence, fully testable in isolation.

**Phase 2 — Forecast + Weekend Radar UI.**
Wire `campaign_bucket` writes from the dry-run engine; build `WeekendRadar`, `WeekendCard`, `BucketBar` + qualify popover, `NextRunChip`, the countdown. Drew can *see* upcoming weekends greyed with triggers before any automation fires. Add the Thursday forecast launchd job (§4e item 1) feeding the greyed cards.

**Phase 3 — Tuesday job + proposal (still no send).**
`co.entrpy.wws-campaign-tuesday.plist` + `run-campaign.sh`. Add `@anthropic-ai/sdk`; build `lib/campaigns/ai.ts` (Opus proposal §4a + Haiku pre-screen). Job writes `proposed` campaigns. Build the `emails/WeekendRecovery.tsx` template + `lib/emails/render.ts` + the iframe preview (§6d) and the Zone B approval card (§6b) — render-only, Approve/Edit/Skip wired but **send still stubbed**. Drew reviews real proposals against real availability.

**Phase 4 — Approval + send (the gate goes live).**
Email copy generation (§4b) with self-check + legal-sentence asserts (§4c). The `/api/campaign-approve` endpoint (HMAC link first — simplest). On approval: mint coupons → Edge Config → Resend batch send → stamp `sent_at`. Watson approval text (link variant). **First real campaign ships.**

**Phase 5 — Measurement loop.**
Resend open/click webhooks → `opened_at`/`clicked_at`; per-recipient redirect for clicks; the **redemption→recipient join** closing `redeemed_at` (reuses existing `coupon_redemption` ingest). The 5-stage funnel + revenue tile + recipients filters. A/B winner pick.

**Phase 6 — Friday escalation + intelligence.**
`co.entrpy.wws-campaign-friday.plist`: re-run availability, propose 50% with the Tue→Fri delta narrative (Opus, §4e item 3). Threaded parent/child linking in the UI. Post-mortem summaries. Cannibalization guard. The inbound Watson `EDIT`-reply path with the confirm-diff (§6c) if link-approval proves too limiting.

---

## 8. Open Questions for Drew

Single copy-paste-ready block for Andrew to relay:

1. **Email list source — the one true blocker.** Where does the recipient list come from: Square's customer directory, Acuity's client list, or the dashboard's own `client` table (past bookers)? This determines who gets every blast and is the last undecided input before we can send.
2. **Recency cutoff.** Should we exclude past customers who haven't booked in a long while (e.g. >12 months), or email the entire history? Affects list size and how "cold" the audience runs.
3. **Already-booked auto-exclusion — confirm.** You asked whether we can auto-exclude weekend customers who are already booked. We can and plan to (anti-join on that weekend's bookings). Confirm that's what you want, and confirm the verbatim reassurance line stays exactly as written.
4. **"Problem customers."** How should we flag who shouldn't get promos — a manual toggle in the dashboard (you mark them), an automatic signal (chargebacks/no-shows), or both? The engine will never drop someone on its own judgment; it only excludes flagged people and surfaces edge cases for you to confirm.
5. **Approval channel preference.** Tap a link in the text (simplest, one tap = approve), or reply YES/NO/EDIT by text (lets you edit by text but is a bit more fragile)? We can do both, but which do you want as the primary?
6. **Friday escalation approval.** Same YES/NO/EDIT gate as Tuesday, correct? (Your spec implies it but doesn't say it as explicitly as the Tuesday step — confirming there's no auto-fire on Fridays either.)
7. **Combine vs. split.** When multiple studios qualify the same weekend, OK to combine into one email (the AI will recommend combine-or-split per weekend), or always one email per studio?

---

### Key files

- **Spec of record:** `/Users/pip/code/white-wall-mockup/client/comms/2026-05-25-drew-email-revenue-recovery.md`, wishlist `…/2026-05-22-drew-email-wishlist.md`
- **Schema to extend:** `/Users/pip/code/wws-dashboard/supabase/migrations/0005_campaign_tables.sql`, `…/0001_schema.sql` (booking table — qualification source), `/Users/pip/code/wws-dashboard/lib/types.ts`
- **Reuse as-is:** `/Users/pip/code/wws-dashboard/lib/coupons.ts`, `lib/edge-config-sync.ts`, `app/api/coupons/*`, `lib/data/queries.ts` (`getCampaigns`/`getCampaign`; `clientRowsQuery` for the recipient selector), the `coupon_redemption` ingest in `acuity-ingest.ts`
- **Cron pattern to clone:** `/Users/pip/code/wws-dashboard/deploy/co.entrpy.wws-poll.plist`
- **UI to extend:** `app/campaigns/page.tsx`, `app/campaigns/[id]/page.tsx`, `components/campaigns-table.tsx`, `components/campaign-recipients-table.tsx`
- **New:** `lib/campaigns/{qualify,audience,ai}.ts`, `emails/WeekendRecovery.tsx`, `lib/emails/render.ts`, `app/api/campaign-approve/route.ts`, `0008_campaign_lifecycle.sql` + suppression migration, `co.entrpy.wws-campaign-{tuesday,friday,forecast}.plist`, `run-campaign.sh`, components `WeekendRadar`/`WeekendCard`/`BucketBar`/`ApprovalCard`/`EmailPreviewFrame`/`FunnelBars`/`NextRunChip`

**Thesis in one line:** the engine auto-*generates and forecasts* (deterministic SQL + Acuity + Opus judgment), the dashboard makes *approval* fast and trustworthy (greyed Radar with live countdowns + an approval card that mirrors Drew's text), the preview *is* the email (one react-email template through one render fn to both Resend and a sandboxed iframe), and the funnel closes end-to-end by reusing the coupon-redemption pipeline already in place — with a hard, unconditional human gate before any discount ships.