# Drew — Session Builder: Ownership add-on + notes + order toggle

- **Source:** Gmail thread `19fa478568fc46a2` ("WhiteWall Dashboard Revisions"), account andrew@entrpy.co
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Tue, 28 Jul 2026 15:13:08 -0400
- **Msg id:** `19faa25598e78bdd`
- **Classification:** change-request (dashboard Session Builder, extends DREW-17's Ownership override)

## Verbatim

> Pip, This is absolutely incredible. I now want to add another element.
>
> Right now, we have a way for ownership to apply a discount, and I think it's perfect. I want to add an element to that discount where I can put a note as to why the discount is there. It says "Ownership discount," and then, theoretically, I take $200 off, and everything auto-populates. It would be cool if there was a note as to why we're taking that $200 off, so a note field that's optional for me to input that also shows up for the customer.
>
> Secondarily, I want to add an entirely new element to this exact summary area where it says "Ownership add-on." It's the exact same concept, but instead of it discounting, it actually adds. It can be an add-on for a percent or a dollar amount, and again, the note is very important there.
>
> For a use case with context, let's take the screenshot, for example. In a perfect world, I would also add on $1,000, and I would put in the notes section that they are getting access to Drew's office as a rental for three days. It includes the cleaning fee, and then the new total would be $4,546. From there, I would do an ownership discount, and I would decrease the dollar amount however much I need to get it to an even $3,800. In that note, I would say, "Ownership discount for X reason."
>
> we also need to have a way to swap the logic. For example, with the example I just explained, the ownership discount applies after the ownership add-on. What if I want to apply the ownership discount on top of the session I build and then I do an ownership add-on on top of that?
>
> For example, we take the exact same hypothetical with $3,546 and then apply an ownership discount of 10%, taking off roughly $360. I then do an ownership add-on from there for an extra $1,000 for renting Drew's office and everything.
>
> We just need to have a button that allows you to swap the logic. I'm either adding on to this session and then discounting it from there, or I'm discounting the session and then adding on from there. The final total will just calculate accordingly, so there needs to be a toggle button that swaps the placements in the logic itself

(He references "the screenshot" — his DREW-17 example, a $3,546 build. Math checks: $3,546 + $1,000 add-on = $4,546; order-swapped 10% discount on $3,546 ≈ $354.60 off, his "roughly $360".)

## Triage

- **Distinct request** (DREW-17 is done and confirmed) → new DREW ticket.
- Scope: Session Builder only — booking-site `WWS_BUILDER_MODE` panel (`scripts/booking-flow.js`) + wws-dashboard server recompute (`lib/session-builder/flow-pricing.ts`) + saved drafts.
- Money path: none. Builder mode takes no payment; drafts are dashboard-local. Server recompute stays authoritative. Percent-vs-order matters: (base+addon)*(1-d%) ≠ base*(1-d%)+addon — the toggle is real logic, not display.
- "shows up for the customer": today the only customer surface is the PARKED Phase 2 shareable link, so notes persist into the saved draft/summary now and flow into Phase 2 when Andrew green-lights it.
- No §4 gate: no customer sends, no architecture change, no legal text, no upstream writes.
