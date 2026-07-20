# Drew — hamburger: white color + desktop Robinhood-style tab reveal

- **Source:** Gmail (work mailbox, account `andrew@entrpy.co`)
- **From:** WhiteWall Studios `<contact@whitewallstudios.co>`
- **Date:** Mon 2026-07-20 09:44
- **Thread:** `19f6b708fb71898c` (WhiteWall Dashboard R&D)
- **Message id:** `19f7fc5a4d615d26`
- **Attachments:** 2 screenshots of Robinhood's web nav (closed state = hamburger; open state = X + horizontal tab strip below the header)
- **Ticket:** DREW-4

## Verbatim

> Pip, real fast – let's change hamburger color to White, instead of blue. Also, when you click on in, only on desktop, can you display the options identical to how Robinhood does it on theirs? You click robinhoods hamburger, then the tabs pop up across the horizontal scale. See screenshots.

## Triage

- **Class:** change-request (visual / interaction). **Path:** fast path (CSS + nav interaction on the just-shipped shared `scripts/site-nav.js`; not booking-logic, not money, not legal). Not §4-gated.
- **Two parts:**
  1. Hamburger icon color **blue `#4A90D9` → white `#fff`** across every page. It sits in a dark blurred chip on every page, so white stays legible on any header background.
  2. **Desktop only:** clicking the hamburger reveals the nav options as a **horizontal row of tabs across the top** (Robinhood-web style), not the current vertical dropdown. **Mobile stays the vertical dropdown** (Drew: "only on desktop").
- **Screenshots (the spec):** closed = ☰ top-right; open = ☰ becomes ✕ and a full-width strip of horizontal tabs appears just below the header line, left-aligned across the width.
- **Interpretation (noted to Drew + in PR):** White Wall has no persistent Robinhood-style header bar — the shared nav injects a floating top-right hamburger. Faithful match = on desktop, the same menu opens as a full-width horizontal tab strip at the top (logo stays top-left, ✕ top-right) instead of the narrow dropdown box.
