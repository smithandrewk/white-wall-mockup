# Drew — Session Builder cleanup (Good to Know removal + Saved-session card details), 2026-07-29

- **Source:** Gmail, thread `19fa478568fc46a2` ("WhiteWall Dashboard Revisions"), work mailbox `andrew@entrpy.co`
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Window:** PAID (Drew paid the $30 cycle ~09:09 ET; access active through Thu 2026-07-30 09:09 ET, armed)

Two Session-Builder change requests, fired as a burst right after payment landed.

---

## Request 1 — remove "Good to Know" section + tabs (msg `19fadfeb6acf008d`, 09:09:26 ET)

Screenshot: `attachments/2026-07-29-drew-goodtoknow-screenshot.png` (the builder's "GOOD TO KNOW"
info panel — the tab row + the four policy bullets: events allowed 2hr+, 1-hour not eligible,
$150 multi-day cleaning fee, multi-day discount).

### Verbatim

> Hey Pip,
>
> I'm attaching a screenshot here for the session builder. We can get rid of the whole "Good to
> Know" section and all these tabs and everything. We don't even need the words "Good to Know" or
> anything.

---

## Request 2 — Saved sessions card details (msg `19fae0246104d1f5`, 09:13:18 ET)

Screenshot: `attachments/2026-07-29-drew-savesessions-screenshot.png` (the dashboard "Saved sessions"
card: title "Drew Test Session", subtitle "Flagship (Powdersville) · Event", notes, $3,800.00 on the
right, Load / Edit / Delete buttons).

### Verbatim

> In the Save Sessions area, where I can see all the different sessions, underneath the dollar amount
> on the right side, I want you to display if it's a photo/video, event, or multi-day event. Those are
> three options.
>
> Also add a button next to the Load, Edit, and Delete buttons that says "Get Link".
>
> Next to the title that says "Drew Test Session", I want it to also display the date and time. If it's
> a photo/video, then obviously it's just gonna be one single day, and then give me the range of the
> times. Honestly, give me the range of times and dates no matter what it is. It doesn't need to be
> super loud here. It can just be a quick reference.
>
> If it's a multi-day session, what time can they check in, and what time do they check out – on what
> day(s)?

---

## Triage

- **Class:** change-request (two distinct, both wws-dashboard Session Builder). No money, no
  architecture, no legal, no customer-scale. Both dashboard-internal — the customer booking site is
  NOT in scope (Request 1 is scoped "for the session builder"; the customer site's Good-to-Know panel
  is genuine customer education and stays).
- **Path:** fast-ish (concrete UI changes, dictated by screenshot). Build → dashboard `npm run build`
  gate → prod-verify on :18794.
- **Coupling check:** Request 1 must be **builder-mode-gated** so removing "Good to Know" does not
  strip it from the live customer booking flow. Request 2 is pure dashboard component work
  (`session-builder-embed.client.tsx` + saved-draft fields), no booking-site impact.
- **Get Link (Request 2):** the "Get Session Link" action already exists inside the builder summary
  (Phase 2, DREW-21). Request 2 wants that same mint-link action exposed per saved-session card.

## Tickets

- DREW-22 — Session Builder: remove Good to Know section + tabs (builder-mode only)
- DREW-23 — Saved sessions cards: session type under price, Get Link button, date/time range by title
