# Deposit & Auto-Charge Policy — draft (V3 item 6)

Status: **DRAFT for legal/human review before it goes live.** Charging a stored card 48 hours out and keeping a non-refundable deposit is consumer-law sensitive (T018 decision #5 caveat). This is the customer-facing policy text plus the enforcement rules the code implements. Applies to **event bookings only** (Powdersville, 2h+).

## Customer-facing policy text (for Terms + the checkout deposit panel)

**Event Deposits & Balance**

Event bookings require a deposit to reserve your date. You choose at checkout:

1. **Pay the 60% deposit now.** The remaining 40% is automatically charged to the card on file 48 hours before your first session begins. The 60% deposit is non-refundable from the moment it is paid.
2. **Pay 100% now.** Your booking is paid in full. If you later cancel, up to 40% of the total is refundable; the 60% deposit portion is non-refundable from the moment of payment.

By booking an event you authorize WhiteWall Studios to automatically charge the card on file for the remaining balance 48 hours before your first session, with no further action needed from you. You will receive reminders before that charge. If the 48-hour charge does not go through, we will email you to update your card and you can pay the balance from your account; your reservation is held while we sort it out.

## Enforcement rules (what the code does)

- **Deposit split:** deposit = round(total x 0.60); balance = total minus deposit. Events only. (Already implemented additively in `create-checkout.js` cart path; balance fields stored, nothing fires yet.)
- **Non-refundable line:** the 60% deposit is non-refundable from payment. The refund endpoint (when built) caps any refund at the 40% balance portion and never returns the deposit.
- **Auto-charge timing:** balance charged once, at (first session start) minus 48h, for **40% of the entire remaining cart total** (one charge for the whole order, per Drew 2026-06-22).
- **Auto-charge failure path (Drew 2026-06-22):** retry x3, then lock out → email the customer to update the card + expose a "pay balance" action in their profile, alert the whitewallstudios email, and Watson-text Drew. **Never auto-cancel the appointment.**
- **Scheduler:** Supabase `pg_cron` selects due rows (~every 15 min) and calls the authenticated booking-site charge endpoint, which holds the Square write creds and fires `chargeCardOnFile`. The booking site stays the sole charging authority (T018 decision #2). **Not armed yet — built behind a flag, fires only after this policy is signed off + a staging dry run.**

## Open for human/legal eyeball before live
- The exact non-refundable wording and any required cancellation-window disclosure for SC consumer law.
- Whether the existing card-on-file consent block (framed around merchant-initiated damage/fee charges) needs an addendum covering the scheduled balance auto-charge under a self-service account.
- Confirm 48h (not 24h/72h) is the final auto-charge lead time with Drew.
