# Escalations & Manual Actions

Items that need Andrew's manual intervention or can't be resolved programmatically.

## Pending

_None._

## Resolved

### 2026-05-05 — Molly Hensley (Nov 14 booking) underbilled $150 cleaning fee
- **Booking:** Acuity #1696694829 — Molly Hensley, Nov 14 2026, PV Full Day, "35 +" event guests
- **Was charged:** $1,030 (Full Day $980 + All Backdrops $50). Should have been $1,180.
- **Cause:** customer typed `"35 +"` in the participants field. `Number("35 +")` = NaN; the >=35/>=50 threshold checks silently failed. Buffer block also missed.
- **Code fix shipped:** `parseCount()` helper, `beforeinput` keystroke blocker, server-side cleaning-fee recompute in create-checkout.js. (Commits 299eaaa, 905dd03.)
- **Owner action:** Drew remediated directly with Molly (2026-05-05).
