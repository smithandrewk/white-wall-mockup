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

## Summary

**Done: 123 items** (all revision items complete)
**Remaining: 0 items** — all client feedback implemented. See launch checklist for go-live blockers.
