# Drew — Watson as a textable dashboard + session/coupons/campaigns + On the Brink "Reach Out"

- **Source:** Gmail (work mailbox, account `andrew@entrpy.co`)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Mon, 3 Aug 2026 14:55:15 -0400
- **Thread:** `19fa478568fc46a2` ("WhiteWall Dashboard Revisions")
- **Msg id:** `19fc8fb1c5e9847e` (reply to my DREW-40 live-confirm `19fc8f38b800bd91`)
- **Class:** change-request (multi-part roadmap) + FYI

## Verbatim

> That sounds great, Pip. Thank you. If there's anything else you see that could potentially come up for him to mess up on, please just go ahead and fix it.
>
> I essentially want him to be a textable version of the dashboard. If I don't have the dashboard in front of me, I should be able to literally text him anything, and he should be able to display/tell me any ounce of information possible directly from what the dashboard relays. The dashboard is the source of truth in this moment. So please keep me updated there with that progress.
>
> Additionally, let's go ahead and move forward with the other section that we've already discussed, where he is going to be able to do this session building coupons and campaigns. Can we just get that done right now? I believe we did the backend stuff on that already. Let's go ahead and push this hard core. I want to get this done.
>
> Once those things are done, I also need a new feature added into the dashboard. For the On the Brink section, I want to also display the phone number and the email in this chart. We don't need the first month listed as a column. We honestly don't need the last month listed in the column. All the other columns are good, though. Let's also get rid of the repeat question because we don't need that column either, but what I do want to call them for is their phone number and their email.
>
> I then want an actionable button to the left of the client column that says "Compose Email". When I click that button, it should automatically give me email copy that I can just draft an email straight to them, and then it should have a toggle that switches between email and text copy. They're going to be different. The text is something I'm going to have to manually copy myself and then text it to them. The email should hopefully just automatically draft.
>
> Actually, now that I'm saying that out loud, probably the best option would be that the column next to the client column on the left should read "Reach Out". There's a toggle on that column that says "Email" and "Text". By default, it doesn't do anything, but if I click on one of the toggles, it will then open up a preview where I can see what the copy is going to be. If it's email, it will just have a big text box where I can see what the email copy would be recommended. If it's text, it will be the exact same thing, but hopefully shorter and sweeter.
>
> If it's email, if I like the copy, then I can press a button that pops up at the bottom that says "Compose". Once I press that, it automatically opens up an email draft straight to that person's email, and then I can manually select for the sender to be my whitewall email. Obviously, we won't have this option for texting because I need to send it from my phone directly.
>
> The copy of the email needs to be overwhelmingly thankful and very strategically personable to that person. This is almost supposed to be like literally me, Drew, reaching out to them because I'm just so thankful and happy that they are a repeat customer.
>
> For example, if I go to the email, it should say something like this. This is just me spitballing. It can be short and sweet, but I'm really trying to find a way to make it more personal. I want them to think that it's literally me emailing them. Maybe a couple analog emojis? Probably a maximum of two of them. Things like this. :) or : D. Idk. You know the tone of Whitewall. It's kinda gay and girly, so I'm trying to make it feel warm and welcoming.
>
> "Hey Megan,
>
> This is Drew with Whitewall Studios. I just want to reach out and tell you how thankful we are for your continued support at Whitewall. I can't tell you how much support from repeat customers like you means to us. You are really the backbone of our business.
>
> Is there anything that we could do better on our end? We trust you. We've seen that you've booked with us about five times now, maybe even more, and we see the content you post on Instagram for your sessions at Whitewall. Your work is truly incredible.
>
> Regardless, we just wanted to check in and make sure you were happy with Whitewall and that there's nothing we can do better. If there is, please let us know. We are trying to get better every single day, especially for our repeat customers.
>
> Additionally, here's a coupon for 75% off your next booking. It's on us. It's the least we could do.
>
> Truly, thank you for booking with us five times already. If there's anything I can do to help you, please let me know. My phone number is 803-873-8153. Here to help any way we can. "
>
> I should be able to preview the entire text, and then I should be able to compose the email based off of what I've changed in the preview. The preview is just a way for me to see what you're recommending, and hopefully I can just go ahead and hit send. If I don't like what the preview is, I can edit the preview live in the actual software itself. Whenever I'm done editing it, I can press compose, and it pops up in an email copy, and then I can hit send from there. The text will be pretty much the exact same thing, just a little bit shorter, but you can start all the text copy with referencing the fact that I just emailed them to.
>
> The text copy could be something like:
>
> Hey Megan,
>
> This is Drew Shahoud with WhiteWall Studios. I just shot you an email as well, but I wanted to reach out personally and just tell you how thankful we are for you, etc.
>
> This program shouldn't be built until Watson is all good to go. Once Watson is good to go with the session builder and everything, then we should build this program out and add this to Watson's repertoire so I can just randomly text him for the copy to send to the top person on The Brink.
>
> It would also be super cool if it was possible for the system to automatically go to their Instagram and search it for photos done at the studio where they maybe tag the studio. I think that's gonna be pretty hard because Instagram has a ton of blockers, and I don't think it makes it very easy for us to do that. That's a cool wishlist item one day.

## Triage

Three distinct threads of work, with Drew's OWN ordering/dependencies:

1. **Part A — "textable version of the dashboard."** Proactively harden the agent
   API so Watson can relay ANY dashboard figure (dashboard = source of truth, no
   recomputing). Continuation of the DREW-40 metrics lineage; keep Drew updated on
   progress. Read-only enrichment, no gate.

2. **Part B — Watson session building + coupons + campaigns ("get it done right
   now, push hard core").** The agent API already exposes **session building**
   (`build_session` + `mint_link`, live since DREW-28). **Coupons + campaigns are
   NOT yet agent actions** → this is the buildable slice. Backend exists (coupon CRUD
   `lib/coupons.ts` + `/api/coupons`; `createManualCampaign`). → **DREW-41.**
   - **Boundary (guardrail, non-negotiable):** expose read + create/propose data
     writes to Watson (list/create coupons; list/propose campaigns). The **customer
     SEND blast stays the human red button + arm switch — NOT a Watson action** (the
     "sends to customers at scale" hard gate). Recorded as a soft FYI to Andrew.

3. **Part C — On the Brink "Reach Out" (Compose email/text) + column changes.**
   Add phone + email columns; remove First visit, Last visit, and Repeat? columns;
   add a "Reach Out" column (Email/Text toggle → editable preview → Compose = mailto
   draft for email, manual copy for text); personable Drew-voice copy w/ a 75%-off
   coupon. **Drew explicitly gated this: "This program shouldn't be built until
   Watson is all good to go."** → **DREW-42, DEFERRED** behind Part B + Watson
   re-test. IG-scrape = wishlist, not built.

## This run
- Ack Drew with the plan + ordering (now vs deferred). Build **Part B** (agent
  coupons + campaigns actions), verify, ship one dashboard PR, confirm. Soft-flag
  the SEND boundary to Andrew. Part C parked per Drew's own instruction.
