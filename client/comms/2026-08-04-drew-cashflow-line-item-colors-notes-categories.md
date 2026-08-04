# Drew — Cash Flow line items: per-line background color, collapsible notes, category section breaks

- **From:** Drew Shahoud (drew@entrpy.co)
- **Date:** 2026-08-04 15:38 ET
- **Medium:** email, thread `19fcdbf43e68c496`, msg `19fce495e61260c9`, in-reply-to
  `<7F18A895-771B-4648-9054-41A64EF40F89@entrpy.co>`. Reply to the Cash Flow tab confirm.

## Verbatim

> This is great. I also want to have an option on the right-hand side where I can choose the
> background color of a specific line item. So a button where I can click it and be given maybe 10
> colors to choose from to change the background color of aline item. I Las owant to be Able to add
> notes to a specific line item. i reveal the notes when I click on the lien item, and it opens up
> below it. But all notes default to being collapsed. I can edit the notes though per line item by
> selecting the icon on the right side.
> I also want to categorize things in these expenses, so let's make some way to visually just add
> section breaks to categorize them. We'll make:
> one marketing
> one operations
> one being rent
> one being ad spend

## Triage (reads through the typos)

Three enhancements to the Cash Flow tab's fixed-expense list (DREW-56, shipped PR #130). Dashboard-only,
local `expense_line` writes, no money moves. Ticket **DREW-58**.

1. **Per-line background color** — a button on the RIGHT of each expense line → pick from ~10 colors →
   sets that line's row background color.
2. **Per-line notes (collapsible)** — add a note to a line; click the line to reveal the note expanded
   BELOW the row; notes DEFAULT COLLAPSED; edit the note via an icon on the right.
3. **Category section breaks** — visually group expenses into named categories via section-break
   headers. Categories to make: **Marketing, Operations, Rent, Ad spend**.
