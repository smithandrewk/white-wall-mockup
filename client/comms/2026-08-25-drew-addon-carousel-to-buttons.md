# Drew — add-on carousels to individual buttons (2026-08-25, DREW-76)

Ticket: **DREW-76**. Thread `1a036c426017a325`, msg `1a038e6747288bc9` (item 2).
Access: Drew's $30 window active (paid via hosted invoice `ee1a2ae7-...`).

## Request (VERBATIM, item 2 of Drew's msg 1a038e6747288bc9)

> let's work on the user interface for White Wall Studios website I want to convert any
> carousels when people are selecting the add-ons to just individual buttons where they can
> see what it's for and everything. I like how there's nice photo there and a description.
> Honestly, the carousel is great, but the user interface is difficult for people to swipe
> sideways. So let's just get rid of any carousels for any of the add-ons, and turn them into
> actual buttons they could see without having a Swiper scroll or anything.

## Triage

- **Class:** change-request (booking-site UI). **Path:** fast (surgical, presentational).
- **No escalation** — no money/architecture/legal/customer-scale; presentational only.

## Root of the "carousel"

The add-on option picker `.backdrop-carousel` (styles/booking.css) was a horizontal
scroll-snap row (`overflow-x:auto; scroll-snap-type:x mandatory`). On mobile the backdrop
colors / wall options / tier choices ran off-screen and had to be swiped sideways. One CSS
class drives ALL four add-on control renderers in `scripts/booking-flow.js`: `toggle`, `tier`
(with images), `backdrops`, `walls`. The cards inside were already `<button>` elements
(`.backdrop-card`) with photo + label + price + a check badge.

## Fix — SHIPPED + LIVE (booking PR #140, merged a2be944)

CSS-only. `.backdrop-carousel` → a wrapping grid: `display:grid;
grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))`. Every option button is visible
up front and reflows into rows; no Swiper, no sideways scroll. Removed the dead
`overflow-x` / `scroll-snap` / webkit-scrollbar rules and the fixed 140px flex basis. The
homepage/gallery carousels are a separate component and were left untouched (Drew scoped this
to add-on selection).

## Verify

Playwright render of the real `booking.css` with a representative backdrops picker (All + 8
colors) at 375px and 1024px: computed `display:grid`, `scrollWidth == clientWidth` (no
horizontal scroll) at both, all 9 buttons present, wrapping to 2 columns on mobile / 3 on
desktop; selected card keeps its check badge. No JS / pricing / availability / Acuity / Square
code touched. **LIVE confirmed on prod:** `whitewallstudios.co/styles/booking.css` shows the
grid rule and 0 `scroll-snap` references.

## Close

Confirmed to Drew (msg `1a038f2e58967c55`). DREW-76 → done.
