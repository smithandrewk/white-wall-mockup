# Drew — audit of every owner-text scenario for WhiteWall bookings

- **Source:** Gmail (work mailbox `andrew@entrpy.co`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- **Thread:** `19fb2c5108d1cb55` ("Whitewall x Watson build")
- **Date:** Thu, 30 Jul 2026 15:04:04 -0400
- **Msg id:** `19fb469c3feae0ad`
- **Classification:** question / audit (leads to possible revision work)

## Verbatim

> Love it.
>
> In the meantime, can you take a look at all the different scenarios we have texts being sent to me through Watson based on WhiteWall bookings? I know we have them for events and for larger/longer sessions, but I just want you to tell me a scenario where every single instance where I get a text message from Watson about anything being booked or done at WhiteWall would be. I may want to revise them. Provide me a couple examples as well for each instance as to what the text will look like.

## Triage

Read-only audit of the booking-site owner-SMS code (texts arrive on Drew's phone via
his BlueBubbles server on the machine he calls "Watson" = `WATSON_SMS_URL`). No build
this round; deliverable is an accurate, complete enumeration + example renders. He flags
he "may want to revise them" so this is a precursor to a possible revision round.

### The four live owner-text types (traced in code, nothing else fires)

Transport: `api/_lib/notify-sms.js` `sendOwnerSMS()` → BlueBubbles on Watson → Drew's
`OWNER_PHONE`. All four are best-effort (never block a booking).

1. **Large / long single booking alert** — `notifyOwnerSMS` / `buildSmsText`.
   Trigger `shouldNotifyOwnerSMS`: a SINGLE-session booking where **35+ person event**
   OR **any 3+ hour session** (deliberately broad: any 3hr+ shoot texts him even under
   35 people, event or not). Fires on single paid (create-checkout.js:810), single comp
   (313), and the comp-cart representative session (1942). A normal short single session
   under 3hr and under 35 people fires NOTHING (this is the DREW-29 fix).

2. **100%-off (comp) alert** — `notifyOwnerCompSMS` / `buildCompSmsText`. Fires whenever
   a 100%-off code is used, no threshold. Single comp (316) + comp-cart (1944). Fires on
   top of #1 if a comped booking also crosses a threshold (so a comped 4hr event = two
   texts).

3. **Multi-day event booked** — `buildOwnerEventSms` (via `notifyMultidayEvent`,
   create-checkout.js:1618). Fires on a PAID multi-day cart of **>= 2 days**. A paid
   multi-day cart does NOT also fire #1 (it gets this instead, no double text).

4. **Setup crew placements** — `buildCrewSms`, sent back-to-back after #3, ONLY when the
   multi-day event added the Event Setup and Reset Crew add-on.

Built-but-DARK: `buildManualChargeReminderSms` (the item-6/7 40%-balance manual-charge
reminder) has NO caller — the auto-charge scheduler is not armed, so it never texts.

## Response

Reply sent (`19fb46edabf4d314`): enumerated all four scenarios
with two example texts each, the exact trigger for each, the current thresholds/quirks he
would tune if revising (35 people, 3 hours, the over-notify breadth, whether normal small
sessions should text at all), and invited his edits. No payment mention. Pre-authorized
converse; no escalation.

---

## Follow-up 1 — Drew's revision picks (format changes, confirm-before-build)

- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- **Date:** Thu, 30 Jul 2026 15:37:51 -0400
- **Msg id:** `19fb488b32351640`
- **Classification:** change-request (format/copy) — but explicitly CONFIRM-FIRST

### Verbatim

> Perfect, thanks for sending this over. I do want to change some things about how the texts are sent to me. Everything is pretty much good. I just want to adjust some stuff. I'll go numerically in the order that you sent them. I want to add two more line items:
> Whether or not it is deliberately an event
> Multi-day event
> Photo/video
> Those are the only three options we offer, so those are the only three options that it should be able to choose from. I want you to also add a line that says whether the cleaners were emailed or not. Not whether you successfully emailed them or not, but whether they needed to be emailed or not. Section looks perfect. Give me the Acuity ID as well, and also tell me if the cleaners were emailed or not. This is literally perfect. I almost want you to pretty much copy the structure of Section 3's text for all the other ones as well, especially Section 1. I love how you line item what each line item is and then you give me the answer. I would like a line item right after the customer's name that says "Session Type", and then you can choose from the three options:
> Photo/video
> Event
> Multi-day event
> I also want you to put the line item "Client Name" and then obviously put the person's name there. I also want you to put the client phone number in there as well. Honestly, as I'm talking this out, let's do that exact same copy and paste formula for Section. Okay, based on your understanding, send me back the four options again. There's nothing to change on the set of crew placements one, so just don't even worry about that one.
>
> give me the exact examples as to how it's going to look for sections one, two, and three with the new revisions that we're going to implement  I'll confirm them, and then we can actually make them reality

### Triage

Change-request but **confirm-first**: Drew wants the reformatted example texts back for
sections 1, 2, 3, will confirm, THEN we build. **No build this round — converse only.**
Requested changes (format/copy only, no threshold changes):

1. Adopt Section 3's labeled line-item structure (`Label: answer`) for ALL scenarios,
   especially Section 1 and 2.
2. Add line items to sections 1 and 2 (and standardize section 3 to match):
   - **Client Name:** <name>
   - **Session Type:** one of exactly {Photo/video, Event, Multi-day event}
   - **Client Phone:** <customer's number>
   - **Cleaners emailed:** whether they NEEDED to be emailed (Yes/No), NOT send success.
   - **Acuity #** (add to section 2; section 1/3 already have it).
3. Section 4 (setup crew) — unchanged, "don't even worry about that one".

Code feasibility (verified, not asserted): phone IS captured (`state.contact.phone` →
`contact.phone`); Session Type derivable (`eventIntent==="yes"`→Event, multi-day cart→
Multi-day event, else Photo/video); Cleaners-needed = `cleaningFeeCents > 0` (the 35+/50+
Powdersville cleaning fee, DREW-29 gate), independent of send success. All three lines are
buildable with no new data plumbing.

### Response

Reply sent (`19fb48d63c671395`): the reformatted examples for sections 1, 2, 3 on a single shared
labeled skeleton, two examples each, with the new Client Name / Session Type / Client Phone /
Cleaners emailed (Yes/No) / Acuity # lines. Defined the two new-line semantics (Session Type
locked to the three options; Cleaners emailed = needed-not-send-success). Asked him to
confirm before build. No payment mention. Pre-authorized converse; no escalation (owner-only
texts, booking-site repo, no money/architecture/legal/scale). DREW-30 stays in_progress.

---

## Follow-up 2 — Drew confirms; build + send samples (SHIPPED + LIVE)

- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- **Date:** Thu, 30 Jul 2026 15:46:41 -0400
- **Msg id:** `19fb490c7e7dfe17`
- **Classification:** approval + change-request (build now) + deliverable (send samples)

### Verbatim

> Flawless. Go ahead and make that all built in now. Send watson a text text for all three options.

### What shipped

Booking-site **PR #109** (squash `890e959`) merged → Vercel prod **Ready** (deploy
`white-wall-mockup-3vj3gmzqq`, aliased to whitewallstudios.co). Reformatted the three
owner texts onto the confirmed labeled skeleton:

- **Section 1** `buildSmsText` — header `[WhiteWall] New booking`; adds Client Name /
  Session Type / Client Phone / Location / Cleaners emailed. People + Use omitted when
  empty. Old `event Nppl booking` / `Nhr shoot booking` reason-header removed.
- **Section 2** `buildCompSmsText` — rewritten from the old prose onto the same skeleton,
  keeping the `100% off code used` header + `Add-ons:` line; now also carries `Total:
  $0.00 (100% off)`, the **Acuity #** (new `appointmentId` arg), and the Cleaners line.
- **Section 3** `buildOwnerEventSms` — adds Client Name / Session Type (`Multi-day event`) /
  Client Phone; `Cleaners emailed ✓` → `Cleaners emailed: Yes|No`.
- Session Type locked to {Photo/video, Event, Multi-day event}; Cleaners emailed = whether
  the booking NEEDED cleaners (hit the fee), not send success; Client Phone formatted
  `(xxx) xxx-xxxx`; money comma-grouped (`$4,173.30`). Section 4 unchanged.

Charge / Acuity / pricing untouched — copy/format change. Verify: `node --check`,
synonymous-language grep sweep, `notify-sms-format.test.js` (9 checks) + full booking-site
suite **35/35**.

### Send-samples deliverable ("Send watson a text for all three options")

Rendered the three sections through the SHIPPED builders and sent them to Drew's phone via
the live Watson / BlueBubbles path (intro + Section 1/2/3). **Correction fired:** the first
Section-1 send showed `Total: $0.00` because the scratch send-harness's crude env parser
mangled a multi-line JSON env var → `acuity.buildSquareLineItems` threw → total fell back
to 0. **Not a prod bug** (isolation + unit tests render `$675.00`). Sent Drew a corrected
Section 1 (`$675.00`) + a one-line note right after. Sections 2 (`$0.00` correct, comp) and
3 (`$4,173.30`) were right first time.

### Response

Confirmed to Drew (`19fb49ffee391c52`, no payment mention): all three built in + live, sent
the three samples to his phone, flagged + corrected the $0.00 preview glitch, recapped the
changes, invited further line tweaks. Pre-authorized converse; no escalation (owner-only
texts, booking-site repo, no money/architecture/legal/scale). **DREW-30 → done.**
