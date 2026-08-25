# Drew — 2026-08-25 — Crew $250 cost accounting + refund subtraction + Megan Lamb coupon investigation

Source: gmail pip@entrpy.co
From: Drew Shahoud <drewshahoud@gmail.com>
Date: Tue, 25 Aug 2026 16:17:10 -0400
Thread: 1a036c426017a325
Message id: 1a03a92026718d28
Subject: Re: Dinner receipt

## Verbatim

> Pip, another thing I want to keep in mind is we need to subtract $250 from our net-to-bank in the overview tab and any of those kinds of calculations. Whenever this setup and reset crew is added on, we charge $750 for it, but our cost that we had to pay the cleaners extra is $250. It's honestly the exact same mechanic we've already built out, with the cleaning fees being $110, so literally just copy and paste that exact same model there and everything we did historically on that point. You need to subtract $250 for the setup/reset crew add-on fee.
>
> Can you go ahead and reflect those numbers accordingly? Whenever they're added, just build out the system so it automatically displays the right information. When I'm looking at this overview tab, I see today's money, and then I see net to our bank. Obviously, the number is lower because of cleaning fees and such, but it should also be even lower there for taking off money for the setup crew whenever that is added on. Same mechanic we already built out, and then obviously reflect that accordingly in the revenue tab as well.
>
> You already have it all set up currently. Just do it again for this additional $250 any time the setup crew is there. I also want you to add the setup/reset crew as a whole category and bucket in itself into the expense tracker, literally identically to how you have the cleaning fees set up. Legitimately, just duplicate everything you just did for the cleaning fees, but also do it additionally for the setup/reset crew in the expense tracker. You can still leave the backdrops coming soon because I'll give you more information on that later. I don't even know if we had any setup/reset crews that have happened historically, but I want to at least have the infrastructure built out so we can take a look at it whenever that does happen.
>
>
> Also – Right now, as it sits, you have a dollar amount there saying "Today's Money" and then "Net to Our Bank," and you say there are two bookings. While that is correct and we do have two bookings today, we also had a cancellation today as well.
>
> If you added the 291 and the 1,388 from the two bookings, that gives you the 1,679 you're showing in "Today's Money." However, you're not subtracting how much money we lost today in refunds.
>
> Right now, whenever someone cancels a session, Watson automatically will refund that person manually. We already had that skill built, but you aren't subtracting this number accordingly from that. This "Today's Money" really isn't 1,679, and it's definitely not 1,569. It's whatever that 1,679 is minus the amount of money that we need to reimburse to the person who canceled their session.
>
> We need to build that automation in there, and I think the best way to do that is to either monitor the email and see whenever someone cancels their session, or to look at Acuity and see when they cancel a session within Acuity itself. Either of them work. I'll let you decide what you think the most efficient way to do that is.
>
> Lastly – Do some digging for me for WhiteWall. We had a woman named Megan Lamb cancel her session at Whitehall. I got the email at 10:32 that she canceled the session and then at 10:33 I got an email that the same person just booked an appointment at the Taylor's Mill location.
> Can you investigate that a little bit?
> - The session that she canceled, how much did she pay for the session?
> - What was the start time and the end time for that session?
> - Did she use any coupons, etc.?
> Give me all the details there. For the session that she just booked, give me the details there as well.
> - What is the start time and the end time of that new session?
> - How much did she pay for that new session?
> - Did she use any coupons, etc.?
> Was the canceled session and the new session on the exact same date? I'm doing an investigation to see if she might be abusing some coupons. Just take a look and give me a little summary as to what is going on here.

## Triage

Three DISTINCT requests, all new work:

- **A) Crew $250 cost accounting (DREW-84).** change-request, deliberative-but-mechanical. Clone the
  cleaning-fee mechanic ($110, DREW-68/69) for the Setup/Reset Crew add-on: subtract $250 (our cost)
  from Net-to-Bank on Overview + Revenue whenever the $750 crew add-on ($750 charge) is present, and add
  a "Setup/Reset Crew" category/bucket to the Expense Tracker identical to Cleaning Fees. Backdrops stays
  "coming soon". Display-only accounting mirror of already-approved work → NO escalation. Dashboard PR.
- **B) Refund subtraction from Today's Money (DREW-85).** change-request. Today's Money currently sums
  payments received today and does NOT subtract same-day refunds (a cancellation today lowered real cash).
  Build ingestion of refunds (Drew left the source to me → **Square refunds** is the efficient path: the
  dashboard already reads Square, refunds are first-class Square objects, read-only, authoritative for the
  dollar figure). Subtract refunded amount from Today's Money / net figures. Read-only vs upstreams, no
  money moved (Watson issues the refund) → within scope, NO escalation. Dashboard PR.
- **C) Megan Lamb coupon-abuse investigation (DREW-86).** question/investigation, read-only. Answer inline:
  canceled Powdersville session (paid/start-end/coupons) + new Taylor's Mill session (paid/start-end/coupons),
  same-date check, coupon-abuse read. Just do it.

## Follow-up — 2026-08-25 16:46 (msg 1a03aaca71c917ef, drewshahoud@gmail.com)

Reply to Foreman's investigation + A/B keep-warm reply (msg 1a03a992ee954774). Same two items
(DREW-84 crew cost, DREW-85 refunds) — NOT new work; folded into those tickets. Verbatim:

> Super helpful, thank you for that diagnostic. That's good to know she wasn't just trying to manipulate and take advantage of coupons. Watson just refunded her.
>
> 1) perfect. Any update there?
>
> 2) perfect, yeah explain to me more in depth what you end up doing and hwo it changes numbers im looking at in which places, so I can knwo how we solved this.

Triage:
- His **(1)** = the $250 crew cost (DREW-84). "Any update there?" → **DREW-84 is SHIPPED + LIVE** (PR #154). Confirm it.
- His **(2)** = the refund subtraction (DREW-85). Wants an in-depth explanation of the solution + which numbers change in which places. DREW-85 is BUILDING. Hold the reply until it ships so the explanation can point at the REAL Maegan refund.
- **KEY FACT: "Watson just refunded her"** → Maegan's ~$345 refund now exists in Square (dated today). Running `pollSquareRefunds` will capture it → real DREW-85 verification data (Today's Money should drop by her refund; her canceled #2811 was paid Jul 21, a PRIOR day, so it's exactly the cross-day case the fix targets).
- Plan: finish DREW-85 build → deploy → run poll (captures her refund) → verify → send ONE reply confirming DREW-84 live + explaining DREW-85 in depth with her real refund as the worked example.
</content>
