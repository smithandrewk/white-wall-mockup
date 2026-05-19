# Plan — Drew's 2026-05-11 Email
## Card-on-File Storage + Updated T&C + Updated Liability Waiver

**Source:** [2026-05-11-drew-email-card-on-file-and-tc-waiver-updates.md](2026-05-11-drew-email-card-on-file-and-tc-waiver-updates.md)
**Author:** Claude (per Andrew, 2026-05-11)
**Status:** Draft — awaiting Andrew + Drew sign-off

---

## TL;DR

Drew asked for three things. Two are easy copy swaps. The third is the meaningful change: **store a card on file for every booking so Drew can charge customers later for damage, late checkout, etc.**

The card-on-file requirement **forces an architectural change** in our payment step. Square's hosted Payment Link checkout (what we use today) does not — and cannot — save a card on file. We must replace the redirect-to-Square step with an embedded Square card form on our own page (Square Web Payments SDK).

Effort estimate: **~1 to 1.5 days of implementation + ~half day of testing in sandbox + the production-cutover dance**. T&C and waiver text swaps are ~30 min combined.

Net result: better UX (customer never leaves whitewallstudios.co), same PCI scope, card stored on file with proper consent, Drew can charge it later via a tiny admin page or directly in his Square Dashboard.

---

## What Drew asked for (verbatim summary)

1. Replace the **Terms & Conditions** copy on the checkout flow with the new 19-point version he pasted.
2. Replace the **Liability Waiver** copy with the new 12-section version he pasted.
   (Drew's email says *"same exact thing, but **not** for the liability waiver"* — I'm reading that as a typo for "**now** for the liability waiver" because he then pasted the new waiver. **Flagging for confirmation.**)
3. **Save card on file** during booking. Customer cannot complete the booking unless they agree. Card is for: damage, early/late fees ($130 per 15-min increment), unauthorized add-on use, cleaning fees. Drew added the authorization language into both the new T&C (sections 3, 6, 9, 10) and the new waiver (sections 5, 6, 7).

---

## Where the current copy lives

| File | What's there | Action |
|---|---|---|
| `book-powdersville.html` lines 176-196 | T&C inline HTML (14 numbered terms) | Replace with new 19-point version |
| `book-taylors-mill.html` lines 167-189 | T&C inline HTML (14 numbered terms, plus a "no events/parties" header line) | Replace — see note below on the TM-specific line |
| `scripts/booking-flow.js` lines 1453-1551 (`renderWaiver()`) | Waiver inline HTML rendered client-side at sign step | Replace with new 12-section version |
| `api/_lib/waiver-text.js` (entire file) | Server-side plain-text waiver included in the confirmation email | Replace with new 12-section version |

**No DB schema for current T&C/waiver text** — both live in source files, so copy swaps are just edits.

---

## Part 1 — T&C Copy Swap (Easy)

### What changes
Replace the current 14-point T&C in both `book-powdersville.html` and `book-taylors-mill.html` with Drew's new 19-point version, titled "Terms & Conditions — Flagship Location" in Drew's text.

### Open question — Taylor's Mill
Drew's pasted text is titled **"Flagship Location"**, which is the PV studio. The TM page currently has a slightly different T&C version, starting with the line *"This location is only approved for photo and video shoots, no events/parties allowed."* Drew's new T&C does **not** include this line.

**Question for Drew:** For Taylor's Mill, do we use the new T&C verbatim, OR prepend the "no events/parties" line and call it "Terms & Conditions — Taylor's Mill"?

### Implementation
- 2 HTML edits, identical content (modulo the heading + maybe the TM line)
- The signature input (`[data-input="terms-signature"]`) and the "Type your full name to accept" flow stay the same — Drew's new text already ends with "By signing below, I confirm I have read, completely understand, and agree to the terms above."

---

## Part 2 — Liability Waiver Copy Swap (Easy)

### What changes
Replace the waiver in two places (must stay in sync — comment at top of `api/_lib/waiver-text.js` already says so):

1. **`scripts/booking-flow.js` `renderWaiver()` (lines 1453-1551)** — what the customer sees at sign-time
2. **`api/_lib/waiver-text.js`** — plain-text included in the confirmation email so the customer has a copy of what they signed

### Notes
- Drew's new waiver has a `[Client Name]` placeholder — current code interpolates `state.contact.firstName + " " + state.contact.lastName`. Keep that.
- The location bracket `[Powdersville, South Carolina / Taylors, South Carolina]` interpolates from `location.slug` — already wired the same way.
- Drew's new waiver section 8 is the only one that mentions a TM-specific rule ("Haze machines are only permitted with bookings of four (4) hours or longer") — applies to both locations.
- **No TM-specific carve-out** ("no events/parties") in Drew's new waiver. Same question as T&C: do we add it back for TM, or trust the T&C to carry it?

---

## Part 3 — Card on File (The Meaningful Change)

### The fundamental constraint (researched 2026-05-11)

Square's hosted Payment Link checkout — what `POST /v2/online-checkout/payment-links` returns and what our customers land on today — **does not** offer a "save card for future use" option, and there is no API parameter to enable it. Confirmed by Square community moderator: *"At this time, there isn't an option to automatically store customer information after a customer completes a payment link."*

The only Square-supported path for "charge now + save card for future merchant-initiated charges" is the **Square Web Payments SDK**: an iframe-based card form we embed on our own page, with a single `tokenize({ intent: 'CHARGE_AND_STORE' })` call that handles both the immediate charge and the stored-credential consent.

We need to swap Payment Links for Web Payments SDK in the payment step.

### What the new flow looks like

Steps 1-4 (Timing, Schedule, Details, Waiver, Add-ons) are unchanged. The change is in **Step 5 — Schedule & Pay**:

**Today:**
> Customer reviews summary → clicks "Pay & Book" → redirected to Square's hosted checkout page → enters card → pays → Square redirects back to our `/api/booking-callback` → we create the Acuity appointment.

**New:**
> Customer reviews summary → sees an embedded Square card field (iframe, PCI-safe) ON our page → enters card → checks a **separate, required checkbox** ("I authorize WhiteWall to save this card on file and charge it for damages, late fees, unauthorized add-ons, and cleaning fees as described in the T&C and waiver above") → clicks "Pay & Book" → JS calls `Square.tokenize({ intent: 'CHARGE_AND_STORE', amount: <total>, ... })` → token POSTed to `/api/create-checkout` → server runs CreateCustomer → CreatePayment → CreateCard → CreateAcuityAppointment → returns success → we navigate to `/booking-confirmation`.

### Why the separate checkbox

Square's developer policy: *"Always ask customers for permission before saving their card information... Linking cards on file without obtaining customer permission can result in your application being disabled without notice."* Drew's waiver text covers the legal authorization, but Square's policy keys on **affirmative action at the point of card capture**, not buried signed text. A dedicated checkbox satisfies both Square and Visa/MC's Stored Credential Framework. Recommended placement: directly above the "Pay & Book" button, in the card form panel itself.

### Server-side changes

Replace `api/create-checkout.js` (which currently builds a Payment Link + redirect URL) with a payment-execution endpoint:

```
POST /api/create-checkout
  body: { ...booking data, squareSourceToken, customerInitiated: true, verificationToken (from SCA), consentTimestamp, consentIP, consentUserAgent }

  1. Re-verify Acuity slot availability (existing logic, unchanged)
  2. Re-derive total server-side (existing logic, unchanged — must NEVER trust client total)
  3. POST /v2/customers   { given_name, family_name, email_address, phone_number }
     -> customer.id
  4. POST /v2/payments    { source_id: <token>, amount, customer_id, location_id, autocomplete: true, verification_token }
     -> payment.id (this is the immediate charge — same dollar amount as Payment Link today)
  5. POST /v2/cards       { source_id: <payment.id>, card: { customer_id } }
     -> card.id  (this is the saved card)
  6. Create Acuity appointment (existing logic, unchanged) — write square_customer_id, square_card_id, consent metadata into appointment notes for paper trail
  7. Return { success: true, redirect: "/booking-confirmation?..." }
  8. On any failure post-payment: refund via existing refundPayment() helper, surface error to user
```

`api/booking-callback.js` becomes a no-op (deletable) because we no longer use Square redirects. The new endpoint handles the whole flow in one server roundtrip.

### Drew's "charge the card later" workflow

Two options, not mutually exclusive:

**Option A — Square Dashboard** (no extra build, available immediately)
Drew opens his Square Dashboard → Customers → finds the customer → sees their card on file → "Charge a card on file" → enters amount + memo. Works today, no code. Trade-off: Drew has to look up the customer by name/email each time.

**Option B — Tiny admin page** (~3 hours to build, add it next iteration)
A simple `/admin/charge` page on whitewallstudios.co listing recent bookings, with a "Charge card on file" button next to each. Clicking opens a form: amount + reason. Server hits `POST /v2/payments` with `source_id = card.id, customer_initiated: false, customer_id`. Sends customer an automatic receipt email.

Recommended: ship Option A only at first, build Option B once Drew's used Option A enough to know what he wants in the admin UI.

### Apple Pay / Google Pay — punt for now

Web Payments SDK supports Apple Pay and Google Pay via a few more SDK calls. Adds ~half day each plus Apple Pay domain verification dance (a `.well-known` file Square hosts for us). **Recommended punt** — get card-on-file in production first, add wallet support after Drew sees a customer ask for it.

### Trade-offs vs current architecture

| Aspect | Payment Links (today) | Web Payments SDK (proposed) |
|---|---|---|
| Card-on-file | Impossible | Native — full support |
| UX | Customer leaves whitewallstudios.co | Customer stays — feels more native |
| PCI scope | SAQ A | SAQ A (SDK iframes card input — card data never touches our server) |
| Apple/Google Pay | Built-in on Square's page | Requires extra SDK work (~half day each) |
| Implementation effort | Already shipped | ~1-1.5 days rebuild of payment step |
| Race-condition window | ~30 sec | Same (still pay-then-book) |
| Confirmation email | Triggered from our callback | Same — triggered from server after CreateCard succeeds |

PCI scope does NOT increase. The SDK's card input is iframed by Square — card numbers never touch our origin.

### Sandbox testing plan

Square sandbox supports the full charge + save + later-MIT flow.

- Test card numbers (no change from today): Visa `4111 1111 1111 1111`, CVV `111`, future expiry
- Pre-baked card-on-file source IDs for testing MIT (later-charge): `ccof:customer-card-id-ok`, `ccof:customer-card-id-declined`, etc.
- Test plan: book a sandbox session → verify card saved → use Square sandbox dashboard to see the stored card → simulate a $50 MIT charge → verify it succeeds without re-prompting customer.

### Production cutover

Per project's production protocol: this is a non-trivial change to live payment infrastructure. Cutover sequence:

1. Build + test thoroughly in sandbox (`SQUARE_ENVIRONMENT=sandbox`)
2. Deploy to preview Vercel URL
3. Drew does a real $0.50 test booking using his own card on the preview URL (with production env vars set) — verify card saved
4. Drew tests charging the card-on-file via Square Dashboard
5. Cut over the main domain by flipping `SQUARE_ENVIRONMENT=production` in Vercel (already set, no env change actually needed — already prod) and pointing the production deployment at the new code
6. Watch the first 2-3 real bookings closely
7. Have rollback plan ready: revert to previous deployment via Vercel rollback button

---

## Stuff stored alongside the booking (consent proof)

For the card-on-file consent to hold up against a chargeback, we want a paper trail. Suggested fields to write into the Acuity appointment notes AND/OR a dedicated row in a future bookings DB:

- `square_customer_id`
- `square_card_id`
- `consent_timestamp` (UTC ISO)
- `consent_ip` (from `x-forwarded-for`)
- `consent_user_agent` (from request headers)
- `consent_text_hash` (SHA-256 of the exact T&C + waiver text the customer saw — survives future edits)
- `waiver_signed_name` (the name they typed)
- `terms_signed_name` (the name they typed)

We don't have a DB today. Acuity notes are the path of least resistance — append the above as a JSON block. Future-proofing note: if/when we add Supabase or similar, migrate the consent records out of Acuity notes into a structured table.

---

## Estimated effort

| Task | Effort |
|---|---|
| T&C copy swap (both pages) | 15 min |
| Waiver copy swap (client + server) | 25 min |
| Square Web Payments SDK integration on book-*.html | 3-4 hrs |
| New `/api/create-checkout` server flow (Customer + Payment + Card) | 3-4 hrs |
| Consent checkbox UI + persistence | 1 hr |
| Update booking-callback flow / delete or repurpose old callback | 30 min |
| Sandbox testing (happy path + 5 edge cases) | 2 hrs |
| Drew's preview-URL test booking + Dashboard charge-on-file test | 30 min |
| Production cutover + monitoring | 1 hr |
| **Total** | **~12-13 hrs** |

---

## Additional infra needed

- **New env vars:** `SQUARE_APPLICATION_ID` (production) and `SQUARE_SANDBOX_APPLICATION_ID`. This is the public-facing app ID for the Web Payments SDK — different from the access token. Andrew grabs it from Square Developer Dashboard → our app → Credentials. Public, no secret value.
- **CDN script include** in `book-powdersville.html` and `book-taylors-mill.html`: `<script src="https://web.squarecdn.com/v1/square.js"></script>` (or sandbox URL when `SQUARE_ENVIRONMENT=sandbox` — we'd switch the URL via a template var or runtime check).
- **No CSP currently configured** (checked `vercel.json`, `book-*.html` — no CSP headers). If we add one later, allowlist `web.squarecdn.com` and `pci-connect.squareup.com`.

---

## Gap: direct-to-Acuity bookings

Drew's Acuity scheduler URL is still live and still accepts bookings outside our flow (his old Squarespace site historically pointed there; walk-in/repeat customers might still use it directly). **Those bookings will not have a card on file**, because Acuity's scheduler doesn't save cards. Only bookings made through whitewallstudios.co will have card-on-file.

**Options:**
- (a) Accept the gap — direct Acuity bookings continue to work, just without card on file. Drew bills damages from those manually.
- (b) Disable / hide the direct Acuity scheduler URL so all bookings funnel through whitewallstudios.co.
- (c) Move all bookings to the new flow as a future migration.

**Question for Drew (added below):** which option?

---

## What's NOT in scope for this change

- Apple Pay / Google Pay (punt — half day each, do later)
- Admin "charge card on file" page (Option B above — punt, use Square Dashboard for now)
- Migrating consent records from Acuity notes into a DB (premature — no DB yet)
- Adding QuickBooks integration for the MIT (later) charges — already a known future item
- Changing the cleaning-fee logic ($150 for 35+/50+ events vs $130 generic cleaning fee mentioned in new T&C — these are two distinct fees, both should exist)

---

## Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| SDK init fails on customer's browser → no payment possible | Low | Wrap in try/catch, show clear error, fall back to "email us to book" |
| Customer disputes a later MIT charge as "unauthorized" | Medium | Strong consent proof (above), Drew emails customer BEFORE charging |
| We charge twice during cutover (Payment Link still live + Web Payments SDK live) | Low | Cutover via deploy, not env var — old code goes away atomically |
| `tokenize()` succeeds but CreatePayment fails | Low | No card saved, no money moved, user sees error, can retry |
| CreatePayment succeeds but CreateCard fails | Low | Money charged, card not saved → either: (a) accept it, log alert for Drew to manually retry CreateCard via Dashboard, or (b) refund automatically |
| CreateCard succeeds but Acuity create fails | Low | Existing refundPayment() logic handles this — refund + show error page |

---

## Outstanding questions

### For Drew (need answers before implementing)
1. **Waiver typo confirm:** Email said *"same exact thing, but **not** for the liability waiver"* — confirming this was a typo for "**now** for the liability waiver" since you pasted the new waiver text.
2. **Taylor's Mill T&C:** Your new T&C is titled "Flagship Location." For Taylor's Mill, do you want (a) verbatim same text, (b) text with "Terms & Conditions — Taylor's Mill" heading, (c) text with the "no events/parties" line prepended back in, or (d) something else?
3. **Cleaning fee numbers:** Your new T&C / waiver references a **$130 cleaning/reset fee**. The current site has a separate **$150 cleaning fee** for 35+ / 50+ guest events (auto-applied at booking, line item on Square). These are different — one is "we had to clean up after you," the other is "you booked a big event." Confirming both should coexist.
4. **Card-on-file consent checkbox copy:** Square requires a clearly-affirmative consent at point of card capture (in addition to your signed T&C/waiver). I propose: *"I authorize WhiteWall Studios to save this card on file and charge it for damage, early entry / late exit fees ($130 per 15-min increment), unauthorized add-on use, and cleaning fees, as described in the T&C and Waiver I signed above. I understand I can revoke this authorization by emailing Drew before my session."* OK to use as-is, or want different wording?
5. **Existing bookings:** None of your existing customers' cards are saved on file (impossible with the current flow). For existing customers booking again, they'll need to re-enter the card on the first new booking. OK?
6. **Apple Pay / Google Pay:** OK to defer for now? Same Square sandbox doesn't auto-redirect them either, so they'd need extra setup. We can add them in a follow-up.
7. **Currently-live customers post-launch:** When this change rolls out, customers who'd already started a booking before the cutover but haven't paid yet — their checkout flow will look different. Likelihood low (current 30-sec payment window), but flagging.
8. **"Automatically charge" wording in section 3 of new T&C:** Your text says the system will *"automatically charge the card/payment method... $130 per 15-minute increment"* for early entry/late exit. The website itself doesn't detect when someone leaves late — there's no door sensor or check-in. I assume you mean YOU charge the card manually after the fact when you see security camera footage / get an alert. Confirming.
9. **Direct Acuity bookings (the gap):** Your old Acuity scheduler URL still works for direct bookings outside whitewallstudios.co. Those bookings can't save a card. Options: (a) accept the gap — only whitewallstudios.co bookings get card-on-file; (b) take the Acuity scheduler URL down so everything funnels through the new flow.
10. **Pip review:** You mentioned having Pip read over the legal language. I can flag this for Andrew to run through Pip separately — say the word and we'll do that pass before going live.

### For Andrew
1. Drew is in production. **Production protocol** kicks in for the cutover. Want to do preview-URL testing with real card first, or skip and cut over directly with sandbox-only verification?
2. Bundle this as one PR or split into two (copy-swap first, then card-on-file)? Recommended: split. Copy-swap is zero risk and Drew can see it immediately; card-on-file ships separately after sandbox testing.
3. Should I draft the email reply to Drew with the open questions, or wait for you to review the plan first?
