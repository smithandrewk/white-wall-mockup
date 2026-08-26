# Drew — flagship Acuity email cleanup (cancellation / reschedule / follow-up)

Round 126. Thread `1a036c426017a325` (account `pip@entrpy.co`). Drew's paid window active ($30, armed=ON).
Ticket: **DREW-88**. Continuation of the DREW-77 flagship Acuity email audit — Drew accepted the
"one more for later" I offered (the cancellation, reschedule, and follow-up templates).

Not a repo change: these are Acuity's own email templates (secure.acuityscheduling.com), edited in the
Acuity dashboard via the Squarespace Contributor access (creds `~/.config/entrpy/whitewall-squarespace-acuity.env`).

---

## Inbound — Drew (VERBATIM)

- Source: gmail (pip@entrpy.co)
- From: Drew Shahoud <drewshahoud@gmail.com>
- Date: Tue, 25 Aug 2026 21:24:00 -0400
- Subject: Re: Dinner receipt
- msgid: `1a03baae98b33f8e`

> Wow, absolutely amazing. Great catch with 3.
>
> Yeah let's clean up those emails too. Honestly, they may be good to go. I can't think of anything
> that needs to be cleaned up there. But if you have any ideas, let me know what you see.

(Reply to Foreman's Round-125 DREW-77 report, which had offered: "the cancellation email, the reschedule
email, and the follow up email are separate templates too... say the word and I will line those up the same way.")

---

## Triage

- Classification: **change-request** (authorizes the offered cleanup) + **approval** (praise of DREW-77).
- Path: fast. Continuation of already-approved flagship-email work. No money / architecture / legal / customer-scale.
- Ticket: **DREW-88** (distinct from DREW-77 which shipped + closed; new template set). Anchored to msg `1a03baae98b33f8e`.
- Coupling: none.
- Legal check: the cancellation email is where refund/cancellation POLICY wording would live and would trip the
  legal gate. Audit found the cancellation template carries **no** refund/cancellation policy wording (stock Acuity
  generic body) — so nothing legal was touched. No escalation on that axis.

## Audit findings (read-only first)

Three templates, read side by side:

1. **Cancellation Confirmation** (`emailType=5`, "All appointments" — one global template, not per-location).
   Stock Acuity body: "Appointment Cancelled / for [First] [Last]", What / When / Where (dynamic
   `[call in info or location]` merge tag), "Your appointment has been successfully cancelled." **No location
   codes** (correct — it is global across both studios) and **no refund/cancellation policy text**. → **Good as-is,
   nothing to clean up.**

2. **Reschedule Confirmation** (`emailType=4`, "All appointments" — one global template). Stock body:
   "Appointment Rescheduled", What / Old Time / New Time / Where (dynamic location merge tag), plus the
   Change-Cancel + Add-to-Calendar buttons. The "Change/Cancel Appointment" button stores `href="#"` — I verified
   this is **stock Acuity behavior, not a bug**: the live, Drew-approved flagship Booking Confirmation 2 uses the
   exact same `href="#"` (Acuity injects the real link at send time), so I left it untouched. Because it is a single
   global template it correctly stays generic (it cannot safely embed Powdersville-only codes). → **Good as-is.**

3. **Follow-ups** (`/admin/email-settings/follow-up/1`) — **the one real gap.** Enabled (fires 1 day after every
   appointment), subject set, split into two templates:
   - **Follow-up 1B** (Taylor's Mill types) — had Drew's follow-up copy: thank-you + Google Review link
     (`https://g.page/r/CUTS3w9lduxlEAI/review`) + "share your work" ask. Sending fine.
   - **Follow-up 1A** (ALL Powdersville / flagship types incl. the 8-hour) — **body was EMPTY** (`<p>​</p>`), so
     Acuity was **not sending any follow-up for flagship sessions** (its own banner: "One or more templates in this
     follow-up doesn't have any content and will not be sent"). Flagship customers were getting no post-session
     thank-you and, importantly, **no Google review request**.

   Same "flagship is missing what the other location already has" pattern as DREW-77 (item 3).

## Fix (shipped)

Copied Drew's own working 1B follow-up copy VERBATIM into the empty Follow-up 1A, and aligned 1A's subject to match
1B ("%first%, how was your session?"). His existing wording, location-agnostic (the Google review link is the single
WhiteWall Studios Google page, same for both studios), so this is a sync — not net-new authored copy — exactly the
DREW-77 pattern. Since 1A and 1B now hold identical copy, the minor type-grouping (Taylor's Six Hours listed under
1A) is immaterial: every appointment type now gets the same follow-up.

**Verified** by re-reading the saved templates: 1A body now carries the full copy incl. the Google review link;
subject "how was your session?"; Acuity's empty-template warning is cleared ("2 active templates", both sending).
Proof screenshot: `attachments/2026-08-25-followup-1a-filled.png`.

Left for later (offered to Drew, not done): whether to split the reschedule into per-location templates so it could
re-include the access codes — not recommended (customers already hold the codes from the confirmation, and the
current generic reschedule is correct for both studios).

## Escalation

Soft-FYI to Andrew (same class as DREW-77): new live customer-email delta via the Acuity access path. Recorded via
`foreman-escalate --reason decision`. Not a hard gate (Drew's own copy replicated; no money/legal/architecture).

## Reply to Drew

msgid: `1a03bb52c2924f53`. Reported: cancellation + reschedule are correctly good-to-go (with the why), and the
one thing I found + fixed — flagship sessions were getting no follow-up at all, now they get your thank-you +
Google review request like Taylor's. Attached the proof screenshot.

## Status

- DREW-88 → done (shipped + live + verified + reported).
