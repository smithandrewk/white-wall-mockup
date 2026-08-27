# Drew — Denise event booking got Taylor's Mill email for a Powdersville event (location-email misroute)

**Thread:** 1a043e7152dd0429 ("Need WHiteWall help")
**Source:** Gmail (pip@entrpy.co)

---

## Drew message — 2026-08-27 11:54:49 -0400 — msgid `1a043ee8ecf93848`
**From:** Drew Shahoud <drewshahoud@gmail.com>

> Okay, so here's the deal. I'm including two screenshots for easy reference, but they're both in the Whitewall dashboard so you can take a look at it specifically. A couple things going on here:
> It looks like Maggie booked 12 a.m. when she meant to do 12 p.m. I already called her, and we're all good to go. I just manually moved her over to 10 a.m., and she is all set, so that one's fine. She just literally messed up on her own.
> However, this other screenshot is from a texting conversation with Denise. This is an event that's happening, and it was booked a while ago, but it looks like she got all her booking information for the Taylor's Mill location, not the Powdersville location. I'm glad she texted me because she got the wrong information for her event. Can you go into Acuity or whatever you need to do to verify that this won't happen again? Can we try and figure out why this happened in the first place? You may have already fixed this whenever you're doing your email stuff before. We just really need to make sure that the right information is going to the right people whenever they book certain locations. We honestly need to give her the correct email now because she has the completely wrong information and door codes, and she doesn't have certain video links and everything. Can you just figure out what the heck happened, what's going on here, and how we could permanently fix that to make sure this doesn't happen again, especially for event bookings or really anything relating to the Powdersville/Taylor's Mill location?
> [attached: Screenshot 2026-08-27 at 11.46.48 AM.png (Denise's received email — shows Taylor's Mill 250 Mill St address + Taylor's door codes), Screenshot 2026-08-27 at 11.46.57 AM.png (dashboard Calendar Aug 29 — Denise Ko EVENT, 12:30p Powdersville 8h $917)]

**Screenshot facts:**
- **Denise Ko** — EVENT — Aug 29, 12:30pm, Powdersville, 8h, $917, Paid in full. denise@bloominmama.com, phone 6783584664, headcount 65, add-ons Chairs 50 / Tables 1 / PA system, cleaning fee $150, promo SHARON200. Motherhood gathering.
- Her received confirmation email showed: **Address 250 Mill St, Taylors, SC 29687 (TAYLOR'S MILL)**, Outdoor Lockpad Code 7530, Studio Door Code 2319, Lighting Case Code 508 — all Taylor's Mill values. She texted Drew: "just want to make sure this is the information for the Powdersville location just because it shows the Taylors address!"
- Maggie Macdonald (12:00a → moved to 10a by Drew) is FYI-only, resolved on Drew's end.

## Classification
change-request / incident — location-email misroute for event bookings. Deliberative-ish but urgent (event is Aug 29, two days out). Root-cause + permanent fix + get Denise correct info.

---

## Investigation + resolution (Foreman Round 141, DREW-95)

**Root cause.** Denise Ko's appointment (Acuity id 1742001484) is type **"Powdersville Studio - Eight Hours" (94823049)**, on the **Powdersville** calendar (6255578), Aug 29 12:30pm — booking is correct. `dateCreated = 2026-07-22`. At that time the 8-Hour Powdersville type was assigned in Acuity to the **Taylor's Mill** confirmation template (Booking Confirmation) + Taylor's reminder (Reminder 1A), so her confirmation email carried Taylor's Mill info (250 Mill St; Studio Door 2319; Outdoor Lockpad 7530; Lighting Case 508). **DREW-77 (2026-08-25) already fixed this exact routing** (moved the 8-Hour to Booking Confirmation 2 + Reminder 1B). Denise booked five weeks before that fix, so she received the old misrouted email.

**Verified permanently fixed (Acuity dashboard, checkbox-by-checkbox).**
- **Booking Confirmation** (Taylor's): exactly the 6 Taylor's Mill types checked; NO Powdersville.
- **Booking Confirmation 2** (Powdersville): exactly the 7 Powdersville types checked, **including Powdersville Studio - Eight Hours**; NO Taylor's.
- **Reminder 1A** = the 6 Taylor's types; **Reminder 1B** = the 7 Powdersville types incl. the 8-Hour.
- Zero cross-assignment. Cancellation + Reschedule are single global "All appointments" templates (no location codes) so they cannot misroute.
- **Only Denise affected:** Acuity API query for type 94823049 from today forward returns exactly 1 upcoming booking (hers). No other pre-fix 8-Hour PV booking is still upcoming.

**Residual risk / process safeguard.** The type -> email-template assignment is Acuity-dashboard-only (not in the API, not code-controllable). The only way this recurs is a NEW appointment type added later and not attached to its location's confirmation + reminder templates. Documented the invariant in `api/_lib/acuity.js` near the type allowlist + noted in the setup checklist.

**Correct Powdersville info (from Booking Confirmation 2), given to Drew to relay to Denise:**
- Address (GPS): 2709 Powdersville Rd, Easley, SC 29642 (real number 2699; gray building, big windows, WhiteWall signs by the concrete drive-in)
- Studio Door Code: **1923** (her wrong email said 2319, which is actually the PV storage lockbox)
- Storage Building Lockbox: 2319 (chairs/tables/PA/TV for her event)
- Videos: studio access https://youtu.be/HzLZXboVjR4 · storage/equipment https://youtu.be/K810lp2kEYc · chair rental https://youtu.be/aNTLiqzGxp4 · lighting https://youtube.com/shorts/EmN3ppbh-lk · backdrop rules https://youtu.be/odI-eBI1ET8 · set up https://youtu.be/urgK84SVAWo · tear down https://youtu.be/CjImGta-iKs · reset walkthrough https://www.instagram.com/reel/DZtLEyQyt7H/
- Contact: contact@whitewallstudios.co / (803) 873-8153

Also offered to resend the formatted confirmation from the White Wall system to denise@bloominmama.com (awaiting Drew's go).

**Maggie Macdonald** (12am vs 12pm) = FYI only, Drew already called her + moved her to 10am. No action.

## pip reply — 2026-08-27 — msgid `1a044049326c45bd`
Sent root cause + verified-fix summary + the correct Powdersville info block + offer to resend + Maggie ack. (Full text: `scratchpad/reply_drew.txt`.)

**No escalation.** No money, no architecture, no legal/policy copy, no at-scale customer send (single customer; info relayed via Drew). Acuity email-routing verification is established Foreman scope (DREW-77 precedent). NO code behavior change — a doc-only invariant note in acuity.js.
