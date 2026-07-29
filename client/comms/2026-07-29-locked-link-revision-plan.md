# Build plan — Session Builder locked-link revision (DREW-24/25/26)

Source: Drew msg `19fae1d88616f9ea` (2026-07-29), logged verbatim at `2026-07-29-drew-locked-link-three-issues.md`.
Two repos: `white-wall-mockup` (booking site, one PR) + `wws-dashboard` (dashboard, one PR). `booking-flow.js` is
VENDORED into the dashboard by `wws-dashboard/scripts/sync-booking-app.mjs` (re-run after booking-site edits).

Money-adjacent (locked customer checkout) → **full staging money dry-run required before prod** (Square sandbox +
Acuity staging cal `14110701`), per the foreman money rule.

---

## DREW-24 — Short offer links

**Root cause:** offer URL = `${SITE_BASE}/book-<slug>?offer=<base64url payload>.<hexsig>` (session-links.ts:119-121) —
a ~4KB token in the query string. iMessage/Notes/email link-detection truncates it. Fix: keep the token OUT of the URL.
`session_draft.id` is a UUID (offers.js:36) → unguessable → safe to put in the URL.

**Design:** store the full signed token in the Edge Config entry; URL carries only `?offer=<draftId>`; booking site
fetches the token from a new resolve endpoint. HMAC signature + hash-match + pay-time reverify all UNCHANGED — Edge
Config just becomes the delivery channel instead of the URL.

### Dashboard (`wws-dashboard`)
- `lib/session-links.ts`:
  - `offerUrl(locationSlug, draftId)` → `` `${SITE_BASE}/book-${locationSlug}?offer=${draftId}` `` (was encoded.sig).
  - `activateOffer(draftId, hash, totalCents, token)` → store `{ h: hash, t: totalCents, tok: token }` (add `tok`).
    (`token` = `encoded + "." + sig`.)
- `app/api/session-links/route.ts`: pass the full token to `activateOffer`; build the URL from `draft.id`
  (compute `token = encoded + "." + sig`).

### Booking site (`white-wall-mockup`)
- **New `api/resolve-offer.js`** (GET `?id=<draftId>`): read the Edge Config entry via `getOfferEntry(draftId)`
  (offers.js), return `{ token: entry.tok }` when live; 404/410 when missing/revoked; 503 when unreadable (fail CLOSED).
  Reuse `offers.js`; add a small `resolveOfferToken(draftId)` helper there that returns `entry.tok || null`.
- `scripts/booking-flow.js` boot (lines 40-65, 1619-1638):
  - Factor the token→payload decode (current lines 46-61) into `decodeOfferToken(token)` returning payload|null.
  - Sync parse: if `offerRaw` contains `.` → decode inline (old long links still work when pasted whole). Else → it's a
    SHORT id: set `OFFER_SHORTID = offerRaw`, do NOT set OFFER_BROKEN yet.
  - Boot: `if (OFFER)` → `setTimeout(initOfferMode,0)` (unchanged). `else if (OFFER_SHORTID)` → show a loading overlay
    (`showOfferLoadingPanel()`), `fetch('/api/resolve-offer?id='+OFFER_SHORTID)` → on `{token}` decode →
    set OFFER/OFFER_TOKEN → `initOfferMode()` (removes overlay); on 404/410 → `showOfferErrorPanel('revoked')`;
    on 503/network → `showOfferErrorPanel('unavailable')`; on bad token → `'invalid'`. `else if (OFFER_BROKEN)` → invalid.
  - Add `showOfferLoadingPanel()` (full-screen "Loading your session…" overlay, class `offer-loading-overlay`, removed
    when initOfferMode runs) so the un-prefilled flow never flashes during the ~50-100ms resolve.

---

## DREW-25 — Locked customer flow lands at Step 3 and can proceed to pay

**Today:** `initOfferMode()` calls `setStep(1)` (booking-flow.js:1600); multi-day forward CTAs (`range-review`,
`md-review`) are locked and the in-panel Continue is hidden → customer stranded on the schedule step.

### booking-flow.js
1. **Land on the first fillable step.** In `initOfferMode`, replace `setStep(1)` with
   `setStep(offerLandingStep())` where `offerLandingStep()` = `3` when the build is an event
   (`state.bookingType === 'event'` / `OFFER.bookingType === 'event'`), else `2` (non-event Details). Verify the
   non-event step-2 = Details during impl; default 2.
2. **Conditional unlock of the customer's own fields.** Reassign the effective lock lists at the TOP of `initOfferMode`
   (before `injectOfferStyles`), from OFFER flags:
   - `OFFER_LOCKED_INPUTS = ["[data-input='high-traffic-note']","[data-input='coupon-code']"]`
     - push `participants` + `intake-participants` IFF `OFFER.lockParticipants`
     - push `event-description` IFF `OFFER.lockEventDescription`
   - `OFFER_LOCKED_CHECKS = ["[data-action='set-placement']","[data-action='set-last-day-leave']"]`
     — i.e. REMOVE `food-drinks-yes/no` (customer always answers food/drinks).
   - `OFFER_LOCKED_ACTIONS` unchanged (all pricing/scheduling stays locked).
   - Acknowledgment checkboxes (`cleanup/capacity/self-service`) already unlocked → customer ticks them (unchanged).
   The CSS injection, the `beforeinput` guard (line 1595), and the bindEvents guards all read these vars at
   init/event time, so reassigning before `injectOfferStyles()` is sufficient.
3. **Working continue from Step 3.** Confirm the event Step-3 → Step-4 (Waiver) continue button exists and is NOT
   hidden/locked in offer mode (the hidden-continue at 2889/2935 is the multi-day SCHEDULE step, step 2 — not step 3).
   Customer path in offer mode: 3 (Details, partly editable) → 4 (Waiver) → 5 (Review & Pay). Fix/verify during impl.

### create-checkout.js — price stability (CRITICAL, guarantees no 409 from customer participant entry)
- Line 1173-1178: `cartMaxAttendees` currently reduces over `normalized[].participants`. **In offer mode, derive it from
  `offer.participants` instead** so the cleaning fee always matches what the dashboard signed (`computeFlowV2Totals`
  used `config.participants`). The customer's real count still flows into `normalized[].participants` → Acuity notes,
  but never re-prices. (`computeCart` at 1161-1166 does not use participants, so this fully decouples price from the
  customer's count.) One conditional:
  `var cartMaxAttendees = offer ? (String(offer.participants||'').match(/\d+/) ? parseInt(...,10) : 0) : normalized.reduce(...)`
- `offerCartBody` (962+): keep threading the customer's submitted participants (+ foodDrinks, + eventDescription when
  not locked) into the sessions so they reach the Acuity notes; only the PRICED `cartMaxAttendees` is pinned to
  `offer.participants` above. Verify offerCartBody tail (975-985) + how the client submits step-3 inputs at checkout
  during impl; ensure the customer's food/drinks + description + participants land in notes.

---

## DREW-26 — Builder field visibility + optional prefill + "Start New Session Build"

### booking-flow.js (renders in both customer + builder via `BUILDER`)
- `getEventFormHtml()` (3947-4016): wrap the **food/drinks fieldset** (3986-3998) and the **Required acknowledgements
  panel** (3999-4013) in `${!BUILDER ? \`...\` : ""}` so they render for the customer but NOT in the dashboard builder.
- `renderEventStep()` / `getEventFormHtml`: in `BUILDER`, mark the participants label + "Tell us about your event"
  label as **optional** (e.g. append " (optional)") — Drew fills them or leaves them blank.
- No change to the customer offer flow from these (guarded on `BUILDER`), except food/drinks + acknowledgments continue
  to show for the customer (they always did).

### Dashboard (`wws-dashboard`)
- **Payload lock flags** — `lib/session-links.ts` `buildOfferPayload` (84-100): add
  - `lockParticipants: Number(config.participants) > 0`
  - `lockEventDescription: !!(config.flowState && String(config.flowState.eventDescription||"").trim())`
  `participants` + `flowState.eventDescription` already ride the payload (applyFlowState restores them → customer sees
  the prefill), so NO new first-class `eventDescription` config field is required. The flags only decide editability.
- **"Start New Session Build" button** — add next to the Session Builder title. Cleanest: in
  `components/session-builder-embed.client.tsx` header (near the title / iframe controls), a button that resets the
  builder: clear the selected/loaded draft id + minted link and reload the iframe to a fresh build (embed reset seam
  lines ~54/114-122; the embed already has a `wws-builder-new` reset affordance inside the panel). Label exactly
  "Start New Session Build".
- **Re-run `npm run sync-booking-app`** so the vendored `booking-flow.js` matches the booking-site edits.

---

## Verify
- Booking site: 34+ existing offer tests + new short-link/resolve + conditional-lock cases; `node --check`.
- Dashboard: `npm run build` + unit tests (session-links, payload flags).
- **FULL STAGING MONEY DRY-RUN** (staging site + Square sandbox + Acuity staging cal 14110701):
  1. Mint a link in the dashboard → confirm URL is SHORT (`?offer=<uuid>`, single line).
  2. Open the short link → loads (no flash) → lands on Step 3 → pricing/dates/times/add-ons locked.
  3. Drew-prefilled participants/description → locked; blank → editable; food/drinks + acknowledgments always editable.
  4. Fill customer fields → Continue → Waiver → Pay with sandbox card → charge EXACTLY finalTotalCents; appointment(s)
     on the staging calendar with the offer note + the CUSTOMER's participant count in notes.
  5. Customer enters ≥35 participants on a single-day event where Drew left it blank → price does NOT change, no 409.
  6. Tampered / revoked / superseded short links → stop card.
- PROD verify without payment: mint a live short link, confirm it pastes clean in a real iMessage (single linkified
  URL, preview opens the right locked session), lands on Step 3; then delete the draft → link revoked (~5s).

## Ship + close
- One PR per repo → merge booking site (Vercel) → merge dashboard → pull/build/kickstart mini → `npm run
  sync-booking-app` on the mini → prod-verify on :18794 + live booking page → confirm "it's live" to Drew (fulfilling
  the open promise) → DREW-24/25/26 done → revision-status Round 63 → SESSION-STATE CURRENT.
