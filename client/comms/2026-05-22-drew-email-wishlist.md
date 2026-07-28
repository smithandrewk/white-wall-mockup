# Drew Email — WhiteWall Wishlist

- **From:** Drew Shahoud `<drewshahoud@gmail.com>`
- **To:** Andrew Smith, Max Huggins
- **Date:** Fri, May 22 2026 1:17 PM ET
- **Subject:** WhiteWall Wishlist
- **Gmail thread ID:** `19e50b19a7dcbf84`
- **Raw HTML attachments:** `client/comms/2026-05-22-wishlist-attachments/` (gitignored — contains a `repeat-customer-analysis.html` with customer PII)

## Verbatim message

> Hey Andrew,
>
> Max and I met, and we pretty much just documented a bunch of thoughts and things that we would want for a white wall. Some of these things I think I can do on my own, but a bunch of them I definitely can't. Even if I can technically do them on my own, the question is, am I actually going to?
>
> Regardless, I wanted to give you this document so you can save it and have a good reference guide for where we're at. We can refer to each specific item by the title it has (A1, B1, B2, etc)
>
> I think you're pretty much already almost done with A1, but just wanted to give you all our hopes and dreams in one document because we're probably just going to use this as a guide to continue building.
>
> Also included is a file of a bunch of exported data from Square that Watson made up for us. Feel free to just give it to Pip and have him understand all the data. It's pretty valuable stuff, and the UI is pretty nice to be able to see everything displayed. Watson is going to run this exact report with fresh data every single month at the end of the month automatically, so if you ever need the latest month's worth of data, just let me know.
>
> K ily bye bye

## Wishlist items (transcribed from `andrew-wishlist.html`)

Drew + Max coded every item with a letter (category) and number, and an ownership tag — "Drew/Watson, likely", "Solely Andrew", or "Hybrid".

### A. Payments + Business Protection — P0

- **A1 — Card-on-file / ability to charge customers after booking** *(Hybrid, P0)*
  - Late departure / overtime fees, cleaning / reset fees, damages, missing items, unauthorized add-ons, policy violations.
  - Confirm what Square supports and what must be changed.
  - Make sure checkout / waiver language legally supports these charges.
  - Drew note: "I think you're pretty much already almost done with A1." → matches existing GitHub issue #4.

### B. Customer Messaging Automations — P1

- **B1 — Booking confirmation text message** *(Hybrid, P1)*
  - Send SMS *in addition to* the email confirmation, immediately after booking.
  - Use the phone number on the booking. Include all important booking info + instructional video links. Long SMS is acceptable, even if there's a cost. → matches existing GitHub issue #7.

- **B2 — Start-of-session welcome message** *(Hybrid, P1, NEW)*
  - Email + text **5 minutes after** the session starts.
  - Warm welcome, point them to signs inside the studio, include add-on payment link in case they forgot something. Tone: warm, cute, welcoming, helpful — not an ad.

- **B3 — End-of-session reminder message** *(Hybrid, P1, NEW)*
  - Email + text **15 minutes before** the session ends.
  - Location-specific. Link Flagship/PV or TM "Checkout + Reset Checklist". Clearly state staying over can result in fees.

### C. Retention + Coupon System — P1 / P2

- **C1 — Automated post-session thank-you + custom coupon** *(Drew/Watson likely, P1)*
  - "Fernando-style" thank-you email/text for every booking at both locations.
  - Thank clients for respecting the space, mention WhiteWall depends on trustworthy clients.
  - Generate a custom shareable coupon: `LASTNAME15` for 1–2 hour sessions, `LASTNAME20` for 3+ hour sessions.
  - Anyone with the code can use it, **but only once**. Expires in 7 days.

- **C2 — Free add-on alternative** *(Drew/Watson likely, P2)*
  - Same coupon can either discount the session OR act as a free add-on up to **$70**.
  - Confirm whether Square supports this cleanly; if not, recommend simplest alternative (separate code or manual instruction).

### D. Content Upload + Marketing Permission — P1

- **D1 — Client Google Drive upload folder** *(Drew/Watson likely, P1)*
  - Per-booking folder, link goes in the post-session thank-you / coupon email.
  - Folder format: `First Last Month Day` (e.g. `Megan Larson May 26th`).
  - Anyone with the link can upload/edit. Invite finished content + BTS content.

- **D2 — Checkout / waiver content permission** *(Solely Andrew, P1)*
  - Add legal language to checkout / waiver giving WhiteWall permission to use certain client-created content (reshare tagged content, use voluntarily uploaded folder content for website, portfolio, marketing, social).
  - Andrew should advise if attorney review is needed.

### E. Booking Form Data Capture — P1

- **E1 — Mandatory "How did you hear about us?" field** *(Solely Andrew, P1)*
  - Required during booking, every location + duration.
  - Options: **Word of mouth / Social media / Google / Other**. "Other" requires text. Booking can't complete without an answer.
  - Save with booking/customer record. Include in admin notifications + reporting.

### F. SEO + Analytics Reporting — P1

- **F1 — SEO improvement plan** *(Solely Andrew, P1)*
  - Rank for photo studio, event space, creative studio, production-space searches.
  - Titles, meta descriptions, headers, schema, internal links. Strengthen location-specific pages. Target Greenville, Easley, Powdersville, Taylor's Mill keywords. Audit image alt text, speed, indexing, Search Console issues.

- **F2 — Lead-source + conversion reporting** *(Hybrid, P1)*
  - Report showing how people find WhiteWall and what converts.
  - Instagram vs Google vs direct vs Google Business Profile. Landing pages + conversion paths. Keywords generating traffic.
  - Stack: GA4 + Search Console + GBP insights + PostHog + UTMs.

## Drew's suggested build order (Phases)

- **Phase 1 — Protect + communicate:** A1, B1, B2, B3
- **Phase 2 — Retention loop:** C1, C2, D1
- **Phase 3 — Legal + attribution:** D2, E1
- **Phase 4 — Growth analytics:** F1, F2

## Open questions Drew left for Andrew

1. Can current Square setup save payment methods for future charges?
2. What SMS provider for automated texts?
3. Can texts/emails trigger exactly 5 min after start / 15 min before end?
4. Where are current video links + checklist links stored?
5. Can Square create custom one-use coupon codes automatically?
6. Can Square create one code that is either a percent discount OR a free add-on up to $70?
7. Safest way to create client-specific upload folders?
8. Can uploaded-content permission be added directly into the waiver?
9. Can the form store/report the "How did you hear about us?" field?
10. What analytics are installed already and what needs to be added?
11. Highest-ROI SEO plan?
