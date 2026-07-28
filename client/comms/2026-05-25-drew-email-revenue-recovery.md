# Drew Email — Revenue Recovery / Last-Minute Email & Text Discounts

- **From:** Drew Shahoud `<drewshahoud@gmail.com>`
- **To:** Andrew Smith, Max Huggins
- **Date:** Mon, May 25 2026 11:30 AM ET
- **Subject:** Re: WhiteWall Wishlist
- **Gmail thread ID:** `19e50b19a7dcbf84` (same thread as the May 22 wishlist)
- **Raw HTML attachment:** `client/comms/2026-05-22-wishlist-attachments/last-minute-email-discounts.html` (gitignored)

## Verbatim message body

The May 25 reply contained almost no prose — the substance is the `WhiteWall — Last-Minute Email Discounts.html` attachment described below.

## Spec — transcribed from the attachment

**Status:** Review Draft. **Owner:** Drew. **Build target:** Andrew / WhiteWall systems. **Locations:** FS + TM. **Created:** May 24 2026.

### 1. Core intent

Controlled last-minute email/text campaign to fill underbooked weekend studio time. Discounts run only when a specific studio on a specific weekend day is underbooked enough to justify it. Should feel like rare last-minute availability, not a permanent program.

### 2. Studio codes

- `FS` — Flagship
- `TM` — Taylor's Mill

Campaigns can be combined in one email/text, but logic + coupon restrictions stay studio-specific and day-specific.

### 3. Discount scope

- Applies only to **raw studio time** on **new bookings**.
- Does **not** apply to add-ons, cleaning fees, equipment fees, other services, existing/past bookings, or weekends outside the campaign window.

### 4. Qualification logic

- Saturday + Sunday only. **Friday excluded from analysis.**
- Time window: **7:30 AM – 6:30 PM**.
- A studio/date qualifies only if both:
  1. Fewer than **5 booked hours** in the window
  2. **4+ open usable hours** in the window
- No minimum session length — 1-hour openings are fine.

### 5. Coupon rules

Every weekend gets brand-new codes tied to studio + day/date + discount level:

- Tuesday 25%: `FS-SAT-MAY30-25`, `FS-SUN-MAY31-25`, `TM-SAT-MAY30-25`, `TM-SUN-MAY31-25`
- Friday 50%: same pattern with `-50` suffix

Restrictions: unique to that weekend, one use per customer, non-stackable, not reusable later, expires after the campaign window. **Coupons expire Sunday at 12:00 PM** (Sunday code can still apply to a Sunday-evening session if redeemed before noon).

### 6. Tuesday 25% campaign

Watson analyzes the four buckets (FS-Sat, FS-Sun, TM-Sat, TM-Sun) — booked hours, open hours, recommended slots, qualification status, proposed coupon code.

**Not automatic.** Watson texts Drew a full summary and waits for approval. Suggested instruction: "Reply YES to send, NO to skip, or EDIT with changes."

### 7. Friday 50% escalation

Friday morning Watson re-checks. If qualifying availability still exists, propose a 50% escalation. Include analytics: what changed since Tuesday, bookings created, coupon usage, email opens/clicks, text response/click rate, revenue attributed.

### 8. Audience rules

Email + text go to the same list. Exclude: already booked for that weekend, unsubscribed, do-not-contact, problem customers, anyone who shouldn't get promos.

Customer language for already-booked: *"Already booked? You're all set with the time you chose. This last-minute offer is only for new bookings and cannot be applied to existing reservations."*

### 9. End-to-end workflow

1. Tuesday — Watson analyzes FS + TM, Sat/Sun, 7:30 AM – 6:30 PM
2. Qualification per the <5 / ≥4 rule
3. Watson drafts 25% campaign, texts Drew for approval
4. If approved: unique studio/date coupons created, email + text go out
5. Friday — re-check + 50% escalation proposal
6. Coupons expire Sunday at noon, no reuse. Discounted bookings keep being accepted even if bookings climb above the 5-hour threshold after launch.

### 10. Open implementation questions (Drew → Andrew)

1. Which booking platform/calendar is source of truth for booked hours? *(Acuity)*
2. Can coupon codes be restricted by studio/location?
3. Can coupon codes be restricted by booking date / session date?
4. Restricted to raw studio time only, excluding add-ons / fees?
5. One use per customer?
6. Can existing weekend customers be auto-excluded from the list?
7. Can Watson get email/SMS campaign analytics before Friday approval?
8. Can bookings be attributed back to specific coupon codes/campaigns?
9. Can the approval workflow run through Watson text responses?
10. Safest fallback if the platform can't enforce one of the restrictions exactly?
