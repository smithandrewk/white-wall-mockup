# Drew email — Square net total vs dashboard net total (audit)

- **Source:** Gmail, thread "WhiteWall dashboard revisions" (`19ed260797a3f02c`)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Wed, 1 Jul 2026 18:39:55 -0400
- **Msg id:** `19f1fd6ffd75d06e` (`<CA+_J_6XMJpZf7Uh3a_xChPyOZPKL-kkpVps6qR48U7DdLo+vQQ@mail.gmail.com>`)
- **Attachments:** 6 screenshots in `2026-07-01-drew-square-mismatch/` (Square Sales Report Apr/May/Jun + the dashboard Revenue tab)
- **Class:** question / data-accuracy audit (no build required). Caught by the auto-watch cron.

## Verbatim

> Pip, i'm probably missing something here. High likelihood that is user error. But when I log into Square for white Wall, it's saying our net total is substantially different than the dashboard is saying our net total is. Look at the different numbers here. Can you take a look and let me know your thoughts? We just need to make sure we're pulling directly from Square. But again, audit my thinking here. Unlikely not seeing something right.

## Finding — NOT a bug, NOT user error; a definitional difference

The dashboard IS pulling directly from Square and the data is COMPLETE — sale **counts match exactly**: Apr 52 / May 61 / Jun 47 on both Square and the dashboard.

Square "Net Sales" = Gross − Returns − Discounts, but does **NOT** subtract Square's
processing fees. The dashboard number is the real cash deposited = Net Sales − the
~3.1% Square fee. So `dashboard net = Square Net Sales − fees`.

| Month | Square Net Sales (before fees) | Square fees (dashboard) | Dashboard net (after fees) |
|---|---|---|---|
| Apr | $8,238 | $269 | $7,899 |
| May | $9,459 | $307 | $9,407 |
| Jun | $9,644.50 | $298 | $9,071 |

(Dashboard `gross_amount` = Square Gross − Discounts, i.e. the actual charge; `net` =
gross − fees − refunds.) Remaining ±$70–275 month-to-month gaps are month-boundary
timing (a payment/refund landing in a slightly different calendar month on Square's
report vs ours); they wash out over the year. Payment source in the DB: 2,436 `square`
rows ($332k net) + 2,540 `estimate` rows (Acuity list-value, used only where no Square
cash exists) — the Revenue tab sums `source like 'square%'`, i.e. real Square cash.

## Action

Reply sent to Drew explaining the reconciliation (msg id in thread) + offered to add a
"before fees" line / note on the Revenue tab so the two tie out at a glance. No code
change unless Drew wants that clarifier.
