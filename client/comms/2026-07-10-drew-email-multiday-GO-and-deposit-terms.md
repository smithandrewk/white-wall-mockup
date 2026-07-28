# Drew — GO on multi-day event flow + backdrops + deposit terms

- **Source:** email (same thread `19f424228b20d389`)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Fri, 10 Jul 2026 15:38:16 -0400
- **msgid:** `19f4d89d0d2a7e53` (header `<B0807498-3827-4BEF-A420-F3C94B5024C5@entrpy.co>`)
- **Account:** andrew@entrpy.co

---

## Message — verbatim

> Absolutely flawless. Let's run it. This is exactly what we needed, and just make sure that they
> know that the 60% deposit is non-refundable and the 40% is automatically pulled with their card
> information on file. We just need to verify that internally within our system, and now we're also
> publicizing that the 60% is non-refundable.
>
> As far as the backdrops go, let's just mirror the exact same setup we have for the chairs and
> tables and stuff: full price on day one and then the same discounted logic as continuous days
> apply. Okay, that should be everything you need. Let's go ahead and do it.

---

## Foreman triage (2026-07-10)

**GO given.** Build the flagship booking-flow restructure.

**Confirmed decisions:**
- **Backdrops:** mirror chairs/tables — full price Day 1, then the same progressive discount (Day2 15% off,
  Day3+ 30% off). → add the backdrop add-on id(s) to `DISCOUNT_ELIGIBLE_ADDONS` in `scripts/pricing-shared.js`
  (and any server mirror in `api/_lib/cart.js`).
- **Deposit terms to publicize to the customer:** 60% deposit is **non-refundable**; the remaining **40% is
  automatically pulled from the card on file** (48h before booking, per existing item-6 design). Drew: "verify
  that internally within our system," and "now we're also publicizing that the 60% is non-refundable."

**Gate handling (autonomous per Andrew's 2026-07-10 standing order, but with the money safety rail intact):**
- The booking-flow UX + per-day pricing (incl. backdrops) = build + ship autonomously (staging → prod).
- The **60% non-refundable deposit disclosure** = a refund/policy legal-text delta. Drew directly dictated it
  (his money/policy call — [[drew-self-authorizes-money]]), so it ships, BUT record a soft "open for Andrew"
  so the legal delta is visible (§4 legal rule). A deposit-refund policy DRAFT already exists:
  `client/comms/2026-06-25-deposit-refund-policy-draft.md`.
- The **40% auto-charge** = item-6 machinery. Standing safety rail: **never blind-arm; staging dry-run first.**
  Drew himself asked to "verify internally." So: build the disclosure + the auto-charge path, run the auto-charge
  through a STAGING dry-run (sandbox Square + staging Acuity cal 14110701), and only after a clean dry-run does it
  arm to charge a real card. Non-blocking FYI to Andrew (live payment flow), NOT an approval ask.

**Build spec:** see `client/comms/2026-07-10-multiday-event-build-plan.md`.

---

## Follow-up — Drew, Fri 10 Jul 2026 16:00:46 -0400 (msg `19f4d9e76a2cc8e4`)

> Youre the man. Thanks pip. Def a big build, but youre the best in the biz. Let me know an update
> when you have one. Im also more than happy to go test things for you on the site, As a customer.
> Just let me know what you need.
>
> Thanks pip.

**Triage:** FYI / encouragement, no new requirement. Two open loops it creates for Foreman:
(1) send Drew a progress update when there's something to show; (2) **Drew offered to test as a
customer on the site** — take him up on it once the flow is on staging (send him the staging link +
exactly what to try: single-day event + multi-day event paths). Replied warmly (keep-warm), committed
to pinging him with a staging test link when ready. No build change.

---

## Follow-up 2 — Drew, Fri 10 Jul 2026 16:23:22 -0400 (msg `19f4db3298bed6ae`)

> Flawless. Im on standby. Build away. Follow up when ready.

**Triage:** standby / no-ask. Deliberately NOT replied (he said follow up when ready — an ack would be
noise). Covered by the existing promise: update Drew + staging test invite when there's something to show.

---

## Check-in — Drew, Fri 10 Jul 2026 17:22:10 -0400 (msg `19f4de8fecf438e4`)

> How is it going pip?

**Triage:** progress check-in (delivers promise #1). Replied honestly (msg `19f4df089e6798fd`): pricing
groundwork done + tested (per-day add-on discounts incl. backdrops; setup crew once); now onto the heart
of it (the "What are you booking?" first step + single/multi-day split + day-by-day builder), being built
on staging first, will send him the staging test link when it's clickable end to end. No overpromise on timing.

---

## Follow-up 3 — Drew, Fri 10 Jul 2026 17:34:10 -0400 (msg `19f4df3f9e84f856`)

> Absolutely incredible work pip. Im on standby. We'll probably keep building tonight too. Let's get it.

**Triage:** encouragement / standby, no new ask. Deliberately NOT replied (no ack chatter). Build continues.

---

## Check-in 2 — Drew, Fri 10 Jul 2026 21:23:56 -0400 (msg `19f4ec6553f6405e`)

> Pip any update?

**Triage:** progress check-in. Honest reply sent (msg `19f4ec89f4d7d0ad`): pricing groundwork done+tested;
front-end (What-are-you-booking step + single/multi split) is the active build, being careful not to break
the live photo flow; the next deliverable is a STAGING link to click through. **Honest internal note:** the
flow itself has NOT progressed past the backdrops commit — needs a focused build push (see below).

## Integration points confirmed (for the focused gate build)
- The Photo/Video vs Event selector currently lives INSIDE Step 3 (`renderEventStep`, `[data-event-step]`,
  `data-action="set-event-intent"`). The whole flow keys off `state.eventIntent`.
- Lower-invasive plan: a gate at the TOP of the booking panel (before `data-step-panel="1"`) sets
  `state.bookingType` (photo/event), `state.eventMode` (single/multi), and `state.eventIntent`; hide the
  numbered step panels + progress until a choice is made; existing flow then proceeds keyed off eventIntent
  (works today). Multi-day builder on `state.cart.sessions` = a later slice. Boot: `renderStepContent()`/
  `setStep()` (booking-flow.js ~569-573). Step panels: `book-powdersville.html` `data-step-panel=1..5`.
- Build + verify (node --check + local Playwright: gate renders, photo→flow, event→single/multi, single-session
  flow byte-identical) on branch `worker/multiday-event-flow`, then staging deploy + Drew test link.

## Follow-up 4 — Drew, Fri 10 Jul 2026 21:27:45 -0400 (msg `19f4ec9d07a3a628`)

> You're amazing. Thanks!

**Triage:** thank-you / no-ask. NOT replied (no ack chatter).

## Check-in 3 + DELIVERY — Drew, Sat 11 Jul 2026 (msg `19f50ef6035db9cd` "Surely it's done now, what's the hold up?")
Honest reply sent (`19f50f2822f69a7c`). Then BUILT the Step-1 gate + shipped to staging + sent Drew the test link.
- **Step-1 "What are you booking?" gate BUILT + verified + committed `99d6295`** (branch worker/multiday-event-flow):
  additive pre-flow gate (no step-machine renumber). Photo/Video (Drew's multi-day-photo subtext) vs Event →
  Single-day vs Multi-day (Drew's exact subtext). Choosing sets eventIntent + reveals the existing flow; old Step-3
  selector hidden once chosen up front; TM never gates. Playwright-verified locally + on staging (no JS errors, TM intact).
- **Deployed to staging** (`vercel deploy --target=staging`; relinked worktree .vercel to white-wall-mockup; removed a
  stray auto-created `multiday-event-flow` Vercel project). **staging.whitewallstudios.co/book-powdersville serves it.**
- **Drew SENT the staging link + what to try** (msg `19f50fb813951bce`), honest that the day-by-day builder is next.

## Staging feedback — Drew, Sat 11 Jul 2026 07:44:59 -0400 (msg `19f50feeafd5d2e1`)

> Absolutely flawless. Yeah now it just needs the day builder after selecting multiple days rather than
> going straight to durations. It's great! Keep going.

**Triage:** gate APPROVED (no wording changes). Confirmed next slice = the multi-day day-by-day builder:
when Event → Multi-day is chosen, show the day builder instead of the normal single-duration flow. Building it
next (staging-first). "Keep going" = proceed, no ack chatter needed; will update the staging link when it's on.
