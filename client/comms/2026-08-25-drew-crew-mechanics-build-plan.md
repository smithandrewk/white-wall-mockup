# DREW-80 — Event Setup/Reset Crew mechanics overhaul — build plan (Round 118, item 4)

Source: comms `2026-08-25-drew-flagship-email-audit-hearabout-crew-mechanics.md` (msg `1a03994b8716a7ed`).
This is the executable plan for the item-4 backend build. Items 2 (DREW-78) + 3 (DREW-79)
already shipped live. Item 1 (DREW-77) is Acuity-dashboard, escalated (access).

**Coupling rule:** 4a (remove the intake questions) MUST land together with 4b + 4c (April +
owner crew notifications), or a crew booking in the gap gives Drew LESS info than today. Ship
the booking-repo pieces (4a/4b/4c) as ONE PR; 4d (dashboard) as its own PR; 4e is infra-gated
(esc `esc-item-4e-...`, OPEN).

## 4a — Remove the crew intake ("placement") questions  [booking repo]
Today: selecting the crew add-on shows "Tell our crew where each item should go" with 8
placement dropdowns, required before pay.
- `scripts/booking-config.js` setup-crew object: remove `requiresPlacements: true` and the whole
  `placementItems: [...]` array.
- `scripts/booking-flow.js`:
  - `renderPlacementRows` (≈4397-4421): now returns "" always (requiresPlacements gone) — delete
    the function + its call in `renderFeaturedAddonCard` (≈4451 `${renderPlacementRows(...)}`).
  - `set-placement` action handler (search `data-action="set-placement"`, ≈4410 render + the
    handler in the click switch) — delete.
  - Validation at ≈5312 (`"Please tell our crew where each item should go..."`) + the missing-
    placement check (≈5305-5316) — delete.
  - `getInitialAddonState` / state.placements plumbing for this addon — drop placements.
- Verify: event booking with crew add-on selected → no placement questions, checkout still
  completes (the crew add-on still charges $750, still lands in Acuity notes as an add-on).
- The old placement answers were written into Acuity notes / cart lines — grep `placements` and
  `placement` across `api/_lib/cart.js`, `api/create-checkout.js`, `notify-*` and strip cleanly.

## 4b — April cleaner email: crew heads-up  [booking repo, api/_lib/notify-cleaner.js]
`notifyCleaner(bookingState, appointmentId)` already fires to `CLEANER_EMAIL` when a cleaning
fee applies. Drew wants, WHEN the crew add-on is on the booking:
1. Inside the EXISTING cleaner email, add a section: "You are also needed for the Event Setup and
   Reset Crew for this event" + the same booking info.
2. ALSO a SEPARATE dedicated email to April: she needs to be aware of the setup BEFORE the event
   and the reset/cleanup AFTER. (short, event-scoped.)
- Detect crew add-on: `bookingState.addons["setup-crew"]?.selected` (confirm the shape in
  create-checkout's bookingState). Gate both additions on that.
- Note: `notifyCleaner` today only fires when `cleaningFee.amount > 0`. A crew booking is an EVENT
  and events trigger the cleaning fee, so it should fire — but CONFIRM: if a crew add-on could
  exist without a cleaning fee, the crew heads-up must fire independently (add a `notifyCleaner`
  call path gated on crew-addon even when cleaningFee==0). Safer: fire the crew emails from
  create-checkout independent of the cleaning-fee gate.

## 4c — Owner "Action required" email  [booking repo, new api/_lib/notify-crew-owner.js]
When a booking includes the crew add-on, send a dedicated email to the WhiteWall/owner inbox
(`NOTIFICATION_EMAIL`, Drew's inbox — already gets every-booking notices):
- Subject (bold intent): `Action required: SETUP/RESET ADD-ON for Session <WWxxxx>` where
  `<WWxxxx>` = the session's WW code (the dashboard reference, e.g. WW2892). SOURCE of the WW code:
  the booking's Acuity id maps to a `WW<acuityId-ish>` label — CONFIRM how the dashboard derives
  "WW2892" (likely the Acuity appointment id or a sequence; check wws-dashboard `/bookings/[id]`
  ref rendering). If the WW code isn't known at booking time (it's a dashboard-side label), use the
  best stable id available and have the dashboard deep-link resolve it.
- Body: FIRST line is a hyperlink sentence "Visit this session's booking in the dashboard" → deep
  link `https://wws.entrpy.co/bookings/<id>`. Under it: name, date, amount paid, add-ons, phone,
  email (mirror the WW2892 detail view fields).
- Wire in `create-checkout.js` next to `notifyOwner` (≈850), gated on crew add-on.
- Verify on staging (Resend self-suppresses on staging; assert the composed subject/body via a
  unit test with a crew-addon bookingState, no real send).

## 4d — Dashboard: crew add-on shown LAST + autosave notes  [wws-dashboard repo]
On `/bookings/[id]` (built in DREW-71): when the booking has the crew add-on,
- render the crew add-on LAST in the add-ons list, and
- under it a notes textarea specific to this add-on that AUTOSAVES on edit (debounced), tied to
  the booking (session). "Saves every time I add notes."
- Storage: new table/column, e.g. `booking_crew_notes(booking_id pk, notes text, updated_at)` —
  migration in wws-dashboard `db/migrations`. This is dashboard-owned data (NOT an upstream write),
  so it's inside the READ-ONLY-upstreams invariant (we write our OWN table, not Acuity/Square).
- API: `POST /api/bookings/[id]/crew-notes` (auth'd), autosave from the client. Read on the detail
  page. Follow the DREW-71 detail-page patterns.
- Verify: `npm run build` + seed a crew booking + type notes + reload → persists; non-crew booking
  shows no notes box.

## 4e — Auto-DRAFT personalized client email  [INFRA-GATED — esc-item-4e-..., OPEN]
When a booking includes the crew add-on, compose (DRAFT, never send) a personalized email to the
client, landing in Drew's drafts, written as Drew, using his template (see comms verbatim).
- Personalization: first name from booking; [EVENT TYPE] rephrased NATURALLY from the intake
  "Session purpose"/event text via an LLM (Anthropic API) so it never reads templated.
- Blocked on the decision in esc-item-4e: (1) how it "lands in Drew's drafts" (Gmail OAuth to his
  mailbox vs a ready-to-send composed email vs pip-gmail draft), (2) ANTHROPIC_API_KEY on the
  booking project for the rephrase. Build once Andrew/Drew answers. Do NOT auto-send — draft only.

## Sequencing
1. PR A (booking): 4a + 4b + 4c together. Staging verify (event booking + crew add-on: no
   placement Qs; April gets crew section + 2nd email; owner gets Action-required email). Unit
   tests for the composed emails (no real sends). Merge → Vercel.
2. PR B (dashboard): 4d. build + seed verify. Merge → kickstart.
3. 4e: after esc-item-4e answered.
