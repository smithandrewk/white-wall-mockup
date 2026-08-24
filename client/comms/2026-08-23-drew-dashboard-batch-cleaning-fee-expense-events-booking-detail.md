# Drew — dashboard batch: Watson block-off failure, phase 2, cleaning-fee accounting, Expense Tracker, Today's Bookings, booking detail, Events tab, Watson skill

Thread: `1a02f35b23344ffe` (schedule thread, account andrew@entrpy.co)

---

## Round 115 — Drew inbound (VERBATIM)

- **Source:** Gmail (andrew@entrpy.co)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Sun, 23 Aug 2026 20:00:00 -0400
- **Msg id:** `1a031114e40e4053`
- **In reply to:** Foreman Round 114 note `1a0306b324b3e8ce` (Block Off live + verified + phase-2 + risk/liability disclosure)
- **Attachments:** `Screenshot 2026-08-23 at 7.45.57 PM.png` (Watson iMessage conversation), `Screenshot 2026-08-23 at 7.42.09 PM.png` (booking detail page for WW-2876 Alaina Newhouse)

> I just tried having Watson do it, and he has failed a couple times now, or at least not done correctly. Here is a screenshot of the text conversation.
>
> The charge card thing is great. I'll make sure it's always manual. And I would like to see the last 4 of the car duo I can always confirm it with the client before changing it.
>
> When will phase 2 be done? Are you ready to make it all live – just need Andrew permission to push forward?
>
> Also: we need to make a couple changes to the dashboard.
>
> 1a) all the numbers that appear on the Overview page (and likely the revenue page too) need to calculate with the cleaning fee taken out. This will have to be manually tracked with a system you build. Ou internal cleaning fee is $110. Not $150, like we charge the customer. Its $110. So if we ever get any booking at all that triggers a cleaning fee, we need to keep track of that, and we need to subtract that from out net amount. Fro example, today we got a booking for $600. Ryan Clarke. I need to show all the numbers for that session with the same math we have going on the dashboard currently, bt then also subtract the cleaning fee. On the overview tab, and also in a large portion of all the revenue tabs, I'm going for Net To Our Bank number. This is a fixed expense that we can account for and take off in the rview right away. Make a note that you are taking off for cleaning fees when I hove over it too; just like you have ones about Net after Square fees or whatever.
>
> 1b) I want to make a new tab called Expense Tracker. We'll have to build this out. But right off the bat we know some key expenses are cleaning fees, and Backdrops. I can get you the data for Backdrops historically to inout for this year. This tab as a whole is just going to pick up starting for 2026. Within this tab, I want to have a live, month by month tracker of expenses – but rn lets focus on Cleaning fees. I'm gonna yield to you on how t do this. I think you know what I want, but I'm trying to figure out a way to track specifically all the cleaning fees we are racking up. Should be very easy to backtrack and figure out – since we know when the cleaning fee gets triggered, and it's always $110 each time. But I want to be able to see how many cleaning fees we had each month to what bookings were they tied to, average revenue per cleaning fee tagged-on, and what the session was (likely event, but it might be photo/video every now and then). I want have that data on display – similar to how the booking tab displays all some key data, but this is specific to tracking cleaning fees, and seeing how the data stacks per month, and then taking the number and then going to the cashflow tag, and keeping up with a automated new Fixed expense, called Cleaning Fees. This is going to be a fixed line item you need to make, and then keep it live and current based on all the cleaning fees for that month to date when I view it. New month? Number goes to zero. It's based on when RECEIVED the booking that will have the cleaning fee tied to it, even though the cleaning fee wont be paid util the booking itself comes whenever their actual session is. Make that note clear for that lien item youll make.
>
> 2) in the overview page, in the chart it says Today's Bookings. I want to be able to click that, and be taken to a page on the booking tab that deliberately only shows Today's Bookings. So essentially make another toggle on the booking tab that shows Today's Booking. And then in the sub-text of that toggle say "These are bookings that our site received today." And then it displays the same data that a normal session displays as you see on the booking tab.
>
> 3) can you give me an update on the progress for tracking down the correct event bookings? Historically, the dashboard was saying certain sessions were events when they weren't. Any event booking is deliberate chosen when the customer is going through the booking process. It's actually the very first thing they select as they go through the booking process. Either Event, or Photo/Vodeo shoot. Any progress there on how accurately we are now tracking Events? Should be easy to track, and go back through he dashboard and make sure the data is correct – due to that tag w should have for all the bookings coming in.
>
> 4) when in the booking tab, I want to be to click the specific booking, no matter there filter view, and see everything about that specific booking. I'm showing you a screenshot of what it looks like when I click a booking. This doesnt work for me rme. I need to see pretty much ever bit o info we have for this booking. Client info, last 4 of card they paid with; to be able to charge card (we can do charge card part last, but lets get everything else built here) the start date and time, they add ons, how much they paid in total, how much they paid in add ons, lead time for they booking, IG, email, phone number, customer name, event or not, purpose, lead source, repeat client, etc. literally everything in an easy to read, simple method specific to this booking.lets get that fixed asap.
>
> 5) Take the Events tab out of the Stats tab and make it a real tab. i want to hone in on getting more clean stats on Events and have a designated spot to clean Events up and make it more hyper focused on all stats and data SPECIFIC to events. I think you could honestly see my intention alone here and absolutely snipe it. You know what I need. Let's get all the easy-to0read and important stats for events based off all the data we've collected so far.
>
> 6) can you give me some sort of Skill to feed watson, and some steps and tutorials on how to deliver this skill to him, so whenever I mention literally anythign about WhiteWall literally ever, he knows to go to the Dashboard specifically as the SOT? Like if I ask him a question, he needs to go there to find the answer. Same with blocking off on calendar, or getting stats, or numbers, or availability, literally anything. Only exceptions woudl be when I ask him to make a payment Lin for me (directly with square) and then the skill he already has in refunding clients when they cancel by scanning the email for cancelation emails. Can you get me that skill, and make it so I can speak broadly bot it and not have to hyper prompt him, and then tell me where to put that skill so he wont forget it and then how to feed it to him so its just part of his operation ow and now always needing me to baby him with prompts about whitewall?

---

### Screenshot readout (evidence)

**Watson iMessage screenshot** — Drew asked Watson "Block off one hour at the Powdersville studio today at 9 PM." Watson did it **directly via the Acuity API** (block IDs 10197871857, then 10197931561), NOT through the WhiteWall dashboard UI. Watson's own words: *"I checked the WhiteWall dashboard, but the access I have there only exposed read/availability verification — I didn't find a dashboard write action for creating a block. So I created the block in Acuity, then verified through availability that the time was removed."* → **Root cause: the agent API has no `block_off` action wired yet** (the human `POST /api/calendar/block-off` shipped in Round 114, but the agent capabilities catalog was never given the verb). Watson fell back to its own direct Acuity credentials. Fix = wire the agent `block_off` action (mirrors `delete_session`) so Watson goes through the controlled dashboard path.

**Booking detail screenshot** — `/bookings/[id]` for WW-2876 Alaina Newhouse. Currently shows: booking type, session type, add-ons total ($0), Collected (Square net $107), an empty add-ons section, and raw booking notes (incl. the CARD-ON-FILE CONSENT block with square_customer_id / square_card_id but no clean last-4). Drew wants a comprehensive, easy-to-read readout: client info, last-4 of card, start date/time, add-ons, total paid, add-on paid, lead time, IG, email, phone, name, event-or-not, purpose, lead source, repeat client. (Charge-card action he explicitly defers: "we can do charge card part last.")

### Triage (Round 115)

Access window ACTIVE through 2026-08-24 06:00 (armed). Andrew's Round-114 blanket go — *"do whatever Drew asks but make him aware of the risks and his liability"* — covers this whole batch; nothing here is out-of-repo / legal / customer-scale / new-architecture beyond what he already authorized, so NO new escalation. Items:

- **Watson block-off failure** → wire agent `block_off` action (fold into DREW-47 / DREW-28 Watson-actions family). QUICK WIN, ship first. ✅ **SHIPPED + LIVE + VERIFIED** — dash PR #144 merged + deployed, `ACUITY_WRITE_ARMED=1`. New `POST /api/agent/v1/calendar/block-off` reuses `lib/acuity-write` (blocks-only, arm-gated, calendar allowlist); `block_off` in the capabilities catalog. Live armed proof on the deployed dashboard: agent route wrote a real Powdersville block (id 10198033203), confirmed via `GET /blocks`, deleted (204), zero residue; agent surface intact (get_metrics 401 not 503). Confirmed to Drew (msg 1a0312036dac3645).
- **Phase 2 status + "just need Andrew permission?"** → answer inline: Andrew already gave the go for BOTH phases (Round 114); phase 2 is built + mirror-tested; the last step before it charges real cards is a Square-sandbox charge proof so the first live charge isn't the test. + confirm charges are always manual + last-4 will show before any charge.
- **1a cleaning-fee net ($110 internal)** → new ticket. Display/accounting only, no upstream/customer money. Needs cleaning-fee detection (investigate add-on vs event-auto).
- **1b Expense Tracker tab + auto Cash Flow "Cleaning Fees" line** → new ticket (larger).
- **2 Today's Bookings toggle + clickable Overview tile** → new ticket.
- **3 event-tracking accuracy** → status answer inline (DREW-67 is_event derivation) + verify historical counts.
- **4 booking detail enrichment** → DREW-71 ✅ SHIPPED + LIVE + VERIFIED (PR #145; prod: Alaina WW-2876 card ••1664 '10 days ahead', Ryan Clarke ••7982 '75 days ahead'). Confirmed to Drew (msg 1a0312c3522224bb).
- **5 Events → its own top-level tab** → new ticket.
- **6 Watson SOT skill/charter document** → DREW-73 ✅ DELIVERED (client/deliverables/watson-whitewall-skill.md; sent + attached, msg 1a0312c3522224bb).
