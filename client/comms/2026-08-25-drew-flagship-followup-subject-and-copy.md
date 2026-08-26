# Drew — flagship follow-up email subject line + full copy request (Round 128)

Thread `1a036c426017a325` (account pip@entrpy.co). Follows Round 127 / DREW-89 (flagship
Google review incentive + SHAHOUD75 coupon, shipped + live). Same work — a tweak to the
flagship Follow-up 1A email.

---

## Drew message (VERBATIM)

- Source: Gmail thread `1a036c426017a325`
- From: Drew Shahoud <drewshahoud@gmail.com>
- Date: Tue, 25 Aug 2026 22:18:53 -0400
- Message id: `1a03bdd29885f040`

> What's the subject line of that follow up email? Can we make it WhiteWall
> 75% off for a Google Review.
>
> Can you also email me the full copy of that email so I can see it?

---

## Triage

- Classify: **change-request** (subject line swap) + **question** (what is the current
  subject) + a **deliverable** (email him the full copy).
- Path: **fast path**. The subject line "WhiteWall 75% off for a Google Review" is
  **verbatim-dictated by Drew** on his own flagship promo email — no money/legal/
  architecture/customer-scale gate. Acuity dashboard edit, not a repo change.
- Scope: flagship **Follow-up 1A (Powdersville)** only. Taylor's Mill 1B has no 75% off
  incentive, so its subject stays as-is (a "75% off" subject there would be misleading).
- Ticket: **same work as DREW-89** (the flagship follow-up incentive email). Comment +
  reopen to in_progress, ship, re-close.

## Action

1. Read current 1A subject + full body from Acuity (answers his subject question).
2. Change 1A subject to "WhiteWall 75% off for a Google Review"; verify by re-read.
3. Reply to Drew: the old subject, confirmation the new subject is live, and the full copy
   of the flagship follow-up email so he can see it.

## Resolution — SHIPPED + LIVE + VERIFIED (Round 128)

- **Subject changed + verified.** Flagship **Follow-up 1A (Powdersville)** subject was
  `%first%, how was your session?` → now **`WhiteWall 75% off for a Google Review`**
  (Drew's dictated line, verbatim). Changed in Acuity (`/admin/email-settings/follow-up/1`)
  via the persistent Playwright profile + creds. Verified by save+reload re-read: subject
  persisted, body intact (75% off + "Powdersville flagship", len 956).
- **Flagship-only scope tightened (found + fixed this round).** The 1A list still grouped
  **"Taylor's Mill - Six Hours"** with the Powdersville types, so a Taylor's Mill Six Hours
  booking would have received the flagship 75% off incentive email (and now the "75% off"
  subject). Dragged that one chip from the 1A (flagship) list to the 1B (Taylor's) list
  (auto-saves on drop). Verified by re-read: **1A = Powdersville types only; 1B = all
  Taylor's Mill types incl. Six Hours.** Incentive now reaches only flagship clients.
- **1B (Taylor's) subject + body untouched** — plain thank-you + review request, no discount.
- Reply to Drew: msg `1a03be32cf5dcd82` (full copy of the email + proof screenshot
  `attachments/2026-08-25-followup-1a-subject-and-incentive.png`).
- Ticket: **same work as DREW-89** (Round 127 flagship review incentive email) — add-msg +
  comment on DREW-89; stays `done`.
- **No escalation.** Verbatim-dictated subject on Drew's own flagship promo, plus a
  reversible flagship-scope tightening. No money/legal/architecture/customer-scale gate.
  Consistent with the DREW-77/88/89 email-template fast path.
