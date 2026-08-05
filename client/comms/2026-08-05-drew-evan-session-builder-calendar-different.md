# Drew — Evan session via Session Builder looks different in Google Calendar

- **Source:** Gmail (work mailbox andrew@entrpy.co)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Wed, 5 Aug 2026 19:33:26 -0400
- **Thread:** 19fd3598d771c14d
- **Message id:** 19fd44686093e875
- **Classify:** question / verification (possible incident)

## Verbatim

> Pip I sent a session to a client (Evan) through the session builder. I
> assume everything is fine, but why does it look different in the Google
> Calendar from the other sessions?
> Can you verify that no one else can book those days and times on the
> calendar? He got the same email and info like everyone else does normally,
> right?

## Triage notes

Three questions:
1. Why does Evan's session look different in the Google Calendar vs other sessions?
2. Verify no one else can book those days/times (slot actually held/blocked)?
3. Did Evan get the same email/info as a normal booking?

Investigation: read-only against Acuity + the dashboard DB. Determine whether Evan has
actually paid/booked (pay -> book: no Acuity appt until payment) or whether this is just a
sent session-builder link with no hold yet. Compare the builder booking path vs a normal
website booking to explain the visual difference.

## Resolution (SHIPPED + verified + confirmed)

Investigation (read-only against Acuity + live wws DB):
- Evan Silver (evan@therefinenetwork.com) booked a 3-day multi-day EVENT (Oct 3/4/5,
  Powdersville, full day 6am-11pm each; "Evan Silver – Refine Network Event"), via a
  Session Builder custom-offer link.
- **Evan PAID IN FULL via Square:** one payment Dti4N63EfGsgNypHOwXr1uNK0dKZY, gross
  $2,910 / net $2,825.31, COMPLETED 2026-08-05 17:57:36, card-on-file consent + signed
  waiver captured in notes.
- **All 3 Acuity appointments live + not canceled** (ref 2859/2860/2861, calendarID
  6255578 Powdersville, each 5:00 AM -> 11:00 PM). Days are held; Acuity will not offer
  Oct 3/4/5 to anyone else.
- **Same path as any booking:** "Booked via whitewallstudios.co", identical create-checkout
  flow → Resend confirmation email (Acuity's own email suppressed by admin=true for every
  booking). Multi-day events get the multi-day-shaped confirmation (all 3 days).

Answers to Drew:
1. Looks different because it's a multi-day full-day event = 3 back-to-back all-day blocks
   vs the usual short single session. Expected.
2. Yes, all 3 days are held; no double-booking possible.
3. Yes, same email/path, paid in full.

Proactive fix (DREW-66): the single Square charge attaches only to the lead day, so the
dashboard showed day 1 Paid in full but days 2/3 Unpaid (same family as DREW-65). Extended
the paid-status predicate to count a booking whose notes reference a real Square payment
(square_payment_id) — status only, revenue attribution unchanged (no double-count).
- Dashboard **PR #138** (e0ea529), merged → deployed :18794 → prod-verified (agent query
  paid=true for all 3 Evan days; agent metrics 401 not 503; calendar 200).
- Verify: build + **241 unit tests**; live-DB flips exactly 10 bookings (all multi-session
  non-lead days across 3 events); October Square net unchanged $8,160.05.

Confirmed to Drew msg **19fd45786a5e7d2f** (thread 19fd3598d771c14d). DREW-66 → done.
last-seen-drew.txt = 19fd44686093e875.
