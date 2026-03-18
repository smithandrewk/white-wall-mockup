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

### Architecture

Custom 5-step UI → Acuity API (serverless proxy) → Acuity's built-in Square payment page.

No separate Square Developer App. Acuity's existing Square connection handles payment.
Payment is collected on Acuity's hosted checkout page (`confirmationPagePaymentLink`).
Acuity handles confirmation emails, payment recording, and appointment management.

### Files

Client-side:
- `book-powdersville.html` / `book-taylors-mill.html` — booking pages
- `scripts/booking-config.js` — durations, prices, add-ons, Acuity type IDs
- `scripts/booking-flow.js` — 5-step flow with calendar/time picker
- `styles/booking.css` — calendar, time slots, spinner styles

Server-side (Vercel serverless functions):
- `api/_lib/acuity.js` — Acuity auth, add-on/field ID mappings, notes builder
- `api/availability-dates.js` — GET proxy for Acuity available dates
- `api/availability-times.js` — GET proxy for Acuity available times
- `api/verify-availability.js` — POST pre-checkout slot verification
- `api/create-appointment.js` — POST creates unpaid appointment, returns payment link

Static:
- `booking-error.html` — generic error/fallback page

### User Flow

1. **Step 1 — Timing:** pick duration (shows prices, auto-advances)
2. **Step 2 — Details:** contact info, intake form (business, participants, Instagram), T&C
3. **Step 3 — Waiver:** liability waiver + e-signature
4. **Step 4 — Add-ons:** backdrops, lighting, walls, chairs, tables, TV, PA
5. **Step 5 — Schedule & Pay:** calendar → time slots → order summary → "Pay & Book"
6. Client-side calls `POST /api/verify-availability` → `POST /api/create-appointment`
7. Redirect to Acuity's Square checkout page
8. Customer pays → Acuity sends confirmation email → done

### Env vars (Vercel — already set)

- `ACUITY_USER_ID` — `36967128` (subuser ID, not owner ID)
- `ACUITY_API_KEY` — set in Vercel, from Acuity > Integrations > API

### Acuity API Details

- **Docs:** https://developers.acuityscheduling.com/reference/quick-start
- **Auth:** HTTP Basic over SSL (userId:apiKey). No CORS — all calls must go through server-side proxy.
- **Owner ID:** 24638772 (used in scheduler URLs)
- **User ID:** 36967128 (used for API auth)
- **Plan:** Business (via Squarespace), `can_use_api: true`
- **Payment processor:** Square (connected through Acuity dashboard)
- **Timezone:** America/New_York (both locations)

### Undocumented Behavior We Rely On

1. **`noPayment: true`** on POST /appointments — creates appointment without payment. Tested 2026-03-17.
2. **`confirmationPagePaymentLink`** in responses — Acuity's Square checkout URL for a specific appointment. Present on all appointments.
3. **Duplicate addonIDs for quantity** — same ID × N charges N × price. Response deduplicates IDs but math is correct. Tested: 3× $20 = $60.
4. **`fields` accepts `{id, value}`** — docs mention `label` but ID-based works and is more reliable.

See `api/_lib/acuity.js` header for full documentation of each.

### Add-On Strategy

Acuity's add-on system is flat (no quantities, no variants). Our approach:
- **Backdrops:** "All Backdrops" ($50) add-on OR "Single Backdrop" ($15) × number of colors selected. Color names go in appointment notes.
- **Rolling walls:** Same pattern — "All Walls" ($70) or "Single Wall" ($30) × count. Wall numbers in notes.
- **Tables:** "8ft Folding Table" ($15) × quantity via duplicate addonIDs.
- **Chairs:** Separate add-on per tier (25/$100, 50/$190, 75/$280, 100/$370).
- **Toggle add-ons:** Lighting, TV, PA — one add-on each, straightforward.

Drew is creating these add-ons in the Acuity dashboard. After creation, run `GET /appointment-addons` to get new IDs and update `ACUITY_ADDON_IDS` in `api/_lib/acuity.js`.

### API Limitations (from docs + testing)

- **Cannot create add-ons via API** — GET only on `/appointment-addons`. Drew creates them in dashboard.
- **Cannot override appointment price** — `price` param on POST/PUT is ignored. Price = type price + sum(addon prices).
- **Cannot update addonIDs after creation** — PUT /appointments only allows: name, email, phone, fields, notes, labels, certificate.
- **Cannot create appointment types via API** — returns 403 on current plan.
- **No CORS** — all Acuity API calls must go through server-side proxy.

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

### Notes

- Acuity mode is `"api"` in booking-config.js (not `"scheduler"` or `"iframe"`)
- Powdersville event logic: only 4hr+ durations are event-eligible
- Taylor's Mill: no events, no rolling walls/chairs/tables/TV/PA add-ons
- All appointment types have 15min padding before and after
- Local dev: `python -m http.server` requires `.html` extensions; Vercel `cleanUrls` handles clean routes
- Full appointment backup: `client/acuity-full-backup.csv` (2,574 rows, Nov 2021–present)
