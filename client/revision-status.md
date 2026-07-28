# WhiteWall Site Revisions — Status Checklist

Source: "WhiteWall Site Review — Cleaned Version" PDF from Drew

---

## Home Page — NEW

- [x] **Video hero homepage** — Full-screen silent looping video with "WhiteWall Studios and Events" + "Book Now" button. Uses Powdersville Tour Video converted to MP4.

## Home Page — CURRENT

### Mobile Layout
- [x] Add divider between the two location options that says "Choose Your Location"
- [x] Change button text to "Powdersville Location"
- [x] Change button text to "Taylors Mill Location"

### From Our Studios Section — Photo Gallery
- [x] Photos appear in completely random order (Fisher-Yates shuffle)
- [x] Include all photos from the old website gallery (Taylors Mill)
- [x] Include all photos from Google Drive for Powdersville

### Location Labels
- [x] Every photo has a faint label in the top left corner indicating the location

### Photo Behavior
- [x] Clicking a Taylors Mill photo sends user to the Taylors Mill page
- [x] Clicking a Powdersville photo sends user to the Powdersville page

### Gallery Tabs (gallery.html)
- [x] All Tab: show all photos from both locations
- [x] All Tab: include faint location labels
- [x] All Tab: all photos remain clickable to location pages
- [x] Powdersville Tab: show only Powdersville photos
- [x] Taylors Mill Tab: show only Taylors Mill photos
- [x] Random display order (Fisher-Yates shuffle)
- [x] Include literally every photo we have — added 37 missing photos (12 PV, 25 TM)

### Google Reviews Carousel
- [x] Carousel section exists under the gallery on the home page
- [x] Mix reviews from both TM and PV locations
- [x] 5-star reviews only display
- [x] Reviews are real — 8 curated 5-star Google reviews from TM (PV has no Google reviews yet)

---

## Powdersville Location Page

### Host Your Next Event Section
- [x] Replace "Brand Activations" with "Workout Classes"

### Overall Tone Reminder
- [x] PV should feel like the "no-brainer option" — Updated hero subtitle, about section copy, and feature descriptions to subtly position PV as the obvious choice

---

## Powdersville — Booking Tab

### Pricing
- [x] Pricing directly on the duration bubbles

### Booking Steps
- [x] Move Schedule to Step 2
- [x] Everything else shifts down
- [x] Add-ons remain last (Step 5)

### Time Options
- [x] 1 hour says "(Not eligible for events)"

### Booking Flow Logic — Booking Type Selection
- [x] Photo/Video Session and Event Booking bubbles appear for every session including 1-hour
- [x] If user selects Event Booking after choosing 1 hour: shake the screen
- [x] Display popup message for 5 seconds: "Event bookings are only for 2+ hour sessions. Select a longer duration of time."

### Event Eligibility
- [x] Events allowed for 2-hour sessions and longer
- [x] Clarification text at top of event step: "Events are allowed for 2-hour sessions and longer."

---

## Participant Count Field

- [x] Label changed to: "Event? How many people will you have? If not an event, leave blank."
- [x] Keep existing protocol for 50+ people (warning popup)
- [x] Fix digit-blocking bug (typing stops after first digit) — uses targeted DOM update instead of full re-render

---

## Intake Form Logic

### Participant Threshold Rules
- [x] If over 50 people: trigger the existing popup warning
- [x] If over 25 people: require a text box entry asking them to explain the shoot
- [x] Text says: "Tell us more about your shoot. A cleaning fee may be added due to the high traffic count..."
- [x] Both conditions notify the owners (via Resend email)

---

## Email Importance Acknowledgment

- [x] User must type their name to acknowledge (similar to signing the waiver)
- [x] Text matches PDF: "An email will be automatically emailed to you immediately after you book this session..."
- [x] E-sign prompt: "Please acknowledge you have fully read this statement by e-signing your first and last name here."
- [x] Present on both PV and TM booking pages

### Additional Form Changes
- [x] Instagram is a required field

---

## Terms and Conditions

- [x] Require users to type their name and sign (not a checkbox)
- [x] Clause #1 changed to full liability acknowledgment text from PDF
- [x] Clause #4 cleaning fee changed to $200
- [x] TM T&C: "Events are not allowed at this location" added
- [x] TM T&C: copy PV structure, remove event language

---

## Waiver

- [x] Replace waiver with new copy from the end of the PDF
- [x] Applies to both Taylors Mill and Powdersville
- [x] Uses "Renter" and "My Party" terminology (verbatim from PDF)
- [x] 10 sections with bulleted lists where specified
- [x] TM waiver: remove event language, state "Events are not allowed at this location"

---

## Powdersville — Add-Ons

### Backdrops
- [x] Same structure on both locations
- [x] "Add All Backdrops" option uses `All Backdrops.png` from Drive — already wired as `images/gear-rentals/all-backdrops.png`

### Lighting Rental
- [x] Description updated
- [x] Carousel-style "Add to Booking" card with image preview — Toggle add-ons now render as carousel cards

### Rolling Walls
- [x] Wall 1: Layered, Hallowed, Squared Arch
- [x] Wall 2: Small Shelves
- [x] Wall 3: Layered, Curved Arch
- [x] Wall 4: Picture Frame
- [x] Wall 5: Three Simple Walls — Increasing Plain Arch Pack
- [x] Main thumbnail uses `V1-8.jpg` (best available — no group shot of all walls exists in Drive)

### White Banquet Chairs
- [x] Keep large main photo
- [x] Carousel options: 25/50/75/100 chairs (tier type in config)
- [x] Using all 5 chair photos from Drive (UUID filenames) — main + per-tier images wired in config

### 8ft Fold Out Tables
- [x] Renamed from "8ft Folding Tables" to "8ft Fold Out Tables"
- [x] Description: "Tables are one solid structure with no crease in the middle. The legs simply fold out."
- [x] "All 10 tables" option added
- [x] Using table photo from Drive (`cb48b32e`) — already in `images/gear-rentals/`

### TV Rental
- [x] Description: "4K smart TV with every HDMI connecting cable imaginable."
- [x] Using TV photo from Drive (`V2-38.jpg`) — already in `images/gear-rentals/`

### PA System
- [x] Description: "Large speaker with aux cable to connect to any phone, with wired microphone and stand."
- [x] Using PA photos from Drive (`V2-29.jpg` main, `V2-33.jpg` button — Drew with mic) — already in `images/gear-rentals/`

---

## Taylors Mill Page

### Tone Reminder
- [x] PV should feel like the "clear upgrade" without trashing TM — Handled via comparison chart + "Switch to Powdersville" CTA + PV tone pass

### Keep In Mind Section
- [x] Section titled "Keep In Mind" with bubble-style points
- [x] Studio is located within an old mill
- [x] Parking lot is about a 2 minute walk
- [x] No ensuite bathroom
- [x] Shared bathroom down the hall
- [x] No running water
- [x] No garage door / pull-up access
- [x] Located inside a large shared building
- [x] Glass front door
- [x] Not ideal for private shoots
- [x] 1,000 sq ft vs 2,000 sq ft (Powdersville)
- [x] 20 minutes from downtown Greenville vs 15 minutes

### Possible Additions (Drew said "possible")
- [x] Toggle to Powdersville location — "Switch to Powdersville" CTA
- [x] Note explaining Powdersville solved these inconveniences
- [x] Side-by-side comparison chart

---

## Taylors Mill — Booking Tab

### Timing
- [x] Move Schedule to Section 2
- [x] Red bubble: "This location is not approved for events."
- [x] Half Day renamed to "4 hours"
- [x] Full Day renamed to "12 hours"
- [x] Pricing on each time option

### Details
- [x] Copy Powdersville adjustments (email ack, T&C minus events, waiver minus events)

### Terms and Conditions
- [x] Copy Powdersville structure but remove all event language
- [x] Clearly state "events are not allowed at Taylors Mill"

### Waiver
- [x] Same waiver but remove event language
- [x] Clearly state "events are not allowed at this location"

### Add-Ons
- [x] Backdrops: same as Powdersville
- [x] Lighting Rental: same config as TM (already had lighting)

---

## Owner Notification (not in PDF, discussed separately)

- [x] Email notification via Resend for 25+ and 50+ participant bookings
- [x] High-traffic / capacity alert notes appended to Acuity appointment
- [x] Env vars set on Vercel (RESEND_API_KEY, NOTIFICATION_EMAIL)
- [x] Domain verified on Resend (whitewallstudios.co via GoDaddy auto-connect)
- [x] Test email sent and received

---

---

## Feedback Round 4 (2026-03-25) — Drew's "Whitewall feedback 3.25.pdf"

### Content Updates
- [x] Phone number changed to (803) 873-8153 across all 7 files (8 occurrences)
- [x] Homepage tagline: added "Greenville," to "...Event Space in Greenville, South Carolina"
- [x] Homepage intro paragraph: replaced with Drew's new two-location copy
- [x] PV card thumbnail description: simplified to "2,000sf, brand new, flooded with natural light..."
- [x] TM card thumbnail description: simplified to "1,000sf, raw historic mill character..."
- [x] Powdersville about section: full rewrite with Drew's 9-paragraph "The Studio You've Been Looking For" copy
- [x] Taylors Mill about section: full rewrite with Drew's "The Studio That Started It All" copy
- [x] Booking pages: added "informational" to "important YouTube videos"
- [x] TM booking/waiver/T&C: "This location is only approved for photo and video shoots, no events/parties allowed."
- [x] booking-config.js: "Events with 35+ attendees require confirmation"

### Booking Flow Logic
- [x] Session type selector: selected = white + blue bold border, unselected = dark grey (inversed)
- [x] Attendee threshold changed from 25 → 35 (event description, high-traffic note, TM modal)
- [x] Cleaning fee logic: 50+ auto-adds $150 line item; 35-49 events add $0 line item with "we will be in touch" note
- [x] TM hard cap at 50 people (popup + clamp)
- [x] PV 150-person cap message updated: "cannot host more than 150 people total, including vendors and contractors"
- [x] Intake form cross-validation: event attendee count must match intake participant count
- [x] Photo/video session 50+ people: cleaning fee popup + auto-add
- [x] Textarea validation bug fix: capture textarea value before DOM rebuild
- [x] Textarea warning border softened (orange → blue accent, less alarming)
- [x] "Tell Us About Your Event" prompt: Drew's new copy (setup/cleanup, back-to-back, 35+/50+ fees)
- [x] Acknowledgment checkbox: "I understand that bookings with 35+ guests require internal approval..."
- [x] Participant notices updated with 35+/50+ cleaning fee language
- [x] Cleaning fee passed to checkout payload for future API integration

### Gallery
- [x] Lightbox fix: filter-aware — reinitializes with only visible photos per active tab
- [x] Swiping in filtered tab now only shows photos from that tab

### Remaining / Escalation Items

| # | Item | Owner | Status |
|---|------|-------|--------|
| 1 | ~~PV homepage thumbnail photo from Drive~~ | Andrew | Done (2026-03-31) |
| 2 | ~~PV hero video placeholder (replace guy-on-boxes photo)~~ | Andrew | Done (2026-03-31) |
| 3 | ~~PV event carousel (4 photos next to event paragraph)~~ | Andrew | Accepted by Drew in person (2026-03-31) |
| 4 | ~~TM page video from Drive~~ | Andrew | Done (2026-03-31) |
| 5 | ~~All new gallery photos from Drive (every folder)~~ | Andrew | Done (2026-03-31) — 27 new photos: 13 TM, 7 PV events, 7 PV prop boxes |
| 6 | SMS booking confirmation to customers | Andrew | Acuity config or Twilio integration |
| 7 | ~~Cleaning fee as Square checkout line item~~ | Andrew | Done (2026-03-29) |
| 8 | ~~Cleaning fee in Acuity appointment notes~~ | Andrew | Done (2026-03-29) |
| 9 | ~~Add-on photo swaps from prior round (6 items)~~ | Andrew | Done — all already using Drive photos (verified 2026-03-31) |

## Feedback Round 6 (2026-03-30) — Drew's text 2026-03-30

- [x] Add "Will there be food or drinks?" yes/no checkbox to event booking form (Powdersville only, event intent = yes)
- [x] Location cards: move text and button to overlay at bottom of photo
- [x] Location cards: black background on buttons with short text
- [x] Location cards: semi-transparent dark background on description text

## Feedback Round 7 (2026-03-30) — Drew's text 2026-03-30 (booking changes)

- [x] PV cleaning fee: auto-block 2.5 hours after session on Acuity calendar for cleaners (when $150 fee applies)
- [x] PV full day: show "(5am–11pm access)" in duration label
- [x] PV full day: only allow 5 AM start time in time slot picker
- [x] SMS confirmation — deferred as nice-to-have. Acuity only supports SMS reminders (not confirmations). Would need Twilio (~$0.008/text) in booking-callback.js for instant confirmation. Drew can revisit post-launch.

### SMS Confirmation — Research Notes

Drew wants customers to receive a text message confirmation in addition to the email Acuity sends. Our Pay → Book architecture already solves the timing problem: the Acuity appointment is only created *after* Square payment is confirmed, so Acuity's built-in notifications (email + SMS) fire at the right time. The confirmation email already works this way.

**Next step:** Check Drew's Acuity dashboard (Notifications / Text/SMS Reminders) to verify:
1. Is SMS enabled for **appointment confirmations** (not just pre-appointment reminders)?
2. Does the customer need to opt in, or does it send automatically when a phone number is on the appointment?
3. We already pass `phone` to the Acuity API when creating appointments, so the number is there.

Acuity's Business plan (via Squarespace) includes SMS. If confirmation SMS is a toggle, this may just need to be turned on — no code changes required. If Acuity only supports SMS as pre-appointment *reminders* (not instant confirmations), then Twilio (~$0.008/text) is the fallback, added to `booking-callback.js` similar to `notifyOwner`.

**Resolution (2026-06-12, issue #7):** Acuity's built-in confirmation SMS is templated and can't carry per-booking instructional video links — which the B1 wishlist explicitly requires — so the zero-code toggle path is dead. Andrew chose **Twilio**. Built `api/_lib/notify-customer-sms.js` and wired it into `api/create-checkout.js` (after `notifyOwnerSMS`; note the live notify path is create-checkout, not the deprecated booking-callback). The SMS sends booking details + video links relevant to the add-ons booked (lighting/chairs/events) plus the studio walkthrough. No-ops until `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` are set, and hard-skips in staging.
- [ ] **Blocked (owner/Drew):** Twilio account + A2P 10DLC brand/campaign registration (needs Drew's business/EIN info; days–weeks carrier approval), buy a sending number, set the three env vars in Vercel Production.
- [ ] **Pending Drew sign-off:** customer-facing SMS copy in `buildCustomerSms()` is a draft.
- [x] SMS consent disclosure added under the phone field on both booking pages (`book-powdersville.html`, `book-taylors-mill.html`) + "Text Messaging (SMS)" section in `privacy.html` with the no-sell/no-share-mobile-data clause TCR/carriers require. Needed so the A2P campaign's stated opt-in matches the live site. Wording is standard A2P boilerplate — fold into the #26 attorney review.

## Feedback Round 8 (2026-04-02) — Drew's text 2026-04-02

- [x] Taylor's Mill page: change "Parking lot is about a 2 minute walk" to "Taylor's Mill is a 5 minute walk" (Keep In Mind pills + comparison table)
- [x] Homepage: add full-screen comparison card between Taylor's Mill snap and Events snap — dark background, side-by-side feature table, subtext about props/backdrops included, CTA buttons for both locations

## Feedback Round 9 (2026-04-02) — Drew's text 2026-04-02

- [x] Homepage: replace flagship card hero video with static image (whitewall-powdersville_v2-3.jpg)

## Feedback Round 10 (2026-04-02) — Drew's voice note 2026-04-02

- [x] Homepage comparison card: add "Compare Prices" button in top-left cell that triggers split-flap flip animation to swap features for pricing rows (1hr–full day, both locations)

## Feedback Round 11 (2026-04-02) — Drew's text 2026-04-02

- [x] Homepage reviews: replace auto-scrolling carousel with stationary swipeable carousel (arrows + dots + touch swipe)
- [x] Homepage reviews: add Flagship/Powdersville reviews first, then Taylor's Mill — scraped 2 Flagship reviews (Shawn Newby, Drew Shahoud) from Google

## Feedback Round 12 (2026-04-02) — Drew's text 2026-04-02

- [x] Homepage comparison: add 7 new feature rows (hair/makeup, rolling walls, TV, PA, tables/chairs, soundproofing, blackout control)
- [x] Homepage comparison: update full day pricing to show hours and event eligibility
- [x] Homepage comparison: make "Compare Prices" a visible styled button (border, background, hover)
- [x] Homepage comparison: color Flagship (#4A90D9) and Taylor's Mill (#c4a882) CTA buttons to match column headers
- [x] Homepage comparison: scrollable table body for mobile fit (max-height 50vh)

## Feedback Round 13 (2026-04-02) — Drew's text 2026-04-02

- [x] Flagship page: move studio tour video above the about paragraph
- [x] Flagship page: move event video above the event paragraph
- [x] Taylor's Mill page: move studio tour video above the about paragraph
- [x] Both pages: changed from side-by-side grid to stacked layout (video on top, text below)

## Feedback Round 14 (2026-04-02) — Drew's text 2026-04-02

- [x] Both pages: video + text stretch wider on desktop (removed max-w-3xl constraint at lg breakpoint)
- [x] Flagship: What's Included shows 4 features on mobile, 9 on desktop, "See More Key Features" button reveals rest
- [x] Flagship: Events section restructured — title above video, paragraphs below, "See More Photos" link under text
- [x] Taylor's Mill: What's Included left as-is per Drew's instructions

## Feedback Round 15 (2026-04-02) — Drew's text 2026-04-02

- [x] Homepage comparison table: full-length on desktop (no scroll, all rows visible)
- [x] Homepage comparison table: mobile gets a single arrow toggle button (▼/▲) instead of scrollbar to navigate the table

## Feedback Round 16 (2026-04-02) — Drew's PDF + text 2026-04-02

- [x] Replace all existing FAQs with 25 new FAQs from Drew's PDF (word-for-word)
- [x] Keep collapsible accordion style
- [x] Add FAQ link to navigation menu bar on all pages (desktop + mobile)
- [x] Link "secret videos page" in FAQ answer #2 to `/theresavideoforthat`

## Feedback Round 17 (2026-04-03) — Drew's text 2026-04-03

- [x] Make "Book This Location" hero buttons more prominent: larger padding, bold text, renamed to "Book Flagship Location" and "Book Taylor's Mill Location"
- [x] Make secondary "Book This Location" links into pill-style buttons on both location pages (about, features sections)
- [x] Make "View Full Gallery" into a pill-style button on both location pages
- [x] Add "See More" expand pill to "Host Your Event" card on Powdersville page (text was cut off on mobile)
- [x] Change Taylor's Mill page title from "Taylor's Mill" to "Taylor's Mill Location"
- [x] Update Taylor's Mill hamburger/nav text to "Taylor's Mill Location" on all pages

## Feedback Round 18 (2026-04-03) — Drew's text 2026-04-03

- [x] Change cleaning fee for 35+ event attendees from $0 (potential/follow-up) to $150 auto-applied
- [x] Update all messaging: fee is now automatic, team may reach out to *waive* it (inverse of before)
- [x] Updated: event step capacity notice, details step warning card, schedule step warning card, acknowledgement checkbox, high-traffic description text, terms page
- [x] Updated Flagship location page "Host Your Event" section: replaced old paragraph with new cleaning fee language matching booking flow

## Feedback Round 19 — Post-delivery revisions (2026-05-05)

Source: `client/comms/2026-05-05-drew-text-post-delivery-revisions.md`
Plan:   `client/comms/2026-05-05-drew-revisions-plan.md`

### Item 7 — Audit physical-waiver language
- [x] Grep entire codebase for "physical sign," "in person," "at the studio," "upon arrival," "paper waiver," "hard copy" — **no occurrences found**. The waiver explicitly states (section 10) that the electronic signature has full legal force.

### Item 6 — Verify Oct 10 booking
- [x] Pulled appointment 1697834248 (Angela Anderson, 50 ppl, Wedding Shower) from Acuity. Cleaning fee **was applied** ($150 in price, in notes). Buffer block **was created** (block 9857142274, 5:30 PM → 8:00 PM). System worked as designed.

### Items 2 + 3 — Full notification email rewrite
- [x] New `api/_lib/waiver-text.js` — server-side waiver text matching client-side renderWaiver()
- [x] Rewrote `api/notify-owner.js` — every booking gets a confirmation email (was 35+ only). Includes: contact, intake, event details, add-ons with specifics (backdrop colors, wall numbers, chair tier, table count), pricing breakdown, signatures, full waiver text. 35+ bookings get "[White Wall] HIGH TRAFFIC" subject prefix.
- [x] Customer also receives the same email with a different intro/subject ("Your WhiteWall Studios booking is confirmed").
- [x] Removed `>= 35` gate in `api/booking-callback.js` — emails fire for every booking.
- [x] `api/create-checkout.js` and `scripts/booking-flow.js` now pass `emailAcknowledgment` and `termsSignature` through (they were dropped before).

### Item 1 — April cleaner notification
- [x] New `api/_lib/notify-cleaner.js` — sends April an email when a Powdersville booking triggers the 35+/50+ cleaning fee. Email includes session-end time, the 2.5hr cleaning window, studio address, and an `.ics` attachment with a 30-min reminder so she can add it to her calendar in one tap. Email asks her to reply to confirm.
- [x] Wired into `api/booking-callback.js` — fires after the owner/customer email, isolated try/catch so a cleaner-email failure doesn't break the booking.
- [x] `CLEANER_EMAIL` env var documented in CLAUDE.md — Andrew sets `cleanspacesco.gvl@gmail.com` in Vercel for production.
- [x] Drew confirmed (2026-05-05) that April covers Taylor's Mill too. Removed the PV-only gate from `notify-cleaner.js`, the buffer-block creation in `booking-callback.js`, and the buffer-conflict pre-check in `create-checkout.js`. All three now use `CALENDAR_IDS[bookingState.location]` and fire for whichever location triggers the cleaning fee.

### Item 4 — Videos on theresavideoforthat
- [x] Drew sent 4 video URLs (was originally 3 — added Events Info as a bonus). Added to `theresavideoforthat.html` videos array next to the existing rental info videos:
  - `aNTLiqzGxp4` — Chair Rental Info
  - `EmN3ppbh-lk` — Lighting Rental Video
  - `K810lp2kEYc` — All Storage Building Info
  - `BsyruYsoA-I` — WhiteWall Events Info

### Item 5 — SMS to Drew via Watson + Blue Bubbles
- [x] New `api/_lib/notify-sms.js` — POSTs to Blue Bubbles on Watson via Cloudflare Tunnel + Cloudflare Access service token. Triggers when 35+ event OR ≥3hr shoot. Sends a tight SMS-style summary (trigger reason, name, location, time, total, Acuity ID). Architecture: Vercel → CF Edge (validates CF Access service token) → CF Tunnel → Watson `localhost:1234` → Blue Bubbles → iMessage to Drew.
- [x] Wired into `api/booking-callback.js` — fires after cleaner notification, isolated try/catch. No-ops gracefully if env vars missing.
- [x] Env vars documented in CLAUDE.md: `WATSON_SMS_URL`, `WATSON_CF_ACCESS_CLIENT_ID`, `WATSON_CF_ACCESS_CLIENT_SECRET`, `BLUEBUBBLES_PASSWORD`, `OWNER_PHONE`.
- [ ] Awaiting Cloudflare Tunnel + Access setup on Watson (Andrew + Drew). Once values are in Vercel env, SMS goes live.
- [x] "3+ hour shoot" deliberately kept broad — fires for ANY 3+ hour booking incl. events (over-notify rather than under-notify; decision 2026-06-12, no need to bother Drew). Also flagged events in the SMS reason line whenever `eventIntent === "yes"` so long sub-35 events read as events, not just "3hr shoot" (`notify-sms.js`). Closes #6.

## Feedback Round 20 (2026-05-18) — Drew's email 2026-05-11

Source: `client/comms/2026-05-11-drew-email-card-on-file-and-tc-waiver-updates.md`. Plan: `client/comms/2026-05-11-drew-card-on-file-and-policy-update-plan.md`. Tech build: `client/comms/2026-05-11-drew-card-on-file-technical-build.md`.

### PR 1 — T&C + liability waiver copy swap (this PR)
- [x] `book-powdersville.html` — replaced 14-point T&C with Drew's new 19-point version. "Flagship Location" heading kept.
- [x] `book-taylors-mill.html` — same 19-point T&C, "Taylor's Mill" heading + "no events/parties" line kept (Drew's option b, answer #2).
- [x] `scripts/booking-flow.js` `renderWaiver()` — replaced 10-section waiver with Drew's new 12-section version. `fullName` / location-bracket / TM carve-out interpolations preserved.
- [x] `api/_lib/waiver-text.js` — server-side email copy updated to the same 12 sections. Function signature + Signed trailer preserved.
- [x] Fees per Drew's answer #3: early entry / late exit stays **$130 per 15-min** (T&C §3, Waiver §5); "trashed the place" cleaning/reset fee bumped **$130 → $200 minimum** (T&C §6, Waiver §6). $150 event cleaning-fee line item unchanged.
- [x] Verified: both JS files pass `node --check`; waiver renders end-to-end; no stale `$250`/old wording; T&C lists run 1→19.

### PR 2 — Card-on-file (built, pending sandbox test + cutover)
- [x] New `api/booking-public-config.js` — serves public Square App/Location ID + env-correct SDK URL to the browser.
- [x] `api/_lib/square.js` — added `findOrCreateCustomer`, `createPayment`, `createCardOnFile`, `chargeCardOnFile` (MIT helper for future post-session damage charges).
- [x] Rebuilt `api/create-checkout.js` — replaced Payment Link + redirect with inline flow: buffer-conflict check (preserved) → server pricing → findOrCreateCustomer → createPayment → createCardOnFile → Acuity appointment + capacity notes + cleaning buffer block + owner/cleaner/SMS/PostHog notifications. Auto-refund if anything fails after the charge. Consent proof (IDs, IP, UA, signed names, SHA-256 of waiver text) written to Acuity notes.
- [x] Stable client-generated idempotency key — survives tokenize retries, Square dedupes, no double-charge.
- [x] Frontend: SDK loader via `/api/booking-public-config`; card iframe in a stable `[data-payment-section]` (not re-rendered); required card-on-file consent checkbox; `tokenize({ intent: 'CHARGE_AND_STORE' })` in `handlePayAndBook`; new `{success, redirect}` response handling. Card attaches only when step 5 panel is visible (offsetParent guard — display:none breaks the iframe).
- [x] `styles/booking.css` — card container + consent row styles.
- [x] `api/booking-callback.js` — retired to a deprecated 302 stub (no traffic expected; alert if hit; delete next release).
- [x] `vercel.json` — `create-checkout` `maxDuration` bumped to 30s (≈5 sequential Square+Acuity calls).
- [x] All touched JS passes `node --check`; vercel.json valid; HTML markers present both pages.
- [ ] **Blocked on (Andrew):** set `SQUARE_APPLICATION_ID` + `SQUARE_SANDBOX_APPLICATION_ID` in Vercel (public, from Square Developer Dashboard → app → Credentials).
- [ ] Sandbox end-to-end test (needs the App ID env + a deployed env) — happy path, declined, tokenize fail, createCard fail, slot conflict, MIT charge, 3DS, mobile Safari.
- [ ] Preview-URL real-card test with Drew (also confirms whether Square's $0 CreateCard verification shows as a pending charge on the statement).
- [ ] Take down the direct Acuity scheduler URL so all bookings funnel through the site (Drew's answer #6, option B) — Andrew/Drew.
- [ ] Apple/Google Pay deferred (Drew's answer #8). Existing customers re-enter card on next booking, no migration (answer #7).

## Feedback Round 21 (2026-06-12) — Drew's text 2026-06-10

- [x] Cleaning fee → flat $150 applied automatically at 35+ participants. Collapsed the old `>=50` vs `>=35 && event` split into a single `>=35 → $150` rule, client (`scripts/booking-flow.js` `getCleaningFee()`) and server (`api/create-checkout.js` recompute, now authoritative — recomputes from participant count rather than trusting the client-sent fee).
- [x] Removed all client-facing "reach out to waive" / "may follow up regarding a potential $150 cleaning fee" copy (capacity notices, acknowledgement checkbox, high-traffic prompt, event textarea prompt). Fee is now automatic and non-waivable in the UI.
- [x] Removed "2.5-hour cleaning buffer" language from the owner email (`api/notify-owner.js`); collapsed its 50+/35+ participant split to "35+". (Buffer block machinery in `create-checkout.js` is unchanged — operational, not client copy.)
- [x] Acuity appointment notes (`api/_lib/acuity.js` `buildAppointmentNotes`): dropped the dead "pending review (35-49 event participants)" branch; single "auto-applied, 35+ participants" line. Updated the `cleaning-fee` add-on ID comment.
- [x] All touched JS passes `node --check`. Traced a 35+ booking: exactly one $150 cleaning-fee line item client-side and server-side, no double-count; below 35 yields no fee.

## Research — Square coupon feasibility (#29, 2026-06-12)

- [x] Researched Square API coupon/discount capability (doc only, no app code). Findings + recommendation in `client/docs/square-coupon-feasibility.md`. Square has no native coupon-code system (no codes, no per-customer/one-time limits, no booking-date scope, no %-OR-free-add-on dual mode); only ad-hoc discounts + auto-applied catalog pricing rules. Recommendation: server-side coupon layer in `api/create-checkout.js` applying a single ad-hoc Square discount. Unblocks #13 (C1), #14 (C2), #20 (revenue-recovery).

## Feedback Round 22 (2026-06-12) — Wishlist issue #17

- [x] Added a required "How did you hear about us?" select to Step 3 (Details) on `book-powdersville.html` and `book-taylors-mill.html`. Options (in order): Google Search, Instagram, Facebook, Friend / Referral, Drove by, Other. Placed after the Instagram field, before the read-email checkbox. Mirrors existing intake-field markup/classes.
- [x] `scripts/booking-flow.js` — added `intake.leadSource` to state; added a `change` handler (`[data-input='intake-lead-source']`) that updates state + calls `updateTermsGate()` (no full re-render); made it REQUIRED in `isStepComplete(3)` baseComplete and added a `getValidationErrors()` message.
- [x] Threading: `intake.leadSource` rides through `bookingState.intake` in `api/create-checkout.js`. `api/_lib/acuity.js` `buildAppointmentNotes()` adds a "Heard about us: X" line. `api/notify-owner.js` `buildEmailBody()` shows "Heard about us:" in the owner/customer email intake block.
- [x] Verified: all touched JS passes `node --check`; both HTML pages contain the field with all 6 options.

## Summary

### Item 6b — Verify Nov 14 booking (Molly Hensley)
- [x] Pulled appointment 1696694829. Drew's worry was correct this time — cleaning fee was NOT applied. Total $1,030 (should have been $1,180). No buffer block created either.
- [x] Root cause: customer typed `"35 +"` (string with space + plus) in the participants field. Client-side `Number("35 +") = NaN`, so the >=35 / >=50 threshold checks silently failed. This same bug also missed the high-traffic warning UI for the customer.
- [x] Fix: introduced `parseCount(v)` helper that extracts the first integer from arbitrary input; replaced all `Number(state.participants)` / `Number(state.intake.participants)` call sites with `parseCount`. Tested across edge cases ("35 +", "35+", "~35", "35-50", etc.).
- [x] Tightened the input field: added `type="number"` + `inputmode="numeric"` + `min="1"` to discourage non-numeric input on new bookings.
- [x] Server-side belt-and-suspenders: `api/create-checkout.js` now recomputes the cleaning fee server-side and applies it if the client missed. Logs a warning when this fires so we can see if the client is dropping fees.
- [x] Logged escalation in `client/escalations.md`: Molly's booking was underbilled $150. Drew decides remediation.

**Done: 190 items** (all original revisions + Round 19 + Item 6b + Round 20 PR 1 + PR 2 build)
**Remaining: Round 20 PR 2 cutover** — code complete + syntax-clean. Blocked on Square App ID env vars (Andrew), sandbox test, preview real-card test with Drew, and Acuity URL takedown.

### 2026-06-12 — PostHog server-side env gap documented (worker/posthog-env-gap)
- [x] Verified `api/_lib/posthog.js` silently no-ops when `POSTHOG_API_KEY` is unset (returns `null` from `getClient()`). Added Pending escalation entry to `client/escalations.md` noting symptom, env var needed, fix, and F2/#19 dependency.

## SEO Improvements (2026-06-12) — issue #18

- [x] Added homepage `<h1>` (visually-hidden `sr-only`) — index.html had none.
- [x] Added JSON-LD structured data: Organization + two `PhotographyBusiness` departments (Powdersville first) on index.html; single-location `PhotographyBusiness` on powdersville.html and taylors-mill.html. Real NAP, America/New_York.
- [x] Added `<link rel="canonical">` to index, powdersville, taylors-mill, gallery, book-powdersville, book-taylors-mill.
- [x] Trimmed over-length meta descriptions to <155 chars (index 165→141, powdersville 172→147, taylors-mill 173→151).
- [x] Added geo keywords to `<title>` on powdersville, taylors-mill, gallery, book-powdersville, book-taylors-mill.
- [x] Added `<lastmod>2026-06-12</lastmod>` to all 12 sitemap.xml URLs.
- Plan: `client/docs/2026-06-12-seo-plan.md`. Deferred (Tier 2/3): OG image domain consistency, alt-text audit, Google Business Profile (Drew action).

## Feedback Round 23 (2026-06-13) — Promo-code MVP (#20, Phase 1)

Builds on the coupon feasibility research (#29). Phase 1 MVP only: a customer can enter a promo code at Step 5 and get a **percentage discount on the raw session line item only** (never add-ons or cleaning fees). Server is authoritative — the client sends a code, never a discount amount.

- [x] `api/_lib/coupons.js` (new) — `validateCoupon(code, { location, nowISO })` + `sessionDiscountCents()`. Coupon defs come from the `COUPONS` env var (JSON array of `{ code, percentOff, location, validFrom, validUntil }`). Normalizes code (trim+uppercase); checks existence, location scope (`any`/`powdersville`/`taylors-mill`), and validity window in America/New_York. Safe-by-default: unset/empty/malformed `COUPONS` ⇒ no code validates.
- [x] `api/validate-coupon.js` (new) — POST `{ code, location, appointmentTypeID }`, read-only preview: returns validation result + preview `discountCents` off `SESSION_PRICES`. No side effects. Mirrors `verify-availability.js` style (invalid code = 200 `{ valid:false, reason }`).
- [x] `api/create-checkout.js` — re-validates any client-sent `couponCode` server-side and re-computes the discount off the session line item; subtracts from the authoritative `totalCents`. Isolated + fail-open (any coupon error ⇒ full price, normal booking unaffected). Records applied code in Acuity notes + PostHog event.
- [x] `api/_lib/square.js` `createPaymentLink` — added optional `discount` param (`{ name, percentage }`): adds `order.discounts` (scope LINE_ITEM) + `applied_discounts` on the catalog/session line items only. No param ⇒ byte-identical to prior behavior. (Kept for the Payment Link path; the live card-on-file path enforces via `totalCents`.)
- [x] `scripts/booking-flow.js` — Step 5 order summary now has a "Promo code" input + Apply button; on Apply POSTs `/api/validate-coupon`, stores `state.coupon`, renders a discount line + updated total; inline error on failure; Remove clears it. Enter key applies. Code input handler does targeted DOM updates only (no full re-render — preserves focus/Square iframe). Passes `couponCode` to create-checkout.
- [x] Verified: `node --check` on all touched JS; unit-traced 25% on $980 Full Day ⇒ $245 off session, add-on ($50) unaffected, total $785 (78500¢); invalid/expired/future/wrong-location/bad-percent all reject; forged client discount ignored (server recomputes); `createPaymentLink` JSON correct with/without discount; **no `COUPONS` set ⇒ flow behaves exactly as today (dark-launch).**
- [x] **Campaign-gated UI** (Andrew 2026-06-13): the promo field only renders when a campaign is live. `api/_lib/coupons.js` `hasActiveCoupon(location)` + a `promoActive` flag on `api/booking-public-config.js` (per `?location=`); `scripts/booking-flow.js` fetches it on load and `renderCouponRow()` returns empty unless `promoActive` (or a code is already applied). No dead "invalid code" box between campaigns.
- **Dark launch: `COUPONS` is intentionally left UNSET.** With no campaign active, `promoActive` is false ⇒ the promo field is hidden entirely and prod is visually unchanged. No real codes were created. UI + server are isolated so they can never break a normal no-coupon booking.

## Feedback Round 24 (2026-06-13) — Coupons from dashboard API (#20, Phase 3)

Wires the booking site to read coupons from the WWS dashboard (`wws.entrpy.co`) instead of only the `COUPONS` env var, and to record redemptions. **Dark-launched:** a no-op until `WWS_DASHBOARD_URL` + both `WWS_DASHBOARD_CF_ACCESS_CLIENT_*` env vars are set — until then coupons read from `COUPONS` env EXACTLY as today, prod unchanged.

- [x] `api/_lib/coupons.js` — extracted the pure matching/validity logic into `validateCouponAgainst(code, coupons, opts)` (unchanged semantics, now takes the coupon array as a param). Added async `getActiveCoupons()`: fetches `GET ${WWS_DASHBOARD_URL}/api/coupons` with CF service-token headers, 3s AbortController timeout, 60s warm-instance cache; on ANY error/timeout/bad-shape OR when the dashboard env vars are unset, falls back to the existing `COUPONS` env parse (never throws). `validateCoupon` + `hasActiveCoupon` are now **async** wrappers over `getActiveCoupons()`.
- [x] `api/_lib/coupons.js` — added async `recordRedemption({ code, email, bookingId, discountCents })`: POSTs to `${WWS_DASHBOARD_URL}/api/coupons/redeem` with CF headers + 3s timeout, **fail-open** (swallows errors, no-ops when dashboard unconfigured). `sessionDiscountCents` unchanged.
- [x] `api/validate-coupon.js` — `await validateCoupon(...)` (handler already async).
- [x] `api/create-checkout.js` — `await validateCoupon(...)` in the coupon block; after a coupon-applied appointment is created, `await recordRedemption({ code, email, bookingId: appointment.id, discountCents })` inside an isolated try/catch (mirrors the other notify-* calls — never breaks a paid booking).
- [x] `api/booking-public-config.js` — handler made `async`; `promoActive = await hasActiveCoupon(location)`.
- [x] `CLAUDE.md` — documented the three new env vars (left unset) + a "Coupon Source: Dashboard API" section with the dashboard contract.
- [x] Verified: `node --check` on all four touched JS files. Throwaway node test proved — with dashboard env UNSET, `getActiveCoupons()` returns the parsed `COUPONS` env, `validateCoupon` === `validateCouponAgainst` for all sampled inputs (semantics unchanged), `hasActiveCoupon` async fallback works, and `recordRedemption` no-ops without throwing. Also verified dashboard configured-but-UNREACHABLE ⇒ `getActiveCoupons` falls back to env + `recordRedemption` fail-opens (no throw).
- **Dark launch:** the three `WWS_DASHBOARD_*` env vars are intentionally left UNSET. Prod behavior is byte-identical to Round 23 until they're configured.

## Feedback Round 25 (2026-06-13) — Phase 3 redux: Edge Config coupon source, decoupled from the mini (#20)

Re-architects the coupon source from a real-time pull off the self-hosted dashboard (the mini, `wws.entrpy.co`) to a **Vercel Edge Config** store. The dashboard now PUSHES the active coupon array into Edge Config (key `coupons`); the booking site READS it edge-cached and Vercel-native, so the checkout path never depends on home infra. **Dark-launched:** with no Edge Config store connected (or no `coupons` key), coupons fall back to the `COUPONS` env var EXACTLY as today — prod unchanged.

- [x] `api/_lib/coupons.js` — `getActiveCoupons()` rewritten to read key `coupons` via `@vercel/edge-config` (`const { get } = require("@vercel/edge-config")`). On an array, returns it; on ANY error, a null/undefined/non-array value, OR when `EDGE_CONFIG` is unset, falls back to the existing `loadCoupons()` env parse. Never throws. `validateCouponAgainst` (pure), `validateCoupon`/`hasActiveCoupon` (async), `sessionDiscountCents`, `loadCoupons` — unchanged semantics.
- [x] `api/_lib/coupons.js` — REMOVED the dashboard-pull code entirely: `WWS_DASHBOARD_URL` fetch, `dashboardConfigured`/`dashboardHeaders`/`dashboardBase` helpers, the CF-Access-Client header logic, the 60s dashboard cache, and the `recordRedemption()` function (no longer exported).
- [x] `package.json` — added `@vercel/edge-config` (`^1.4.0`) to dependencies.
- [x] `api/create-checkout.js` — removed the `recordRedemption` import and the post-booking `recordRedemption(...)` call. The `notes += "Promo code: ..."` line is KEPT — it's now the redemption signal the dashboard reads from its Acuity ingest. `await validateCoupon(...)` unchanged.
- [x] `api/validate-coupon.js`, `api/booking-public-config.js` — unchanged (already await the async helpers).
- [x] `CLAUDE.md` — removed the three `WWS_DASHBOARD_*` env rows; added an `EDGE_CONFIG` row + a "Coupon Source: Vercel Edge Config" section with the Edge Config contract.
- [x] Verified: `npm install` resolves `@vercel/edge-config`; `node --check` passes on all touched JS. Throwaway node test proved — with `EDGE_CONFIG` UNSET, `getActiveCoupons()` returns the parsed `COUPONS` env, `validateCoupon` === `validateCouponAgainst` across sampled inputs (semantics unchanged), `hasActiveCoupon` fallback works, no-source state rejects all codes without throwing, and `recordRedemption` is no longer exported. Also verified `EDGE_CONFIG` set-but-unreachable ⇒ `get()` throws ⇒ `getActiveCoupons` falls back to env without throwing.
- **Dark launch:** no Edge Config store is connected yet (`EDGE_CONFIG` unset). Prod behavior is byte-identical to Round 24's fallback path until a store is connected and the dashboard populates the `coupons` key.

## Feedback Round 26 (2026-06-15) — Coupon $0-charge safety fix (overnight review, #20)

Overnight review found that a 100%-off coupon on an add-on-free (session-only) booking would drive the charged total to $0, which Square rejects → the booking fails. Two-layer fix.

- [x] `api/_lib/coupons.js` — capped `percentOff` at **99** (was 1–100) in `validateCouponAgainst` and the `hasActiveCoupon` gate, so a 100% code never validates. Header doc updated to `1..99`. (Dashboard create-time cap lands in a parallel PR.)
- [x] `api/create-checkout.js` — added a defensive floor after the coupon discount is subtracted from `totalCents`: if the discount would zero/negative the total, clamp the discount so `totalCents >= 1`. Belt-and-suspenders so no future/misconfigured coupon can post a $0 charge. Isolated + fail-open — no change to normal (no-coupon) bookings.
- [x] Verified: `node --check` on both files. Throwaway node test — 100% code now invalid, 99% valid, 50% valid (unchanged), 99%-off $130 session-only keeps total at 130¢, floor holds total ≥ 1¢ even given a hypothetical 100% discount, no-coupon path unchanged. With `COUPONS`/`EDGE_CONFIG` unset (prod state) nothing changes.

## Feedback Round 27 (2026-06-22) — Drew's email V3, ship-now slice (items 3 + 5)

V3 is a 7-item doc; only items 3 and 5 ship inside the current single-session flow. The rest (multi-day cart, deposits/auto-charge, forced accounts) are a coordinated rebuild blocked on an Andrew architecture decision. Source logged verbatim at `client/comms/2026-06-22-drew-email-v3-answers.md`. Plan: pip task T018.

**Item 3 — 8-hour Flagship/Powdersville session, $750, earliest 12:30pm**
- [x] `scripts/booking-config.js` — new `pv-8` duration (8h, $750, `supportsEvents:true`, `earliestStartMinutes:750`) after `pv-6`; `"pv-8"` Acuity mapping → type `94823049`. Taylor's Mill untouched (spec: no 8h at TM). Event-eligible automatically (hours≥2).
- [x] `api/_lib/acuity.js` — mirrored `94823049` into `VALID_APPOINTMENT_TYPE_IDS`, `TYPE_TO_CALENDAR` (6255578, Powdersville), `TYPE_TO_DURATION` (480), `SESSION_PRICES` (75000¢), `SQUARE_CATALOG_SANDBOX` (sandbox variation `KUWJ3TEUOQWIZTG46Q4TBX7D`).
- [x] 12:30pm earliest-start enforced in **code**, not Acuity (Acuity has no per-type earliest-time field — why Drew couldn't set it). One shared constant `TYPE_EARLIEST_START_MINUTES` + `easternMinutesFromISO`/`isStartBeforeEarliest`; applied as a filter in `api/availability-times.js` + client `fetchAvailableTimes`, and a hard 400 reject in `api/verify-availability.js` + `api/create-checkout.js`. America/New_York, DST-safe.
- Acuity type `94823049` was created by Drew; verified via API (8h / $750 / Powdersville+staging calendars / active).
- [ ] **Deferred:** 5am day-after-a-full-day exception — needs item 2's cart linkage; not in this slice (as planned).
- [ ] **Follow-up (needs prod Square creds, Andrew/Vercel):** create the production catalog item for the 8h session and add its variation id to the `SQUARE_CATALOG_SESSIONS` prod env. Non-blocking for charging (line item priced from `SESSION_PRICES`); only enables category-scoped coupons to target the 8h session.

**Item 5 / 5a — Studio Setup Crew add-on, $750, events-only**
- [x] `scripts/booking-config.js` — new `setup-crew` toggle add-on on Powdersville (`eventsOnly:true`, `requiresPlacements:true`, $750), with Drew's full descriptive copy and 8 `placementItems`. Per Drew's reply the free-text box was replaced with **structured placement dropdowns** (one per item, options per his list) and the **video was dropped** ("not quite yet"). Not added to Taylor's Mill.
- [x] `api/_lib/acuity.js` — `setup-crew` in `ADDON_PRICES` (75000¢) and `ACUITY_ADDON_IDS` (`7088190`); Square line item + Acuity add-on id push; placement choices written into appointment notes (where Drew reads them); `SETUP_CREW_PLACEMENT_ITEMS` source of truth.
- [x] `scripts/booking-flow.js` — events-only add-ons render only when `eventIntent === "yes"` and are deselected when intent flips off; placement `<select>`s (forced "Select..." default) under the toggle; `set-placement` handler; `placements:{}` init; placement completeness validation in the pay gate (`getValidationErrors`); multi-paragraph description rendering.
- [x] `api/create-checkout.js` — server guards: reject `setup-crew` on a non-event booking, and reject if any placement is missing/invalid (mirrors the card-on-file 400 pattern; client is never trusted).
- Acuity add-on `7088190` created by Drew; verified via API ($750).
- [ ] **Excluded from item 4** per-day add-on discount (Drew: crew is once-per-event, flat). Item 4 isn't built yet, so this is automatically satisfied.
- [x] Verified: `node --check` on all 6 touched JS files; price parity exact (client 750 ↔ server 75000¢ for both the 8h session and the crew; 8h event + crew = 150000¢ server-side); 12:00 ET rejected, 12:30/13:00 allowed, other types unaffected; calendarID passed (no staging misroute).
## Feedback Round 28 (2026-06-25) — Drew's email 2026-06-24: cleaning-fee policy language (universal)

First **Foreman** cycle. Source: `client/comms/2026-06-24-drew-email-cleaning-fee-language.md`. Copy-only — the 35+ cleaning-fee LOGIC is unchanged (Drew confirmed it already works). Make the policy language synonymous site-wide: events with 35 or more attendees have a mandatory $150 cleaning fee automatically added, with no team approval and no gray area. PR #66 (`worker/cleaning-fee-language`) **MERGED + LIVE 2026-06-25** (squash `dac71fb`, Vercel auto-deploy). Confirmation reply sent to Drew on thread `19ed2607` (msg `19eff5e2`).

- [x] `scripts/booking-config.js` — Flagship `policies` "Good to know" line: "Events with 35+ attendees require confirmation from our team." → "Events with 35 or more attendees have a mandatory $150 cleaning fee automatically added to the booking." (renders in the booking pages' Good-to-know panel — the exact string Drew quoted).
- [x] `powdersville.html` — events copy: dropped the gray-area "We will be in touch if your booking will not require a cleaning fee and refund you accordingly"; now "For events with 35 or more guests, a mandatory $150 cleaning fee is automatically added to your booking."
- [x] `terms.html` — dropped "Our team may waive this fee based on your booking details"; now "A mandatory cleaning fee of $150 is automatically added for events with 35 or more attendees."
- [x] Verified: grep confirms no remaining approval/gray-area language tied to the cleaning fee; the already-flat 35+ copy in `booking-flow.js` was left as-is (no discretion).
- [x] **Flagged to Drew (separate policy):** the 50+ **event-approval** copy in `terms.html` + `faq.html` was left intact and queried. **Drew answered 2026-06-25** → resolved in **Round 29** (auto-approve by default, reserve-the-right-to-contact).
- [x] **Asked Drew 2026-06-25:** whether to add the 35+ cleaning-fee line to `faq.html`. **Drew said yes** → added in **Round 29**.

## Feedback Round 29 (2026-06-25) — Drew's email 2026-06-25: 50+ auto-approval + FAQ additions

Foreman cycle #2. Source: `client/comms/2026-06-25-drew-email-50plus-approval-faq-accounts.md`. Copy/FAQ only, no booking logic change. PR #67 (`worker/50plus-and-faq`) **MERGED + LIVE 2026-06-25** (squash `5c511fd`, Vercel verified on prod). Confirmation reply to Drew pending Andrew's accounts input (see below).

- [x] **50+ events auto-approved by default.** Drew: nothing in the booking process may be contingent on internal team approval or review; 50+ events are allowed by default, WhiteWall only reserves the right to contact for additional details.
  - [x] `terms.html` — rewrote the Events 50+ clause (dropped "require prior approval" + "if not approved you will receive a full refund").
  - [x] `faq.html` — aligned the capacity/approval answer to "automatically approved by default".
  - [x] `scripts/booking-flow.js` — event intake prompt no longer says "if any additional details or approvals are needed".
- [x] **FAQ: 35+ cleaning-fee Q&A** added (surfaces the flat mandatory $150 policy in the FAQ per Drew).
- [x] **FAQ: Studio Setup Crew Q&A** added — teaches the add-on (self-service ethos, affordable base pricing, optional $750 crew handles setup + full reset/cleanup, does not place final layout). Distilled from the `setup-crew` policy in `booking-config.js`.
- [x] Verified: `node --check scripts/booking-flow.js` passes; grep confirms zero remaining approval-contingency copy site-wide; live on prod (terms + FAQ).
- [x] **Architecture decided (Andrew 2026-06-25): use Supabase** for the V3 customer/booking/balance datastore (consistent with the dashboard). This unblocks V3 items 2/6/7 (accounts + editable profile + deposits/auto-charge + new checkout). The `v3-foundation` draft (PR #65) is built against this; foundation is now locked.
- [x] **Drew reply sent 2026-06-25** (msg `19eff8c0`): confirmed 50+ + FAQ live; on accounts said the foundation decision is locked, the build is ours to carry, and a short checklist of product-only decisions (deposit + auto-charge terms, reminder-campaign touches, editable profile fields) is coming next. Logged his checkout sequencing (add-ons after date/time/duration + session-type).
- [ ] **NEXT (open loop):** send Drew the focused product-decision checklist (deposit/auto-charge terms, 4-touch campaign copy/cadence, editable profile fields) — cross-check against his V3 round-2 answers (`~/pip/plans/T018-whitewall-v3.md`) first so nothing already answered is re-asked. Then kick off the V3 foundation build on Supabase (PR #65 line).

## Feedback Round 30 (2026-07-11) — Drew's email 2026-07-11: multi-day flow restructured to an Airbnb-style date RANGE

Foreman cycle. Source: `client/comms/2026-07-11-drew-email-multiday-builder-redesign.md` (Drew msgs `19f5259090432b36`, `19f52673a1b12c7c`: "Absolutely flawless scope. Let's do it. Let me know when there's an update to test."). Replaces the add-days-one-at-a-time builder with a single start to end date-range picker. **On `staging.whitewallstudios.co` (branch `worker/multiday-event-flow`, commits `f4d0778` + Good-to-know `+ ` clause), Playwright-verified end to end, awaiting Drew's test. NOT yet a prod PR** (prod PR only after the full staging booking dry-run).

- [x] `scripts/booking-flow.js` — Step 1 = Day-1 access-time picker (once); Step 2 = one calendar, pick start date then end date (span highlights via `.is-in-range`); event auto-builds (`buildEventRangeCart`: day1 access time, middles full $980, last full/10:30 PM); last-day **Early checkout** select shortens the final day; live breakdown + $150 cleaning note + Review your event → details → pay (reuses the cart-checkout path, no active draft). Add-ons picked in Step 4 mirror onto every event day (`syncRangeAddons`) so the per-day discount tapers. Old per-day `md-add-*` builder kept but unreachable for multi.
- [x] `styles/booking.css` — `.calendar-day.is-in-range` highlight for the picked span.
- [x] **Good to know clause** (`renderLocationPolicies`): on a multi-day event the "35 or more attendees" cleaning line is swapped for "Because this is a multi-day event, there is a mandatory $150 cleaning fee automatically added to the booking" (Drew: attendee count no longer relevant). Single-day/photo keep the attendee clause.
- [x] Verified on staging (Playwright): full flow gate → range → auto-build → review → Step 3, zero console errors; pricing exact (3-day = 350 + 980 + 980 + 150 = **$2,460**; early-checkout last day pv-8 → **$2,230**); Good-to-know clause flips on Multi-day and reverts otherwise.
- [ ] **Staging note (not a code bug):** `pv-full`/`pv-8` have 0 availability on the staging calendar `14110701` (prod 27/30), so the 5am full-day Day-1 option shows an empty calendar on staging only. Test with an evening access time.
- [ ] **NEXT:** the real staging BOOKING DRY-RUN (sandbox card → confirm N Acuity appts + one charge incl the $150 fee); then the prod PR + confirm to Drew.
- [ ] **Back pocket (Drew `19f52673a1b12c7c`):** payment default = full, with a toggle to pay 60% up front non refundable + the 40% auto-charging 2 days before the event start. Ship the copy + toggle; the 40% auto-charge ties into the item-6 deposit engine (Andrew-gated arming) — FYI Andrew when wiring.

### Round 30 addendum (2026-07-11) — pay reachability + staging booking dry-run

- [x] **Fixed 4 pay-blocking bugs** the range flow exposed (a multi-day event has no single active slot, so `selectedTime` is empty): (1) `renderCheckoutPanel` dead-ended at "Select a date in Step 2" — now allows `_cartReviewing && cartIsActive()`; (2) `range-review` sets `_cartReviewing=true`; (3) new `hasBookableSlot()` used in `isStepComplete(2)`, `getValidationErrors`, and the pay-time bounce so a range event isn't kicked back to Step 2; (4) the Step-5 cart total + Pay button + 60/40 deposit now include the $150 cleaning fee (mirrors the server; was showing $1,330 vs the $1,480 Square would charge). Commits `f8f40d4`, `9c0ffcf`, `5c448fc`.
- [x] **Staging booking DRY-RUN PASSED** (Playwright): a 2-day event booked end to end → `/booking-confirmation` → **2 Acuity appts on staging calendar `14110701`** (`1736056866` Fri 6pm "Four Hours + Cleaning Fee" + `1736056870` Sat 5am "Full Day", ET offset -0400, `[STAGING]` name), total **$1,480** incl the $150 fee. `create-checkout` received the correct 2 sessions (types 89114517 + 89114581). Test appts canceled after; staging calendar clean.
- [ ] **NEXT:** prod PR after Drew signs off on the flow; then the back-pocket 60/40 payment toggle (copy + toggle; the 40% auto-charge is the Andrew-gated item-6 deposit engine).

## Feedback Round 31 (2026-07-11) — Drew's email 2026-07-11 15:17 (msg 19f529d48026d3f8): range-flow polish

Foreman cycle. Drew tested the range flow ("I freaking love it... absolutely flawless") and asked for three tweaks. All fast-path, Drew-directed, on `staging.whitewallstudios.co` (branch `worker/multiday-event-flow`), Playwright-verified, **confirmed to Drew** (msg `19f52ab4479e4d29`).

- [x] **Last-day summary verbiage** — dropped "access from 5:00 AM"; the last-day bullet now reads "Last day (X) — access all day, leave by Y with studio fully reset." (`renderRangeControls`).
- [x] **Add-on display order** — chairs, tables, 86in TV, PA system, rolling walls, backdrops, lighting, then Event Setup and Reset Crew last (`renderAddons` sort by `ADDON_ORDER`; display-only, logic keys off id).
- [x] **Event Setup and Reset Crew = featured full-width card** — bigger photo + horizontal layout on wide screens (709px vs 347px normal card), title spans the width, bold-italic tagline "By no means necessary, but certainly makes your event more enjoyable." above the existing description (`tagline`/`featured` config flags; `renderAddonCard` + `.addon-card-featured`/`.addon-card-tagline` CSS).
- [x] Verified on staging (Playwright): last-day copy present + no "5:00 AM"; add-on order exact; featured card + tagline render full-width; zero page errors.

### Round 31 addendum (2026-07-11) — featured crew card restructured to a large square (msg 19f52b2139b717e7)

- [x] Drew: the featured Event Setup and Reset Crew card should be **one large square** split on the HORIZONTAL axis (not photo-left/content-right). New `renderFeaturedAddonCard`: header (title, bold-italic subtitle, "Optional" + "$750" pills) → **full-width photo** → full-width description → a **large plain pill button** "Add the Setup/Reset Crew to your booking" (no photo inside). Extracted `renderPlacementRows` so the 8 placement dropdowns still appear once added. Staging Playwright-verified (vertical order head<photo<button, full-width photo+button, bold-italic tagline, toggle+placements work, no errors) + screenshot eyeballed. Confirmed to Drew (`19f52b7b847020cb`).

### Round 31 addendum 2 (2026-07-11) — crew placements, multi-day disclaimer, deposit copy (msgs 19f52bccee3d674d / 19f52be7ed1b3688 / 19f52c0b87f46793)

- [x] Setup crew placements: added "Storage Building" as an option for **Utility tables and extension cords** and for **Living room furniture** (booking-config.js).
- [x] Featured crew card layout confirmed **universal** for event bookings — shows on single-day AND multi-day events (same one-large-square), and never on photo/video (eventsOnly + featured). Playwright-verified on all three paths.
- [x] **35+ cleaning-fee disclaimer** (`updateParticipantNotices` capacity notice) suppressed on the MULTI-day path (fee is baked in regardless); kept on single-day. Gated on `state.eventMode !== "multi"`.
- [x] **Deposit balance copy** (both cart + single rows) → "(Balance $X will be auto-charged to the card on file 48 hours before session start)". ⚠️ Promises the item-6 40% auto-charge — **staging-only display**; the auto-charge machinery is the **Andrew-gated prod-merge prerequisite** (do not ship this copy to prod until item-6 is armed).
- [x] Verified on staging (Playwright, 3 paths, zero errors) + confirmed to Drew (msg `19f52c62c1ce8aa4`).

## Feedback Round 32 (2026-07-11) — Drew's email 2026-07-11 15:59 (msg 19f52c36d21a0bc3): public Add-Ons menu page

Foreman cycle. Drew: a standalone informational "Add-ons" page so anyone can see add-on prices without going through booking. On `staging.whitewallstudios.co/add-ons` (branch `worker/multiday-event-flow`), Playwright-verified, confirmed to Drew (`19f52d3bfa1e8525`).

- [x] New **`add-ons.html`** → served at `/add-ons`: full-width, display-only menu of every Powdersville add-on (photo, name, price, full description; chairs/walls/backdrops list each option with price) in the booking order chairs → setup-crew. Reads `window.WWS_BOOKING_CONFIG` so it stays in sync with the booking flow. No interactive controls / CTAs per Drew. "Book your session with us" pill at top + bottom → `/book-powdersville`.
- [x] Verified on staging (Playwright): HTTP 200, 8 cards in order with photos + prices + descriptions + option lists, 2 book pills → /book-powdersville, 0 interactive controls, no page errors; layout eyeballed via screenshot.

### Round 32 addendum (2026-07-11) — Add-Ons nav tab + Hair and Makeup Area rename (msgs 19f52d7bd7687434 / 19f52d96298f09af)

- [x] **Add-Ons nav tab** added to the top menu site-wide (index, powdersville, taylors-mill, gallery, faq desktop + mobile menus, and both booking pages) → `/add-ons`. Playwright-verified the link exists on home/powdersville/faq/gallery/booking and navigates to the page.
- [x] **Renamed** the two "Getting-Ready area" setup-crew placement items → "Hair and Makeup Area Rug" / "Hair and Makeup Area Furniture" (booking-config.js). Verified in the deployed config (no "Getting-Ready area" left).
- [x] Confirmed to Drew (msg `19f52e2948d24359`).

## Feedback Round 33 (2026-07-11) — Drew's email 2026-07-11 16:38 (msg 19f52e735e36cdc2): floor-plan assets

Foreman cycle (triage=question). Drew sent 4 to-scale floor-plan PDFs and asked how to leverage them. Response: built a page + nav tab; on `staging.whitewallstudios.co/floor-plans`, Playwright-verified, confirmed to Drew (`19f52eeeb39cb520`).

- [x] Converted the 4 PDFs → PNG (`pdftoppm` 150dpi) into `images/floor-plans/` (default-layout, empty-dimensions, event-seated, event-standing).
- [x] New **`floor-plans.html`** → `/floor-plans`: full-size, to-scale display of all 4 plans (The Full Space + dimensions, Default Studio Layout, Event Mockup Seated, Event Mockup Standing) each with a caption, "Book your session with us" pills top + bottom. Same menu style as the add-ons page.
- [x] **"Floor Plans" nav tab** added site-wide (index, powdersville, taylors-mill, gallery, faq desktop + mobile, both booking pages, add-ons page), after the Add-Ons tab.
- [x] Verified on staging (Playwright): HTTP 200, 4 cards with all images loaded (naturalW 1913), book pills → /book-powdersville, nav tab present on home/powdersville, no page errors.
- [ ] **Offered (awaiting Drew):** a contextual "See the floor plans" link inside the event booking flow near chairs/tables.

### Round 33 addendum (2026-07-11) — floor-plan 4th card retitled (msg 19f52f7fc9085ec4)

- [x] Drew: the 4th plan (A2.1) is a combined seated + max-standing layout, not just standing. Retitled "Event Mockup — Standing" → "Event Mockup — Standing and Seated" and rewrote the caption (seated + up to 112 standing with DJ booth, open room on the right wall for a food and beverage station). Image unchanged (his attachment was a phone screenshot pointing at the card, not a replacement). Verified on staging + confirmed to Drew (`19f5...` reply).

### Round 33 addendum 2 (2026-07-11) — 2 more floor plans (msg 19f5304eadd351d8)

- [x] Added Ceremony Seating (163 chairs facing altar, 6ft aisle) + Maximum Standing (281 guests, full space) to /floor-plans (converted PDFs → PNG). Now 6 plans. Playwright-verified all 6 render, no errors. Confirmed to Drew.

## Feedback Round 34 (2026-07-11) — Drew's email 2026-07-11 17:20 (msg 19f530d6fed9587b): per-add-on live line items

Foreman cycle. Drew: the live event summary should show EACH add-on as its own line with the per-day math adding up, not one lumped total. On staging, Playwright-verified, confirmed to Drew (`19f531d2d543d74a`).

- [x] `renderMultidaySummary` add-on section rebuilt: each selected add-on is its own line with per-day math (Day 1 full + Day 2/3 tapered) → subtotal, then an "Add-ons total", then the estimated total. E.g. 50 chairs on a 3-day event = "Day 1 $190.00 + Day 2 $161.50 + Day 3 $133.00" = $484.50. Added `currencyExact` (2-decimal) so half-dollar discounts display exactly.
- [x] **Overcharge fix (caught while building this):** `syncRangeAddons` was mirroring every add-on onto every day, so flat add-ons (Event Setup and Reset Crew $750, lighting) were charged once PER DAY (3-day event billed the crew 3×=$2,250). Now discount-eligible gear goes on every day (tapered) and flat add-ons go on day 1 ONLY (charged once). Corrects the summary, the Step-5 cart total, AND the server charge (all read the session add-ons). Verified: crew shows "$750.00 once for the event", total $3,694.50 for the 3-day + chairs + crew example.
- [ ] **Flagged to Drew:** lighting is currently counted once for the event (like the crew); asked whether it should instead bill per day.

- [x] **Round 34 re-verified end-to-end (staging booking dry-run WITH add-ons):** a 2-day event + 50 chairs + Setup Crew booked to `/booking-confirmation`; the two Acuity appts confirm the flat-once fix — day 1 (`1736105259`) carries chairs + Setup Crew (`7088190`) + cleaning fee (`6881547`), day 2 (`1736105260`) carries chairs ONLY. Square charge $2,581.50 (day-2 chair discount applied); Acuity stores full add-on prices, the $28.50 delta = the day-2 discount. Test appts canceled after. No regression.

- [x] **Pay-amount display consistency (follow-through on Round 34):** the sidebar summary showed exact cents but the Pay & Book button + cart/deposit totals still rounded to whole dollars (button read $2,582 vs the $2,581.50 charge). Added `fmtMoney` (whole → clean $350, fractional → $1,831.50) on the pay button, cart total, single-session total, and the 60/40 deposit + balance lines. Verified on staging: multi-day button "$1,831.50" exact; single photo session still "$350" (no .00).

## Feedback Round 35 (2026-07-11) — Drew's email 2026-07-11 18:24 (msg 19f53489dcca8270): backend verification

Drew: "verify everything works on the back end… setup crew window, cleaner time, auto-contact April, payment auto-charge… official thumbs up." Ran a read-only backend audit (see `client/comms/2026-07-11-backend-audit-multiday.md`). Gave Drew an HONEST itemized status (NO thumbs up) — msg `19f5352095101ca2`.

- **Root cause:** multi-day events route through `handleCartCheckout`; the single-session path's notifications + cleaning buffer were never ported to the cart path.
- [x] Appointment creation + scheduling: WORKS (verified via 2 dry-runs). 60% deposit collection + card-on-file: WORKS.
- [ ] **Owner + customer notifications** on a paid multi-day booking: NOT wired (books silently; customer gets only Acuity's N per-day emails). → BUILD (port to cart path).
- [ ] **Auto-contact April the cleaner** (.ics): NOT wired for cart path; notify-cleaner is single-session-shaped. → BUILD (key to event end).
- [ ] **Cleaning buffer block** after the event: NOT wired for cart path. → BUILD.
- [ ] **Setup/reset crew time window**: NOT built. → needs Drew's spec (asked).
- [ ] **40% auto-charge at T−48h**: card + charge-time saved but the charge engine is dark by design (enroll/pgcron/scheduler/autocharge all off) = item-6, **Andrew-gated**. Told Drew "finalizing."

### Round 35 build progress (2026-07-11)
- [x] **Gap #2 — cleaning buffer block (multi-day):** added a 2.5h `POST /blocks` after the event's last session end in `handleCartCheckout` (passes calendarID). Verified on staging: a 2-day event booking created a block 2026-07-13 11:00 PM → 07-14 1:30 AM tied to both appts. Test data cleaned up. Commit on branch.
- [ ] Gaps #3 (cleaner .ics to April) + #5 (owner email/SMS + customer SMS): need the single-session-shaped notifiers made multi-day-aware (event-level state, fire once, cleaner keyed to last day, add cleaningFee to cart sessionState). NEXT.
- [ ] Gap #1 (crew time window): awaiting Drew's spec. Gap #4 (40% auto-charge): Andrew-gated item-6.

### Round 35 → Drew's full backend spec (msg 19f535e0d7e0e8bb, 2026-07-11 18:48)
Drew replied to the audit with a detailed spec (customer recap, owner Watson SMS + a crew-only second SMS, April email 4h/1.5h-delay when crew added, 4h back-end buffer + 2h front-end crew block when crew added, and "just run" the 40% auto-charge). Full verbatim + itemized build plan: **`client/comms/2026-07-11-drew-backend-spec.md`**. Acknowledged to Drew (`19f536b8677858d0`); item-7 auto-charge kept honest ("finalizing" + Watson manual-reminder fallback; item-6 is Andrew's arming gate). Build in progress: gap #2 done; items 1-6 next.

- [x] **Drew's newest msg `19f53723a15d5325`** (2026-07-11 19:10, "Absolutely flawless across the board. Great work. Keep me updated.") = approval/fyi, logged (`client/comms/2026-07-11-drew-ack-backend-spec-flawless.md`), NO reply required, NO new request.
- [x] **Items 1-6 BUILT (commit `b020c39`, pushed, deployed to staging) — fresh Foreman 2026-07-11.** New `api/_lib/notify-multiday.js` fires event-level notifications ONCE per multi-day event: customer recap email; owner recap email (full detail + crew placements + Square ids); owner Watson SMS (dates range, total, name, event use, headcount, "Cleaners emailed ✓", appt count); a SECOND crew-only Watson SMS (each placement + recommended crew start day1−2h + back-end reset = last-session end); April cleaner email keyed to the LAST day end, crew-aware (4h window + arrive 1.5h after end + crew-reset copy when crew, else 2.5h at end) + .ics. `handleCartCheckout`: back-end buffer → 4h when crew (else 2.5h); NEW 2h front-end crew setup block before day-1 when crew; `notifyMultidayEvent(ctx)` wired once for event carts. All isolated/best-effort; every /blocks call passes calendarID. Reuses proven transports (sendOwnerSMS, buildIcs, Resend). Staging self-suppresses sends + sinks recipients (verifies wiring only → these send REAL comms on PROD).
- [x] **Verified (code-level):** node --check clean on both files; builder unit test proved exact content of all 5 messages + the item-7 fallback (3-day crew Oct 3–5 + no-crew, range fmt, cleaner timing); deployed staging serves 200 + a malformed `/api/create-checkout` POST returns clean **400 not 500** (proves the new require resolves in the deployed bundle).
- [x] **STAGING BOOKING DRY-RUN PASSED (2026-07-11)** — Playwright booked a real 2-day CREW multi-day event end to end (07-12 pv-4 6pm + 07-13 full day, Setup Crew + 8 placements, Square sandbox). `create-checkout` 200 → `/booking-confirmation` (appt `1736178980`, sessions=2). Acuity-verified on cal `14110701`: 2 appts (day1 $1,250 = $350 + crew $750 + cleaning $150; day2 $980; total $2,230 = charge), **back-end buffer block 4h** (07-13 23:00→07-14 03:00, "incl. setup crew reset"), **front-end crew block 2h** (07-12 16:00→18:00). No JS errors (only cosmetic Square font CSP). Notify path ran self-suppressed (wiring verified). Test appts + blocks cleaned up (cancel 200 / delete 204). Confirmed to Drew (`19f5468f037fb285`); nudge/promise loop closed (`client/comms/2026-07-11-drew-any-update-nudge.md`).
- [ ] **Item 7 (40% auto-charge) — ANDREW-GATED.** Fallback content built (`buildManualChargeReminderSms`: amount + Square customer/card ids + event); not wired to fire (needs deposit toggle + dark item-6 scheduler). Arming escalation becomes ripe only AFTER items 1-6 + a deposit dry-run pass staging. Do NOT auto-arm.

## Feedback Round 36 (2026-07-16) — Drew's email "WhiteWall Dashboard R&D" (new thread 19f6b708fb71898c, from contact@whitewallstudios.co)

DASHBOARD (wws-dashboard), not the booking site. **PR #87 (squash `458b00d`) merged + deployed + kickstarted + prod-verified on wws.entrpy.co.** All READ-ONLY lenses over existing data, no schema change. Comms `client/comms/2026-07-16-drew-dashboard-overview-rd.md`; build plan `client/comms/2026-07-16-dashboard-overview-build-plan.md`. Confirmed live to Drew (`19f6b8e36b736e28`).

- [x] Promote Andrew's non-slop glance (`app/overview`) to the official Overview at `/`; retire the slop page; `/overview` → redirect to `/`; drop the "(non slop version)" nav entry.
- [x] Page-wide scope toggle (Company / Powdersville / Taylors Mill) rescoping every number + chart. All 3 scopes precomputed server-side (`getGlancePage`); client island slices the bundle. `getGlance`/`getYoy`/`getMonthCalendar` thread a `location_id` filter (company unscoped incl. Unassigned; studios join payment→booking→location).
- [x] Year-over-year net-total line: monthly net across the year, 2026 solid through last completed month then dotted (current = forecast projection, rest = avg month), prior year muted-dashed; headline = this-year net so far + % vs prior year to date. New `components/glance/year-chart-card.tsx` + `computeYoy`.
- [x] This-week bars: horizontal dashed line at the week's per-day average (new `GlanceData.weekAvg`).
- [x] Full-width Apple-style month calendar (new `components/glance/month-calendar-card.tsx` + `getMonthCalendar`): studio-colored dot per booking under each day (PV green / TM blue canon), tap a day to unfold each booking (name, start time, studio, length, amount paid, photo/video vs event), tap to collapse.
- [x] Verified: `npm run build`; 103 unit tests (new `computeYoy` handoff/headline/January + `weekAvg`); live-DB render of all 3 scopes (calendar counts reconcile **21 PV + 15 TM = 36 company**), tapped day, 390px mobile (no overflow, no console errors).
- Money rule unchanged (net Square cash; calendar per-booking amount = net collected, booked value labeled when unpaid). Told Drew: (a) one-line swap to gross if he wants "charged"; (b) YoY prior reads n/a for Powdersville (2026 flagship, no attributable 2025 cash), full for Taylors Mill.

## Feedback Round 37 (2026-07-16) — Drew reply (msg 19f6b944d8b1bc71): full-width, perf-colored lines, per-person intake, dedicated Calendar page

DASHBOARD. **PR #88 (squash) merged + deployed + prod-verified.** Confirmed live to Drew (`19f6ba5414cfa72f`). Comms in `client/comms/2026-07-16-drew-dashboard-overview-rd.md` (Round 2 section).

- [x] Full-width Overview (dropped `max-w-6xl` on GlancePage).
- [x] Perf-colored chart lines (shared `perfColor()`): current-year line + projection GREEN when beating baseline / RED when behind; avg-month + prior-year lines stay gray; applied to month-vs-normal AND YoY; neutral when pct null.
- [x] Per-person booking intake dropdown in the calendar day expansion: Instagram (linked), business, phone, email, headcount, add-ons (`addonName()`), consent-stripped form notes. `stripConsentFromNotes()` parses OUT the card-on-file consent block (Square token ids, consent IP/UA) — pure + unit-tested (no token/IP leak). Concatenated `business_name` " | " dumps split into a readable list.
- [x] New `/calendar` full-page route + "Calendar" nav entry under Bookings (`getCalendarPage()` all-scopes, `large` cells).
- [x] Answered Drew's Q inline: calendar reads the dashboard Postgres, synced hourly from Acuity + Square by `co.entrpy.wws-poll` (read-only), <=~1h behind, snapshot pattern not live-API.
- [x] Verified: build; 105 tests (2 new consent-strip); live-DB render of all the above, no overflow at 1600/390, no console errors.
- FLAGGED to Drew (non-blocking): some clients' whole intake form is ingested into `client.business_name` as a " | " blob; shown as a readable "Booking form" list. Offered to break out specific fields if he wants.

## Feedback Round 38 (2026-07-16) — Drew reply (msg 19f6bb298d4fcd4b): bottom room, Instagram/Purpose, event payment status, every-minute poll, month/year calendar picker

DASHBOARD. **PR #89 merged + deployed + prod-verified.** Ack `19f6bb5eb9cc7c00`; confirmed live `19f6bc35f94e75ac`.

- [x] Bottom breathing-room spacer on Overview + Calendar pages.
- [x] Instagram always shown in the person dropdown (NA when blank); new **Purpose** row = event/session description (`parsePurpose()`, NA if none).
- [x] Event **payment status** (`computePaymentStatus()` from Square cash vs list value; fee-aware): Paid in full / Deposit paid + ~balance due / Partially paid / Unpaid — chip on the booking row AND in the detail (reflected at calendar level). Deposit state dormant until item-6 armed.
- [x] Poll cadence hourly → **every minute** (`deploy/co.entrpy.wws-poll.plist` StartInterval 3600→60 + installed copy reloaded, run interval=60s; also fixed the plist's stale program path). Reversible ops change on our own poller; safe (launchd no-overlap, few-sec poll, free reads).
- [x] Calendar **month/year picker** (any month/year, historical+future): month-parameterized `getMonthCalendar` + `GET /api/calendar` + prev/next + month & year selects; current month server-precomputed, others fetched.
- [x] Verified: build; 107 tests; live-DB screenshots + prod spot-check.
- ⚠️ **Deploy landmine (recovered):** the main checkout has pre-existing uncommitted `deploy/*` edits that blocked `git pull` fast-forward → a silent stale-code deploy on the first attempt. Fixed by discarding the subsumed local plist change + re-pulling. Deploy must assert HEAD==origin/main. See comms.

## Feedback Round 39 (2026-07-16) — Drew (msg 19f6bb5d4cbc7012): booking-SITE lead-source dropdown + required "Other" free-text

BOOKING SITE (white-wall-mockup, not the dashboard). **PR #87 merged → Vercel prod (~40s), live on whitewallstudios.co.** Confirmed `19f6bd0dbea483d8`. Comms `client/comms/2026-07-16-drew-booking-site-lead-source.md`.

- [x] "How did you hear about us?" options → Repeat customer, Google search, Instagram, Facebook, Friend / Referral, Drove by, Instagram ad, Facebook ad, Other (both `book-powdersville.html` + `book-taylors-mill.html`; shared Step-3 field = every path).
- [x] "Other" reveals a **required** free-text box (3-char min); switching away hides + clears it. Client validation gates Step-3 + Pay (`isStepComplete`/`getValidationErrors`); input handler uses `updateTermsGate()` (no re-render, caret safe).
- [x] Exact typed answer recorded: `api/_lib/acuity.js` `buildAppointmentNotes` (the one note builder all checkout paths use) + `api/notify-owner.js` write the free text, not "Other" → dashboard lead-source lens shows the real answer.
- [x] Verified: node --check; buildAppointmentNotes Other→exact text; staging Playwright both pages (9 options, hidden→revealed→hidden+cleared, no console errors); prod spot-check both pages.

## Feedback Round 40 (2026-07-17) — Drew (msg 19f7180aeade755d): dashboard Overview — This Week chart + Bookings calendar SIDE BY SIDE

DASHBOARD (wws-dashboard, not the booking site). **PR #90 (squash `c8c2ded`) merged + deployed + kickstarted + prod-verified on wws.entrpy.co.** Confirmed to Drew (`19f71c22a197b86a`). Comms `client/comms/2026-07-17-drew-dashboard-overview-side-by-side.md`.

- [x] Exported `WeekChartCard` from `components/glance/glance-view.tsx` (was private) and dropped it from the `GlanceView` stack.
- [x] Rendered `[WeekChartCard | MonthCalendarCard]` as a two-column `lg:grid-cols-2` row (`items-start`) in `components/glance/glance-page.tsx` — chart left, calendar right, condensed; stacks to one column below `lg`.
- [x] Same click-a-day unfold UI: `MonthCalendarCard` renders its day detail inside the card and works unchanged at half width.
- [x] Verified: `npm run build` clean; live-DB Playwright (desktop two-column, 390px mobile stack, click-a-day unfold on both, 0px horizontal overflow, live data, zero console errors); prod re-verify on the deployed `:18794` process + public tunnel healthy (302 CF Access). Pure LAYOUT change, READ-ONLY lenses, not §4-gated.

## Feedback Round 41 (2026-07-18) — Drew (msg 19f7822ca6f71be2): publish the Sunlight Simulator live + add to menu bar + link from FAQ

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). Branch `worker/sunlight-simulator`. Comms `client/comms/2026-07-18-drew-sunlight-simulator.md`. Copy/static addition — no money/booking-logic.

- [x] Drew's attached bundle (`Whitewall Sunlight Simulator.html`, 2.9 MB, self-contained) added byte-for-byte as `sunlight-simulator-app.html`; thin wrapper `sunlight-simulator.html` (title/meta/favicon + full-viewport iframe) serves it at the clean route **`/sunlight-simulator`**. Wrapper exists because the bundle rewrites its own head on unpack (empty tab title otherwise); Drew's artifact stays untouched.
- [x] "Sunlight Simulator" added to the menu bar on all 9 menu-bearing pages (index, powdersville, taylors-mill, gallery, floor-plans, faq, add-ons, book-powdersville, book-taylors-mill), desktop + mobile, right after Floor Plans, cloning each page's own nav styling (14 links).
- [x] FAQ "What is the best time of day for natural light?" answer gets a new line + hyperlink to `/sunlight-simulator` ("live Sunlight Simulator … what the sunlight will look like in the space at any time of day, in any month"). Covers both of Drew's phrasings; no new question needed.
- [x] Verified: no JS touched (`node --check` n/a); grep completeness (14 nav links + 1 FAQ link); headless render of the wrapper (bundle unpacks, sliders/presets render, zero console/page errors, desktop + 390px mobile); Vercel prod spot-check on the live URL after merge.

## Feedback Round 42 (2026-07-19) — Drew (msg 19f7b9f45b99a756): hamburger nav must appear top-right on EVERY page

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). PR #89 (squash `5f97a5f`). Comms `client/comms/2026-07-19-drew-hamburger-every-page.md`. Copy/static nav change — no money/booking-logic, not §4-gated.

- [x] Root cause: per-page nav-markup drift. Some pages had desktop links but no mobile hamburger (add-ons, floor-plans, book-*, booking-confirmation/error, login, addon-menu, account, 404, guides); some had a `md:hidden` hamburger but no desktop menu (faq, terms, privacy, props, gallery, gear-rentals-*); two had no nav at all (theresavideoforthat, sunlight-simulator wrapper).
- [x] New **`scripts/site-nav.js`** (single source of truth, included on all 23 content pages): injects an always-visible hamburger (blue icon in a dark blurred chip) top-right at every breakpoint + a consistent dark dropdown of 11 links, **Flagship/Powdersville first**. Hides legacy per-page link rows/toggles (no double menu), folds a page's sign-out into the menu, mirrors nav-account.js "My Account" swap. Fail-silent + idempotent → can't drift again.
- [x] Sunlight Simulator app bundle (`sunlight-simulator-app.html`) left byte-for-byte untouched; only its wrapper gets the nav.
- [x] Home + 2 location pages' desktop spelled-out link bar is now the same hamburger (consistency); offered Drew a one-line restore of inline links if preferred.
- [x] Verified: Playwright on all 23 pages × {1280, 390}px (present + visible + top-right + opens + 11 links + 0px overflow + no console errors), then re-verified 7 pages on LIVE prod post-deploy. Confirmed to Drew (`19f7bdc4fa1fa17a`).

## Feedback Round 43 (2026-07-20) — Drew (msg 19f7fc5a4d615d26): hamburger white + desktop Robinhood-style horizontal tab reveal

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). PR #90 (squash `aa672f5`). Comms `client/comms/2026-07-20-drew-hamburger-white-and-robinhood-reveal.md`. Ticket DREW-4. CSS/nav interaction on the shared `scripts/site-nav.js` — not §4-gated. Drew attached 2 Robinhood screenshots (closed = ☰; open = ✕ + horizontal tab strip below the header).

- [x] Hamburger icon color **blue `#4A90D9` → white `#fff`** on every page. Sits in a dark blurred chip, so white stays legible on any header background.
- [x] **Desktop (≥768px) only:** clicking the hamburger opens the nav as a **full-width horizontal tab strip** pinned below the header (logo stays top-left; icon swaps to an ✕ top-right), links laid left-to-right — the Robinhood web pattern. Powdersville/Flagship first.
- [x] **Mobile (<768px) untouched** — same white hamburger + vertical dropdown (Drew: "only on desktop"). The ✕-icon swap is desktop-only too, so mobile stays pixel-identical.
- [x] Interpretation flagged to Drew + in PR: White Wall has no persistent Robinhood-style top bar (just the floating hamburger), so the strip is a full-width reveal below the header; with 11 links it lands on one wide row + a short second row on a laptop. Offered to trim/reorder tabs if he prefers.
- [x] Verified: `node --check` clean; Playwright desktop 1280 + mobile 390 across 7 pages (white stroke both widths; desktop full-width flex + left-to-right links + ✕ + 0px overflow; mobile block dropdown + stacked links + stays ☰); then LIVE prod re-verify on whitewallstudios.co (desktop + mobile) post-deploy. Confirmed to Drew (`19f7ff1f71802693`).

## Feedback Round 44 (2026-07-20) — Drew (msg 19f7ffebbfc2cb76): Sunlight Simulator drag-to-interact hint caption

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). PR #91 (squash `2cf1deb`). Ticket **DREW-5**. Comms `client/comms/2026-07-20-drew-sunlight-simulator-drag-hint.md`. Copy/static overlay — no money/booking-logic, not §4-gated. Access: ACTIVE paid window.

- [x] Small hint pill pinned **bottom-center of the simulator frame** with a drag/pointer icon + text: "Drag your finger (or cursor if on computer) to interact with the simulator."
- [x] Lives on the **wrapper** (`sunlight-simulator.html`) as a fixed overlay; Drew's bundle (`sunlight-simulator-app.html`) stays **byte-for-byte untouched**.
- [x] `pointer-events: none` so it never intercepts the drag it advertises. Semi-opaque dark pill + blur, white text → legible on any scene; responsive width (one line desktop, tidy 2-line box on a phone); safe-area inset.
- [x] Copy: Drew wrote "curser" → shipped corrected "cursor" on the live page, flagged to Drew (one-word revert offered).
- [x] Verified: Playwright desktop 1280 + mobile 390 (visible, centered, near bottom, 0px overflow, clear of slider/preset controls, no console errors), then LIVE prod render + curl on whitewallstudios.co/sunlight-simulator post-deploy. Confirmed to Drew (`19f800ad4db9b934`).

## Feedback Round 45 (2026-07-20) — Drew (msg 19f800d581e59f25): Sunlight Simulator drag hint — device-aware copy + on-image + yellow

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). PR #92 (squash `5a5b89f`). Ticket **DREW-6**. Comms `client/comms/2026-07-20-drew-sunlight-hint-device-aware-on-image-yellow.md`. Revision of Round 44 / DREW-5 — copy/static overlay on the wrapper only, not §4-gated. Access: ACTIVE paid window.

- [x] **Device-aware copy:** touch / coarse-pointer device (iPhone, iPad, Android) → "Drag your finger to interact with the simulator"; computer → "Drag your cursor to interact with the simulator". Keyed on **capability** (`pointer: coarse` / `ontouchstart` / `maxTouchPoints`), not a UA string, so every touch device gets "finger" and every desktop gets "cursor". Interpretation flagged to Drew (strict iPhone-only available if he prefers).
- [x] **On the image, not the screen:** the pill is now pinned to the **bottom-center of the actual studio image** (the bundle's stage box wrapping `img[alt="Whitewall Studios interior"]`) and tracks it on load / resize / internal scroll. The same-origin iframe lets the wrapper read the stage rect; Drew's bundle stays **byte-for-byte untouched** (we only read its layout). Hidden when the image is off-screen → shows once the image is in view.
- [x] **Yellow pill (`#ffd400`) + black text + black icon**, solid (blur chip dropped) for maximum legibility on any scene. Still `pointer-events: none` so it never intercepts the drag it advertises.
- [x] Verified: `node --check` on the inline script; Playwright **desktop 1280** (cursor copy) + **mobile 390 touch/iPhone UA** (finger copy) — yellow bg / black text / pointer-events none, centered on the image (dx=0) 14px above its bottom, tracks on internal scroll (gap stays 14px), zero console errors; then **LIVE prod re-verify** on whitewallstudios.co/sunlight-simulator (desktop + iPhone) post-deploy. Confirmed to Drew (`19f8019a5e140ba0`).

## Feedback Round 46 (2026-07-20) — Drew (msg 19f801aa148b72cf): Sunlight Simulator — remove the top-right sun path chart

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). PR #93 (squash `fee94f7`). Ticket **DREW-7**. Comms `client/comms/2026-07-20-drew-sunlight-remove-sun-path-graph.md`. Static/UI on the wrapper only, not §4-gated. Access: message arrived within the ACTIVE paid window.

- [x] Removed the **"SUN PATH" mini-chart** pinned to the **top-right of the studio image** (Drew: "get rid of that little chart thing altogether for both mobile and desktop").
- [x] That widget is a self-contained card **inside Drew's bundle**. The wrapper (`sunlight-simulator.html`) finds it in the same-origin bundle DOM by its "SUN PATH" label and sets the card to `display:none`, caching the reference and re-asserting each tick so it can never redraw. Drew's bundle (`sunlight-simulator-app.html`) stays **byte-for-byte untouched** — one element hidden in the live DOM. Fully reversible.
- [x] Verified: `node --check`; Playwright desktop 1280 + mobile 390 touch (SUN PATH card computes `display:none` + zero rendered size = chart gone on both; drag-hint pill still shows correct device-aware copy; zero console errors); then LIVE prod re-verify on whitewallstudios.co/sunlight-simulator (desktop + iPhone) post-deploy. Confirmed to Drew (`19f80207694fbb5f`).

## Feedback Round 47 (2026-07-20) — Drew (msg 19f802a8dc0092d6): Sunlight Simulator — kill orange load-splash + fix flaky Play Day/Year + pause

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). PR #94 (squash `74dc625`). Ticket **DREW-8**. Comms `client/comms/2026-07-20-drew-sunlight-orange-flash-and-play-buttons.md`. Behavioral fix, not §4-gated. Access: request landed just before the paywall auto-fired; Drew then PAID $20 (~11:47, 24h window active).

- [x] **Orange logo flash on load/refresh — removed.** The bundle's `#__bundler_thumbnail` is a full-screen loading splash whose `viewBox` was mangled to `sc-camel-view-box` during bundling, so its 100×100 orange SVG (`#e7a13a`) rendered as a tiny **top-left square** during the slow Babel unpack. Set it `display:none` — it is throwaway loader DOM (`documentElement.replaceWith` on mount), so the page just shows the clean cream background while unpacking.
- [x] **Play Day / Play Year flaky + pause unresponsive — fixed.** The animation ran on `setInterval(this.tick, 16)`; on mobile a heavy 1536×1024 canvas frame overrunning 16ms makes `setInterval` queue callbacks, never yield to touch, and fire catch-up bursts after refresh/background — exactly Drew's "gamble to start, takes forever to pause, no response." Swapped the loop to **`requestAnimationFrame`** (physics already use real `dt` from `performance.now()`, so behavior-preserving; rAF never backlogs and yields to input); `componentWillUnmount` cancels the rAF. Added **instant feedback**: `playDay`/`playYear` call `renderFrame(performance.now())` on click (button flips Pause↔Play, sun starts/stops the same frame) — matching `onMonth`/`onHour`, killing the rage-tap loop.
- [x] ⚠️ **First change to touch Drew's bundle** (`sunlight-simulator-app.html`) rather than only the wrapper — the animation loop can't be fixed from outside. Edits are surgical (2 changed lines), verbatim-verified against the decoded inline JS, and the JSON integrity of the asset-embedded line is preserved. Intro, sliders, presets, share, drag hint (DREW-6), hidden sun-path card (DREW-7) all unchanged.
- [x] Verified: Playwright drive of the app, desktop 1280 + mobile 390 (touch), pre-ship AND on LIVE prod (whitewallstudios.co/sunlight-simulator): orange splash absent after mount; single-click Play Day/Year starts (sun/month advancing, button → PAUSE); single-click **Pause reliably stops on one click** (button → PLAY, slider frozen); zero console errors. Wrapper re-verified (no splash, drag hint intact, sun-path card still hidden). Confirmed to Drew (`19f804c7f9835e7f`).

## Feedback Round 48 (2026-07-20) — Drew (msg 19f80a39a9ab62d3): Sunlight Simulator — Play Day/Year STILL flaky after PR #94

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). PR #95 (squash `1874b07`). Ticket **DREW-9**. Comms `client/comms/2026-07-20-drew-sunlight-orange-flash-and-play-buttons.md` (Follow-up 2). Behavioral fix, not §4-gated. Access: active paid 24h window.

- [x] Drew confirmed the **orange splash is gone** (DREW-8/PR #94 landed). But in a live walkthrough the **Play Day / Play Year buttons still bugged out**: first press often did nothing, pause needed several clicks, and **only clicking the image reliably started/stopped** it.
- [x] **Root cause = the buttons were on the fragile `click` event; the image is on native `pointerdown`.** PR #94 fixed the animation *timer* (setInterval→rAF) but the buttons still fired via React `onClick` (the bundle's `sc-camel-on-click`). On touch, `click` is delayed and cancelled by finger drift, the ~300ms synthesized-click delay, and (this bundle) the button label being rewritten every animation frame — so taps were silently dropped. The image always worked because `bindDrag` fires on `pointerdown`.
- [x] **Fix (bundle `sunlight-simulator-app.html`, 3 surgical inline-JS edits):** (1) `bindPress()` — both buttons fire on **`pointerdown`** (instant, uniform touch+mouse, exactly like the image) + `touch-action:manipulation` to kill mobile click-delay / double-tap zoom; a same-button `click` listener `stopPropagation`s so React's onClick can't also fire. (2) `playDay`/`playYear` each **debounce** on a per-button 250ms guard so the redundant synthesized click can't double-toggle and rapid taps can't desync. (3) `renderFrame` only rewrites the button `textContent`/styles when the on/off state actually changes (`el.__on`) instead of replacing the child text node 60×/sec.
- [x] Untouched: intro, sliders, presets, share, wrapper drag hint (DREW-6), hidden sun-path card (DREW-7). Template JSON integrity parsed + asserted.
- [x] Verified headless (desktop 1280 + mobile 390 touch) pre-ship: pointerdown-only now toggles (proves the new binding; before, only a full click did); one full press flips exactly once (no double-toggle) and flips back; **0** button DOM mutations during 1s of play (was 60fps churn); 5 spaced rapid presses end in sync; zero errors. Then **LIVE prod** re-verify on whitewallstudios.co/sunlight-simulator (the real wrapper + iframe) driving Drew's exact sequence on **desktop + iPhone** — every press landed, pause stops on one press. Confirmed to Drew (`19f80b5cf7456e83`).

## Feedback Round 49 (2026-07-20) — Drew (msg 19f80bb7f821206f): Sunlight Simulator — remove Blue Hour + month-relative Golden Hour

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). PR #96 (squash `2000a71`). Ticket **DREW-10**. Comms `client/comms/2026-07-20-drew-sunlight-golden-hour-month-relative.md`. Behavioral fix, not §4-gated. Access: active paid 24h window. Drew also confirmed DREW-9 accepted ("It works perfectly. Great job.").

- [x] **Blue Hour button removed entirely** — the `<button>` markup, its `presetBlue` handler, and its renderVals binding. No `Blue Hour` / `presetBlue` reference remains in the bundle.
- [x] **Golden Hour is now month-relative** — was `presetGolden = ()=>this.goto(10, 16.6)` (hardcoded jump to Nov 4:36pm). Now it keeps the currently-selected month and moves only the TIME to that month's golden hour. It derives the time from the simulator's OWN sun model (`sunAt` / `LAT=34.75` / `DOY[]` already in the bundle): scans the current month's evening for the low ~5.2° sun (the exact altitude the old Nov preset sat at), clamps to the 6pm slider cap, then `goto(this.tMonth, gh)`. Deriving from the model (not a hardcoded table) keeps the golden time consistent with the light the sim actually renders and handles any month/fractional-month slider value.
- [x] Golden hour by month: Jan 4:29p · Feb 4:56p · Mar 5:27p · **Apr–Aug 6:00p (clamped — true golden is past the 6pm slider cap)** · Sep 5:41p · Oct 5:07p · Nov 4:36p · Dec 4:21p. Summer-evening clamp flagged to Drew (offered to widen the slider range as a separate change).
- [x] 3 surgical edits inside `sunlight-simulator-app.html` (−159 bytes; quote/backslash/newline-free inserts so JSON/string integrity is preserved). Intro, sliders, Play Day+Year (DREW-9), Winter+Summer Noon presets, share, wrapper drag hint (DREW-6), hidden sun-path card (DREW-7) all unchanged.
- [x] Verified: Playwright desktop 1280 + mobile 390, PRE-ship AND on LIVE prod (whitewallstudios.co/sunlight-simulator), zero console errors — Blue Hour absent, Golden Hour present; April 10am → stays April, 6:00pm; October 8am → stays October, 5:08pm; January 3pm → stays January, 4:29pm. Confirmed to Drew (`19f80c5bcad062ee`).

## Feedback Round 50 (2026-07-20) — Drew (msg 19f80eaddc87d8ef): Sunlight Simulator — "Time Lapse Entire Year" button

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). PR #97 (squash `37d432c`). Ticket **DREW-12**. Comms `client/comms/2026-07-20-drew-sunlight-time-lapse-entire-year.md`. Behavioral fix, not §4-gated. Access: active paid 24h window.

- [x] **New light-blue "Time Lapse Entire Year" button, left of Play Day** — `#7ec8e3` bg + dark text idle; active state deep blue `#2b8cbe` + cream + "❚❚ Pause", mirroring the Play Day/Year toggle. Live badge shows "TIME LAPSE · YEAR".
- [x] **New `mode='tour'` animation** — tours the whole year Jan→Dec. `dHour` sweeps 6→18 at 12/s = **1.0s per full-day time-lapse**; on each sunset advance `tourStep` (0..35) and set `dMonth = tourStep/3` → **3 day-sweeps per month spaced ~1/3 month (~10 days)** across all 12 months, wraps at 36 → loops. **36 sweeps × 1s = 36s** for a full loop, matching Drew's spec (12 months × 3 days × 1s/day). Stop via the button again or tapping the image, same as Play Day/Year.
- [x] 6 surgical inline-JS edits inside `sunlight-simulator-app.html` (+1432 bytes; count-asserted anchors so the packed-bundle JSON/string integrity is preserved). `playTour`/`tourBtnRef` wired through `renderVals`. Play Day/Year, Golden/Winter/Summer presets, sliders, share, wrapper drag hint (DREW-6), hidden sun-path card (DREW-7) all unchanged.
- [x] Verified: Playwright desktop 1280 + mobile 390, PRE-ship AND on LIVE prod (whitewallstudios.co/sunlight-simulator), zero console errors — button light blue + first/left of Play Day; tour advances month (0→1.0 in ~3s = 3 sweeps/month stepping Jan→Feb) with hour sweeping 6→18 each second (loop wrap observed); Pause/idle toggle; Play Day still works. Confirmed to Drew (`19f80f4d8e791344`; offered faster/slower + more/fewer sample days).

## Feedback Round 51 (2026-07-20) — Drew (msg 19f80f9e2874c40b): Sunlight Simulator Time Lapse — 2 days/month + kill the strobe

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). PR #98 (squash `d3393da`). Ticket **DREW-12** (reopened — revision of the Round-50 feature). Comms `client/comms/2026-07-20-drew-sunlight-time-lapse-two-days-and-strobe.md`. Behavioral fix, not §4-gated. Access: active paid 24h window.

- [x] **2 sample days per month instead of 3** — tour tick now `tourStep %24` and `dMonth = tourStep/2` (2 days/month, ~15 days apart). Full loop shortens ~36s → ~24s.
- [x] **Strobe eliminated.** Root cause: `grade1()` uses a BINARY night wash `night = alt<=0.5 ? 1 : 0` that slams the mood-wash overlay +0.35 the instant the sun crosses 0.5° altitude; the year tour crossed sunrise (dark→bright snap) + sunset (bright→dark snap) on every sample, back to back = strobe. The fixed 6am→6pm sweep also held on dead-black pre-dawn/post-dusk in winter. Fix (tour mode only): new `_tb(m)` derives each month's **daylight arc** from the sim's own sun model (`sunAt`/`DOY`/`LAT=34.75`) — first/last hour where `alt>0.8°`, clamped to `[6,18]`. The tour sweeps `[lo,hi]` (sunrise→sunset) instead of `6→18`, keeping the sun above the horizon so the night term never flips; bounds recompute IMMEDIATELY on each advance (same frame, `dHour=lo`) so there is no stale-hour flash frame. `playTour` clears `tourHi` so bounds recompute on every start.
- [x] Low-angle golden light preserved on purpose (raking light is the point); a day-length time-lapse still gently brightens toward midday and softens toward evening once per day (the real day, accurate). Only the black-night hold + the hard snap are gone. Offered Drew an optional soft minimum-light floor if he wants the per-day rise/fall flatter still.
- [x] 3 edits inside `sunlight-simulator-app.html` (+511 bytes; count-asserted, quote/backslash-free inserts so packed-bundle JSON/string integrity is preserved). Play Day/Year (fixed 6→18), idle, Golden/Winter/Summer presets, sliders, share, wrapper drag hint (DREW-6), hidden sun-path card (DREW-7) all byte-identical.
- [x] Verified: Playwright desktop 1280 + mobile 390, PRE-ship AND on LIVE prod (whitewallstudios.co/sunlight-simulator), zero console errors. 2 days/month (month steps 0→0.5→1…); daylight clamp (Jan sweep starts ~7:30–8:17am, not 6am black); **strobe A/B same image region: OLD luminance 55→176 / maxjump 110 / 7 hard flashes → NEW 159→176 / maxjump 14 / 0 hard flashes**; Play Day still advances. Confirmed to Drew (`19f810f5dcfc6f49`).

## Feedback Round 52 (2026-07-20) — Drew (msg 19f8104367a68271): Sunlight Simulator Time Lapse — 1 day/month at 1.5s (supersedes Round 51 2-days)

BOOKING/MARKETING SITE (white-wall-mockup, whitewallstudios.co). PR #99 (squash `f57c3fa`). Ticket **DREW-12**. Comms (same file, follow-up section) `client/comms/2026-07-20-drew-sunlight-time-lapse-two-days-and-strobe.md`. Mid-build follow-up (arrived while shipping Round 51, crossed pip's 2-days confirmation). Behavioral, not §4-gated. Access: active paid 24h window.

- [x] **1 sample day per month** (was 2 in Round 51 / 3 in Round 50) — tour tick `%12` and `dMonth = tourStep` (the 15th of each month via the DOY table). 12 days total.
- [x] **1.5s per day, frame-rate independent** — the year tour is now driven by WALL-CLOCK time, not accumulated `dt`. Each day interpolates `dHour` across its daylight arc `[tourLo,tourHi]` as `_pr = (now - tourT0)/1500`, advancing to the next month when `_pr>=1`. 12 × 1.5s = **~18s** loop. Wall-clock (not `dt*rate`) because the tick's `dt` is clamped (`Math.min(0.05,dt)`) to guard background-tab jumps, so on slow frames a "1.5s" day drifts long (measured ~2.6s/day headless under the heavy canvas — the mobile case). Wall-clock pins each day to exactly 1500ms on any device.
- [x] Strobe fix from Round 51 (daylight-arc clamp, sun kept >0.8° so the binary night wash never flips) retained. Play Day/Year (fixed 6→18), idle, presets, sliders, share, wrapper drag hint (DREW-6), hidden sun-path card (DREW-7) all byte-identical.
- [x] 1 edit inside `sunlight-simulator-app.html` (+65 bytes; count-asserted, quote/backslash-free). Verified: Playwright desktop 1000 + mobile 390, PRE-ship AND on LIVE prod (whitewallstudios.co/sunlight-simulator), zero console errors. All 12 integer months seen (1 day each); per-day durations ~1.5s (median 1.55s, frame-rate independent); strobe still gone (0 hard flashes); Play Day still advances. Confirmed to Drew (`19f8117e720c2855`).

## Feedback Round 53 (2026-07-27) — Drew (msg 19fa478568fc46a2): Bookings table — Repeat Customer? column

OPS DASHBOARD (wws-dashboard, wws.entrpy.co). PR #92 (squash `98244fc`). Ticket **DREW-13**. Comms `client/comms/2026-07-27-drew-bookings-repeat-customer-column.md`. Thread `19fa478568fc46a2` ("WhiteWall Dashboard Revisions"). Read-only dashboard change, not §4-gated. Access: active paid 24h window (Drew paid $20).

- [x] **New "Repeat?" column** on the bookings table (between Client and Location), reading **Repeat** or **New** per booking, desktop and mobile. Sortable (click the header).
- [x] **Repeat = the booking's client has >=2 non-cancelled real (non-staging) bookings overall** — the exact definition the `/repeat` lens and `repeatRate` already use, so the column stays consistent with the rest of the dashboard. Cancelled bookings do not count (a client with 1 real booking + N cancellations reads New); null client (Unknown) is never repeat.
- [x] 4 files: `lib/types.ts` (`BookingRow.is_repeat`), `lib/data/queries.ts` (`bookingRowsQuery` + `getClientDetail` add a per-row correlated subquery, parameterized, staging excluded, upstream READ-ONLY invariant untouched), `lib/data/seed.ts` (3 seed bookings get is_repeat), `components/bookings-table.tsx` (RepeatBadge, sortable column + mobile badge, gated on `showClient` so it does not clutter a single client's history).
- [x] Verified: `npm run build` passes; 125 unit tests pass; seed-mode Playwright (desktop 1280 + mobile 390) row-level correct + 0px overflow + zero console errors; then **LIVE-DB verify on the deployed :18794 process** (500 rows render Repeat/New per row, spot-checked against psql — e.g. a client with 36 bookings but 35 cancelled correctly reads New; repeat-client count 367/1228 ~30% matches the known repeatRate), zero console errors. Confirmed to Drew (`19fa48a651022049`).

## Feedback Round 54 (2026-07-27) — Drew (msg 19fa55fb1953b6be): Session Builder tab (DREW-14 Phase 1)

OPS DASHBOARD (wws-dashboard, wws.entrpy.co). PR #93 (squash `5593f9c`). Ticket **DREW-14**. Comms `client/comms/2026-07-27-drew-session-builder-custom-offer-link.md` (Follow-up 1). Thread `19fa478568fc46a2` ("WhiteWall Dashboard Revisions"). New dashboard write-path scoped to a dashboard-local table; upstream READ-ONLY invariant untouched; not §4-gated (Phase 2, which changes how customers pay, IS gated and stays parked for Andrew). Access: active paid 24h window.

- [x] **New "Session Builder" tab** (`/session-builder`, nav in `lib/nav.ts`): a replica of the booking flow — location (Flagship first) + single/multi-day event, duration, dates/times/number-of-days, participants, every add-on control kind — with a **live price summary** on the right (per-day breakdown + strikethrough taper on multi-day).
- [x] **No price drift by construction:** `scripts/sync-booking-pricing.mjs` (`npm run sync-booking-pricing`) GENERATES `lib/session-builder/pricing-shared.generated.ts` (the booking site's own multi-day math re-exported as ESM) + `catalog.generated.ts` from `scripts/{pricing-shared.js,booking-config.js}`. `lib/session-builder/pricing.ts` `computeBuilderTotals()` mirrors `booking-flow.js`'s cart summary exactly: per-day ladder (Day1 100/Day2 80/Day3+ 60%), $150 cleaning fee at >=35 participants or a multi-day event, $160/day multi-day discount (clamped). Flat one-time add-ons (Setup Crew) count ONCE not per day; `eventsOnly` add-ons excluded from single sessions.
- [x] **Ownership override** ($ or %) drops an "Ownership discount" line into the summary, clamped so the charge can never go negative.
- [x] **Saved drafts (folded into Phase 1 by this msg):** migration `0017_session_drafts.sql` + `GET`/`POST /api/session-drafts` + `PUT`/`DELETE /api/session-drafts/[id]` (server RECOMPUTES the total from config — never trusts the client). Save a named draft with notes; the Saved sessions section lists them with load / rename / edit-notes / delete. NO shareable link yet (that is Phase 2).
- [x] Verified: `npm run build` passes; **136 unit tests pass** (11 new pinning Drew's worked examples + builder composition + setup-crew-once + override clamp); seed-mode Playwright drive confirms exact totals (single $130/$200; 3-day event $270 = 600 + $150 cleaning − $480 multi-day; +TV $390; −$200 override → $190; seed draft loads + recomputes to $712), 0px mobile overflow, zero console errors; then **LIVE-DB verify on the deployed :18794** (page 200; POST/list/rename/DELETE round-trip recomputed a 3-day event to $712 server-side, cleaned up). Migration 0017 applied to the live wws DB. Confirmed live to Drew (`19fa57a7745ace96`).
- [ ] **Phase 2 (PARKED, Andrew's architecture call):** save → shareable signed link → pre-filled + LOCKED customer checkout that forces the custom Square price. Drew's design answer captured: fully locked, no extra add-ons (customer contacts Drew to change anything). Same foundation V3 items 2/6/7 need. Soft escalation (reason=architecture) still open. A fresh DREW ticket opens when Andrew green-lights.

## Feedback Round 55 (2026-07-27) — Drew (msg 19fa569db8e7fb7a): Dashboard data hygiene + client columns + stats default (DREW-15/16)

OPS DASHBOARD (wws-dashboard, wws.entrpy.co). PR #94 (squash `ff9aab7`). Tickets **DREW-15** (UI) + **DREW-16** (data). Comms `client/comms/2026-07-27-drew-dashboard-data-hygiene-and-columns.md`. Display-layer only — Acuity/Square/QBO READ-ONLY invariant untouched. (Round written by the catch-up foreman 2026-07-28: the session that shipped this died mid-deploy before adding the tracker round.)

- [x] Sidebar Stats group collapsed by default on landing; opens when inside a stats page.
- [x] Clients lifetime list gains the same Repeat / New column as the Bookings table.
- [x] Repeat-visits view drops that column (everyone there is a repeat by definition).
- [x] Andrew Smith, Max Huggins, Drew Shahoud excluded from every list, count, and dollar total (SQL views `v_client`/`v_booking`/`v_payment`, migration 0018).
- [x] Lucas Williams, Wesley/West Cannon, Nick Riddle show nothing pre-2026-01-01 (test data); 2026+ shows normally.
- [x] Duplicate identities consolidated by name (Lucas one row with real numbers). Drew confirmed all merges correct (msg 19fa972592483e26 "Merge - totally fine") — none split back.
- [x] Verified: `npm run build`, 143 unit tests, live-DB Playwright pass. Confirmed to Drew in the 11:15 status (`19fa94b4852a2b49`); Drew approved items 1/3/4/5/6 (`19fa972592483e26`).

## Feedback Round 56 (2026-07-27) — Drew (msg 19fa5847a069d1e5): Session Builder rebuilt as the website booking flow (DREW-17)

OPS DASHBOARD + BOOKING SITE. booking-site PR #103 (squash `ed418e1`) + wws-dashboard PR #95 (squash `b707b34`) + #97. Ticket **DREW-17**. Comms `client/comms/2026-07-27-drew-session-builder-ui-rebuild.md`. Drew rejected the form-style DREW-14 UI and asked for a carbon copy of the website booking flow; greenlit continuing Tue 11:57 ("Session builder - great. Lemme know when ready for review").

- [x] Inert flag-gated BUILDER mode in `scripts/booking-flow.js` (`window.WWS_BUILDER_MODE`): flow capped at add-ons, Ownership override + Save Session / Get Session Link panel, `WWSBuilderAPI.restore`. Flag unset = customers byte-identical (prod re-verified post-deploy, zero console errors).
- [x] Dashboard `/session-builder` now embeds the synced booking pages (`scripts/sync-booking-app.mjs` → `public/session-builder-app/`): title "Session Builder", self-service paragraph dropped, Flagship/Taylor's Mill toggle (Powdersville first), identical gate cards + hover + left controls / live summary right.
- [x] `lib/session-builder/flow-pricing.ts` server-recomputes flow-v2 drafts; availability via read-only proxy routes; saved drafts (0017) still load.
- [x] Verified: `npm run build`, 148 unit tests, seed-mode Playwright desktop+mobile pre-ship; post-deploy live prod verify on :18794 (toggle works, photo path prices, override panel + Save/Get Link present, 0px mobile overflow). Confirmed live to Drew (`19fa9ecd43056fd8`).

## Feedback Round 57 (2026-07-28) — Drew (msg 19fa972592483e26): Clients list Repeat/New column between Client and Instagram (DREW-18)

OPS DASHBOARD (wws-dashboard). PR #96 (squash `7ac141d`). Ticket **DREW-18**. Comms: Follow-up 2 in `client/comms/2026-07-27-drew-session-builder-ui-rebuild.md` (item 2 of Drew's point-by-point reply; items 1/3/4/5/6 were approvals of Round 55).

- [x] Repeat/New column moved to sit between Client and Instagram on the lifetime Clients list; account tab keeps Login method in the last slot; Repeat-visits view still omits the column; mobile cards unchanged.
- [x] Verified: `npm run build`, 143 unit tests, seed + live-DB Playwright (header order Client / Repeat? / Instagram across 1,095 rows, 0px mobile overflow, zero console errors). Confirmed live to Drew (`19fa9ecd43056fd8`).

## Feedback Round 58 (2026-07-28) — Drew (msg 19faa25598e78bdd): Session Builder Ownership add-on + notes + order swap (DREW-19)

OPS DASHBOARD + BOOKING SITE (builder-only code). booking-site PR #104 (squash `4b1c711`) + wws-dashboard PR #98 (squash `1ccccdb`). Ticket **DREW-19**. Comms `client/comms/2026-07-28-drew-builder-ownership-addon-and-notes.md`.

- [x] Ownership discount gains an optional note field; the note renders under the discount line in the summary and saves with the session (will ride the Phase 2 customer link when that ships).
- [x] New Ownership add-on in the same summary area: percent or dollar amount that ADDS to the total, with its own optional note.
- [x] Swap-order button: add-on-first (default, Drew's office-rental example) vs discount-first. Percent values compute on the running total at the point they apply, so the order genuinely changes the math; input sections and summary lines re-order to match.
- [x] Dashboard recomputes server-side (`flow-pricing.ts` mirrors the panel math exactly; pre-DREW-19 drafts price unchanged). No schema change — fields live in the draft config jsonb.
- [x] Customer site inert: all new code gated behind the dashboard-only builder panel; prod booking page spot-checked post-deploy (200, new code present but dormant).
- [x] Verified: `npm run build`, 150 unit tests (2 new DREW-19 suites); Playwright drive 30/30 seed AND live :18794 (both orders' math on Drew-style numbers, notes under their lines, $0 clamp, restore round-trip, 0px mobile overflow); live-DB save round-trip ($200 base + $1,000 add-on − 10% of $1,200 = $1,080 recomputed server-side, then deleted).
