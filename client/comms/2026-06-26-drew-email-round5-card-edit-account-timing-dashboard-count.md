# Drew email — round 5: card-on-file edit, account-creation timing, dashboard count bug, repeat list (verbatim)

- **Source:** thread `19ed260797a3f02c`, work mailbox (andrew@entrpy.co).
- **From:** Drew Shahoud <drew@entrpy.co> | **Date:** Fri, 26 Jun 2026 11:08:12 -0400
- **msgid:** `<207ADDDF-892A-4BD2-8017-AE6CBE5DFC6C@entrpy.co>`

---

## Verbatim message body

Hey Pip,

All this looks great. Thanks for making those changes. I just edited the account, and it's great. There's no way for me to edit the card on file, so can you make an option for where I can enter my card information and save that as my card on file? This should be for all people that have an account so they can edit that information as well. 

Also, when you're going through the booking process, it doesn't ever pop up for you to actually create an account or anything. We just tested all the way through to the point where I just need to submit my payment information, and it never interrupted me for setting up an account. That may be by design, so I'll yield to you here.

I think the initial thought was that as soon as they put in all their information, we would ask them to create an account to continue, but you may have that setup right after they put in their payment information or something. I'm not really sure what the strategy there is, and I'm not even asserting my opinion specifically, but I think you get the intention that I'm trying to go for. I want to get their account information saved as soon as possible.

Let me know what you think about that and then what you think the best solution is. 

Lastly right now on the dashboard, whenever I click on Clients, I love how it gives it three tabs between:
	•	Lifetime Clients
	•	Clients with an Account
	•	Repeat Visits
That's all amazing but whenever I have Clients Lifetime, it only says there's 500 bookings. It only says there's 500 with bookings. That information is incorrect. I had Watson audit the entire thing and this is what he said. I'll just copy and paste his exact language.

Prompt I gave him:  "in the dashboard that we are making custom, for some reason it only says we have 500 bookings and 358 repeat clients. Can you audit that to make sure that's actually accurate?"

Watson:
	"I audited it against the live/source data. The dashboard is definitely wrong if it is claiming 500 lifetime clients/bookings.

Current audit:

- Acuity, non-cancelled bookings, production calendars only: 2,503 bookings
- Acuity unique clients with bookings: 1,197
- Acuity repeat clients: 352

Square/revenue-side audit:

- Square identified booking payments: 2,122
- Square unique booking customers: 1,333
- Square repeat customers: 307

So the dashboard’s “500 with bookings” is not accurate under either Acuity or Square. The 358 repeat number is close to the Acuity repeat-client count, but still slightly off depending on dedupe/cancellation rules.

Most likely issue: the custom dashboard is only pulling/displaying a capped subset — probably a 500-record limit/page cap — instead of all lifetime records.
His answer: I audited it against the live/source data. The dashboard is definitely wrong if it is claiming 500 lifetime clients/bookings.

Current audit:

- Acuity, non-cancelled bookings, production calendars only: 2,503 bookings
- Acuity unique clients with bookings: 1,197
- Acuity repeat clients: 352

Square/revenue-side audit:

- Square identified booking payments: 2,122
- Square unique booking customers: 1,333
- Square repeat customers: 307

So the dashboard’s “500 with bookings” is not accurate under either Acuity or Square. The 358 repeat number is close to the Acuity repeat-client count, but still slightly off depending on dedupe/cancellation rules.

Most likely issue: the custom dashboard is only pulling/displaying a capped subset — probably a 500-record limit/page cap — instead of all lifetime records.”

Also, whenever I click on the repeat visits, I want to have a list of all the clients there, just like we have them in the normal clients list, but these are specific to repeat clients.

---

## Triage — 4 items

1. **Card-on-file editing (booking site, build):** account holders need a way to enter/update their saved card from /account. Customer-initiated Square card save (reuse createCardOnFile — saving a card, NOT a charge, so no escalation). For all account holders.
2. **Account-creation timing in booking (CONVERSE — Drew asked my opinion):** today the only account prompt is post-payment on booking-confirmation; he was never interrupted during booking. He wants account info captured ASAP, but explicitly asked for my recommendation before a build. -> Reply with a recommendation; build on his nod.
3. **Dashboard "Clients Life Time" count is WRONG (DATA-DISPLAY bug — FIX):** shows 500; Watson audited the real numbers (Acuity 2,503 non-cancelled bookings / 1,197 unique clients / 352 repeat). **ROOT CAUSE FOUND:** not missing data — the local wws DB has 2,774 bookings / 1,250 clients (full ingest). `clientRowsQuery` (lib/data/queries.ts:366) defaults to `limit ?? 500` and the page shows `rows.length` (app/clients/page.tsx:24) -> the list + count cap at 500. Fix: true COUNT(*) for the headline + load the full list (raise/remove the cap). Repeat count (~358 vs ~352) is close; will reconcile.
4. **Repeat Visits tab -> client list (dashboard, build):** the Repeat Visits view should show a list of all repeat clients, like the Clients list but filtered to is_repeat.

**Plan:** dashboard PR (items 3 + 4: count fix + repeat client list); booking-site PR (item 1: card-on-file edit on /account). Item 2 = reply with recommendation, hold build for Drew's confirm. None hit money/architecture/legal/customer-scale (item 1 saves a card, doesn't charge) -> build + ship autonomously.
