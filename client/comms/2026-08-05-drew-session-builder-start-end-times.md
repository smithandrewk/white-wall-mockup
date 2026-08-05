# Drew — Session Builder not showing start/end times (urgent, iMessage)

- **Source:** iMessage (direct to pip, NOT the dashboard-revisions Gmail thread)
- **From:** Drew Shahoud (+18038738153)
- **Date:** 2026-08-05
- **Medium:** iMessage, urgent tone, offering to pay immediately
- **msgid:** n/a (iMessage; relayed)

## Verbatim

> Hey Pip. Need to get to this pretty quick. Send me a link. I'll go ahead and pay it real fast. In a session builder, it's not showing the start and end times for the sessions whenever I send it to clients. I'm not even necessarily sure if it tells you to start an end time in the summary when building it out internally as well. I know we selected time as we're building it and we allocate it with the duration of the booking, but people need to know the exact date and start/end time of their booking, regardless of it's a multi day event, photos/video, or a single day event. Can you fix that real quick to make sure that all of this displays are crossing the entire board both internally and on the consumer side once they receive the link?

## Also sent via EMAIL (same request, duplicate channel)

- **Source:** Gmail, thread `19fd3598d771c14d`, account `andrew@entrpy.co`
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Wed, 5 Aug 2026 15:14:37 -0400
- **Subject:** Whitewall Revisions
- **msgid:** 19fd3598d771c14d

> Hey Pip. Need to get to this pretty quick. Send me a link. I'll go ahead and pay it real fast.
> In a session builder, it's not showing the start and end times for the sessions whenever I send it to clients. I'm not even necessarily sure if it tells you to start an end time in the summary when building it out internally as well. I know we selected time as we're building it and we allocate it with the duration of the booking, but people need to know the exact date and start/end time of their booking, regardless of it's a multi day event, photos/video, or a single day event.
>
> Can you fix that real quick to make sure that all of this displays are crossing the entire board both internally and on the consumer side once they receive the link?

**Same work as the iMessage above → folded into DREW-63.** Paywall (open-paywall) already fired for this request; not re-answered.

## Triage

- **Classification:** change-request (bug/display fix)
- **Repo:** `wws-dashboard` (Session Builder feature) — client-facing share link + internal builder summary
- **Path:** fast-ish, but touches consumer-facing share view + internal summary. Behavioral display fix, not copy. Dashboard gate = `npm run build`.
- **Scope of the fix (Drew's intent):** every session/day in a Session Builder must display the **exact date + start time + end time** — (a) internally in the builder summary as you build it, and (b) on the consumer/shared link the client receives. Must hold for single-day photo/video AND multi-day events.
- **Access gate:** EXPIRED at time of message (paid_until 1785924000, seconds_left 0). Drew explicitly asked for a payment link ("send me a link, I'll pay it real fast") — paywall trigger. open-paywall fired before any build.
- **Ticket:** DREW-63 (Linear, Pip's Workspace).

## SHIPPED (2026-08-05)

- **PR:** white-wall-mockup #123 (squash `7a6d80d`), merged + Vercel prod deployed.
- **Fix:** `booking-flow.js` new `scheduleLine`/`fmtDateLong`/`fmtClock`; single-session aside summary gains a **Date & time** row (exact date + start–end) on both `book-*.html`; `renderOrderSummary` pre-pay note + `describeSession` cart line show the full range; `renderMultidaySummary` gains an "Event runs `<start>` → `<end>`" span + year; aside refreshes live on select-date/select-time. End = start + duration hours. No pricing/availability/checkout/Acuity/Square path touched.
- **Both surfaces:** consumer link + internal builder both run this same `booking-flow.js` (dashboard embeds it in BUILDER mode); dashboard saved-draft card already shows `draftScheduleLabel`.
- **Verified live on prod** (real Acuity slot): "Wed, Aug 5, 2026 · 4:00 PM – 6:00 PM". No booking made (stopped before pay).
- **Confirmed to Drew:** thread `19fd3598d771c14d`, msg `19fd3804b8cbcfe0`.
- **Access:** paywall fired (gate was expired); Drew paid `pi_3U1AXLFmjSvxMMa81N1kLgtx` ($30), window through 2026-08-06 06:00.
