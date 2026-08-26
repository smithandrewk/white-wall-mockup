# Drew — backdrop order expenses into the Expense Tracker (Round 133)

## Inbound (VERBATIM)

- **Source:** Gmail thread `1a03ee7679c69e27` ("White Wall dashboard revisions"), account pip@entrpy.co
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Wed, 26 Aug 2026 12:41:19 -0400
- **Message id:** `1a03ef2ce100718b`
- **Attachments:** 10 PNG order screenshots (IMG_1246-1254 + one Screenshot). Drive folder `1RTjeO1FX3pSEawprYrMCqzdWj4Ql3JTC` held 5 more (IMG_1276-1280 + dup Screenshot).

> I'm gonna give you a crap ton of screenshots from backdrop orders some of
> these orders how things like scooters and other things added in there.
> Ignore those items. You're only looking at things that are specifically
> backdrops.
>
> I'm uploading them all into this Google Drive folder. I may upload more
> that Google Drive folder later, and if I do, I'll tell you to go take a
> look at it because there's more in there. But let's get started with these.
> https://drive.google.com/drive/folders/1RTjeO1FX3pSEawprYrMCqzdWj4Ql3JTC

## Triage

- **Class:** change-request (data entry into the DREW-90 Expense Tracker Backdrops category).
- **Path:** fast. Reversible, writes only the local `expense_manual_entry` table (pip-owned) via the
  live `/api/expense-tracker/entries` API shipped in DREW-90. Acuity/Square/QBO read-only invariant
  intact. Drew self-authorizes his own dashboard data. **No escalation.**
- **Ticket:** DREW-91 (distinct from DREW-90, which was the feature build; this is populating it).

## Reconstruction (each order anchored on its Amazon Order # + subtotal)

Amounts are the **pre-tax backdrop item price**. Amazon added sales tax per order on top; mixed orders
make tax non-attributable to the backdrops, so pre-tax item price is the consistent, defensible figure.

| Order # | Placed | Backdrops | Amount | Source shots |
|---|---|---|---|---|
| 111-3879834-1197006 | 2026-04-17 | 4x Savage Seamless Paper @ $114.99 | $459.96 | IMG_1246, 1247 |
| 114-7443858-0769029 | 2026-03-20 | 8x Savage Seamless Paper @ $114.99 | $919.92 | IMG_1248, 1249, 1250 |
| 114-0093324-3722622 | 2024-08-30 | 4x Savage Seamless Background Paper @ $119.99 (Backdrop Express) | $479.96 | IMG_1251, 1252, 1253 |
| 114-2619745-4844222 | 2026-08-26 | 3x Kate Seamless Paper @ $99.99 (Katehome) | $299.97 | Screenshot 11.23 |
| 114-9049330-1534667 | 2022-09-22 | 1x Savage Seamless Paper @ $99.99 (Backdrop Express) | $99.99 | IMG_1276 |
| 114-4416033-0260227 | 2022-04-02 | 2x Savage Seamless Background Paper @ $99.99 (Backdrop Express) | $199.98 | IMG_1277 |
| 114-9969706-5490644 | 2021-11-22 | 2x Savage backdrop ($96.98 + $96.99) | $193.97 | IMG_1278, 1279, 1280 |

**7 verified orders = $2,653.75 total.** Each reconciles exactly to its order subtotal:
- 111-3879834: subtotal $459.96 = 4x $114.99 (pure backdrops). ✓
- 114-7443858: subtotal $919.92 = 8x $114.99 (pure). ✓
- 114-0093324: subtotal $817.44 = 4x $119.99 backdrops ($479.96) + 4 Razor A5 scooters (4x $84.37 = $337.48). ✓
- 114-2619745: subtotal $299.97 = 3x $99.99 (pure). ✓
- 114-9049330: subtotal $99.99 = 1x $99.99 (pure). ✓
- 114-4416033: subtotal $199.98 = 2x $99.99 (pure). ✓
- 114-9969706: subtotal $570.72 = 2 backdrops ($193.97) + smart lock/hooks/soap/cards/tape/clamps/router/gateway
  ($376.74); reconciles within $0.01. Order also carried a $40 whole-order coupon (excluded from item price). ✓

## EXCLUDED (per Drew: "ignore those")

- Razor A5 Lux Kick Scooter x2 + Razor A5 Lux Scooter Red x2 (order 114-0093324).
- Smart Lock SMONET, Vintage Cast Iron Wall Hooks x2, Mrs. Meyer's soap, Smart IC Cards, STIKK painters
  tape, Spring Clamps, TP-Link Router, SMONET Gateway (order 114-9969706).

## FLAGGED — one order incomplete

- **Huamei Seamless Photography Backdrop (Youhong_GZ, $96.98 each)** — IMG_1254 shows 3 rolls clearly plus
  a 4th cut off, and the screenshot ends before the order summary (no order #, no subtotal). Not entered —
  would be a guess on count. Asked Drew for that order's full screenshot / to drop it in the Drive folder.

## Actions
- 7 backdrop entries POSTed to `/api/expense-tracker/entries` (Backdrops category), dated each order's placed date.
- Reply to Drew: `1a03efd9e1f7e58a` (7 orders + $2,653.75 total + pre-tax note + Huamei flag + "what's next?").
</content>
</invoke>
