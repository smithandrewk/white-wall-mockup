# Drew — coupons batch 3: refinements on the just-shipped surfaces + boycott/Who? shape

- **From:** Drew Shahoud (drew@entrpy.co)
- **Date:** 2026-08-04 11:17 ET
- **Medium:** email, thread "WhiteWall Dashboard Revisions" (`19fa478568fc46a2`), msg `19fcd5a8d5c6c6e8`
- **Context:** reply to Foreman's two ship confirmations (three-surface + green + generator; and
  Redemptions rebuild). Iterating fast on what shipped this morning (PRs #123, #124) and reshaping
  the still-unbuilt boycott. Tracked under **DREW-53** (folds in item 1 boycott + new items).

## Verbatim

> Great, let's get rid of the new coupon button on the top right. We had to generate toggle
> announced. We don't need the new coupon button.
>
> Also, whenever I'm editing the coupon, I don't see the boycott list, so make that a section within
> the edit field where I can add people to the boycott list. Also, the boycott list should be both
> phone numbers and emails, and that should also be the exact same logic for the "who can use it".
> Right now it just says "bind one customer email" or "blank for everyone". I like that I can leave a
> blank for everyone, but I need to have both email and phone number ability to put in there.
>
> Last, whenever I open up the redemptions toggle and I click on one of these coupons, I don't like
> that it has a pop-up window of all the information there. I like all the information being
> displayed, but I don't want it as a pop-up window. I wanted it to be a collapse/open system where
> there's a new chart that essentially opens up as I open up that one coupon. I should be able to
> click on the client who used it to go to their client profile, and I should also be able to click
> on the session specifically that they booked. I also want the column in there that shows if they're
> a repeat customer or not and if they're active or an inactive repeat customer or just a new
> customer altogether.

## Decomposition (all fast-path — UI/UX + policy, Drew self-authorizes)

1. **Active Coupons:** remove the top-right "New coupon" button (redundant with the Generate surface).
2. **Boycott (item 1 of DREW-53), reshaped:** a RED block-list **section inside the coupon form**,
   editable on any existing coupon and in the Generate page. Accepts **email AND phone** (both).
   Enforced at checkout as the inverse of Who? (stateless).
3. **Who? parity:** the "who can use it" restrict field must accept **email AND phone** with the
   **same logic** as boycott — blank = everyone (keep), otherwise bind by email and/or phone. This
   upgrades the DREW-52 pt3 email-only restrict to email+phone. Booking site must gate on both.
4. **Redemptions drill-down (revises PR #124):** replace the modal dialog with an **inline
   collapse/expand** panel under the clicked coupon row. Inside it: client name links to the client
   profile; the session links to that booking; add a **repeat-customer status column**
   (repeat-active / repeat-inactive / new).
