# Technical Build Plan — Card-on-File + Policy Update

**Parent plan:** [2026-05-11-drew-card-on-file-and-policy-update-plan.md](2026-05-11-drew-card-on-file-and-policy-update-plan.md)
**Status:** Assumed answers to all open questions. Ready to build pending Andrew's go.

---

## Assumed answers (locked in for this plan — Drew can override)

1. **Waiver "typo":** "not" = "now." Both T&C and waiver get updated.
2. **TM T&C heading:** "Terms & Conditions — Taylor's Mill," with the TM-specific *"This location is only approved for photo and video shoots, no events/parties allowed"* line prepended as a bold header above section 1.
3. **$130 vs $150 cleaning fees:** Both coexist. $130 is the "you left it dirty" minimum (post-hoc charge against card on file). $150 is the auto-applied event cleaning fee for 35+/50+ guests (line item at checkout).
4. **Consent checkbox text:** As proposed in the email — concrete, lists the four charge categories, references the signed T&C + waiver.
5. **Existing customers:** No migration. Cards saved going forward only. Customers re-enter card on first booking after launch.
6. **Apple Pay / Google Pay:** Deferred.
7. **Cutover edge case:** Accept the ~30-second exposure window for in-flight bookings during the deploy.
8. **"Automatically charge" in T&C section 3:** Drew charges manually post-hoc. The text gives the legal authorization, not a technical automation.
9. **Direct Acuity bookings:** Leave the gap. Only whitewallstudios.co bookings save a card.
10. **Pip review:** Done before production cutover, not before PR 1.

---

## Two-PR strategy

### PR 1 — Copy swaps (ships immediately after Drew confirms 1–3)
Zero risk. Pure text edits. Goes to production same day Drew responds.

### PR 2 — Card-on-file rebuild
Built behind a deploy. Sandbox-tested first. Preview-URL real-card test with Drew. Then merge.

---

# PR 1 — Copy swaps

## File 1: `book-powdersville.html` lines 176–196

Replace the existing T&C panel (heading "Terms & Conditions — Flagship Location," 14 numbered terms) with Drew's new 19-point text. Keep:
- The `booking-panel-soft` wrapper
- The `max-h-64 overflow-y-auto` scroll container
- The signature `<input data-input="terms-signature">` and hint `<p class="signature-hint">` (untouched)
- The "By signing below, I confirm I have read..." line right above the input
- The "Continue to sign waiver" button with `data-requires-terms` (untouched)

Only the heading text ("Flagship Location") and the 14 `<p>` items inside the scroll container change.

## File 2: `book-taylors-mill.html` lines 167–189

Same swap, with two TM-specific tweaks:
- Heading becomes "Terms & Conditions — Taylor's Mill"
- Before section 1, insert: `<p><strong>This location is only approved for photo and video shoots, no events/parties allowed.</strong></p>` (carries forward the existing TM-only rule that Drew's new text doesn't include).

## File 3: `scripts/booking-flow.js` lines 1494–1543 (inside `renderWaiver()`)

Replace the inline waiver HTML with Drew's new 12-section version. Keep:
- The `${escapeHtml(fullName || "the individual")}` interpolation in the opening paragraph
- The location bracket logic: `${location.slug === "powdersville" ? "Powdersville, South Carolina" : "Taylors, South Carolina"}`
- The TM-specific carve-out `${location.slug === "taylors-mill" ? '<p>...no events/parties allowed.</p>' : ""}`
- The scroll container, the wrapper panel, and everything downstream (signature block, `data-requires-waiver` button)

Only the section headings, body text, and section count change.

## File 4: `api/_lib/waiver-text.js` (entire file)

Replace the `buildWaiverText` return array with Drew's new 12-section plain-text version. Keep the function signature, the `fullName`/`locationCity`/`tmRestriction` setup, and the `Signed: ... / Signed at: ...` trailer. Drew's new sections become the body.

## Testing PR 1
- Open `/book-powdersville` locally → step 3 → confirm new T&C displays, scroll works, signature input still gates the "Continue" button
- Open `/book-taylors-mill` locally → confirm TM heading + "no events/parties" header
- Step 4 → confirm new waiver displays, "Sign as [Name]" button works
- Send a sandbox test booking → confirm the confirmation email body shows the new waiver text

## Commit message
```
Update T&C and liability waiver copy per Drew (2026-05-11)

Drew sent new versions of both. T&C now 19 points covering early/late
exit fee ($130 per 15-min), $130 cleaning floor, unauthorized add-on
charges, and explicit card-on-file authorization. Waiver mirrors with
12 sections including indemnification and stored-credential
authorization. TM keeps its "photo/video only, no events/parties"
header.

Card-on-file enforcement (saving the card during checkout) ships
separately in a follow-up.
```

---

# PR 2 — Card-on-file rebuild

## Architecture diff at a glance

```
TODAY:
  Step 5 [Schedule & Pay] → "Pay & Book" button
   → POST /api/create-checkout
      → server: build line items + sign state + Square createPaymentLink
      → respond { checkoutUrl }
   → window.location = checkoutUrl   (leaves whitewallstudios.co)
   → customer pays on Square's hosted page
   → Square redirects to /api/booking-callback?state=...&sig=...&orderId=...
      → callback: verifyOrder + createAcuityAppointment + sendEmails
   → 302 redirect to /booking-confirmation

NEW:
  Step 5 [Schedule & Pay] → Square SDK card iframe + consent checkbox + "Pay & Book"
   → JS: Square.tokenize({ intent: 'CHARGE_AND_STORE', amount, ... }) → token
   → POST /api/create-checkout  body: { ...booking state, squareToken, consentMeta }
      → server: verifySlot + findOrCreateCustomer + createPayment(token)
                + createCardOnFile(paymentId) + createAcuityAppointment + sendEmails
      → respond { success: true, redirect: "/booking-confirmation?..." }
   → JS: window.location = res.redirect (no Square redirect involved)
```

`api/booking-callback.js` becomes dead code → delete.

---

## Pre-work (before any code)

### Get Square Application ID
- Square Developer Dashboard → our app → Credentials tab
- Production Application ID (starts `sq0idp-`)
- Sandbox Application ID (starts `sandbox-sq0idb-`)
- Add to Bitwarden under the existing WhiteWall Square item
- Add to Vercel project env vars:
  - `SQUARE_APPLICATION_ID` (production scope only)
  - `SQUARE_SANDBOX_APPLICATION_ID` (preview + dev scopes)
- These are PUBLIC (they ship to the browser). Not secrets. But still env-var them so we can swap easily.

### Expose Application ID to the client
Square SDK runs in the browser, so the App ID must be in the page. Two options:

**Option A: Inline via a tiny `/api/booking-public-config` endpoint**
Client fetches `{ squareAppId, squareLocationId, squareEnvironment }` on page load. Cleanest, single source of truth. ~20 LOC.

**Option B: Bake into HTML at build time**
Vercel doesn't do build-time templating on static HTML. Would require a `<script>` block that reads from `window.__BOOKING_CONFIG__` set by a generated file. Messier.

**Decision: Option A.** New file `api/booking-public-config.js`:

```js
module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=60");
  const isProd = process.env.SQUARE_ENVIRONMENT === "production";
  res.status(200).json({
    squareAppId: isProd
      ? process.env.SQUARE_APPLICATION_ID
      : process.env.SQUARE_SANDBOX_APPLICATION_ID,
    squareLocationId: isProd
      ? (process.env.SQUARE_PROD_LOCATION_ID || process.env.SQUARE_LOCATION_ID)
      : (process.env.SQUARE_SANDBOX_LOCATION_ID || process.env.SQUARE_LOCATION_ID),
    squareSdkUrl: isProd
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js"
  });
};
```

---

## File-by-file changes

### `book-powdersville.html` and `book-taylors-mill.html`

**Add to `<head>` (or just before `</body>`):**
```html
<script id="square-sdk-loader">
  (async function () {
    const cfg = await fetch("/api/booking-public-config").then(r => r.json());
    const s = document.createElement("script");
    s.src = cfg.squareSdkUrl;
    s.onload = function () { window.__SQUARE_CFG__ = cfg; window.dispatchEvent(new Event("square-ready")); };
    document.head.appendChild(s);
  })();
</script>
```

**Replace Step 5 payment block (currently a single "Pay & Book" button):**

Currently — somewhere around the order summary in step 5 panel — there's a "Pay & Book" button that posts to `/api/create-checkout`. Find it (search for `data-action="checkout"` or similar in book-*.html). Insert above it:

```html
<div class="booking-panel-soft p-5 mt-6">
  <p class="text-xs tracking-[0.2em] uppercase text-black/45 mb-3">Payment</p>
  <div id="card-container" class="square-card-container" style="min-height:120px"></div>
  <p class="text-xs text-black/45 mt-2" data-card-status></p>

  <label class="consent-row mt-5">
    <input type="checkbox" data-input="card-on-file-consent" class="booking-checkbox">
    <span class="text-sm text-black/70">
      I authorize WhiteWall Studios, LLC to save this card on file and charge it for damage,
      early entry / late exit fees ($130 per 15-minute increment), unauthorized add-on use,
      and cleaning fees, as described in the T&amp;C and Waiver above.
    </span>
  </label>
  <p class="signature-hint" data-hint="card-on-file-consent"></p>
</div>
```

The "Pay & Book" button stays where it is. Just gets new gating logic: requires `state.cardOnFileConsent === true` AND `state.squareCardReady === true`.

### `scripts/booking-flow.js`

**Add to state (~line 60):**
```js
cardOnFileConsent: false,
squareCardReady: false,
squareCard: null,    // the Square card instance, set after attach()
isPaying: false,     // prevents double-submit during tokenize
paymentError: null,
```

**Add Square initialization (new function, call on entering step 5):**
```js
async function initSquareCard() {
  if (state.squareCard) return; // idempotent
  if (!window.Square || !window.__SQUARE_CFG__) {
    // SDK script not loaded yet; wait for event
    await new Promise(resolve => window.addEventListener("square-ready", resolve, { once: true }));
  }
  const cfg = window.__SQUARE_CFG__;
  const payments = window.Square.payments(cfg.squareAppId, cfg.squareLocationId);
  const card = await payments.card();
  await card.attach("#card-container");
  state.squareCard = card;
  state.squareCardReady = true;
  updatePayGate();
}
```

Call `initSquareCard()` from `setStep()` when step becomes 5.

**Add consent checkbox handler:**
```js
if (target.matches('[data-input="card-on-file-consent"]')) {
  state.cardOnFileConsent = target.checked;
  updatePayGate();
}
```

**Replace the existing "Pay & Book" handler with:**
```js
if (action === "pay-and-book") {
  if (state.isPaying) return;
  if (!state.cardOnFileConsent) { showHint("card-on-file-consent", "Required to save your card."); return; }
  if (!state.squareCardReady) { showHint("card-on-file-consent", "Card form still loading..."); return; }

  state.isPaying = true;
  renderPayButton(); // show spinner

  try {
    const grandTotal = computeGrandTotal(); // existing client-side total (display only)
    const totalDollars = (grandTotal).toFixed(2);

    const tok = await state.squareCard.tokenize({
      intent: "CHARGE_AND_STORE",
      customerInitiated: true,
      sellerKeyedIn: false,
      amount: totalDollars,
      currencyCode: "USD",
      billingContact: {
        givenName: state.contact.firstName,
        familyName: state.contact.lastName,
        email: state.contact.email,
        phone: state.contact.phone,
        countryCode: "US"
      }
    });

    if (tok.status !== "OK") {
      // tok.errors is an array of { code, detail, field }
      state.paymentError = tok.errors?.[0]?.detail || "Card could not be tokenized.";
      state.isPaying = false;
      renderPayError();
      return;
    }

    const body = buildCheckoutBody();   // existing function — gathers all booking state
    body.squareToken = tok.token;
    body.consent = {
      cardOnFile: true,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      // server fills in IP from x-forwarded-for
    };

    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      state.paymentError = err.error || "Booking failed. Please try again.";
      state.isPaying = false;
      renderPayError();
      return;
    }

    const result = await res.json();
    trackEvent("booking_completed", { location: location.slug, total: grandTotal });
    window.location.href = result.redirect;
  } catch (e) {
    state.paymentError = e.message || "Unexpected error";
    state.isPaying = false;
    renderPayError();
  }
}
```

**Remove:** the old `window.location = checkoutUrl` line. Remove the dependency on the redirect-based flow.

### `styles/booking.css`

Add at the bottom:
```css
.square-card-container {
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.consent-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  margin-top: 1rem;
}

.consent-row input[type="checkbox"] {
  margin-top: 4px;
  flex-shrink: 0;
}
```

Square's card iframe styles itself; our wrapper just gives it room.

### `api/_lib/square.js` — add helpers

Append three new functions:

```js
// Find a customer by email (returns first match) or create one
async function findOrCreateCustomer({ email, firstName, lastName, phone }) {
  // Search by email
  const searchRes = await fetch(getBaseUrl() + "/v2/customers/search", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      query: { filter: { email_address: { exact: email } } },
      limit: 1
    })
  });
  const searchData = await searchRes.json();
  if (searchRes.ok && searchData.customers && searchData.customers.length > 0) {
    return searchData.customers[0].id;
  }

  // Not found — create
  const createRes = await fetch(getBaseUrl() + "/v2/customers", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      given_name: firstName,
      family_name: lastName,
      email_address: email,
      phone_number: phone || undefined
    })
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    const msg = createData.errors ? createData.errors.map(e => e.detail).join(", ") : "Unknown";
    throw new Error("Square createCustomer failed: " + msg);
  }
  return createData.customer.id;
}

// Charge the tokenized card (CIT — customer initiated)
async function createPayment({ sourceId, amountCents, customerId, idempotencyKey, note }) {
  const body = {
    idempotency_key: idempotencyKey,
    source_id: sourceId,
    customer_id: customerId,
    location_id: getLocationId(),
    amount_money: { amount: amountCents, currency: "USD" },
    autocomplete: true,
    note: note || undefined
  };
  const res = await fetch(getBaseUrl() + "/v2/payments", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.errors ? data.errors.map(e => e.detail).join(", ") : "Unknown";
    throw new Error("Square createPayment failed: " + msg);
  }
  return data.payment;
}

// Save the just-charged card on file (uses the payment.id as the source)
async function createCardOnFile({ paymentId, customerId, cardholderName }) {
  const body = {
    idempotency_key: crypto.randomUUID(),
    source_id: paymentId,
    card: {
      customer_id: customerId,
      cardholder_name: cardholderName
    }
  };
  const res = await fetch(getBaseUrl() + "/v2/cards", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.errors ? data.errors.map(e => e.detail).join(", ") : "Unknown";
    throw new Error("Square createCard failed: " + msg);
  }
  return data.card;
}

// Charge a saved card later (MIT — merchant-initiated, customer absent)
// Used by future admin "charge card on file" workflow. Built but not surfaced in UI yet.
async function chargeCardOnFile({ cardId, customerId, amountCents, note }) {
  const body = {
    idempotency_key: crypto.randomUUID(),
    source_id: cardId,
    customer_id: customerId,
    location_id: getLocationId(),
    amount_money: { amount: amountCents, currency: "USD" },
    autocomplete: true,
    customer_initiated: false,  // marks as MIT — exempts from SCA
    note: note || undefined
  };
  const res = await fetch(getBaseUrl() + "/v2/payments", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.errors ? data.errors.map(e => e.detail).join(", ") : "Unknown";
    throw new Error("Square chargeCardOnFile failed: " + msg);
  }
  return data.payment;
}

module.exports = {
  createPaymentLink,       // existing — kept temporarily for safety; remove after PR 2 ships
  getOrder,                // existing
  deletePaymentLink,       // existing
  refundPayment,           // existing
  findOrCreateCustomer,    // new
  createPayment,           // new
  createCardOnFile,        // new
  chargeCardOnFile         // new (future-use)
};
```

### `api/create-checkout.js` — full rebuild

Current file (275 LOC) builds a Payment Link and returns a checkout URL. New version executes the full charge → save → book flow inside the request.

```js
// POST /api/create-checkout
//
// New flow (replaces Payment Link redirect):
//   1. Validate inputs + re-verify Acuity slot
//   2. Re-derive total server-side (NEVER trust client total)
//   3. Square: findOrCreateCustomer
//   4. Square: createPayment (charges the tokenized card)
//   5. Square: createCardOnFile (saves the card for later MIT)
//   6. Acuity: create appointment (with consent metadata in notes)
//   7. Fire-and-forget background notifications (cleaner email, owner SMS, posthog)
//   8. Return { success: true, redirect: "/booking-confirmation?..." }
//
// On failure after payment succeeded but before appointment created:
//   refund the payment + return error pointing user to booking-error page.

const crypto = require("crypto");
const {
  isValidAppointmentTypeID,
  buildSquareLineItems,
  acuityGet,
  acuityPost,
  TYPE_TO_DURATION,
  CALENDAR_IDS,
  ACUITY_ADDON_IDS,
  PRICE_BY_TYPE,
  // ...whatever existing helpers there are
} = require("./_lib/acuity");
const {
  findOrCreateCustomer,
  createPayment,
  createCardOnFile,
  refundPayment
} = require("./_lib/square");
const { alertFailure } = require("./_lib/alert");
const { buildWaiverText } = require("./_lib/waiver-text");

// Idempotency: derive from booking signature so retries with same body don't double-charge
function deriveIdempotencyKey(body) {
  const sig = body.appointmentTypeID + "|" + body.datetime + "|" + body.contact.email + "|" + body.squareToken.slice(-12);
  return crypto.createHash("sha256").update(sig).digest("hex");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};
  const {
    appointmentTypeID, datetime, location, contact, intake, addons,
    eventIntent, participants, eventDescription, foodDrinks,
    highTrafficNote, tmHighTrafficNote, emailAcknowledgment,
    termsSignature, waiverSigned, cleaningFee,
    squareToken, consent
  } = body;

  // ---- validate ----
  if (!squareToken) return res.status(400).json({ error: "Missing payment token" });
  if (!consent || consent.cardOnFile !== true) return res.status(400).json({ error: "Card-on-file consent required" });
  if (!waiverSigned) return res.status(400).json({ error: "Waiver must be signed" });
  if (!appointmentTypeID || !isValidAppointmentTypeID(appointmentTypeID)) return res.status(400).json({ error: "Invalid appointmentTypeID" });
  if (!contact?.firstName || !contact?.email) return res.status(400).json({ error: "Missing contact info" });
  if (!datetime) return res.status(400).json({ error: "Missing datetime" });
  // ... existing validation

  const idempotencyKey = deriveIdempotencyKey(body);

  let payment, cardOnFile, customerId, appointment;

  try {
    // ---- 1. Re-verify slot availability ----
    // (existing logic — call verifyAvailability internally OR query Acuity directly)
    const slotOk = await verifySlot({ appointmentTypeID, datetime, location });
    if (!slotOk) return res.status(409).json({ error: "Slot no longer available" });

    // Re-derive total server-side
    const lineItems = buildSquareLineItems({ appointmentTypeID, addons, location, cleaningFee, participants });
    const totalCents = lineItems.reduce((sum, li) => sum + (li.amount * li.quantity), 0);

    // ---- 2. Customer ----
    customerId = await findOrCreateCustomer({
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone
    });

    // ---- 3. Charge ----
    payment = await createPayment({
      sourceId: squareToken,
      amountCents: totalCents,
      customerId,
      idempotencyKey,
      note: "WhiteWall booking — " + contact.firstName + " " + contact.lastName + " — " + datetime
    });

    // ---- 4. Save card on file ----
    cardOnFile = await createCardOnFile({
      paymentId: payment.id,
      customerId,
      cardholderName: contact.firstName + " " + contact.lastName
    });

    // ---- 5. Build consent proof + create Acuity appointment ----
    const consentProof = {
      square_customer_id: customerId,
      square_card_id: cardOnFile.id,
      square_payment_id: payment.id,
      consent_timestamp: consent.timestamp,
      consent_ip: req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "",
      consent_user_agent: consent.userAgent,
      terms_signature: termsSignature,
      waiver_signed_name: contact.firstName + " " + contact.lastName,
      consent_text_hash: crypto.createHash("sha256")
        .update(buildWaiverText({ fullName: contact.firstName + " " + contact.lastName, locationSlug: location, signedAt: consent.timestamp }))
        .digest("hex")
    };

    appointment = await createAcuityAppointment({
      appointmentTypeID, datetime, location, contact, intake, addons,
      eventIntent, participants, eventDescription, cleaningFee,
      consentProof
    });

    // ---- 6. Background notifications (don't await for response) ----
    // Per project memory: Vercel kills functions after response, so this MUST complete inline OR be a separate endpoint.
    // We do it inline because the user is waiting for the redirect anyway.
    await Promise.allSettled([
      sendCustomerConfirmationEmail({ appointment, consentProof }),
      sendOwnerNotificationEmail({ appointment, payment }),
      maybeNotifyCleaner({ appointment }),
      trackPosthog({ appointment, payment })
    ]);

    return res.status(200).json({
      success: true,
      redirect: "/booking-confirmation?id=" + encodeURIComponent(appointment.id)
    });

  } catch (err) {
    console.error("create-checkout failed:", err);

    // If payment went through but later steps failed → refund
    if (payment && !appointment) {
      try {
        await refundPayment(payment.id, payment.amount_money.amount, "Booking creation failed — automatic refund");
      } catch (refundErr) {
        await alertFailure("REFUND_FAILED", { paymentId: payment.id, err: refundErr.message });
      }
    }
    // If card was saved but appointment failed → also try to disable the card (low priority — Drew can delete via Dashboard)

    await alertFailure("BOOKING_FAILED", {
      err: err.message,
      stage: appointment ? "after_appointment" : (payment ? "after_payment" : (customerId ? "after_customer" : "before_customer")),
      contactEmail: contact?.email
    });

    return res.status(500).json({
      error: err.message || "Booking failed. Your card was not charged.",
      refunded: Boolean(payment && !appointment)
    });
  }
};
```

(The `verifySlot`, `createAcuityAppointment`, `sendCustomerConfirmationEmail`, `sendOwnerNotificationEmail`, `maybeNotifyCleaner`, `trackPosthog` helpers either already exist in the current codebase — extracted from the current `booking-callback.js` — or get pulled out into `api/_lib/booking-flow.js`. Mostly a refactor: move the post-payment logic from `booking-callback.js` into `create-checkout.js` since they now run in the same request.)

### `api/booking-callback.js` — delete

No longer needed. The redirect-after-Square flow is gone. Keep the file for one deploy with a comment + 410 Gone response so any in-flight legacy redirects don't 404, then delete in the next deploy.

```js
// DEPRECATED 2026-05-XX — Square Payment Link callback. Replaced by inline flow in create-checkout.js.
// Remove this file after one week of no traffic.
module.exports = function handler(req, res) {
  return res.redirect(302, "/booking-error?reason=callback-deprecated");
};
```

### `vercel.json`

Confirm there's no Content-Security-Policy header set. (Confirmed earlier — there isn't.) No changes needed.

### `scripts/booking-config.js`

No changes — pricing, durations, add-ons all stay the same.

---

## Acuity appointment notes — consent proof format

Append to the existing notes field at appointment creation time:

```
---
CONSENT PROOF (auto-generated, do not edit):
square_customer_id: CUST_ABC123
square_card_id: CARD_XYZ789
square_payment_id: PMT_DEF456
consent_timestamp: 2026-05-12T14:30:00.000Z
consent_ip: 71.45.123.45
consent_user_agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 ...)
terms_signature: John Smith
waiver_signed_name: John Smith
consent_text_hash: a3f9e2c1...
---
```

Drew can grep his Acuity for `square_card_id:` to find the saved card ID when he wants to charge it for damages. Or eventually we surface it in the future admin UI.

---

## Sandbox testing plan

| # | Scenario | Expected result |
|---|---|---|
| 1 | Happy path: fill flow, use Visa `4111 1111 1111 1111`, check consent box | Payment succeeds, card saved (visible in Sandbox Dashboard → Customers), Acuity appointment created with consent block in notes, redirect to confirmation page |
| 2 | Consent checkbox unchecked | "Pay & Book" disabled, hint shows |
| 3 | Card declined: `4000 0000 0000 0002` | Friendly error, no Acuity appointment, no card saved |
| 4 | Tokenize fails (network drop mid-call) | Friendly error, retryable, no double-charge on retry (idempotency key kicks in) |
| 5 | createPayment succeeds, createCard fails (force via bad test ID) | Payment retained, alert fires for Drew to delete the orphan payment, customer told to contact us |
| 6 | createPayment succeeds, Acuity slot conflict (concurrent booking) | Automatic refund, customer lands on `/booking-error` |
| 7 | MIT later: charge `ccof:customer-card-id-ok` via `chargeCardOnFile()` helper | Successful $25 damage charge, customer gets Square receipt email |
| 8 | MIT later: `ccof:customer-card-id-declined` | Failure, Drew sees error in Square Dashboard, contacts customer for new card |
| 9 | 3DS challenge (test SCA card from Square docs) | SDK pops 3DS modal, customer completes, tokenize resolves, rest of flow proceeds |
| 10 | Mobile Safari iPhone test | Card iframe renders correctly, keyboard behavior OK, no zoom-in glitches |

---

## Production cutover sequence

Per project's production protocol:

1. **Sandbox build complete + all 10 scenarios pass**
2. **Vercel preview deployment** with production env vars (`SQUARE_ENVIRONMENT=production`, real `SQUARE_APPLICATION_ID`, real `SQUARE_PROD_ACCESS_TOKEN`, real `SQUARE_PROD_LOCATION_ID`)
3. **Drew test booking on preview URL** with his own real card. $50 1-hour PV slot. Verify:
   - Card charges
   - Card visible in real Square Dashboard → Customers → Drew → Cards on file
   - Acuity appointment shows up
   - Confirmation email arrives
   - Drew can charge the saved card $0.50 from Square Dashboard
4. **Cancel + refund Drew's test booking** via Square Dashboard + Acuity (real, not sandbox)
5. **Merge to main** — Vercel auto-deploys to the production domain
6. **Monitor first 2 real bookings** — watch Vercel logs live for 24 hours
7. **Rollback ready:** Vercel "Promote previous deployment" button is the kill switch. ~30 sec to revert if something explodes.

---

## Estimated effort breakdown (revised)

| Task | Hours |
|---|---|
| **PR 1** | |
| ↳ T&C copy swap × 2 files | 0.25 |
| ↳ Waiver copy swap × 2 files | 0.5 |
| ↳ Test + commit + push | 0.25 |
| **PR 2 pre-work** | |
| ↳ Get Square Application ID, set env vars, Bitwarden | 0.5 |
| **PR 2 build** | |
| ↳ `/api/booking-public-config` | 0.5 |
| ↳ Square SDK loader + card init in booking-flow.js | 2 |
| ↳ Consent checkbox UI + state + gating | 1 |
| ↳ Square helpers (findOrCreateCustomer, createPayment, createCard, chargeCardOnFile) | 1 |
| ↳ Rebuild `/api/create-checkout` | 2.5 |
| ↳ Extract shared helpers from old booking-callback.js | 1 |
| ↳ CSS polish + mobile responsive check | 0.5 |
| **PR 2 test** | |
| ↳ Sandbox: 10 test scenarios | 2 |
| ↳ Vercel preview + Drew real-card test | 1 |
| **Cutover** | |
| ↳ Merge + monitor 24h | 1 |
| **Total** | **~14 hrs** |

---

## What's deliberately NOT in PR 2

- **Apple Pay / Google Pay** — Square SDK supports them with extra setup. Defer.
- **Admin "charge card on file" UI** — Drew uses Square Dashboard for now. Build the admin UI after he's used Dashboard enough to know what he wants.
- **DB migration of consent proof** — staying in Acuity notes. Future Supabase migration is a separate epic.
- **Webhook integration** — Square webhooks for payment confirmation are unnecessary because we charge inline.
- **Subscription / saved-card refresh on expiry** — Square auto-handles updated card numbers via Account Updater (free, on by default). Nothing to build.
- **Refactor of `booking-config.js`** — pricing/addon data structure stays as-is.

---

## Risks I haven't priced (worth Andrew's eyeballs)

1. **Vercel function timeout.** New `/api/create-checkout` does ~5 sequential API calls (Acuity verify + Square search customer + create customer + create payment + create card + Acuity create + 4 background notifications). Free tier has 10s default. Should fit in 4-7s in normal case, but tight if Acuity is slow. **Mitigation:** move the 4 background notifications to a separate fire-and-forget call, OR upgrade the Vercel function to 30s `maxDuration` (Hobby plan allows up to 60s).
2. **Square's findCustomer fuzzy match.** Customer search by email isn't guaranteed exact-match. We use `{ exact: email }` filter (not `fuzzy`), but worth verifying behavior in sandbox before relying on it for dedup.
3. **Tokenize SCA modal interrupting flow.** The 3DS challenge is a modal injected by Square. On rare bank/card combos, customer might dismiss it accidentally. Tokenize returns `status: "CANCEL"` in that case. We handle gracefully and let them retry.
4. **The "card form still loading" race.** If a customer rushes through and hits Pay & Book before `attach()` resolves, gate it with `state.squareCardReady`. Show "Card form loading..." hint.

---

## Ready to build on `go`. Tell me to proceed.
