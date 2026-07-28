# Drew — add-on discount ladder 15/30 → 20/40, plus an "Add-on savings" summary line

- **From:** Drew Shahoud <drew@entrpy.co>
- **To:** Andrew Smith <andrew@entrpy.co>
- **Date:** Mon, 13 Jul 2026 20:55:01 -0400
- **Medium:** Email (thread `19f424228b20d389`, msg `19f5e1ef38252d34`)
- **Attachment:** `2026-07-13-drew-addon-ladder-attachments/summary-screenshot.png`
  (his iMessage thread working out the ladder math)

> ⚠️ **This arrived while the $160/day change was mid-build and was not picked up until the
> next watch tick.** It is a SECOND, separate request — do not confuse it with the $160/day
> multi-day discount (that one is msg `19f5e16ccb04f1c3`, shipped as booking PR #81).

## Verbatim

> Pip,
>
> Let's change the discount ladder rate for add-ons. Currently, it's 15% and then goes to 30%,
> and then stays 30% for day 3, and so on. I now want it to be 20% for day 2, 40% for day 3, and
> then continue at 40%, going on. We can do that for all add-ons across the board, except for the
> ones that are a fixed cost or a one-time fee.
>
> Go ahead and revise all that right now too. Of course, this should continue displaying
> everything as a line item in the summary.
> Also, in the summary while tracking it live, I want to be able to see the total amount of add-on
> savings. The line item should be what the first day's price is as the retail price, and then you
> can still display everything like you currently have it. We need to have a line item at the very
> bottom where there are the add-on totals underneath the multi-day discount line item that says
> "Add-on savings" or something. You'll probably know how to do this better than I'm articulating
> right now.
>
> I still want to show the math of how the add-ons display for each individual line item. I want
> the total to be calculated with: what's the retail total, and what's the cumulative total of all
> the different discounts added up and subtracted by the retail total? They can see they should be
> paying X dollars. They're getting X dollars in savings. Therefore, their estimated total is X
> dollars.

## From the screenshot (his own worked example — the spec)

Starting add-on price **$190** (chairs-50):

| Day | Old ladder | New ladder |
|---|---|---|
| 1 | 100% → $190 | 100% → **$190** |
| 2 | 85% (15% off) → $161.50 | 80% (**20% off**) → **$152** |
| 3+ | 70% (30% off) → $133 | 60% (**40% off**) → **$114** |

Five-day total: **$190 + $152 + $114 + $114 + $114 = $684**.

## Triage

Two changes, one PR:

1. **The ladder** — `dayDiscountMultiplier()` in `scripts/pricing-shared.js`: `0.85 → 0.80`,
   `0.70 → 0.60`. One function, already the single source both the browser and
   `api/create-checkout.js` charge from.
   - **"all add-ons across the board, except fixed cost / one-time fee"** is ALREADY the rule:
     `DISCOUNT_ELIGIBLE_ADDONS` covers walls, chairs, tables, PA, TV, backdrops; the Event Setup
     and Reset Crew is flat per booking and is deliberately excluded. No eligibility change needed
     — his carve-out and the existing code already agree.

2. **The summary** — currently each add-on line shows its ALREADY-DISCOUNTED price, so the
   savings are invisible. Drew wants: line items at **retail** (day-1 price), the per-line math
   still shown, and a new **"Add-on savings"** line at the bottom *underneath* the multi-day
   discount line. So the summary reads as: retail total − multi-day discount − add-on savings =
   estimated total. "They should be paying X, they're getting X in savings, therefore estimated
   total is X."
   - **Presentation only — the charged amount does not move.** Retail − (addon savings + multi-day)
     is algebraically identical to the current total. This must be proven, not assumed: the
     staging dry-run has to charge the same number the old code would have (modulo the new ladder).

- **Type:** pricing/money → per [[drew-self-authorizes-money]], Foreman ships it, FYIs Andrew.
- Money path → **staging dry-run before prod, mandatory.**
