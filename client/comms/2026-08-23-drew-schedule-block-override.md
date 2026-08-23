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
- [x] On payment: granted (window through 2026-08-24 06:00), diagnosed READ-ONLY (no code bug), interim fix delivered, root-cause reply sent. Permanent fix = DREW-47 Block Off button BUILT + staging-verified on GATED dashboard PR #142 (blocks-only, arm-gated, NOT merged/armed — waits on Andrew's first-live-write go). All follow-ups answered (Rounds 107→109). Paper trail rescued onto main via worker/drew-67-47-papertrail (prior foreman stranded it on merged branch fix/ww-32).

---

## Follow-up — Drew confirms root cause + requests the permanent fix (2026-08-23 13:10)

- **Source:** Gmail thread `1a02f35b23344ffe`, account `andrew@entrpy.co`
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Sun, 23 Aug 2026 13:10:57 -0400
- **Msg id:** `1a02f9aca12f7545`
- **Classify:** change-request (the permanent fix = DREW-47)

### Verbatim

> Perfect, thanks pip. I thought that was the case. Yeah we need to fix this asap. That button and UI should probably live on the Calendar tab itself. Basically need to have a button that says Block Off, and be able to block off tike directly within the dashboard from the actual calendar, for either space.
>
> We should honestly probably have a way to edit exiting sessions in the calendar view. Manually override what they have and have the ability to edit what a client has alreayd booked – and potentially add add-ons and charge card, or extend their time, etc. and then just charge card accordingly.
>
> We should probably get this fixed like asap. Can you make that happen? The Block Off button can be another pill, slightly bigger and a different color, next to the other 3 buttons we have up top.
>
> Let me know. This is my priority today.

### Triage

Two asks, both land on **DREW-47** (Calendar-tab manual control, Acuity+Square WRITE — already escalated to Andrew as the first-ever upstream write):

1. **Block Off button + UI on the Calendar tab.** A "Block Off" pill — slightly bigger,
   different color — next to the 3 scope pills (Company / Powdersville / Taylor's Mill).
   Blocks time directly from the dashboard, for **either location**. Writes a true Acuity
   block. This is the FIRST live Acuity write → gated (architecture, reverses READ-ONLY
   upstreams invariant). Build UI + staging-proven write; live flip waits on Andrew.
2. **Edit existing sessions in the calendar view.** Override a client's booking, add
   add-ons + charge card, extend time + charge accordingly. Acuity edit-write + Square
   money-move. Bigger surface; scoped behind the Block Off button. Also gated (money +
   architecture).

---

## Drew follow-up (question) — "will Watson be able to do it too?"

- **Source:** Gmail thread `1a02f35b23344ffe`, account `andrew@entrpy.co`
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Sun, 23 Aug 2026 13:18:20 -0400
- **Msg id:** `1a02fa18e4d707dd` (in reply to Foreman's Round 108 reply `1a02fa0773684d14`)
- **Classify:** question (rides on DREW-47; no new build)

### Verbatim

> Flawless. And Inherently, once this is built, watson should be able to interact with it and do it too, right?

### Triage

Yes/no question, answered inline — no new build. Watson triggering "block off time" is a
DATA WRITE via the agent API (Watson tells the dashboard to write an Acuity block), an
integration on the same write path — NOT Watson writing code. It sits on the OK rungs of the
recreation ladder (read OK / write-data OK), exactly like the `delete_session` verb Watson
already has (Round 89, DREW-51). So the answer is yes: once the human Block Off button is
live and armed, adding a `block_off` action to Watson's capabilities catalog is the same
pattern — Watson does it on Drew's word. The Round 108 reply already committed to this ("and
that Watson can trigger on your word"). Keep-warm on timing (the first-live-write go is still
being finalized on Andrew's side); do NOT assert it's decided/live. No new escalation — the
Watson verb is not a separate gate beyond the already-open DREW-47 first-live-write go.

---

## Round 111 — Drew acknowledgment "Perfect. Thanks pip." (2026-08-23)

- **Source:** Gmail (account `andrew@entrpy.co`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Sun, 23 Aug 2026 13:47:45 -0400
- **Thread:** 1a02f35b23344ffe
- **Message id:** 1a02fbc7808bd7f7
- **In reply to:** Foreman's Round 109 answer 1a02fab1c5c52f39 (Watson picks up the block-off verb alongside the write path)

### Verbatim

> Perfect. Thanks pip.

### Triage

`fyi` / acknowledgment — a terminal thank-you closing the Watson-interaction exchange. No
new request, no question, nothing actionable. **No reply sent** (a bare "thanks" needs no
"you're welcome"; that would just be noise). Nothing to build — the Block Off button (PR #142)
is already built and correctly GATED on Andrew's first-live-write go; the Watson block-off
verb rides that same open DREW-47 gate. `last-seen-drew.txt` advanced to `1a02fbc7808bd7f7`
so the watcher won't re-fire on this. DREW-47 stays escalated + open on Andrew.

---

## Round 112 — Drew status check "How are things coming pip?" (2026-08-23)

- **Source:** Gmail (account `andrew@entrpy.co`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Sun, 23 Aug 2026 14:56:08 -0400
- **Thread:** 1a02f35b23344ffe
- **Message id:** 1a02ffb1724a1ce2
- **In reply to:** Foreman's Round 109 answer 1a02fab1c5c52f39 (via Drew's Round 111 ack 1a02fbc7808bd7f7)

### Verbatim

> How are things coming pip?

### Triage

`question` — a status check / nudge on the Block Off button, ~1h after the Round 109/111
exchange. Drew called this his top priority today, so he is checking in on progress. Nothing
new requested, nothing new to build. **Reply = honest keep-warm status:** the Block Off pill +
studio/day/start/end picker are built and tested on our side (proving clean against a mirror
calendar); the one remaining piece is the final go on the first-ever live-calendar write, being
finalized on our end, before it flips onto his real calendar. Do NOT assert it is done/live/
decided (the DREW-47 first-live-write go/no-go escalation is still OPEN on Andrew). Folded onto
DREW-47 (add-msg). `last-seen-drew.txt` → `1a02ffb1724a1ce2`.

---

## Round 113 — Drew: "Does Andrew need to sign off on it as the final step?" (2026-08-23)

- **Source:** Gmail (account `andrew@entrpy.co`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Sun, 23 Aug 2026 15:47:13 -0400
- **Thread:** 1a02f35b23344ffe
- **Message id:** 1a03029dd5a473cd
- **In reply to:** Foreman's Round 112 status reply 1a02ffce1c85a0e7 (the "one thing left is the final sign off on that first ever write" note)

### Verbatim

> Status? Does Andrew need to sign off on it as the final step?

### Triage

`question` — Drew picked up on the Round 112 phrasing ("final sign off on that first ever
write") and asked directly whether Andrew is the one who signs off as the last step. **Answer =
yes** — that IS the one remaining gate, and it is honest to say so (Drew treats Andrew as the
principal; a first-ever write into his live Acuity + card path is Andrew's go, per
`[[drew-ask-andrew-guarantor]]`). Framed as **scope + who does the work**, never a rule:
the build and testing are done on our side (no more building), the single gate before it goes
live on his real calendar is Andrew's one-time sign-off on the first-ever live write, and I
invited Drew to nudge Andrew directly to close it fast (§4 "tell Drew to notify Andrew too" —
keeps the blocker off one channel; the two are partners). **Did NOT assert decided/live** — the
DREW-47 first-live-write go/no-go escalation (`esc-drew-47-go-no-go-...`) is still OPEN on
Andrew. **No new build, no new gate** — PR #142 stays BUILT + GATED, unchanged. Reply sent
(msg **1a0302ccaf00b63d**). Also sent Andrew a brief heads-up that Drew is now explicitly
waiting on the go (escalation already open + emailed; this keeps it timely, not one-channel).
Folded onto **DREW-47** (add-msg + comment). `last-seen-drew.txt` → `1a03029dd5a473cd`.

---

## Round 114 — Andrew's in-session GO: Block Off SHIPPED LIVE (phase 1) + Edit-session BUILT gated (phase 2) (2026-08-23)

**Andrew approved BOTH phases in-session**, verbatim intent: *"Go ahead do whatever Drew asks but make him aware of the risks and his liability."* This resolves the DREW-47 first-live-write go/no-go the last several rounds were keep-warming.

### Escalations resolved
- `esc-drew-47-go-no-go-first-live-acuity-write-block-off-square-ch-architecture` → resolved (Andrew's decision recorded).
- `esc-drew-67-blocked-slot-permanent-fix-needs-acuity-block-write-architecture` → resolved (superseded).
- `esc-drew-wants-dashboard-write-back-to-acuity-square-calendar-bl-architecture` → resolved (superseded).

### Phase 1 — Block Off — SHIPPED + LIVE + VERIFIED
- Dashboard **PR #142 merged**; `ACUITY_WRITE_ARMED=1` set on the mini poll.env; dashboard rebuilt + kickstarted.
- **Live end-to-end proof** on the real dashboard: `POST /api/calendar/block-off` wrote a real Acuity block on the Powdersville prod calendar (6255578) → confirmed via `GET /blocks` → deleted (204) → confirmed gone. Zero residue. (Also pre-proven directly against Acuity before arming.)
- Agent surface intact (capabilities 200, no 503 trap); bad body → 400.
- This is the first sanctioned reversal of the READ-ONLY-upstreams invariant, blocks only, exactly as designed.

### Phase 2 — Edit session (override + add-ons/extra + charge, extend) — BUILT + GATED (NOT live)
- Dashboard **PR #143** (`worker/drew-47-phase2-edit-charge`). From `/bookings/[id]`:
  - **Charge card on file** — `lib/square-charge.ts` (dashboard's first money-write; merchant-initiated `chargeCardOnFile` mirroring the booking site's proven primitive). Arm gate `SQUARE_CHARGE_ARMED` (default OFF), per-charge sanity cap, card handle recovered from the booking-notes consent block (no guessing), **every charge a deliberate human click behind a confirm dialog, never auto-fired**.
  - **Reschedule** — `lib/acuity-edit.ts` (`PUT /appointments/:id/reschedule?admin=true`, always-pass calendarID). Arm gate `ACUITY_EDIT_ARMED` (default OFF).
  - Route `app/api/calendar/edit-session` returns an honest 403 "pending activation" per action while disarmed; `EditSessionButton` on the booking detail page.
- **Verify:** `npm run build` + **265 unit tests** (13 new — arm-gate, sanity cap, card-handle parse, exact request shape via injected fetch; NO real money / upstream) + seed-mode route smoke (disarmed charge/extend → 403 armed:false, bad action → 400, detail page renders the button).
- **NOT armed live.** Go-live = sandbox/staging charge proof + merge #143 + arm both switches. The dashboard's prod Square token is LIVE, so no real charge was executed to prove it (the money-gate forbids moving real customer money to test); the wire contract is unit-proven.

### Drew informed IN WRITING — msg `1a0306b324b3e8ce` (thread `1a02f35b23344ffe`, to `contact@whitewallstudios.co`)
Told Drew: Block Off is live + verified, phase 2 in progress on our mirror, AND the risk/liability disclosure Andrew required, stated plainly:
1. **Live calendar writes** — the dashboard now writes real blocks into his live Acuity calendars; a wrong block removes real bookable time and affects real customers; reversible but immediate.
2. **Card charges (phase 2)** — White Wall is responsible for obtaining each customer's authorization for every charge, and OWNS the chargeback / dispute / refund risk and the correctness of every charge; every charge is a deliberate action he takes.
3. **Watson on his word** — the same ownership applies to anything Watson executes.
Framed as legitimate operational client comms (what these live-write + card-charge controls take on), NOT system internals.

### Follow-up (small, next)
Wire the Watson `block_off` action into the agent capabilities catalog (mirrors the existing `delete_session` verb) so Watson can trigger a block on Drew's word directly. The human path it rides is now live + armed.
