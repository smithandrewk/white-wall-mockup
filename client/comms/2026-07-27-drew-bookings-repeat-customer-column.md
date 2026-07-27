# Drew — Bookings table: Repeat Customer? column

- **Source:** gmail (account `andrew@entrpy.co`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 27 Jul 2026 12:46:05 -0400
- **Thread:** `19fa478568fc46a2` ("WhiteWall Dashboard Revisions")
- **Msgid:** `19fa478568fc46a2`
- **Ticket:** DREW-13
- **Classify:** change-request (dashboard) — fast path
- **Access:** PAID 24h window active (armed). OOO paywall fired (`19fa47b3560c59cf`), Drew paid $20.

## Verbatim

> Hey Pip, send me a link to pay so we can get some work done today and some revisions to the dashboard.
>
> Let's start with the booking tabs. I want to add a a column where ic a see if they are a repeat customer or not. Just a simple column saying Repeat Customer? Then it says either Repeat, or New for the data display

## Foreman reply (ack)

- `19fa482c2a74dced` (Mon 27 Jul): back at the keys, on it now. Explained the Repeat rule and promised to confirm when live.

## Shipped

- **PR #92** (`smithandrewk/wws-dashboard`, squash `98244fc`) merged → deployed to the mini (`launchctl kickstart co.entrpy.wws-dashboard`) → LIVE + prod-verified on the live DB (loopback :18794).
- New **Repeat?** column on the bookings table (between Client and Location), Repeat/New per row, desktop + mobile, sortable.
- **Repeat = client with >=2 non-cancelled non-staging bookings** (same def as the `/repeat` lens; cancelled bookings do not count; null client never repeat).
- Confirmation reply to Drew: `19fa48a651022049`.
- DREW-13 → done. revision-status Round 53.
