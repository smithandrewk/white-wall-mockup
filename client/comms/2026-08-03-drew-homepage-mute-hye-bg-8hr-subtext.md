# Drew — homepage mute + flagship Host Your Event bg + 8-hour subtext (2026-08-03)

Three distinct website-thread requests that stacked on thread `19fc3564aa0918a0`
("WhiteWall Website") after the DREW-46 flagship confirm (my `19fc94ce271dd792`, 16:24 ET).
The launchd watcher fired on the newest (`19fc95a6fa6a566f`); reconciliation found the two
earlier ones (`19fc94144c27b3ec`, `19fc9517e77887c4`) were leapfrogged by the scalar
last-seen and never handled. All three logged here verbatim and handled this round.

Tickets: **DREW-48** (homepage mute), **DREW-46 reopened** (flagship HYE bg swap — same
section DREW-46 just set), **DREW-49** (8-hour subtext). One booking PR covers all three.

---

## Message 1 — homepage: mute Flagship + Taylor's Mill sections (DREW-48)

- Source: Gmail (WhiteWall dashboard-revisions / Website thread)
- From: WhiteWall Studios <contact@whitewallstudios.co>
- Date: Mon, 3 Aug 2026 16:11:53 -0400
- Thread: 19fc3564aa0918a0
- Message-id: 19fc94144c27b3ec

> Incredible. Now I want you to go to the home page, and I want to get rid of the section
> on the homepage that says "Flagship Location" and this section that says "Taylor's Mill
> Location." I don't want to lose this progress, though, because I do love those pages. We
> might add those sections back in, but for right now, I essentially want to deafen or mute
> those two sections as you scroll. It should now be the same WhiteWall Studios and Event
> home page with the "Book Now" button. It should then go straight to:
> Two Locations
> Standard
> The "Host Your Event" section button should link straight to the events page that we've
> now made
> Again, just to repeat, we're getting rid of the "Flagship Location" section on the home
> page and the "Taylor's Mill" section on the homepage, but we don't want to delete it
> because it's very likely we'll add it back later.

---

## Message 2 — flagship page: Host Your Event bg to a high-quality event photo (DREW-46 reopened)

- Source: Gmail (Website thread)
- From: WhiteWall Studios <contact@whitewallstudios.co>
- Date: Mon, 3 Aug 2026 16:29:36 -0400
- Thread: 19fc3564aa0918a0
- Message-id: 19fc9517e77887c4

> On the flagship location page, the background being the bounce houses for the "Host Your
> Event", let's go ahead and change that to one of the event photos that we have that are
> high quality. Whatever one you think makes most sense there.

---

## Message 3 — flagship booking: 8-hour session subtext (DREW-49)

- Source: Gmail (Website thread)
- From: WhiteWall Studios <contact@whitewallstudios.co>
- Date: Mon, 3 Aug 2026 16:39:22 -0400
- Thread: 19fc3564aa0918a0
- Message-id: 19fc95a6fa6a566f

> Pip another thing – on the website, when they book the flagship location and they're doing
> an 8-hour session for any event or photo/video, put some subtext underneath it that says,
> "Available starting at 12:30 p.m." Just like you have the text in the parentheses for the
> full day that says "5 a.m. to 11 p.m. access".

---

## Triage

- Classification: all three = `change-request`, booking-site (`white-wall-mockup`) only,
  static/layout/copy + one config+render string. No money / architecture / legal / customer
  scale / standing-decision reversal → **no hard gate, fast path.** Powdersville-first is not
  affected (homepage keeps the Two Locations comparison which is already PV-first).
- **DREW-48** (homepage mute): index.html — comment out (keep, don't delete) Snap 2
  `#flagship-snap` + Snap 3 `#taylors-mill-snap`; retarget the Host Your Event snap button
  `/powdersville#events` → `/events`. Flow becomes hero (Book Now) → Two Locations, One
  Standard → Host Your Event → events page.
- **DREW-46 reopened** (HYE bg): powdersville.html `#events` bg `event-flagship-01.jpg`
  (bounce) → `event-flagship-08.jpg` (Refine Network event, 1600x1067 landscape, most
  negative space for the overlaid heading, doesn't foreground a third-party banner). My pick
  per "whatever one you think makes most sense."
- **DREW-49** (8-hour subtext): booking-config.js pv-8 gains `subtext: "Available starting
  at 12:30 p.m."`; booking-flow.js single-day duration render wraps the label in a
  `.duration-pill-main` column and adds a `.duration-pill-subtext` line when the duration
  carries `subtext`; booking.css styles it. pv-8 is flagship-only, so it only shows on the
  flagship booking. Verbatim-dictated copy; 12:30pm is Drew's own established fact (V3 item 3,
  matches `earliestStartMinutes: 750`).
