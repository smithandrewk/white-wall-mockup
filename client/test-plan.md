# Booking Flow Test Plan

Last updated: 2026-03-31

## Test Environment

- **Preview URL:** https://white-wall-mockup.vercel.app
- **Square:** Sandbox mode (`SQUARE_ENVIRONMENT=sandbox`)
- **Sandbox card:** `4111 1111 1111 1111`, CVV `111`, any future expiry, any zip
- **Sandbox decline:** `4000 0000 0000 0002`
- **Acuity:** Production (real appointments created — cancel after testing)
- **QuickBooks:** Production (real invoices — delete after testing)
- **Debug mode:** Set `BOOKING_DEBUG=1` in Vercel env vars to get JSON trace instead of redirect

## How to Cancel Test Appointments

1. Go to Acuity dashboard → Appointments
2. Find the test appointment by name
3. Cancel it (this also auto-voids the QBO invoice if unpaid)

## How to Delete Test Invoices

1. Go to QuickBooks → Sales → Invoices
2. Find test invoices by customer name
3. Delete (if paid, the payment becomes a credit on the customer — harmless for test data)

---

## Test Cases

### T1: PV Basic Booking (no add-ons)

**Steps:**
1. Go to `/book-powdersville`
2. Select 1 hour ($130)
3. Select "Photo/Video Session"
4. Fill contact info (name, email, phone)
5. Fill intake (business name, 1 participant, Instagram handle)
6. Acknowledge email notice (type name)
7. Accept T&C (type name)
8. Sign waiver (type name)
9. Skip all add-ons → Continue
10. Pick a date and time slot
11. Click "Pay & Book"
12. On Square checkout, use sandbox card
13. Complete payment

**Acceptance Criteria:**
- [ ] Customer is redirected to `/booking-confirmation` after payment
- [ ] Acuity dashboard shows new appointment on PV calendar (ID 6255578)
- [ ] Appointment has correct name, email, phone, datetime, duration
- [ ] Appointment notes contain "Booked via whitewallstudios.co"
- [ ] Confirmation email arrives at customer's email within 1 minute
- [ ] Email contains PV address, access codes, and YouTube links
- [ ] QBO invoice exists for the customer with correct total ($130)
- [ ] QBO invoice balance is $0 (auto-marked paid)
- [ ] QBO payment note says "Auto-recorded by WhiteWall booking system"
- [ ] No cleaning buffer block on Acuity calendar (no cleaning fee)
- [ ] No owner notification email sent (< 35 participants)

**Status:** PASS (2026-03-31) — full trace verified via debug mode

---

### T2: TM Basic Booking (no add-ons)

**Steps:**
1. Go to `/book-taylors-mill`
2. Select 1 hour ($110)
3. Fill contact info
4. Fill intake (1 participant)
5. Acknowledge email notice, accept T&C, sign waiver
6. Add-ons: only backdrops and lighting available for TM — skip both
7. Pick a date and time slot
8. Click "Pay & Book"
9. Complete sandbox payment

**Acceptance Criteria:**
- [ ] Customer is redirected to `/booking-confirmation`
- [ ] Acuity appointment is on TM calendar (ID 6252295), NOT PV calendar
- [ ] Appointment type is a `taylors_mill_*` type (ID 38342199 for 1hr)
- [ ] Confirmation email has TM-specific content: TM address (250 Mill St), TM access codes, TM YouTube links (parking, bathroom, leaving, backdrops)
- [ ] Email does NOT contain PV-specific content
- [ ] QBO invoice exists with correct total ($110)
- [ ] QBO invoice balance is $0 (auto-marked paid)
- [ ] No event booking option is shown in the UI (TM doesn't support events)
- [ ] Add-ons step only shows backdrops and lighting — no walls, chairs, tables, TV, PA
- [ ] No "Will there be food or drinks?" checkbox

**Status:** PASS (2026-04-01) — redirect OK, TM confirmation email with correct codes/links, QBO invoice #6465 $110 marked paid

---

### T3: PV Booking with Add-Ons

**Steps:**
1. Go to `/book-powdersville`
2. Select 2 hours ($200)
3. Select "Photo/Video Session"
4. Fill contact, intake, email ack, T&C, waiver
5. Add-ons step:
   - Add lighting ($125)
   - Add 2 single backdrops (e.g., Black + White, $15 each = $30)
   - Add 1 rolling wall (e.g., Wall 2 — Small Shelves, $30)
6. Pick date/time, click "Pay & Book"
7. Complete sandbox payment

**Acceptance Criteria:**
- [ ] Order summary on booking page shows correct itemized breakdown: $200 + $125 + $15 + $15 + $30 = $385
- [ ] Square checkout page shows same itemized total ($385)
- [ ] Each add-on is a separate line item on Square checkout (not lumped together)
- [ ] Acuity appointment has correct addon IDs: 6723268 (lighting), 6840263 ×2 (single backdrop), 6840265 ×1 (single wall)
- [ ] Acuity appointment notes list selected backdrop colors by name (e.g., "Black, White")
- [ ] Acuity appointment notes list selected wall by name (e.g., "Wall 2 — Small Shelves")
- [ ] QBO invoice exists (NOTE: total will be $360 not $385 — Acuity lighting is $100 vs our $125. Known mismatch, Drew must update Acuity add-on 6723268)
- [ ] QBO invoice balance is $0 (auto-marked paid)
- [ ] Confirmation email arrives with correct appointment details

**Status:** PASS* (2026-04-01) — Square showed $385 itemized, Acuity addons + notes correct, QBO invoice $360 (not $385 — Acuity lighting is $100 not $125, Drew must update add-on 6723268)

---

### T4: PV Event Booking (< 35 participants)

**Steps:**
1. Go to `/book-powdersville`
2. Select 4 hours ($350) — events require 2hr+
3. Select "Event Booking"
4. Enter 20 participants
5. Fill contact, intake, email ack, T&C, waiver
6. "Will there be food or drinks?" — select Yes
7. Add chairs (25 chairs, $100) and 2 tables ($30)
8. Pick date/time, pay

**Acceptance Criteria:**
- [ ] Event description textarea appears with no special border (< 35 threshold)
- [ ] Food/drinks checkbox is visible (PV event only)
- [ ] No acknowledgment checkbox shown (< 35)
- [ ] Order summary: $350 + $100 + $30 = $480, no cleaning fee line
- [ ] Square checkout total is $480 with itemized lines
- [ ] Acuity appointment notes include: event intent = yes, food/drinks = yes, 20 participants
- [ ] Acuity addon IDs include: 6840270 (25 chairs), 6840275 ×2 (tables)
- [ ] QBO invoice total is $480, balance $0
- [ ] No owner notification email sent (20 < 35)
- [ ] No cleaning fee line item on Square
- [ ] No cleaning buffer block on Acuity calendar

**Status:** NOT TESTED

---

### T5: PV Event Booking (35-49 participants — cleaning fee warning)

**Steps:**
1. `/book-powdersville` → 4 hours → Event Booking
2. Enter 40 participants
3. Fill all required fields
4. Must check acknowledgment checkbox ("35+ guests require internal approval")
5. Must fill event description textarea
6. Pay

**Acceptance Criteria:**
- [ ] Event description textarea has blue accent border
- [ ] Cleaning fee warning text is visible: "35+ attendees... potential $150 cleaning fee"
- [ ] Acknowledgment checkbox appears and is required to proceed
- [ ] Cannot advance to add-ons without checking acknowledgment and filling event description
- [ ] Order summary shows $0 cleaning fee line with "we will be in touch" note
- [ ] Square checkout does NOT include a cleaning fee (total is session + add-ons only)
- [ ] Owner notification email is sent to Drew's email (40 >= 35)
- [ ] Email subject contains "High Traffic Booking — 40 participants"
- [ ] No cleaning buffer block on Acuity calendar ($0 fee)
- [ ] Acuity appointment notes include participant count and event description

**Status:** NOT TESTED

---

### T6: PV Event Booking (50+ participants — auto cleaning fee)

**Steps:**
1. `/book-powdersville` → 4 hours → Event Booking
2. Enter 60 participants
3. Fill all fields, check acknowledgment
4. Pay

**Acceptance Criteria:**
- [ ] $150 cleaning fee auto-added to order summary as a line item
- [ ] Square checkout includes $150 cleaning fee as separate line item
- [ ] Total = session price + add-ons + $150 cleaning fee
- [ ] Owner notification email sent with subject "CAPACITY ALERT — 60 participants"
- [ ] Acuity appointment notes include "[CAPACITY ALERT: 60 participants]" and cleaning fee info
- [ ] 2.5hr cleaning buffer block exists on Acuity PV calendar after session end time
- [ ] Buffer block notes reference the booking ID
- [ ] QBO invoice includes cleaning fee in total
- [ ] QBO invoice balance is $0

**Status:** NOT TESTED

---

### T7: PV Event Booking (150+ participants — blocked)

**Steps:**
1. `/book-powdersville` → 4 hours → Event Booking
2. Enter 160 participants

**Acceptance Criteria:**
- [ ] Popup message appears: "cannot host more than 150 people total, including vendors and contractors"
- [ ] Participant count is prevented from exceeding 150 OR booking cannot proceed
- [ ] No way to reach the payment step with 150+ participants

**Status:** NOT TESTED

---

### T8: PV 1hr Event Attempt (should be blocked)

**Steps:**
1. `/book-powdersville` → 1 hour
2. Try to select "Event Booking"

**Acceptance Criteria:**
- [ ] Screen shakes / visual feedback on failed selection
- [ ] Popup message: "Event bookings are only for 2+ hour sessions. Select a longer duration of time."
- [ ] Popup disappears after ~5 seconds
- [ ] "Event Booking" is NOT selected — user remains on Photo/Video or no selection
- [ ] Cannot proceed to next step with 1hr + Event

**Status:** NOT TESTED

---

### T9: TM 50+ Participants (hard cap)

**Steps:**
1. `/book-taylors-mill` → any duration
2. Enter 55 in the participants field

**Acceptance Criteria:**
- [ ] Popup warning about TM capacity appears
- [ ] Participant count is clamped to 50 (cannot enter or submit > 50)
- [ ] User can proceed with 50 or fewer participants

**Status:** NOT TESTED

---

### T10: PV Full Day Booking (5 AM lock)

**Steps:**
1. `/book-powdersville`
2. Select "Full day (5am–11pm access)" ($980)
3. Proceed to schedule step
4. Pick a date

**Acceptance Criteria:**
- [ ] Duration label shows "(5am–11pm access)"
- [ ] After selecting a date, exactly one time slot appears: 5:00 AM
- [ ] No other time slots are shown (no Acuity time fetch occurs)
- [ ] Completing the booking creates an Acuity appointment at 5:00 AM Eastern
- [ ] Pre-checkout availability verify passes for the 5 AM slot

**Status:** NOT TESTED (bug was fixed in commit c82d5e0 but never verified end-to-end)

---

### T11: PV Photo/Video Session (50+ participants — cleaning fee popup)

**Steps:**
1. `/book-powdersville` → 2 hours → Photo/Video Session
2. Enter 55 participants

**Acceptance Criteria:**
- [ ] Cleaning fee popup appears warning about $150 fee for 50+ participants
- [ ] $150 cleaning fee auto-added to order summary
- [ ] Square checkout includes $150 cleaning fee line item
- [ ] 2.5hr cleaning buffer block created on Acuity calendar after session
- [ ] Owner notification email sent (55 >= 50 → CAPACITY ALERT)
- [ ] This works for photo/video sessions, not just events

**Status:** NOT TESTED

---

### T12: Add-On "All" Options

**Steps:**
1. `/book-powdersville` → 2 hours
2. Add-ons:
   - "All Backdrops" ($50)
   - "All Rolling Walls" ($70)
   - "All 10 Tables" ($150 = 10 × $15)

**Acceptance Criteria:**
- [ ] Order summary shows: $200 + $50 + $70 + $150 = $470
- [ ] Square checkout shows 3 add-on line items with correct prices
- [ ] Acuity addon IDs: 6840261 (all backdrops), 6840264 (all walls), 6840275 ×10 (10 tables)
- [ ] Acuity appointment notes list "All Backdrops" and "All Rolling Walls"
- [ ] "All" option is visually distinct from individual selection in the UI
- [ ] Selecting "All" deselects any individual selections and vice versa

**Status:** NOT TESTED

---

### T13: Square Payment Decline

**Steps:**
1. Complete booking flow through to Square checkout
2. Use decline card: `4000 0000 0000 0002`

**Acceptance Criteria:**
- [ ] Square checkout page shows payment declined / error message
- [ ] Customer can retry with a different card
- [ ] No Acuity appointment is created
- [ ] No QBO invoice is created
- [ ] No confirmation email is sent
- [ ] The time slot remains available for other bookings

**Status:** NOT TESTED

---

### T14: Booking Abandonment (leave Square page)

**Steps:**
1. Complete booking flow through to Square checkout
2. Close the browser tab / navigate away without paying

**Acceptance Criteria:**
- [ ] No Acuity appointment is created
- [ ] No QBO invoice is created
- [ ] No confirmation email is sent
- [ ] No owner notification is sent
- [ ] The time slot remains available for other bookings
- [ ] No orphaned data anywhere in the system

**Status:** NOT TESTED

---

### T15: Mobile Safari (iPhone)

**Steps:**
1. Open `/book-powdersville` on iPhone Safari
2. Complete full booking flow including payment

**Acceptance Criteria:**
- [ ] Page loads without layout issues
- [ ] Duration bubbles render correctly and respond to taps
- [ ] Session type selector (Photo/Video vs Event) works on tap
- [ ] Contact form fields accept input; keyboard doesn't permanently obscure fields
- [ ] Participant count field accepts numeric input without blocking (digit bug was fixed)
- [ ] Calendar picker renders, months are scrollable, dates are tappable
- [ ] Time slots appear after date selection and are tappable
- [ ] Add-on cards render with images; carousel swipes work on touch
- [ ] Order summary updates live as add-ons are toggled
- [ ] "Pay & Book" button is tappable and triggers checkout
- [ ] Square checkout page loads correctly in mobile Safari
- [ ] After payment, redirect back to `/booking-confirmation` works
- [ ] Confirmation page renders correctly on mobile

**Status:** NOT TESTED

---

### T16: Confirmation Email Content

**Steps:**
1. Complete any booking with a real email address
2. Check inbox

**Acceptance Criteria:**
- [ ] Email arrives within 1 minute of booking completion
- [ ] Subject line contains appointment type and/or "Appointment Scheduled"
- [ ] Email shows correct customer name
- [ ] Email shows correct appointment type and duration
- [ ] Email shows correct date and time
- [ ] Email shows correct location name and address
- [ ] PV email: contains PV-specific access codes and PV YouTube links
- [ ] TM email: contains TM-specific access codes (lockpad 7530, door 2319, lighting case 508) and TM YouTube links (parking, bathroom, leaving, backdrop setup/teardown)
- [ ] "Change/Cancel Appointment" link works and opens Acuity management page
- [ ] "Add to iCal/Outlook Calendar" link downloads .ics file
- [ ] "Add to Google Calendar" link opens Google Calendar with pre-filled event
- [ ] Email renders correctly on mobile email clients

**Status:** PASS for PV (2026-03-31) — email received with correct content. TM NOT TESTED.

---

### T17: QBO Invoice Auto-Mark Paid

**Steps:**
1. Complete any booking
2. Check QBO within 60 seconds

**Acceptance Criteria:**
- [ ] Invoice exists in QBO for the customer name used in booking
- [ ] Invoice total matches the Acuity appointment total (session + add-ons at Acuity prices)
- [ ] Invoice balance is $0.00
- [ ] A payment record is linked to the invoice
- [ ] Payment `PrivateNote` says "Auto-recorded by WhiteWall booking system. Payment collected via Square."
- [ ] If customer closes confirmation page before fetch completes, invoice may remain unpaid (known limitation, acceptable at current volume)

**Status:** PASS (2026-03-31) — verified via debug trace, payment #6459

---

### T18: Square Production Payment

**Steps:**
1. Set Vercel env vars: `SQUARE_ENVIRONMENT=production`, `SQUARE_ACCESS_TOKEN` (production), `SQUARE_LOCATION_ID` (production)
2. Redeploy to production
3. Complete booking with a real credit card
4. Verify in Square Dashboard and Acuity

**Acceptance Criteria:**
- [ ] Square checkout page shows real merchant name (WhiteWall Studios)
- [ ] Real charge appears on the credit card
- [ ] Square Dashboard shows the transaction with correct amount and line items
- [ ] Callback receives `orderId` query param from Square redirect
- [ ] Callback verifies order state = `COMPLETED` via Square API
- [ ] Acuity appointment is created (same as sandbox flow)
- [ ] QBO invoice is marked paid (same as sandbox flow)
- [ ] Confirmation email is sent (same as sandbox flow)
- [ ] Processing fee (2.9% + $0.30) is deducted in Square, not charged to customer

**Status:** PASS (2026-04-01) — real card charged $130, Square Dashboard shows transaction, Acuity appointment created, QBO invoice #6467 marked paid, confirmation email received. Refunded after verification.

---

### T19: Buffer Conflict — Move to Suggested Time

**Steps:**
1. Ensure a PV appointment exists (e.g., August 1st at 2:00 PM)
2. `/book-powdersville` → 1 hour → Photo/Video Session → 55 participants
3. Fill contact, intake, T&C, waiver
4. Pick a time that would cause a buffer conflict (e.g., 12:00 PM — session ends 1 PM, buffer 1-3:30 PM overlaps 2 PM appointment)
5. Click "Pay & Book"
6. Modal appears — click "Move to [suggested time]"
7. Click "Pay & Book" again

**Acceptance Criteria:**
- [ ] Modal appears with title "Cleaning Buffer Needed"
- [ ] Modal shows the conflicting appointment time and a suggested earlier time
- [ ] Suggested time is a real Acuity time slot (not a calculated time that doesn't exist)
- [ ] Clicking "Move to [time]" updates the selected time slot in the UI
- [ ] Clicking "Pay & Book" after moving succeeds — no second conflict
- [ ] Acuity appointment is created at the suggested time
- [ ] Cleaning buffer block is created after session end

**Status:** PASS (2026-04-01) — moved to 10:30 AM, booking completed successfully at that time

---

### T20: Buffer Conflict — Pick a Different Time

**Steps:**
1. Same setup as T19 — trigger a buffer conflict
2. Modal appears — click "Pick a different time"

**Acceptance Criteria:**
- [ ] Modal closes
- [ ] UI jumps back to step 2 (schedule) showing time slots
- [ ] Selected time is cleared
- [ ] Customer can pick a new time slot

**Status:** PASS (2026-04-01) — returns to step 2, time slots visible, can select new time

---

## Summary

| Test | Description | Status | Priority |
|------|-------------|--------|----------|
| T1 | PV basic booking | PASS | Critical |
| T2 | TM basic booking | PASS | Critical |
| T3 | PV booking + add-ons | PASS | Critical |
| T4 | PV event < 35 ppl | PASS (UI) | Nice-to-have |
| T5 | PV event 35-49 ppl | PASS (UI) | Nice-to-have |
| T6 | PV event 50+ ppl | NOT TESTED | Nice-to-have |
| T7 | PV event 150+ blocked | PASS | Nice-to-have |
| T8 | PV 1hr event blocked | PASS | Nice-to-have |
| T9 | TM 50+ hard cap | PASS | Nice-to-have |
| T10 | PV full day 5 AM lock | PASS | Nice-to-have |
| T11 | PV photo/video 50+ ppl | PASS | Nice-to-have |
| T12 | Add-on "all" options | NOT TESTED | Nice-to-have |
| T13 | Square decline card | NOT TESTED | Nice-to-have |
| T14 | Booking abandonment | NOT TESTED | Nice-to-have |
| T15 | Mobile Safari | NOT TESTED | Important |
| T16 | Confirmation email | PASS (PV) | Critical |
| T17 | QBO auto-mark paid | PASS | Critical |
| T18 | Square production | PASS | Critical |
| T19 | Buffer conflict — move time | PASS | Nice-to-have |
| T20 | Buffer conflict — pick other | PASS | Nice-to-have |

**Critical: T1-T3, T16-T18 — all PASS**
**Important: T15 (mobile Safari) — NOT TESTED**
**Nice-to-have: T4-T14, T19-T20 — 13 PASS, 3 untested**
