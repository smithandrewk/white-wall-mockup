# Drew Direction: Powdersville First Everywhere

Date: March 14, 2026
Source: Drew text message to Andrew
Purpose: Preserve this product decision in repo docs so future Claude/Codex sessions can see it even without the original chat context.

## Drew's Direction

Quoted client message:

> One thing: make powdersville the first option in everything. So Powdersville first on site, then Taylor’s mill. Same with [Gallery] page. Pop up powdersville first, then Taylor’s mill, etc.

Andrew replied:

> Sweet will do

## Interpretation

This should be treated as a site-wide ordering rule for any UI that presents both locations together.

Unless Drew later changes this, the default order should be:
1. Powdersville
2. Taylor's Mill

This applies to:
- Homepage mixed-location sections
- Shared navigation on non-location-specific pages
- Gallery filters and gallery booking CTA groups
- FAQ and 404 booking CTA groups
- Any future booking chooser or popup/modal that lists both locations
- Any future comparison cards, selector chips, tabs, or dropdowns that contain both locations

## Why This Was Implemented

This change was made immediately because Drew gave a direct preference about merchandising and hierarchy.

It is also being documented here specifically because future work may happen in Claude again, and future sessions may not have the original text thread in context. This file exists to reduce the risk of accidentally reverting the ordering or building new mixed-location UI in the old Taylor's-Mill-first order.

## Repo Changes Made On March 14, 2026

The following pages were updated so Powdersville appears first where both locations are shown:
- `index.html`
- `gallery.html`
- `faq.html`
- `props.html`
- `404.html`
- `CLAUDE.md` updated with a standing directive for future agent sessions

## Notes For Future Agents

- Do not "normalize" location order alphabetically.
- Do not use Taylor's Mill first on shared pages just because it is the older/original studio.
- If building booking pages later, the initial/default location choice should also favor Powdersville unless Drew says otherwise.
- If a future revision intentionally changes the order back, update this file and `CLAUDE.md` in the same commit so the repo history stays clear.
