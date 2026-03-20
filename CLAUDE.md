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

### Why Square Payment Links Instead of Acuity's Payment Page

This was the central architectural decision. We explored every possible approach over
several days of research and testing (2026-03-17 through 2026-03-20). Here is every
option we evaluated, why it failed, and the evidence.

#### Option 1: Acuity's Built-In Scheduler (iframe/link)
**Why not:** Drew wanted a fully custom booking experience — visual add-on carousels
with photos, multi-step flow with event detection, waiver signing, custom pricing display.
Acuity's scheduler is a generic form. Steps 1-4 of our custom UI are non-negotiable.

#### Option 2: Custom UI → Acuity's Payment Page (`confirmationPagePaymentLink`)
**Why not (three separate blockers):**

1. **Premature emails.** Creating an appointment with `noPayment: true` immediately
   triggers Acuity's confirmation email + QuickBooks invoice — BEFORE the customer pays.
   `noEmail` param doesn't suppress emails (tested 2026-03-17). On Drew's current
   Squarespace site, Acuity creates the appointment atomically with payment, so emails
   only go out after payment. Our API approach breaks this atomicity.

2. **Can't pass add-ons via scheduler URL.** We tested `addonIDs[]`, `addon[]`, and
   `addons[]` as URL parameters on Acuity's scheduler — none work (tested 2026-03-20).
   Private add-ons (which ours are) don't appear on the public scheduler at all. This
   means the scheduler URL can pre-fill contact info and datetime, but the price shown
   would be ONLY the base session — no add-ons included. The total would be wrong.

3. **Can't mark appointments as paid via API.** `POST /appointments/{id}/payments`
   exists in Acuity's router (returns 400 if `source` is missing) but returns 500
   Internal Server Error for EVERY source value. Tested 50+ values including `cash`,
   `square`, `check`, `external`, `manual`, `credit_card`, integers, etc. (2026-03-19).
   This endpoint is NOT in Acuity's official API docs (reference page returns 404).
   `PUT /appointments/{id}` with `paid: "yes"` or `price: "0"` is silently ignored
   — both are read-only fields. No third-party integration (Zapier, Make, Pipedream)
   has solved this either. Cash payments are UI-only ("Record Cash Payment" button
   in the admin dashboard). Confirmed by exhaustive web search (2026-03-20).

**Net result:** If we use Acuity's payment page, the price would be wrong (missing
add-ons) and we couldn't fix it. If we create the appointment first and redirect to
the payment page, the customer gets emails before paying.

#### Option 3: Custom UI → Acuity Appointment → Acuity Payment Page (with draft invoices)
**Almost worked.** We changed QuickBooks setting to "Create a draft invoice" (not
emailed). The Acuity payment page (`confirmationPagePaymentLink`) shows the correct
total when add-ons are passed via API at appointment creation. The payment page UI
looked great (tested 2026-03-19). BUT: the confirmation email from Acuity still goes
out immediately when the appointment is created, before the customer pays. And we
can't pass add-ons via the scheduler URL (see Option 2, point 2), so we can't use
the atomic scheduler flow.

#### Option 4: Block → Pay → Book (with Square Payment Links)
**Worked but was complex.** Calendar blocks hold slots without creating appointments
(no emails). Square Payment Link collects payment. Callback creates appointment after
payment. But: blocks needed cleanup (abandoned checkouts), Vercel Hobby plan only
supports daily crons (not 15-minute), and blocks added architectural complexity.
Removed blocks after determining race condition risk is negligible at current volume.

#### Option 5: Pay → Book (current — Square Payment Links, no blocks)
**Simplest approach that solves all problems:**
- Custom UI collects everything (steps 1-4) — Drew's vision preserved
- Square Payment Link charges the exact correct total with itemized add-ons
- No appointment exists until payment confirmed — no premature emails
- Callback creates Acuity appointment after payment — Acuity sends confirmation email
  at the right time
- QuickBooks gets a draft invoice (not emailed) — Drew prefers this
- Race condition window (~30 sec) is negligible at ~50 bookings/month
- If slot conflict after payment (extremely rare), Drew refunds via Square Dashboard

#### Why We Can't Use Acuity's Payment System At All (Summary)
The fundamental issue: Acuity's scheduler handles booking + payment atomically on
their own page. Through the API, we're forced to separate them. We can't:
- Get a payment page without first creating an appointment (triggers emails)
- Pass add-ons via scheduler URL parameters (private add-ons hidden, URL params ignored)
- Mark an appointment as paid after collecting payment externally (API endpoint broken)
- Suppress Acuity's confirmation email at appointment creation time (noEmail doesn't work)

Square Payment Links give us full control over pricing, line items, and timing.

### QuickBooks Invoice Status

Acuity auto-syncs appointments to QuickBooks. Setting changed to **"Create a draft
invoice"** (2026-03-20) so no invoice email is sent to the customer.

**Current state:** Draft invoices appear in QuickBooks as unpaid. Drew confirmed he
doesn't care about invoicing customers — he prefers they don't get invoiced.

**Future fix:** Complete the Intuit Developer compliance questionnaire (~30 min) to
get production QuickBooks API credentials. Then our callback can find the draft
invoice and mark it as paid automatically. Tested successfully in sandbox (2026-03-20):
query invoice by customer + date → record payment → invoice marked paid.

**QuickBooks connections:**
- Acuity → QuickBooks: creates draft invoices (keep connected — also auto-voids on cancel)
- Square → QuickBooks: already connected, syncs payment transactions
- Our app → QuickBooks: pending compliance questionnaire for production access

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

**Things that DON'T work (tested and confirmed):**
- `noEmail` param on POST /appointments — emails are still sent (tested 2026-03-17)
- `POST /appointments/{id}/payments` — returns 500 for all source values. Tested 50+ values. Endpoint exists in router but is not in official docs. Likely broken or internal-only. (tested 2026-03-19, re-confirmed 2026-03-20)
- `PUT /appointments/{id}` with `paid` or `price` — silently ignored, read-only fields (tested 2026-03-19)
- Scheduler URL add-on params — `addonIDs[]`, `addon[]`, `addons[]` all ignored. Private add-ons don't appear on public scheduler. (tested 2026-03-20)
- `confirmationPagePaymentLink` invalidation — cancelling an appointment does NOT disable its payment link. Page still accepts card input after cancellation. (tested 2026-03-17)

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

### Unpaid Appointment Handling (deferred — not yet implemented)

**The problem:** When we create an appointment with `noPayment: true`, it holds the
time slot on Drew's calendar. If the customer doesn't pay, that slot is blocked.

**Why we're deferring:** At ~50 bookings/month, the odds of two customers wanting the
exact same slot within a 30-minute window are near zero. Building auto-cancel adds
complexity for a problem that may never occur. Revisit if it becomes an issue.

**Research findings (2026-03-17):**
- Acuity's `confirmationPagePaymentLink` has NO expiry and CANNOT be invalidated
- Cancelling an appointment does NOT disable its payment link — tested and confirmed
- The payment page still shows the full balance and accepts card input after cancellation
- There is no API parameter or dashboard setting for payment link TTL

**If we need to solve this later, evaluated approaches:**

1. **Vercel cron + tagged cleanup (simplest, no new deps)**
   - Our appointments have "Booked via whitewallstudios.co" in notes
   - Cron runs every 15 min, fetches recent appointments with our tag
   - Cancels any that are `paid === "no"` and created > 30 min ago
   - Safe: only touches our appointments, checks paid status before cancelling
   - Risk: customer could still pay on cancelled appointment's link (edge case)

2. **QStash delayed trigger (cleanest, adds dependency)**
   - `create-appointment` fires a delayed HTTP call: "check appointment {id} in 30 min"
   - Exactly one check per appointment, no scanning
   - Same cancelled-link risk applies

3. **Webhook monitoring (complementary, not standalone)**
   - Register `changed` webhook to detect payment on cancelled appointments
   - Doesn't solve the cleanup, but catches the edge case from options 1/2
   - If payment detected on cancelled appointment, alert Drew to rebook

**The fundamental limitation:** We don't control Acuity's payment page. We cannot
invalidate a payment link. Any auto-cancel approach has a theoretical edge case where
the customer pays after cancellation. At current volume this is a non-issue.

### Future: Webhooks

Acuity supports webhooks for `scheduled`, `rescheduled`, `canceled`, `changed`, and `order.completed`. Not currently used but could enable:
- Real-time Slack/email notifications when bookings are paid
- Detecting payment on auto-cancelled appointments (see above)
- Auto-updating a dashboard or CRM
- Syncing to Google Calendar automatically

Webhook payload: `application/x-www-form-urlencoded` POST with `action`, `id`, `calendarID`, `appointmentTypeID`. Signed with HMAC-SHA256 using API key (verify via `x-acuity-signature` header). Retries with exponential backoff over 24 hours (9 attempts). Auto-disables after 5 days of consecutive failures.

Register at: Acuity dashboard > Integrations > Webhooks, or via API.

### Future Enhancements

- **QuickBooks API: auto-mark invoices as paid** — Intuit compliance questionnaire needed for production credentials (~30 min). OAuth2 + token refresh + find invoice by customer/date + record payment. Tested successfully in sandbox 2026-03-20.
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
