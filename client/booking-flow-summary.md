# WhiteWall Booking Flow — Summary from Client PDF

Source: `client/Checkout Process for WhiteWall.pdf`

---

## Key Rules

- **Same hourly pricing across all locations** — no price difference for event vs non-event
- **No events at Taylor's Mill.** Events are Powdersville only. Make this crystal clear in the UI.
- **Every add-on needs a photo** in the booking interface

---

## Booking Flow Steps

### Step 1-2: Location + Date/Time Selection
Standard scheduling (likely Acuity handles this part)

### Step 3: Event Question (Powdersville Only)
> "Is this booking for an event? (If it's not a photo or video shoot, it's an event.)"
- Yes / No

### Step 4: Participant Count (Always Asked)
> "How many participants will be at your event? If this is NOT an event, type NA."
- Required field
- **Validation logic**: If user types a number but selected "No event" → prompt them to confirm it IS an event

### Step 5: Event Follow-Up (If Event = Yes)
1. **Event Description**: "What event are you hosting? Tell us about it." (text field)
2. **Cleanup Confirmation**: Checkbox acknowledging they'll reset the studio
3. **Capacity Notice**: If 50+ people, WWS team will follow up via email. Checkbox: "I have read and understand the above."
4. **Self-Service Acknowledgment**: Checkbox acknowledging fully self-service, no employees on site, setup/teardown is their responsibility

---

## Add-Ons

### Backdrops (Both Locations)
- **$50 — All Backdrops** (recommended, show first)
- **$15 — Single Backdrop**
- Users can select **multiple colors**
- Include note: "Our paper backdrops are shared between sessions, so please only roll down what you need for your shoot — we try to maximize the life of each backdrop, and brand-new backup rolls are available if the current one has reached its end."

### Lighting Rentals

**Taylor's Mill — $50**
- 2x 100W Amaran Bi-Color Lights
- 1x 200W Amaran Daylight Light
- 1x 42" Softbox
- 2x 25' Extension Cords

**Powdersville — $100**
- 1x 660W RGB Amaran Ray
- 1x 360W RGB Amaran Ray
- 1x 60" Softbox
- 1x 47" Softbox
- 2x 75' Wall-Mounted Extension Cords
- Rolling C-stands, Sandbags, Clamps

### Rolling Walls (Powdersville Only)
- **$70 — Access to All Walls** (show first)
- **$30 — Per Wall**
- Users may select **multiple walls**

### Chairs (Powdersville Only)
Padded white banquet chairs, 353 lb load capacity
- 25 chairs — $100
- 50 chairs — $190
- 75 chairs — $280
- 100 chairs — $370

### Tables (Powdersville Only)
8 ft x 30 in folding tables
- $15 per table
- Up to **10 available**

### TV Rental (Powdersville Only)
86" 4K Smart TV on rolling stand (HDMI + laptop tray)
- **$50 per booking**

### PA System (Powdersville Only)
Wired microphone + speaker
- **$40 per booking**

---

## Architecture Implications

This is NOT a simple Acuity embed. The booking flow needs:
1. **Custom front-end** — multi-step form with conditional logic (event detection, participant validation)
2. **Add-on selection UI** — visual cards with photos, quantity selectors, location-aware filtering
3. **Acuity integration** — for calendar availability and time slot selection
4. **Payment** — Square or Stripe for add-on charges on top of the booking fee
5. **Mobile-first** — Drew specifically said to prioritize mobile UX

Reference site for checkout UX: https://studione.com.au/
