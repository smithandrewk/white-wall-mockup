# Drew — WhiteWall Dashboard R&D (Overview page revision)

- **Source:** email, new thread (NOT the revisions thread)
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew's WhiteWall alias)
- **To:** Andrew - Entrpy <andrew@entrpy.co>
- **Subject:** WhiteWall Dashboard R&D
- **Date:** Thu, 16 Jul 2026 10:59:14 -0400
- **Thread id:** 19f6b708fb71898c
- **Msg id:** 19f6b708fb71898c

## Verbatim

Hey pip, let’s dive into revising the WhiteWall Dashboard.

Let’s revise the Overview page at the top.
1st, start with replicating Andrews overview (non slop version). Thats the new starting point on the official overview page.

Now with that as the base, add one toggle bar at the top of the page that allows you other swap between Company Wide, Powdersville, and Taylors Mill. It the adjust all the data on the entire page specific to what toggle its on.
Then, add another chart that matches the same style of the new month vs month chart, but make it year over year, where it shows the net total, on a month over month basis for the whole year, and then change the solid line for 2026 so far to a dotted line when it swaps from actual top projected. I also want to see the net total number for this year at the top, and the percent change, just like we had on the original one.
On the This Week bar chart, add a dotted line horizontally to where that week’s specific average is for each day.
In This Weeks Bookings, make it stretch horizontally at the bottom of the data on this page,

For this week's bookings, let's just make it a literal calendar for the entire month. For every individual booking we have on each day, put a dot underneath the day, just like Apple Calendars does for all the different events you have. Change the color to either the Powdersville dashboard color or the Taylors Mill dashboard color so I can easily glance and see how many bookings we have on what day at what studio. I can tap into that specific day, and then it collapses/unfolds the information:
the person's name
what time their session starts
what studio it is
how long the session is
how much money they paid us
the type of booking, if it's a photo/video or it's an event
I can just collapse that data, and it disappears.

## Triage (Foreman)

Classification: change-request (multi-part), deliberative path — dashboard Overview redesign.
Repo: `wws-dashboard` (internal dashboard, wws.entrpy.co). All READ-ONLY lenses over
already-ingested booking data. No booking-site change, no schema change expected.

Escalation check (§4): NOT gated. No money spent (displays existing money data, does not
change pricing/charges), no platform architecture (dashboard page/components over the existing
DB, same class as the lead-source + coupon tabs), no legal/policy, internal-only (no customer
scale). Within Foreman authority to build + ship.

### Items
1. **Replace official Overview with "Andrew's overview (non-slop version)" as the base.**
   BLOCKING DEPENDENCY — must locate what "Andrew's overview" is (a prototype/route/branch
   Andrew built). Cannot build item 1 until found.
2. **Scope toggle** at top: Company Wide / Powdersville / Taylors Mill — filters ALL page data.
3. **YoY net-total chart** in the style of the new month-vs-month chart: net total month-over-
   month across the year; 2026 actual = solid line, projected = dotted (switch at the actual→
   projected boundary); show this-year net total number + % change at top (like the original).
4. **This Week bar chart:** add a horizontal dotted line at that week's per-day average.
5. **"This Week's Bookings":** stretch full-width at the bottom of the page.
6. **Replace "This Week's Bookings" with a full-MONTH calendar** (Apple-Calendar style): a dot
   per booking under each day, colored by studio (Powdersville vs Taylors Mill dashboard color);
   tap a day → unfold each booking (name, start time, studio, length, amount paid, photo/video
   vs event); tap again to collapse. (Items 5+6 combine: the bottom bookings section becomes a
   full-width month calendar.)

### Foreman actions
- **Located item 1's dependency:** "Andrew's overview (non slop version)" = the glance lens at
  `wws-dashboard/app/overview/page.tsx` (commit `b37f9ad` #84, refined #85/#86), route `/overview`.
  Data: `lib/stats/glance.ts` (`getGlance` + `getGlanceBookings`), components `GlanceView` +
  `BookingsWeekCard`. The current official Overview (route `/`, `app/page.tsx`) is the "slop".
- **Replied to Drew** (in-thread, msg `19f6b7a8533c58da`, 2026-07-16) restating the 6-part plan
  so a misread is catchable early. **OPEN PROMISE (tracked loop, owner=Foreman):** send Drew a
  link to look at once it's up.
- Send authority: not first-cycle-ever (many prior cycles shipped); Andrew authorized full
  autonomy for this run. Autonomous send per skill Reporting clause.

### SHIPPED + LIVE (2026-07-16)
All 6 items built in `wws-dashboard` **PR #87 (squash `458b00d` line) merged + deployed +
kickstarted**; prod verified on `wws.entrpy.co` (home 200, `/overview` 307 redirect, live HTML
carries the YoY chart / bookings calendar / week-average line / scope pills, "non slop version"
nav entry gone). **Open promise RESOLVED** — sent Drew the live link + walkthrough (msg
`19f6b8e36b736e28`). Build plan: `client/comms/2026-07-16-dashboard-overview-build-plan.md`.
- **Verified:** `npm run build`; 103 unit tests (new `computeYoy` + `weekAvg` coverage);
  live-DB Playwright render of all 3 scopes (calendar counts reconcile 21 PV + 15 TM = 36
  company), a tapped day (name/time/studio/length/amount/type), 390px mobile (no overflow, no
  console errors). Screenshots in scratchpad.
- **Two honest notes told to Drew:** (a) per-booking amount = net Square cash (booked value
  labeled when unpaid); one-line swap to gross if he wants "charged". (b) YoY prior line reads
  n/a for Powdersville (no 2025 cash attributable to the 2026 flagship), full for Taylor's Mill.
- Worktree left at `wws-dashboard-worktrees/overview-glance` (branch not deleted).

## Round 2 — Drew reply (msg `19f6b944d8b1bc71`, 2026-07-16 11:38, contact@whitewallstudios.co) + screenshot

Verbatim: "Okay, this is great. The first thing is, can we fill the full page on the left and
right sides? If I expand the window, I want it to actually fill the whole size. [screenshot of
the centered column with empty side margins]. Let's also make the solid line and future
projection dotted lines green. While the average month or previous year's lines can stay
gray/black, make that current year/projected lines green if we are beating the average month or
year prior. Make it red if we are not beating it. The calendar is also amazing... Whenever I click
on a day... I want to then be able to click on this specific person and then view all the
information they put in the form... [Instagram handle? how many people? what exactly the event
was? add-ons, literally all of it. Clean, easy to read]. and then, on the left side where we have
'Bookings' as a tab, I want you to make a new tab underneath that one that says 'Calendar'...
an entire page allocated to this exact same process, but bigger and better... Can you confirm
that the calendar is pulling straight from acuity/square?"

Triage (not §4-gated — full-width, chart colors, a read-only intake dropdown, a new read-only
page, and answering a question):
1. **Full-width** — drop GlancePage's `mx-auto max-w-6xl` so it fills the window.
2. **Perf-colored chart lines** — current-year + projected lines GREEN when beating baseline
   (pctChange >= 0), RED when behind; average-month / prior-year lines stay neutral. Apply to
   BOTH the month-vs-normal chart (`data.pctChange`) and the YoY chart (`yoy.pctChange`); null pct
   → neutral.
3. **Per-person intake dropdown** in the calendar day expansion. Data: `client.instagram/
   business_name/phone/email_norm/display_name`, `booking.participants`/`properties.attendees_raw`,
   `booking.notes` (the labeled intake: Heard about us / Event booking / Event guests / Food or
   drinks / Event description), `booking_addon` (resolve ids via `addonName()` from
   `lib/addons-catalog.ts`; N rows = qty N). **PARSE OUT** the `--- CARD-ON-FILE CONSENT ---`
   block in notes (Square token ids, consent IP/UA, hashes) — auto system data + sensitive, NOT
   "what she filled in". Needs a `getBookingIntake(id)` loader + nested collapse UI.
4. **New `/calendar` full-page route** + a "Calendar" nav entry directly under "Bookings" — the
   month calendar full-page (scope toggle + the per-person intake), bigger.
5. **Answer (inline, done in the reply):** the calendar reads the dashboard's own Postgres, which
   the hourly poller (`co.entrpy.wws-poll`, StartInterval 3600, read-only) syncs from Acuity
   (bookings) + Square (cash). So it's real Acuity/Square data, <=~1h behind, by design (snapshot
   pattern, not a live per-page API hit). Square IS flowing (real revenue in the DB).
- Replied ack + answered the data-source Q inline (msg `19f6b9a8f95a721c`). Screenshot saved to
  scratchpad `drew-fullwidth.png`.

### Round 2 SHIPPED + LIVE (2026-07-16) — wws-dashboard PR #88 (squash) merged + deployed + prod-verified
Confirmed live to Drew (msg `19f6ba5414cfa72f`). All 4 build items + the inline data-source answer.
- **Full width** (dropped `max-w-6xl` on GlancePage). **Perf-colored lines** (shared `perfColor()`:
  current+projected GREEN when beating baseline / RED when behind; avg + prior stay gray; applied to
  month-vs-normal AND YoY; neutral when pct null). **Per-person intake dropdown** (`getMonthCalendar`
  now returns per-booking `intake`: client contact + participants + add-ons via `addonName()` +
  consent-stripped notes; `stripConsentFromNotes()` pure + unit-tested — the CARD-ON-FILE CONSENT
  block with Square token ids / consent IP is parsed OUT; concatenated `business_name` " | " dumps
  split into a readable list). **New `/calendar` full page** + "Calendar" nav under Bookings
  (`getCalendarPage()`, `components/glance/calendar-page.tsx`, `large` cells).
- **Verified:** build; 105 tests (2 new consent-strip, asserting no token/IP leak); live-DB render of
  full-width Overview (red month line / green YoY), a person intake expand (consent block absent), the
  /calendar page, no overflow at 1600/390, no console errors. Screenshots `r2-*` in scratchpad.
- **Data quirk flagged to Drew (not blocking):** some clients' entire Acuity intake form is ingested
  into `client.business_name` as a " | " blob; shown as a readable "Booking form" list. Offered to
  pull specific fields (participants, event description) into labeled rows if he wants. His call.
- **Answered inline:** calendar reads the dashboard's Postgres, synced hourly from Acuity (bookings)
  + Square (cash) by `co.entrpy.wws-poll` (read-only); <=~1h behind, snapshot pattern not live-API.
