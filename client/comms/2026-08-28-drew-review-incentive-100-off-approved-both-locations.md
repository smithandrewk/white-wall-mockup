# Drew — GO: ship the flat $100 review incentive, for BOTH locations (Round 144 / DREW-89)

- **Source:** Gmail, thread `1a049294d382889a` (subject "WhiteWall Revisions"), account `pip@entrpy.co`
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Fri, 28 Aug 2026 (reply on the Round 143 proposal thread)
- **Message id:** `1a04933ce7f57eeb`
- **Classification:** approval (of the Round 143 $100 proposal) + change-request (scope: both locations)
- **Ticket:** DREW-89 (flagship Google-review incentive campaign; in_progress → shipping)

## Verbatim

> Let's go ahead and fix it all to be the $100 option, and we can make it for both locations. It doesn't matter if it's Taylor's Mill or Powdersville. We want them on both, regardless.

## Triage

- **Approves** the Round 143 proposal: switch the Google-review incentive from 75% off to a **flat $100 off** the next booking (event or session), still requiring emailed proof of a Google review. Full proposal + rundown: `2026-08-28-drew-review-incentive-100-off-proposal.md`.
- **Answers open call (1) — location scope:** run it at **BOTH** studios (Powdersville AND Taylor's Mill), "regardless." The Round 143 proposal had asked flagship-only vs both; Drew says both.
- **Open call (2) — review wording** ("leave us a review" vs his "5 star" line) — not addressed this message. Kept the compliance-safe "leave us a review" (tying a discount to a 5-star rating specifically is review-gating, which Google removes reviews / flags listings over). His exact words remain a one-line swap on request; flagged again in the reply.
- **No hard escalation.** Drew owns WWS promo/money calls; his own review incentive on his own studios, reversible, no company money moved. Foreman-authored customer-facing copy → soft-FYI to Andrew (same class as Rounds 127/143).
- **Path:** fast ship — Acuity email edits (both Follow-up templates) + coupon mechanic already both-locations-capable. Now that Drew approved, the live email flips (no repo/code change; Acuity dashboard + live coupons).

## What shipped

### 1. Coupon mechanic → flat $100, both locations (LIVE + prod-verified)
- **Retired the 75% mechanic:** `SHAHOUD75` deactivated (PUT active:false; record + any redemption history preserved). Prod `validate-coupon` now rejects it.
- **Demo `SHAHOUD100` → both locations:** PUT `locationSlug:"any"` (location_id null = company-wide) — flat `amountOffCents:10000` off the WHOLE order (session + add-ons), one use. Prod-verified valid at Powdersville AND Taylor's Mill (`{valid:true, amountOff:10000, label:"$100 off (SHAHOUD100)"}` at both). Drew can test the $100 in either studio's checkout.
- **Going-forward per-customer minting:** when a review-proof email lands, mint `<lastname>100` with `amountOffCents:10000, locationSlug:"any", maxUses:1` (loopback `POST :18794/api/coupons`) — valid at either studio, off the whole order.

### 2. Acuity follow-up emails → $100 copy, both locations
- (documented in the shipping section below once applied)

## Actions this round
- Logged verbatim (this file).
- Coupon writes done + prod-verified (above).
- Acuity Follow-up 1A (Powdersville) + 1B (Taylor's Mill) swapped to the $100 copy.
- Reply to Drew + DREW-89 → done.
