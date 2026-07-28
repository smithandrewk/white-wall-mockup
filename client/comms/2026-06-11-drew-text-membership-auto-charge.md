# Drew text — membership / recurring auto-charge on card-on-file

- **From:** Drew
- **Date:** 2026-06-11 11:48–11:51
- **Medium:** Text message (iMessage)
- **Topic:** Exploring memberships — recurring monthly auto-charge against a saved card

## Verbatim

> No need to call back.
> It's whitewall question. Disregard.
> [Andrew: "Oh h yes."]
> No. Question is: can we setup a method to auto charge on the first of the month to a card on file for a specific amount (exploring memberships)
>
> everything else backend I know is possible. But that one is the curve ball.
>
> [after Andrew confirms] Money. and that would include auto payments, right? if so, thats all need to know for now.

## Notes / context (Andrew)

- **Exploration, not a build order.** Drew is scoping a membership product idea.
- Depends on **A1 card-on-file (#4)** shipping first — recurring billing needs a saved card + Square Customer/Card-on-File, which is exactly what PR #2 builds.
- Square supports merchant-initiated recurring payments (Subscriptions API / scheduled CreatePayment against a stored card). Feasible; needs a sub-daily/monthly scheduler (overlaps the B2/B3 scheduler problem, #27) and membership product definition.
- Captured as a roadmap issue (exploration / needs-decision). No work until A1 lands and Drew defines the membership offering.
