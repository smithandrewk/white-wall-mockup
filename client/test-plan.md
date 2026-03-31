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

**Expected:**
- Redirect to `/booking-confirmation`
- Acuity appointment created (check dashboard)
- Acuity confirmation email received at the email entered
- QBO invoice created and marked paid (check QBO → Invoices)
- No cleaning buffer block (no cleaning fee on basic booking)
- No owner notification (< 35 participants)

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

**Expected:**
- Redirect to `/booking-confirmation`
- Acuity appointment on TM calendar (ID 6252295)
- Acuity confirmation email with TM access codes + TM YouTube links
- QBO invoice for $110, marked paid
- No event option available (TM doesn't support events)
- No rolling walls, chairs, tables, TV, PA in add-ons step

**Status:** NOT TESTED

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
   - Add 1 rolling wall (e.g., Wall 2, $30)
6. Pick date/time, click "Pay & Book"
7. Complete sandbox payment

**Expected:**
- Square checkout shows itemized: $200 session + $125 lighting + $30 backdrops + $30 wall = $385
- Acuity appointment has addon IDs: 6723268 (lighting), 6840263 x2 (backdrops), 6840265 (wall)
- Acuity notes include backdrop colors and wall selection
- QBO invoice total matches (NOTE: will show $360 not $385 because Acuity lighting is $100 not $125 — known mismatch, Drew needs to fix)
- QBO invoice marked paid

**Status:** NOT TESTED

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

**Expected:**
- Event description textarea appears (no yellow border, < 35)
- Food/drinks checkbox appears (PV event only)
- Square checkout: $350 + $100 chairs + $30 tables = $480
- Acuity notes include: event intent, food/drinks = yes, participant count
- No owner notification (< 35)
- No cleaning fee
- No cleaning buffer block

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

**Expected:**
- Event description textarea has blue border
- Cleaning fee warning text appears
- Acknowledgment checkbox required
- Order summary shows: $0 cleaning fee line with "we will be in touch" note
- Square checkout does NOT include cleaning fee (it's $0)
- Owner notification email sent to Drew (40 >= 35)
- No cleaning buffer block ($0 cleaning fee)

**Status:** NOT TESTED

---

### T6: PV Event Booking (50+ participants — auto cleaning fee)

**Steps:**
1. `/book-powdersville` → 4 hours → Event Booking
2. Enter 60 participants
3. Fill all fields, check acknowledgment
4. Pay

**Expected:**
- $150 cleaning fee auto-added to order summary
- Square checkout includes $150 cleaning fee line item
- Owner notification email sent (CAPACITY ALERT)
- Acuity notes include cleaning fee info
- 2.5hr cleaning buffer block created on Acuity calendar after session end time
- QBO invoice includes cleaning fee

**Status:** NOT TESTED

---

### T7: PV Event Booking (150+ participants — blocked)

**Steps:**
1. `/book-powdersville` → 4 hours → Event Booking
2. Enter 160 participants

**Expected:**
- Popup: "cannot host more than 150 people total, including vendors and contractors"
- Cannot proceed with booking

**Status:** NOT TESTED

---

### T8: PV 1hr Event Attempt (should be blocked)

**Steps:**
1. `/book-powdersville` → 1 hour
2. Try to select "Event Booking"

**Expected:**
- Screen shakes
- Popup: "Event bookings are only for 2+ hour sessions. Select a longer duration of time."
- Cannot proceed as event

**Status:** NOT TESTED

---

### T9: TM 50+ Participants (hard cap)

**Steps:**
1. `/book-taylors-mill` → any duration
2. Enter 55 participants in intake

**Expected:**
- Popup about TM capacity
- Participant count clamped to 50
- Cannot exceed 50

**Status:** NOT TESTED

---

### T10: PV Full Day Booking (5 AM lock)

**Steps:**
1. `/book-powdersville`
2. Select "Full day (5am–11pm access)" ($980)
3. Proceed to schedule step
4. Pick a date

**Expected:**
- Only one time slot shown: 5:00 AM
- No other times available
- Booking creates appointment at 5 AM

**Status:** NOT TESTED (bug was fixed but never verified end-to-end)

---

### T11: PV Photo/Video Session (50+ participants — cleaning fee popup)

**Steps:**
1. `/book-powdersville` → 2 hours → Photo/Video Session
2. Enter 55 participants

**Expected:**
- Cleaning fee popup ($150)
- $150 auto-added to order summary
- Cleaning buffer block created after session
- Owner notification sent

**Status:** NOT TESTED

---

### T12: Add-On "All" Options

**Steps:**
1. `/book-powdersville` → 2 hours
2. Add-ons:
   - "All Backdrops" ($50)
   - "All Rolling Walls" ($70)
   - "All 10 Tables" ($150 = 10 × $15)

**Expected:**
- Square checkout: $200 + $50 + $70 + $150 = $470
- Acuity addons: 6840261 (all backdrops), 6840264 (all walls), 6840275 ×10 (tables)
- Acuity notes list all backdrops and all walls

**Status:** NOT TESTED

---

### T13: Square Payment Decline

**Steps:**
1. Complete booking flow through to Square checkout
2. Use decline card: `4000 0000 0000 0002`

**Expected:**
- Square shows payment declined
- No Acuity appointment created
- No QBO invoice
- Customer can retry with valid card

**Status:** NOT TESTED

---

### T14: Booking Abandonment (leave Square page)

**Steps:**
1. Complete booking flow through to Square checkout
2. Close the browser tab / navigate away

**Expected:**
- Nothing happens — no appointment, no invoice, no email
- Slot remains available for others

**Status:** NOT TESTED

---

### T15: Mobile Safari (iPhone)

**Steps:**
1. Open `/book-powdersville` on iPhone Safari
2. Complete full booking flow

**Verify:**
- Duration bubbles render and tap correctly
- Session type selector works
- Contact form keyboard doesn't obscure fields
- Calendar picker scrolls and dates are tappable
- Time slots render and are tappable
- Add-on carousels swipe correctly
- Order summary updates live
- "Pay & Book" button works
- Square checkout page loads and accepts payment
- Redirect back to confirmation works

**Status:** NOT TESTED

---

### T16: Confirmation Email Content

**Steps:**
1. Complete any booking with a real email address
2. Check inbox

**Verify:**
- Email arrives within 1 minute
- Correct location name and address
- Correct date/time
- Access codes present (lockpad, door, lighting case for TM)
- YouTube guide links work
- Change/Cancel link works
- Calendar add links work (iCal, Google)

**Status:** PASS for PV (2026-03-31) — email received with correct content. TM NOT TESTED.

---

### T17: QBO Invoice Auto-Mark Paid

**Steps:**
1. Complete any booking
2. Check QBO within 30 seconds

**Verify:**
- Invoice exists for the customer
- Balance is $0 (paid)
- Payment note says "Auto-recorded by WhiteWall booking system"

**Status:** PASS (2026-03-31) — verified via debug trace, payment #6459

---

### T18: Square Production Payment

**Steps:**
1. Set `SQUARE_ENVIRONMENT=production`, `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` to production values
2. Complete booking with real card
3. Verify payment appears in Square Dashboard

**Expected:**
- Real charge on card
- Square Dashboard shows transaction
- Callback receives orderId, verifies order state = COMPLETED
- Acuity appointment created
- QBO invoice marked paid

**Status:** BLOCKED — waiting on Drew for production credentials

---

## Summary

| Test | Description | Status |
|------|-------------|--------|
| T1 | PV basic booking | PASS |
| T2 | TM basic booking | NOT TESTED |
| T3 | PV booking + add-ons | NOT TESTED |
| T4 | PV event < 35 ppl | NOT TESTED |
| T5 | PV event 35-49 ppl | NOT TESTED |
| T6 | PV event 50+ ppl | NOT TESTED |
| T7 | PV event 150+ blocked | NOT TESTED |
| T8 | PV 1hr event blocked | NOT TESTED |
| T9 | TM 50+ hard cap | NOT TESTED |
| T10 | PV full day 5 AM lock | NOT TESTED |
| T11 | PV photo/video 50+ ppl | NOT TESTED |
| T12 | Add-on "all" options | NOT TESTED |
| T13 | Square decline card | NOT TESTED |
| T14 | Booking abandonment | NOT TESTED |
| T15 | Mobile Safari | NOT TESTED |
| T16 | Confirmation email | PASS (PV only) |
| T17 | QBO auto-mark paid | PASS |
| T18 | Square production | BLOCKED |

**Critical before go-live: T2, T3, T18**
**Important before go-live: T15**
**Nice-to-have: T4-T14, T16 (TM)**
