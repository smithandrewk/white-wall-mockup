# Drew — multi-day discount: raise $100/day → $160/day

- **From:** Drew Shahoud <drew@entrpy.co>
- **To:** Andrew Smith <andrew@entrpy.co>
- **Date:** Mon, 13 Jul 2026 20:46:07 -0400
- **Medium:** Email (thread `19f424228b20d389`, msg `19f5e16ccb04f1c3`)
- **Subject:** Re: WhiteWall email campaigns — add this hero photo in PIP
  (subject is stale thread drift; the content is the multi-day discount)

## Verbatim

> Pip, let's change it to $160/day off. Discount by event length:
> - 3 days: $480 off
> - 4 days: $640 off
> - 5 days: $800 off
> - 6 days: $960 off
> - 7 days: $1,120 off
> Etc. you get it. Revise that real quick just like you did for the $100/day.

## Triage

- **Type:** pricing / money change. Per the standing decision ([[drew-self-authorizes-money]]),
  Drew owns WWS pricing calls: **Foreman ships it and FYIs Andrew, does not gate on him.**
- **Scope:** the multi-day event discount rate only. Same rule shipped hours ago in PR #79
  ($100/day), so this is a one-constant revision of a module built for exactly this.
- **Rule:** flat **$160 off per calendar day the event spans**. Every example he gave is
  exactly `160 × days` (3d=$480, 4d=$640, 5d=$800, 6d=$960, 7d=$1,120), so the rule is linear
  and unchanged in shape — only the per-day rate moves.
- **Inferred, and flagged to him in the reply:** his list starts at 3 days, so he did not state
  the **2-day** case. The existing rule already applies from 2 days up, and linear means
  **2 days = $320**. Shipping that and saying so plainly, rather than blocking a "real quick"
  revision on a question whose answer is obvious from his own arithmetic. If he wants the
  discount to start at 3 days instead, it is a one-line change to `MULTIDAY_DISCOUNT_MIN_DAYS`.
- **Not touched:** the clamp (a discount can never exceed the total), the min-days floor, the
  per-day add-on tapering, anything on the photo/video or single-day paths.

## Follow-through

- Rate now derives from a single constant, and the customer-facing copy is generated FROM that
  constant instead of hardcoding "$100" in six places — so the next rate change Drew asks for
  cannot leave stale numbers on the page. (Copy drift was the live risk here: the math lived in
  one module, but the words did not.)
