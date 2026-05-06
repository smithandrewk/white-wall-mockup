# Escalations & Manual Actions

Items that need Andrew's manual intervention or can't be resolved programmatically.

## Pending

### 2026-05-05 — Molly Hensley (Nov 14 booking) underbilled $150 cleaning fee
- **Booking:** Acuity #1696694829 — Molly Hensley, Nov 14 2026, PV Full Day, "35 +" event guests
- **Charged:** $1,030 (Full Day $980 + All Backdrops $50)
- **Should have been:** $1,180 (cleaning fee $150 not applied)
- **Cause:** customer typed `"35 +"` (with space + plus) in the participants field. Client-side `Number("35 +")` = NaN, so the cleaning fee threshold check silently failed. Buffer block also was not created.
- **Fix shipped:** parser now extracts the first integer from any input (`parseCount`); server-side recompute as belt-and-suspenders so client parser bugs can't drop the fee.
- **Owner action needed:** Drew decides whether to (a) charge Molly $150 separately, (b) eat the $150, or (c) leave it. Either way: book a 2.5hr buffer block on the PV calendar after 11pm Nov 14 manually if her event needs cleanup.

## Resolved

_None yet._
