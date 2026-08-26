# Drew — backdrop expense entry, ROUND 3 (full Drive-folder audit)

Continuation of DREW-91. After Round 2 (4 orders added), Drew wrote back asking for a
COMPLETE audit of the entire Google Drive folder — refer only to the Drive photos (not the
email attachments), make sure every backdrop order is captured, and he flagged that 2025
looked empty and there should be "over 35" photos.

- **Ticket:** DREW-91 (same work — add-msg + comment; continues the backdrop backlog).
- **Classification:** change-request (data entry) — fast path. No code change, no money moved
  (reversible local `expense_manual_entry` table), Drew self-authorizes his own dashboard data.
  NOT an escalation.
- **Access:** Drew's $30 window active through 2026-08-27 06:00, armed=ON.

---

## VERBATIM — Drew message `1a03fae66d7e1085`

- **Source:** Gmail, account pip@entrpy.co
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **To:** pip <pip@entrpy.co>
- **Thread:** 1a03ee7679c69e27 ("White Wall dashboard revisions")
- **Date:** Wed, 26 Aug 2026 16:06:16 -0400
- **msgid:** 1a03fae66d7e1085

> I'm also pretty sure there's a whole lot more than just seven orders that we've placed on
> Backdrops. Can you go check that Google Drive folder again and make sure you have it all in
> there?
>
> It doesn't look like we have anything in this expense tracker for 2025, and I know we
> definitely submitted orders in 2025. Definitely please check the new ones I added in there as
> well. Just audit that entire Google Drive folder and all the photos in there, not just the
> photos I sent you in the email. Ignore the photos I sent you in the email and refer only to the
> photos in the Google Drive folder for the Backdrops specifically. There should be over 35 of
> them or something.
>
> Heres the link
> https://drive.google.com/drive/u/1/folders/1RTjeO1FX3pSEawprYrMCqzdWj4Ql3JTC

(Immediately prior msg `1a03fa957c6d09fb`, 16:00: "I just added some more screenshots that Mac
sent over ... find out which ones are new and account for those." Round 2 answered that one;
this Round-3 message widens it to a full-folder audit.)

---

## Context / gap found

The Drive folder holds **40 files** (32 `IMG_12xx.PNG` + 8 screenshots) — matches Drew's "over
35." Prior rounds only covered a SUBSET:
- Round 1 audited IMG_1246-1254 + IMG_1276-1280 + the 11.23 AM screenshot → 7 orders.
- Round 2 audited the 7 new PM screenshots → 4 orders.
- **IMG_1256-1275 (20 screenshots) were never audited** — this is where the "more than 7
  orders" and the missing 2025 orders live.

Already in the ledger before this round (11 orders, $4,620.31): see revision-status Round 135.

(Full per-image audit table + entries appended below as the work completes.)

---

## Full audit result (all 40 Drive photos read via 5 parallel extractors)

**10 NEW orders entered** (backdrops only, pre-tax subtotal, dated order-placed date), via the
live DREW-90 `POST :18794/api/expense-tracker/entries`. All order numbers distinct from the 11
already in the ledger.

| Order # | Date | Backdrops | Amount | Source img | entry id |
|---|---|---|---|---|---|
| Amazon 114-4185400-9960254 | 2022-09-22 | 1x Savage @ $99.99 | $99.99 | IMG_1275 | 8a178ae2 |
| Amazon 114-7202693-6345052 | 2023-04-15 | 2x Savage @ $109.99 | $219.98 | IMG_1273 | d8c8ff8f |
| Amazon 114-0918520-4425027 | 2023-07-25 | 1x Savage @ $109.99 | $109.99 | IMG_1270 | c9b05fd0 |
| Amazon 114-6498757-5541826 | 2023-07-25 | 3x Savage @ $109.99 | $329.97 | IMG_1271/1272 | 8b940224 |
| Amazon 114-9186508-7433066 | 2023-08-29 | 8x Savage @ $109.99 | $879.92 | IMG_1267/1268/1269 | 716c9e5a |
| Amazon 114-8581413-3446646 | 2024-01-04 | 1x Savage @ $109.99 | $109.99 | IMG_1259/1260 | 0f1606d0 |
| Amazon 114-4221932-8692203 | 2024-01-04 | 3x Savage @ $150.95 | $452.85 | IMG_1266 | 111605c0 |
| Amazon 114-5052536-2395427 | 2024-01-04 | 8x Savage @ $109.99 | $879.92 | IMG_1261/1262/1263 | eadc0ae9 |
| Amazon 114-7122205-8843432 | 2024-02-28 | 4x Savage @ $109.99 | $439.96 | IMG_1257/1258 | 75f34d4d |
| Amazon 114-9586693-4569818 | 2024-04-25 | 4x Huamei @ $96.98 | $387.92 | IMG_1256 (+IMG_1254 detail) | 2e9cd983 |

**New this round: $3,910.49.** Backdrops category now **$8,530.80 across 21 orders** (reconciles:
$4,620.31 + $3,910.49). Per-year (matches the dashboard year filter):
2021 = 1/$193.97 · 2022 = 4/$539.74 · 2023 = 4/$1,539.86 · 2024 = 6/$2,750.60 ·
2025 = 2/$594.94 · 2026 = 4/$2,911.69.

### Resolved
- **Old cut-off $96.98 Huamei order (IMG_1254)** is now anchored: IMG_1256 is its order summary
  (Amazon 114-9586693-4569818, Apr 25 2024, subtotal $387.92 = 4 x $96.98). Distinct from the
  Jun 2025 HUAMEIZOOM $98.99 order (112-6158566) already in. Entered once, no double-count.
- **2025 is covered** (2 orders, $594.94): 112-6158566 (Jun 26 2025, $494.95) + 112-9716469
  (Nov 7 2025, $99.99), both from Round 2. Drew's "no 2025" was a pre-Round-135 tab (his msg
  16:06 predated the Round-135 reply 16:08 that added them).

### Flagged to Drew (NOT entered)
- **Amazon 114-2615064-4862602, Mar 13 2023, 2x Savage $219.98 — FULLY REFUNDED** (screenshot
  IMG_1274 shows "Refund Total: $233.18" = full grand total, plus a "Replacement ordered"
  banner). Excluded as not-money-spent; asked Drew whether a paid replacement shipped.
- **Two "Buy it again" browse-list screenshots** (1.49.44 PM + 1.49.54 PM): Savage colors from
  Jul 2022 / Nov 2022 + an Aug 2022 Huamei #44 Jet Black, with NO order number and NO price.
  Cannot anchor a total; asked Drew for the itemized order summaries.

### Batches A + D + E = all already-entered orders (no new)
- A (IMG_1246-1254): 111-3879834, 114-7443858, 114-0093324 (all entered) + the Huamei detail now
  anchored via B.
- D (IMG_1276-1280): 114-9049330, 114-4416033, 114-9969706 (all entered).
- E (screenshots): 114-2619745, 112-9716469, 112-6158566, B&H 915503828, B&H 1085873219 (all
  entered) + the two browse lists (flagged).

## Reply to Drew
- msgid: 1a03fbfcc333c01a
- Reported 10 new orders in, new total $8,530.80 / 21 orders, per-year breakdown, confirmed 2025
  is covered, flagged the refunded order + the two browse lists.
