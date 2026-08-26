# Drew — flagship follow-up email: add name to subject + snappier copy (Round 129)

**Source:** Gmail thread `1a036c426017a325` (account pip@entrpy.co)
**From:** Drew Shahoud <drewshahoud@gmail.com>
**Date:** Tue, 25 Aug 2026 22:21:10 -0400
**Message id:** `1a03bdf4135e0cdb`
**Classification:** change-request (copy revision) — fast path
**Ticket:** DREW-89 (same flagship Follow-up 1A email; follow-up tweak)

## Verbatim

> I see the screenshot now. Yeah let's do my subject line, but add their name in there too.
>
> And let's make that email copy a lot more attractive and snappy. Give them an offer quicker, and cut to the chase.
>
> NAME, how was your session? We'd love to offer you 75% off your next booking for you, or your friend, if you'd be willing to leave us a google review!
> Here's the link, and here's the instructions blah blah blah

## Context

Follows Round 128 (`1a03bdd29885f040`), where the flagship Follow-up 1A subject was changed to
Drew's dictated "WhiteWall 75% off for a Google Review" and the full copy was emailed to him
(reply `1a03be32cf5dcd82`). Drew has now seen the screenshot and wants two edits to that same
flagship Follow-up 1A email in Acuity:

1. **Subject** — keep his line, but add the client's first name too.
2. **Body** — rewrite it snappier / more attractive; lead with the 75%-off offer, cut to the
   chase. He sketched the opening: "NAME, how was your session? We'd love to offer you 75% off
   your next booking for you, or your friend, if you'd be willing to leave us a google review!
   Here's the link, and here's the instructions..."

NOT a repo behavior change — Acuity dashboard (flagship Follow-up 1A only; Taylor's 1B untouched).
Reversible copy revision, verbatim-directed by Drew → fast path, no money/legal/architecture gate.

## Shipped (Round 129) — LIVE + VERIFIED

- **Subject (1A/flagship):** `%first%, how was your session?` → **`%first%, WhiteWall 75% off for a Google Review`**
  (kept Drew's exact line, prepended the client first name via the `%first%` token). Acuity Example
  preview renders "Laurie, WhiteWall 75% off for a Google Review" — confirms the token substitutes.
- **Body (1A/flagship):** rewritten snappy / offer-first per Drew's sketch. Opens
  "%first%, how was your session?", puts the 75%-off offer in the first two lines, then a tight
  3-step how-to (leave a review at the same Google review link `https://g.page/r/CUTS3w9lduxlEAI/review`
  → email contact@whitewallstudios.co → get your personal 75% off code for the Powdersville flagship).
  Kept the flagship framing + "yours to use or to gift a friend." **Dropped** the old "send us your
  photos to feature on socials" paragraph to cut to the chase (flagged to Drew, offered to restore).
- **Taylor's Mill Follow-up 1B — UNTOUCHED** (verified on reload: subject still "%first%, how was your
  session?", no 75% off, its own copy). Flagship-only scope preserved.
- Edited in Acuity `/admin/email-settings/follow-up/1` (1A selected) via the persistent Playwright
  profile + creds `~/.config/entrpy/whitewall-squarespace-acuity.env`. Verified by save + fresh reload
  re-read of both subject and body. Proof screenshot:
  `attachments/2026-08-25-followup-1a-name-subject-snappy-copy.png`.
- **No escalation** — verbatim-directed copy revision on Drew's own flagship promo, reversible.
- **Reply to Drew:** `1a03bee21ddce450` (new subject + full copy + note on the dropped paragraph + screenshot).
- **Ticket:** DREW-89 (same flagship follow-up email) → reopened, add-msg `1a03bdf4135e0cdb`, comment, → **done**.
- Send authorized: post cold-start autonomous, armed=ON (Drew's active $30 window).
