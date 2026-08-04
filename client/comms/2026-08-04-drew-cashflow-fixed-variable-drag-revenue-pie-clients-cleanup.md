# Drew — Cash Flow Fixed/Variable sections + drag-reorder + add-category; Revenue pie charts; Clients cleanup

- **From:** Drew Shahoud (drew@entrpy.co)
- **Date:** 2026-08-04 16:01 ET
- **Medium:** email, thread `19fcdbf43e68c496`, msg `19fce5e1be990af1`.

## Verbatim

> This is great. Make it so I can drag the separate line items underneath separate
> categories, so I simply click and hold on anything and can drag it around into a
> different section. Also, within the Revenue tab, let's get rid of those horizontal bar
> graphs. I hate horizontal bar graphs. Let's just do pie charts. On the Clients tab, let's
> get rid of the first visit and last visit columns. Let's center the quantity of bookings
> in the middle of the bookings column, and do the same with the LTV and their finances.
> Let's make sure that they're all spread out horizontally equally. There's a lot of dead
> space to the right in the client list, in between clients and the repeat column. Let's
> just make sure everything is centered in a line and there's no dead space and nothing's
> crammed. Also, back to the Cash Flow sheet, we have two different kinds of expenses: fixed
> expenses and variable expenses. As I'm looking at this line item sheet, we really need to
> have two sections as a whole: One big parent section for fixed expenses. One big parent
> section for variable expenses. Things like rent, cleaners, accounting services, and gas
> are all fixed expenses, but things like marketing services, Google Ads, Entrpy, etc., are
> all variable expenses. I want to see the subtotals for each and then, obviously, the total
> for all of them combined, the net total expenses. Whenever you give me the Cash Flow
> projection, we should have: Projected income (in this case, August) / Fixed expenses total
> / Variable expenses total / Calculated net profit. Also, when I click the Add button, I
> should be able to add an expense just like you have right now, but I should also be able to
> add a category itself. I may not need to add a specific expense. I just need to add another
> category to make things more organized. Everything should be movable by just clicking it,
> holding it, and then dragging it around. The only things that aren't movable are fixed
> expenses and variable expenses because those are the anchor points. Even the categories
> themselves should be able to be moved. Whenever you click and hold on to a category, it
> should take everything within its bucket with it, but if I click a single individual line
> item, then I can drag that out of a category into another category.

## Triage — a 4-part batch (dashboard-only, DREW-59)

1. **Cash Flow — Fixed vs Variable parent sections.** Two top-level anchor buckets:
   FIXED (rent, cleaners, accounting, gas...) and VARIABLE (marketing services, Google Ads,
   Entrpy, ad spend...). Categories live UNDER a parent; each shows a subtotal, plus a net
   total of all expenses. Projection statement lines become: Projected income / Fixed total
   / Variable total / net profit.
2. **Cash Flow — drag to reorder.** Drag a line item between categories; drag a category
   (carries its whole bucket) between/within a parent. Fixed and Variable parents are the
   fixed anchors (not movable). The Add button also adds a CATEGORY (not just a line item).
3. **Revenue tab — replace horizontal bar graphs with pie charts.** (Drew "hate[s]
   horizontal bar graphs.")
4. **Clients tab — column cleanup.** Remove First visit + Last visit columns; center the
   bookings count, LTV, and finances; spread columns evenly; kill the dead space between
   the client and the Repeat column. No cramming.

Fast path (Drew's own dashboard config/UX; reversible; no money, no upstream write).
