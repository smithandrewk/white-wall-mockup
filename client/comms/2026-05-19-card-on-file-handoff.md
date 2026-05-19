# RESUME HERE — Card-on-File + Policy Update (Drew 2026-05-11)

**Last worked:** 2026-05-19. **Author:** Claude (session "white-wall").
**Purpose:** Pick up exactly where we left off without re-reading the chat.

---

## Status (git-log)

```
[2026-05-11] Drew emailed: new T&C, new waiver, card-on-file for all bookings
[2026-05-12] Drew answered all 8 questions; raised budget concern
[2026-05-18] Andrew replied w/ corrected hours; Drew greenlit budget
[2026-05-18] PR 1 (T&C + waiver + $200 fee) — MERGED, LIVE in prod
[2026-05-19] PR 2 (card-on-file) — built, draft PR #2, NOT tested, NOT live
```

**One-liner:** PR 1 is done and live. PR 2 is code-complete but unverified and unreachable in prod until Square App ID env vars are set. Booking flow still runs on the old (working) Payment Link path until we deliberately cut over.

---

## PR 1 — DONE. Nothing to do.

- Merged to `main` (squash commit `cd291d6`), Vercel auto-deployed, verified live on `whitewallstudios.co/book-powdersville`.
- New 19-point T&C (both locations), new 12-section waiver (client + server email copy).
- Fees per Drew: early/late exit stays **$130 / 15-min**; "trashed the place" cleaning fee bumped **$130 → $200 min**; $150 event cleaning-fee line item unchanged.
- TM kept its "photo/video only, no events/parties" header (Drew's option b).

---

## PR 2 — Card-on-file. Built, NOT verified, NOT live.

- **Draft PR:** https://github.com/smithandrewk/white-wall-mockup/pull/2
- **Branch:** `worktree-pr2-card-on-file` (pushed to origin, commit `59836bb`)
- **Local worktree (optional):** `/Users/andrew/dev/white-wall-mockup/.claude/worktrees/pr2-card-on-file` — kept on disk; safe to delete, the branch is on GitHub.

### What it does
Replaces the Square hosted Payment Link redirect with the **Web Payments SDK** embedded on our page. Customer must check a card-on-file consent box to book. `tokenize({intent:'CHARGE_AND_STORE'})` → `POST /api/create-checkout` runs the whole thing inline: buffer-conflict check (preserved) → server pricing → findOrCreateCustomer → createPayment → createCardOnFile → Acuity appointment + capacity notes + cleaning buffer + owner/cleaner/SMS/PostHog notifications. Auto-refunds if any step after the charge fails. Consent proof (IDs, IP, UA, signed names, SHA-256 of exact waiver text) written to Acuity notes.

### Files changed in PR 2 (for orientation)
| File | Change |
|---|---|
| `api/booking-public-config.js` | NEW — serves public Square App/Location ID + SDK URL to browser |
| `api/_lib/square.js` | +`findOrCreateCustomer`, `createPayment`, `createCardOnFile`, `chargeCardOnFile` |
| `api/create-checkout.js` | Full rebuild. Buffer-conflict block preserved byte-for-byte |
| `api/booking-callback.js` | Retired to deprecated 302 stub (delete next release once zero traffic) |
| `scripts/booking-flow.js` | SDK loader, visibility-gated card init, consent checkbox, tokenize, idempotency key, Pay button moved out of re-rendered summary |
| `book-powdersville.html` / `book-taylors-mill.html` | Stable `[data-payment-section]` with card container + consent + Pay button |
| `styles/booking.css` | Card container + consent row styles |
| `vercel.json` | `create-checkout` `maxDuration: 30` |

### Verified so far
Only `node --check` (syntax) on all touched JS, vercel.json valid, HTML markers present, `buildSquareLineItems` confirmed returning cents. **Zero functional testing — no code path has touched real Square.**

---

## ▶️ RESUME STEPS (in order)

### 1. Get Square Application IDs  *(owner: Andrew, ~2 min)*
- https://developer.squareup.com/apps → log in as `contact@whitewallstudios.co`
  (BW pw: `BW_SESSION="$(~/.local/bin/bw-session)" bw get password 9db70e53`)
- Open the existing app → left sidebar **Credentials**
- **Sandbox** toggle → copy **Application ID** (`sandbox-sq0idb-…`) = `SQUARE_SANDBOX_APPLICATION_ID`
- **Production** toggle → copy **Application ID** (`sq0idp-…`) = `SQUARE_APPLICATION_ID`
- (The "Access token" on that page is the one already in Vercel — don't touch it.)

### 2. Set them in Vercel  *(owner: Andrew)*
Vercel → `white-wall-mockup` → Settings → Environment Variables. Add both, scope **All environments** (they're public, zero risk):
- `SQUARE_SANDBOX_APPLICATION_ID` = `sandbox-sq0idb-…`
- `SQUARE_APPLICATION_ID` = `sq0idp-…`
Sanity-check the prefixes (`sandbox-sq0idb-` vs `sq0idp-`) — a wrong App ID fails with a cryptic SDK error.
Also recommend dropping both in Bitwarden for tidiness.

### 3. Deploy PR 2 branch to a Vercel preview, sandbox-test
Once env vars exist, deploy `worktree-pr2-card-on-file` as a preview (`SQUARE_ENVIRONMENT=sandbox`). Run the 10 scenarios in
`client/comms/2026-05-11-drew-card-on-file-technical-build.md` (Sandbox testing plan):
happy path (`4111 1111 1111 1111`), declined, tokenize fail, createCard fail, slot conflict, MIT charge (`ccof:customer-card-id-ok`), MIT decline, 3DS, mobile Safari, idempotency.

### 4. Preview real-card test with Drew
Drew books a real low-cost slot on the preview URL with his own card. Verify: card charges, card saved (Square Dashboard → Customers), Acuity appt created, confirmation email, Drew can charge the saved card from Dashboard. **Also have Drew watch his statement for whether Square's $0 CreateCard verification shows as a pending charge** (open unknown — see below). Refund + cancel the test.

### 5. Take down the direct Acuity scheduler URL  *(owner: Andrew/Drew — Drew's answer #6, option B)*
Drew wants every booking to save a card, so no bookings should bypass the site via the old Acuity scheduler link. Repoint any public links (Google Business Profile, Instagram bio, etc.) to `whitewallstudios.co/book-powdersville`. **This is not a code change in this repo** — it's external link hygiene + possibly hiding the Acuity scheduler.

### 6. Cutover
Mark PR 2 ready → merge to `main` → Vercel deploys → watch first 2–3 real bookings + Vercel logs 24h. Rollback = Vercel "promote previous deployment".

---

## Known unknowns to watch during testing (not yet answered)
- **Square $0 CreateCard verification**: visible pending charge on customer statement, or invisible? Confirm in step 4.
- **iOS Safari**: Square card iframe keyboard/scroll behavior on mobile.
- **3DS**: challenge UX in production differs from forced-sandbox; first real 3DS is a real customer.
- **SearchCustomers `{exact:email}`**: confirmed valid in docs; verify dedup behaves in sandbox with Drew's historical Acuity-Square customer records.

## Risks already handled in code
Card iframe survives re-renders (stable section, never innerHTML-replaced) + attaches only when step 5 visible (offsetParent guard). Stable client idempotency key → no double-charge on retry. Auto-refund + critical alert if post-charge step fails. Consent proof in Acuity notes for chargeback defense.

---

## Reference docs (all in `client/comms/`, committed alongside this file)
- `2026-05-11-drew-email-card-on-file-and-tc-waiver-updates.md` — Drew's verbatim source email + new T&C/waiver text
- `2026-05-11-drew-card-on-file-and-policy-update-plan.md` — strategic plan + Drew's Q&A
- `2026-05-11-drew-card-on-file-technical-build.md` — full technical build spec + 10-scenario test plan
- `client/revision-status.md` → "Feedback Round 20" — checkbox tracker (PR 1 done, PR 2 build done, cutover pending)

## Drew comms state
Email thread "WhiteWall Work Needed" (Gmail thread `19e18905e5b82074`). Drew answered all questions 2026-05-12 and greenlit the budget after Andrew's corrected estimate. No open question to Drew right now. (A stale earlier Gmail draft with the *original* questions may still exist — ignore/delete it; it's superseded.)

## How a fresh Claude session resumes
1. Read this file + the 3 reference docs above.
2. The PR 2 code is on branch `worktree-pr2-card-on-file` (GitHub PR #2). Either re-enter the existing worktree or `git worktree add` a fresh one from that branch.
3. Resume at the first unchecked RESUME STEP above (almost certainly step 1/2: Square App IDs).
