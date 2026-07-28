# Card-on-File Legal Review — White Wall Studios

**Reviewer:** Pip (AI attorney-style review) · **Date:** 2026-06-12
**Scope:** Gate 2 of the card-on-file production cutover — the enforceability and consent sufficiency of the binding text the customer agrees to before a card is stored and charged.
**Materials reviewed:**
- Terms & Conditions v2 (19 points) — `2026-05-11-drew-email-card-on-file-and-tc-waiver-updates.md`, live in `book-*.html`
- Liability Waiver & Use Agreement v2 (12 sections) — same source, live in `api/_lib/waiver-text.js` + `renderWaiver()`
- Card-on-file consent checkbox + the "Name on card" field — `book-*.html` payment panel
- Consent-proof capture — `create-checkout.js` (IP, UA, timestamp, typed signatures, SHA-256 of exact waiver text → Acuity notes)

> ⚠️ **Caveat — read first.** This is an AI risk review, not legal advice, and it is **not a substitute for a South Carolina–licensed attorney** signing off before real cards are charged. The items below are issues to resolve or have counsel confirm; several touch card-network rules and consumer-protection law where a licensed opinion matters. Drew's stated goal — *"they signed off and authorized us, so they have no leg to stand on"* — is achievable, but a few gaps below are exactly where a "leg to stand on" currently exists.

---

## Overall assessment

**Strong foundation, not yet airtight.** The authorization language is unusually thorough for a studio of this size: the charge right is granted **redundantly** in both the T&C (§§3, 6, 9, 10) and the Waiver (§§5, 6, 7), each charge category is named, the dollar mechanics ($130 / 15-min) are specific, e-signature validity is expressly addressed, and the consent-proof capture is genuinely good chargeback evidence. **Three issues should be closed before cutover** (one is a real enforceability hole), plus two worth confirming with counsel.

**Recommendation: conditional go.** Fix Finding 1 (cardholder authorization) and Finding 2 (stored-credential disclosure) before charging real cards; the rest can follow fast or ride a counsel pass.

---

## High-priority findings

### 🔴 Finding 1 — The person who authorizes storage may not be the cardholder
**This is the biggest hole, and the new "Name on card" field widened it.** Every authorization ("I authorize WhiteWall to charge the card/payment method used for booking…") is signed by **the booker**. But we now explicitly support a **different cardholder** (the "Name on card" helper says *"may differ from the booker"* — business card, spouse, planner). Card-network rules (Visa/Mastercard stored-credential framework) require the authorization to come from **the cardholder**. If the booker authorizes storage of someone *else's* card, the actual cardholder never consented — and a damage charge weeks later is a clean chargeback ("I never authorized a stored card") that our consent proof does **not** rebut, because it's signed by the wrong person.
- **Fix (pick one):**
  - **(a) Constrain it:** add to the consent checkbox — *"I confirm I am the cardholder, or I am authorized by the cardholder to store this card and approve these charges."* Cheap, closes most of the gap.
  - **(b) Strongest:** require the name-on-card to match the booker, or capture a second attestation when they differ.
- Either way, the consent-proof block should record the **name-on-card** value (it currently stores `waiver_signed_name` = booker; add `cardholder_name`).

### 🔴 Finding 2 — Stored-credential disclosure language is implicit, not explicit
Card networks require that, at the time of storing a credential, the customer be told **(i)** the card is being **stored for future use**, and **(ii)** **how/when** later charges will occur (merchant-initiated, specific triggers). The consent checkbox says *save on file and charge it for [categories]* — good on the "what," thin on the "stored credential / merchant-initiated, without further notice" framing.
- **Fix:** tighten the checkbox to name it: *"…store this card on file and **charge it on a merchant-initiated basis, without further notice or approval**, for the fees described…"* The Waiver §5 already has the "without additional approval" concept — mirror it at the point of storage.

### 🟠 Finding 3 — D2 content-use permission is entirely absent
There is **no** language granting WhiteWall the right to reshare, repost, or use customer content/photos for portfolio/marketing (the D2 wishlist item, GitHub #16 — not built). If Drew ever reposts a client's shoot, there is currently **no signed permission**. Separate from card-on-file, but it shares the same checkout/waiver surface and should be drafted and reviewed **together** to avoid a second legal pass.
- **Fix:** add an opt-in (not bundled into the mandatory waiver) content-use clause. Keep it **separate and optional** — bundling a marketing-rights grant into a mandatory booking waiver weakens consent and invites a consumer-protection challenge.

---

## Medium-priority (confirm with counsel)

### 🟡 Finding 4 — "$130 per 15-minute increment, even by one minute" — penalty vs. liquidated damages
A flat $130 per 15 minutes "even by one minute" can be attacked as an **unenforceable penalty** rather than a good-faith **liquidated-damages** estimate if it's disproportionate to actual harm (a 1-minute overstay = $130). SC courts enforce liquidated damages only when (a) actual damages are hard to estimate and (b) the amount is a reasonable forecast. The cleaning/overlap rationale supports it, but the "even by one minute" framing is the vulnerable phrase.
- **Mitigation:** counsel may suggest framing it as recovery of the studio's reset/turnover cost, or a brief recital of *why* (back-to-back bookings, cleaning windows) to support reasonableness. Low litigation risk at this dollar size, but it's the clause most likely to lose if contested.

### 🟡 Finding 5 — Open-ended damage amounts
Damage/repair/replacement/labor charges (T&C §9, Waiver §7) are **uncapped and not pre-disclosed**. That's normal and defensible, but stored-credential best practice is to state the **basis** ("actual repair or replacement cost, plus labor") — which the text mostly does. Consider adding that the customer will be **notified of the amount and basis** before or at the time of a damage charge (a notice step also strengthens chargeback defense).

---

## What's already solid (keep)

- **Redundant authorization** across T&C + Waiver for each charge category — belt and suspenders.
- **Specific mechanics** for the deterministic fees ($130/15-min; $130 min cleaning).
- **E-signature validity** expressly addressed (Waiver §12) — aligns with ESIGN/UETA; the typed-name + intent pattern is enforceable.
- **Gross-negligence/willful-misconduct carve-out** in the release (Waiver §2) — important; a release with no carve-out can be void as against public policy.
- **Indemnification survives** the booking (Waiver §3).
- **Governing law** fixed to SC (T&C §19, Waiver §12); **binding-contract** acknowledgment (T&C §19).
- **Consent proof** (IP, UA, timestamp, signatures, **SHA-256 of the exact waiver text** the customer saw) — this is genuinely strong chargeback evidence and ties the signature to a specific document version. Excellent.

---

## Pre-cutover checklist (legal)

- [x] **Finding 1** — cardholder-authorization attestation added to the consent checkbox; `name_on_card` + `cardholder_authorization` now recorded in the consent-proof block. **Implemented + verified live on staging 2026-06-12 (PR #42).**
- [x] **Finding 2** — explicit stored-credential / merchant-initiated disclosure added to the checkbox ("stored… and charged on a merchant-initiated basis, without further notice or approval"). **Implemented + verified live on staging 2026-06-12 (PR #42).**
- [ ] **Finding 3** — draft separate, optional D2 content-use permission; review with the same counsel pass.
- [ ] **Finding 4 / 5** — counsel confirmation on the $130/15-min penalty framing and damage-notice step. *(can ride the human-attorney pass; low risk to launch)*
- [ ] **Human attorney sign-off** on the above before the first real card is charged in production.

### Implemented consent string (both booking pages, live on staging)
> "I am the cardholder, or I am authorized by the cardholder to store and use this card. I authorize WhiteWall Studios, LLC to securely store this card on file and to charge it on a merchant-initiated basis, without further notice or approval, for damage, early entry / late exit fees ($130 per 15-minute increment), unauthorized add-on use, and cleaning fees, as described in the Terms & Conditions and Liability Waiver I signed above."

---

## Bottom line for Drew

The hard part — getting a real, signed, evidence-backed authorization for post-session charges — is **done and done well**. Two tightenings (confirm the person is the cardholder; explicitly say "stored and charged later without further notice") turn "strong" into "hard to fight." The $130-per-15-min clause is enforceable in spirit but is the one most worth a lawyer's eye, and the marketing/repost permission still doesn't exist at all. Close Findings 1–2, fold 3–5 into a single licensed-attorney pass, and the card-on-file system is on firm legal footing for cutover.
