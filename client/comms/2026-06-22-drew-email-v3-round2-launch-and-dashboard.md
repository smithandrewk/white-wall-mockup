# Drew email — V3 round 2: launch approval + new dashboard scope (verbatim)

- **Source:** Three replies on thread `19ed260797a3f02c` ("Re: WhiteWall dashboard revisions"), work mailbox (andrew@entrpy.co), sent after Pip's point-by-point reply.
- **From:** Drew Shahoud <drew@entrpy.co>
- **Dates:** 2026-06-22 21:34, 21:47, 21:51 (EDT)
- **Context:** Drew approves launching ship-now items 3 + 5, signs off on the 2/6/7 architecture ("flawless"), and adds a batch of NEW scope (mostly wws-dashboard + two booking-site additions + one security concern). Logged verbatim before any work per CLAUDE.md. Plan: pip task T018.

---

## Message 1 — 2026-06-22 21:34 (msgid 99695955-EC01-47F8-ABDF-C43F05AC5759)

Item 3. Great launch the 8 hours session. Make it live on the site and make sure it works for checkout and everything. Test it and make sure it blocks through time off on the calendar and such.

item 5. Great. Test it, launch it. Make it live.

item 2. Flawless. And they can review each individual piece of their big cart and confirm its then book.

Item 4. Perfect.

Item 6. Absolutely flawless. Add that we remind them to update their payment info every 6 hours, 24/7 leading up to their booking start.

Item 7. Absolutely flawless. I also want you to revise the current Clients tab in our dashboard to say Clients – Life Time. And then make a new tab called Clients – With Account. And put all the exact same data here, but make it specific to only clients that have an account setup. I still wanna see literally all the same data and everything.
Universally on the dashboard for all clients in both lists, I want you too add a LTV of a specific client, and also add a clickable link under their IG username to go straight to their IG Page. For Clients – With Account, we should eb able to see how they login in (google, or traditional) and if traditional, we should be able to see their password. We also need to setup a system to help them reset their password if they forget their password at login.

Also, when a client logs in to the site, we need to make a client portal fo them to EASILY find the Login button, they log in, then they can see their account info, their sessions they have coming up, and their payment method card on file.

Regarding Andrew's things I know yalla re talking so ill hit here. But I say we push all fo this aggressively (upon Andrew approval) and get Ito knocked out now honestly.

Last thing to add – I want to be able to make a unique campaign inside of the campaigns tab on the dashboard. Or send out the campaign early, etc. I dont want to have to wait for dashboard to suggest a campaign to send a mass email.

---

## Message 2 — 2026-06-22 21:47 (msgid 4B02EB6B-C6CB-416A-8EA9-DA7F910C2721)

Also, can you on the dashboard:
1) stats tab, performance and forecasting and historical reference.

I want to have a graph where I can see the performance of the current month overlaid on top of the performance of the average month year-to-date. I then want to see the percent change and the projections for that exact percent change. I also want to see that chart on the overview home page as well. It can go right underneath the net total chart. Of course, it should be displayed with the three options for companywide, Powdersville, or Taylor's Mill.

---

## Message 3 — 2026-06-22 21:51 (msgid BB87ECD2-163A-4B5D-9107-62663FD58614)

Okay, another thing: Angela Anderson has booked.

First off, did she book an event or a normal photo session? Whenever I go to bookings, I see Angela, and then I click on Angela and then I see her booking history, but I can't see what kind of booking it was. It doesn't tell me if it's an event or a photo session.

First off, let's change that. Also, I can't see the add-ons that she put in there. We need to be able to see all the individual add-ons and how they total up and what she spent.

---

## Pip triage notes (not from Drew)

New scope split by repo / risk:

**Booking site (white-wall-mockup):**
- Item 6 addendum: payment-update reminders every 6h, 24/7, leading up to booking start (folds into the item 6 scheduler / campaign touch design).
- Client portal: prominent Login button, account info, upcoming sessions, card on file (this is item 7's customer-facing surface).

**Dashboard (wws-dashboard):**
- Rename "Clients" tab → "Clients – Life Time"; new "Clients – With Account" tab (same data, account-holders only).
- Per-client LTV (both lists); clickable IG link under IG username.
- "With Account": show login method (google vs traditional); password reset assistance.
- Stats tab + overview: current-month vs YTD-average overlay, % change + projections, location toggle, placed under the net total chart.
- Booking detail: show event vs photo-session type and the itemized add-ons + spend (the Angela Anderson gap).
- Campaigns tab: manually create + send a campaign early, not wait for the dashboard's proposer.

**SECURITY FLAG — do not implement as asked:** Drew wants to "see their password" for traditional-login clients. With Supabase Auth (the locked decision) passwords are salted+hashed; plaintext is not recoverable by design, and surfacing it would be a serious liability. Correct response: offer login-method + last-login + a one-click admin "send password reset" instead of plaintext. Needs an honest note back to Drew.

**Launch approval:** Drew explicitly wants items 3 + 5 live + tested (PR #64). [DONE: merged 8c43bfd, verified live on prod 2026-06-22 evening.]

---

## Message 4 — 2026-06-22 22:42 (msgid 6BAAAFB7-C160-464F-8229-546D2266B98A) — checkout flow reorder

> Pip you animal. And youll make sure to putt add ons as one of the first things in the checkout process, right? In the current flow, right after they select photo or event, then do add ons. Then everything else. Whatever logic makes sense. But I do not like how it currently takes forever to get to dd ons.
>
> We may want to straight up have an Add-Ons gallery page too maybe? Up to you if there is value there.

**Triage:** Booking-site UX change. Current step order is Timing → Details → Waiver → Add-ons → Schedule&Pay (add-ons is step 4, near the end). Drew wants add-ons pulled forward to right after the photo/event intent selection. Standalone from the 2/6/7 build, BUT the item-2 multi-day cart rebuild rewrites the flow anyway, so the new order should be baked into that rebuild (avoids doing it twice). Optional quick standalone reorder on the current live flow if Drew wants it before the rebuild lands. Add-Ons gallery page = nice-to-have browse/marketing surface, evaluate during flow work. Not yet built.

---

## Message 5 — 2026-06-22 23:05 (msgid 227BC283-4D6F-4365-86E6-1B5CA52AD71E) — timeline

> Great. How long do you think until its ready for review?

**Reply sent:** staged-review cadence — accounts/profile foundation reviewable in ~1 week, then cart, then deposit/auto-charge, then live profile editing, each reviewable as it lands; full set over the following several weeks. Overall schedule + cost deferred to Andrew (consistent with prior reply). Supabase project is provisioned (foundation unblocked).
