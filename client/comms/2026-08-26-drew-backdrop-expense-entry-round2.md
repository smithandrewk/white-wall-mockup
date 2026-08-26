# Drew — backdrop expense entry, ROUND 2 (new Drive screenshots from Max)

Continuation of DREW-91 (backdrop backlog into the Expense Tracker). Drew dumped more
Amazon/B&H order screenshots (from Max) into the shared Google Drive folder and asked pip
to find the new ones and account for them.

- **Ticket:** DREW-91 (same work — add-msg + comment; stays in_progress until the un-anchorable
  2022 browse-list orders + the old cut-off $96.98 Huamei are resolved).
- **Classification:** change-request (data entry) — fast path. No code change, no money moved
  (reversible local `expense_manual_entry` table), Drew self-authorizes his own dashboard data.
  NOT an escalation.
- **Access:** Drew's $30 window active through 2026-08-27 06:00, armed=ON.

---

## VERBATIM — Drew message `1a03fa957c6d09fb`

- **Source:** Gmail, account pip@entrpy.co
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **To:** pip <pip@entrpy.co>
- **Thread:** 1a03ee7679c69e27 ("White Wall dashboard revisions")
- **Date:** Wed, 26 Aug 2026 16:00:41 -0400
- **msgid:** 1a03fa957c6d09fb

> I just added some more screenshots that Mac sent over. I just dumped them straight into the
> Google Drive folder. Can you go back and find out which ones are new and then account for
> those in there as well?

(Drive folder: https://drive.google.com/drive/folders/1RTjeO1FX3pSEawprYrMCqzdWj4Ql3JTC)

---

## What was new in the folder

Re-downloaded the Drive folder and diffed against the prior DREW-91 pull. Exactly **7 new
files**, all `Screenshot 2026-08-26 at 1.4x/1.5x PM.png` (the prior pull only had the
`11.23.19 AM` screenshot + IMG_1246-1280). Keyed dedup on the **Amazon/B&H order number**, not
the filename.

### Entered (4 new orders, backdrops only, pre-tax item price where shown)

| Order # | Date | Items (backdrops only) | Amount | Screenshot |
|---|---|---|---|---|
| Amazon 112-9716469-9179460 | 2025-11-07 | 1x Kate Seamless Paper Backdrop Black 106.8"x32.8' Jet (Katehome) @ $99.99 | $99.99 | 1.48.01 PM |
| Amazon 112-6158566-6893827 | 2025-06-26 | 5x HUAMEIZOOM Seamless white paper roll 107"x36' (Youhong_GZ) @ $98.99 | $494.95 | 1.48.43 PM |
| B&H 915503828 | 2026-01-13 | 16x Savage seamless 107"x12yd @ $76.99 (2 Olive #34, 2 Thunder Gray #27, 5 Super White #1, 3 Super Black #20, 1 Coral #3, 2 Egg Nog #19, 1 Primary Red #8) | $1,231.84 | 1.51.01 PM |
| B&H 1085873219 | 2022-08-22 | 1x Savage Widetone Seamless #53 Pecan 9'x36' | $139.78 | 1.51.19 PM |

- 112-6158566: order subtotal $513.94 included a $18.99 Retractable Remote Control Tether Lock
  (non-backdrop) — **excluded**; backdrops-only pre-tax = 5 × $98.99 = $494.95.
- B&H 915503828: item amounts sum exactly to the invoice Sub-Total $1,231.84 (pre-tax).
- B&H 1085873219: only the grand **Total $139.78** was shown (no itemized pre-tax subtotal) —
  entered the total and noted it (may include tax), unlike the others which are pre-tax.
- **New this round: $1,966.56.** Backdrops category grand total after = $2,653.75 + $1,966.56 =
  **$4,620.31**.

### Skipped — duplicate (already entered in Round 1)

- Screenshot 1.47.15 PM = Amazon **114-2619745-4844222** (3x Kate Seamless White, $299.97,
  2026-08-26) — already in the ledger; this shot just showed the tax-inclusive total $320.97.

### NOT entered — can't anchor without an order number + price (flagged to Drew)

- Screenshots **1.49.44 PM + 1.49.54 PM** are Amazon "Buy it again" **browse-list** views with
  **no order numbers and no prices**. Items shown: Savage #27 Thunder Gray / #53 Pecan / #34
  Olive Green / #66 Pure White / #19 Egg Nog (Nov 19 2022); Huamei #44 Jet Black (Aug 22 2022);
  Savage #66 Pure White / #53 Pecan / #19 Egg Nog (July 29 2022). Need the itemized order
  receipts (with totals) to enter accurately — will not guess.
- **Old cut-off $96.98 Huamei order (IMG_1254)** from Round 1 — still no order number/total. The
  new 112-6158566 is HUAMEIZOOM at $98.99 (not $96.98), so likely a **separate** order. Asked
  Drew to confirm whether it's the same (avoid double-count) or a distinct one to add.

---

## Reply to Drew

- msgid: 1a03fb041a69f143
- Confirmed 4 new orders in (+$1,966.56, Backdrops now $4,620.31), listed the duplicate skipped,
  and asked for the itemized receipts on the 2022 browse-list orders + the Huamei reconcile.
