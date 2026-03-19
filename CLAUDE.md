# White Wall Studios - Website Mockup

## Context Management (Avoid Rate Limits)

This project involves multiple large HTML files. Follow these rules to avoid blowing up the context window:

- **Never read back files you just wrote.** The content is already in context from the Write call.
- **Run `/compact` after writing or editing multiple HTML files.** Large HTML files snowball the context fast.
- **Split multi-phase work into separate sessions.** Don't do HTML mockups and LaTeX design sheets in the same session.
- **Prefer Edit over Write** for changes to existing files. Edit sends only the diff, not the full file.
- **Avoid bulk re-reads.** If you need to check consistency across pages, read one at a time, compact between if needed.

## Project Structure

- `index.html` - Main landing page
- `taylors-mill.html` - Taylors Mill venue page
- `powdersville.html` - Powdersville venue page
- `gallery.html` - Photo gallery
- `design-sheet.tex` / `design-sheet.pdf` - LaTeX design sheet
- `fonts/` - Web fonts
- `wws-logo.png` - Logo asset

## Active Product Directives

### Powdersville First

As of March 14, 2026, Drew explicitly asked that **Powdersville be the first/default option anywhere the site presents both locations together**.

This was already implemented in the repo because Drew texted:
- "make powdersville the first option in everything. So Powdersville first on site, then Taylor's mill. Same with [Gallery] page. Pop up powdersville first, then Taylor's mill, etc."

Treat this as a standing product decision unless Drew reverses it later.

When editing mixed-location UI, preserve this ordering:
- Navigation on shared pages: `Powdersville` before `Taylor's Mill`
- Homepage location presentation: Powdersville first
- Gallery location filters and booking CTAs: Powdersville first
- Any future booking chooser, modal, popup, comparison card set, or CTA group: Powdersville first

Why this is documented here:
- Future Claude sessions may work from repo context rather than message history.
- This note is intended to make the ordering decision explicit so it is not accidentally reverted.

## Booking URL Strategy

Canonical booking routes now use the `book-*` pattern:

- `/book-powdersville`
- `/book-taylors-mill`

When editing booking links or adding new booking UI:
- point internal CTAs to the canonical `/book-*` routes
- keep redirects in `vercel.json` for legacy `/booking-*` paths
- keep Powdersville first anywhere both booking destinations appear together

## Booking Integration

### Architecture: Block → Pay → Book

Custom 5-step UI → Acuity block (holds slot) → Square Payment Link (collects payment) → Acuity appointment (after payment confirmed).

Two separate integrations on the same Square merchant account:
- **Acuity's Square connection** — handles payments through Acuity's own scheduler (unchanged, still works)
- **Our Square Developer App** — handles payments through our custom booking flow

Both deposit to the same bank account. They don't conflict.

### Why This Architecture (Decision History)

We evaluated three approaches before landing on Block → Pay → Book:

1. **Acuity appointment first, pay on Acuity's page** — Creating an appointment with
   `noPayment: true` sends invoice/confirmation emails immediately, before the customer
   pays. Also, Acuity's `confirmationPagePaymentLink` CANNOT be invalidated — even after
   cancelling the appointment, the payment page still works. No way to prevent late
   payments on cancelled appointments.

2. **Acuity appointment first, pay via Square** — Same email problem. Creating the
   appointment triggers Acuity notifications regardless of `noEmail` param (tested,
   doesn't suppress emails).

3. **Block → Pay → Book (current)** — Acuity calendar blocks hold the slot without
   creating an appointment (no emails). Square Payment Link collects payment on a hosted
   page we control. After payment confirmation, we create the Acuity appointment (which
   then sends the confirmation email at the right time). Abandoned blocks + payment links
   are cleaned up by a cron job, and unlike Acuity's payment links, Square payment links
   CAN be programmatically deleted/invalidated.

### Files

Client-side:
- `book-powdersville.html` / `book-taylors-mill.html` — booking pages
- `scripts/booking-config.js` — durations, prices, add-ons, Acuity type IDs
- `scripts/booking-flow.js` — 5-step flow with calendar/time picker
- `styles/booking.css` — calendar, time slots, spinner styles

Server-side (Vercel serverless functions):
- `api/_lib/acuity.js` — Acuity auth, add-on/field ID mappings, notes builder
- `api/_lib/square.js` — Square API helpers (create payment link, verify order, refund)
- `api/availability-dates.js` — GET proxy for Acuity available dates
- `api/availability-times.js` — GET proxy for Acuity available times
- `api/verify-availability.js` — POST pre-checkout slot verification
- `api/create-checkout.js` — POST creates Acuity block + Square Payment Link
- `api/booking-callback.js` — GET callback after payment: verify → delete block → create appointment
- `api/cleanup-blocks.js` — Cron: delete abandoned blocks + payment links older than 30 min

Static:
- `booking-error.html` — error/fallback page (slot conflict after payment, etc.)

### User Flow

1. **Step 1 — Timing:** pick duration (shows prices, auto-advances)
2. **Step 2 — Details:** contact info, intake form (business, participants, Instagram), T&C
3. **Step 3 — Waiver:** liability waiver + e-signature
4. **Step 4 — Add-ons:** backdrops, lighting, walls, chairs, tables, TV, PA
5. **Step 5 — Schedule & Pay:** calendar → time slots → order summary → "Pay & Book"
6. `POST /api/verify-availability` — confirm slot is still open
7. `POST /api/create-checkout` — creates Acuity block (holds slot) + Square Payment Link
8. **Redirect to Square checkout page** — customer enters card, pays
9. **Square redirects to `GET /api/booking-callback`** with `orderId` + `transactionId`
10. Callback verifies order is COMPLETED → deletes block → creates Acuity appointment
11. Redirect to confirmation page. Acuity sends confirmation email.

**If customer abandons payment:** Block holds the slot for up to 30 min. Cron deletes
the block + the Square payment link (invalidating it). Slot is freed.

**If Acuity rejects after payment (extremely rare slot conflict):** Customer sees error
page. Auto-refund via Square API, or Drew refunds manually.

### Env vars (Vercel)

| Variable | Source | Notes |
|---|---|---|
| `ACUITY_USER_ID` | Acuity > Integrations > API | `36967128` (already set) |
| `ACUITY_API_KEY` | Acuity > Integrations > API | (already set) |
| `SQUARE_ACCESS_TOKEN` | Square Developer Dashboard | Sandbox for testing, production for live |
| `SQUARE_LOCATION_ID` | Square Dashboard > Locations | Same for sandbox and production |
| `SQUARE_ENVIRONMENT` | — | `sandbox` or `production` |
| `BOOKING_SECRET` | Generate: `openssl rand -hex 32` | HMAC signing key for state token |

### Acuity API Details

- **Docs:** https://developers.acuityscheduling.com/reference/quick-start
- **Auth:** HTTP Basic over SSL (userId:apiKey). No CORS — all calls go through server-side proxy.
- **Owner ID:** 24638772 (used in scheduler URLs)
- **User ID:** 36967128 (used for API auth)
- **Plan:** Business (via Squarespace), `can_use_api: true`
- **Timezone:** America/New_York (both locations)
- **Calendars:** Powdersville (6255578), Taylor's Mill (6252295)

### Square API Details

- **Docs:** https://developer.squareup.com/docs/checkout-api/payment-links
- **Auth:** Bearer token. Base URL differs by environment.
- **Sandbox URL:** `https://connect.squareupsandbox.com`
- **Production URL:** `https://connect.squareup.com`
- **API version:** `2026-01-22` (set via `Square-Version` header)
- **Processing fee:** 2.9% + $0.30 per transaction (Square standard)
- **No SDK** — we use raw `fetch()` to avoid BigInt serialization issues on Vercel serverless

**Key Square endpoints we use:**

| Endpoint | Purpose |
|---|---|
| `POST /v2/online-checkout/payment-links` | Create Payment Link with line items + redirect URL |
| `GET /v2/orders/{id}` | Verify order state is COMPLETED after payment |
| `DELETE /v2/online-checkout/payment-links/{id}` | Invalidate abandoned payment links (cron) |
| `POST /v2/refunds` | Auto-refund if Acuity appointment creation fails |

**Square redirect behavior:** After payment, Square appends `checkoutId`, `orderId`,
`transactionId`, and `referenceId` as query params to our redirect URL.

**Payment link lifecycle:** Links don't expire automatically. We can delete them via API,
which also cancels the associated order. This is a major advantage over Acuity's payment
links which cannot be invalidated.

### Undocumented Acuity Behavior We Rely On

1. **`noPayment: true`** on POST /appointments — creates appointment without payment. Tested 2026-03-17.
2. **`noEmail` does NOT work** — tested, emails are still sent. This is WHY we use Block → Pay → Book.
3. **`admin=true` query param** on POST /appointments — required for `notes` field to be saved. Without it, notes are silently dropped.
4. **Duplicate addonIDs for quantity** — same ID × N charges N × price. Tested: 3× $20 = $60.
5. **`fields` accepts `{id, value}`** — docs mention `label` but ID-based works and is more reliable.
6. **POST/DELETE /blocks** — creates/removes calendar blocks that prevent slot availability without creating appointments or sending emails. Tested 2026-03-19.

See `api/_lib/acuity.js` header for full documentation of each.

### Add-On Strategy

Acuity's add-on system is flat (no quantities, no variants). Our approach:
- **Backdrops:** "All Backdrops" ($50) add-on OR "Single Backdrop" ($15) × N colors. Color names in notes.
- **Rolling walls:** "All Walls" ($70) or "Single Wall" ($30) × N. Wall numbers in notes.
- **Tables:** "8ft Folding Table" ($15) × quantity via duplicate addonIDs.
- **Chairs:** Separate add-on per tier (25/$100, 50/$190, 75/$280, 100/$370).
- **Toggle add-ons:** Lighting, TV, PA — one add-on each.

All add-on IDs are mapped in `api/_lib/acuity.js` → `ACUITY_ADDON_IDS`.

Square Payment Link shows the same add-ons as individual line items, so Drew sees the
full breakdown in his Square Dashboard and the customer sees itemized pricing on checkout.

### Acuity API Limitations

- **Cannot create add-ons via API** — GET only. Drew creates them in Acuity dashboard.
- **Cannot override appointment price** — `price` param on POST/PUT is ignored.
- **Cannot update addonIDs after creation** — PUT only allows: name, email, phone, fields, notes, labels.
- **Cannot suppress emails** — `noEmail` param doesn't work (tested).
- **Cannot invalidate payment links** — `confirmationPagePaymentLink` stays active after cancellation.
- **No CORS** — all API calls must go through server-side proxy.

### Abandoned Checkout Cleanup (Cron)

**`api/cleanup-blocks.js`** — runs every 15 minutes via Vercel cron.

For each abandoned checkout (block older than 30 minutes):
1. `DELETE /v2/online-checkout/payment-links/{id}` — invalidates Square payment link
2. `DELETE /blocks/{id}` — frees the slot on Acuity's calendar

**Why this is safe:**
- Only touches blocks tagged "Payment hold — whitewallstudios.co"
- Drew's manual blocks are untouched
- Square payment link is deleted FIRST, so customer can't pay after slot is freed
- No edge case where customer pays on a cancelled/freed slot

**Vercel cron config in `vercel.json`:**
```json
{ "crons": [{ "path": "/api/cleanup-blocks", "schedule": "*/15 * * * *" }] }
```

### Testing Strategy

**Sandbox-first:** Square provides a full sandbox environment with test cards.
- Sandbox base URL: `connect.squareupsandbox.com`
- Test Visa: `4111 1111 1111 1111`, CVV `111`, any future expiry
- Test decline: `4000 0000 0000 0002`
- Full redirect flow works in sandbox (real checkout pages, test cards, real redirects)

Set `SQUARE_ENVIRONMENT=sandbox` and use sandbox access token. Switch to production
token + `SQUARE_ENVIRONMENT=production` for go-live.

### Future: Webhooks

**Acuity** supports: `scheduled`, `rescheduled`, `canceled`, `changed`, `order.completed`.
Payload: `application/x-www-form-urlencoded`. Signed with HMAC-SHA256 via `x-acuity-signature`.

**Square** supports: `payment.created`, `payment.updated`, `order.created`, `order.updated`, `refund.created`.
Payload: JSON via POST. Retries with exponential backoff over 24 hours.

Not currently used but could enable:
- Real-time Slack/email notifications on bookings
- Backup payment verification (complement to redirect callback)
- Admin dashboard live feed
- Google Calendar sync

### Notes

- Acuity mode is `"api"` in booking-config.js
- Powdersville event logic: only 4hr+ durations are event-eligible
- Taylor's Mill: no events, no rolling walls/chairs/tables/TV/PA add-ons
- All appointment types have 15min padding before and after
- PV lighting: $100 in Acuity, $125 on our site — Drew needs to update Acuity
- Local dev: `python -m http.server` requires `.html` extensions; Vercel `cleanUrls` handles clean routes
- Full appointment backup: `client/acuity-full-backup.csv` (2,574 rows, Nov 2021–present)
- State machine diagram: `client/booking-flow-state-machine.png`
