# Drew email — 50+ approval language + FAQ additions + accounts green light (verbatim)

- **Source:** Reply on thread `19ed260797a3f02c` ("Re: WhiteWall dashboard revisions"), work mailbox (andrew@entrpy.co).
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Thu, 25 Jun 2026 11:27:40 -0400
- **msgid:** `<407B9951-E42F-4CF8-B5D7-4833C635A170@entrpy.co>`
- **In reply to:** Pip's 2026-06-25 reply (msg `19eff5e2`) answering the cleaning-fee cycle.
- **Repo:** white-wall-mockup (booking site copy + FAQ) + V3 accounts (architecture, Andrew). Foreman cycle #2.

---

## Verbatim message body

Great work. In response to question number one, let's change it to be this logic:

An event with 50+ people by default gets approval. You are good to go. The WhiteWall team reserves the right to contact you and ask for additional details regarding your session. I don't want anything in the entire booking process to be contingent upon internal team approval or review. Everything is automatically approved by default, but at 50 people or more, we reserve the right to contact you and seek additional details to make sure that we are still going to be a good fit, even though by default they still are allowed. Fix the language somehow to fix that problem.

In response to question number two, definitely go ahead and add that question and answer into the frequently asked questions.

Also add in the frequently asked questions some information about our new set up crew add-on. Use your own best judgment for phrasing the question and then giving the answer.

We pretty much need to use this as a teaching point about how the studio is self-service and we try to make the pricing affordable, so we don't have that as a default option. If you would like to pay additional for our team to go in and reset everything and then clean up everything for you, we can. You already have the answers and everything about this from our policy on the add-on, so just add another question there and teach them everything they can need to know about that subject in totality.

For the whole login account process update you just gave me, all this sounds great. What do you need exactly from me? Because all of this sounds incredible, and I say we go full steam ahead, but I also understand if you need information from me. Just let me know what you need, and let's get this launched and live as fast as possible. Especially with the new checkout process, add-ons come directly after you book your exact time and date and duration after you select event or photo/video session.

---

## Triage

**Three threads in one email:**

1. **50+ event-approval language (change-request, fast path).** New logic: 50+ events are AUTOMATICALLY approved by default ("you are good to go"). Nothing in the booking process may be contingent on internal team approval/review. WhiteWall only RESERVES THE RIGHT to contact the customer for additional details to confirm fit, but the booking is allowed by default regardless. Remove the "require prior approval / if not approved you receive a full refund" framing. Locations: `terms.html` (the "Events with 50 or more attendees require prior approval... full refund" clause), `faq.html` (the 50-guest approval Q&A), and any 50+ warning popup in `scripts/booking-flow.js` if it implies approval contingency. Ship-now copy change, no money/architecture/customer-send. Owner dictated exact intent (same posture as the cleaning-fee round).

2. **FAQ additions (change-request, fast path).** (a) Add the 35+ mandatory cleaning-fee Q&A to `faq.html`. (b) Add a NEW FAQ Q&A teaching the **Studio Setup Crew** add-on. Drew's framing: studio is self-service and priced affordably, so reset/cleanup is NOT a default; customers can pay extra ($750) for the team to set up, reset, and clean up. My judgment on phrasing; pull the substance from the existing `setup-crew` add-on copy in `scripts/booking-config.js` (events-only, $750, structured placement items). Ship-now.

3. **Accounts / V3 foundation (ESCALATE to Andrew).** Drew greenlit "full steam ahead" on the login/account process and the new checkout, and asks "what do you need exactly from me?" This is V3 items 2/6/7 — the customer-account + bookings/balance datastore + scheduler, which all hinge on the ONE architecture decision Andrew owns. What's-needed-from-Drew depends on that decision, so I cannot answer his question accurately until Andrew sets the foundation. He also dropped a checkout-sequencing requirement: **add-ons come directly after date/time/duration + the event-vs-photo/video selection** (informs the V3 checkout flow). Escalate to Andrew (architecture trigger); hold the detailed accounts answer to Drew until Andrew responds, but keep Drew warm.

**Action:** Build one PR (worker/50plus-and-faq) on white-wall-mockup covering items 1 + 2; verify + ship via Vercel. Reply to Drew confirming the copy work is live and that I will come right back with the exact accounts checklist. Escalate item 3 to Andrew by iMessage.
