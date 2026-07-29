# Drew — Session Builder locked-link: "Three big issues" (2026-07-29)

- **Source:** Gmail (work mailbox `andrew@entrpy.co`), thread `19fa478568fc46a2` "WhiteWall Dashboard Revisions"
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- **Date:** Wed, 29 Jul 2026 09:42:56 -0400
- **msgid:** `19fae1d88616f9ea`
- **Classification:** change-request (deliberative — substantive, structural, money-adjacent locked-link path)
- **Attachments (3 PDFs, saved in `attachments/`):**
  - `2026-07-29-drew-link-Sending-Link-Imessage.pdf` (primary evidence, issue 1)
  - `2026-07-29-drew-link-Sending-Link-Email.pdf` (issue 1, email path)
  - `2026-07-29-drew-link-Pasting-Link-In-Browser.pdf` (issue 1, browser-paste works)

## Verbatim

> Three big issues:
>
> 1) when I paste that link in a text, especially imessage, it doesn't work. Im going to upload a PDF of screenshots of exactly what happens when I paste the link. Theyre in order. Take a look at that and see whats going on. That cant happen. We gotta make it super easy and not show up as a large text. Gotta figure out how to condense it, or at least make it all hide in the hyperlink or something. Idk. Youll figure it out. A few PDF's. The primary concern one is the PDF called "Sending Link in iMessage", where you can see exactly how it flows for iMessage itself. Doesn't work. The email PDF is called "Sending Link Email". It shows you all the steps as well.
> Now, lastly, if I just go directly to the session builder, copy a link, open up a new browser tab, and then press Command-V in the new browser tab, copying and pasting the entire thing into the browser, when I press Enter, it takes me exactly where it's supposed to take me. It looks like the link does work, but it's not setting up properly for some reason to paste it anywhere outside of a browser.
> If I paste it into a notes section or I paste it to iMessage or email, it doesn't work, but when I paste it entirely into an actual browser itself with everything copied, then it does work. We can't have that issue, and this link is absolutely monstrous.
> Granted, I could hyperlink it within an email to solve the length issue of the link, but for iMessage, it needs to all stay within that one URL thing. It doesn't need to send all that text in a separate message. I'm not sure how you fix that. It looks like the link just isn't attaching to the main WhiteWall Studios.co book powders location. I'm showing you two screenshots from this one as well, which is just me pasting a link into the browser and then where it takes me. That is called "Pasting Link in Browser PDF".
>
> 2) the completely separate issue now is that when the link actually does work and they end up at this landing page, it doesn't actually work. They end up at this landing page, and they can see the total price summary and everything on the right side, but the buttons and the prompts that continue through the session just don't work or make sense. We're gonna revise this pretty heavily. I like the flagship location booking summary on the right side with all the pricing and everything, and that's fantastic, but why are they choosing a time? The summary already shows them the dates and the times and everything. They should not be at the choosing timing stage. They should be right past that. They should also pass step 2. They don't need to choose the dates, but even currently, with how you have it structured, there's no way for them to move forward at all. Now, at step 2, everything is grayed out as it should be, but I can't even do "Review your event" or "Add details." That's the button that is supposed to be clickable, but honestly, we don't even need them to have that button. They should end up at step 3, where they're filling in other session details. The add-ons themselves are all grayed out because they can't add anything or change anything. They need to fill in all the information here. On their side of things, they need to fill in:
> How many people will be attending your event?
> Tell us about your event.
> Will there be food and drinks?
> Required acknowledgments.
> They need to fill all that information out, and then there needs to be a button for them to continue moving forward or something like that. It's really just like the normal website. After they finish step 3, what's next? Naturally, they just need to pick up, essentially add step 3, and then keep going. They need to fill in all the information, but they can't adjust anything with the pricing, the dates, or any information. That I put in the link should take them straight to where we left off building this session in step 3. They fill in all the information that they need to fill in, and they move forward throughout the entire booking process just like normal on the website, and they pay and everything.
>
> 3) on the session builder side of things, as I'm going and building out this session, I don't need to see "Will there be food or drinks at your event?" They will see that, and they'll answer that question accordingly, but I don't need to see that. The required acknowledgements, I don't need to see that either on my end. I literally just need to see the add-ons. I would also still like to see "How many people will be attending your event?" and "Tell us about your event." This is where I need you to be specific on the build here. I want the opportunity to fill in the total number of people attending the event and put in details about the event itself, but I also want the ability to not have to fill that in. If I do fill those things in when I go to send the link to them, it shows up as grayed out, and they can't adjust the total number of people attending the event or what the event is about. If I choose to not fill those things in, then just like normal, they still need to put in how many people are joining their event and what exactly their event is. They will essentially just fill it in if I didn't fill it in. It's optional for me as I'm building out this session. If I fill it in, great, all of the information is already there for them, and they don't have to worry about those two fields. If I don't fill it in, then they need to fill that information in accordingly. Of course, they still need to do everything else on the booking page here, which is:
> Will there be food and drinks?
> Required acknowledgments
> They need to obviously fill in every bit of additional information that comes on the next step, four. I want to have that ability in the middle of the page, right next to the session builder title. Have another button that says "Start New Session Build" that essentially just resets everything and brings you back to page one, where I can start building from scratch a new session

## Triage (Foreman)

Three distinct-but-coupled follow-ups to the Session Builder locked-link feature (Phase 2 / DREW-21 + the DREW-23 Get Link button). Money-adjacent (the locked customer checkout), so **staging money dry-run required before prod** for the customer-flow change.

- **DREW-24 — Short offer links.** ROOT CAUSE confirmed from the iMessage PDF: the offer URL is a ~4KB base64 token in the query string. iMessage/Notes/email link-detection truncates it — iMessage renders a rich preview card whose href is the bare `whitewallstudios.co/book-powdersville` (offer param dropped → "no progress saved"), and the rest of the token spills as un-linkified plain text (`=eyJ2Ijox...`). Pasting the *entire* string into a browser works (URL is valid, just too long for messaging apps). **Fix:** stop putting the full token in the URL. Store the signed payload server-side (shared Edge Config, keyed by a short id) and put a SHORT code in the URL (e.g. `?offer=<shortid>`); booking site resolves shortid → payload → verify. Was the known Phase-2 nit ("~4KB, work everywhere, look chunky"); now a hard blocker.
- **DREW-25 — Locked customer flow lands at Step 3 and can actually proceed.** Today the locked link drops the customer at the time/step-2 stage with everything grayed and NO working "continue" (the "Review your event / Add details" button is dead). Drew wants: skip time + date selection (locked from the link), land at **Step 3 (Session details)**, leave the customer-input fields EDITABLE (# people, tell us about your event, food/drinks, required acknowledgments), keep pricing/dates/times/add-ons LOCKED, and give a working path forward through the normal booking → payment. Coupled to DREW-26 (what Drew prefilled decides what's locked vs open).
- **DREW-26 — Builder-side field visibility + optional prefill + "Start New Session Build".** In the dashboard builder Drew does NOT want to see "food/drinks?" or "required acknowledgments" (customer answers those). He DOES keep "# people" + "tell us about your event", but they are OPTIONAL for him: if he fills them → locked/prefilled for the customer; if he leaves them blank → customer fills them normally. Add a **"Start New Session Build"** button next to the Session Builder title that resets to page 1.

Note: DREW-25 makes the customer check the (unchanged) required-acknowledgment text themselves rather than it being pre-checked — this is not a terms.html/legal-text edit, and is arguably more correct (the customer, not Drew, acknowledges). No standing-decision conflict; both repos in scope; reversible + staging-gated; Drew self-authorizes WWS product/money-policy (item-6 auto-charge is the only Andrew gate, not touched here) → BUILD, do not escalate.

---

## Follow-up 1 — "still trapping us at step two" (2026-07-29 14:19 ET)

- **Source:** Gmail (`andrew@entrpy.co`), thread `19fa478568fc46a2`
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- **Date:** Wed, 29 Jul 2026 14:19:06 -0400
- **msgid:** `19faf1a3d1fd7a3a`
- **Attachment:** `attachments/2026-07-29-drew-step-two-trap-IMG_0738.png` (iPhone screenshot)
- **Classification:** incident (regression report on the DREW-25 locked flow, money-adjacent)

### Verbatim

> Also, I copy the link and sent it again for a trial run and it's still
> trapping us at step two and not step three I copied it multiple times in
> different locations live in the Session boat itself and also from the quick
> access button in the safe sessions still not working it takes you straight
> to step two and it doesn't let you continue to Session detail details
> Here's a screenshot

### Screenshot analysis (IMG_0738.png)

Locked-offer banner IS showing ("...change? Reply to the person who sent you this link.")
— the offer is recognized and the DREW-24 short-link resolves. Progress bar: **1 TIMING (done),
2 SCHEDULE (current), 3 DETAILS, 4 WAIVER, 5 REVIEW.** Body = **STEP 2 "Pick a date & time"**
with a live July-2026 calendar (29/30/31 selectable, none highlighted) + a "CONTINUE TO SESSION
DETAILS" button + BACK. This is the **photo/video** five-step flow.

### Root cause

`scripts/booking-flow.js:1674` — `initOfferMode()` lands the customer with
`setStep((OFFER.bookingType === "event" || state.eventIntent === "yes") ? 3 : 2)`. The DREW-25
ship sent **event** offers to Step 3 (verified in the DREW-25 prod smoke — a $4,173.30 event),
but **photo/video (`single`) offers land on Step 2 (the schedule/date picker)**. Drew's "drew
test 3" link is photo/video, so it drops on the calendar. The offer DOES carry a locked
`selectedDate`/`selectedTime` (the dashboard `buildOfferPayload` refuses to mint a link unless
every session has a `selectedTime`, `lib/session-links.ts:60`), and `applyFlowState` restores it,
so `hasBookableSlot()` is satisfied — but the customer is still stranded on a timing step Drew
explicitly said they should never see. Matches his original issue-2 wording: "why are they
choosing a time? ... They should not be at the choosing timing stage. They should also pass
step 2."

### Fix (this run — DREW-25 reopen)

Land **every** offer (event AND photo/video) on **Step 3 (Session details)**, with the
timing/dates/times/add-ons locked behind them and shown in the summary — not just events.
Money-adjacent (locked customer checkout) → **staging money dry-run before prod.**

NOTE: The paid/unpaid toggle + card pill (msg `19faf17fe91bf423`, 14:16) and the Watson
full-access ask are being handled by the concurrently-running foreman (DREW-27 + Watson
escalation). This worker owns ONLY the step-two trap.

### SHIPPED + confirmed (Follow-up 1)

- **booking-site PR #107** (squash, merged → Vercel prod) — `initOfferMode` lands ALL offers on Step 3.
- **Prod-verified** (desktop + mobile): real minted photo/video link lands panel 3 (Session details), offer banner present, locked Total $9.
- **Staging money dry-run**: single photo/video offer → Step 3 → waiver → pay → sandbox $9 charge → appt `1745771167` on staging cal 14110701 (canceled after).
- **Confirmed to Drew** `19faf384193750cb` (2026-07-29, no payment mention). DREW-25 → done; revision-status Round 65.
- Test artifacts cleaned: throwaway drafts deleted + prod offers revoked, staging appt canceled, staging OFFERS env removed, staging branch redeployed, worktrees removed.
