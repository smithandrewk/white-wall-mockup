# Drew email — verify WWSHUNDRED as a 100% free-booking coupon (verbatim)

- **Source:** thread `19ed260797a3f02c`, work mailbox (andrew@entrpy.co).
- **From:** Drew Shahoud <drew@entrpy.co> | **Date:** Fri, 26 Jun 2026 19:04:12 -0400
- **msgid:** `<CA+_J_6UCeSnWBNDYjOVw-jv4Xg7vJD7UVjqz3rTudTE2waA5DQ@mail.gmail.com>`

---

## Verbatim message body

Can you verify that WWSHUNDRED is a functioning coupon code for 100% any
booking at any location, company wide? It wipes literally everything.
Entirely free booking with add ons and everything.
On Fri, Jun 26, 2026 at 6:31 PM Andrew Smith <andrew@entrpy.co> wrote:

> Hey Drew,
>
> Done, that is live exactly as you described.
>
> Right after someone submits payment, the confirmation now shows a
> prompt: "You have successfully booked your session with WhiteWall.
> Save your account information to speed up the process next time. We
> already have everything we need, just create a password." Their email
> sits above the password box, greyed out, and becomes their username.
> Under that is the line "or use Google to log in next time, with the
> same pre-saved account info" with the Google button. Either path saves
> the account with everything pre filled and signs them in. If someone
> happened to already be logged in when they booked, it just points them
> to their account instead.
>
> That closes out everything from this batch. Let me know what is next
> whenever you are ready.
>
> Pip
>

---

## Triage + verification (VERIFY → CONVERSE + ESCALATE)

Drew wants WWSHUNDRED to be a working company-wide 100%-off code that makes a booking ENTIRELY free, wiping session AND add-ons.

**Verified state (2026-06-26):**
1. WWSHUNDRED is NOT a configured coupon — absent from the dashboard `coupon` table AND from the booking-site COUPONS env / Edge Config. It does nothing today.
2. The system DELIBERATELY blocks a 100% free booking:
   - `api/_lib/coupons.js` caps percentOff at 1..99; a value of 100 is REJECTED as invalid (line ~210). Safety added overnight 2026-06-13 (cap 99% + $0-charge floor) so a 100% code can't zero a charge.
   - Coupons discount the SESSION price ONLY — `create-checkout.js:346 sessionDiscountCents(sessionAmount, pct)` — add-ons are NEVER discounted by a coupon.
   - Checkout is pay→book through Square, which can't process a $0 charge; the floor keeps a positive amount.

**So:** no code today produces an entirely-free booking; the architecture prevents it. A TRUE free-booking code requires a deliberate change touching money/architecture/abuse: (a) lift/replace the 99% cap with a real "free" type, (b) extend the discount to add-ons, (c) add a free-booking path that SKIPS Square (book directly at $0), (d) accept revenue + abuse exposure of a company-wide free code.

**Action:** reply to Drew with the honest finding + why; ESCALATE to Andrew (money/architecture/policy) for the decision to build a true free-booking path. (Andrew's iMessage READ is hung — send the escalation, it still delivers.)

---

## Drew DIRECTIVE 2026-06-26 20:06 (msg `CA+_J_6WE5dL...`) — verbatim + resolved spec

Pip do this.
Make these codes. All of them are entirely for the studio session time
alone. Not any add ons or fees. But all of these should be alive and
active.

Specifically - WWSHUNDRED makes literally every single thing entirely free.
They don’t even have to pay at all. Just wipes it all free.

Then, every time someone uses that code, I want Watson to text me saying:
“Yo, WhiteWall just had a 100% off code used. The client name is X, and the
booked a photo / event booking. They booked a X duration shoot, starting at
X time on X date. Their add ons are X.”

That’s what I want. No need for Andrew to authorize the 100% off thing.
We’ve had that system setup for years. But now I’m at least alerted when
it’s used.

100% off code - WWSHUNDRED

50% off code - WWS50

25% off code - 25OFF

20% off code - 20OFF

10% off code - WW10

On Fri, Jun 26, 2026 at 7:37 PM Andrew Smith <andrew@entrpy.co> wrote:

> Hey Drew,
>
> I checked it carefully, and the honest answer is no, not as things
> stand today. Two parts to it.
>
> First, WWSHUNDRED is not actually set up anywhere right now, so at the
> moment it would just be an invalid code.
>
> Second, and more important, the booking system is currently built to
> specifically prevent a 100% free booking, and that was on purpose.
> There are three guards in the way:
> 1. Coupons are capped at 99%. A 100% code is rejected outright. We put
> that cap in as a safety so a single code could never zero out a
> charge.
> 2. Coupons only discount the session price, never the add-ons. So even
> at the max 99%, the add-ons would still be charged in full.
> 3. Checkout runs through Square, and Square cannot process a 0 dollar
> charge, so an entirely free booking cannot complete the pay step at
> all. That is why there is a small minimum-charge floor.
>
> So today nothing produces a truly free, everything-wiped booking.
>
> I can absolutely build a real "free booking" code that wipes the
> session and the add-ons and skips the payment step entirely, company
> wide. But because that means zero revenue on those bookings, bypassing
> the card step, and the abuse risk of a single company-wide code that
> makes anything free if it ever leaks, I want to run it past Andrew
> before I flip that on. I am checking with him now and will come right
> back to you with the plan.
>
> Pip
>

### Resolved spec (build)
- **Session-only % codes (all live):** WWS50 = 50%, 25OFF = 25%, 20OFF = 20%, WW10 = 10% — discount the SESSION price only (not add-ons/fees). Matches the existing coupon mechanic (sessionDiscountCents); just create them in the coupon source.
- **WWSHUNDRED = full comp:** wipes EVERYTHING (session + add-ons + fees) to $0, NO payment at all -> a free-booking path that SKIPS Square (book the Acuity appointment directly, persist $0). Server-validated to this exact code only; existing paid flow untouched. Client booking flow skips the card/payment step when WWSHUNDRED is applied.
- **Owner alert:** on every WWSHUNDRED redemption, Watson SMS to Drew (reuse notify-owner-sms): "Yo, WhiteWall just had a 100% off code used. Client name X, photo/event booking, X duration, starting X time on X date. Add-ons: X."
- **Authorization:** Drew (owner) explicitly authorized + removed the Andrew gate ("no need for Andrew... we've had that for years"). I escalated to Andrew already (informed, not blocking). Building it carefully (money-critical path) + hard staging test. NOTE the abuse mitigation IS the Watson alert (Drew notified on every free booking).

---

## Drew follow-up 2026-06-26 20:42 (msg `CA+_J_6XegXZ...`) — "will it still prompt me to set up an account after the 100% off code? It should."

**Verified YES (code trace, no change needed).** Both the paid "Pay & Book" (data-pay-btn) and the comp "Book now" (data-comp-btn) invoke the SAME submit `handlePayAndBook()` (booking-flow.js lines 811 + 817). That function stashes the booker email to `sessionStorage.wws_booking_email` (line 2036) right before redirecting to `/booking-confirmation` (line 2037) — for comp and paid alike (isComp only gates whether the card is tokenized). booking-confirmation.html's round-6 prompt reads `wws_booking_email` and pre-fills the (greyed) email + password field. So a WWSHUNDRED booking lands on the confirmation page with the account-creation prompt, email pre-filled, exactly like a paid booking. Nuance: if the booker is ALREADY signed in, the round-6 prompt shows "your booking is saved to your account" instead of the create-password form (correct) — so to SEE the prompt when testing, be logged out / use a fresh email.
