# Plan — Drew's 2026-05-05 revision text

**Source:** `client/comms/2026-05-05-drew-text-post-delivery-revisions.md`
**Status:** Refined per Andrew's answers (2026-05-05). Awaiting Drew's answers on copy-paste questions.
**Engagement note:** Post-delivery — site already shipped & invoiced ($3.2K). These are net-new requests.

## April's contact info (received from Andrew, 2026-05-05)

- **Name:** April Steadman
- **Email:** cleanspacesco.gvl@gmail.com
- **Phone:** +1 (916) 579-9248
- **Use:** `CLEANER_EMAIL` env var in production. Phone reserved for future SMS if needed.

## Andrew's answers (2026-05-05)

1. **Email volume (Item 2):** Every booking, full detail. Easy to walk back if Drew hates the noise.
2. **SMS (Item 5):** Use **Blue Bubbles on Watson** (Drew's Mac mini OpenClaw). Vercel function posts to Watson; Watson sends iMessage via Blue Bubbles. No Twilio needed.
3. **Cleaner email (Item 1):** Email with `.ics` attachment.
4. **Billing:** Track hours quietly; raise with Andrew once cumulative time exceeds ~5 hours so Andrew can decide whether to discuss with Drew.

### Implications

- Item 5 architecture is now: `booking-callback.js` → POST to Watson webhook → Blue Bubbles → Drew's iMessage. Open question: how does our Vercel function reach Watson (public URL? Cloudflare tunnel? Tailscale?). Andrew needs to expose a Watson endpoint and share its URL + auth.
- Item 2 will fire on every booking. We'll keep a "HIGH TRAFFIC" subject prefix for 35+ so Drew can filter at a glance, but the body content is the same template.


---

## Item 1 — April cleanup notification + verify 2hr buffer

**Drew asks:**
- When event has 35+ people, send email/text to April (lead cleaner) immediately after booking
- Email tells her the 2hr cleaning window is built in, she needs to do full studio reset, mark her calendar
- Prompt her to **respond to the email** so we know she's seen it ("on our calendar")
- May be late at night (11 PM+)
- **Confirm 35+ bookings always block 2hr afterward**

**Findings in code:**
- Owner notification already exists for 35+: `api/notify-owner.js`, called from `api/booking-callback.js:180`.
- Cleaning buffer block exists at `api/booking-callback.js:159-174` — but:
  - Buffer is **2.5 hours (150 min)**, not 2 hours as Drew said. → Q for Drew.
  - Buffer only fires for **Powdersville**. Taylor's Mill bookings never get a buffer. → Q for Drew (but TM events aren't allowed, so this only matters for 50+ photo/video sessions at TM, which is edge-case).
  - Buffer only fires when `cleaningFee.amount > 0`. Threshold for fee is 50+ on any session, OR 35-49 on event (per `scripts/booking-flow.js:745-757`). So 35+ event = fee + buffer. ✓

**Plan:**
- Add `CLEANER_EMAIL` env var (April's email) and route a separate email to her in `api/notify-owner.js` (or a new `notify-cleaner.js`) when 35+ event triggers.
- Email content: studio location, date/time of session end + 2hr cleaning window, customer name (for context), explicit "please reply to confirm." Include `.ics` calendar attachment so it lands on her calendar with one click.
- Reply-tracking: simplest version is "ask her to reply, Drew/Andrew watch their inbox." Anything more (auto-detect reply, dashboard) would require Gmail webhook or polling — out of scope unless Drew wants it.
- **Verification:** confirm the buffer block is actually being created in production for past 35+ bookings. Check Oct 10 booking specifically (Item 6).

**Files:**
- `api/notify-owner.js` (extend) or new `api/_lib/notify-cleaner.js`
- `api/booking-callback.js` (call new function alongside `notifyOwner`)

**Questions for Drew:**
- 2 hours or 2.5 hours? Code currently blocks 2.5hr (150 min) — was that intentional or an error?
- Does Taylor's Mill need the buffer too? (Currently PV-only; TM only triggers cleaning fee at 50+ photo/video sessions, which is rare.)

**Questions for Andrew:**
- Confirm we want to add `.ics` attachment for one-click calendar add (vs. just text in email body)?
- April's email + phone — Drew said he'd send. Need before deploy.

---

## Item 2 — Owner confirmation email with full booking details (+ optional customer copy + waiver)

**Drew asks:**
- Owner confirmation email currently only shows intake form fields. Want EVERY field, every add-on with specifics, the waiver they signed.
- Could send to customer too — fine either way.
- Customer should get the waiver "so they have it in their documents."
- Both PV and TM.

**Findings in code:**
- `api/notify-owner.js` currently includes only: name, email, phone, location, datetime, participants, appointment ID, customer note. Misses: intake form fields (business, IG, etc.), add-ons, signed waiver.
- Acuity appointment **notes** already include all add-on detail via `buildAppointmentNotes()` in `api/_lib/acuity.js:247`. So the data exists in `bookingState`; we just need to render it for Drew (and optionally customer).
- Currently no customer email goes out from us — Acuity sends its own confirmation, which has different formatting and no waiver.

**Plan:**
- Rewrite `notify-owner.js` body to include:
  - Contact (name, email, phone)
  - Location, datetime, duration, session type
  - **All intake form fields** (business name, # participants, IG, event description, food/drinks toggle, etc. — pulled from `bookingState.intake` and event-specific fields)
  - **All add-ons with specifics**: backdrop colors (named), wall numbers, chair tier, table count, lighting/TV/PA toggles
  - Cleaning fee status
  - Waiver: name signed, timestamp, full waiver text inline
  - Pricing breakdown (session + add-ons + cleaning fee = total)
  - Acuity appointment ID + link
- Send to Drew always. Optionally CC the customer (controlled by env var `SEND_CUSTOMER_COPY=true` or always-on per Drew's note).
- For customer copy: same content but reframed as "Your booking confirmation" with waiver clearly labeled "Waiver you signed."
- This replaces the current 35+-only owner email with an **every-booking** owner email. The 35+ "high traffic" alert can either stay separate (loud subject line) or fold in as a flag at top.

**Files:**
- `api/notify-owner.js` (major rewrite)
- `api/booking-callback.js:180` (remove the `>= 35` gate, send for every booking)

**Questions for Drew:**
- Send the customer the full email too? (His text says yes, just confirming.)
- Keep the separate "HIGH TRAFFIC" subject prefix for 35+, or just one unified email with a flag in the body?

**Questions for Andrew:**
- This makes Drew's inbox much busier (every booking, not just 35+). Confirm that's the intent, or do we want a daily digest option?

---

## Item 3 — Backdrop colors and add-on specifics in notification

**Drew asks:**
- When customer picks a backdrop, the notification doesn't say which color.
- Same for rolling walls (which wall?), etc. Want exact items per add-on.

**Findings:**
- This is **already collected in `bookingState`** and stored in Acuity appointment notes via `buildAppointmentNotes()`. Just not surfaced in Drew's email.
- This is fully solved by Item 2's rewrite — no separate work needed.

**Plan:** Bundle into Item 2.

---

## Item 4 — Add 3 videos to "There's a Video for That" page

**Drew asks:** Storage building, chair rental, lighting rental videos. They're the 2nd/3rd/4th videos in PV confirmation email — already on YouTube.

**Findings:**
- Page is `theresavideoforthat.html`, video array at line 64.
- We already have a "TV Rental Info" video (id `tmEKyLCDBI4`) and "Table Rental Info" (id `_Vb43CXxN0U`). Adding 3 more is just appending to the array.

**Plan:**
- Append 3 entries to the `videos` array with appropriate `tags` for search.
- Need YouTube video IDs from Drew (or from PV confirmation email template).

**Files:** `theresavideoforthat.html` (line ~64-80, append entries)

**Questions for Drew:**
- Paste the 3 YouTube links here? Or grant access to PV Acuity confirmation email template so we can pull them?

---

## Item 5 — Personal SMS to Drew on big bookings

**Drew asks:**
- Text Drew on: 35+ event OR 3+ hour shoot
- Mentions Anvil bot ("watts and himself") possibly handling via Square integration.

**Findings:**
- No SMS provider integrated in this codebase.
- Drew's Anvil bot (`co.entrpy.anvil` on `anvil.local`) is Andrew's separate system — possible, but lives outside this repo.
- Simplest in-repo option: Twilio. Cost ~$0.01/SMS, $1/mo phone number.

**Plan (sketch — needs discussion):**
- **Option A:** Add Twilio to this repo. New env vars (`TWILIO_*`), new `api/_lib/notify-sms.js`. Send when participants ≥ 35 OR session duration ≥ 180 min.
- **Option B:** Have `notify-owner` POST to Anvil's webhook; Anvil handles SMS via whatever it already has wired up. Keeps SMS infrastructure in one place.
- Lean: Option B if Anvil already has SMS, otherwise Option A.

**Files:** `api/_lib/notify-sms.js` (new), `api/booking-callback.js` (add call), `api/notify-owner.js` (or merge)

**Questions for Drew:**
- "3+ hour shoot" — does this mean photo/video sessions only, or any 3+ hour booking (including events)?

**Questions for Andrew:**
- Does Anvil have SMS capability we can hit? Or should we set up Twilio in this repo?
- Drew's phone number for these alerts?

---

## Item 6 — Verify Oct 10 booking got cleaning fee + 2hr buffer

**Drew asks:** Recent Oct 10 booking, ~35+ people event. He thinks fee wasn't applied. Verify, also check buffer.

**Plan:**
- Pull the appointment from Acuity API (read-only) — search for Oct 10 bookings.
- Inspect: participants count, event flag, cleaning fee in price/notes, presence of adjacent buffer block on the calendar.
- Cross-reference against our cleaning-fee logic to confirm.
- If fee wasn't applied: was it pre- or post- the 2026-04-03 deploy that auto-charged at 35+? (Commit `56a3050`.) If pre-deploy, expected; if post, bug.
- Report findings + remediation back to Drew.

**Files:** investigation only, possibly `client/escalations.md` if remediation needed.

**Questions for Andrew:**
- OK to pull Acuity bookings in production read-only mode for this audit?

---

## Item 7 — Audit "physical liability waiver" language

**Drew asks:** Make sure no copy anywhere says they need to physically sign a waiver in person.

**Findings (preliminary grep):**
- `book-powdersville.html:178` and `book-taylors-mill.html:171`: "I agree to sign the liability waiver and accept responsibility..." — this could be read either way (digital sign happening now, OR commits to a future physical waiver). Worth tightening to "I agree to the liability waiver below" or similar.
- Need to grep `faq.html`, all booking pages, and waiver content for "physical," "in person," "in studio," "sign at" etc.

**Plan:**
- Full audit grep across `*.html` and `scripts/*.js` for: "physical waiver," "physically sign," "sign in person," "at the studio," "upon arrival" + waiver context.
- Tighten any ambiguous wording to make clear the digital signature IS the waiver.
- Report back what was found before changing copy (Drew said he's "fairly certain" nothing's there — I want to confirm).

**Files:** TBD after audit.

**Questions:** None for Drew until audit finds something.

---

## Open Questions Summary

### For Andrew (via AskUserQuestion)
1. Cleaner email setup: include `.ics` calendar attachment, or just text body?
2. Item 2 rewrite makes Drew's inbox much busier (every booking, not just 35+). Confirm that's intent?
3. Item 5: does Anvil already have SMS, or should we add Twilio to this repo?
4. OK to read-only query Acuity in production for the Oct 10 audit (Item 6)?
5. Billing — these are post-delivery requests. Are they free polish, billable, or to be discussed with Drew?

### For Drew (copy-paste)
*(Will compose after Andrew's answers refine the plan.)*

---

## Implementation order (proposed)

1. **Item 7 (audit) + Item 6 (Oct 10 verify)** — investigation, fast, no risk. Report findings.
2. **Item 4 (3 videos)** — trivial once we have YouTube IDs.
3. **Item 2 + 3 (full notification email)** — the biggest piece, but contained to `notify-owner.js`. Test with sandbox booking.
4. **Item 1 (April cleanup notification)** — depends on April's contact info from Drew. Builds on Item 2 patterns.
5. **Item 5 (SMS)** — last, biggest unknown (Anvil vs Twilio).

Each step gets its own commit + entry in `client/revision-status.md` under "Feedback Round 8 (2026-05-05)."
