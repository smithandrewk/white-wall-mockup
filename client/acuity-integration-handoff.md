# Booking Integration — Technical Reference

Updated: 2026-03-19

## Architecture: Block → Pay → Book

```
Custom booking UI (whitewallstudios.co)
  → POST /api/verify-availability (Acuity: slot still open?)
  → POST /api/create-checkout
      → POST /blocks (Acuity: hold the slot, no emails)
      → POST /v2/online-checkout/payment-links (Square: create hosted checkout)
  → Redirect to Square checkout page (customer pays)
  → GET /api/booking-callback (Square redirects here with orderId)
      → GET /v2/orders/{id} (Square: verify COMPLETED)
      → DELETE /blocks/{id} (Acuity: release the hold)
      → POST /appointments (Acuity: create real appointment, sends confirmation email)
  → Redirect to confirmation page
```

Two integrations on the same Square merchant account:
- **Acuity's built-in Square** — still works for direct Acuity scheduler bookings
- **Our Square Developer App** — handles payments from whitewallstudios.co

### Why Not Simpler Approaches?

| Approach | Problem |
|---|---|
| Pay via Acuity's payment page | Creating appointment triggers emails before payment |
| `noEmail: true` on appointment | Doesn't work — emails still sent (tested 2026-03-17) |
| Acuity's `confirmationPagePaymentLink` | Cannot be invalidated after cancellation |
| Block → Pay → Book | All problems solved. Blocks don't email. Square links can be deleted. |

## User Flow

| Step | What | Where | API |
|------|------|-------|-----|
| 1 | Pick duration (shows price) | Our UI | — |
| 2 | Contact info, intake form, T&C | Our UI | — |
| 3 | Liability waiver + e-signature | Our UI | — |
| 4 | Add-ons (backdrops, lighting, etc.) | Our UI | — |
| 5 | Calendar → time → order summary | Our UI | GET /api/availability-dates, times |
| 6 | "Pay & Book" clicked | Our UI | POST /api/verify-availability |
| 7 | Create block + payment link | Serverless | Acuity POST /blocks + Square POST payment-links |
| 8 | Customer pays | Square hosted page | — |
| 9 | Verify + book | Serverless | Square GET /orders + Acuity DELETE /blocks + POST /appointments |
| 10 | Done | Confirmation page | Acuity sends email |

## Server-Side Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/availability-dates` | GET | Proxy Acuity available dates |
| `/api/availability-times` | GET | Proxy Acuity available times |
| `/api/verify-availability` | POST | Check if specific datetime is still open |
| `/api/create-checkout` | POST | Create Acuity block + Square Payment Link, return checkout URL |
| `/api/booking-callback` | GET | Square redirects here: verify payment → delete block → create appointment |
| `/api/cleanup-blocks` | GET (cron) | Delete abandoned blocks + payment links older than 30 min |

## Env Vars (Vercel)

| Variable | Value | Source |
|----------|-------|--------|
| `ACUITY_USER_ID` | `36967128` | Acuity API credentials (set) |
| `ACUITY_API_KEY` | (encrypted) | Acuity API credentials (set) |
| `SQUARE_ACCESS_TOKEN` | (per environment) | Square Developer Dashboard |
| `SQUARE_LOCATION_ID` | (from Square) | Square Dashboard > Locations |
| `SQUARE_ENVIRONMENT` | `sandbox` or `production` | Controls base URL |
| `BOOKING_SECRET` | (random 32-char hex) | `openssl rand -hex 32` |

## Square Payment Links — Key Details

**Docs:** https://developer.squareup.com/docs/checkout-api/payment-links

- Line items show full breakdown (session + each add-on) in Square Dashboard + checkout page
- Redirect URL gets `orderId`, `transactionId`, `checkoutId`, `referenceId` appended as query params
- Payment links do NOT expire automatically — must be deleted via API
- Deleting a payment link also cancels the associated order → customer can't pay on it
- Sandbox available for full end-to-end testing with test cards
- Processing fee: 2.9% + $0.30 per transaction
- No SDK needed — raw `fetch()` with Bearer auth (avoids BigInt issues on Vercel)

**Sandbox test cards:**

| Card | Number | CVV |
|------|--------|-----|
| Visa (success) | `4111 1111 1111 1111` | `111` |
| Mastercard | `5105 1051 0510 5100` | `111` |
| Decline | `4000 0000 0000 0002` | any |

Any future expiry date works. Postal code: any valid zip.

## Abandoned Checkout Cleanup

**`api/cleanup-blocks.js`** runs every 15 minutes via Vercel cron.

```
For each tagged block older than 30 minutes:
  1. DELETE Square payment link (invalidates it — customer can't pay)
  2. DELETE Acuity block (frees the time slot)
```

- Only touches blocks tagged "Payment hold — whitewallstudios.co"
- Drew's manual blocks untouched
- Square link deleted FIRST → no edge case where customer pays after slot freed
- Vercel free tier includes 2 cron jobs (we use 1)

## HMAC-Signed State

Booking data (contact, add-ons, intake, event info) is HMAC-SHA256 signed and base64url
encoded into the Square redirect URL. The callback verifies the signature before using
the data. This prevents:
- Tampering with booking state between payment and appointment creation
- Forging a callback URL to create appointments without payment

## Error Handling

| Scenario | What Happens |
|---|---|
| Slot taken before checkout | `verify-availability` catches it, user picks new time |
| Customer abandons Square page | Block holds slot up to 30 min, cron cleans up |
| Slot conflict after payment | Callback auto-refunds via Square API, shows error page |
| Double-click "Pay & Book" | `isSubmitting` flag + idempotency key on Square request |
| Tampered state token | HMAC fails, callback rejects, shows error page |
| Square API down | create-checkout returns error, user sees alert |
| Acuity API down | availability endpoints return 502, user sees "Unable to load" |

## Acuity Add-On IDs

All mapped in `api/_lib/acuity.js` → `ACUITY_ADDON_IDS`. Add-ons created by Drew 2026-03-19.

| ID | Name | Price | Location |
|----|------|-------|----------|
| 6723268 | Lighting Package (2 Fixtures) | $100 (confirm $125) | PV |
| 2387016 | Lighting Rental | $50 | TM |
| 6840261 | All Backdrops | $50 | Both |
| 6840263 | Single Backdrop | $15 (×N for quantity) | Both |
| 6840264 | All Rolling Walls | $70 | PV |
| 6840265 | Single Rolling Wall | $30 (×N for quantity) | PV |
| 6840270 | 25 Chairs | $100 | PV |
| 6840271 | 50 Chairs | $190 | PV |
| 6840272 | 75 Chairs | $280 | PV |
| 6840274 | 100 Chairs | $370 | PV |
| 6840275 | 8ft Folding Table | $15 (×N for quantity) | PV |
| 6840276 | 86in Rolling TV | $50 | PV |
| 6840278 | PA System | $40 | PV |

## Acuity Form Field IDs

| Field ID | Name | Required | Forms |
|----------|------|----------|-------|
| 10764621 | Business Legal Name | No | All 12 types |
| 10764623 | Total Number of Participants | Yes | All 12 types |
| 10764624 | Instagram Handle | No | All 12 types |
| 10947712 | Will you read the email... | Yes | All 12 types |
| 18026152 | PV T&C agreement | Yes | 6 PV types |
| 10764522 | TM T&C agreement | Yes | 6 TM types |
| 18026602 | TM walking restriction | Yes | 6 TM types |

## Verification Checklist

- [ ] Sandbox end-to-end: full flow with test card → appointment created in Acuity
- [ ] All 12 appointment type IDs match Acuity dashboard
- [ ] Prices on our site match Acuity prices
- [ ] Square line items show correct breakdown
- [ ] Add-on IDs correctly mapped and prices match
- [ ] Appointment notes contain backdrop colors, wall numbers, etc.
- [ ] Intake form fields pass through to Acuity
- [ ] T&C checkboxes pass through for both locations
- [ ] Cron cleanup works (create block, wait, verify deletion)
- [ ] Slot conflict after payment → auto-refund works
- [ ] Full flow on mobile Safari
- [ ] Both locations tested end-to-end
- [ ] Switch to production tokens and test with real card
- [ ] Drew confirms confirmation email looks correct

## Future Enhancements

- **Acuity webhooks:** `scheduled`, `rescheduled`, `canceled`, `changed` for Slack/dashboard
- **Square webhooks:** `payment.updated`, `order.updated` as backup payment verification
- **Admin dashboard:** real-time booking feed combining Acuity + Square data
- **Funnel tracking:** PostHog events at each booking step for conversion analytics
- **A/B testing:** PostHog feature flags + Claude-in-the-loop optimization
- **Packages/certificates:** Acuity's coupon system for memberships/gift cards
