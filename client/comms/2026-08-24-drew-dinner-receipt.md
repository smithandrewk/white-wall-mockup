# Drew — dinner receipt (2026-08-24)

Access: Drew paid $30 (hosted invoice `ee1a2ae7-bdda-4350-8916-aa916fcbf834`); window
GRANTED through the next daily reset (2026-08-25 06:00). armed=ON.

Ticket: **DREW-75** (filed this round). Thread `1a036c426017a325`.

---

## Message 1 — Drew inbound (VERBATIM)

- **Source:** Gmail (pip@entrpy.co)
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **To:** pip@entrpy.co
- **Date:** Mon, 24 Aug 2026 22:33:25 -0400
- **Subject:** Dinner receipt
- **Thread:** 1a036c426017a325
- **msgid:** 1a036c426017a325
- **Attachment:** IMG_1195.jpeg (dinner receipt photo) — saved to
  `attachments/2026-08-24-drew-dinner-receipt/IMG_1195.jpeg`

> Hey pip. Andre and I ate. Here is receipt

### Receipt contents (read from the image)

- **Merchant:** Halls Chophouse (Merchant Copy)
- **Date/time:** 8/24/26, 10:27 pm
- **Customer:** DREW SHAHOUD — Visa credit ****4884 (dipped)
- **Server:** Keera P. · Table 73 · Check 0911
- **Amount:** $275.40
- **Tip:** $66.00
- **Total:** **$335.40**
- Context: dinner with "Andre."

---

## Triage

- **Class:** fyi / operational (a business meal receipt) — NOT a booking-site or dashboard
  change request. No explicit instruction beyond "here is receipt."
- **Path:** fast / acknowledge. No code build warranted this round.
- **No escalation dimension** — recording a receipt is reversible, no money spent, no
  architecture/legal/customer-scale. Within White Wall ops scope.
- **Judgment:** no established meal-receipt pipeline exists. The dashboard Cash Flow /
  Expense Tracker is a **recurring monthly** model (rent, ad spend, cleaning fees) — dropping
  a one-off dinner in there would distort the monthly statement, so it does NOT belong there.
  Recorded the receipt to White Wall's records (this comms log + saved image) and offered to
  stand up a separate one-off **Business Expenses** log on the dashboard if Drew wants ongoing
  receipt tracking. "Assume the default, then offer" per the dev contract.

---

## Foreman reply 1 (msgid 1a038e8f8228cbad)

Back at the keys; acknowledged the receipt, read the line back (Halls Chophouse, 8/24,
$275.40 + $66 tip = $335.40, Visa ****4884), confirmed it is filed to White Wall's records
with the image kept; offered a separate Business Expenses log on the dashboard; asked if this
one needs anything specific (reimbursement, tag to a client). **This reply crossed Drew's
message 2 below (he answered the question before seeing it).**

---

## Message 2 — Drew inbound (VERBATIM)

- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **To:** pip@entrpy.co
- **Date:** Tue, 25 Aug 2026 08:30:08 -0400
- **Subject:** Re: Dinner receipt
- **msgid:** 1a038e6747288bc9

> Alright pip let's do two things.
> 1) let's get this receipt logged into entrpy: Andrew and I had a business dinner. I paid
> for it. Need to comp it back. And reimburse.
>
> 2) let's work on the user interface for White Wall Studios website I want to convert any
> carousels when people are selecting the add-ons to just individual buttons where they can
> see what it's for and everything. I like how there's nice photo there and a description.
> Honestly, the carousel is great, but the user interface is difficult for people to swipe
> sideways. So let's just get rid of any carousels for any of the add-ons, and turn them into
> actual buttons they could see without having a Swiper scroll or anything.

### Handling

**Item 1 (this ticket, DREW-75) — receipt into entrpy + comp + reimburse:**
- "Andre" in msg 1 = **Andrew**. Business dinner Drew fronted on his personal card.
- **Recorded** in the entrpy books: `~/code/entrpy/vault/finance/expenses/2026-08-24-halls-chophouse-business-dinner.md`
  + receipt image `receipts/2026-08-24-halls-chophouse.jpeg`. $335.40 total.
- **Reimbursement → escalated to Andrew** (moving company money to a member + he was on the
  dinner → §4 money gate; pip does not move money): `esc-reimburse-drew-335-40-business-dinner-halls-chophouse-you-we-money`
  (record:ok notify:ok, OPEN). DREW-75 stays OPEN until the reimbursement is settled.

**Item 2 (DISTINCT → DREW-76) — add-on carousels to buttons:** SHIPPED + LIVE. See
`2026-08-25-drew-addon-carousel-to-buttons.md`.

## Foreman reply 2 (msgid 1a038f2e58967c55)

Both handled: (1) dinner logged into entrpy ($335.40), reimbursement put in front of Andrew
to settle so it runs clean through the company books, recorded + queued, will confirm once
squared (did NOT assert the money moved — escalation OPEN); (2) add-on carousels gone, every
add-on now individual buttons in a grid, live on whitewallstudios.co. Offered to keep going
on the UI while in.
