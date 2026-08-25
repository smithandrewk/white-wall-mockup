# Drew — crew mechanics: build a fake booking + sample all the pieces to test (Round 120)

- **Source:** Gmail, account pip@entrpy.co
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Tue, 25 Aug 2026 13:03:17 -0400
- **Thread:** 1a036c426017a325
- **Msg id:** 1a039e083faae174
- **In reply to:** Foreman Round-119 reply `1a039d7cec2e373e`

## Verbatim

> 1) great!
>
> 2) great. Let me know when does.
>
> 3) send me a sample email as to what April receives whenever this setup and reset crew is added on. I want to see what she sees. Also, send me a sample action required owner email that I get with a direct link. We can make a fake one that I can actually view, just so I can go through the process and test it out. Same with that booking detail page. I want to see what it looks like and test it out. Let's just make a fake one and try it all out. Setting up the email draft that instantly pops up in my email drafts for me to review and then manually hit send? With this fake one that we're about to build, put one of those email drafts in there as well for me to test out. Essentially, let's make a fake one and test everything out so I can see what the end product is of each of those pieces:
> my alert email
> April's alert email
> the draft email you send and get ready for me to send to them the client
> the new Booking information tab where I can view everything and add notes

## Triage

Three items, one thread:

1. **"great!"** — acknowledgment of the green-card color fix (DREW-81, shipped Round 119). No action.
2. **"great. Let me know when does [done]."** — the Acuity flagship confirmation/reminder email audit (DREW-77). Keep-warm; still in progress on our side (Administrator access in hand, editing those live per-type templates needs Andrew's eyeball → `esc-drew-77-...` open). No new action beyond continuing that work and reporting back.
3. **NEW REQUEST (DREW-82)** — Drew wants to SEE + TEST the whole crew add-on mechanics end to end against a FAKE booking. Four pieces:
   - his owner "action required" alert email (with a working direct link)
   - April's alert email (what she sees)
   - the client draft email pip prepares for him to review + manually send
   - the new booking detail tab (view everything + add notes)

   Classification: `change-request` (demo/sample deliverable). Fast path — it exercises already-shipped DREW-80 mechanics; the only new build is a self-contained sample/demo booking view. No money, no architecture, no legal, no customer-scale (April's email + the client draft go to DREW, not to April or the customer) → NO escalation.

   Note on the client-draft piece (4e): the CONTENT sample ships now. The "instantly pops into MY email drafts" wiring needs a one-time connection of Drew's own mailbox (already escalated as `esc-item-4e-...`); the sample demonstrates what it will say.

## Resolution (Round 120) — SHIPPED + LIVE, all four pieces delivered

Reply to Drew: msg **`1a039eb3a3e4eb54`** (thread `1a036c426017a325`). DREW-82 → done.

One fake booking underpins all four pieces (Jordan Ellis, SAMPLE-labeled; Flagship 4h event Sat Sep 19; add-ons Event Setup and Reset Crew $750 + All Backdrops $50 + Lighting $125; VISA ••4242; WW-9999).

1. **Booking detail tab (live + testable):** dashboard **PR #153** (merged `dd8725a`, deployed + kickstarted). `getBooking()` serves a self-contained SAMPLE `BookingDetail` for the sentinel id `sample`, so **`https://wws.entrpy.co/bookings/sample`** always renders — full detail page + itemized add-ons + the autosave crew-notes box + an amber "Sample booking — for testing" banner (never counts in totals). Verified live on :18794: page 200, crew-notes POST→200 round-trip (saved note appeared on reload, then reset so Drew starts fresh), agent surface 401 (AGENT_API_KEYS intact — deploy trap avoided). 286 unit tests pass.
2. **Owner "action required" email:** rendered VERBATIM from prod `api/_lib/notify-crew.js` `buildCrewOwnerEmail` with appointmentId `sample` → first-line deep link to the live sample page. Sent inline to Drew.
3. **April's email:** rendered VERBATIM from `buildCrewCleanerEmail`. Sent inline to Drew.
4. **Client draft (4e content):** a representative personalized client email sample, framed as a starting template. **Honest caveat given to Drew:** the auto-into-your-drafts wiring is a one-time connection of his mailbox on our side (Andrew to enable) — tracked under the existing `esc-item-4e-...`; the content sample shipped now.

Also kept item 2 (DREW-77 Acuity flagship confirmation/24h-reminder emails) warm in the reply ("still working through them, will send the what-was-off list").

No escalation raised: sample emails go to DREW (not April / not customers), no money, no architecture, no legal, no customer-scale.
