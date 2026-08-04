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

## Feedback Round 59 (2026-07-28) — Drew (msg 19faa3a0981ac9da): Overview At a Glance Today's Money + Today's Bookings rows (DREW-20)

OPS DASHBOARD (wws-dashboard). PR #99 (squash `9da5054`). Ticket **DREW-20**. Comms `client/comms/2026-07-28-drew-overview-todays-money-bookings-rows.md` (+ his At a Glance screenshot in `attachments/`).

- [x] First At a Glance row renamed Today → **Today's Money** (same gold hero, same Square net collected today).
- [x] New **Today's Bookings** row directly below: bookings PLACED today (created_at ET = today, non-cancelled, non-staging, via v_booking), scope-filtered by the existing Company / Powdersville / Taylor's Mill toggle. Booked-at axis flagged to Drew (sessions-happening-today offered as the alternative); "Today is Money" dictation shipped as the possessive, flagged.
- [x] Verified: `npm run build`, 150 unit tests; seed-mode Playwright (rows in order, survive toggle, 0px mobile overflow, zero console errors); live-DB verify on :18794 psql-cross-checked (Company 2 / Powdersville 1 / Taylor's Mill 1, money row intact at $407 matching Drew's screenshot). Confirmed live to Drew (`19faa417af7bc548`).

## Feedback Round 60 (2026-07-28) — Drew (msg 19faa5c1009a19e8): "session builder things not showing for an event" (DREW-19 follow-up, incident)

OPS DASHBOARD (wws-dashboard). PR #100 (squash `697488d`). Ticket **DREW-19** (reopened, closed again). Comms `client/comms/2026-07-28-drew-builder-ownership-addon-and-notes.md` (Follow-up 1).

- [x] Reproduced Drew's exact path (Session Builder → Event → Multi-Day Event → add-ons) with a full Playwright drive on live :18794: the DREW-19 panel (Ownership add-on + notes + Swap order) renders at EVERY step. The origin was already serving the correct code — Drew's open tab was still running the pre-3:31 booking-flow.js (the embed had no cache busting).
- [x] Fix shipped so it cannot recur: sync-booking-app.mjs stamps `?v=<content sha1>` on every local script/style URL in the generated pages, and next.config serves `/session-builder-app/*` with `Cache-Control: no-cache, must-revalidate`. A deploy now always reaches the browser; a one-time manual refresh is the last one Drew ever needs.
- [x] Verified: `npm run build`, 150 unit tests; live headers + versioned URLs curl-checked; multi-day drive re-run green post-deploy. Replied to Drew (`19faa67c3f077b22`): live confirmation + refresh instruction + dashboard-vs-customer-site distinction.

## Feedback Round 61 (2026-07-28) — Drew (msg 19faa6a33b20bfdb): Session Builder Phase 2 — shareable locked customer link (DREW-21)

BOOKING SITE + OPS DASHBOARD. booking-site PR #105 (squash `db66842`) + wws-dashboard PR #101 (squash `a748088`). Ticket **DREW-21**. Comms `client/comms/2026-07-28-drew-session-builder-phase2-golive.md`; plan `client/comms/2026-07-28-session-builder-phase2-plan.md`. Drew relayed Andrew's green-light; escalation recorded to Andrew (esc-session-builder-phase-2-..., iMessage down so notified by email) — ship-after-verify per its terms, no hold received.

- [x] **Get Session Link is live**: a saved builder draft becomes `whitewallstudios.co/book-<loc>?offer=<signed payload>` — dashboard recomputes the price server-side, signs with the shared BOOKING_SECRET, and activates the link in Vercel Edge Config (activation REQUIRED; no activation, no URL).
- [x] **Locked customer flow**: the link restores Drew's exact build — dates, times, add-ons, participants all frozen (visible but grayed, click+keyboard locked), ownership add-on/discount lines with their customer-facing notes, coupons and deposit excluded. Customer fills only their own details, terms, waiver, card.
- [x] **Price authority**: create-checkout rebuilds sessions FROM THE TOKEN, recomputes the cart + the new shared `ownershipAdjustments` (one implementation across builder client, dashboard recompute, and charge path), and refuses (409 + alert) if the result differs from the signed total; $0 refused. Acuity notes get a CUSTOM OFFER block (offer name + draft id + both ownership lines + notes + total charged).
- [x] **Revocation matches Drew's mental model**: delete the saved session → link dead (delete aborts if revocation fails); re-saving a session revokes its old link (regenerate after edits); regenerating replaces older copies. ~5s Edge Config propagation.
- [x] Verified: 34 site unit tests (ownership math pinned to Drew's worked examples; token verify round-trip/tamper/revoked/superseded/unavailable) + 150 dashboard tests + builds. **Full staging money dry-run** (staging.whitewallstudios.co, Square sandbox, Acuity staging calendar 14110701): 24/24 checks, sandbox card charged exactly the signed $1,884.00, 2 appointments with the offer note block, tampered/revoked links refused with friendly stop cards. **Prod verified without payment**: live-minted link rendered locked on desktop + 390px mobile (0px overflow), then draft delete killed the link on prod. All test drafts/appointments cleaned up.
- [ ] Future (noted, not promised): viewed/paid KPIs per sent link (needs view tracking); shorter link URLs (payload is self-contained, ~4KB).

## Feedback Round 62 (2026-07-29) — Drew (msgs 19fadfeb6acf008d + 19fae0246104d1f5): Session Builder cleanup (DREW-22 + DREW-23)

OPS DASHBOARD (wws-dashboard). PR #102 (squash `8564986`). Tickets **DREW-22** + **DREW-23**. Comms `client/comms/2026-07-29-drew-session-builder-cleanup.md` (+ his two screenshots in `attachments/`). Paid window.

- [x] **DREW-22 — "Good to Know" removed from the builder.** The whole section (heading + the four policy bullets) is gone from the Session Builder aside. Change lives only in the dashboard-owned `builder-mode.js` wrapper (not overwritten by sync), so the customer booking site keeps its Good-to-know panel untouched. The Ownership/Save panel is inserted first, then the section is removed; `renderLocationPolicies()` then no-ops.
- [x] **DREW-23 — Saved sessions cards enriched.** Each card now shows: the session **type** under the dollar amount on the right (Photo / video · Event · Multi-day event); a quick-reference **schedule** under the title (single day = date + start–end time; multi-day = check-in day/time → check-out day/time, e.g. "Check-in Sep 21, 5:00 AM → out Sep 23, 10:30 PM"); and a **Get Link** button beside Load/Edit/Delete that mints the same locked customer link (`POST /api/session-links`), auto-copies it, and shows it inline. Logic is a pure, unit-tested helper (`lib/session-builder/draft-summary.ts`).
- [x] Verified: `npm run build`, **157 unit tests** (7 new in `draft-summary.test.ts`); live-DB render (desktop + 420px mobile, no overflow) shows the enriched "drew test 3" card and the builder aside with Good-to-know gone + panel intact; **prod-verified on :18794** post-deploy including Get Link minting a real `whitewallstudios.co/book-powdersville?offer=...` URL end-to-end. Confirmed live to Drew (`19fae32096faedde`).

## Feedback Round 63 (2026-07-29) — Drew (msg 19fae1d88616f9ea): locked-link "three big issues" (DREW-24 + DREW-25 + DREW-26)

BOOKING SITE + OPS DASHBOARD. booking-site PR #106 (squash `bf6fe70`) + wws-dashboard PR #103 (squash `7542160`). Tickets **DREW-24 / DREW-25 / DREW-26**. Comms `client/comms/2026-07-29-drew-locked-link-three-issues.md` (+ 3 PDFs) + plan `client/comms/2026-07-29-locked-link-revision-plan.md`. Paid window. Three coupled follow-ups to the Phase-2 locked link (Round 61).

- [x] **DREW-24 — Short offer links (issue 1: "link doesn't work in a text").** The ~4KB base64 token in the URL was truncated by iMessage/Notes/email link-detection (preview card dropped the offer, token spilled as plain text). The URL now carries only `?offer=<draftId>` (a uuid); the full signed token lives in the Edge Config entry (`{h,t,tok}`, written by the dashboard). New `GET /api/resolve-offer?id=<draftId>` hands the token back; the booking-flow boot fetches it for a short link (behind a brief loading overlay) or decodes inline for a long link (backward compatible). Signature + hash-match + pay-time reverify unchanged. Prod: a live-minted link is **88 chars** (was ~4KB), single-line + linkable. This closes the Round-61 "shorter link URLs (~4KB)" future item.
- [x] **DREW-25 — Locked flow lands at Step 3 and can proceed (issue 2).** `initOfferMode` now lands the customer on **Step 3 (Session details)** for events / Step 2 for photo-video, past the locked timing gate they were stranded on. Participants + event description lock only when Drew prefilled them (`OFFER.lock*` flags); food/drinks + required acknowledgements are always the customer's to answer. The old dead "Review your event" button is bypassed; the customer fills their fields, signs, and pays through the normal flow. **Price stability**: create-checkout pins the cleaning-fee headcount to the signed `offer.participants` (never the customer's entry) so a customer typing 35+ can't add the $150 fee and trip the price-drift 409; their real count still reaches the Acuity notes via `universal.offerCustomer`.
- [x] **DREW-26 — Builder field visibility + optional prefill + Start New (issue 3).** The dashboard builder hides the food/drinks + required-acknowledgements blocks (`!BUILDER` guard) and marks participants + "tell us about your event" optional (filled → locked prefill for the customer, blank → the customer fills). New **"Start New Session Build"** button above the builder resets to page 1. Payload gains `lockParticipants` / `lockEventDescription`.
- [x] Verified: booking-site `node --check` + full `api/_lib`/`scripts` suite **21 passed** (new `offer-price-stability.test.js`: blank signed count + customer 50 must not add the fee / must charge signed total, and a genuinely inconsistent link still 409s); dashboard `npm run build` + **157 unit tests**. **Staging money dry-run**: create-checkout probe 200 `chargedCents == finalTotalCents` (not 409) for customer-participants=50 on a blank-signed single-day offer; resolve-offer 200 for a live id, 404 for unknown; a sandbox charge + Acuity appointment on staging cal 14110701 with "Event guests: 50" and no cleaning fee. **Builder seed-drive** 5/5 (food/drinks + acks absent, optional labels, Start New resets, 0px @390px). **Prod smoke (no payment)** 6/6 desktop+mobile: short link loads → lands Step 3 → locked $4,173.30 summary + grayed add-ons → customer fields editable → Continue advances to Step 4 Waiver → URL stays 88 chars. Confirmed live to Drew (`19fa478568fc46a2`, 11:48 ET).

## Feedback Round 64 (2026-07-29) — Drew (msg 19faf17fe91bf423): Session Builder Saved Sessions Paid/Unpaid toggle (DREW-27)

OPS DASHBOARD (wws-dashboard). PR #104 (squash `858b47b`). Ticket **DREW-27**. Comms `client/comms/2026-07-29-drew-saved-sessions-paid-toggle.md`. Paid window. (Same email also carried a Watson follow-up — routed to Andrew, see the Watson comms file + SESSION-STATE; not part of this round.)

- [x] **Unpaid / Paid toggle on the Saved sessions list.** A segmented toggle above the saved cards: **Unpaid** (active = light red) / **Paid** (active = light green), with a per-tab count. Defaults to **Unpaid** so the list opens exactly like before. Unpaid shows saved sessions with no paid booking; Paid shows only the custom sessions whose link a customer has actually paid and booked (context-aware subheading noting they also appear in the Bookings tab).
- [x] **Per-card pill under the price + type.** Each saved card carries a small pill directly beneath the dollar amount and event type: red **Unpaid** / green **Paid**, so a card's status reads at a glance in either view.
- [x] **"Paid" is derived read-only, no new tracking.** A saved session is Paid when a customer opened its locked link and completed booking/payment — the booking site already stamps `(draft <draftId>)` into the Acuity appointment notes at checkout (the DREW-21 draft-id hook), and the Acuity ingest lands it in `booking.notes`. Paid = EXISTS a visible (non-cancelled, non-staging) `v_booking` whose notes reference the draft's id. Reads `v_booking` (not the base table) per the display-exclusion rule, so an owner/staff self-test booking is not counted as a real customer payment. No money moves, no upstream write.
- [x] Verified: **158 unit tests** (1 new `draftPaidState` in `draft-summary.test.ts`) + `npm run build`; seed-mode Playwright (default Unpaid tab + red pill, Paid tab + green pill, per-tab counts `(1)/(1)`, 0px overflow @390px, no new console errors); **live wws DB** query executes and a synthetic note in create-checkout.js's exact format matches the LIKE end-to-end; **prod-verified on :18794** post-deploy (real "Drew Test Real Money" draft reads Unpaid, Paid tab shows the honest empty-state since no prod link has been paid yet). Confirmed live to Drew (`19faf2845f754b60`).

## Feedback Round 65 (2026-07-29) — Drew (msg 19faf1a3d1fd7a3a): locked link "still trapping us at step two" (DREW-25 reopen)

BOOKING SITE. PR #107 (squash). Ticket **DREW-25** (reopened → done). Comms `client/comms/2026-07-29-drew-locked-link-three-issues.md` (Follow-up 1) + screenshot `attachments/2026-07-29-drew-step-two-trap-IMG_0738.png`. Paid window. Follow-up to Round 63 (DREW-25): the fix only skipped EVENT offers to Step 3; photo/video (single) offers still landed on Step 2 (date picker).

- [x] **Land photo/video locked links on Step 3, not Step 2.** `initOfferMode` (`scripts/booking-flow.js`) now lands **every** offer type on **Step 3 (Session details)**, not just events (was `setStep(event ? 3 : 2)` → `setStep(3)`). Drew's "drew test 3" is a photo/video session, so the old code dropped the customer on the live Step-2 calendar even though the date/time were locked from his build ("still trapping us at step two ... it doesn't let you continue to Session details"). Timing/dates/times/add-ons/price stay locked (`OFFER_LOCKED_ACTIONS`) and shown in the summary; the locked `selectedDate`/`selectedTime` rides the offer, so `hasBookableSlot()` is satisfied and Step 3 renders straight through to Waiver + Pay. Landing-step-only — offer state is fully restored (`applyFlowState`) before the landing step, so create-checkout charges the identical signed total; no pricing/charge code changed.
- [x] Verified: reproduced the Step-2 trap on **prod** with a real minted photo/video link (panel 2, "Pick a date & time", banner present); 40 unit tests pass (`node --test`); **full staging money dry-run** (staging + Square sandbox + Acuity staging cal `14110701`): photo/video offer lands **Step 3** → details → waiver → pay, pay button = locked **$9.00**, `create-checkout` 200, Booking confirmed, appt `1745771167` on cal 14110701 with the CUSTOM OFFER note. **Prod smoke (no payment)** desktop + mobile 414: real minted photo/video link lands **panel 3 / Session details**, offer banner present, locked **Total $9**. Confirmed live to Drew (`19faf384193750cb`).

## Feedback Round 66 (2026-07-29) — Drew (msg 19faf3fbb8b6dd4f): connect Watson agent to operate the dashboard (DREW-28)

OPS DASHBOARD (wws-dashboard). PR #105 (squash `b9304ec`). Ticket **DREW-28**. Comms `client/comms/2026-07-29-drew-watson-agent-connect.md` (RESOLUTION section). Paid window. **Andrew approved** connecting Drew's Watson agent to read + write + OPERATE the dashboard over iMessage; the hard line that Watson may never change the dashboard's CODE remains absolute. Shipped **DARK** (foundation / first cut); Drew asked for a "dialogue" so pip confirmed + asked for his prioritized wish list to sequence the rest.

- [x] **Key-authenticated agent API — `/api/agent/v1/*`.** A new surface a trusted external agent (Watson) calls with a shared API key (NOT behind Cloudflare Access / the in-app login — the key IS the gate). Endpoints: `capabilities` (action catalog to introspect), `query` (read-only SELECT), `availability` (dates/times), `sessions` (list + build/save a draft), `sessions/[id]/link` (mint the locked customer link). Exposes dashboard **data + actions only** — never code/git/deploy (recreation ladder / guardrail 3).
- [x] **DARK by default.** `AGENT_API_KEYS` unset ⇒ every agent route 503s, so prod is unchanged until Andrew issues a key. Constant-time key verify (sha256 + `timingSafeEqual`), `Authorization: Bearer` / `X-Agent-Key`.
- [x] **DRY — one implementation shared with the dashboard's own routes** so nothing drifts: `lib/read-query.ts` (extracted from `/api/watson`), `lib/session-builder/draft-actions.ts` (`createSessionDraft`, used by `/api/session-drafts` POST), `lib/session-links.ts` `mintSessionLink` (extracted from `/api/session-links`). Reads/writes scoped: query read-only; build_session writes only local `session_draft`; mint_link writes only Edge Config — Acuity/Square/QBO read-only invariant untouched.
- [x] Verified: `npm run build` + **170 unit tests** (12 new — `agent-auth.test.ts` 7, `read-query.test.ts` 5); live-DB loopback smoke with the real deploy env — auth gate (401 no key / 401 bad key / 200 with key), read query (2,837 bookings), write attempt rejected (400), sessions list, and **mint parity** (agent route vs old `/api/session-links` → identical URL + $9.00 on a throwaway, then deleted → revoked). **Prod re-verified on :18794**: agent surface 503s (dark), refactored existing routes work (session-links 400 no-draftId, session-drafts GET 200, watson 200). Confirmed the build to Drew via the "let's build it + send your wish list" reply (`19faf56912d0fb56`).
- [ ] **Go-live (Andrew, blocked, recorded `esc-watson-agent-api-...`):** (1) set `AGENT_API_KEYS` on the mini + hand Watson a key; (2) add a Cloudflare Access Bypass app scoped to path `api/agent`. **Deferred next slice:** "block times off" (Acuity write → own design + staging), sequenced by Drew's prioritized wish list.

## Feedback Round 67 (2026-07-29) — Drew (msg 19faf924d5073693): Session Builder test booking fired multi-day text + cleaners email for a one-hour photo session (DREW-29)

BOOKING SITE. PR #108 (squash `f227975`). Ticket **DREW-29**. Comms `client/comms/2026-07-29-drew-session-builder-booking-misclassified-multiday.md`. Paid window. Max's Session Builder locked-link booking was a one-hour photo session (paid fine), but post-payment it fired a "[WhiteWall] Multi-day event booked" owner text AND emailed the cleaners; Drew had to tell the cleaners to disregard.

- [x] **Root cause: `notifyMultidayEvent` (owner multi-day SMS + April cleaner email) fired on any event cart with no per-send gate.** Offer bookings go through `handleCartCheckout`; `notifyMultidayEvent` was gated on `if (cartIsEvent)` and its cleaner sub-send had no cleaning-fee gate. A one-hour session tagged "event" in the Step-1 gate reaches the cart path as a single-day event → tripped both event-only notifications.
- [x] **Fix: each concern gated by its own correct condition.** New pure `multidaySendPlan(ctx)` in `notify-multiday.js` — multi-day-shaped sends (customer recap, owner recap, owner SMS, crew SMS) require `days.length >= 2`; the cleaner email requires `cleaningFeeCents > 0`. Cleaner copy reworded "multi-day event" → "event". Call site (`create-checkout.js`) fires the orchestrator only when `cartIsMultiDayEvent || cleaningFeeCents > 0`. One-hour/single session → neither notification; single-day 35+ event → cleaner only (real fee), no multi-day text; genuine multi-day event → both. Charge / Acuity appointment / pricing untouched.
- [x] Verified: `notify-multiday-gate.test.js` (7 plan checks) + `cart-checkout.test.js` T6 (single-session event → `notifyMultidayEvent` NOT invoked, booking still charges + creates its Acuity appt) & T7 (2-day event → invoked once with the real cleaning fee) through the REAL `create-checkout.js` handler; full booking-site suite (26 files) green. Vercel prod deploy Ready + aliased to whitewallstudios.co. Confirmed live to Drew (`19fafc56dcde5200`).

## Feedback Round 68 (2026-07-30) — Drew (msg 19fb490c7e7dfe17): reformat the three owner texts onto the labeled skeleton + send samples (DREW-30)

BOOKING SITE. PR #109 (squash `890e959`). Ticket **DREW-30**. Comms `client/comms/2026-07-30-drew-booking-text-scenarios-audit.md` (Follow-up 2). Paid window. Drew audited every owner-text scenario, dictated format-only revisions to sections 1/2/3, confirmed the reformatted examples, then: "Flawless. Go ahead and make that all built in now. Send watson a text text for all three options." Copy/format change only — charge / Acuity / pricing untouched, so no staging money dry-run.

- [x] **All three owner texts share one labeled line-item skeleton** (Client Name / Session Type / Client Phone / Location / When / People / Use / Total / Cleaners emailed / Acuity #), the multi-day text's shape Drew liked. `buildSmsText` (Section 1) header → `[WhiteWall] New booking` (old `event Nppl booking` / `Nhr shoot booking` reason-header removed). `buildCompSmsText` (Section 2) rewritten from the old prose, keeping the `100% off code used` header + `Add-ons:` line, and now carrying `Total: $0.00 (100% off)`, the Acuity # (new `appointmentId` arg), and the Cleaners line. `buildOwnerEventSms` (Section 3) gains Client Name / Session Type (`Multi-day event`) / Client Phone; `Cleaners emailed ✓` → `Cleaners emailed: Yes|No`. Section 4 (setup crew) unchanged per Drew.
- [x] Session Type locked to {Photo/video, Event, Multi-day event} (`sessionTypeLabel`); Cleaners emailed = whether the booking NEEDED the cleaners (hit the cleaning fee), not send success; Client Phone formatted `(xxx) xxx-xxxx` for clean US numbers (`fmtPhone`); money comma-grouped `$4,173.30` (`fmtUsd`) to match his approved examples; People + Use lines omitted when empty (never "People: 0").
- [x] Verified: `node --check` on all touched files; synonymous-language grep sweep (old comp prose `just had a 100%` = 0, old `Cleaners emailed ✓` = 0, old `ppl booking`/`reasons.join` = 0, all builder callers enumerated); new `api/_lib/notify-sms-format.test.js` locks all three shapes + `fmtPhone` + `sessionTypeLabel` (9 checks); full booking-site suite **35/35**. Vercel prod deploy Ready (`white-wall-mockup-3vj3gmzqq`, aliased to whitewallstudios.co).
- [x] **Send-samples deliverable:** rendered the three sections through the shipped builders and sent them to Drew's phone via the live Watson / BlueBubbles path (intro + Section 1/2/3). The first Section-1 send showed `Total: $0.00` from a scratch-harness env-parse glitch (mangled a multi-line JSON env var → `buildSquareLineItems` threw → total 0); NOT a prod bug (isolation + unit tests render `$675.00`). Fired a corrected Section 1 (`$675.00`) + a one-line note right after. Confirmed live to Drew (`19fb49ffee391c52`).

## Feedback Round 69 (2026-07-30) — Drew (msg 19fb4b06b59108aa): Evan Silver captured no headcount + mandatory session-purpose field + purpose/lead-source analytics (DREW-31 + DREW-32)

BOOKING SITE PR #110 (squash `ebe74f5`, DREW-31) + DASHBOARD PR #106 (squash `6e80418`, DREW-32). Comms `client/comms/2026-07-30-drew-participant-capture-and-purpose-analytics.md`. Paid window. A real photo booking (Evan Silver, `1746165452`, Powdersville Four Hours) recorded participants=1 with no real headcount, plus Drew asked for a mandatory "what are you using the space for" field on every session type and a dashboard tab (modeled on Lead Source) to chart the answers.

- [x] **Incident root cause:** `api/_lib/acuity.js` wrote the Acuity headcount field as `intake.participants || "1"`, and the photo/video count field was optional + ungated — a blank count silently became **1** (placeholder leak). Every long single session in the live data showed the same.
- [x] **DREW-31 participant count:** now a required field on every path (photo/video gate added; events already mirror the attendee count into intake). The Acuity field writes the real value or an honest blank, never a faked 1.
- [x] **DREW-31 session purpose (new required field):** photo/video answers a fixed dropdown (`intake-purpose` — Portraits, Headshots, Bridal, Boudoir, Engagement, Family, Branding, Product, Christmas Card, Other; Other reveals a required 3+ char text box) in both `book-*.html`; events/multi day answer the open-ended event description, now always required. Every booking writes a uniform `Session purpose: <value>` note (Other → `Other: <text>`) that the dashboard parses. Wiring covers all four checkout paths (single paid, single comp, cart/multiday, locked offer). Charge / pricing / availability untouched.
- [x] **DREW-31 verify:** full booking-site suite **41/41** (new `acuity-purpose-participants.test.js`). Staging money dry-run PASSED all 7 checks (gate blocks empty, Other reveals required text, gate enables when filled, payment completes, Acuity appt `1746487314` on cal 14110701 records **participants=5 not 1** + `Session purpose: Portraits` note, price unchanged $130). Vercel prod live + spot-checked (both `book-*.html` serve the dropdown; participant label no longer `(optional)`). Confirmed live to Drew (`19fb4dc5e114068d`).
- [x] **DREW-32 dashboard:** new **Session Purpose** tab (`/session-purpose`) + **Lead Source** revamp on one shared engine (`lib/stats/notes-analytics-core.ts` + `notes-analytics.ts` + `analytics-configs.ts`). Other is its own line item with an aggregate percent, expandable to each typed-in free text + the client; every answer row expands to its bookings (client name, session type, duration) each click-through to `/bookings/[id]`; new "% of sessions since <impl date>" column (Lead Source from 2026-06-13, Session Purpose from 2026-08-01); both moved out of Stats into top-level tabs under Session Builder. Read-only over `v_booking`.
- [x] **DREW-32 verify:** `npm run build` + **177 unit tests** (7 new). Live wws DB drive: `/lead-source` 200 with real data + working drill-throughs (`Brian Knox Photo/video · 2h` → `/bookings/1734613892`) + Other rollup + case-insensitive `Google Search`→`Google search` merge; `/session-purpose` 200 with honest empty state until bookings carry the note; old `/stats/lead-source` → 404. Merged → mini pulled/built/kickstarted → live on :18794.

## Feedback Round 70 (2026-07-30) — Drew (msg 19fb51185ecdfb4f): drill-through Details column + sidebar colors & reorder (DREW-33)

DASHBOARD PR #107 (squash `ed3ca27`). Ticket **DREW-33**. Comms `client/comms/2026-07-30-drew-participant-capture-and-purpose-analytics.md` (Follow-up 2). Paid window. Drew accepted DREW-31/32 ("Absolutely flawless") then asked, on both the Lead Source and Session Purpose tabs, for a fix to the drill-through where type/duration rendered under the % columns, a new Details column, plus sidebar recoloring and reorder. Read-only display/IA change — no charge / Acuity / pricing / upstream path, so no staging money dry-run.

- [x] **Details column (both tabs, shared engine).** The expanded drill used to render a full-width nested list with `type · duration` right-aligned, so it visually fell under the `% since` header (Drew's report). Now the drill renders as real column-aligned table rows and a new **Details** column sits between **Answer** and **Count**. Empty on the aggregate row; fills only on the expanded per-booking rows as `Type · Duration · AddOns · $Amount` (e.g. `Photo/Video · 2h · Add-ons · $213`, `no add ons` when none). Amount = the same real Square net the bookings table / booking detail show (comps read $0); compact form ($200, $3.2k). Whole rows still click through to `/bookings/[id]`; mobile card list carries the same line.
- [x] **Sidebar colors.** `lib/nav.ts` gained a per-item `color`, applied to icons in `app-sidebar` + `mobile-nav`: Overview + Watson gold, Lead Source + Session Purpose shared teal, Session Builder purple, Stats neon (lime) green; Calendar sky, Revenue emerald, Bookings rose, Clients indigo, Campaigns orange. Literal Tailwind classes (JIT-safe).
- [x] **Sidebar order.** `NAV` reordered to Drew's exact list: Overview, Calendar, Revenue, Bookings, Clients, Campaigns, Lead Source, Session Purpose, Session Builder, Stats, Watson (one source for both desktop sidebar + mobile island).
- [x] Verify: `npm run build` + **177 unit tests** (notes-analytics carries `hasAddons`/`amount` into the drill booking). Live-wws Playwright: Details column aligned with real data (66/68 lead bookings show Square net; the 2 $0 are real `WWSHUNDRED` full comps), sidebar order/colors correct desktop + mobile, 0 horizontal overflow at 390px. Merged → mini pulled/built/kickstarted → live on :18794 + prod-verified (headers `Answer/Details/Count/% of answered/% since Jun 13`, sample `Photo/Video · 2h · Add-ons · $213`). Confirmed live to Drew (`19fb51dbb12b1193`).

## Feedback Round 71 (2026-07-30) — Drew (msg 19fb525942928f89): clean drill-down open + tab label colors + row dividers (DREW-33 follow-up)

DASHBOARD PR #108 (squash `5948d2c`). Ticket **DREW-33** (reopened → done). Comms `client/comms/2026-07-30-drew-participant-capture-and-purpose-analytics.md` (Follow-up 3, + two screenshots in `attachments/`). Paid window. Three display-layer tweaks to the just-shipped DREW-33 drill-through + sidebar; no data/logic change, no money/legal/scale/architecture, no escalation.

- [x] **Drill-down opens cleanly in place.** The Lead Source / Session Purpose table used `table-layout: auto`, so the Details column was ~0 width while collapsed and grabbed width the instant a row opened (its per-booking cells fill with text) — reflowing every column sideways (Drew: "staggers off to a different side, glitches over to the left"). Added `table-fixed` + a `<colgroup>` pinning column widths (Answer 30% / Details 36% / Count 10% / % answered 12% / % since 12%), so opening a row now drops the drill down in place with columns held still. Measured 0.00px shift on the Answer + Details headers on expand; 0px doc overflow at 1440px and 390px. Mobile card list unchanged (already clean).
- [x] **Tab label text = its icon color.** Applied `item.color` to the label span in both the flat and Stats branches of the desktop sidebar, so each tab reads in one accent.
- [x] **Divider lines between tabs.** Thin `border-black/10 dark:border-white/10` under each row, hidden in icon-collapsed mode and off the last row. Scope: desktop sidebar only (Drew's "left side with all the tabs"); the mobile bottom island is left as-is.
- [x] Verify: `npm run build` + **177 unit tests** + live-wws Playwright (drill opens in place, 0px column shift; sidebar colors + dividers correct; 0 horizontal overflow desktop + 390px). Merged → mini pulled/built/kickstarted → live on :18794 + prod-verified (SSR carries `table-fixed`/`<colgroup>`, prod Playwright expand shows 0.00px shift). Confirmed live to Drew (`19fb52f136cbaea4`; flagged the dividers are subtle and offered to make them heavier).

## Feedback Round 72 (2026-07-30) — Drew (msg 19fb5436927be361): sidebar nav color pills + higher contrast (DREW-35)

DASHBOARD PR #109 (squash `8ad16e5`). Ticket **DREW-35** (new; distinct from DREW-34 chart, which stays open). Comms `client/comms/2026-07-30-drew-sidebar-color-pills.md` (+ mockup in `attachments/2026-07-30-drew-sidebar-color-pills-mockup.png`). Paid window. Drew sent a mockup ("make it like this") of the DREW-33 sidebar with a soft tinted pill behind every row; pure display-layer styling, no data/logic change, no money/legal/scale/architecture, no escalation.

- [x] **Per-row color pill + deep accent.** Every sidebar nav row now sits on a soft same-hue background pill with its icon and label in a deep saturated shade of that color ("more contrast and easier to read"). `lib/nav.ts` `NavItem.color` → `{accent, tint}` from one per-hue `HUE` map (full-literal Tailwind, JIT-safe); `tint` carries resting + hover + active in the same hue, hover/active marked important (v4 `!`) so they beat the shadcn menu-button's own `bg-sidebar-accent` and the active row stays in its color instead of neutral grey.
- [x] **Deep trio stands out.** Overview, Watson (amberDeep) and Session Builder (violetDeep) run a stronger tint so they pop "a smidge more from the crowd," per Drew.
- [x] **Both surfaces.** `app-sidebar.tsx` (flat + Stats-collapsible branches) and `mobile-nav.tsx` (island icons → accent; overflow More-sheet cards get the tint). Consumer sweep confirmed only these two read the renamed field (chart.tsx `item.color` is recharts, unrelated).
- [x] Verify: `npm run build` + **177 unit tests** + Playwright sidebar screenshots light + dark matching the mockup; active row on `/session-builder` stays deep violet (important override confirmed); mobile 390px docOverflow=0. Merged → mini pulled/built/kickstarted → live on :18794 + prod-verified (SSR carries `bg-amber-400/20`, `bg-amber-400/40`, `bg-violet-500/20`, `text-*-700`). Confirmed live to Drew (`19fb54e4fba7eeb7`) with a live prod screenshot attached; offered per-row color tweaks + kept the DREW-34 chart pick warm.

## Feedback Round 73 (2026-07-30) — Drew (msg 19fb55071473e9b0): Active vs Inactive repeat clients — new tab, 3-way toggle, heat-map removal (DREW-36)

DASHBOARD PR #110 (squash `b74b2c7`). Ticket **DREW-36** (new; distinct from the still-open DREW-34 chart pick). Comms `client/comms/2026-07-30-drew-repeat-clients-active-inactive.md` (+ mockup in `attachments/2026-07-30-drew-repeat-clients-mockup.png`). Paid window. Drew's "big build": split repeat clients by his 6-month rule and thread it through the dashboard. Read-only dashboard analytics, his product call, no money/legal/scale/architecture → no escalation.

- [x] **Classification (6-month recency rule).** A repeat client (>=2 non-cancelled bookings) is **Active** if their most recent session is within 6 months, else **Inactive** (lapsed). Recency-of-last-booking, not a static gap — the only version where the velocity ask works (a client slips ARC→IRC just by 6 months passing). Counts upcoming sessions too, matching the app (clientRowsQuery / getRepeat / "Last visit" all count future-dated bookings). Core pure module `lib/stats/repeat-clients-core.ts` (+ 11 unit tests).
- [x] **New "Repeat Clients" left-nav tab under Clients** (item 2). Total/Active/Inactive toggle; ARC vs IRC average+total LTV and average inter-booking gap side by side; velocity (monthly active base, net gained vs lapsed, growing/shrinking verdict); full client list. Loader `lib/stats/repeat-clients.ts`, page `app/repeat-clients/page.tsx`, island `components/repeat-clients/repeat-clients.client.tsx`, chart `RepeatVelocityChart`.
- [x] **Repeat column on the Clients lists** (item 1). "Repeat?" now shows the Active/Inactive repeat badge on both Clients – Life Time AND Clients – With Account (was hidden on account). Prod shows 14 account-holder badges on Drew's exact mockup view.
- [x] **Quick toggle on Repeat visits** (item 3). Kept the sub-tab; added the same Total/Active/Inactive quick swap + an "In-depth analysis" link to the new tab.
- [x] **Heat maps removed site-wide** (item 4). Deleted the cohort-retention heat grid (`components/cohort-grid.tsx`) + its `/repeat` card + the `cohort` field on `getRepeat`.
- [x] **Site-wide relabel audit.** A repeat client reads "Active repeat" / "Inactive repeat" / "New" on the Clients lists and the client-detail header (`components/repeat-class-badge.tsx`; `clientRowsQuery` emits `repeat_class`). Bookings-ledger per-booking Repeat tag left as-is (flagged to Drew, offered to switch).
- [x] Verify: `npm run build` + **188 unit tests** (+11 new) + live-DB Playwright (light + dark, 0 horizontal overflow at 1440 & 390, velocity chart renders, toggle works). Reconciled against Postgres: repeat 363 = 112 ARC + 251 IRC, Total LTV sums ($100,667 + $121,278), ARC avg LTV $899 vs IRC $483. Merged → mini pulled/built/kickstarted → live on :18794 + prod-verified. Confirmed live to Drew (`19fb56f0da8c0e91`) with 2 prod screenshots; kept the DREW-34 chart pick warm.

## Feedback Round 74 (2026-07-30/31) — Drew (msg 19fb650398452ef4): pie analytics + Bookings client toggle + Repeat Clients v2 (DREW-34 + DREW-37)

DASHBOARD PR #111 (squash `5a44908`). Tickets **DREW-34** (the open chart pick, now resolved) + **DREW-37** (new; the repeat-clients v2 batch). Comms `client/comms/2026-07-30-drew-repeat-clients-active-inactive.md` (Follow-up 1). Paid window, armed=off. Follow-up to DREW-36 ("This is incredible..."). Read-only dashboard analytics, Drew's product/design call, no money/legal/scale/architecture → no escalation, pre-authorized.

- [x] **DREW-34 — pie charts.** Lead Source + Session Purpose swap the horizontal bar chart for a donut/pie (`SharePie` in `components/charts.tsx`): each answer a slice, hover = exact count + share of answered, color legend for the mix; drill table unchanged. `HBars` kept (still used by the Revenue tab).
- [x] **Bookings tab Client toggle.** All (default) / New / Active repeat / Inactive, client-side filter over the loaded rows keyed on a new `BookingRow.client_class` (new=<2 bookings, active=repeat within 6mo, inactive=lapsed), consolidated by normalized display name to match the Repeat Clients tab. Added to both BookingRow queries + seed.
- [x] **Repeat Clients dedicated list** (`components/repeat-clients/repeat-clients-table.tsx`): exact column order Client / Repeat? / Months since most recent booking / First visit / Last visit / On the Brink? / LTV / Instagram / Bookings; `table-fixed` + colgroup so columns hold position across Total/Active/Inactive (verified 0px shift). On-brink rows tinted light red.
- [x] **On the Brink section** under the velocity chart: cards (count / share of active base / soonest transition) + full list of active repeat clients within 45 days of lapsing, all light-red, with a Days-until-transition column. Main list gets the same "On the Brink?" column (No or Nd).
- [x] **Velocity chart:** dashed 6-mo-average ARC reference line (105), bars light-green >=avg / light-red <avg, tooltip adds signed net (gained−lapsed) colored by its own sign; summary quantifies avg monthly net (~+3.8/mo).
- [x] **Core** (`lib/stats/repeat-clients-core.ts`): brinkByNorm map (monthsSinceLast/daysToInactive/onBrink), onBrink summary, avgArcLast6/avgNetLast6. `components/sortable.tsx` headers wrap inside fixed columns.
- [x] Verify: `npm run build` + **192 unit tests** (+7 new core) + live-DB Playwright light+dark @1440+390 (0 overflow; columns no-slide; pie renders; bookings filter 500→293). Reconciled vs Postgres: 363 repeat = 112 active + 251 inactive, 27 on the brink (24% of active, soonest 5d). Merged → mini pulled/built/kickstarted → LIVE on :18794 + prod-verified. Confirmed live to Drew (`19fb66c8a04a4d85`) with 3 prod screenshots. Flagged 3 reversible calls (All default on Bookings, "Upcoming" months-since label, 6-mo avg line) and offered tuning.

## Feedback Round 75 (2026-07-31) — Drew (msg 19fb672610ac83bd): On the Brink urgency order + Bookings per-booking pill (DREW-37 follow-up)

DASHBOARD PR #112 (squash `88f30b8`). Ticket **DREW-37** (reopened). Comms `client/comms/2026-07-30-drew-repeat-clients-active-inactive.md` (Follow-up 2). Paid window, armed=off. Two tweaks to what Round 74/PR #111 shipped. Read-only display layer, Drew's design call, no money/legal/scale/architecture → no escalation, pre-authorized, build-now.

- [x] **On the Brink ordered by urgency.** Defaults to most-urgent-first (fewest days until the client lapses to inactive at the top), with a "Most urgent first / Least urgent first" toggle to reverse ("and then vice versa"). `RepeatClientsTable` gained a `defaultSort` prop (main list unchanged at bookings-desc); the On the Brink section passes `{key:"brink"}` and remounts via React `key` on toggle so the sort re-applies.
- [x] **Bookings tab — pill not toggles.** Drew mis-spoke earlier: removed the All/New/Active repeat/Inactive Client ToggleGroup shipped in #111 (+ its state, filter, and now-unused `BookingClass`/`CLASSES`/`RepeatClass`). The per-booking indicator pill now reads New / Active repeat / Inactive repeat via the shared `RepeatClassBadge` fed by `booking.client_class` (was New / Repeat). Location + Order toggles untouched.
- [x] Verify: `npm run build` + **192 unit tests** + live-DB Playwright light @1440+390 (On the Brink 27 rows ascending most-urgent-first [5,7,7,8,10,11,14…], toggle flips to descending [44,44,43,41…]; Bookings client toggle absent; pills New/Active/Inactive; 0 horizontal overflow both pages). Merged → mini pulled/built/kickstarted → LIVE on :18794 + prod-verified. Confirmed live to Drew (`19fb67b583e7a49f`).

## Feedback Round 76 (2026-08-02) — Drew (msg 19fc3564aa0918a0): Floor Plans tab, 7 revised plans

BOOKING SITE PR (worker/floor-plans-7). Ticket **DREW-38** (new). Comms `client/comms/2026-08-02-drew-floor-plans-revision.md` (+ 7 PDFs in `attachments/2026-08-02-drew-floor-plans/`). Paid window ($30, through the 06:00 reset), armed=off. Static asset + copy swap on `/floor-plans`, no JS / no booking logic / no money-legal-scale-architecture → no escalation, pre-authorized fast path.

- [x] **Replaced the 6 old floor-plan PNGs with Drew's 7 freshly designed, WhiteWall-branded to-scale sheets** (40' x 50' / 1,936 SF net). Rendered each PDF to a web PNG at 150 DPI (1913 x 1238) into `images/floor-plans/`; removed the two orphaned old assets (`empty-dimensions.png`, `event-seated.png`).
- [x] **Order per Drew: Empty first, Default second, then the rest.** Shipped order: Empty (A1.0) → Default Layout (A3.0) → Event Mockup Seated (A2.0, 10 tables/80 seated/680 SF dance floor) → Event Mockup Seated + Standing (A2.1, +112 standing, DJ booth) → Maximum Standing (A2.2, 281 guests) → Ceremony Seating (A2.3, 163 chairs, north altar) → Ceremony East Altar (A2.4, 114 chairs, east-wall altar). Flow: raw → day-to-day → dining events → standing peak → ceremonies. Rest-of-order is Foreman's call (Drew fixed only the first two); offered to reorder.
- [x] **Captions rewritten to the new sheets' real numbers** (net SF + clear-span on Empty; furniture/hair+makeup/backdrops on Default; 680 SF dance floor; 112/281 standing; 163/114 ceremony chairs). Added the new "Ceremony — East Altar" card. Intro line updated to mention ceremony as well as event mockups.
- [x] Verify (copy/static tier): completeness grep — 7 cards, 7 img refs all resolve to on-disk assets, no lingering orphan refs anywhere in repo; local Playwright render @1200x2 — all 7 images load (1913x1238), 0 horizontal overflow, full-page screenshot eyeballed. Vercel preview + prod spot-check on merge.

## Feedback Round 77 (2026-08-03) — Drew (msg 19fc864bc0e9f40e): dedicated Events page

BOOKING SITE PR #112 (squash `06a5682`). Ticket **DREW-39** (new). Comms `client/comms/2026-08-03-drew-events-page.md`. Paid window ($30, through the 06:00 reset), armed=ON. New standalone page + one centralized nav line, no JS booking logic / money / Acuity / Square / legal / scale → no escalation, pre-authorized fast path. Design pass — Drew: "we'll work on those questions later... for now we can just get the design down."

- [x] **New `events.html` → `/events`** (Vercel cleanUrls). Video hero (event tour video, YouTube `BsyruYsoA-I`, click-to-play) + an About Events summary drawn from the flagship `#events` anchor copy.
- [x] **Two big fully-clickable destination cards, front and center:** View the Gallery (`/gallery?location=powdersville`) and Floor Plans & Occupancy (`/floor-plans`, with an occupancy blurb: up to 281 standing / ~160 ceremony / 80 banquet). Each card is a single `<a>` so a click anywhere navigates.
- [x] **Interactive Quick Answers** (not FAQ-styled): native `<details>` accordion grouped into Space & Capacity / Planning Your Event / Getting Here & Booking, with Drew's 14 starter questions. Tap a question, the answer opens in place.
- [x] **Answers = design pass, honest.** Real answers where the site already states the fact (100 chairs + 10 tables, 281/160/80 capacity, private restroom, clearable-to-empty, 35+ guest $150 cleaning fee + live booking for price, multi-day, host-your-event types, request a tour, how to book). Contact-to-confirm placeholder copy on the business facts only Drew holds (parking stall count, extra parking, night-before setup, soundproofing, catering/beverage specifics) — no fabricated numbers on a live ad-landing page. Flagged the placeholders to Drew to finalize together.
- [x] **Events nav tab retargeted `/powdersville#events` → `/events`** in `scripts/site-nav.js` (the centralized menu injected on every page; legacy per-page nav hidden by it, so one line retargets the tab site-wide and the new page auto-gets the menu). The 2 legacy hidden Events source links in `index.html` updated for hygiene. The flagship `#events` section on `powdersville.html` kept untouched.
- [x] **SEO** for the ad-landing page: title / meta description / canonical `/events` / OG tags. (JSON-LD FAQPage deferred until the placeholder answers are locked, so search never surfaces placeholder text.)
- [x] Verify (copy/static tier): `node --check scripts/site-nav.js`; every asset ref resolves on disk; 14 `<details>` balanced; local http + Playwright render desktop 1280 & mobile 390 → 0 horizontal overflow both, hamburger menu injects, 2 cards, 14 accordions, video thumbnail swaps to the YouTube iframe on click, accordion opens. Merged → Vercel LIVE → prod-verified at https://whitewallstudios.co/events (H1, video, cards, real answers, canonical; site-nav.js Events → /events; #events anchor kept). Confirmed live to Drew (`19fc87049ed25cb2`). **Open loop = Drew's final answers** for the placeholder questions.

## Feedback Round 78 (2026-08-03) — Drew (msg 19fc8e3379a5e71a): Watson botching dashboard questions → agent API get_metrics

DASHBOARD PR #113 (squash `474c373`). Ticket **DREW-40** (new; distinct from DREW-28 "connect Watson", which Andrew closed today by handing Drew the live key). Comms `client/comms/2026-08-03-drew-watson-wrong-answers.md` (+ 2 screenshots). Paid window active (through the 06:00 reset), armed=ON. Read-only agent-API enrichment on wws-dashboard, no money/architecture/legal/scale → no escalation, pre-authorized fast path.

- [x] **Root cause:** Watson (Drew's agent, now connected) answered every overview / projection / on-the-brink question wrong because it hit `/api/agent/v1/query` (raw SQL) and recomputed figures its own way — reported gross not net, built a naive linear month run-rate, guessed at "on the brink" — so its answers never matched the dashboard Drew sees.
- [x] **New `GET /api/agent/v1/metrics`** returns the dashboard's DISPLAYED figures by reusing the exact page loaders (`getGlancePage`, `getRepeatClients` + `getClients` joined by a new pure `onBrinkList()`), so the agent can never drift from the UI. Per location: overview (today_net, month_to_date_net, projected_month, average_month, vs_average_pct, by_date_projection curve) + year_projection (ytd_net, projected_year_end). Company-wide on_the_brink (count, active_base, share_pct, soonest_days, urgency-sorted clients). All money Square net.
- [x] **capabilities catalog** gains `get_metrics` and steers overview/projection/brink questions to it over `query_data`.
- [x] Verify: `npm run build` + **195 unit tests** (3 new `onBrinkList`). Live-DB smoke on a non-prod port then **prod-verified on :18794** (401 no key / 200 with the watson key; capabilities lists get_metrics) — every figure matches Drew's screenshots: proj month 11694, avg 9814, +19.2%, Aug 16 5795/5121, ytd 69284, projected 2026 119648, on-the-brink 27 = 23% soonest 2d, top 3 Byrne 2d / Phillips 4d / Benton 4d.
- [x] Confirmed live to Drew (`19fc8f38b800bd91`) with the Watson-side instruction to prefer `get_metrics`. **Open loop = Drew re-testing Watson** (his agent — cannot reprogram from here); any remaining wrong number folds a new figure into the endpoint. Soft-flagged to Andrew: wws-dashboard prod has uncommitted code drift already in the live build (esc `esc-wws-dashboard-prod-has-uncommitted-code-drift-not-in-git-decision`).

## Feedback Round 79 (2026-08-03) — Drew (msg 19fc8fb1c5e9847e): Watson repertoire — coupons + campaigns actions

DASHBOARD PR #114 (squash). Ticket **DREW-41**. Comms `client/comms/2026-08-03-drew-watson-repertoire-and-reach-out.md`. Paid window active, armed=ON. Drew's roadmap reply: (A) make Watson a "textable version of the dashboard"; (B) get Watson doing session building + coupons + campaigns "right now, push hard core"; (C) an On the Brink "Reach Out" compose feature that he explicitly said to hold "until Watson is all good to go." Part B is this round; Part C parked per his instruction → **DREW-42** (deferred). Data writes only (local coupon/campaign tables), no upstream, SEND stays human → no hard gate; boundary soft-flagged to Andrew (esc `esc-watson-gaining-coupon-campaign-actions-by-text-send-stays-hu-decision`).

- [x] **Session building was already live** for Watson (`build_session` + `mint_link`, DREW-28) — confirmed, nothing to add.
- [x] **New agent coupon actions:** `GET/POST /api/agent/v1/coupons` (list compact + create via `parseCouponBody` + shared `createCoupon`; percent capped 1..99, `comp` for full-comp) and `POST /api/agent/v1/coupons/{code}/deactivate` (hide, not delete — keeps redemption history).
- [x] **New agent campaign actions:** `GET/POST /api/agent/v1/campaigns` (list with status + funnel counts; create a **manual proposed draft** via `createManualCampaign`).
- [x] **capabilities catalog** gains the 5 actions + steering language. Extracted `createCoupon` + `deactivateCouponByCode` into `lib/coupons.ts`; CRUD `POST /api/coupons` now reuses `createCoupon` (one write path, no drift).
- [x] **HARD BOUNDARY:** no agent approve/send route — the customer email blast stays the dashboard's human red Send button + arm switch. Watson can line a campaign up; the owner presses send.
- [x] Verify: `npm run build` + **195 unit tests**. Live-DB loopback smoke on :18991 with the real watson key (401 no key / catalog lists all 5; coupons list 34 + create + 400 invalid% + deactivate→active:false; campaigns list 10 + create→proposed + 400 invalid%; throwaway records deleted). Merged → prod rebuilt/kickstarted → **prod-verified on :18794** (all 11 actions listed; coupons 34 + campaigns 10 live).
- [x] Confirmed live to Drew (`19fc907f5ff7ade0`). **Open loops:** Part A (widen the textable dashboard) ongoing; **Part C = DREW-42 deferred** until Watson is fully dialed in + Drew re-tests. Watson re-test (DREW-40) still open.

## Feedback Round 80 (2026-08-03) — Drew (msg 19fc916871807629): Events page copy pass + final Q&A answers

BOOKING PR #113 (squash `dccd685`). Ticket **DREW-43** (DREW-39 Events-page lineage). Comms `client/comms/2026-08-03-drew-events-page-copy-pass.md`. Paid window active, armed=ON. Drew's copy pass on the live `/events` page — his hero + About rewrites, a card image swap, a gradient tweak, and the final versions of the placeholder Q&A answers left open from DREW-39. Booking site only, static copy → no hard gate; alcohol-liability line soft-flagged to Andrew (legal).

- [x] **Hero subhead** (under the title) → Drew's "flexible, self-service, open-concept" pitch, cleaned to flow, with the top searched events worked in (birthdays, bridal + baby showers, weddings, elopements, workshops, dances, graduations).
- [x] **About Events** (under the video) → restructured Drew's two rambles into two tight, left-aligned blocks: an affordability / self-service / a-la-carte philosophy block ("Built to be affordable, without cutting a single corner") and a specs block ("The space": ~2,000 sq ft, south light, 12 ft garage door, on-site rentals, front-door parking, restroom, ADA spot).
- [x] **Floor Plans & Occupancy card** → background swapped `max-standing.png` → `event-standing.png` (A2.1: banquet tables + open dance floor + labeled DJ booth = Drew's "tables and a dancing area in a DJ altar section"). Scrim gradient darkened `0.12/0.32/0.82` → `0.24/0.48/0.92` so overlaid text pops.
- [x] **Final Q&A answers** (Drew-dictated): 281 = absolute standing max (empty room); tables + chairs optional add-on; default-setup "what it looks like"; soundproof (thick drywall + rock wool); food/drink retitled "Can I have food, drink, and alcohol there?" + bold liability line; no night-before (used daily, custom block = extra charge); multi-day all online no dates; cost + $150 fee for 35 or more guests; 45 cars + overflow field; removed "prefer to talk it through" from booking answer.
- [x] **Threshold reconciled:** kept "35 or more guests" to match server `effectiveCount >= 35`; flagged Drew's looser "more than 35" wording.
- [x] Verify (copy/static): 14 `<details>` balanced; `event-standing.png` resolves; threshold sweep clean; Playwright desktop 1280 + mobile 390 → 0 horizontal overflow both, card backgrounds resolve, accordions expand, darker gradient renders. Prod-verified all strings on `https://whitewallstudios.co/events`; card image 200.
- [x] Confirmed live to Drew (`19fc92113c047854`). **Open loops:** (1) **gallery photos** from Drew's 2 Drive folders — BLOCKED, folders shared owner/editors-only, asked Drew to open sharing; (2) **cleaning-fee wording** confirm (35+ vs >35, offered to change the server threshold); (3) About **one-block-vs-two** feedback (offered). Alcohol-liability line soft-flagged to Andrew (esc `esc-events-page-net-new-alcohol-liability-disclaimer-legal`, OPEN).

## Feedback Round 81 (2026-08-03) — Drew (msg 19fc9247ac09e2a5): flagship gallery event photos + card back + wording confirm

BOOKING PR #114 (squash `c77a758`). Ticket **DREW-44**. Comms `client/comms/2026-08-03-drew-gallery-photos-drive-links.md`. Paid window active, armed=ON. Drew re-shared his two Google Drive folders of flagship event photos ("viewable for anyone with the link and everyone as an editor") to add to the top of the flagship gallery, and confirmed the cleaning-fee wording. This closes DREW-43 open loops #1 (gallery) and #2 (wording). Static assets + copy → no hard gate, pre-authorized fast path.

- [x] **Fetched folder 1** (`1v3XkmKY9dCA1KWh9BpKce3S9VnrqLIys`) with `gdown --folder` → 3 JPGs (event setups: white bounce houses, pastel balloon garlands, the flagship interior; 1206px, web-ready). Saved as `images/powdersville/event-flagship-01/02/03.jpg`.
- [x] **Top of the flagship gallery** — inserted the 3 photos as the first `#gallery-grid` items in `gallery.html`, `data-location="powdersville"` so the flagship filter includes them.
- [x] **Events card back** — swapped the `/events` "View the Gallery" `dest-card` image from the empty studio shot (`whitewall-powdersville_v2-3.jpg`) to the wide event photo (`event-flagship-01.jpg`) = Drew's "try one on the back of a card". Old image still validly used elsewhere (a gallery tile + index hero), no orphan.
- [ ] **Folder 2** (`1XmETVMLsoZWNguFk9ZeOuNvajksggkYc`) — folder shared but every file inside still "owner and editors only"; 0 files fetched. **BLOCKED on Drew** opening the files themselves (or dropping them into folder 1, which worked). Told Drew directly.
- [x] **Cleaning-fee wording** — Drew: "I agree with you: 35 or more is the right wording." Copy already reads "35 or more guests" (matches server `>= 35`) → **no change needed**, open loop resolved.
- [x] Verify (copy/static): all 3 assets resolve on disk + in-page (Playwright `naturalWidth` 1206); no orphaned refs; `gallery.html` + `events.html` render 1280 + 390 with 0 horizontal overflow; events card scrim keeps the title legible. **Prod-verified:** 3 assets 200, gallery page carries all 3 refs, events card uses `event-flagship-01`, old card image gone from `/events`.
- [x] Confirmed live to Drew (`19fc92aa8768cc87`). **Open loop = folder 2 photos** (owner: Drew opening file-level sharing). No escalation (pure static assets, no money/arch/legal/scale; the wording confirm resolved a copy loop, not a legal change).

## Feedback Round 82 (2026-08-03) — Drew (msg 19fc93042ab1b914): folder-2 event photos (via open folder) + events copy tweaks

BOOKING PR (this round). Tickets **DREW-44** (folder-2 photos, its open loop, reopened) + **DREW-45** (events copy tweaks). Comms `client/comms/2026-08-03-drew-folder2-photos-events-copy-tweaks.md`. Paid window active, armed=ON. Drew asked for a status on the second Drive folder's photos and dictated four `events.html` copy tweaks. Static assets + copy → no hard gate, pre-authorized fast path.

- [x] **Folder 2 status (DREW-44):** folder 2 (`1XmETVMLsoZWNguFk9ZeOuNvajksggkYc`) is STILL file-level owner/editors-only (`gdown --folder` re-blocked). But Drew copied those photos into the OPEN folder 1 (`Jumpers` subfolder), so re-fetching folder 1 got them. Of the 8 files, 3 were byte-identical duplicates of the live `event-flagship-01/02/03.jpg`; the **5 new hi-res event photos** (`2W2A1017/1023/1041/1042/1044.jpg`, 8192x5464) are a real workshop/networking event ("The Refine Network / Artist Academy" panel) in the flagship studio. Resized to 1600px web JPEGs → `images/powdersville/event-flagship-04..08.jpg`. **Got all 5 → Drew can remove them from folder 2.**
- [x] **Flagship gallery** — inserted the 5 new photos as `#gallery-grid` items right after `event-flagship-03`, `data-location="powdersville"` (flagship filter includes them). Gallery now shows 8 flagship event photos.
- [x] **Events hero (DREW-45):** split the first sentence ("A flexible, self-service, open-concept space with the best natural light in the Upstate, year round.") out of the intro paragraph into its own **bolded, larger subtitle** line; the rest stays the paragraph.
- [x] **Events hero:** "twelve" → **"12"** and bolded **"just 12 minutes from downtown Greenville"**.
- [x] **About "Built to be affordable" paragraphs** replaced with Drew's dictated text (3 sub-paragraphs, incl. the new "If you want a crew of people to help you, we have that as an option" line and "without compromising on a single amenity"). ONE flagged grammar fix: Drew's "most of that cost comes labor and logistics" → "comes **from** labor and logistics" (dropped word; "comes labor" reads broken). Kept "year round" styled to match the rest of the page.
- [x] **ADA line:** dropped "sits" — "an ADA spot sits directly by the front door" → "an ADA spot directly by the front door".
- [x] Verify (copy/static): events.html subtitle bolded (Playwright confirms `font-semibold` on the first para); both `<strong>` phrases correct; 0 "twelve"; "sits" gone; gallery carries all 8 event-flagship refs, all 8 assets on disk + load (naturalWidth > 0); Playwright desktop 1280 + mobile 390 → **0 horizontal overflow** on both events.html AND gallery.html; 108 gallery images load, 0 broken. Screenshots eyeballed.

## Feedback Round 83 (2026-08-03) — Drew (msg 19fc933cc7d9d2d0): flagship What's Included button, Host Your Event CTA, studio photo swaps

BOOKING PR #116 (squash `9dbd931`). Ticket **DREW-46**. Comms `client/comms/2026-08-03-drew-flagship-whats-included-events-photos.md` (+ screenshot). Paid window active, armed=ON. Three distinct asks, all `powdersville.html`, static/layout/copy → no hard gate, pre-authorized fast path. Landed 4 min after the Round-82 request while that was mid-build, so it was genuinely unhandled.

- [x] **What's Included — Show More button hugs the cards.** The section is a full-height scroll-snap panel; the card container was `flex-1` (filled the panel) with the button block pinned to the viewport bottom → big dead gap on large screens. Fix: moved the button block inside the content column right after the grid and set the container `flex-initial` so the button sits ~16px under the cards; dead space now falls below. Row-pagination expand mechanism preserved. Applied the same to the identical **Inside the Location** studio grid.
- [x] **Host Your Event section** — background photo → bounce house (`event-flagship-01.jpg`), overlay `black/30`→`black/40`; removed the paragraphs + expandable text under the video; added "Visit our events page to learn more." caption + a large **Visit Events Page** button → `/events` (new `.events-cta` style). Kept a secondary **Book Your Event**. Dropped the now-empty events `See More` expand + its machinery (`data-expand-section`, `#container-events`). `#events` anchor kept. The "35 or more guests / $150 cleaning fee" line that lived in this expand is removed here per Drew's "get rid of all the text" — that copy still lives on `/events` + in the booking flow, so no policy lost.
- [x] **Inside the Location (8 studio photos)** — removed the two vanity/mirror-and-chair shots (`v1-32`, `v1-34`) → bounce house (`event-flagship-01`, object-position 20% so the jumpers show) + Refine Network (`event-flagship-06`); replaced the last photo (`v2-11`) → another Refine Network (`event-flagship-07`). Image files left in place (still used on /gallery); only the flagship grid refs changed, no orphan on this page.
- [x] Verify (copy/static + layout, local Playwright): **0 horizontal overflow** at 2560/1280/390; Show More button sits 16px below the cards at all three sizes; big screen reveals all 19 feature cards in one click ("Show Less", within section), mobile paginates; events bg = bounce, old text gone, CTA "Visit Events Page" → `/events`, section fits without clipping on mobile; studio grid = bounce + 2 Refine, crop well to 4/5. **Prod-verified on https://whitewallstudios.co/powdersville:** events-cta + caption present, CTA → /events, event-flagship-01/06/07 all 200, 2 `flex-initial` containers, old v1-32/v1-34/3.22 refs all gone.
- [x] Confirmed live to Drew (`19fc94ce271dd792`). No escalation (pure static + layout, no money/arch/legal/scale). **Offered:** a higher-res original of the bounce house bg for extra sharpness, and to reframe/swap any of the 3 grid event photos.

## Feedback Round 84 (2026-08-03) — Drew (msg 19fc920e574b1158): On the Brink "Reach Out" feature (green-lit, un-deferred)

DASHBOARD PR #115 (squash `62ccf81`). Ticket **DREW-42**. Comms `client/comms/2026-08-03-drew-watson-prompt-calendar-control-on-brink-greenlight.md`. Paid window active, armed=ON. Read + compose-to-DRAFT only, the 75% coupon is Drew-authorized data → no hard gate, pre-authorized fast path. (The calendar-control ask on the same thread is separate = **DREW-47, ESCALATED** to Andrew; not built.)

- [x] **Reach Out column** on the dedicated On the Brink list (Repeat Clients tab). A button per client opens an editable Email | Text preview; **Email** drops the (edited) subject + body into a `mailto:` draft, **Text** puts the SMS copy in a copyable box. Nothing sends automatically (draft only, no Resend, no scale). `components/repeat-clients/reach-out-cell.tsx`.
- [x] **Column surgery (that view only):** added **Phone + Email** columns; dropped **Repeat?, First visit, Last visit**; Reach Out is the left-most column. The main "All repeat clients" list keeps all nine columns. `RepeatClientsTable` gained a `reachout` variant with a per-variant colgroup so `table-fixed` still pins the layout.
- [x] **Copy** — `lib/reachout/copy.ts` (pure, 5 unit tests): warm/personal email + SMS that sound like Drew, one emoji, the **75% `THANKYOU75`** thank-you code, Powdersville-first booking link. `THANKYOU75` (75% off, any location, active) minted on prod.
- [x] **Phone** threaded onto `ClientRow` + `clientRowsQuery` (from `v_client`, consolidated across a client's identities like instagram); seed updated.
- [x] **Watson** — `get_metrics` `on_the_brink.clients[]` now carries `phone`, `email`, and a ready `reach_out` draft (`email_subject`/`email_body`/`text_body`) so "text the top person on the brink" returns copy already written; `capabilities` describes it. Owner still sends; no send path added.
- [x] Verify: `npm run build` clean, **200 unit tests** (+5); live-DB loopback on :18992 (columns + Email/Text dialog + `get_metrics` payload: 27 clients, top Megan Byrne with phone/email/draft); mobile-audit **0 horizontal overflow** at 390px. **Prod-verified on :18794** (render + get_metrics reach_out payload). Confirmed live to Drew (`19fc96a321222748`). Instagram idea stays on the wishlist per Drew.

## Feedback Round 85 (2026-08-03) — Drew (msgs 19fc94144c27b3ec / 19fc9517e77887c4 / 19fc95a6fa6a566f): homepage mute + flagship HYE event bg + 8hr subtext

BOOKING PR #117 (squash `92d7be8`). Tickets **DREW-48** (homepage), **DREW-46 reopened** (flagship HYE bg), **DREW-49** (8hr subtext). Comms `client/comms/2026-08-03-drew-homepage-mute-hye-bg-8hr-subtext.md`. Paid window active, armed=ON. Three website-thread requests stacked after the DREW-46 confirm; the watcher fired on the newest, reconciliation caught the two leapfrogged by the scalar last-seen. All static/layout/copy + one display string → no hard gate, pre-authorized fast path.

- [x] **DREW-48 homepage (index.html)** — muted the **Flagship Location** + **Taylor's Mill** snap sections (`display:none` + a `MUTED per Drew (DREW-48)` marker comment; kept, not deleted, so they restore by removing the style). Home scroll is now hero (Book Now) → Two Locations One Standard → Host Your Event → gallery. Retargeted the homepage Host Your Event button `/powdersville#events` → `/events`.
- [x] **DREW-48 snap dots made dynamic** — the dot indicators now count only the *visible* snap-zone sections (hero…gallery), so muting two sections no longer leaves 2 dead dots or mis-styles the nav over the light gallery (the old code hardcoded `snapCount=6` / `gallerySnapIndex=5`). Self-heals if a muted section is restored.
- [x] **DREW-46 follow-up flagship (powdersville.html)** — Host Your Event background bounce-house `event-flagship-01.jpg` → `event-flagship-08.jpg` (Refine Network event, 1600x1067 landscape, most negative space for the overlaid heading, no third-party banner in frame). Old image still used in the studio grid → no orphan.
- [x] **DREW-49 flagship booking (booking-config.js + booking-flow.js + booking.css)** — the flagship **8-hour** duration option shows the subtext **"Available starting at 12:30 p.m."** under the label in the timing picker, mirroring the full-day `(5am-11pm access)` parenthetical. New optional `subtext` field on the duration config (pv-8 only → flagship only, both photo/video + event paths).
- [x] Verify (local Playwright, cold http): homepage @1280+390 both location snaps hidden, flow hero→compare→event→gallery, event button `/events`, **4 dots** tracking [0,1,2,3], nav dark-logo over light gallery, **0 horizontal overflow**, no JS errors; flagship booking @1280+390 photo/video + event paths the 8hr pill shows the subtext, exactly one pill carries it, full-day keeps its parenthetical; flagship HYE `event-flagship-08` loads (naturalWidth 1600) and renders cleanly. `node --check` clean.

## Feedback Round 86 (2026-08-03) — Drew (msg 19fc986293b3cadc): On the Brink reach-out copy revision (DREW-42 follow-up)

DASHBOARD PR #116 (squash `df9ce95`). Ticket **DREW-42 reopened**. Comms `client/comms/2026-08-03-drew-reachout-copy-revision.md`. Paid window active, armed=ON. Copy-only change to the one pure generator `lib/reachout/copy.ts` (feeds both the Reach Out UI cell and the Watson `get_metrics` payload) → no money/architecture/legal/scale, no hard gate, pre-authorized fast path. The 75% code is unchanged (already minted on prod).

- [x] **Heart emoji → camera emoji.** 💛 → 📸 in the subject + both bodies (sign-off line + SMS intro; one emoji).
- [x] **Dropped "whenever works for you" + the book link.** Removed the email `Book whenever works for you: <url>` line and the SMS `Book anytime: <url>` tail; deleted `BOOK_URL`. The note is now a pure personal thank-you.
- [x] **New less-robotic copy (Drew dictated).** Email body is his verbatim wording; SMS is a shorter version of the same ("a little shorter for the text copy").
- [x] **Foreman fixes/insertions (flagged to Drew):** grammar "that I'm is able to stay" → "that I'm able to stay"; brand casing normalized to **WhiteWall**; the code surfaced in the note ("a 75% coupon code: **THANKYOU75**") since his copy named the code but not the value and the client needs it to redeem (still driven by the `THANKYOU_CODE` constant so it can't drift); subject retuned to the thank-you tone with the camera emoji ("A personal thank you from WhiteWall 📸").
- [x] Verify: `npm run build` clean, **200 unit tests** (copy tests rewritten: camera-not-heart, no book link, phone present, code+percent in both, SMS single-line). **Prod-verified on :18794** via `get_metrics` — top client Megan Byrne draft has camera (no heart), THANKYOU75, no "whenever works", no `/book` link, single-line SMS. Confirmed live to Drew (`19fc98cd4468c250`).

## Feedback Round 87 (2026-08-03) — Drew (msg 19fc9899a04cf205): Coupons as its own nav tab + status roundup

DASHBOARD PR #117 (squash `26853d0`). Ticket **DREW-50** (new). Comms `client/comms/2026-08-03-drew-coupons-nav-tab.md`. Paid window active, armed=ON. Pure UI/nav change — no schema/ingest/upstream, read-only invariant untouched → no hard gate, pre-authorized fast path. Message also carried a status question, answered inline in the reply.

- [x] **Coupons promoted to its own top-level nav lens** (`lib/nav.ts`) — new `Coupons` item (`TicketPercent` icon, `HUE.orange`) inserted directly after Campaigns, sharing the orange family (the paired-hue idiom already used for Repeat Clients under Clients). Registry header comment updated.
- [x] **Nav-active** (`lib/nav-active.ts`) — dropped `/coupons` from `MERGED` so `/coupons` + `/coupons/tracking` light up the new Coupons lens by prefix (previously highlighted Campaigns).
- [x] **Sub-tabs split** (`components/sub-tabs.tsx`) — `CAMPAIGNS_SUBTABS` trimmed to `[Campaigns, List Health]`; new `COUPONS_SUBTABS = [Coupons, Coupon Tracking]`. `app/coupons/page.tsx` + `app/coupons/tracking/page.tsx` render it; stale "4th sub-tab under Campaigns" comment fixed.
- [x] Verify: `npm run build` clean, **200 unit tests** pass. Seed-mode server on a non-prod port — sidebar order Campaigns → Coupons → Lead Source (both orange), `/coupons` subtabs = Coupons · Coupon Tracking, `/campaigns` subtabs no longer carry Coupons; screenshot eyeballed for the color match. **Prod-verified on :18794** post-deploy (nav order + subtabs confirmed in served HTML). Confirmed live to Drew (`19fc99707f3d66ab`).

## Feedback Round 88 (2026-08-03) — Drew (msg 19fc99305415acfe): reach-out TEXT too short, match the email (DREW-42 follow-up)

DASHBOARD PR #118 (squash `5ebb760`). Ticket **DREW-42 reopened**. Comms `client/comms/2026-08-03-drew-reachout-text-longer.md`. Paid window active, armed=ON. Copy-only change to `lib/reachout/copy.ts` → no hard gate, pre-authorized fast path. Message crossed the earlier coupons+status reply (arrived 17:41 mid-reply); handled as a distinct follow-up same session.

- [x] **SMS now matches the email in full.** Drew sends both the email and the text, so the text carries the SAME thank-you as the email (shared body paragraphs `thanksPara`/`couponPara`/`closingPara`, so the two can't drift), opening with Drew's dictated email-referencing line: "Hey [Name], this is Drew at WhiteWall. I just shot you an email, but I wanted to send you a personal text as well." No double greeting, no second Drew intro; camera at sign-off, THANKYOU75 + phone intact.
- [x] Verify: `npm run build` clean, **200 unit tests** (the old "SMS single-line" test rewritten: references the email, full body, multi-paragraph, no double-intro). **Prod-verified on :18794** via `get_metrics` `text_body` (top on-brink client Megan Byrne): email-referencing opener, full body ("serving the upstate"), THANKYOU75, multi-paragraph, no double-intro. Confirmed live to Drew (`19fc9a02fdf81bfe`).
- Note: transient Watson `get_metrics` 503 during deploy (stash-before-kickstart darkened `AGENT_API_KEYS`) root-caused + recovered by re-kickstart after stash pop; get_metrics 200 confirmed. Deploy-note recorded in the comms file.

## Feedback Round 89 (2026-08-03) — Drew (msg 19fc9c8b2ab839cc): Watson can't delete session drafts (DREW-51)

DASHBOARD PR #119 (squash `564cb5d`). Ticket **DREW-51** (new). Comms `client/comms/2026-08-03-drew-watson-delete-session-drafts.md` (+ screenshot `attachments/2026-08-03-watson-delete-drafts/IMG_0822.png`). Paid window active, armed=ON. Local `session_draft` write only, upstream read-only invariant untouched → no hard gate, pre-authorized fast path (Watson data-write ladder; the "edit/delete of a saved session over the API" slice named next-up in DREW-28).

- [x] **New `DELETE /api/agent/v1/sessions/{id}`** (key-authenticated) so Watson can remove a stale/duplicate draft it built. Watson had told Drew the action catalog exposed no delete-draft verb.
- [x] **Shared `deleteSessionDraft(id)`** extracted into `lib/session-builder/draft-actions.ts` (twin of `createSessionDraft`); the dashboard's own `DELETE /api/session-drafts/{id}` refactored to call it so the two can't drift. Revoke-customer-link-first is required (if it fails the draft is kept); idempotent when no link was minted.
- [x] `delete_session` added to the agent `capabilities` catalog with steering language (get id from `list_sessions`; only removes the saved draft, never a real Acuity appointment / Square payment / customer).
- [x] Verify: `npm run build` clean, **200 unit tests**; live-DB loopback round-trip on a non-prod port + **prod-verified on :18794** with the real agent key (401 no key; build_session → list 4 → DELETE 200 → list 3 → second DELETE 404; capabilities lists delete_session; get_metrics 200). Throwaway drafts created + deleted both times, DB left as found (3 real drafts untouched). Confirmed live to Drew (`19fc9d000114d16d`).

## Feedback Round 90 (2026-08-04) — Drew (msg 19fccf4d73481f38): Coupons system redesign — honest list + sections + centering (DREW-52 part 1)

DASHBOARD PR #120 (squash `8bac2ff`). Ticket **DREW-52** (new, high). Comms `client/comms/2026-08-04-drew-coupons-system-redesign.md`. Paid window active (Drew paid $30 for the day), armed=ON. Display-only (no schema, no upstream, no booking-site) → no hard gate, pre-authorized fast path. First of several PRs on the coupons brain-dump.

- [x] **Root-caused the "39 total / 39 active vs 12 live / 27 expired" confusion.** The Coupons list counted the raw `active` boolean (nobody flips it off when a weekend ends → over-reports 39); Coupon Tracking checks the date window → honest 12. New pure `lib/coupons-classify.ts` (`isExpired`/`isEvergreen`/`isLive`/`couponBucket`, ET-date injected) is the single definition so the list, header, and the auto-expiry sweep can't drift. 6 unit tests.
- [x] **Header now reads `12 live · 8 evergreen · 4 active campaign`** (live = flag on AND in date window), reconciling with Coupon Tracking's 12.
- [x] **Two sections** (`components/coupons-table.tsx`): Evergreen (always-on standing codes) + Active campaign (live weekend/location codes only). Past-weekend codes hidden with an honest footnote; their redemptions survive in Coupon Tracking.
- [x] **All columns centered** — fixes the Discount dead-space + right-hug Drew flagged.
- [x] Verify: `npm run build` clean, **206 unit tests** (+6). Live-DB smoke on :18993 (12 live rows, right 12 codes, 27 hidden footnote); 0 overflow @390px; centering eyeballed on a desktop screenshot. **Prod-verified on :18794** (header `12 live · 8 evergreen · 4 active campaign`, right 12 codes, agent API 401 not 503 — Watson intact).

## Feedback Round 91 (2026-08-04) — Drew (same msg): campaign-coupon auto-expiry sweep (DREW-52 part 2)

DASHBOARD PR #121 (squash on main). Ticket **DREW-52** (same). Local Postgres write only (delete expired coupon rows; redemptions preserved) → Drew-authorized money/policy data op ([[drew-self-authorizes-money]]), backup dumped first → no hard gate.

- [x] **`lib/coupons-sweep.ts` `sweepExpiredCampaignCoupons(now)`** — deletes campaign coupons whose `valid_until` is strictly before today (ET). Evergreen (no end date) never swept. Reads doomed rows + pre-delete redemption counts, deletes, best-effort Edge Config resync. Redemption history survives via `coupon_redemption` ON DELETE SET NULL + preserved `code`.
- [x] **Auto going forward:** wired into `ingest/poll.ts` (hourly `wws-poll`) in a non-fatal try/catch — no new launchd job. Plus `npm run sweep-coupons` CLI.
- [x] **First cleanup ran:** 27 dead weekend codes removed (June–Aug 2 weekends); 4 that had been redeemed (TM-SAT-JUN27-25, FS-SUN-JUL12-25, TM-SAT-AUG1-60, TM-SUN-AUG2-60) kept their redemptions in Coupon Tracking. Backup of all 27 rows at `client/comms/attachments/2026-08-04-coupons-redesign/swept-campaign-coupons-backup.sql`.
- [x] Verify: `npm run build` clean, **206 unit tests**. CLI proven end-to-end on a throwaway expired coupon (removed 1, live 12 untouched). Prod :18794 coupons page: 12 live, no hidden footnote (27 swept), get_metrics 401.
- [ ] **Still open on DREW-52 (later PRs):** Who?/Uses? columns + generator page + booking-site enforcement (email-restrict stateless; one-time-use best-effort, hard version needs Andrew); Redemptions per-coupon drill-down + toggle rename (Active Coupons · Redemptions · Generate).

## Feedback Round 92 (2026-08-04) — Drew (same msg): Who?/Uses? columns + at-checkout email enforcement (DREW-52 part 3)

DASHBOARD PR #122 (squash `d66f0b4`) + BOOKING-SITE PR #118 (squash `8c8d7b0`). Ticket **DREW-52** (same). Comms `client/comms/2026-08-04-drew-coupons-system-redesign.md`. Paid window active, armed=ON. First slice to touch the coupon schema + the booking site → email-restrict is stateless (no coupling); one-time-use hard enforcement SOFT-escalated to Andrew (architecture, OPEN).

- [x] **Dashboard:** migration **0019** adds `coupon.restricted_email` + `coupon.max_uses` (applied to live `wws` as role `pip` — coupon table is `pip`-owned). `lib/coupons.ts` parse/create/PUT; `CouponRow` + `COUPON_SELECT` carry them + a redemption-count subquery; `lib/coupons-classify.ts` evergreen now also requires `restricted_email IS NULL` (a bound no-expiry code drops OUT of Evergreen); `components/coupon-form.tsx` "Who can use it" + Uses toggle (Unlimited/One-time/Custom); `components/coupons-table.tsx` centered **Who?** + **Uses?** cols; agent `create_coupon`/`list_coupons`/`capabilities` expose them; `lib/coupons-wire.ts` emits both; `lib/acuity-ingest.ts` best-effort deactivates a code once redemptions reach `max_uses`. 215 unit tests.
- [x] **Booking site:** `api/_lib/coupons.js validateCouponAgainst` gains an email gate after the validity window (unbound codes hit zero new logic). Email threaded via `api/create-checkout.js` (comp check ~L146 + paid path ~L574), `api/validate-coupon.js`, `scripts/booking-flow.js`. 12 coupon assertions; integration dry-run through the real handler PASSED; live prod regression clean (unbound WW10 still validates).
- [x] **SOFT escalation raised (OPEN, on Andrew):** hard one-time-use at checkout would couple booking→mini. `esc-hard-one-time-use-coupon-enforcement-would-couple-booking-ch-architecture`. Shipped best-effort.
- [x] Verify: dashboard prod :18794 (agent 401 not 503; `list_coupons` SHARON200 redeemedCount=1; Who?/Uses? render). Booking-site live regression clean. Confirmed live to Drew (`19fcd2720989372e`).
- [ ] **Still open on DREW-52:** Part 4 = Redemptions per-coupon drill-down + Generate page + toggle rename (Active Coupons · Redemptions · Generate). Plus follow-up batch DREW-53 (boycott block-list, green evergreen styling, generator evergreen/standard picker).

## Feedback Round 93 (2026-08-04) — Drew (msg 19fcd11ae08406fe): three-surface structure + green evergreen + Generate page (DREW-52 part 4 + DREW-53 items 2/3)

DASHBOARD PR #123 (squash `e4a9a2e`). Tickets **DREW-52** (part 4) + **DREW-53** (new, items 2+3). Comms `client/comms/2026-08-04-drew-coupons-boycott-green-generator.md`. Paid window active, armed=ON. Dashboard-only UI → no hard gate, pre-authorized fast path. First slice of Drew's follow-up batch.

- [x] **Three surfaces** (`components/sub-tabs.tsx`): Coupons sub-tabs renamed **Active Coupons · Redemptions · Generate**. Routes unchanged (`/coupons`, `/coupons/tracking`, new `/coupons/generate`) so deep links + redemption history survive.
- [x] **Generate page** (`app/coupons/generate/page.tsx` + `components/coupon-generate.client.tsx`) — full builder replacing the cramped New Coupon dialog. Opens with an **Evergreen/Standard picker** (DREW-53 item 3); reuses `CouponForm` via a new `kind` prop (Evergreen hides + forces an open-ended window; Standard shows the date grid; dialog path backward-compatible). Active Coupons header "New coupon" now links here.
- [x] **Green evergreen styling** (DREW-53 item 2, `components/coupons-table.tsx`): Evergreen section gets a dark-green perimeter, its rows a light-green background — desktop table + mobile cards, columns still centered.
- [x] Verify: `npm run build` clean, **215 unit tests**. Seed server :18993 screenshotted (green Evergreen zone, Generate picker, evergreen form with dates hidden + green note). **Prod-verified on :18794** (all three routes 200, metrics 401 not 503; served HTML carries the new labels + green classes + generate link). Confirmed live to Drew (`19fcd34dfe6b0028`).
- [ ] **Still open:** DREW-52 Part 4 Redemptions rebuild (per-coupon aggregate + drill-down); DREW-53 item 1 (boycott block-list, dashboard migration 0020 + booking-site enforcement).

## Feedback Round 94 (2026-08-04) — Drew (msg 19fcd11ae08406fe): Redemptions rebuild — per-coupon aggregate + drill-down (DREW-52 part 4, COMPLETES DREW-52)

DASHBOARD PR #124 (squash `c00f875`). Ticket **DREW-52** (part 4 — now **done**). Comms `client/comms/2026-08-04-drew-coupons-boycott-green-generator.md`. Paid window active, armed=ON. Dashboard-only read-lens rebuild → no hard gate.

- [x] **Redemptions = one aggregate row per redeemed coupon** (`components/coupon-tracking.client.tsx`): columns **Uses · Total claimed · Powdersville · Taylor's Mill · Avg session · Event / Photo** (Powdersville first). Click a coupon → **dialog** with every individual person who redeemed it (who / when / session / studio / discount).
- [x] **Reconciles with the KPIs** — the aggregate is built from the redemption LEDGER, not `FROM coupon`, so a code whose coupon was swept still shows its history. A coupon-table aggregate silently undercounted by exactly the 4 swept codes' redemptions ($485 KPI vs $293 table); the ledger source ties the table to the KPIs (8 uses / $485.00). `lib/coupons-tracking.ts` redemption rows gained booking location-slug / duration / is_event to compute the splits.
- [x] Verify: `npm run build` clean, **215 unit tests**. Aggregate SQL run directly on live `wws`; live-DB seed server :18993 screenshotted (7 codes incl. 4 swept with "—" discount, table totals = KPI 8 uses / $485.00, drill-down opens SHARON200 → Denise Ko's session). **Prod-verified :18794** (all 7 codes, 8 uses, $485.00, metrics 401 not 503). Confirmed live to Drew.
- [x] **DREW-52 COMPLETE** — all four parts shipped + live + confirmed.
- [ ] **Still open (DREW-53 item 1):** boycott block-list — per-coupon email/phone block, red, editable on existing codes + generator, enforced at checkout. Dashboard migration 0020 + booking-site PR. Next slice.

## Feedback Round 95 (2026-08-04) — Drew (msg 19fcd5a8d5c6c6e8): boycott + Who? email/phone + drop New-coupon button + Redemptions inline (DREW-53 batch 3, COMPLETES DREW-53)

DASHBOARD PRs **#125** (boycott + Who? parity + button, squash `7a30b4d`) & **#126** (Redemptions inline, squash `93993cd`) + BOOKING-SITE PR **#119** (checkout enforcement, squash `3bf1c0c`). Ticket **DREW-53** (now **done**). Comms `client/comms/2026-08-04-drew-coupons-batch3-refinements.md`. Paid window active, armed=ON. Dashboard UI + booking enforcement, Drew self-authorizes (WWS policy) → fast path, no hard gate.

- [x] **Boycott (item 1), reshaped to a section inside the form** (`components/coupon-form.tsx`): a **RED** block-list box on every coupon + the Generate page, editable on existing codes. Emails and/or phone numbers, one per line. Migration **0020** adds `coupon.allowed_contacts` / `coupon.blocked_contacts` `text[]` (normalized: email lowercased, phone digits-only) — applied to live `wws` as role `pip`. `restricted_email` (0019) superseded + left dormant. Table shows a red dot on a boycotted code (`components/coupons-table.tsx`).
- [x] **Who? parity:** "who can use it" generalized from a single email to the SAME contact-list logic as boycott — emails and/or phones, blank = anyone (`allowed_contacts`). Shared normalize/validate in client-safe `lib/coupons-contacts.ts` (browser form + server gate, no drift). Wire (`lib/coupons-wire.ts`) emits `allowedContacts`/`blockedContacts`; agent API `create_coupon`/`list_coupons`/`capabilities` carry both. Fixed a latent bug: a bare active-toggle PUT re-parsed the body and would wipe the scoping fields — now preserved.
- [x] **Removed the top-right "New coupon" button** (`app/coupons/page.tsx`) — Generate is the one build surface.
- [x] **Booking-site enforcement** (`api/_lib/coupons.js validateCouponAgainst`): after the legacy email gate, honor `allowedContacts` (allow-list) + `blockedContacts` (block-list) by booking **email OR phone** (both normalized). Block wins over allow; a barred contact gets the generic "isn't valid" (not tipped off). Threaded `phone` through `api/validate-coupon.js`, `api/create-checkout.js` (single-session comp + paid path + the cart comp pre-check that previously passed empty opts), `scripts/booking-flow.js`. A code with neither list hits zero new logic.
- [x] **Redemptions drill-down → inline, no pop-up** (`components/coupon-tracking.client.tsx`): clicking a coupon expands a panel in the table (chevron rotates), collapses on re-click — desktop expansion row + mobile inline block. Client name links to `/clients/[id]`, session links to `/bookings/[id]`, and a new **Repeat?** column shows new / active repeat / inactive repeat (`RepeatClassBadge`). `lib/coupons-tracking.ts` computes the redeemer's class via a lateral consolidated by normalized `display_name` (same rule as the Clients list, so it can't disagree with the linked profile).
- [x] Verify: `npm run build` clean; **218 dashboard unit tests** + **16 booking coupon assertions**; a DRY-RUN of the REAL `validate-coupon` handler (boycott email+phone rejected, unrelated booker comps, Who? by phone valid). Live-DB seed-smoke :18993 screenshots (RED boycott form, table red-dot, Redemptions inline expand w/ Repeat? column + links, mobile 0 overflow). **Prod-verified :18794** (metrics 401 not 503, pages 200). **Live boycott end-to-end on whitewallstudios.co** — a temp code's blocked email + phone rejected, unrelated booker valid, unbound WW10 still validates; temp code deleted.
- [x] **DREW-53 COMPLETE** — all items shipped + live.

## Feedback Round 96 (2026-08-04) — Drew (msg 19fcd94566dd4ec7): Campaigns cleanup + green/red live highlighting + 50/60 discount tiers (DREW-54)

DASHBOARD PR **#127** (squash on main). Ticket **DREW-54** (done). Comms `client/comms/2026-08-04-drew-campaigns-cleanup-discount-tiers-max-notifications.md`. Paid window active. Dashboard-only UI + discount-default change, Drew self-authorizes → fast path.

- [x] **A — Campaigns list highlighting + organize** (`lib/campaigns/liveness.ts` new + `components/campaigns-table.tsx` + `app/campaigns/page.tsx`): pure `campaignLiveness(c, today)` → live / pending / dead (acted-on + weekend-not-past = live; terminal state or past weekend = dead; future forecast/proposal = pending; target_date = the Saturday, so codes read live through Sunday). Rows tint **green** (live) / **light red** (no longer live), neutral for pending, on desktop + mobile; live campaigns **grouped at the top** via a composite sort key; a **Live now / No longer live legend** on the page.
- [x] **B — discount tiers** (`lib/campaigns/types.ts` `PHASE1_DISCOUNT` 25→**50**; `lib/campaigns/escalate.ts` `FRIDAY_DISCOUNT` 50→**60**): Tuesday recommendation 50%, Friday escalation 60%. Defaults only — mints/sends nothing (approve + send stay human), so future proposals/escalations use the new tiers; existing campaign rows keep their stored percent_off.
- [x] Verify: `npm run build`; **224 unit tests** (6 new liveness; escalate/qualify tier expectations updated). Live-DB seed-smoke screenshots desktop + mobile — the one currently-live weekend (Aug 8–9) is green + top, past/skipped rows light red, legend renders, mobile 0 horizontal overflow. **Prod-verified :18794** (campaigns 200, metrics 401). Confirmed live to Drew (`19fcda80431f4bb3`).
- [ ] **Surfaced, separate (DREW-55):** mirror Watson's owner-SMS notifications to Max (803-682-5691) directly and/or via Fox. Building the direct-to-Max mirror next; Fox routing offered to Drew as the alternative.
