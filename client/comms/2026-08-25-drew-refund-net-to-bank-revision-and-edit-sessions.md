# Drew — refund/Net-to-Bank revision + edit-sessions-in-dashboard (urgent)

- **Source:** Gmail (pip@entrpy.co)
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Tue, 25 Aug 2026 17:45:34 -0400
- **Thread:** 1a036c426017a325
- **Message id:** 1a03ae2f5ea1e69c
- **In reply to:** Foreman's Round 122 A+B confirmation (msg `1a03abae83fb1d72`)

## Verbatim

> 1) perfect.
>
> 2) I like it, but I think I want to change it a little bit, and I'm sorry because we're going back and forth a little bit here. How you were previously calculating today's money: let's keep that number the exact same. The net to our bank today should be the number that changes after all.
>
> The reason I'm saying that is I want to see how much money we earned today, but then I also want the net to our bank account to display the real amount of money we are actually going to get. Don't necessarily take off the refunded money from today's money. Just put the total amount that we were previously calculating before, but then net to our bank account. You can take off the refunded money there.
>
> Whenever I hover over it, it does right now with the whole "one cleaning equals $110 off." You could also put in the hover-over: "X session canceled and refunded X amount of dollars," and that's how we get to that number total.
>
> Essentially, you're keeping the same math, but I want you to just make today's money what was already previously being calculated there before I introduced the refund aspect. The net to our bank account today can subtract any refunds that we get and cleaning fees instead of prune stuff, and then whenever I hover over it, it should tell me what all went into that number.
>
> 3) this one's pretty urgent. I already made an issue for it in Linear, but I'm attaching the screenshot of the issue itself here because this is basically everything that needs to be done. We've already talked about this historically in the past, but now it's becoming real.
>
> We already incorporated the aspect of blocking off time, and that's how I actually remediated this issue here by just blocking off the hour before her session. It worked out fine there because I manually just blocked off time through the calendar, and it worked flawlessly exactly how it's supposed to. I really need to have a way to edit actual sessions directly in the dashboard itself.
>
> Take a look at this screenshot to get the context I'm talking about.

## Attachment

`attachments/2026-08-25-drew-edit-sessions-linear-issue.png` — Drew's Linear "New issue" (WWREQ, High priority): **"Edit Bookings in dashboard / calendar"**.
Body: at 5:30 PM Aug 25 Courtney booked her baby shower at the space but picked the wrong time; Drew is in the dashboard looking at the exact day/time and needs to move her session to 10 AM instead of 11 AM. He can go into Acuity and fix it manually but ideally wants to change/edit the times and everything directly in the dashboard.

## Triage

1. **Item 1 "perfect"** — ack of DREW-84 ($250 crew cost). No action.
2. **Item 2 — REVISION of DREW-85 (refund handling).** Same work → fold into DREW-85.
   - Revert **Today's Money** (today/week/month) to the OLD pre-refund calculation (the total collected). Do NOT subtract refunds from it.
   - Move refund subtraction to **Net to Our Bank** ONLY (which already subtracts $110/cleaning). Net-to-Bank today = collected − cleaning fees − refunds.
   - Enrich the **Net-to-Bank hover** so it enumerates everything in the number: the existing cleaning-fee line ("one cleaning = $110 off") PLUS "X session canceled and refunded $X".
   - Dashboard-only display change; reads `v_*`, moves no money. NOT a §4 gate.
3. **Item 3 — edit sessions directly in dashboard = DREW-47 Phase 2 (reschedule).** Same work → fold into DREW-47. Andrew approved both phases in Round 114; edit-session route built + gated in dashboard PR #143. The reschedule (Acuity edit) part is money-free and rides the same already-proven Acuity-write family as the live Block Off. Charging (SQUARE_CHARGE_ARMED) stays OFF pending the sandbox charge proof.
