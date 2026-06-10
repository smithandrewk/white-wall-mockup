# Escalations & Manual Actions

Items that need Andrew's manual intervention or can't be resolved programmatically.

## Pending

### 2026-06-10 — QBO mark-paid broken: refresh token stale, re-auth needed
- **Symptom:** `/api/qbo-test` returns `invalid_grant` ("Incorrect or invalid refresh token"). Every booking since the token went stale has left its QBO draft invoice unpaid.
- **Cause:** Intuit rotates refresh tokens on use; the rotated value can't be persisted back into Vercel env vars (tokens last set ~2026-03-31), so the stored one died. Will recur until token storage moves out of env vars.
- **Fix (manual, needs Drew's Intuit login):** visit `https://whitewallstudios.co/api/qbo-auth`, sign in as Drew, approve; copy fresh tokens from `/api/qbo-callback`; update `QBO_ACCESS_TOKEN` + `QBO_REFRESH_TOKEN` in Vercel (Production); redeploy; verify with `/api/qbo-test`.
- **Note:** NOT the Intuit questionnaire — that was completed and prod has been live since 2026-03-31 (docs reconciled 2026-06-10, commit 1a28fc4). Low priority per Drew (he does not invoice customers), but unpaid drafts pile up.

## Resolved

### 2026-05-05 — Molly Hensley (Nov 14 booking) underbilled $150 cleaning fee
- **Booking:** Acuity #1696694829 — Molly Hensley, Nov 14 2026, PV Full Day, "35 +" event guests
- **Was charged:** $1,030 (Full Day $980 + All Backdrops $50). Should have been $1,180.
- **Cause:** customer typed `"35 +"` in the participants field. `Number("35 +")` = NaN; the >=35/>=50 threshold checks silently failed. Buffer block also missed.
- **Code fix shipped:** `parseCount()` helper, `beforeinput` keystroke blocker, server-side cleaning-fee recompute in create-checkout.js. (Commits 299eaaa, 905dd03.)
- **Owner action:** Drew remediated directly with Molly (2026-05-05).
