# Drew — "Let's do it. Push it all live!" (multi-day event flow GO-LIVE)

- **Source:** Gmail, thread `19f424228b20d389`
- **From:** Drew Shahoud <drew@entrpy.co>  ·  **Date:** Sun, 12 Jul 2026 00:45:15 -0400  ·  **Msg id:** `19f54a500b31fa61`
- **Triage:** change-request / GO-LIVE authorization (in reply to Foreman's itemized staging confirmation `19f5468f037fb285`).

## VERBATIM
> Let's do it. Push it all live!

## Gate analysis (§4)
- **Direct Drew instruction to ship HIS feature → Foreman ships + FYIs Andrew, does NOT hard-gate** (memory [[drew-self-authorizes-money]]; Andrew's standing 2026-07-10 order: run the Drew back-and-forth autonomously, never ask Andrew for approval).
- **The ONE Andrew-gated exception stays dark: item-6 40% auto-charge arming.** "Push it all live" does NOT arm it. Drew already agreed in-thread that the auto-charge is "finalizing" + the Watson manual reminder is the interim. No customer-facing "auto-charges" copy may go live.
- Not "customer-scale at scale" (transactional per-booking notifications, same as the single-session path already does) → no hard gate on the notifications; they are exactly what Drew spec'd.
- Within the white-wall-mockup repo; booking-flow front-end + backend, staging-verified (dry-run passed). Deploy = merge to main → Vercel.

## Plan
1. Verify the branch exposes NO customer-facing auto-charge/deposit copy (item-6 dark; server flags off in prod env).
2. Merge `worker/multiday-event-flow` → main via PR (host contract).
3. Vercel auto-deploys → verify on prod URL (curl live booking page, spot-check the gate).
4. Confirm LIVE to Drew (only after prod deploy confirmed + spot-checked).
5. FYI Andrew (non-blocking): multi-day flow + real owner/customer/cleaner notifications now live; auto-charge stays dark.
