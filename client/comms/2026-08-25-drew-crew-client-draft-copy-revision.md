# Drew — revise the crew client-draft email copy (item 4e) + status asks

- **Source:** Email (Gmail), account `pip@entrpy.co`
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Tue, 25 Aug 2026 16:01:45 -0400
- **Thread:** `1a036c426017a325` ("Re: Dinner receipt")
- **Message id:** `1a03a83d2f5d1370`
- **Classification:** change-request (verbatim-dictated copy) + question x2

## Verbatim

> Hey Pip,
>
> All that looks great. Let's revise the email copy for number four. It needs to be a lot more simple and a lot more personal. This is how I want it to read.
>
> Hey Jordan!
>
> Thank you so much for booking your event with us at WhiteWall Studios and Events. It looks like you added on the events setup and reset crew. Would you have time this coming week to meet me at the studio to walk through it together so we can figure out what you want to leave in the space and what you want to be tucked in the corner/moved into the storage building?
>
> Of course, we'll make sure to get all of your add-ons in this space for you so right when you show up, you can start setting up without having to worry about tearing down the studio. The best part is we'll reset everything for you after your event! Just leave it how it is, then we'll take care of it.
>
> What time this coming week works best to meet out there? If you won't have time to meet out there, we could always do a face-time call, and I could walk you through the space digitally. We could figure out the best game plan!
>
> Thanks so much!
>
> Drew Shahoud, Owner of WhiteWall Studios and Events.
>
> Okay – Let me know if Andrew needs anything to get you connected to the drafts and everything so it can automatically produce an email draft.
>
> Also, any update on the acuity, confirmation, and 24-hour reminder emails? Can you send me that list of things that you buttoned up? Have we finished that?

## Triage — three distinct asks

1. **Revise the client-draft email copy (item 4e).** Drew dictated the EXACT wording he
   wants — simpler + more personal, signed as "Drew Shahoud, Owner of WhiteWall Studios and
   Events," offers to meet at the studio or FaceTime. Verbatim-dictated copy → **fast path,
   no gate.** The client draft (piece 4e) was only ever delivered as sample content in an
   email; it was never in code. Capture Drew's verbatim copy as `buildClientDraft()` in
   `api/_lib/notify-crew.js` (source of truth for when Andrew wires the mailbox drafting) +
   unit test. → **new DREW ticket.**

2. **"Let me know if Andrew needs anything to get you connected to the drafts."** This is the
   4e auto-draft mailbox wiring, on Andrew (`esc-item-4e-...`). Answer inline: what Andrew
   needs is a one-time OAuth connection of Drew's mailbox on our side; the copy is ready and
   waiting for that. Keep-warm, no new build.

3. **"Any update on the acuity, confirmation, and 24-hour reminder emails? Send me the list
   of what you buttoned up. Have we finished?"** = DREW-77 (item 2), still gated on Andrew's
   go on the Acuity access path (`esc-drew-77-...`, OPEN). Honest keep-warm — not finished,
   will send the list once the parity edits are made. Do NOT assert done.
