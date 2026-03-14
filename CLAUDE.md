# White Wall Studios - Website Mockup

## Context Management (Avoid Rate Limits)

This project involves multiple large HTML files. Follow these rules to avoid blowing up the context window:

- **Never read back files you just wrote.** The content is already in context from the Write call.
- **Run `/compact` after writing or editing multiple HTML files.** Large HTML files snowball the context fast.
- **Split multi-phase work into separate sessions.** Don't do HTML mockups and LaTeX design sheets in the same session.
- **Prefer Edit over Write** for changes to existing files. Edit sends only the diff, not the full file.
- **Avoid bulk re-reads.** If you need to check consistency across pages, read one at a time, compact between if needed.

## Project Structure

- `index.html` - Main landing page
- `taylors-mill.html` - Taylors Mill venue page
- `powdersville.html` - Powdersville venue page
- `gallery.html` - Photo gallery
- `design-sheet.tex` / `design-sheet.pdf` - LaTeX design sheet
- `fonts/` - Web fonts
- `wws-logo.png` - Logo asset

## Active Product Directives

### Powdersville First

As of March 14, 2026, Drew explicitly asked that **Powdersville be the first/default option anywhere the site presents both locations together**.

This was already implemented in the repo because Drew texted:
- "make powdersville the first option in everything. So Powdersville first on site, then Taylor's mill. Same with [Gallery] page. Pop up powdersville first, then Taylor's mill, etc."

Treat this as a standing product decision unless Drew reverses it later.

When editing mixed-location UI, preserve this ordering:
- Navigation on shared pages: `Powdersville` before `Taylor's Mill`
- Homepage location presentation: Powdersville first
- Gallery location filters and booking CTAs: Powdersville first
- Any future booking chooser, modal, popup, comparison card set, or CTA group: Powdersville first

Why this is documented here:
- Future Claude sessions may work from repo context rather than message history.
- This note is intended to make the ordering decision explicit so it is not accidentally reverted.

## Booking URL Strategy

Canonical booking routes now use the `book-*` pattern:

- `/book-powdersville`
- `/book-taylors-mill`

When editing booking links or adding new booking UI:
- point internal CTAs to the canonical `/book-*` routes
- keep redirects in `vercel.json` for legacy `/booking-*` paths
- keep Powdersville first anywhere both booking destinations appear together

## Booking Scaffold Handoff

Current booking scaffold files:

- `book-powdersville.html`
- `book-taylors-mill.html`
- `scripts/booking-config.js`
- `scripts/booking-flow.js`
- `styles/booking.css`
- `client/acuity-integration-handoff.md`

Important implementation notes:

- The booking flow is scaffolded, not live.
- Acuity is now configured per duration, not just per location.
- `scripts/booking-config.js` supports `placeholder`, `iframe`, and `scheduler` Acuity modes.
- Powdersville event logic is preserved: only 4hr+ durations are event-eligible in the scaffold.
- Taylor's Mill remains non-event.
- If previewing via a dumb static server like `python -m http.server`, direct page URLs require `.html`; Vercel `cleanUrls` still provide the real `/book-powdersville` and `/book-taylors-mill` routes in deployment.
