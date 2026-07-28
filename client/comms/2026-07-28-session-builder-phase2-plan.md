# Session Builder Phase 2 — locked offer link: build plan (DREW-21)

Authorized by Drew msg `19faa6a33b20bfdb` (2026-07-28 16:28 ET); design answers from
DREW-14 (2026-07-27): fully locked, no extra add-ons, customer contacts Drew to change,
notes show for the customer. Escalation to Andrew open
(`esc-session-builder-phase-2-...-architecture`); ship after verify unless he says hold.

## Architecture (chosen; assume-then-offer to Andrew)

**Self-contained HMAC-signed token + Edge Config active-list.**
- Dashboard signs the offer payload with `BOOKING_SECRET` (same key the site already
  holds on Vercel; now also in the mini's `deploy/poll.env`). Sig scheme = the site's
  existing, unused `signState`/`verifyAndDecodeState` (`api/_lib/acuity.js:732`).
- Link: `https://whitewallstudios.co/book-<location>?offer=<base64url payload>.<hex sig>`.
- Revocation: Vercel Edge Config key `offers` = `{ [draftId]: { h: sha1/sha256 of the
  encoded payload (first 16 hex), t: finalTotalCents } }`, written by the dashboard on
  link generation (mirrors the coupons sync, but REQUIRED not best-effort). Site
  verifies sig AND membership AND hash. Delete draft → entry removed → link dead
  (matches Drew's "delete and make a new one" mental model). Config-changing PUT also
  revokes (Drew regenerates). Regenerating replaces the hash → old copies of the link die.
- Why not draft-id + live dashboard fetch: customer checkout must not depend on the
  mini/tunnel being up. Edge Config is Vercel-native and already in the charge path
  (coupons).
- Payload (v1): `{v:1, id, name, locationSlug, bookingType, eventMode, participants,
  sessions[], override, ownershipAddon, applyOrder, flowState, finalTotalCents, issuedAt}`.
  `sessions[]` is what the server prices; `flowState` drives the exact client restore
  (same snapshot the builder saves); `finalTotalCents` is the dashboard's
  server-recomputed number, cross-checked at charge time.

## Booking site (`worker/offer-link`, one PR)

1. **`scripts/pricing-shared.js`** — add `ownershipAdjustments(baseCents, addon,
   discount, applyOrder)` → `{addonCents, discountCents, finalCents}`; the ONE
   implementation of ownership math (percent on running total at its apply point,
   discount clamped to [0, base], addon sanity caps 1000%/$1M). Client builder math
   (`builderAdjustedTotals`) delegates to it; `create-checkout` uses it; the dashboard's
   generated module inherits it via `sync-booking-pricing`.
2. **`api/_lib/offers.js`** — `getActiveOffers()` (Edge Config key `offers`; fallback
   env `OFFERS` for staging/testing; error → null = unavailable) +
   `verifyOfferToken(token)` → `{ok, payload}` | `{ok:false, reason:
   invalid|revoked|unavailable}` (sig via `verifyAndDecodeState`, then membership+hash).
3. **`api/validate-offer.js`** — POST `{token}` → verdict for early client-side failure.
4. **`scripts/booking-flow.js` OFFER mode** (customer site, gated on `?offer=` and NOT
   BUILDER): decode payload → restore via the builder restore path → LOCK: duration/
   date/time/participants/add-ons inert + grayed (carousel visible), coupon UI hidden,
   deposit forced full; ownership add-on/discount summary lines + italic notes render
   (notes are customer-visible per Drew); total = `finalTotalCents`. Steps 2/3
   (contact, intake, terms, waiver) + payment stay normal. Invalid/revoked → friendly
   "this link is no longer active — contact White Wall" panel, no flow. Availability
   still verified pre-charge; taken slot → friendly error, contact Drew.
5. **`api/create-checkout.js`** — cart path accepts `offerToken`: verify server-side
   (fail loud per reason); sessions built from the PAYLOAD (client rows ignored);
   price = computeCart + `ownershipAdjustments`; **assert == payload.finalTotalCents**
   (mismatch = 500 + alert, never silently charge a drifted number); coupons rejected;
   paymentMode forced full; $0 final → comp path. Acuity notes get "Custom offer: <name>
   (draft <id>)" + ownership lines + notes on the first session; `calendarID` passed
   everywhere as always.
6. **Tests** — ownershipAdjustments pinned to Drew's worked example ($3,546 build +
   $1,000 add-on, 10%: addon-first −$454.60 vs discount-first −$354.60); offer verify
   (round-trip, tamper, revoked, unavailable); checkout offer-path totals.

## Dashboard (`worker/session-link`, one PR)

1. **`app/api/session-links/route.ts`** — POST `{draftId}`: load flow-v2 draft,
   recompute totals, build+sign payload (BOOKING_SECRET), REQUIRED Edge Config upsert
   of the `offers` entry (failure → error, no URL), return `{url}`.
2. **Revocation hooks** — draft DELETE removes the `offers` entry FIRST (removal
   failure → 500, draft kept, so a dead draft can never leave a live link);
   config-changing PUT revokes best-effort + warns.
3. **Builder button** — site repo's builder block wires `[data-builder-link]`: save if
   needed → POST `/api/session-links` → modal with URL + copy + "anyone with this link
   can book at this price; delete the draft to kill it." Vendored in via
   `sync-booking-app` after the site branch lands.
4. **`lib/session-builder/flow-pricing.ts`** — delegate ownership math to the
   regenerated `pricing-shared` so dashboard/site/server are one implementation.
5. Env: `BOOKING_SECRET` added to `deploy/poll.env` (done, 2026-07-28); Edge Config
   env already live (coupons).

## Verify (money path → staging dry-run MANDATORY before prod)

- Unit tests both repos; dashboard `npm run build`.
- Deploy site worktree to **staging.whitewallstudios.co** (project.json guard;
  `vercel deploy --target=staging`); ensure staging scope has `BOOKING_SECRET` (add if
  missing) + seed `OFFERS` env with the test entry (exercises the membership path).
- Full dry-run: locally-signed multi-day offer link → locked UI verified (desktop +
  390px) → pay with sandbox 4111... → assert charged == finalTotalCents, appointment(s)
  on staging calendar 14110701 with offer notes, tampered/revoked links rejected.
- Prod after merge: link render + validate-offer spot-check only. NO real payment on
  prod (that rings a real sale — never part of verify).

## Deliberately out of scope (flagged to Drew later)

- Viewed/paid KPIs on sent links (Drew's "cool to think about" — needs view tracking;
  future ticket). Link expiry dates (Drew controls life by deleting drafts).
