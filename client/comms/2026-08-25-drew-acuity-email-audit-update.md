# Drew — Round 125: "any update on the acuity email thing" (DREW-77 flagship email audit shipped)

- **Source:** Gmail (pip@entrpy.co)
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Thread:** 1a036c426017a325
- **Access window:** ACTIVE (Drew's $30 paid day), armed=ON.

## Verbatim — msg 1a03b773fcecc6ce (Tue 25 Aug 2026 20:27:34 -0400)

> Flawless. Thanks pip.
>
> (quoting pip's Round 124 reply about the Calendar reschedule button + Edit Session spec)

Classification: `approval / fyi` — Drew's ack of Round 124 (DREW-87 Reschedule-in-Calendar shipped, DREW-47 Edit Session spec). No new work.

## Verbatim — msg 1a03b77adfc76679 (Tue 25 Aug 2026 20:28:02 -0400)

> Pip any update on the acuity email thing from earlier?

Classification: `question` about DREW-77 (the flagship Acuity email audit Drew opened this morning, msg 1a03994b8716a7ed, item 1/1a/1b): make the 24h reminder carry the same info as the booking confirmation, and add the IG walkthrough video. pip had told Drew twice it was still in progress (1:53pm, 3:07pm).

## What was actually done this session (DREW-77 SHIPPED)

**Got into Acuity.** Accepted Drew's Squarespace Contributor (Admin) invite for pip@entrpy.co (created the login; reCAPTCHA Enterprise passed headless). Acuity = Squarespace Scheduling at secure.acuityscheduling.com. Creds stored `~/.config/entrpy/whitewall-squarespace-acuity.env` (chmod 600). Session profile persists for future headless work.

**Audit finding — the reminder was missing almost everything.** The flagship confirmation ("Booking Confirmation 2", Powdersville types) had: FAQ link, address + the 2699/2709 GPS clarification, Studio Door Code 1923, **Storage Building Lockbox Code 2319**, storage building contents info, and 7 YouTube links (booking access video, storage building, chair rental, lighting rental, backdrop rules, set up, tear down). The flagship 24h reminder ("Reminder 1B", Powdersville) had ONLY the address + door code 1923. Everything else was missing.

**Bug caught — flagship 8-hour session was routed to the WRONG location's emails.** "Powdersville Studio - Eight Hours" (the newest flagship type, V3 item 3) was assigned to the **Taylor's Mill** confirmation (Booking Confirmation, default id=0) AND the Taylor's Mill reminder (Reminder 1A). So an 8-hour flagship customer received Taylor's Mill address (250 Mill St), Taylor's door code, and Taylor's lockbox, i.e. wrong building + wrong codes. Every other Powdersville type was routed correctly.

**Fixes applied + VERIFIED (re-read after save):**
1. **Reminder 1B synced to the confirmation** — added the FAQ link, GPS clarification, Storage Building Lockbox Code 2319, storage building info link, and all 7 video links. Kept the reminder's unique cleanup/reset ask at top (Drew: "same content, positioned differently").
2. **IG walkthrough video added to BOTH emails** (confirmation + reminder), Drew's exact text + link: "Watch This Video to see what the studio will look like when you walk in, and what it needs to look like after you reset, before you leave." → https://www.instagram.com/reel/DZtLEyQyt7H/
3. **8-hour routing corrected** — moved "Powdersville Studio - Eight Hours" onto Booking Confirmation 2 (Powdersville) and Reminder 1B (Powdersville). Verified persisted; appears exactly once in each, no dupes.

Proof screenshot of the synced Reminder 1B: `attachments/2026-08-25-rem1b-synced-preview.png` (sent to Drew).

Exact confirmation hyperlinks (source of truth): FAQ https://whitewallstudios.co/faq · booking video https://youtu.be/HzLZXboVjR4 · storage https://youtu.be/K810lp2kEYc · chair https://youtu.be/aNTLiqzGxp4 · lighting https://youtube.com/shorts/EmN3ppbh-lk · backdrop rules https://youtu.be/odI-eBI1ET8 · set up https://youtu.be/urgK84SVAWo · tear down https://youtu.be/CjImGta-iKs

## Not in this pass (noted for Drew)
Cancellation Confirmation, Reschedule Confirmation, and Follow-ups exist as separate flagship emails but were not part of the confirmation-vs-reminder parity ask; flagged to Drew in case he wants those aligned too.

## Escalation
Soft FYI to Andrew (not a block): pip created a Squarespace/Acuity contributor login and edited the LIVE flagship customer emails (copied already-approved confirmation content into the reminder + Drew's dictated IG link + a routing bug fix). Recorded so the customer-facing-email delta is visible on the dashboard.
