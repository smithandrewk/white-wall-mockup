# Drew — reschedule button in Calendar view + "Edit Session" button full spec (2026-08-25)

Round 124. Access active (Drew's $30, armed=ON). Thread `1a036c426017a325` (account
`pip@entrpy.co`). Follow-up to Round 123 (item 3 = reschedule/edit sessions, DREW-47).

---

## Message (Drew → pip, VERBATIM)

- **Source:** Gmail (pip@entrpy.co)
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Tue, 25 Aug 2026 19:41:05 -0400
- **Subject:** Re: WhiteWall dashboard revisions
- **Message-id:** `1a03b4cb4b1f7948`
- **Thread-id:** `1a036c426017a325`
- **Attachment:** `Screenshot 2026-08-25 at 7.35.54 PM.png` — the wws.entrpy.co **Calendar**
  view, September, with Sept 5 expanded (Courtney Rogers EVENT $437 full detail card + a
  "BLOCKED OFF · Powdersville · 10:00a-11:00a · Courtney booked wrong time - just blocking
  it off for her" entry). Saved: `client/comms/attachments/2026-08-25-drew-calendar-reschedule.png`.

> 3) absolutely fantastic. Let's also add that reschedule button in the calendar UI as well. Here's a screenshot of exactly what I mean. Id love for it to be in here as well.
>
> And then for the next part your working on and building, we can call that button the Edit Session button. And that will also be in both the booking details view, and the calendar view. That button will let me do the more intense stuff like refund if we shorten it (and it should give a suggest refund amount) or charge extra if we extend it (and it should give suggested charge amount) and then add on/refund for certain add-ons, and then charge/reimburse the card tied to that booking itself. And before I charge or change anything, it should ask me to confirm the changes, and give a summary as to what all is going to be changed, the suggest change in price for refund or charge, the reason why, etc. then save ALL that progress and transaction data in the booking details for that specific booking.
>
> The suggested prices are all based on our retail pricing on the site for add ons, time, etc. and it can just calculate the differences accordingly. Going from a 6 hour session to a full day? Well we know those prices already, so whats the discrepancy? Then vice versa, etc. same with add ons in either direction.

---

## Triage

Classification: **change-request** (two distinct asks). Fast/ship-now for Part A; large
deliberative build for Part B.

### Part A — Reschedule button in the Calendar view (SHIP-NOW)
Surface the ALREADY-SHIPPED + ARMED + LIVE reschedule capability (DREW-47 phase 2, PR #157,
`ACUITY_EDIT_ARMED=1`) inside the Calendar day-detail panel, in addition to `/bookings/[id]`.
Dashboard-only, reversible, no new money path, no new upstream write path (reuses the exact
armed `POST /api/calendar/edit-session {action:"reschedule"}` route + `RescheduleSessionButton`
component). Andrew already approved reschedule (Round 114). **No new escalation.**
→ New ticket **DREW-87**.

### Part B — "Edit Session" button (the big card-charge build, fully specced)
This IS the deferred DREW-47 card-charge slice, now fully specced by Drew:
- Named **"Edit Session"** button, in **both** booking-detail view AND calendar view.
- Refund on shorten (suggest refund amount); charge on extend (suggest charge amount);
  add-on add/refund in either direction; charge/reimburse the card tied to that booking.
- Before any charge/change: a **confirm dialog** with a **summary of every change**, the
  suggested refund/charge amount, and the reason.
- Persist **all** progress + transaction data in the booking's detail record.
- Suggested prices computed from **retail site pricing** (time tiers + add-on prices),
  as diffs (e.g. 6h → full day = the known price discrepancy; add-ons either direction).

Money architecture: **already approved.** Andrew blanket-approved the DREW-47 charge slice +
delivered the risk/liability disclosure to Drew IN WRITING (Round 114, verbatim: "Go ahead do
whatever Drew asks but make him aware of the risks and his liability"; escalation resolved).
Refunds move money OUT (lower risk) and ride the same approval. **No new escalation** — the
remaining gate is OUR-side technical: a Square-sandbox charge/refund proof before arming
`SQUARE_CHARGE_ARMED`, then the build. Fold into **DREW-47** (keeps `in_progress`).
Build plan: `client/docs/DREW-47-edit-session-build-plan.md`.

---

## Actions this round (Round 124)
- **Part A DREW-87 SHIPPED** — Reschedule button added to Calendar day-detail panel
  (dashboard PR — see revision-status). Reuses `RescheduleSessionButton`; gated to real
  bookings on a known studio; hidden in seed mode. Verified + deployed.
- **Part B DREW-47** — full spec captured verbatim (above) + build-plan doc written; folded
  onto DREW-47 (add-msg + comment). NOT built this round; it is the active next build behind
  the sandbox-charge safety proof. Kept warm to Drew, NOT asserted done.
- Replied to Drew (see revision-status for msg id).
