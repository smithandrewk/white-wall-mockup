# Drew — 2026-08-26 — Verify Watson's $345 Maegan Lamm refund actually processed

Source: gmail pip@entrpy.co
From: Drew Shahoud <drewshahoud@gmail.com>
Date: Wed, 26 Aug 2026 00:02:31 -0400
Thread: 1a036c426017a325
Message id: 1a03c3c0de349bf0
Subject: Re: Dinner receipt

## Verbatim

> Pip can you check that refund that Watson was supposed to process? The one
> for $345. Can you see if it went through? If not, can you push it through
> and make sure we refund her?

## Triage

- Classification: **question / verification** (read-only investigation). Follow-up on DREW-86
  (Maegan Lamm cancel + rebook investigation, Round 122) and the Round-122 refund watch.
- This is the $345 refund of Maegan Lamm's canceled Taylor's Mill session #2811 (Half Day 4h +
  Lighting + Single Backdrop, Aug 29 9:00am, paid Jul 21 on Visa, gross $345). At Round-122 ship
  time the refund had not yet surfaced in Square; the watch item flagged spot-checking it.
- **Conditional money branch ("if not, push it through") does NOT trip** because the refund is
  already COMPLETED — there is nothing to move. No escalation, no money gate. Read-only + reply.

## Finding — the refund WENT THROUGH (verified two ways)

Confirmed against Square's `/v2/refunds` directly (authoritative, read-only) AND the dashboard's
ingested `payment_refund` row:

- Refund id `VQRfmTZHIVdJ6csZw3j0uW0QMAVZY_mucT2Xrb8ZIRrwGXtQ9LZCOx7caDk4doa0UvOPqLSKT`
- Payment id `VQRfmTZHIVdJ6csZw3j0uW0QMAVZY` (booking 1741108891 = ref #2811, Maegan Lamm, canceled)
- **Status: COMPLETED**
- **Amount: $345.00** (34500 cents) — full amount
- destination_type: CARD (back to her card on file)
- reason: "Canceled appointment"
- created_at 2026-08-25T20:36:57Z (= 2026-08-25 4:36:57 PM EDT); updated 2026-08-25T22:06:37Z
- Ingested into the dashboard by the hourly poll at 2026-08-26 00:03:50 EDT.

So Watson's refund succeeded. Nothing to push through; Maegan has been fully refunded $345 to her card.

## Reply

Sent msg `1a03c3f3d3cca2ca` — confirmed the refund is COMPLETED, full $345 back to her card on Aug 25
at 4:36pm, nothing left to do, and noted the dashboard net-to-bank now reflects the $345 going back out.
