# Drew — hamburger nav must appear top-right on every page

- **Source:** email (gmail)
- **From:** contact@whitewallstudios.co ("WhiteWall Studios")
- **Date:** Sun 2026-07-19 14:24
- **Thread:** 19f6b708fb71898c (account andrew@entrpy.co) — "WhiteWall Dashboard R&D"
- **Message id:** 19f7b9f45b99a756

## Verbatim

> Can you also verify that the hamburger appears in the top right of every single page no
> matter what, for every page? Rn it doesn't pop up on a lot of the pages.

## Triage

- **Class:** change-request (bug — missing/misplaced nav)
- **Path:** fast/static tier — nav/markup change, not money/booking-logic, not §4-gated.
- **Scope:** audit EVERY page in white-wall-mockup, make the hamburger appear top-right on
  each (desktop + mobile), matching the existing nav pattern. Verify with Playwright by
  actually rendering each page — not markup alone (Drew's complaint is it visibly does not
  show on many pages).
- Sunlight Simulator is already live — do not redo it.

## Outcome — SHIPPED + LIVE ✅

- **booking-site PR #89 (squash `5f97a5f`) merged → Vercel prod → live + browser-verified on whitewallstudios.co.**
- Root cause: per-page nav-markup drift (3 broken states + 2 navless pages). Fix = one shared
  `scripts/site-nav.js` included on all 23 content pages → always-visible hamburger top-right +
  consistent 11-link dropdown (Flagship first). Legacy per-page link rows hidden; sign-out folded
  into the menu; can't drift again. Sunlight Simulator app bundle left byte-for-byte untouched.
- **Verified:** Playwright on all 23 pages × {1280, 390}px pre-ship (present + visible + top-right +
  opens + 11 links + 0 overflow + no console errors), then re-verified 7 pages on LIVE prod after deploy.
- **Reply to Drew:** `19f7bdc4fa1fa17a` (comped window; no payment mentioned). Flagged the one design
  note: home + 2 location pages' desktop spelled-out link bar is now the same hamburger; offered to
  restore inline links alongside if he prefers.
- **Open loops:** none. `last-seen-drew.txt` advanced to `19f7b9f45b99a756`.
