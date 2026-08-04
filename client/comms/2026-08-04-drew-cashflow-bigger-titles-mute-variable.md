# Drew — Cash Flow: bigger parent/category titles + subtotals, and a mute-variable-expenses toggle

- **From:** Drew Shahoud (drew@entrpy.co)
- **Date:** 2026-08-04 17:34 ET
- **Medium:** email, thread `19fcdbf43e68c496`, msg `19fceb3860159a0b`.

## Verbatim

> Make the text that says "Fixed Expenses" and "Variable Expenses" on the expenses line
> items drastically bigger and larger, and make the subtotals there also significantly
> larger. These need to be titles and anchors.
> Make the title of each category also bigger and noticeable that it's an actual category,
> but smaller than the "Fixed Expenses" title.
> Make the subtotals for each individual category easier to read than just a light grey color.
> Make it possible to mute the variable expenses. Next to the title of the variable expenses,
> just put a way to mute it so I can see what the number's looking like if we just end all
> variable base expenses.
> Same thing in the analysis, right above the expenses chart. We can see the net income so
> far, historic, or projected, which is great, but I want to be able to mute the variable
> expenses so I can see what the number would have been if we didn't have those variable
> expenses in there.
> Everything else is great. Good work.

## Triage — DREW-60 (dashboard-only, fast path, no money)

Follows DREW-59. All on the Cash Flow tab (`components/cash-flow.client.tsx`).

1. **Parent titles ("Fixed Expenses" / "Variable Expenses") drastically bigger** — real
   titles/anchors (large, bold).
2. **Parent subtotals significantly larger** — the $7,324 / $4,200 next to each parent title.
3. **Category titles bigger + clearly a category, but smaller than the parent title.**
4. **Category subtotals easier to read** — darker than the current light grey.
5. **Mute Variable expenses — a toggle next to the "Variable Expenses" title** that excludes
   all variable expenses so the number shows as if they were zeroed.
6. **Same mute in the statement card** (Current/Historic/Projected, above the P&L chart):
   a toggle to mute variable expenses so net profit recomputes as income − fixed only.

Mute is an ephemeral VIEW toggle (client state, one shared control reflected in both spots) —
no persistence, no migration, no money. Typography-only for 1 to 4.
