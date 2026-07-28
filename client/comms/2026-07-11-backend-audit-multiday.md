# Backend audit — multi-day EVENT path (2026-07-11)

Triggered by Drew msg 19f53489dcca8270: "verify everything works on the back end… setup crew window either end, cleaner time on the backend, auto contact to April the cleaner, payment auto charge on the right time, literally all of it. Give me the official thumbs up."

**Root cause:** a multi-day event routes through `handleCartCheckout` (create-checkout.js:914-1430); several behaviors exist ONLY in the single-session path and were never ported to the cart path. `booking-callback.js` is a deprecated stub — all work is inline in create-checkout.js.

| # | Behavior | Verdict | Evidence |
|---|----------|---------|----------|
| — | Appointment creation + scheduling (N appts, right days/times/types) | WORKS | verified via 2 staging dry-runs; create-checkout.js:1235 |
| — | 60% deposit collection + card-on-file saved + balance_charge_at recorded | WORKS | create-checkout.js:1147, 1320-1327 |
| 1 | Setup/reset crew TIME WINDOW (buffer before/after) | NOT BUILT | crew is $750 line + placement notes only; no start-earlier/longer-duration anywhere |
| 2 | Cleaning buffer BLOCK after event | GAP | POST /blocks exists only in single path; cart path never calls it |
| 3 | Auto-email April the cleaner (.ics) | GAP | notifyCleaner never called on cart path; cart sessionState has no cleaningFee field; notify-cleaner is single-session-shaped |
| 4 | 40% balance auto-charge at T−48h | PARTIAL/DARK | card+charge-time saved but enroll-off + pgcron-not-applied + SCHEDULER_ARMED off + DEPOSIT_AUTOCHARGE_ARMED off = never charges. **Item-6, Andrew-gated.** |
| 5 | Owner + customer notifications on booking | GAP | paid cart path fires none of notifyOwner/notifyOwnerSMS/notifyCustomerSMS; customer gets only Acuity's per-appt email (N times) |

**Go-live blockers:** items 1,2,3,5 must be wired into the cart path; item 4 is Andrew's item-6 gate. Do NOT represent 1/2/3/5 as working; item 4 only collects the deposit.

Reported honestly to Drew (no thumbs up) 2026-07-11.
