# Drew email — close-time clarification + reminder-collapse rule (verbatim)

- **Source:** Reply on thread `19ed260797a3f02c`, work mailbox (andrew@entrpy.co).
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Thu, 25 Jun 2026 15:49:00 -0400
- **msgid:** `<56ED36A7-C22C-4ACF-92DD-7950D0DEC78B@entrpy.co>`
- **In reply to:** Pip's 2026-06-25 product questions (msg 19f001f98d0664d4).

---

## Verbatim message body

1. This is actually a great question for multiple reasons.

First off, to answer your question, no, Taylors Mill can stay open as long as we already have it established. It's currently in our settings right now, I believe, to where they can't book beyond a certain point. 10:30 PM is not the official close time for the Taylors Mill location, let alone the Flagship location. The reason I'm putting the 10:30 PM in there is almost entirely for continuous bookings to have a reasonable time to stop how much we charge them for. For example, if someone is just making a solo independent booking for a few hours, I have no issue with them booking beyond 10:30 or staying in there beyond 10:30. The closing time of either studio is not 10:30. The reasoning I'm putting this in here is because if someone wants to book a Saturday all-day event but they need to have the evening before to get things set up for their event the next day, I don't need them to book the entire full day of Friday. Theoretically speaking, say they want to get in there at 5 p.m. to start setting things up in preparation for their event the next day. I'm not going to make them pay for every single hour between 5 p.m. and the start of Saturday's full-day booking, because that would be charging them late into the night and then early in the morning at 2 a.m. per hour for the studio. However, I don't want to do the inverse where they can just book a two-hour session starting at 5 p.m. Their session that they paid for ends at 7 p.m., and then they can get in there the next morning for their event.

I'm trying to find that balance, and I think, realistically speaking, we should only charge them for X time to 10:30 before they go into the next day's full-booking event. The reasoning is that if someone wants to book a session in the morning of Friday and then another person wants to book one in the afternoon of Friday, that's money that we could have made that day. They can have the pre-event day booking starting at 5 p.m. or whatever the time is, and then we stop that timer at 10:30 p.m. It's not that we close at 10:30 p.m. It's just that I want to give people the option to be able to book the afternoon/evening before their full-day event to set things up and make sure no one else is going to be in the studio, but I don't want them to just pay for a one-hour or two-hour session, even if that's the only time they're actually going to be in the studio the day before, while still reserving the entire studio for no one else to book before their event.

I know this may be rambling, but that's my logic. Someone can totally book a six-hour session starting at 6 p.m. if they want to have a nighttime session. That's fine by me, and we don't close at 10:30 p.m. They could theoretically book a session starting at 10 p.m. for two hours, for all I care. It doesn't matter. I think you get the point. 


2. Yes, skip all the emails that would be technically overdue and pick up where the future emails would start. You can wrap it all up into a single catch-up email, or you can just skip that entirely and only send the ones that are upcoming.

---

## Triage

**Q1 — close-time. This REVERSES the Phase-B (PR #68) close-time guard, which is WRONG as shipped.**
- 10:30pm is NOT a studio close time. Neither location closes at 10:30. A regular/solo single-session booking can start and end whenever (Drew: a 6h session starting 6pm is fine; a 2h starting 10pm is fine).
- The 10:30pm cap belongs ONLY to the multi-day **pre-event setup day** billing scenario: a customer books the evening before their linked full-day event to set up; we bill that pre-event session only UP TO 10:30pm (so we don't charge them hourly into the small hours), AND we require more than a token 1-2h booking so they can't reserve the whole studio cheaply. This is an item-2 multi-day-cart BILLING rule (needs the next-day-full-day cart linkage), NOT a global availability rejection.
- **ACTION (prod bug fix):** remove the global close-time guard (isEndAfterClose enforcement in availability-times.js / verify-availability.js / create-checkout.js / cart.js) so normal late bookings work again. Re-capture the 10:30pm pre-event billing-window rule as a FUTURE item-2 refinement (implement inside the multi-day cart when the pre-event-day linkage exists). Drew's exact spec is in his verbatim message above.

**Q2 — reminder collapse: CONFIRMED our default.** Skip overdue touches, send only upcoming (a single catch-up email is acceptable but skipping is fine). campaign-schedule.js skip-overdue logic already matches; no change.
