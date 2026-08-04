# Drew — coupons follow-up: boycott block-list + green evergreen + generator picker

- **From:** Drew Shahoud (drew@entrpy.co)
- **Date:** 2026-08-04 09:58 ET
- **Medium:** email, thread "WhiteWall Dashboard Revisions" (`19fa478568fc46a2`), msg `19fcd11ae08406fe`
- **Context:** reply to Foreman's 09:36 ship-plan (msg `19fccfdb`). Enthusiastic ("Incredible!")
  and adds three new requests on top of the coupons redesign (DREW-52). Tracked as **DREW-53**.

## Verbatim

> Incredible! Also add an option within every coupon, including the generator, but I can still go
> to any coupon that's already existed in the settings of the coupon itself, to be able to boycott
> a user. We can just refer to it as boycott. This allows me to put an email or phone number or
> both into the coupon, making it impossible for that specific coupon to be used by anyone that
> uses that email or phone number.
>
> So, for example, take the 100% off comp one. If I have found that someone has used it and they're
> abusing it, I can just gather their phone number and their email and put it in there. Then it will
> permanently not allow that person to use that coupon anymore while still keeping that coupon alive
> and well.
>
> That should be an option highlighted in red as you're building out the coupon generator, but then
> also I should be able to edit any existing coupon and then add that in there if I need to.
>
> Also, for the evergreen coupons, let's make those with a perimeter of a dark green line around
> that section and then highlight the background of those coupons with a light green background.
>
> Also, in the coupon generator, I should be able to select right off the bat if this coupon is
> going to be an evergreen coupon or if it's going to be a standard coupon. Those are pretty much
> the only two options, and then I can build traditionally from there.
>
> Just add all these to the list as well.

## Triage (DREW-53, three items)

1. **Boycott = per-coupon deny-list (email and/or phone).** The exact inverse of the "Who?"
   allow-lock just shipped. Bars a specific person from ONE code while the code stays live for
   everyone else. Enforce at checkout the same airtight/stateless way (the booking site knows the
   booking email AND phone). Data-only, reversible, WWS policy → Drew self-authorizes → fast path.
   New column `coupon.blocked_contacts` (normalized emails + phones), form field (RED), wire emit,
   booking-site enforcement, Watson param. Red in the generator + editable on any existing coupon.
2. **Green evergreen styling.** Active Coupons → Evergreen section: dark green border + light green
   row background. Pure UI.
3. **Generator evergreen-vs-standard picker.** The Generate page (Part 4) opens with an
   evergreen/standard choice, then the rest of the form. Folds into the Generate build.

## Response

Foreman confirmed **parts 1+2+3 LIVE** (honest list, sweep+auto-expiry, Who/Uses columns +
email-lock enforcement) and folded DREW-53 into the remaining plan (building next). Sent
`19fcd2720989372e` on the thread. `last-seen-drew.txt` → `19fcd11ae08406fe`.
