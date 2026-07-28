# Drew email — round 6: post-payment account-creation prompt (item 2 decided) (verbatim)

- **Source:** thread `19ed260797a3f02c`, work mailbox (andrew@entrpy.co).
- **From:** Drew Shahoud <drew@entrpy.co> | **Date:** Fri, 26 Jun 2026 17:55:21 -0400
- **msgid:** `<CA+_J_6VJyw8TAD6+0-BQK=TdrKZWG=9d8T=4GFO0UUP3FWNQnQ@mail.gmail.com>`
- Decides item 2 from round 5 (account-creation timing). Confirms my post-payment recommendation + gives exact UX.

---

## Verbatim message body

Sounds good. As soon as they submit payment, what if we had a Serena popped
up saying “you have successfully booked your session with White Wall, Save
your account information to speed up the process next time. We already have
everything we need, just create a password”

And then give them a text field to enter the password, and put their email
above it, greyed out, because we already have their email, and that will
serve as their username going forward.

Then you can have text that says: “or use Google to login next time, with
the same pre-saved account info” and then give them the Google button.
On Fri, Jun 26, 2026 at 11:37 AM Andrew Smith <andrew@entrpy.co> wrote:

> Hey Drew,
>
> All three of the build items are live.
>
> 1. Card on file: on your account page, the Card On File section now
> has an "add / update card" option. Enter a card and it saves securely
> as your card on file, the same way we store it at checkout, and it
> works for anyone with an account.
> 2. The dashboard count: fixed. The Clients Life Time tab now reads the
> true total, 1,208 clients with bookings and 358 repeat, which lines up
> with Watson's audit. It was just an old 500 row display cap, the data
> was all there.
> 3. Repeat Visits: it now shows the full list of your repeat clients,
> same columns as the main Clients list, filtered to just repeat
> clients.
>
> The only open one is the account creation timing. That is the one
> where I laid out my recommendation in the last note (capture it right
> after payment with everything pre filled, plus an optional early save
> toggle, rather than forcing it before payment and risking the
> booking). Whenever you tell me which way you want to go on that, I
> will wire it up.
>
> Pip
>

---

## Triage — single item (account UX, no escalation -> build + ship)

**Post-payment account-creation prompt.** Right after a successful booking/payment, show a prominent popup:
- Copy: "You have successfully booked your session with White Wall. Save your account information to speed up the process next time. We already have everything we need, just create a password"
- A PASSWORD field, with the customer's EMAIL shown ABOVE it, GREYED OUT / read-only (we already have it; it is their username going forward).
- Then text: "or use Google to login next time, with the same pre-saved account info" + the Google button.
- On password submit -> WWSAccount.createAccountPostPayment (confirmed Supabase user with that email + password, links their bookings) -> signed in. Google -> WWSAccount.signInWithGoogle.

Reuses live infra (createAccountPostPayment, signInWithGoogle, the booking email already stashed for the confirmation page). Build on booking-confirmation.html (+ scripts). Verify on staging, ship to prod, reply to Drew.
