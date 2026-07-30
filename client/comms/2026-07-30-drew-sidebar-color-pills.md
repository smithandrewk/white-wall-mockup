# Drew — sidebar color pills / higher-contrast nav (mockup attached)

Thread: `19fb2c5108d1cb55` ("Re: Whitewall x Watson build"), account `andrew@entrpy.co`.

Distinct from DREW-34 (the horizontal-bar-chart replacement, still open — Drew did NOT
pick a chart in this message). This is a new dashboard-styling request about the sidebar
nav colors that DREW-33 established.

---

## Message 1 (verbatim)

- Source: Gmail
- From: WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- Date: Thu, 30 Jul 2026 19:01:49 -0400
- msgid: `19fb5436927be361`
- Attachment: `Screenshot 2026-07-30 at 7.00.42 PM.png` (a mockup of the sidebar with a
  soft tinted background pill behind every nav row + icon/label in a deep saturated shade
  of that row's hue) — saved to `attachments/2026-07-30-drew-sidebar-color-pills-mockup.png`.

> Let’s make it like this. More contrast and easier to read. You can spice up the colors too. Making all of them different.
>
> Session builder, watson, and overview can be a smidge more deep/saturated than the rest so they stand out a little more from the crowd.

(Sent as a reply to pip's DREW-34 chart-options email, but the content is entirely about
the sidebar nav colors — no chart pick.)

---

## Triage

- Classification: change-request (dashboard styling). Fast path — Drew dictated the design
  with a concrete mockup ("make it like this"), so build-now, no converse-first.
- No money / architecture / legal / customer-scale → **no escalation**, pre-authorized.
- Ticket: **DREW-35** (distinct from DREW-34 chart, which stays open).
- Build: `wws-dashboard` — per-row tinted background pill + deep accent text/icon, driven
  from `lib/nav.ts` (single source of truth for desktop sidebar + mobile island). Session
  Builder / Watson / Overview get a stronger tint so they stand out.

---

## Shipped + live ✅

- **wws-dashboard PR #109** (squash `8ad16e5`), merged → mini pulled/built/kickstarted →
  LIVE on :18794 + prod-verified. `lib/nav.ts` `color`→`{accent,tint}` (per-hue `HUE`
  map, full-literal Tailwind); `app-sidebar.tsx` + `mobile-nav.tsx` updated. Deep trio
  (Overview/Watson amberDeep, Session Builder violetDeep) stronger tint. Active row stays
  in-hue via v4 `!important` on the hover/active tint (beats shadcn `bg-sidebar-accent`).
- Verify: `npm run build` + 177 unit tests + Playwright sidebar light + dark matched the
  mockup; `/session-builder` active row deep violet; mobile 390px docOverflow=0; prod SSR
  carries the new classes.
- Confirmed live to Drew: reply `19fb54e4fba7eeb7` with a live prod sidebar screenshot
  attached; offered per-row color tweaks and kept the DREW-34 chart pick warm.
- Ticket **DREW-35 → done**; revision-status **Round 72**.
