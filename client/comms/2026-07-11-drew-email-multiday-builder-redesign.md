# Drew — multi-day event builder redesign (time-based, day-typed)

- **Source:** email (thread `19f424228b20d389`), Sat 11 Jul 2026 08:15:23 -0400
- **msgid:** `19f511ac2bae0143` (header `<CA+_J_6UOk0jtWbOZ2Wo0jNCoL2Hbk5K6bdeu=+5g+bxs6xQ8PA@mail.gmail.com>`)
- Sent after Drew tested the multi-day builder framing on staging.

## Message — verbatim

> I absolutely love the direction, but let's switch it up.
>
> Let's have the same notice at the top saying your building your first day. But they need to select
> that first day first. So let's say they select the October 3rd.
>
> Then, after they select the first day, WITH A CRYSTAL CLEAR DISCLAIMER THAT THIS FEEDS INTO the NEXT
> DAY, lest have them select a time they have access to the space. The "end" time on Saturday is 10:30.
> So they just go backwards from there. So instead of them selecting a duration, they select a time from
> the options. I imagine the options being.
> 9pm: $130
> 8pm: $200
> 7pm: $270
> 6pm: $350
> 4pm: $500
> 2pm: $750
> 5am that morning: $980.
>
> That's the move. Let's do that. Then they go to the new day. But we need to have 2 buttons after they
> select the start time that says
> 1) add MULTIPLE more days
> 2) add one more day, which will be the last day in the event)
>
> So we can copy this same logic in the bookings for the last day, but inversed. Starting at 5am as the
> internal clock, and the language is "leave time, with everything completely reset and cleaned up."
>
> I love those options honestly. That's perfect. Also make it clear here that this INCLUDES their setup
> time for the event.
>
> We will apply this same logic on the backend too.

## Triage (Foreman, 2026-07-11)

A significant REDESIGN of the multi-day event builder (replaces duration-picker with a time-anchored,
day-typed flow). Drew's call, his prices → build it (+ backend). Staging-first (booking-logic + pricing).

**First day (fully specified):** pick the DATE first, then a START TIME (not duration) — access ENDS at
10:30pm, choose how early to come in. Crystal-clear disclaimer that this day feeds into the next AND
includes setup time. Options (start → price, = existing duration prices): 9pm $130 / 8pm $200 / 7pm $270 /
6pm $350 / 4pm $500 / 2pm $750 / 5am $980. Then TWO buttons: "Add multiple more days" / "Add one more day
(the last day)".

**Last day (inverse):** access STARTS at 5am; pick a LEAVE time; language "leave time, with everything
completely reset and cleaned up."

**Two genuine unknowns → confirm-back sent to Drew (msg pending):**
1. Middle days (via "Add multiple more days") — full days (5am–10:30pm, $980 each) or their own time pick?
2. The last-day leave-time → price options (the inverse mapping) — Drew didn't give explicit prices; can't
   invent money. Asked him for the leave-time→price list.

**Build note:** first day is fully specified → start building it. Wire middle/last days once Drew answers.
Backend (`create-checkout.js` + Acuity duration/time) mirrors the same logic — the risky server slice,
staging dry-run (sandbox Square + staging Acuity 14110701) before any live charge. This supersedes the
generic duration-based multi-day framing shipped in commit `6e00482` (that was iteration 1).

## Drew's answers — Sat 11 Jul 2026 08:47:55 -0400 (msg `19f513889c81d173`)

> When they hit multiple days, and they're booking one full day in between the start day and end day, or
> however, many days it is, those are full day rentals no matter what Price said $980 per day. Pretty much
> everything is gonna be priced at $980 except for the first day and the last day, depending on when they
> want to access the studio and when they want to be expected to leave.
>
> Leave day prices are same as first day - just mirrored.

**Resolved:**
1. **Middle days = full day, $980 each** (5am–10:30pm). Everything between first and last is a full day.
2. **Last-day leave-time prices = first-day prices, mirrored.** Last day access starts 5am; leave time =
   5am + the same durations the first-day prices imply. Prices $130/$200/$270/$350/$500/$750/$980.

**Price↔duration map (Drew's first-day prices == existing PV durations):** $130=1hr, $200=2hr, $270=3hr,
$350=4hr, $500=6hr, $750=8hr, $980=full day. So the first-day start-time picker is a RELABEL of the existing
duration options (start times, ends 10:30pm), NOT new pricing. Last-day leave-time picker mirrors it (starts 5am).
Full spec now locked → build the redesign (front-end first, then backend with a staging dry-run).

## Drew feedback on first-day picker — Sat 11 Jul 2026 09:54:42 -0400 (msg `19f5175b06661b1b`)

> And loving it so far. The note you have on the buttons that say "access ends at 10:30pm." Let's get rid
> of that. They can have access as long as they want. That's kinda included. Just don't put anything there.
> Let's maybe change the button layout to be the time, then a long dash, then Day 1 Access Time.
>
> And the text prompt at the top of Step One can read "you get access on Day one of your event, starting at
> the time you select here, and it goes continuously until you get to the end of your event."
>
> For the second page, (step 2), let's change the text at the top to says "Choose the First Day Of Your Event"
>
> Then they choose that day, then it should confirm with them their progress so far: "Confirming: your event
> session starts on X date, and you have initial access to the venue starting at X time."
> Then it gives them the options of Book multiple more days, or book the last day, same thing we already
> discussed, but that's the logic.

**To build:**
1. First-day buttons: REMOVE the "Access until 10:30 PM" badge. Layout = "<time> — Day 1 Access Time" + price.
2. Step-1 intro (first day): "You get access on Day one of your event, starting at the time you select here,
   and it goes continuously until you get to the end of your event." (Access is continuous/included — no 10:30pm end.)
3. Step-2 heading (multi-day first day): "Choose the First Day Of Your Event".
4. Step-2 = date-only (start time already fixed by the Step-1 option). After date: confirmation
   "Confirming: your event session starts on <date>, and you have initial access to the venue starting at <time>."
   Then TWO buttons: "Book multiple more days" / "Book the last day".

## Drew — Sat 11 Jul 2026 10:19:06 -0400 (msg `19f518c004e6b4a4`)
> Flawless. Let's keep going to step 2

Step-1 tweaks approved. Go-ahead to build the Step-2 flow (heading + date-only + confirmation + 2 buttons).

## Drew feedback on full flow — Sat 11 Jul 2026 10:50:47 -0400 (msg `19f51a90b0a4ff3b`)

> Incredible. Let's change the text. I went through it for October 3, then did multiple days, then did 4.
> Noticed it here. It said: "Confirming: a full day on Sunday, October 4, 2026 (5:00 AM to 10:30 PM)."
> Instead it should say "confirming a full day on Sunday October 4., going into the next day continuously."
> We don't need to say 5am and 10:30pm. They can stay the entire time. The times only come into play on the
> start time and departure time of the event as a whole.
> Also the buttons were confusing. [The middle-day "this is the last day" wording made it seem like the
> current day becomes the last day.] After selecting an additional day, the prompts should be either "choose
> more additional days" or "move forward to selecting the last day." The last day is a SEPARATE departure day.
> Hypothetical: Oct 3 first day check-in 4pm → choose multiple → Oct 4 full day → choose multiple → Oct 5 full
> day → chose last day → Oct 6 inherently the last day, then select departure time.

**To fix (wording only; the flow already adds a separate last day):**
1. Middle-day confirm: "Confirming: a full day on <date>, going into the next day continuously." (drop 5am–10:30pm)
2. Middle-day card + subtext + intro: drop "5:00 AM to 10:30 PM" (continuous). Just "Full day $980".
3. Button labels: first day = "Choose multiple more days" / "Choose the last day"; middle day = "Choose more
   additional days" / "Move forward to the last day" (last day is the SEPARATE departure day that comes next).

## Drew — Sat 11 Jul 2026 11:13:20 -0400 (msg `19f51bdaad6abe36`)
> Absolutely flawless. I just tested it, and I love it. Keep moving forward!

Front-end flow APPROVED. Next = the backend (book + price each day server-side) — money-flow, staging dry-run
(sandbox Square + staging Acuity 14110701) before any live charge; then the deposit disclosure. Reply msg pending.

## Backend integration gap + question to Drew (2026-07-11)
Staging diagnostic: the multi-day flow dead-ends at review (Step 2, disabled Pay button, universal fields
never collected because days only traverse Steps 1-2). Fix = route the last day → details → waiver → pay to
collect contact/waiver/card ONCE for the event, cart summary + total on the pay step. Blocking product/money
decision (Drew's call) → asked him: for a multi-day event, are guest count/event details collected once for the
whole event or per day, and does the 35+ cleaning fee apply once or per day? Reply msg pending.

## Drew's checkout answers — Sat 11 Jul 2026 12:48:48 -0400 (msg `19f521513d7f24d0`)
> 1. Yes one time. Phrase it as what is the total maximum number of attendees during the event as a whole,
> or however you think. But generally follow the same questions we had last time honestly.
> 2. For a multi day event, cleaning fee is mandatory no matter what. No matter total amount of people. For a
> single day event, keep the 35 people logic. Cleaning fee in both instances is $150, once, per session. Not day.

**Resolved:** (1) collect guest count + event details ONCE for the whole event (label: total max attendees for
the event as a whole); same intake questions as the single-session event. (2) Cleaning fee = **$150, ONCE per
event booking (NOT per day)**: multi-day event = ALWAYS/mandatory (any headcount); single-day event = the existing
35+ rule. Apply in BOTH client display + server computeCart (authoritative).

## Drew — live build summary — Sat 11 Jul 2026 13:33:32 -0400 (msg `19f523e07159000f`)
> Also pip, I just went through it... it would be great that it adds the summary of the days, start times and
> finances live in the summary AS you build it. So if I select 4pm start time on October 3rd, as soon as I
> confirm and go to the next day, it should then pop up in the summary live while you're booking to see what
> dates and times you have so far + the cleaning fee — since that's baked in for all multi day events.

**To build:** a LIVE running summary during the multi-day build — each committed day (date + access/start time +
price) appears in the summary panel AS you add days, with the running total + the $150 cleaning fee (baked in for
all multi-day events). Front-end (also surfaces the cleaning fee Drew confirmed is mandatory for multi-day events).

## Drew — Airbnb-style range REDESIGN + fixes — Sat 11 Jul 2026 14:03:02 -0400 (msg `19f5259090432b36`)
Drew (gracious, "my mistake the whole time... best most efficient flow"):
1. "Good to Know" clause: for a multi-day event, change the 35+-cleaning-fee line to "Because this is a
   multi-day event, there is a mandatory $150 cleaning fee automatically added to the booking." (no headcount).
2. Cleaning fee must show in the live summary IMMEDIATELY (multi-day event = mandatory, known upfront).
3. **RESTRUCTURE the multi-day flow (Airbnb-style range, supersedes add-days-one-at-a-time):** fixes the
   logistics bug (users can currently pick non-sequential dates per day). New flow:
   - Event → Multi-day Event.
   - Step 1: "What time would you like access to the venue on day one of your event?" → pick start time (e.g. 4 PM).
   - Calendar opens: pick the FIRST day (start date), then on the SAME calendar pick the FINAL day (end date).
   - System auto-blocks the full contiguous range. Summary auto-populates: Day 1 = start time; middle days = full;
     last day = full (default, latest departure 10:30 PM).
   - "Early checkout" option on the LAST day: default = full day / 10:30 PM departure; can pick an earlier
     checkout from the predetermined times (with the corresponding lower price). Upsell-friendly (defaults to full).
   Summary = "choose day-one access time → start date → end date → auto range → last day full by default →
   optional early checkout." Like Airbnb.

**Plan:** (a) quick: cleaning fee immediate in summary + the multi-day policy clause. (b) BIG: rebuild Step 2 as a
start-date + end-date RANGE picker that auto-fills the days (first=start-time, middles=full $980, last=full default
10:30 PM with optional early-checkout leave-time picker). Keeps the gate, first-day time picker, pricing, live
summary, routing, cleaning fee. Replaces md-add-multiple/md-add-last per-day date selection.

## Drew — approve range scope + deposit toggle back-pocket — Sat 11 Jul 2026 14:18:32 -0400 (msg `19f52673a1b12c7c`)
> Pip you're amazing. Absolutely flawless scope. Let's do it. Let me know when there's an update to test.
> Also, put in your back pocket. Lets make payment in full the default, but allow them to toggle over to "Or pay
> 60% up front non refundable. The 40% will charge your card automatically 2 days before the event date start"

**Range restructure APPROVED — build it, tell him when ready to test.** BACK-POCKET (secondary): payment default =
FULL; add a toggle "Or pay 60% up front non refundable. The 40% will charge your card automatically 2 days before
the event date start." (This is the deposit disclosure Drew dictated — ship the COPY + toggle. NOTE: the actual 40%
AUTO-charge execution is the gated item-6 machinery [[drew-self-authorizes-money]] — arming it = Andrew's standing
gate (deposit-refund policy sign-off + staging dry-run); FYI Andrew when wiring the disclosure so copy matches reality.)

---

## Drew reply 2026-07-11 15:17 EDT (msg 19f529d48026d3f8) — VERBATIM

Source: Gmail thread 19f424228b20d389, account andrew@entrpy.co
From: Drew Shahoud <drew@entrpy.co>
Date: Sat, 11 Jul 2026 15:17:34 -0400

> PIP, I freaking love it. This is all absolutely flawless. The only thing I would want to change in this situation here is the description in the "Your Event" section at the bottom of the screen. On the last bullet point, it says, "Last day: Monday, October 5, 2026. Access from 5:00 a.m., leave by 10:30 p.m." Let's just change that to not include the "access from 5:00 a.m." part. The new verbiage on the last day should always be: "Last day: X date. Access all day, leave by X time with studio fully reset.”
>
> everything else is perfect. Let’s keep going.
> I love how you have the add-ons all in this next page. This next page is perfect, and the add-ons are placed perfectly as well. Let's just change the order of the add-ons themselves. Let's start with:
> White banquet chairs
> Tables
> 86-inch rolling TV
> PA system
> Rolling walls
> Backdrops
> The lighting rental
> At the very bottom of all the add-ons, I want to take the Events Setup and Reset Crew and make it a much bigger placeholder than just the standard placeholder we have currently. That'll mean that the photo will take up more space, and the title can spread more horizontally. It can be pretty much the whole horizontal distance of this intake form, and then the text can go horizontally more as well. Before we get to the actual description of the add-on itself, let's keep the title as Event Setup and Reset Crew, and then have it in bold italics: "By no means necessary, but certainly makes your event more enjoyable." Then you can get to the full description we already have. All the contact information and everything else is totally fine.

### Triage (all fast-path, Drew-directed copy/UI; no money/arch/legal/gate)
1. **Last-day summary verbiage** — drop "Access from 5:00 AM"; new: "Last day: X. Access all day, leave by X with studio fully reset." (renderRangeControls breakdown).
2. **Reorder add-ons**: White banquet chairs, Tables, 86" rolling TV, PA system, Rolling walls, Backdrops, Lighting rental — then Event Setup and Reset Crew LAST (booking-config.js PV addons array).
3. **Event Setup and Reset Crew = full-width big card**: bigger photo, title spans horizontally, keep title "Event Setup and Reset Crew", then a bold-italic tagline "By no means necessary, but certainly makes your event more enjoyable." then the existing description.

---

## Drew reply 2026-07-11 15:40 EDT (msg 19f52b2139b717e7) — VERBATIM

> Truly amazing PIP. I just went through everything up to this point, and it looks incredible. Let's go ahead and fix this Event Setup and Reset Crew. You got the horizontal width done well, but let's make that photo spread horizontally the full width. Above the photo, you can have: the title / Subtitle / the optional button / the $750 button. Then you can have the photo spread horizontally, and under it you can have the full description, also spread horizontally the whole way. At the very bottom of the description, you can have a button that says "Add the Setup/Reset Crew to your booking". No need for the photo or anything within the button. Just the pill button, large, in itself.
> Overall this should essentially make it look like one large square add-on option rather than stretching it vertically so much like there screenshot, and then splitting it in two. You essentially spliced the cuber in two sides with a vertical axis, where photo is left, content is right. Keep that theory, but through the horizontal axis.

Shipped: `renderFeaturedAddonCard` restructured to a vertical stack (header → full-width photo → full-width description → large plain pill button "Add the Setup/Reset Crew to your booking"), pills "Optional" + "$750". Staging-verified + confirmed to Drew (msg `19f52b7b847020cb`).

---

## Drew 2026-07-11 15:52–15:56 EDT — THREE messages VERBATIM

**msg 19f52bccee3d674d (15:52):**
> Absolutely crush it. Let's change a little bit of the information about that add-on as a whole. The first option is Utility Tables and Extension Cords. Go ahead and make the Storage Building an additional option for that specific item as well. Make living room furniture optional to go into the Storage Building. Let's go ahead and mirror this exact same layout and setup for the Event Setup/Reset add-on for the single-day sessions as well. Just make this a universal layout system for any event booking, and obviously don't make it an optional add-on for photo or video session bookings.

**msg 19f52be7ed1b3688 (15:53):**
> For this field, we don't need this pop disclaimer because it's a forced $150 cleaning fee regardless, due to it being. Multi day event. So get rid of it on the multiple day path. Leave it for single day path.

**msg 19f52c0b87f46793 (15:56):**
> Also here, make it say (Balance $X will be auto-charged to the card on file 48 hours before session start)

### Triage
1. setup-crew placements: add "Storage Building" to Utility Tables and Extension Cords + to Living room furniture (config). Featured card layout is ALREADY universal for event bookings (eventsOnly + featured) — verify single-day event shows it, and NOT photo/video.
2. Cleaning-fee popup disclaimer: suppress on MULTI-day path (fee is baked in), keep for single-day (35+ surprise).
3. Deposit balance copy → "Balance $X will be auto-charged to the card on file 48 hours before session start." (Drew-directed; the 40% auto-charge = item-6 machinery, staging-only for now, prod-merge gated on Andrew — FYI.)

---

## Drew 2026-07-11 15:59 EDT (msg 19f52c36d21a0bc3) — VERBATIM (arrived after the 3 above, before my reply; processed this tick)

> Another one for you as well. I want to add a specific page here that says "Add-ons." I almost want to make it like a literal menu system for all the add-ons. That way, anyone can see the price of our add-ons on the frontend, and they don't have to go through the booking process. Pretty much just copy and paste everything we already have in our booking process, but make them all a little bigger. You can consume the entire screen here because this entire page is for nothing more than displaying information about the add-ons, the photos associated with it, and the pricing for each one. Just go ahead and make that entire page and do all that information, but there doesn't need to be any calls to action or things to interact with. Outside of that, at the very top of the screen, say "Book your session with us," and then make that a pill they can click. It takes them straight to the flagship location booking page.

Shipped: new **`/add-ons`** page (`add-ons.html`) — full-width display-only menu of every PV add-on (photo, price, full description, tier/backdrop/wall options listed with prices) in the booking order, reads `window.WWS_BOOKING_CONFIG` so it stays in sync. No CTAs; "Book your session with us" pill (top + bottom) → `/book-powdersville`. Staging-verified (HTTP 200, 8 cards, 0 interactive controls) + confirmed to Drew (`19f52d3bfa1e8525`).

---

## Drew 2026-07-11 16:21 + 16:23 EDT — two messages VERBATIM

**msg 19f52d7bd7687434 (16:21):**
> Absolutely incredible. For the add-ons menu page, make sure we have a tab in our menu at the top of the website that allows you to open that page up specifically by clicking on it.

**msg 19f52d96298f09af (16:23):**
> Let's rename these two options to Hair and Makeup Area.

### Triage
1. Add an "Add-Ons" nav link (→ /add-ons) to the top menu across the site's main pages.
2. Rename the two "Getting-Ready area" setup-crew placement items → "Hair and Makeup Area" (Rug + Furniture) in booking-config.js.

---

## Drew 2026-07-11 16:38 EDT (msg 19f52e735e36cdc2) — VERBATIM + 4 floor-plan PDFs

> Pip I'm not sure how to leverage these, but these are the different floor plans and measurements of the space. They've genuinely very helpful for people. It shows the full size of the studio, the default studio layout (that's literally how it looks 24/7) and then other mocks that are 100% true to scale for event setups – just to really show people info on how many chairs and tables you can fit in there, and how much standing room you have for a "dance" floor area. What do you think? These assets are genuinely so helpful for people. I hear it time and time again, but idk how to leverage them on the site to where to place them.

Attachments (4 PDFs, saved + converted to PNG in `images/floor-plans/`): Default Layout, Empty (full size + dimensions), Event (seated: 10 tables/80 seats/680 SF dance floor), Event Standing.

Triage = question/collaborative. Response: built a **`/floor-plans`** page (mirrors the add-ons menu) showing all 4 plans full-size to-scale with captions + book pills, added a "Floor Plans" nav tab site-wide, and offered a follow-on placement (a "See the floor plans" link inside the event booking flow near chairs/tables). Confirmed to Drew (msg `19f52eeeb39cb520`).

---

## Drew 2026-07-11 16:56 EDT (msg 19f52f7fc9085ec4) — VERBATIM (+ phone screenshot IMG_0297.png)

> Incredible work. Great call. Only revision is this one.
> Title: event mockup — standing and seated.
> Description: (u can make it better) A Seated and standing arrangement maxed out with some dead space on the right wall for food and beverages.

(Attachment IMG_0297.png = a phone screenshot of Drew viewing the staging /floor-plans page, pointing at the last card — sheet A2.1, which is a combined seated + max-standing (112) + DJ-booth layout. Not a replacement image.)

Shipped: 4th plan retitled "Event Mockup — Standing and Seated" + rewritten caption (food and beverage station on the right wall). Confirmed to Drew (`19f52facb52a29d7`).

---

## Drew 2026-07-11 17:10 EDT (msg 19f5304eadd351d8) — VERBATIM + 2 PDFs

> Incredible. Add these two on there as well.

Attachments: "Ceremony - WhiteWall Floor Plans.pdf" (A2.3, 163 chairs facing altar, 6ft aisle), "Maximum Standing - WhiteWall Floor Plans.pdf" (A2.2, 281 guests full space). Converted → PNG, added as 2 cards on /floor-plans (now 6 plans). Confirmed to Drew.

---

## Drew 2026-07-11 17:20 EDT (msg 19f530d6fed9587b) — VERBATIM

> All right, I'm back to events, and I'm building it out with the add-ons now, and it's not live tracking with every line item display like I wanted it to. I click on the chairs, and it's a three-day event, and it just tells me the total amount for add-ons. It doesn't have a specific line item specifically for the chairs, and then show me the math summary for each individual day's worth of chair add-ons adding up in the summary live. I want that to be live for all individual add-ons, and then you'll eventually have the inherent total sum of all the add-ons.

Shipped: rebuilt the multi-day summary add-on section — each add-on is its own live line with the per-day math (Day 1 full + Day 2/3 tapered) adding to its subtotal, then an Add-ons total, then the estimated total. Cents now exact ($161.50). **ALSO fixed a real overcharge:** syncRangeAddons was mirroring EVERY add-on onto every day, so flat add-ons (Setup Crew $750, lighting) were charged once per day (3-day = $2,250). Now discountable gear = per day (tapered), flat add-ons = once (day 1 only) — corrects summary + Step-5 total + server charge. Flagged lighting once-vs-per-day to Drew for confirmation. Confirmed (msg `19f531d2d543d74a`).

---

## Drew 2026-07-11 18:24 EDT (msg 19f53489dcca8270) — VERBATIM

> Absolutely flawless. I genuinely think we're all set. Can you verify everything works on the back end with acuity and scheduling and all of that?

Triage: Drew signals the flow is done and asks for a backend (Acuity + scheduling + charge) verification. Action: run a fresh comprehensive staging booking dry-run and report definitively.
