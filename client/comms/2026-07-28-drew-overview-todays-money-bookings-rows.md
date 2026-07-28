# Drew — Overview At a Glance: Today's Money + Today's Bookings rows

- **Source:** Email, thread `19fa478568fc46a2` ("WhiteWall Dashboard Revisions"), work mailbox `andrew@entrpy.co`
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- **Date:** Tue, 28 Jul 2026 15:35:44 -0400
- **Message id:** `19faa3a0981ac9da`
- **Classification:** change-request (dashboard, wws-dashboard) — fast path
- **Attachment:** screenshot of the At a Glance card (Company/Powdersville/Taylor's Mill toggle visible, "Today $407" first row) → `attachments/2026-07-28-drew-at-a-glance-screenshot.png`

## Verbatim

> On the overview tab, we see the At a Glance section here. Can you change that first row to say "Today is Money" and then add another row right below it that says "Today is Bookings"? We can see the total amount of bookings we've had specifically today. Of course, you could toggle it between Pattersville and Taylors Mill to see how much money and how many bookings we've made specifically to those locations.

(Quoted below it: his own 3:13 PM Ownership add-on message. "Today is Money" / "Today is Bookings" and "Pattersville" read as voice-dictation for "Today's Money" / "Today's Bookings" / "Powdersville".)

## Triage

- The Overview page already has the page-wide Company / Powdersville / Taylor's Mill scope
  toggle (visible in his screenshot) that rescopes the At a Glance card, so the toggle
  requirement is already satisfied.
- Work: rename the first row "Today" → "Today's Money"; add a "Today's Bookings" row right
  below it = count of bookings PLACED today (ET, non-cancelled), scope-filtered.
- Interpretation shipped: "Today's Money"/"Today's Bookings" possessive (dictation), bookings
  = created today (not sessions happening today). Flagged in the confirmation reply with the
  alternative offered.
- Ticket: DREW-20 (distinct request; DREW-19 on this thread is done/shipped).

## HANDLED

- wws-dashboard PR #99 — see revision-status Round 59.
