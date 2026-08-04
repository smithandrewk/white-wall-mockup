# Drew — Campaigns tab cleanup + green/red live highlighting + 50/60 discount tiers (+ surfaced: Max notifications)

- **From:** Drew Shahoud (drew@entrpy.co)
- **Date:** 2026-08-04 12:21 ET
- **Medium:** email, thread "WhiteWall Dashboard Revisions" (`19fa478568fc46a2`), msg `19fcd94566dd4ec7`
  (in-reply-to `<D470DFFC-0C16-4F09-AE31-0AB287B85916@entrpy.co>`). Crossed Foreman's batch-3
  confirm. Also quotes an earlier **11:21** Drew message (Max notifications) not previously handled.

## Verbatim (new 12:21 message)

> Okay, in the Campaigns tab, let's try and clean this up a little bit and make it more organized so
> I can see all campaigns. I want to highlight green any of the campaigns that are currently live and
> active. Anything that is no longer live and no longer active should be highlighted in light red.
>
> Also, across the board for all suggested campaigns, I want it to be 50% on the Tuesday recommended
> campaign, and 60% on the second recommended campaign for the same weekend later in the week. I know
> you recommend campaigns twice a week for the weekend to come, but I just don't know what schedule it
> is. I do know that it's 25% off. Let's make it 50% on the Tuesday one and then 60% on the Friday one.

## Verbatim (quoted 11:21 message — SURFACED, previously unhandled)

> Another thing: all the text messages that Watson texts me automatically that we have set up. We also
> need to send those text messages to Max. His phone number is 803-682-5691. Literally the exact same
> thing that Watson gets, just text them straight to Max about doing that because I have Watson and Max
> doesn't. Granted, Max does have Fox.
>
> Do you think it's possible to set it up where those same text messages that I get for all the
> notifications we have set up for Whitewall send to Max through Fox?

## Triage

- **A. Campaigns list highlighting + organization (DREW-54)** — dashboard-only UI over existing
  campaign status. Green = currently live+active; light red = no longer live/active. Fast path.
- **B. Discount tiers 50/60 (DREW-54)** — change the recommended-campaign discounts: Tuesday
  proposer 25% → **50%**, Friday escalation 50% → **60%**. Changes DEFAULTS only; mints/sends
  nothing (approve + send stay human), so no money moves at change time. Drew self-authorizes WWS
  discount policy → fast path, FYI Andrew.
- **(surfaced) Max notifications (separate ticket DREW-55)** — mirror the owner-SMS notifications to
  Max's phone (803-682-5691) and/or route via Fox. Distinct from A/B; log + ticket + raise in reply
  (a small clarifying choice: text Max's number directly like Drew's, vs. via Fox). Do NOT drop when
  last-seen advances past it.
