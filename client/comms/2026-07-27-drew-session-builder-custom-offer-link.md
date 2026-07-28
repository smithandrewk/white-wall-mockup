# Drew — Session Builder / custom-offer shareable link (concept, feasibility ask)

- **Source:** Gmail (account `andrew@entrpy.co`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 27 Jul 2026 16:43:20 -0400
- **Thread:** 19fa478568fc46a2 ("WhiteWall Dashboard Revisions")
- **Msg id:** 19fa5518ed22337c
- **Classification:** question (feasibility + design scoping for a large new feature)
- **Ticket:** DREW-14

> Note: Drew is running an idea by me BEFORE any build. He asks two things:
> (1) is this realistic / possible, be as honest as possible; (2) summarize his idea
> neatly and logistically so he can read what the end product could be.

## Verbatim

> Pip you there? I have an idea. But I wanna run it by you first to see if this is even possible.
>
> I want to make a new tab on the dashboard that's a mock, live, updated version, so it's current with our website's booking process. I can go in and create an entire booking from scratch to be able to see exactly how much different combinations of things would cost. From there, I want to be able to choose:
> the days
> the last dates
> the times
> the add-ons
> everything
> I want to get everything pretty much completely solidified. I then want to save that progress and have a way to send a link or something to the candidate that I'm building this session/event for. I can then say, "If all this looks good for you, everything's already pre-selected, and fill it out with the dates and everything. Follow this link, fill in all the rest of the information like your email and everything, sign the liability waivers, and then pay for it." For example, if I want to build a custom offer for someone that's booking a multi-day event, I should be able to go through this session builder tab and then literally just have a replica of the booking process for either Taylor's Mill or the flagship location. In this instance, I would start by clicking the flagship location, and then I would click multi-day event and then click the start time, the multiple days, everything. We're literally just copying the website, and then I go on to the total number of participants to see if certain things add on, like cleaning fees and such. I would choose the add-ons and also fill in what exactly they're hosting. While I'm going through this, I can click all the different add-ons and then see the live breakdown of how it turns out in the summary on the right side or the bottom. If I'm on my phone, then I could see what the total end-all be-all price would be, but then I can manually have a way to override the total price and then add in a custom price. For example, let's say I did three days on a multi-day event, and then I added on 50 chairs, 10 tables, and the roll-on TV. Right now, the summary says that's going to be a total of $3,546. My work is done here, but I want to manually override this price and give them a custom offering. I can essentially click a button that says "Override," and then I can press a button that says "Override." It gives me two options:
> Discount it by percentage
> Discount it by dollar amount
> Let's say in this instance I wanted to choose dollar amount. I select the dollar amount toggle, and then it gives me an area to type in the dollar amount I want to discount it by. By doing that, I now have another line item that adds to the summary that says "Ownership discount," and then it displays how much money I'm discounting it by. It then tells you the final total price for the session. I have a way to copy all this progress and send it to someone via link, where I just copy a link or something, and then send this exact placeholder/session to someone, either text or email. I'll just take that link and then send it to them, and then I'll tell them, "Hey, everything is already done here: your dates, your times, your add-ons, and the discounts that I'm manually adding on here. Take a look at it, and if the pricing and everything looks good to you, just continue through the booking process, checking all the boxes, signing liability waivers, filling in all the information, and everything. Of course, you can pay normally, and then they'll still get all the same emails and everything, but everything that I predetermined would be grayed out to where they can't edit it or change anything. Obviously, they can't change pricing, they can't change the add-ons, they can't change the dates or any information that I put in manually, but everything else they still need to fill out normally." That's the concept. What are your thoughts on that? Be as honest as possible: is this realistic? I then want you to pretty much summarize what I'm saying, but organize it neatly logistically so I can essentially read what the end product could end up being if you were to build this for me within the dashboard.

## Triage

- **This is a QUESTION, not a change request.** No build authorized yet. Response = CONVERSE
  (honest feasibility + organized summary), pre-authorized.
- **Distinct from DREW-13** (repeat-customer column, done) though same thread → new ticket DREW-14.
- **Two halves, very different risk:**
  - **A. Session Builder / estimator (dashboard):** a replica of the booking flow's selection UI
    (location → type → dates/times → participants → add-ons → live summary) reusing
    `scripts/pricing-shared.js` so numbers match the site exactly, plus an Override that adds an
    "Ownership discount" (percent or $) line and a final total. Self-contained, READ-ONLY, no new
    infra. **Buildable now, fast.**
  - **B. Save → shareable link → pre-filled, LOCKED customer checkout → pay:** needs persistence
    (a store for the saved offer + a signed token) the static booking site has never had, plus an
    "offer mode" in `booking-flow.js` that pre-fills + grays out locked fields and forces the
    custom price server-authoritatively through `create-checkout.js` (Square Payment Link at the
    overridden amount). **Realistic but this is the architecture piece** — same foundation V3
    items 2/6/7 need (customer account/DB/token). **Andrew's architecture call when greenlit.**
- **Escalation:** soft record to Andrew (reason=architecture) — heads-up that Drew is scoping a
  large build overlapping V3; nothing blocking, no irreversible action taken.

---

## Follow-up 1 — Drew GREENLIGHTS Phase 1 + folds in "saved sessions" + answers the Phase 2 lock question

- **Source:** Gmail (account `andrew@entrpy.co`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 27 Jul 2026 16:58:46 -0400
- **Thread:** 19fa478568fc46a2 ("WhiteWall Dashboard Revisions")
- **Msg id:** 19fa55fb1953b6be
- **In reply to:** my Phase 1/2 explanation `19fa555dc46f2261`
- **Classification:** approval + change-request (Phase 1 greenlight, expanded scope) + question-answer (Phase 2 lock)
- **Ticket:** DREW-14 (same work — Phase 1 build order)

### Verbatim

> Hey Pip,
>
> This is perfect. You explain the system really well, and that's exactly how I wanted to go, so good job on explaining it. Again, I just want to put some emphasis on this. I was just vocalizing everything as far as the process goes, but legitimately, this thing is nothing more than just a carbon copy of the website's two booking paths, which are either Taylors Mill or Flagship Location. Everything you see on the website is just interactive on the dashboard, but I think you understand that we're just literally ripping the entire website completely and all the UI and everything until we get to that end summary where I want to do the overwrite price. Okay, but I think we're on the same page.
>
> I'm gonna move on. Let's look at phase one. I read through phase one, and I love it. Let's go ahead and ship it right now. Go ahead and get that done, and let me know as soon as it's finished in response to phase two.
>
> Okay, I definitely see what you're saying with phase two, and I absolutely agree. It is a rather big build, and that's coming from me, who doesn't know a freaking thing about computers and software. Totally understood. Very affirming that it's possible and doable, but also, I understand that it's more sensitive. Let's see what Andrew says. Of course, I would love to get him in the loop on everything, and I'll be talking with him tonight anyway, but I would love to see if you and I can keep on working through this together with Andrew involved when needed.
>
> To answer your question about phase two for right now, I think we do not allow them to add on extra things. We can always go back and change that later, but for now I want it to all be completely locked. If they want to add on even more add-ons, then that's something they need to tell me. They could still interact and see the carousel of the photos and different options available, but they can't click on any of them because they're grayed out. They would need to respond to me personally and let me know that they want to revise something, and then I can easily just go in and delete this current saved session build and make a new one.
>
> I also think in this session build tab we should have a section that shows saved sessions. Whenever I finish building a session, I can have a way within the dashboard to save it as a placeholder where I can always send it out later or delete it. It would be cool if I can name the different sessions. For example, this October 3rd through 5th hypothetical situation, I would go in and build a session exactly how I think they would want it, apply my discount, and then I would save the draft and copy a link that I would send to them to take from there. I know under phase one we're not going to do the whole link thing quite yet, but I should still be able to at least save the session so I can see the progress and what all comes with it. I can then rename it and add a couple notes into it specifically. After phase two, I should be able to see all the sessions that we've sent in and delete them if they are aged or I don't wanna offer it anymore. We should hopefully be able to see some KPIs as to which sessions have been paid for and turned into bookings versus which sessions have been viewed by the people I sent a link to but never ended up anywhere. That'd be another cool thing to think about as well.
>
> Yes, let's go ahead and send phase one.

### Triage

- **GREENLIGHT: ship Phase 1 now.** Fast path is not available (substantial build) → standard build,
  one wws-dashboard PR. Pre-authorized to build + ship (Drew is a partner, dozens of cycles shipped).
- **Phase 1 scope, as expanded by this message:**
  1. **Session Builder tab** — carbon-copy of the booking flow selection UI (location → single/multi-day →
     dates/times/#days → participants → add-ons), Flagship first, with a **live price summary** that reuses
     the booking site's REAL pricing (`scripts/pricing-shared.js` + `scripts/booking-config.js`) so it can
     never drift from live prices. Cleaning-fee threshold shows when participants trigger it.
  2. **Ownership override** — percent or dollar discount → "Ownership discount" line + final total.
  3. **Saved sessions (NEW, folded into Phase 1 by this msg)** — save a built session as a **named draft
     with notes**; a "saved sessions" section lists them; **rename + delete**. NO shareable link yet
     (Drew: "under phase one we're not going to do the whole link thing quite yet, but I should still be
     able to at least save the session"). Stored in the dashboard's OWN Postgres `wws` DB (new table +
     migration) — this is NOT the gated architecture piece (that is the booking-SITE persistence + signed
     token + locked customer checkout, which is Phase 2). Dashboard owning its own tables is normal +
     within Foreman scope; upstream READ-ONLY invariant untouched.
- **Phase 2 lock answer (recorded for when Andrew's in the loop):** **fully locked, NO extra add-ons.**
  Customer can see/scroll the add-on carousel but everything is grayed out + unclickable; to change
  anything they contact Drew, who deletes the saved build + makes a new one. "We can always go back and
  change that later." → this settles my open Phase 2 design question.
- **Phase 2 KPIs (future, noted):** which sent sessions were paid/became bookings vs viewed-but-abandoned.
  Deferred to Phase 2 (needs the link + view tracking). Recorded so it isn't lost.
- **Andrew loop:** Drew is talking to Andrew tonight; wants to keep working with me, Andrew involved when
  needed. The Phase 2 architecture escalation stays OPEN (soft, reason=architecture) until Andrew weighs in.
- **This is same work as DREW-14** → add-msg + comment + `start`, do not mint a new ticket.
