# Drew — Round 118: flagship Acuity email audit + hear-about reorder + Setup/Reset Crew copy & mechanics

- **Source:** Gmail (pip@entrpy.co)
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Tue, 25 Aug 2026 11:40:29 -0400
- **Thread:** 1a036c426017a325 (subject "Dinner receipt", Drew kept replying on it)
- **Message id:** 1a03994b8716a7ed
- **Attachments:** `event-setup-reset-crew.html` (10,367 B — scoped `.wws-crew` replacement content block), `Screenshot 2026-08-25 at 11.07.50 AM.png` (WW2892 booking detail view), IG reel thumbnail jpg. Saved under `client/comms/attachments/2026-08-25-*`.

## Verbatim

> Hey Pip let's keep working on some whitewall site revisions.
>
> Three things.
>
> 1) We need to do an audit on all the emails that we have acuity send client when they book at the flagship location. The confirmation email, the reminder email 24 hours before, literally all of the emails they ever get for the flagship location after booking. What I need you to do is 2 things.
>
> 1a) I need you to make sure the reminder email they get and the original booking confirmation email they get BOTH have ll the same info in each of them. As it sits currently, I'm pretty sure the confirmation email has all of the door codes, YouTube links, information, storage code, etc. I believe that confirmation email has literally everything they could possibly need, but the reminder email only has certain information and not all of the main information. They need to have the exact same information in the reminder email. Things like:
> The storage building lockbox code
> Anything
> Is there anything we're missing in these emails as far as information goes? They both need to have all of the information they could possibly need, and they both need to be the same content, just positioned differently, as one is a confirmation and one is a reminder.
>
> 1b) I want you to add this video in there as a hyperlink. Make the text: Watch This Video to see what the studio will look like when you walk in, and what it needs to look like after you reset, before you leave.
> https://www.instagram.com/reel/DZtLEyQyt7H/?utm_source=ig_web_copy_link&igsi=MzRlODBiNWFlZA==
> Wondering what to expect when you arrive at Whitewall? This video tell...
> Whitewall Studios on Instagram
> instagram.com
>
> 2) the order of the When they're going through the booking process on the website, we have a mandatory question that says, "How did you hear about us?" I want to reorder how these answers display:
> Repeat customer
> Google search
> Friend/referral
> Physically drove by
> Organically on Instagram
> Advertisement on Instagram
> Organically on Facebook
> Advertisement on Facebook
> Other
>
> 3) I want to revise the Event Setup and Reset Crew add-on. We need to revise it in two places: the actual Add-Ons page card, and the checkout process where all the add-ons are displayed to clients during booking.
> Attached is an HTML doc. It contains a scoped style block and a content section, plus deployment instructions in a comment at the top of the file.
>
> In both locations, keep everything we currently have: the serif title, the italic subtext, the OPTIONAL and $750 pill badges, the crew photo, and the "Add the Setup/Reset Crew to Your Booking" button. Do not touch any of those.
>
> Delete all the existing paragraph text between the photo and the button, and insert the attached file's contents (both the style block and the section) in its place. Do this in both the Add-Ons page and the checkout add-on display.
>
> Everything in the file is scoped under the .wws-crew class with prefixed CSS variables, so it will not conflict with our existing site styles. Do not rename any classes and do not restyle anything, deploy it exactly as written.
>
> After deploying, verify in both locations that the two cards render side by side on desktop and stack vertically on mobile. If either container is narrower than 640px the cards will stack automatically, which is expected. Also confirm the Instagram video link opens in a new tab and the section sits cleanly between the photo and the button with no spacing issues.
>
> Send me screenshots of both locations, desktop and mobile, when it's live.
>
> 4) I want to change the mechanics of this add on. Right now, if they choose that add-on, we have them fill out more questions about where certain things are going to be moved. Let's get rid of all those questions. Let's just leave it to the add-on itself. They select it and add it to their session, and that's it. There's no more information they have to fill out. On the backend of things, I need to be notified very specifically of this add-on, so we need to change the backend mechanics because there's a lot of manual work that goes into this right now. I need you to do two things:
>
> If they actually book with this add-on, within the email that you send to April for the cleanup crew, I need you to also send her an additional email. Put the same information in that already existing email, letting her know that she will be needed for the event setup and reset crew for this specific event. I want her to get this information within the email she's already getting whenever she is pinged because of a cleaning that's needed for the event. We already have that set up, but I want this information added into that one if this event add-on is added on. I also want an additional email to come through specifically for this one thing, and then just say that she needs to be aware of the setup before the event and this reset and everything after the event. I've already talked with her, so she knows all about this, but we need to set up the automation to make sure that she actually gets pinged whenever this is done. She is the very crew that's going to be doing this add-on. It's extremely important we make sure that system is set up.
>
> check out this screenshot within the bookings tab for session WW2892 for Shauna. She just booked an event, and this is all the information that we see specifically for her session. This is great, as it shows up on the dashboard. Obviously, she didn't add on the event setup crew, but if she did, it would display there in the add-ons. We need to have a dropdown notes section specifically for this add-on within the add-ons. It should always be the last add-on shown, no matter what, so the text box for the notes can be afterwards and not clutter the other add-ons above it. What I want to happen whenever this gets booked is I need a direct email sent to the Whitewall email, specifically for notifying me that a new session has been booked and they added on the setup and teardown crew. This email is explicitly about this one session. Pretty much all the information you see here in the booking screenshot needs to be included in the email. Just short and sweet:
> the name
> the date
> the amount of money
> the add-ons
> the phone number
> the email
> Pretty much every bit of information you see for this booking at WW2892 needs to be put in this email, and then you need to put in bold in this subject line saying "Action required: SETUP/RESET ADD-ON for Session x"
> and then, instead of the X, you'll always put the name of the session itself, which in this case is WW2892.
>
> I also want you, in the email body at the very beginning, to hyperlink the new session within the bookings tab in the dashboard. That way, I can literally just click it and then instantly be brought to this session so I can take a look at everything.
>
> To tell the story of how I want this to work: I'm sitting at my desk doing work on a normal day, and then I see a new session gets booked at the studio because I get all the emails and the text alert and everything. I get an additional email with the subject line, as I just said. I open that email, and the first thing I see is "Visit this session's booking in the dashboard." That whole sentence is hyperlinked so I can just click on it, and it takes me to this view within the dashboard. Underneath that hyperlink is all the information that I'm seeing here anyway.
>
> In the dashboard itself, I see that they added on this specific add-on, and then I can go and manually add notes. It saves every time I add notes. That's where I can put details about what is going where and what is staying and such. I'm sure we'll clean that up in the future, but right now, just having notes tied to this session would be great. Then I can know to personally reach out to the client to set up that call and stuff.
>
> Hey Pip, one more piece of automation I want to build on top of the Setup/Reset Crew add-on.
>
> Trigger: Whenever a client completes a booking that includes the Event Setup and Reset Crew add-on, immediately draft an email to the person who booked. Draft only, do not send. It should land in my drafts ready for me to review and hit send.
>
> Personalization rules:
> Pull the client's first name from the booking.
> Pull the event type from what they entered in the booking intake form and insert it where the template says [EVENT TYPE]. Sometimes this is as easy as filling in the blank (wedding shower, launch party, baby shower, pop-up workout class). Other times you'll need to read exactly what they wrote and rephrase it so the sentence actually makes sense linguistically. The goal is to reference their specific event in a natural way. It's a personal touch point, and it should never read like a robot filled in a field. If what they wrote is unclear or doesn't fit the sentence, rewrite the sentence around it rather than forcing it in.
> The email comes from me and is written as me. Do not add any AI signatures, disclaimers, or extra formatting.
>
> Email template:
> Subject: Your setup crew at WhiteWall, let's plan your space
>
> Hey [FIRST NAME]!
>
> It's an absolute honor to get to host you at WhiteWall Studios for your [EVENT TYPE]!
>
> I saw that you added on our Event Setup and Reset Crew. I'd love to either meet on site with you, hop on a call, or even FaceTime with me in the studio to figure out exactly:
> What you want to stay in the space
> What you might want put into the storage building
> What things you might want moved
> I'll take detailed notes to make sure it's absolutely perfect for you when you walk in. And of course, whenever you finish your session, we'll come in after you and pack everything up and reset the space so you don't have to!
>
> Would you rather FaceTime and walk through the space digitally and plan together, or meet me at the studio and walk through it in person? Completely up to you, I'm here to help. When are you most available? My schedule is flexible, and we'll make whatever time works!
>
> Excited to host you!
>
> Thanks so much,
> Drew Shahoud
> Owner, WhiteWall Studios and Events

## Triage

Four distinct requests → four DREW tickets.

- **Item 1 (DREW-77) — Acuity flagship email audit + parity + IG video link.** `change-request`, deliberative. **KEY FINDING:** the booking site does **not** send the customer confirmation/24h-reminder EMAILS — our backend sends `notifyOwner` (Drew), `notifyCleaner` (April), owner/customer **SMS**, and multi-day event notices, but NO customer confirmation email. The confirmation + 24h reminder emails (door codes, storage lockbox code, YouTube links) are **Acuity's own per-appointment-type email templates**, configured in the Acuity dashboard — **not in our repos and not API-editable** (Acuity API does not expose notification-template editing; cf. `acuity-type-config-api-immutable`). So this is Acuity-dashboard work: need Acuity dashboard access to read both templates, audit parity, sync the reminder to the confirmation, and insert the IG video link. Access-needed item — recorded.
- **Item 2 (DREW-78) — reorder + relabel "How did you hear about us".** `change-request`, fast path (display-only, dictated order). Booking site. Ship-now.
- **Item 3 (DREW-79) — Setup/Reset Crew card copy swap (both surfaces).** `change-request`, fast path (verbatim HTML dictated by Drew). Booking site, Add-Ons page card + checkout add-on display. Ship-now.
- **Item 4 (DREW-80) — Setup/Reset Crew mechanics overhaul.** `change-request`, deliberative + multi-part, spans both repos + email infra:
  - 4a remove the crew intake questions (booking-flow.js "tell our crew where each item should go").
  - 4b augment April's `notify-cleaner` email when crew add-on present + a dedicated second email.
  - 4c owner notification email to the WhiteWall inbox: subject "Action required: SETUP/RESET ADD-ON for Session <WWxxxx>", body leads with a dashboard deep-link to the booking, then name/date/amount/add-ons/phone/email.
  - 4d dashboard: crew add-on shown LAST, with an editable notes box that autosaves, tied to the session (wws-dashboard `/bookings/[id]`).
  - 4e draft-only personalized client email into Drew's drafts, event-type rephrased naturally (LLM) — needs mailbox-draft access + LLM personalization; infra flag.
  - **4a must ship together with 4b/4c** (removing the questions before the new notifications exist would give Drew *less* info during the gap — no information-loss window). So item 4 ships as one coherent build.

## Disposition (this session)

- **Ship now:** Item 2 (DREW-78) + Item 3 (DREW-79) — booking-site display/copy, clean and self-contained.
- **Plan + flag:** Item 1 (DREW-77, Acuity dashboard access needed) + Item 4 (DREW-80, backend build; 4e infra). No money/legal/architecture escalation (draft-only client email = not an at-scale send; no money moves). Item 1 access + item 4e mailbox/LLM recorded as soft "open for Andrew" items.
