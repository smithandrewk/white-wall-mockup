# Drew — Session Builder: rebuild UI as a carbon copy of the website booking flow

- **Source:** Gmail thread `19fa478568fc46a2` ("WhiteWall Dashboard Revisions"), account `andrew@entrpy.co`
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 27 Jul 2026 17:38:57 -0400
- **msgid:** `19fa5847a069d1e5`
- **Attachment:** `attachments/2026-07-27-drew-session-builder-screenshot.png` (screenshot of the live Book Flagship Location page, step 1)
- **Classification:** change-request (dashboard — revision of DREW-14 Phase 1)
- **Ticket:** DREW-17

## Verbatim

> Pib,
>
> I'm sure this is great, and I'm sure you accomplished everything I want here, but I don't like the user interface. When I say "carbon copy the website," I literally want it to be an exact copy of the website. The user interface of the website is absolutely flawless, and we already have everything mapped out properly.
>
> Here, look at the screenshot right here. I'm taking a screenshot literally from the booking page on the website. This one says "Book Flagship Location" at the top, but you can just change the language to say "Session Builder" at the top. Get rid of the paragraph that says, "Our Flagship Location is fully 100% self-service." It can just say "Session Builder," and then it has two toggles: "Flagship Location for Taylors Mill," just like the screenshot here.
>
> If it's a flagship location, again, we still have those same two pads. The photo, video, or the event is literally going to be an exact carbon copy of the website. I want to experience it identically to someone experiencing it live on the website. I love the UI there.
>
> I'm gonna talk about it as we speak. I pull up to it, and then I click the Event tab. Again, it's gonna ask me, "Single-day event or multi-day event?" with those two big cards. I hover over it, and it reacts to my mouse hovering over it.
>
> I literally want everything to live inside this Session Builder dashboard. I click on Multi-day event, and then immediately on the left side of my screen, I can start choosing my time and building it. Automatically, on the right side, there's a booking summary where things live track. I'm not kidding, it literally needs to be identical to this.
>
> Before we move on with approving phase one, we pretty much need to rebuild it to match the website. The whole entire process ends at the add-ons page after I select everything that I want. There should be a button that I can click on that says "Save Session" and then a placeholder button that says "Get Session Link" within the summary itself. That is where I should have the ownership discount override section where I can add in my percent or dollar amount discounts.

## Follow-up (nudge)

- **msgid:** `19fa92a81213d8d5`, Tue, 28 Jul 2026 10:39:09 -0400, same thread/sender

> Pip r u alive?

(The prior foreman session shipped + deployed PR #94 at ~17:58 ET Mon then died without confirming to Drew or picking up this 17:38 message; the nudge is Drew reacting to ~17h of silence. This session answered both.)

## Triage

**Change-request, deliberative-lite** (scope is explicit and Drew supplied the spec + screenshot; no open questions worth a round-trip). Revision of DREW-14 Phase 1 (shipped Round 54): Drew keeps ALL Phase-1 capability (live pricing, override, saved drafts) but rejects the form-style UI. He wants the dashboard tab to BE the website booking experience:

1. Page header: "Session Builder" (drop the "fully 100% self-service" paragraph).
2. Location toggle pills exactly like the site: Flagship Location / Taylor's Mill (Flagship first, standing decision).
3. Step 1 identical: the two big cards (Photo / video session vs Event), hover reactions included.
4. Event → Single-day / Multi-day cards identical to the site.
5. Then the site's own build UI: controls on the left, live-tracking booking summary on the right, identical behavior.
6. The flow ENDS at the add-ons page — no contact/waiver/payment steps.
7. In the summary: "Save Session" button + placeholder "Get Session Link" button + the Ownership discount override ($/% inputs) live inside the summary.

## Gate check (§4)
- No money spent, no architecture change, no legal text, no customer sends. Display/UI-layer inside the gated dashboard.
- Reuses the booking site's own front-end assets (HTML/CSS/JS already ours) + existing `/api/session-drafts`; upstream READ-ONLY invariant untouched.
- Drew owns WWS UI calls → not gated on Andrew. Ship.

## Follow-up 2 (point-by-point reply — UNHANDLED at session close)

- **msgid:** `19fa972592483e26`, Tue, 28 Jul 2026 11:57:38 -0400, same thread/sender `contact@whitewallstudios.co`
- Replying to pip's 11:15 status (`19fa94b4852a2b49`) which enumerated the Monday dashboard-hygiene list (items 1-6) + the Session Builder rebuild plan.

> 1. Perfect
> 2. Move that column to be between the client column and the Instragm column.
> 3. Great.
> 4. Great.
> 5. Great.
> 6. Great.
>
> Merge - totally fine.
>
> Session builder - great. Lemme know when ready for review.

### Breakdown / disposition
- **Items 1, 3, 4, 5, 6** = approvals of the already-shipped Monday dashboard-hygiene work. No action.
- **Item 2 = NEW tweak.** On the **Clients list**, move the Repeat/New column to sit **between the Client column and the Instagram column** (currently placed elsewhere). Small dashboard (wws-dashboard) reorder. NOT yet done.
- **"Merge - totally fine"** = Drew answering pip's 11:15 eyeball request on **item 6 (duplicate-identity consolidation)** — pip said "if any merge near the top of the Clients list looks like two different people, tell me and I will split it back." Drew confirms the identity merges are all correct; **do NOT split any back.** No code action. (NOT a code-PR merge authorization — Drew doesn't see internal PRs.)
- **"Session builder - great. Lemme know when ready for review."** = greenlight to keep going on the **DREW-17 carbon-copy rebuild** (in-flight, pip promised at 11:15 "I will message you the moment it is live"). The rebuild is **NOT built yet**. Drew is waiting to review it.

### ~~STATUS AT SESSION CLOSE (Andrew closed this spawned session mid-triage, 2026-07-28 ~13:32 EDT)~~ — SUPERSEDED, all handled by the catch-up foreman (below)

### HANDLED — catch-up foreman, 2026-07-28 afternoon (post-outage)
- **Access:** Andrew comped Drew through midnight tonight (window ACTIVE, comp in the ledger). Catch-up reply with comp notice + fresh pip image sent to Drew (`19fa9e3d72802747`).
- **Item 2 → DREW-18 → SHIPPED + LIVE.** wws-dashboard PR #96 (squash `7ac141d`): Clients list Repeat/New column now sits between Client and Instagram (lifetime tab; account tab keeps Login method last; Repeat visits still omits it). Live-DB prod verified on :18794.
- **DREW-17 → SHIPPED + LIVE.** booking-site PR #103 (squash `ed418e1`, inert builder mode, customer prod verified unchanged) + wws-dashboard PR #95 (squash `b707b34`, embedded booking-site UI) + #97 (SOURCE.txt provenance). Deployed + kickstarted on the mini, `sync-booking-app` run, prod-verified on :18794 (carbon-copy gate/cards/location toggle Flagship first, Ownership override + Save Session + Get Session Link in the summary, saved drafts intact). The one console line is a benign 404 on `/api/booking-public-config` (the promo-gate probe; fail-safe hidden — the endpoint is booking-site-only).
- **Confirmed live to Drew** (`19fa9ecd43056fd8`) — fulfills the open 11:15 promise ("will message the moment it is live"). Both tickets `done`. Revision-status Rounds 55 + 56.
