# WhiteWall Site Revisions — Status Checklist

Source: "WhiteWall Site Review — Cleaned Version" PDF from Drew

---

## Home Page — NEW

- [ ] **Video hero homepage** — One single video silently on replay, with text "WhiteWall Studios and Events" and a "Book Now" button. *Needs: Drew to specify which video. We have 9 `.mov` files in `client/photos/Final Content Organized/Video Drafts/` but none is clearly "the" homepage video. Need to ask Drew.*

## Home Page — CURRENT

### Mobile Layout
- [x] Add divider between the two location options that says "Choose Your Location"
- [x] Change button text to "Powdersville Location"
- [x] Change button text to "Taylors Mill Location"

### From Our Studios Section — Photo Gallery
- [x] Photos appear in completely random order (Fisher-Yates shuffle)
- [ ] Include all photos from the old website gallery (Taylors Mill) — *Homepage gallery only has 6 photos. Should include more from `images/gallery/` and `images/taylors-mill/`*
- [ ] Include all photos from Google Drive for Powdersville — *Homepage gallery only has 3 PV photos. More available in `images/powdersville/`*

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
- [ ] Include literally every photo we have — *Gallery has many but not all. Missing some from `images/powdersville/` (v2-2, v2-8, v2-11, v2-15, v2-24, v2-26, v1-32 thru v1-36, v1-6) and `images/taylors-mill/` (many studio/still photos not in gallery)*

### Google Reviews Carousel
- [x] Carousel section exists under the gallery on the home page
- [x] Mix reviews from both TM and PV locations
- [x] 5-star reviews only display
- [ ] Reviews are placeholder — *Need Puppeteer scrape of real Google reviews to replace*

---

## Powdersville Location Page

### Host Your Next Event Section
- [x] Replace "Brand Activations" with "Workout Classes"

### Overall Tone Reminder
- [ ] PV should feel like the "no-brainer option" — *Subjective tone review needed. Current copy is factual but doesn't strongly push PV as the clear upgrade. May need copy pass.*

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
- [ ] "Add All Backdrops" option uses photo showing all backdrops from Google Drive — *Photo exists at `client/photos/Final Content Organized/Backdrops/All Backdrops.png`, needs to be copied to `images/` and referenced in config*

### Lighting Rental
- [x] Description updated
- [ ] Add a carousel-style "Add to Booking" card with close-up photo — *Currently a simple toggle button. PDF wants carousel card layout like backdrops. Photos available in `client/photos/Final Content Organized/Gear Rentals/`*

### Rolling Walls
- [x] Wall 1: Layered, Hallowed, Squared Arch
- [x] Wall 2: Small Shelves
- [x] Wall 3: Layered, Curved Arch
- [x] Wall 4: Picture Frame
- [x] Wall 5: Three Simple Walls — Increasing Plain Arch Pack
- [ ] Main thumbnail changed to photo showing all rolling walls — *Photos available in `client/photos/Final Content Organized/Rolling Walls/`*

### White Banquet Chairs
- [x] Keep large main photo
- [x] Carousel options: 25/50/75/100 chairs (tier type in config)
- [ ] Use multiple photos from Google Drive (chairs on dolly, individual chairs) — *Photos available in `client/photos/Final Content Organized/Chair Rental/`*

### 8ft Fold Out Tables
- [x] Renamed from "8ft Folding Tables" to "8ft Fold Out Tables"
- [x] Description: "Tables are one solid structure with no crease in the middle. The legs simply fold out."
- [x] "All 10 tables" option added
- [ ] Use a plain table photo from Google Drive — *Photos available in `client/photos/Final Content Organized/Table Rental/`*

### TV Rental
- [x] Description: "4K smart TV with every HDMI connecting cable imaginable."
- [ ] Use a wide photo — *Photos available in `client/photos/Final Content Organized/TV Rental/`*

### PA System
- [x] Description: "Large speaker with aux cable to connect to any phone, with wired microphone and stand."
- [ ] Use the photo with Drew holding the microphone — *Photos available in `client/photos/Final Content Organized/PA System Rental/`*

---

## Taylors Mill Page

### Tone Reminder
- [ ] PV should feel like the "clear upgrade" without trashing TM — *Same as PV tone note. Subjective copy review needed.*

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

## Summary

**Done: 62 items**
**Remaining: 12 items**

### Remaining items breakdown:

| # | Item | Blocker |
|---|------|---------|
| 1 | Video hero homepage | Need Drew to specify which video |
| 2 | Homepage gallery — add all TM photos | Code change (add more `<a>` elements) |
| 3 | Homepage gallery — add all PV photos | Code change |
| 4 | Gallery page — include every photo | Code change |
| 5 | Real Google reviews (replace placeholders) | Puppeteer scrape needed |
| 6 | PV tone — "no-brainer option" copy pass | Subjective copy review |
| 7 | Backdrops — all-backdrops photo from Drive | Copy `All Backdrops.png` to images/ |
| 8 | Lighting — carousel-style card layout | Code change + photo from Drive |
| 9 | Rolling walls — main photo showing all walls | Photo from Drive |
| 10 | Chairs — dolly/individual photos | Photos from Drive |
| 11 | Tables — plain table photo from Drive | Photo from Drive |
| 12 | TV/PA — specific photos from Drive | Photos from Drive |

Items 7-12 are all "copy photo from `client/photos/` to `images/` and update config" — can be done in one commit once we identify the right photos.
