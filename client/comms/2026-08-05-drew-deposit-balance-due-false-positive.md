# Drew — dashboard shows "Deposit paid · $X due" when paid in full

- **Source:** Gmail (work mailbox `andrew@entrpy.co`)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Wed, 5 Aug 2026 17:32:31 -0400
- **Thread:** 19fd3598d771c14d ("Whitewall Revisions")
- **Message id:** 19fd3d7c03d4fa40
- **Attachment:** Screenshot 2026-08-05 at 5.31.02 PM.png — Calendar tab, October 5, Karli Owens, 11:00a · Powdersville · 2h · "Powdersville Studio - Two Hour + All Backdrops", $204, orange badge "Deposit paid · ~$46 due"

## Verbatim

> I've seen this a couple of times throughout the dashboard, where it still tells you that someone paid the deposit and they still have a certain amount of money due. That doesn't seem accurate to me because when I check Square, it says that they booked the total amount and paid everything in full.
>
> I also don't think photo sessions should even be able to have the ability to only pay a deposit. I'm pretty confident this is a photo session by nature, so it shouldn't even be physically possible for them to even pay a deposit when they're booking on the website.
>
> Why is this showing here on the calendar tab for this person's booking on October 5th? It doesn't make any sense to me, and I've seen it in a couple other areas along the dashboard as well.

## Foreman triage

- **Classification:** incident (silently-wrong dashboard output). Distinct work from DREW-63/64 → new ticket.
- **Root cause (confirmed against live `wws`):** Karli Owens booking `1748996147` is `is_event = false` (a photo session). Real **Square** payment = **$210 gross / $203.61 net**. She paid **in full**. The dashboard also holds a `source='estimate'` booked-value of **$250** (`list_price`). `computePaymentStatus` (lib/stats/glance.ts) compares net-of-fees Square cash ($203.61) against the **estimate** ($250): ratio 0.81 → classifies "deposit", balanceDue = 250 − 204 = ~$46. The "$46 due" is purely the gap between an inflated estimate and the real charge — a fabricated debt.
- **Scope:** 70 photo/video + 2 event paid bookings across the dataset carry this false badge. The badge is one source (`computePaymentStatus` → the calendar card), rendered on both the Overview glance and the dedicated Calendar tab (= Drew's "couple other areas").
- **Drew's point #2 is already true + enforced on the booking site:** the 60% deposit path is EVENT-ONLY (create-checkout.js:1153-1157 rejects deposit on a non-event cart) AND DARK on production (forced to "full" unless `WWS_ITEM6_DEPOSIT_ARMED=1`, create-checkout.js:1042-1044; client hides the toggle too). So a photo session can never pay a deposit, and today no booking can. There is no ingested deposit/payment-mode signal in the dashboard, so every "deposit/partial" badge is a false positive.
- **Fix:** a booking with real Square cash = **Paid in full**; drop the estimate-derived "deposit / partial / $X due" (it can only fabricate a balance). No-cash future booking stays "Unpaid" (shows the estimate as booked value, per the footnote). When V3 item-6 real event deposits arm, a genuine balance must come from an ingested deposit/balance signal, not the estimate.
- **Nothing to build on the booking site** — the deposit lockout Drew wants already exists. Dashboard-only, read-only invariant untouched (pure display classification), no money, no upstream → no hard gate.
