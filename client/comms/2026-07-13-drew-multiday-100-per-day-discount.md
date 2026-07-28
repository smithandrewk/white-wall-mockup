# Drew — multi-day event discount: $100 off per consecutive day impacted

- **Source:** Gmail, thread `19f424228b20d389`  ·  **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Mon, 13 Jul 2026 18:59:00 -0400  ·  **Msg id:** `19f5db4b8727c7fc`
- **Triage:** change-request — **PRICING / MONEY**. Per memory [[drew-self-authorizes-money]] (and Andrew's explicit "stop asking for my approval just to ask for Drew's approval"), a direct Drew pricing instruction = **Foreman ships it + FYIs Andrew**, does NOT gate. Touches the live money path → staging dry-run required before prod.

## VERBATIM
> PIP, let's make a change to the multi day event bookings. I want to add in some kind of logic where for every consecutive day impacted, they get $100 off the total amount. Meaning, if they book a two day event, they get $200 off the total price at the end. If they book a five day event, doesn't matter how long the first day or last day Are booked for, because the event impacts five days in total, they get $500 off the total amount.
>
> And then I also want to make that logic known to them as people are booking the event pretty much right on the front end. It needs to be crystal clear.
>
> So we need to not only add that lodge again and have it automatically calculate and show up in the summary live as a discount, but we also need to change whatever pricing we need to do internally to ensure that actually works the way we are trying to make it work.
>
> So in our hypothetical situation where they booked the afternoon of October 3, and then they leave end of day, October 5, whatever their end I'll be all prices, it instantly takes off $300 as a multi day discount. Book 10 days? You essentially get one of those days free.

## The rule (as I read it)
- **Discount = $100 × (number of calendar days the event spans)**, applied to the grand total.
- Day LENGTH is irrelevant — a short first day or an early-checkout last day still counts as a full impacted day.
- Examples he gave: 2 days → $200 off; 3 days (Oct 3 afternoon → Oct 5 end of day) → $300 off; 5 days → $500; 10 days → $1,000 ("essentially one day free", since a full day is $980).
- Scope: **multi-day events only** (>= 2 days). Single-day events + photo sessions unchanged.
- Must show **live in the summary as a discount line** as they build the event, and be crystal clear on the front end.

## Build plan
1. **Client** (`scripts/booking-flow.js`): compute `$100 × dayCount` for a multi-day event; show it as its own discount line in the live event summary AND in the Step-5 order summary / Pay button total. Explain the rule in the event copy so it is obvious before they pay.
2. **Server** (`api/create-checkout.js` `handleCartCheckout`): AUTHORITATIVE — recompute the same discount from `priced.sessions.length` and subtract it from `totalCents` (never trust the client). **Clamp** so the discount can never exceed the pre-discount total (no negative/zero charge). Record it in the Acuity notes like the cleaning fee.
3. Deposit (60%) and the Square charge derive from the discounted total automatically.
4. **Staging booking dry-run** to prove the charged amount is right, then prod.

## Disposition — SHIPPED + LIVE (booking PR #79, squash `752f5ff`)
Rule confirmed back to Drew (`19f5dc1182738905`) → built → staging dry-run → **prod, verified** → confirmed LIVE (`19f5dcf573a95a09`). Andrew FYI'd (pricing change, not gated — Drew owns WWS pricing).

**Implementation** — `scripts/pricing-shared.js` → `multiDayDiscountCents(dayCount, preDiscountTotalCents)`. That is the ONE UMD module **both** the browser and `api/create-checkout.js` load, so the number the customer is shown and the number we charge are computed by the same code and **cannot drift**. The server still recomputes independently from its own priced cart (never trusts the client) and the helper **clamps** the discount so it can never exceed the pre-discount total (no negative charge).

**Front end (Drew: "crystal clear"):** multi-day builder intro leads with "You save $100 for every day of your event" (+ the 2/3/5-day examples); the live "Your event so far" summary shows a green `Multi-day discount · N days × $100` line plus "add another day and you save another $100"; Good-to-Know clause; cart summary + Pay button. Also stamped on the Acuity record and in the customer recap email.

**Verification**
- Unit-proved every Drew example (1→$0, 2→$200, 3→$300, 5→$500, 10→$1,000) + the clamp.
- **17/17 test files pass.**
- **Staging booking dry-run (3-day event = Drew's Oct 3 → Oct 5 shape):** intro advertises it; live summary shows `Multi-day discount · 3 days × $100`; total **$2,460 → $2,160**; Pay button $2,160; booked 200; server independently stamped `Multi-day discount: -$300.00 ($100 x 3 days)` on the Acuity booking. Test data cleaned up; zero JS errors.
- Prod verified: `MULTIDAY_DISCOUNT_PER_DAY_CENTS = 10000` live, intro headline + Good-to-Know + 5 discount lines all serving.

**⚠️ Deploy trap hit + fixed:** a FRESH worktree has no `.vercel` link, so `vercel deploy --target=staging` **auto-created a stray `multiday-discount` Vercel project** and staging never got the code (the first dry-run silently tested OLD pricing). Relinked the worktree's `.vercel/project.json` to `white-wall-mockup`, removed the stray project, redeployed, re-verified. **Always relink `.vercel` in a new worktree before deploying.**

**BONUS BUG FIX:** `api/_lib/cart-checkout.test.js` had been **FAILING ON MAIN** since the $150 cleaning fee shipped (2026-07-11) — it still asserted `priceA + priceB` and nobody noticed, so the suite was not gating. Rewrote its expectation to derive from the shared pricing module (sessions + cleaning fee − multi-day discount) so it tracks the rules instead of rotting, and armed `WWS_ITEM6_DEPOSIT_ARMED` so T2 actually exercises the deposit path instead of silently testing full-payment.
