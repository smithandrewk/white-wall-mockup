# Drew — Expense Tracker: manual entry on fixed categories + collapsible + per-year filter

- **Source:** Gmail (pip@entrpy.co), thread `1a03ee7679c69e27` ("White Wall dashboard revisions")
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Wed, 26 Aug 2026 12:53:12 -0400
- **Message id:** `1a03efda170aa95d`
- **Classification:** change-request (dashboard UI + local data)
- **Ticket:** DREW-92 (distinct new work; DREW-90 manual entry already shipped/done, DREW-91 backdrop backlog in_progress)

## Verbatim

> Let me know whenever you add in all the backlogged context for the Backdrops. Also, I need a way to add an expense to even the fixed ones as well, like the Cleaning Fees and the Setup/Reset Crew. I like how you added the buttons where I can add an expense for different things like the manual expense and Backdrops and such, but I also need to be able to edit the other ones that are fixed. Even just one button is all I need there.
>
> Additionally, let's make everything collapsible. I really should only see the main title of each category. For example, for the Cleaning Fees 2026, I see there are 10 cleaning fees this year and then the cost. I should be able to press a button that uncollapses it and then shows me all the different months and everything throughout the different years. Ideally, I would be able to filter it per year as well. That'd be awesome, and that should be the same mechanics for the Setup Crew and the Backdrops as well.
>
> That's definitely going to come into play with the Backdrops, since we have so much data to backlog all the way back to 2021. I should see how much we've spent this year on Backdrops and then maybe even how many Backdrops we've ordered this year. In the first title at the very beginning, I press the button that uncollapses it, and then I should probably have to choose what year I want to look at. That shows me all the different months within that year and how much we spent on what Backdrops and everything.
>
> Even more so with the Cleaning Fees specifically, I'm going to be adding in manual cleaning fees that are extra just because we needed April and her crew to go in there and add some extra cleanings. I just need to have a way to manually add things, just as an owner decided extra cleaning was necessary kind of thing. I think you get the idea. Just make it happen and let me know whenever all the backlog is in there for the Backdrops that we've already purchased historically. I'll let you know if I add more photos into that folder for you to analyze and add in.

## Triage

Three requests, plus one open-loop nudge:

1. **(open loop, DREW-91)** "Let me know whenever you add in all the backlogged context for the Backdrops." — The 7 backdrop orders are already in (Round 133). The one remaining item is the **Huamei rolls ($96.98)** — its screenshot cut off before the order total, so the count is unknown. Still waiting on Drew's full screenshot / Drive add. DREW-91 stays in_progress; acknowledge in the reply.

2. **(DREW-92a) Manual entry on the fixed/auto categories.** Drew wants an add button on Cleaning Fees + Setup/Reset Crew so he can log owner-decided extras (e.g. "April and her crew did extra cleanings"). "Even just one button is all I need there."

3. **(DREW-92b) Collapsible categories.** Collapsed by default, showing only the title + count + total. Expand to see months across years.

4. **(DREW-92c) Per-year filter.** Choose a year; see the months within it and the spend. Same mechanics for Cleaning, Crew, and Backdrops. Backdrops especially (data back to 2021) — "how much we've spent this year on Backdrops and maybe even how many Backdrops we've ordered."

**Path:** fast (dashboard-only, local `expense_manual_entry` table + display; Acuity/Square/QBO read-only invariant intact). **No escalation** — no money moved, reversible, Drew self-authorizes his own dashboard data. Money-figure note: manual extras stay **display-only in the Expense Tracker**, NOT wired into Net to Our Bank / Cash Flow (DREW-90 precedent) unless Drew asks — flag the option to him.

**Backdrop count ("how many backdrops"):** line-item / order count is shown; an exact per-order quantity would need an optional quantity field — offer it, do not build unasked.

## Disposition

DREW-92 — unified collapsible Expense Tracker with a global year filter, add-to-any-category (incl. the fixed ones). See revision-status Round 134.
