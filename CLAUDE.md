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

### Architecture: Pay → Book

Custom 5-step UI → Square Payment Link (collects payment) → Acuity appointment (created after payment confirmed).

No appointment exists until the customer pays. This matches the behavior of Drew's current Squarespace + Acuity setup where "Book & Pay" creates the appointment only after payment.

Two separate integrations on the same Square merchant account:
- **Acuity's Square connection** — handles payments through Acuity's own scheduler (unchanged, still works for direct bookings)
- **Our Square Developer App** — handles payments through our custom booking flow on whitewallstudios.co

Both deposit to the same bank account. They don't conflict.

### Why This Architecture (Decision History)

We evaluated several approaches:

1. **Acuity's built-in payment page (`confirmationPagePaymentLink`)** — Requires creating
   an appointment first, which triggers confirmation emails + QuickBooks invoices before
   the customer pays. `noEmail` param doesn't suppress emails (tested). Payment links
   can't be invalidated after appointment cancellation. Also, can't mark appointments as
   paid via API (`POST /appointments/{id}/payments` returns 500 for all inputs).

2. **Block → Pay → Book** — Calendar blocks hold slots without emails. Works but adds
   complexity (cron cleanup, Vercel Pro plan for frequent crons). Removed blocks after
   determining the race condition risk is negligible at current volume.

3. **Pay → Book (current)** — Simplest. Square collects payment first, callback creates
   Acuity appointment after. No unpaid appointments, no premature emails, no cleanup needed.
   The ~30 second window where two people could pay for the same slot is negligible at
   ~50 bookings/month. If a slot conflict happens, Drew refunds via Square Dashboard.

### Files

Client-side:
- `book-powdersville.html` / `book-taylors-mill.html` — booking pages
- `scripts/booking-config.js` — durations, prices, add-ons, Acuity type IDs
- `scripts/booking-flow.js` — 5-step flow with calendar/time picker
- `styles/booking.css` — calendar, time slots, spinner styles

Server-side (Vercel serverless functions):
- `api/_lib/acuity.js` — Acuity auth, add-on/field ID mappings, pricing, HMAC signing
- `api/_lib/square.js` — Square API helpers (payment links, order verification, refunds)
- `api/availability-dates.js` — GET proxy for Acuity available dates
- `api/availability-times.js` — GET proxy for Acuity available times
- `api/verify-availability.js` — POST pre-checkout slot verification
- `api/create-checkout.js` — POST builds Square Payment Link with server-side pricing
- `api/booking-callback.js` — GET callback after payment: verify order → create Acuity appointment

Static:
- `booking-confirmation.html` — success page after booking
- `booking-error.html` — error/fallback page (slot conflict after payment, etc.)

### User Flow

1. **Step 1 — Timing:** pick duration (shows prices, auto-advances)
2. **Step 2 — Details:** contact info, intake form (business, participants, Instagram), T&C
3. **Step 3 — Waiver:** liability waiver + e-signature
4. **Step 4 — Add-ons:** backdrops, lighting, walls, chairs, tables, TV, PA
5. **Step 5 — Schedule & Pay:** calendar → time slots → order summary → "Pay & Book"
6. `POST /api/verify-availability` — confirm slot is still open
7. `POST /api/create-checkout` — server-side pricing, HMAC-sign state, create Square Payment Link
8. **Redirect to Square checkout page** — customer sees itemized total, enters card, pays
9. **Square redirects to `GET /api/booking-callback`** with `orderId` + `transactionId`
10. Callback verifies order is paid → creates Acuity appointment with add-ons + notes
11. Redirect to `/booking-confirmation`. Acuity sends confirmation email.

**If customer abandons Square page:** Nothing happens. No appointment, no block, no email.
**If slot taken after payment (extremely rare):** Error page, Drew refunds via Square Dashboard.

### Env vars (Vercel — all set)

| Variable | Source | Notes |
|---|---|---|
| `ACUITY_USER_ID` | Acuity > Integrations > API | `36967128` |
| `ACUITY_API_KEY` | Acuity > Integrations > API | Set |
| `SQUARE_ACCESS_TOKEN` | Square Developer Dashboard | Currently sandbox token |
| `SQUARE_LOCATION_ID` | Square Dashboard > Locations | `LTPQKY2V3N0AH` (sandbox) |
| `SQUARE_ENVIRONMENT` | — | `sandbox` (change to `production` for go-live) |
| `BOOKING_SECRET` | `openssl rand -hex 32` | HMAC signing key |

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
- **Processing fee:** 2.9% + $0.30 per transaction
- **No SDK** — raw `fetch()` to avoid BigInt serialization issues on Vercel serverless

**Key Square endpoints:**

| Endpoint | Purpose |
|---|---|
| `POST /v2/online-checkout/payment-links` | Create Payment Link with line items + redirect URL |
| `GET /v2/orders/{id}` | Verify order is COMPLETED after payment |
| `POST /v2/refunds` | Refund if Acuity appointment creation fails |

**Square redirect behavior:** After payment, Square appends `checkoutId`, `orderId`,
`transactionId`, and `referenceId` as query params to our redirect URL.

### Undocumented Acuity Behavior We Rely On

1. **`noPayment: true`** on POST /appointments — creates appointment without payment. Tested 2026-03-17.
2. **`admin=true` query param** — required for `notes` field to be saved. Tested 2026-03-19.
3. **Duplicate addonIDs for quantity** — same ID × N charges N × price. Tested: 3× $20 = $60.
4. **`fields` accepts `{id, value}`** — docs mention `label` but ID-based works and is more reliable.

**Things that DON'T work:**
- `noEmail` param — emails are still sent (tested 2026-03-17)
- `POST /appointments/{id}/payments` — returns 500 for all source values (tested 2026-03-19)
- `PUT /appointments/{id}` with `paid` or `price` — silently ignored, read-only fields

See `api/_lib/acuity.js` header for full documentation.

### Add-On Strategy

Acuity's add-on system is flat (no quantities, no variants). Our approach:
- **Backdrops:** "All Backdrops" ($50) add-on OR "Single Backdrop" ($15) × N colors. Color names in notes.
- **Rolling walls:** "All Walls" ($70) or "Single Wall" ($30) × N. Wall numbers in notes.
- **Tables:** "8ft Folding Table" ($15) × quantity via duplicate addonIDs.
- **Chairs:** Separate add-on per tier (25/$100, 50/$190, 75/$280, 100/$370).
- **Toggle add-ons:** Lighting, TV, PA — one add-on each.

All add-on IDs mapped in `api/_lib/acuity.js` → `ACUITY_ADDON_IDS`.
Square shows the same breakdown as individual line items on the checkout page.

### QuickBooks Integration

Acuity auto-syncs appointments to QuickBooks. Current behavior on Drew's Squarespace
site: QuickBooks receives a $0 draft invoice per booking. This is existing behavior
Drew lives with — not introduced by our changes.

**Setting in Acuity > Integrations > QuickBooks:**
- "Create a draft invoice" — no email sent to customer
- Or "Don't create an invoice, just add them as a client" — cleanest option

Drew should confirm which setting he prefers. Either way, payment is recorded in
Square, and QuickBooks can pull transaction data from Square directly.

### Testing Strategy

**Currently in sandbox mode.** Square sandbox provides full end-to-end testing:
- Test Visa: `4111 1111 1111 1111`, CVV `111`, any future expiry
- Test decline: `4000 0000 0000 0002`
- Sandbox testing panel simulates checkout + redirect

**Note:** In sandbox, the testing panel doesn't auto-redirect to our callback.
You need to click the redirect URL manually from the panel. In production,
Square's checkout page redirects the browser automatically.

**To go live:** Replace `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` with production
values from Square Developer Dashboard. Set `SQUARE_ENVIRONMENT=production`.

### Future Enhancements

- **QuickBooks API integration** — auto-mark invoices as paid (OAuth2, requires token storage)
- **Acuity/Square webhooks** — real-time notifications, backup payment verification
- **Funnel data collection** — PostHog events or DB for abandoned booking follow-up
- **Admin dashboard** — live booking feed combining Acuity + Square data
- **A/B testing** — PostHog feature flags + Claude optimization

### Notes

- Acuity mode is `"api"` in booking-config.js
- Powdersville event logic: only 4hr+ durations are event-eligible
- Taylor's Mill: no events, no rolling walls/chairs/tables/TV/PA add-ons
- All appointment types have 15min padding before and after
- PV lighting: $100 in Acuity, $125 on our site — Drew needs to update Acuity
- Local dev: `python -m http.server` requires `.html` extensions; Vercel `cleanUrls` handles clean routes
- Full appointment backup: `client/acuity-full-backup.csv` (2,574 rows, Nov 2021–present)
- System design diagrams: `client/system-design-old.pdf`, `client/system-design-new.pdf`
