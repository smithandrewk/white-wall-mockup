# Acuity Integration — Technical Reference

Updated: 2026-03-17

## Architecture

```
Custom booking UI (whitewallstudios.co)
  → Vercel serverless functions (proxy)
    → Acuity API (availability, appointment creation)
      → Acuity's Square payment page (confirmationPagePaymentLink)
        → Customer pays → Acuity handles confirmation + email
```

No separate Square Developer App. No payment data touches our server.

## Booking Flow

| Step | What | Where |
|------|------|-------|
| 1. Timing | Pick duration (shows price) | Our UI |
| 2. Details | Contact, intake form, T&C | Our UI |
| 3. Waiver | Liability waiver + e-signature | Our UI |
| 4. Add-ons | Backdrops, lighting, walls, etc. | Our UI |
| 5. Schedule & Pay | Calendar → time → order summary | Our UI |
| 6. Verify | `POST /api/verify-availability` | Serverless |
| 7. Create | `POST /api/create-appointment` (noPayment) | Serverless → Acuity |
| 8. Pay | Redirect to `confirmationPagePaymentLink` | Acuity (Square) |
| 9. Done | Acuity sends confirmation email | Acuity |

## Server-Side Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/availability-dates` | GET | Proxy `GET /availability/dates` with timezone |
| `/api/availability-times` | GET | Proxy `GET /availability/times` with timezone |
| `/api/verify-availability` | POST | Check if a specific datetime is still open |
| `/api/create-appointment` | POST | Create unpaid appointment, return payment URL |

All endpoints validate `appointmentTypeID` against a hardcoded allowlist of 12 known IDs.

## Configuration

### Env Vars (Vercel — already set)

| Variable | Value | Source |
|----------|-------|--------|
| `ACUITY_USER_ID` | `36967128` | Acuity > Integrations > API |
| `ACUITY_API_KEY` | (encrypted) | Acuity > Integrations > API |

### Client Config

`scripts/booking-config.js`:
- `integrations.acuity.mode` = `"api"`
- `integrations.acuity.enabled` = `true`
- `integrations.square.enabled` = `true` (payment via Acuity's Square)
- Each duration has `price` and maps to an Acuity `appointmentTypeId`

## After Drew Creates New Add-Ons

1. Run: `curl -u "36967128:API_KEY" "https://acuityscheduling.com/api/v1/appointment-addons"`
2. Map new IDs into `ACUITY_ADDON_IDS` in `api/_lib/acuity.js`
3. Update `buildAcuityAddonIDs()` to pass the new IDs
4. Test: create appointment with add-ons, verify price on payment page matches
5. Deploy

## Verification Checklist

- [ ] All 12 appointment type IDs match Acuity dashboard
- [ ] Prices on our site match Acuity's appointment type prices
- [ ] Availability dates/times match what Acuity's own scheduler shows
- [ ] Add-on IDs are correctly mapped after Drew creates them
- [ ] Payment page shows correct total (session + all add-ons)
- [ ] Appointment notes contain backdrop colors, wall numbers, etc.
- [ ] Intake form fields (business, participants, Instagram) pass through
- [ ] T&C checkboxes pass through for both locations
- [ ] Full flow works on mobile Safari
- [ ] Both locations tested end-to-end

## Undocumented API Behavior

See `api/_lib/acuity.js` header for full documentation. Key items:

1. `noPayment: true` — creates unpaid appointment (not in official docs)
2. `confirmationPagePaymentLink` — payment URL in appointment responses (not in docs)
3. Duplicate `addonIDs` — same ID × N charges N × price (not in docs, tested)
4. `fields` accepts `{id, value}` — docs mention `label` but ID-based works

## Known Edge Case: Unpaid Appointments

**Status: Deferred — monitoring, not auto-cancelling.**

When `POST /api/create-appointment` runs, it creates a real appointment with `noPayment: true`. This holds the slot on Drew's calendar. If the customer doesn't complete payment on Acuity's checkout page, the slot stays blocked.

**Why we're not auto-cancelling yet:**
- At ~50 bookings/month, concurrent conflicts are extremely unlikely
- Acuity's payment link has NO expiry and CANNOT be invalidated (tested 2026-03-17)
- Cancelling an appointment does NOT disable the payment link
- Auto-cancel creates an edge case: customer pays on a cancelled appointment
- Better to revisit with real data if unpaid appointments become a problem

**If we need to solve it later:**
1. Vercel cron that cancels unpaid appointments tagged "Booked via whitewallstudios.co" older than 30 min
2. `changed` webhook to catch any payment that lands on a cancelled appointment
3. See CLAUDE.md "Unpaid Appointment Handling" section for full analysis

**What Drew sees today:** Unpaid appointments appear in Acuity's dashboard marked as unpaid. Drew can cancel them manually if they pile up. In practice, almost everyone who reaches the payment page completes payment — they've already gone through 7 steps.

## Future Enhancements

- **Unpaid appointment cleanup:** Auto-cancel with webhook safety net (see above). Build when needed.
- **Webhooks:** Acuity supports `scheduled`, `rescheduled`, `canceled`, `changed` events. Payload is `x-www-form-urlencoded` with HMAC-SHA256 signature. Could power Slack notifications, CRM sync, or Google Calendar integration.
- **Packages/certificates:** Acuity has a package/coupon system (`certificate` param on POST /appointments). Could enable membership discounts or gift cards.
- **Client portal:** Acuity has client self-service for rescheduling/canceling. Could link from confirmation emails.
- **Blocks API:** `POST /blocks` can temporarily hold time slots. Could be used for a "reserve before paying" flow if we ever move to a separate payment processor.
