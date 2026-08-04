# Drew — Cash Flow dashboard tab (+ surfaced: week-vs-week chart, calendar-control push)

- **From:** Drew Shahoud (drew@entrpy.co)
- **Date:** 2026-08-04 14:20 ET
- **Medium:** email, thread `19fcdbf43e68c496`, msg `19fce01e8183057f`, in-reply-to
  `<16EAC6E9-B521-4374-B56C-D5717AE1CC1A@entrpy.co>`. Drew rapid-firing ideas ("just going to keep
  on going so we at least don't lose these ideas"). Quotes two earlier unhandled messages.

## Verbatim (new 14:20 — Cash Flow tab)

> Pip, I know I'm blowing you up, and I'm sorry, but I'm just going to keep on going so we at least
> don't lose these ideas. You can always pick up where we left off if we don't get everything done
> today. I want to add another tab to the dashboard called Cash Flow. This is essentially going to be
> a monthly cash flow statement where we can see what our expenses are for that month and what our
> projected income is for the month. We can see what our projected profit is going to be for that
> month. We should obviously have an actual as well that shows you what we are actually profiting, but
> that's going to have to take place at the end of the month once all the final numbers are
> established. I want to have a toggle in the very top that switches from Current, Historic, and
> Projected. The Projected one takes all of our known expenses and then what our projected income is
> for this month, the same projected number that we see in the overview. It then tells us what we are
> projected to profit this month.
> Historic is the actual completed months in the past.
> Current is where we currently stand with our fixed expenses and how much money we made so far.
> At the end of the cash flow statement, we'll have a number that is either negative because they
> didn't make enough money, positive because we made more money, or technically neutral. If it's
> negative, make it light red. If it's positive, make it light green. The light blue can essentially
> be our break-even point. Under that, in the cash flow section, I want to have a targeted section
> that shows what our targeted goal is each month. I don't have that number quite yet, but whenever I
> do, we can just put in that fixed line item, and then we can analyze where we are at. Theoretically
> speaking, if we profited $3,000 one month but we set our goal to $5,000 a month, then you'll also
> have a number in red that says -$2,000 from our goal, but still profitable on the month versus
> expenses. I also want to have a chart like we see on the overview page, where you have our net total
> year over year. Let's have the exact same chart also on this page at the very top, and it shows our
> profit and loss. We'll have a dotted line horizontally for what our fixed expenses are, and that'll
> be a fixed straight line. The variable line is going to be our actual performance according to that
> month. If it's under that fixed horizontal line, then it should be a light red. If it's above it,
> then it should be a light green. At the very top right, we should go to see our actual company
> profit. For the line items specifically that we need to have as fixed expenses, we need to have:
> Taylor's Mill rent at $850 a month
> Powdersville rent at $5,000 a month
> Liberty Mutual General Liability Insurance at $550 a month
> Google Ads at $1,500 a month
> Accounting services with Joy at $150 a month
> Reel Marketing Service at $1,500 a month
> Reel Marketing ad spend $900
> Entrpy at $300 a month
> Piedmont Natural Gas at $24 a month
> Cleaners with April at $750 a month
>  all those should be locked and fixed, but there should be a manual override where I can add a line
> item of expenses or I can adjust a line item of expenses. All these should be in there for now, but
> I may change them later.

## Verbatim (quoted 14:01 — SURFACED, week-vs-week chart on Overview)

> Another thing, Pip: I want to have another chart on the overview page directly under the "This Month
> vs. a Normal Month" chart. That is literally identical to that chart, but it's for this week versus a
> normal week. Just pretty much a slimmed-down, simplified version of the month-over-month.

## Quoted 1:25 — SURFACED, DREW-47 calendar control push (ESCALATED, upstream write)

> ...In the dashboard Calendar tab, I want to be able to manually control availability and bookings
> directly from the dashboard, with the changes reflecting in real Acuity/Square. [per-location toggle;
> day/range; manual block-off window with start/end + note; push block into REAL Acuity; multi-day;
> per-booking Refund / Refund&Delete / Delete / Reschedule; Watson able to do the same by text.]
> ...Let's move on this now. I want to get this done today if at all possible. If the refund/Square
> side needs extra safety work, start with the calendar availability control first...

## Triage

- **DREW-56 — Cash Flow tab (build this):** dashboard-only, READ-ONLY vs Acuity/Square/QBO (income
  reuses the existing verified Square-net + the Overview month projection; expenses are a NEW local,
  editable table Drew owns). No money moves, no staging dry-run. Drew self-authorizes his own
  expense/goal figures. Fixed line items seeded (10 above, total $11,524/mo), editable + addable.
  Current/Historic/Projected toggle; profit bottom line light-red/green/blue; goal + variance; P&L
  chart with a dotted fixed-expense line + colored actual line; actual company profit top-right.
- **DREW-57 — week-vs-normal-week chart (ticket, queue):** a slimmed week version of the month
  forecast chart, directly under it on the Overview. Distinct from Cash Flow; build next.
- **DREW-47 — calendar control (STAYS ESCALATED on Andrew):** Drew pushing to start today, but this
  is the first UPSTREAM Acuity/Square WRITE (hard invariant: never add an upstream write path) + real
  refunds + agent destructive authority. Drew himself acknowledged the safe build path is being
  finalized with Andrew. Do NOT wire the Acuity block-off write blind — surface to Andrew for the
  go/no-go + build order.
