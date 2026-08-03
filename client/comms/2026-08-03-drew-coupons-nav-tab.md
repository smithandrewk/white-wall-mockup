# Drew — Coupons as its own nav tab + status request (2026-08-03)

- **Source:** Gmail thread `19fa478568fc46a2` (WhiteWall Dashboard Revisions)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Mon, 3 Aug 2026 17:30:53 -0400
- **Message-id:** `19fc9899a04cf205`
- **Classification:** change-request (Coupons nav tab) + question (status roundup)
- **Ticket:** DREW-50 (coupons nav tab). Status question answered inline in reply.

## Verbatim

> Pip,
>
> I also want to pull the coupons tab out of the campaigns tab and make it its own separate line item tab right underneath campaigns. Let's also make it the same color as the campaigns tab as well, so I can just very quickly go and see all the different coupons we have available here.
>
> Can you give me a status on all the things we are working on right now? I've sent a ton of emails. Where does everything stand right now? What is being worked on, etc.?

## Disposition

- **Coupons nav tab** — SHIPPED. wws-dashboard PR #117 (`26853d0`), merged + deployed, prod-verified on :18794. DREW-50 → done. Coupons promoted to its own top-level lens directly under Campaigns (orange, shared with Campaigns), Coupon Tracking folded in as its sub-tab; deep-link routes unchanged.
- **Status question** — answered inline in the reply (roundup of live/in-flight/blocked). Called out the Calendar write-back controls (DREW-47) as the single open item, on our side (Andrew), because it writes to live Acuity + runs real Square refunds.
- **Reply sent** autonomously (Foreman past cold-start, armed): sent id `19fc99707f3d66ab`, in-reply-to `19fc9899a04cf205`, thread `19fa478568fc46a2`.
