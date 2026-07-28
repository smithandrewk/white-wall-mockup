# Drew backend spec — multi-day event notifications/buffer/crew/auto-charge
Source: Gmail thread 19f424228b20d389, msg 19f535e0d7e0e8bb, Drew, 2026-07-11 18:48 EDT.
(Response to Pip's honest backend-gaps status 19f5352095101ca2.)

## VERBATIM
> Greta John checking all of this.
> What you're working on now:
> Yes, make sure the customer gets all the same info, and a recap summary of all their session details.
> Also make sure you have watson send me a text whenever we get a multi day event booking. In that text, I want: the dates, the total amount of money, customer name, what theyre using the space for (they give us that in the intake form) how many people will be there, and then a verification that you have emailed the cleaners.
> Additionally, I want a SEPERATE text (like back to back), only if the Setup crew was added on. If it wasn't added on as an add-on, then no need fo text. If they do add that on, in that text I want you tot tell me exactly where they want each item to go (they fill that out in the intake form for that add-on details) and what you recommend for the start time for the crew (date and time, at least 1-2 hours in advance) and then same thing on the back end (the can show up at X because the event ends at X).
> For April's email, if they add the setup crew add on, make her window now 4 hours instead of 2, and tell her in her email that a crew will be in there immediately after the session ends to move all furniture back and to reset, and that she should get there 1.5 hours after the session ends to start cleaning. We don't want her showing up right after the event ends to clean, meanwhile the setup are is also packing up chairs and resetting.
> Cleaning buffer, yeah just make the total cleaning/setup buffer 4 hours now (if they add the setup crew add on)
> Lest give setup crew 2 hours on the front end of the booking. And then theyre baked into the same 4 hours on the back end of an event.
> Autocharge - how much longer do we have until it is setup? Lets just run it, tell them it auto charges, and hopefully its ready in time. If its not, then we need to create a reminder system, likely via text to me through watson, to manually go in and charge that 40% and the amount to charge to what card exactly for what event, etc.

## BUILD PLAN (itemized) — all in api/create-checkout.js handleCartCheckout unless noted
1. **Customer confirmation recap (gap #5, customer).** Wire notifyCustomerSMS (and/or a customer email) into the cart path, event-level, with a full RECAP of all session details (each day: date, time, add-ons) + total. Currently the paid cart path sends the customer nothing but Acuity's N per-day emails.
2. **Owner Watson SMS on every multi-day booking (gap #5, owner).** Wire notifyOwnerSMS (Watson) into the cart path, fire ONCE, containing: event dates (range), total $, customer name, event description (intake `eventDescription`), headcount (participants), and a line confirming "cleaners emailed". notify-sms is single-session-shaped — make it multi-day-aware.
3. **SECOND back-to-back owner SMS, ONLY if Setup Crew add-on selected.** Contains: each placement selection (where each item goes — from the crew placement intake), recommended crew START time (event start minus 1-2h; propose e.g. start-2h), and crew back-end time ("show up at X because the event ends at X" = last-session end). Skip entirely if crew not added.
4. **April cleaner email (gap #3) — key to LAST day + crew-aware.** Wire notifyCleaner into the cart path (add `cleaningFee` to the cart sessionState so it doesn't early-return; adapt notify-cleaner to multi-day: key to the LAST session end). IF setup crew added: window = 4h (not 2), tell April a crew will be resetting immediately after the event, and she should arrive **1.5h after** the session ends (so she doesn't overlap the crew). If crew NOT added: existing 2h-ish window.
5. **Cleaning buffer duration (extends the block I already built).** DONE: 2.5h block after last session (commit on branch). CHANGE: when setup crew added, total back-end buffer = **4 hours** (covers crew reset + April's cleaning). Without crew: keep the shorter buffer.
6. **Setup-crew FRONT-END window (gap #1).** Reserve **2 hours before** day-1 event start for the crew to set up (a block, or shift the access — likely a POST /blocks before day-1 start, only when crew added). Back-end crew reset is baked into the 4h back-end buffer (item 5).
7. **40% AUTO-CHARGE (item-6) — ANDREW-GATED, DO NOT auto-arm.** Drew says "just run it, tell them it auto charges." Arming item-6 = real auto-charging customer cards on a schedule = Andrew's decision (memory: "Item-6 arming is the exception Andrew gated"). ESCALATE to Andrew (ripe now). FALLBACK Drew approved: if auto-charge not armed, build a Watson reminder text to Drew to manually charge the 40% — include the amount, the card (square_card_id / square_customer_id already saved on the booking + in appt notes), and which event. Do NOT tell Drew/customers it auto-charges until item-6 is armed.

## STATUS
- Gap #2 (cleaning buffer, 2.5h) built + staging-verified (commit 95376c9). Items 1-6 above are the remaining build. Item 7 is Andrew's gate + the fallback.
- SENSITIVE: items 1-4 send REAL owner/customer/cleaner comms on PROD (suppressed on staging → staging verifies wiring only). Fire ONCE per event, not per appointment.
