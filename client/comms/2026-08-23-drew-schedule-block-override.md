# Drew — Whitewall schedule issue (blocked slot got booked over)

- **Source:** Gmail (andrew@entrpy.co inbox)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Sun, 23 Aug 2026 11:20:29 -0400
- **Thread id:** 1a02f35b23344ffe
- **Msg id:** 1a02f35b23344ffe
- **Classification:** incident (booking-logic / availability)
- **Ticket:** DREW-67 (see below)

## Verbatim

> Pip, see the screenshots. How did this even happen? I blocked it off. How
> were they able to still hook even though I blocked it off? Can you figure
> out what happened and how to fix it for next time so this never happens
> again when I have Watson manually block things off
>
> Send the link. I’ll pay it
> Let’s figure out wtf happened

## Attached screenshots (saved to scratchpad drew-screenshots/)

Four screenshots. What they show:

1. **IMG_1170** — iMessage thread with customer "Erin": Aug 10 she asked if anyone
   was booked before their 12-4 Aug 23 rental; WW said "just you guys," she asked to
   "snag the hour before," WW replied **"Just had Watson manually black it off for you
   guys... No need for a link."** Today 11:00 AM she wrote **"somebody I think booked
   Whitewall until 1130 today... still good with us getting in early?"**
2. **IMG_1171 / IMG_1173** — the Aug 23 calendar (Acuity, synced to WhiteWall's Google
   cal). The conflict:
   - **Manual Block Off — Powdersville Studio, 11:00 AM-12:00 PM** (Watson's block)
   - **Madison Thompson: Powdersville Studio - One Hour, 10:30-11:30 AM** ← the booking
     that hooked; its 10:30 start runs to 11:30, overlapping the block's first 30 min.
   - Evan Silver: Powdersville - Four Hours 12-4 PM = the confirmed Erin/rental party.
3. **IMG_1172** — WW smoothed it over with the customer ("It's all good! Appreciate you
   checking!"). **No refund / no customer-harm dimension** — customer was accommodated.

## Preliminary root-cause hypothesis (to VERIFY post-payment, READ-ONLY)

Manual block was 11:00-12:00. Madison booked a 60-min Powdersville slot starting 10:30,
ending 11:30 — overlap 11:00-11:30. Likely the booking site's availability check tests
only whether a slot's **start time** falls inside a block, not whether **start+duration**
overlaps it (or does not subtract Acuity manual "block off" entries from availability at
all). Confirm in white-wall-mockup/api/ availability path + Acuity read.

## ✅ CONFIRMED ROOT CAUSE (2026-08-23, post-payment, READ-ONLY Acuity queries)

The preliminary overlap-logic hypothesis is **DISPROVEN.** The booking site's availability
code is correct. The real cause:

**The 11:00–12:00 "Manual Block Off" never existed in Acuity.** Read-only Acuity queries:
- `GET /appointments` 2026-08-23 PV (cal 6255578) → 3 real appts only: Madison Thompson
  10:30–11:30 (typeID 89113040, **dateCreated Aug 11**), Evan Silver 12:00–4:00 (the rental
  party, created Jul 30), Alexandra Briordy 4:30–8:30. **No 11–12 "block" appointment.**
- `GET /blocks` 2026-08-01→31 PV → 5 blocks, ALL auto-created cleaning buffers + one Aug 1
  block. **NO manual block on Aug 23 anywhere (PV or TM).**

**Why:** Acuity is the SOLE source of availability truth for the booking site. The dashboard
+ Watson are **READ-ONLY against Acuity by design** — Watson has NO block-off capability
(confirmed in the agent capabilities catalog; "block times off" is the deliberately-deferred
upstream write = DREW-47). So whatever "Watson manually blocked it off" did, it did NOT
create an Acuity block. The block existed only as an event on WhiteWall's **Google Calendar**
(what the screenshots show), which Acuity syncs INTO one-way (Acuity → Google). A Google-Cal
event does NOT feed back into Acuity availability. Acuity never knew 11–12 was reserved, so it
correctly kept 10:30 open, and Madison booked it Aug 11 (the day AFTER the block was placed).

**Corroboration Acuity respects REAL blocks:** availability/times for the 1h PV type on a
date with a real cleaning-buffer block excludes the overlapping window; cleaning buffers are
relied on in prod to hold slots. A real Acuity block would have removed 10:30.

**No booking-site code bug → no PR.** The permanent fix is a real Acuity "block off time"
write path (a one-tap dashboard/Watson block), which is exactly **DREW-47** (first upstream
Acuity write, ESCALATED + gated on Andrew). Interim fix delivered to Drew: block time
**inside Acuity itself** (not Google Calendar) and it disappears from the site instantly.

## Access / paywall

Access EXPIRED (window lapsed Aug 6). Paywall cycle was STALE (opened Aug 7, stuck
pending 16 days) so his recent "send the link" emails never triggered a fresh send.
Fixed 2026-08-23: deactivated stale Stripe link, cleared cycle, re-ran open-paywall.
Fresh $30 link SENT + verified in inbox. Drew said "Send the link. I'll pay it."

## Actions

- [x] Paywall fixed, fresh link sent + verified
- [x] Logged verbatim
- [x] Ticketed DREW-67
- [x] OOO reply on his actual thread with the link
- [ ] On payment: grant --reset, diagnose, fix (one PR per repo), verify on staging, confirm
