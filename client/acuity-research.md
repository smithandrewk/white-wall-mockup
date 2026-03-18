# Acuity Scheduling Research

Date: 2026-03-14 (updated 2026-03-17)

## Account Details

- **Owner ID:** 24638772 (used in scheduler URLs)
- **User ID:** 36967128 (used for API auth — this is the subuser/API user)
- **Current Plan:** Business (via Squarespace) — `can_use_api: true`
- **API Access:** Working. Full API available.
- **Payment Processor:** Square (connected through Acuity dashboard)
- **Admin Email:** drewshahoud@gmail.com
- **Timezone:** America/New_York
- **Calendars:** 2 (Powdersville: 6255578, Taylor's Mill: 6252295)

## Integration Approach: Full API

~~We're using the direct scheduling link approach rather than iframe or API embed.~~

**Updated:** Drew upgraded to a plan with API access. We now use the full Acuity API for a completely custom booking experience. The customer never leaves whitewallstudios.co until the final payment step, which redirects to Acuity's Square checkout page.

### API Endpoints We Use

| Endpoint | Purpose |
|----------|---------|
| `GET /availability/dates` | Available dates for a month + appointment type |
| `GET /availability/times` | Time slots for a date + appointment type |
| `POST /appointments` | Create booking (with `noPayment: true`) |
| `GET /appointment-types` | Verify type IDs and prices |
| `GET /appointment-addons` | Get add-on IDs for mapping |
| `GET /forms` | Get intake form field IDs |
| `GET /me` | Account info and plan verification |

### What We CAN Do With API

- Fetch real-time availability (dates + times)
- Build a fully custom calendar/time picker on our site
- Create appointments with all data pre-filled
- Pass add-on IDs for correct pricing
- Fill intake form fields programmatically
- Get a payment link to Acuity's Square checkout

### What We CANNOT Do With API

- Create or modify add-ons (GET only)
- Override appointment prices
- Update add-ons after appointment creation
- Process payment directly (must redirect to Acuity's payment page)
- Create appointment types (403 on current plan)

## Appointment Type IDs & Pricing (verified via API 2026-03-17)

All types have 15min padding before and after.

### Powdersville (Calendar ID: 6255578)

| Duration | Price | Type ID | Add-on IDs |
|----------|-------|---------|-----------|
| 1hr | $130 | 89113040 | 6723268, 2592725 |
| 2hr | $200 | 89113116 | 6723268, 2592725 |
| 3hr | $270 | 89114444 | 6723268, 2592725 |
| 4hr | $350 | 89114517 | 6723268, 2592725 |
| 6hr | $500 | 89114539 | 6723268, 2592725 |
| Full Day (18hr) | $980 | 89114581 | 6723268, 2592725 |

### Taylor's Mill (Calendar ID: 6252295)

| Duration | Price | Type ID | Add-on IDs |
|----------|-------|---------|-----------|
| 1hr | $110 | 38342199 | 2387016, 2592725 |
| 2hr | $170 | 28312352 | 2387016, 2592725 |
| 3hr | $230 | 28312534 | 2387016, 2592725 |
| Half Day (4hr) | $280 | 28312549 | 2387016, 2592725 |
| 6hr | $420 | 36030598 | 2387016, 2592725 |
| Full Day (12hr) | $550 | 28312569 | 2387016, 2592725 |

## Current Add-Ons in Acuity (as of 2026-03-17)

| ID | Name | Price | Assigned To |
|----|------|-------|------------|
| 6723268 | Lighting Package (2 Fixtures) | $100 | PV types |
| 2387016 | Lighting Rental | $50 | TM types |
| 2592725 | Paper Backdrop | $20 | All types |

### Add-Ons Drew Needs to Create

| Add-on | Price | Assign to |
|--------|-------|-----------|
| All Backdrops | $50 | All 12 types |
| Single Backdrop | $15 | All 12 types |
| Lighting — Powdersville *(update existing from $100)* | $125 (confirm with Drew) | 6 PV types |
| All Rolling Walls | $70 | 6 PV types |
| Single Rolling Wall | $30 | 6 PV types |
| 25 Chairs | $100 | 6 PV types |
| 50 Chairs | $190 | 6 PV types |
| 75 Chairs | $280 | 6 PV types |
| 100 Chairs | $370 | 6 PV types |
| 8ft Folding Table | $15 | 6 PV types |
| 86in Rolling TV | $50 | 6 PV types |
| PA System | $40 | 6 PV types |

After creation: run `GET /appointment-addons` to get new IDs and update `api/_lib/acuity.js`.

## Intake Form Fields (from GET /forms, verified 2026-03-17)

### Form 1935872: Photographer/Videographer Intake Form (all 12 types)

| Field ID | Name | Required |
|----------|------|----------|
| 10764621 | Business Legal Name | No |
| 10764623 | Total Number of Participants | Yes |
| 10764624 | Instagram Handle | No |
| 10947712 | Will you read the entire email... | Yes |
| 13905723 | (unnamed checkbox) | No |

### Form 3189363: Terms & Conditions — Powdersville (6 PV types)

| Field ID | Name | Required |
|----------|------|----------|
| 18026152 | I have read, completely understand, and agree... | Yes |

### Form 1935852: Terms & Conditions — Taylor's Mill (6 TM types)

| Field ID | Name | Required |
|----------|------|----------|
| 18026602 | I will only walk to WhiteWall Studios... (see #16) | Yes |
| 10764522 | I have read, completely understand, and agree... | Yes |

## Open Questions

1. **PV Lighting price:** Drew's original PDF says $100, our site says $125. Acuity currently has $100. Need to confirm which is correct before updating.
