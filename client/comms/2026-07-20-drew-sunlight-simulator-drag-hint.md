# Drew — Sunlight Simulator: add "drag to interact" hint caption

- **Source:** Gmail (WhiteWall Dashboard R&D thread `19f6b708fb71898c`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew's WhiteWall alias)
- **To:** Andrew - Entrpy <andrew@entrpy.co>
- **Date:** Mon, 20 Jul 2026 10:46:55 -0400
- **msgid:** `19f7ffebbfc2cb76`
- **Classification:** change-request (copy / static overlay) — fast path
- **Access:** ACTIVE paid window (armed), no paywall.

## Verbatim

> On the sunlight simulator, can you put a small icon at the bottom of the image that says "Drag your finger (or curser if on computer) to interact with the simulator"

(Quoted my prior reply `19f7ff1f71802693` beneath it — the hamburger/Robinhood ship confirmation.)

## Triage

- Distinct request → new ticket **DREW-5** (the hamburger work was DREW-4, done).
- Target: the Sunlight Simulator page (`/sunlight-simulator`). The simulator itself is Drew's
  self-contained bundle (`sunlight-simulator-app.html`), kept **byte-for-byte** and embedded in a
  full-viewport iframe by the thin wrapper `sunlight-simulator.html`. So the hint goes in the
  **wrapper** as an overlay pinned to the bottom of the frame — bundle stays untouched.
- `pointer-events: none` on the overlay so it never intercepts the very drag it is advertising.
- **Copy note:** Drew wrote "curser" — an obvious typo for "cursor". Shipping the corrected
  spelling ("cursor") on the live public page and flagging it to him (assume-then-offer). Text
  otherwise verbatim: "Drag your finger (or cursor if on computer) to interact with the simulator".
- Not money / architecture / legal / customer-scale → no §4 gate. Copy/static VERIFY tier
  (node-check n/a — HTML only; Playwright render + prod spot-check).

## Shipped

- **PR #91** (squash `2cf1deb`) merged → Vercel prod → LIVE on whitewallstudios.co/sunlight-simulator (curl + live Playwright render verified; pill visible, pointer-events:none, correct text, no console errors).
- **Reply to Drew** sent `19f800ad4db9b934` on thread `19f6b708fb71898c` (autonomous send — established Foreman cycle, not the cold-start first outbound; no dashes; no payment mention). Confirmed live, flagged the curser→cursor spelling fix + the desktop-vs-mobile placement note, offered mobile-scroll-reveal alternative.
- Ticket **DREW-5 → done**; revision-status **Round 44**; `last-seen-drew.txt` pinned to `19f7ffebbfc2cb76`.
