# Drew — flagship Google review incentive + coupon (DREW-89)

- **Source:** Gmail, thread `1a036c426017a325` (subject "Dinner receipt" → running White Wall thread), account `pip@entrpy.co`
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Tue, 25 Aug 2026 21:41:24 -0400
- **Message id:** `1a03bbad862750ca`
- **Classification:** change-request (customer-facing incentive copy + coupon mechanic)
- **Ticket:** DREW-89

## Verbatim

> Amazing. Thank you! I wonder if we can incentivize them to leave a Google review. Specifically for the flagship location. That's the one that I care about. How do you think we can go about doing that for the Powdersville/flagship location? Maybe say something like "leave us a 5 star google review email us once you submit it for a 75% off coupon code for your next session, or to share with a friend" or something like that? Basically telling them to leave the review, then email us saying they did it, then we respond with a custom coupon code that's their last name 75, for 75% off or something like SHAHOUD75.
>
> Can we put that copy and instructions in that follow up google review email and try to entice it?

## Triage

- **What Drew wants:** add copy + instructions to the **flagship (Powdersville) follow-up Acuity email** — the one DREW-88 just filled in — that entices the customer to leave a Google review, then email us to receive a personal 75%-off coupon code (their last name + 75, e.g. `SHAHOUD75`) for their next session or to gift a friend.
- **Flagship only.** This goes on the Powdersville follow-up (Acuity Follow-up 1A). Taylor's Mill (1B) stays as the plain thank-you + review ask. DREW-88 had synced 1A to match 1B; this deliberately diverges them again — flagship gets the incentive, Taylor's does not.
- **Not a repo change.** The follow-up email is an Acuity template (secure.acuityscheduling.com), edited via the Squarespace/Acuity admin (creds `~/.config/entrpy/whitewall-squarespace-acuity.env`).
- **Coupon mechanic:** the codes are minted per-customer when they email in. The booking site already supports percentage codes (`percentOff` 1..99, location-scoped) via the dashboard `POST /api/coupons` → Edge Config. `SHAHOUD75` minted as a live, testable example so Drew can see the loop work end to end.
- **Framing call (Foreman, flagged to Drew + soft-FYI Andrew):** wrote the email to ask for a review (not specifically a "5-star" review). Conditioning a discount on a 5-star rating is exactly what Google removes reviews for and can flag a listing over (review-gating), and the FTC requires the incentive not be tied to the sentiment. Rewarding the *act* of leaving an honest review is fine. Offered Drew the literal "5 star" wording as a one-line swap if he prefers.
- **Money gate:** the 75%-off offer is Drew's own business promo on his flagship — Drew self-authorizes WWS money/policy calls. Not spending company money; reversible (codes deactivate). Ship it; soft-FYI Andrew because it is Foreman-authored customer-facing incentive copy with a compliance nuance.
