# Drew — change the Google review incentive from 75% off to a flat $100 off (Round 143 / DREW-89)

- **Source:** Gmail, thread `1a049294d382889a` (subject "WhiteWall Revisions"), account `pip@entrpy.co`
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Fri, 28 Aug 2026 12:17:04 -0400
- **Message id:** `1a049294d382889a`
- **Classification:** change-request (customer-facing incentive mechanic + copy) + question (rundown) + deliverable (proposal)
- **Ticket:** DREW-89 (the flagship Google-review incentive campaign; reopened)

## Verbatim

> Pip, send me link. Soon. Gotta change something important.
>
> Give me a rundown as to hwo our incentives work rn with for the Google review, me and Max talked, and if we actually locked in the 75% language, we need to change that. We want to make it a flat $100 off their next booking, whether it's an event or a session. It doesn't matter if you get $100 off their next booking, but they need to send us proof that they left a Google review.
>
> We need to change all the language about that email campaign and everything. 75% works. It's like a one- or two-hour session, but if it's a full-blown event... that definitely won't work.
>
> Give me a rundown of exactly what we have, and then what the subject line is and what the email is. Give me a proposal as to what you want to change the subject line and email copy to.

(Access: Drew paid $30, invoice `54a3d181-69c8-4f6f-8141-c52c48228de1`; window active through 2026-08-29 06:00, armed=ON. "Paid. Lets get ti" = msg `1a0492cf7affc15e`.)

## Triage

- **What Drew wants:** (1) a rundown of how the Google-review incentive works right now (the 75% off) — where it lives, the exact subject line, the exact email copy, and how the coupon works; (2) a change from **75% off → a flat $100 off** the customer's next booking, event OR session, still requiring proof they left a Google review; (3) all campaign language changed to match; (4) a **proposal** from Foreman for the new subject line + body copy, for him to approve before it ships.
- **Why:** 75% off is fine on a one to two hour session but far too much money off a full event.
- **Ticket judgment:** same work as **DREW-89** (the flagship review-incentive campaign that Rounds 127-129 built). New thread, but it is a mechanic + copy revision of that same campaign → reopened DREW-89, add-msg `1a049294d382889a`, comment.
- **No hard escalation.** Drew owns WWS promo/money calls (this is his own review incentive on his own flagship, reversible, no company money). Soft-FYI recorded for Andrew because it is Foreman-authored customer-facing incentive copy with a compliance nuance (same class as the Round 127 soft-FYI). Nothing here is money-architecture-legal-at-scale.
- **Path:** Drew explicitly asked for a proposal to review before it goes live, so this round delivers the rundown + proposal and does NOT flip the live email yet. On his "go," the ship is a fast Acuity edit + retiring the 75% code.

## What we have today (the rundown given to Drew)

- **Where:** Acuity flagship **Follow-up 1A** email (Powdersville only), sent one day after a Powdersville session. Taylor's Mill (1B) has no incentive.
- **Subject:** `%first%, WhiteWall 75% off for a Google Review` (renders e.g. "Laurie, WhiteWall 75% off for a Google Review").
- **Body (verbatim live copy):**
  > %first%, how was your session?
  > We would love to give you 75% off your next booking, for you or a friend, just for leaving us a quick Google review.
  > Here is how:
  > 1. Leave us a review at the link here.
  > 2. Email us at contact@whitewallstudios.co to let us know.
  > 3. We will send you your personal 75% off code for your next session at our Powdersville flagship studio, yours to use or to gift a friend.
  > Thanks so much. We cannot wait to host you again!
- **Coupon mechanic:** when a customer emails proof, we mint them a personal one-time code in the dashboard (last name + 75, e.g. `SHAHOUD75`). Today it is a **percentage** code, so the 75% comes off the **session line only**, not the add-ons.

## The proposal (sent to Drew)

- **Switch the code from 75% to a flat $100 off.** Percent codes are capped at 1..99 and hit the session line only; a **flat `amountOffCents` code comes off the whole order** (session + add-ons), so $100 is $100 whether it is a short session or a full event — no runaway discount on a big event.
- **Codes become last name + 100** (`SHAHOUD100` instead of `SHAHOUD75`), Powdersville, one use.
- **Proposed new subject:** `%first%, $100 off your next booking for a Google review` (alt closer to his old line: `%first%, WhiteWall $100 off for a Google review`).
- **Proposed new body:**
  > %first%, how was your session?
  > We would love to give you $100 off your next booking, whether it is a session or a full event, for you or a friend, just for leaving us a quick Google review.
  > Here is how:
  > 1. Leave us a review at the link here.
  > 2. Email us at contact@whitewallstudios.co to let us know.
  > 3. We will send you your personal $100 off code for your next booking at our Powdersville flagship studio, yours to use or to gift a friend.
  > Thanks so much. We cannot wait to host you again!
- **Two calls surfaced to Drew:** (1) keep it flagship-only like today (events only happen at Powdersville anyway), or also run $100 on Taylor's Mill sessions? (2) kept the wording "leave us a review" not "leave us a 5 star review" on purpose — tying a discount to a 5-star rating specifically is what Google pulls reviews / flags listings for (review-gating); rewarding the review itself is the safe version. Offered his exact words if he prefers.

## Testable sample minted (Drew validates by using it)

- **`SHAHOUD100`** minted live via loopback `POST :18794/api/coupons` (`amountOffCents:10000, locationSlug:powdersville, maxUses:1`), coupon id `0ba0347c-ff49-4c45-895d-a6603aff629f`, location_id 6255578 (Powdersville).
- **Verified propagated to prod Edge Config:** `POST whitewallstudios.co/api/validate-coupon` → Powdersville `{valid:true, amountOff:10000, label:"$100 off (SHAHOUD100)", discountCents:10000}`; Taylor's Mill → rejected. Drew can plug it into the flagship checkout right now to see the $100 come off.

## Actions this round

- Ack sent: msg `1a0492f8ee742f84` ("payment in, back at the keys, rundown coming").
- Rundown + proposal sent: msg `1a04931af96ab641`.
- SHAHOUD100 demo minted + prod-verified (above).
- DREW-89 reopened → in_progress, add-msg `1a049294d382889a`, commented the change.
- **On Drew's go:** swap Acuity Follow-up 1A subject + body to the $100 version, retire the live 75% code (SHAHOUD75), and mint `<lastname>100` codes going forward.

## Send authorized

Post cold-start autonomous, armed=ON (Drew's active $30 window). No customer-facing send in this round beyond the partner reply to Drew.
