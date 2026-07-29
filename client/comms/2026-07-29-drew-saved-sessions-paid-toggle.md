# Drew — Session Builder "Saved Sessions" Paid/Unpaid toggle + card pill (2026-07-29)

- **Source:** Gmail (work mailbox `andrew@entrpy.co`), thread `19fa478568fc46a2` "WhiteWall Dashboard Revisions"
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- **Date:** Wed, 29 Jul 2026 14:16:39 -0400
- **msgid:** `19faf17fe91bf423`
- **Classification:** change-request (dashboard, read-only derived) + Watson follow-up (see separate watson comms file)
- Crossed pip's 11:48 confirmation of DREW-24/25/26 (locked-link three issues). Drew: "Session builder works absolutely perfectly. We tested it out."

## Verbatim (this email carried TWO topics — full text kept here; Watson portion also filed in `2026-07-29-drew-watson-agent-connect.md`)

> Hey pip
> Session builder works absolutely perfectly. We tested it out. Last revision there:
> In the Session Builder, where it says "Saved Sessions," I would love to have a toggle. The toggle switches between Unpaid and Paid.
> If it's Unpaid, just make it a light red color.
> If it's Paid, make it a light green color.
> If I click on the Paid toggle, it displays all the custom-built sessions that we have manually sent to people where they have actually paid and booked those exact sessions. Of course, they'll also display in the Bookings tab as well, just like a normal session, regardless of what it is. It's just a way for me to easily see, of the custom sessions we send out, how many of them have actually been paid specifically to the links that we've sent out. The other one is Unpaid, and that's just pretty much exactly what you have right now. On the actual cards of the sessions themselves, put a red pill indicator there as well. You can put it right underneath the dollar amount and the event type. It can be a little red pill that says "Unpaid" or a green pill that says "Paid.”
>
> Watson:
>  honestly, I just want Watson to have full access to the dashboard and everything in it. Nothing needs to be automated through Watson, and he doesn't need to automatically do stuff for me. He just follows instructions.
>
> If I asked him to check the dashboard for who our top five clients are, he can do that by going to the dashboard and navigating around the software to find out that answer. If I tell him to build a session that's a one-day photo event on the 18th starting at 3 p.m. and it's a 3-hour session, then he goes ahead and does it. I can tell him all the instructions through iMessage, like I text him normally. I already do that with him every single day, but I just want him to have access to the dashboard and be able to use it.
>
> He could theoretically go in there and build a whole session out and then save it, and then I could say, "Hey, send me the link for that specific saved session." He should be able to send that to me, or he should go tell me what the overview data says, or really anything. He can navigate and scroll through the dashboard just like anyone else can. That's all I want. Nothing needs to be automated, and he doesn't need to be doing tasks preemptively or autonomously. It just needs to be almost like an API where he has access to the things in the dashboard, and I can ask him to reference information or do certain tasks within the dashboard itself. That's all I want. We should be able to do this. Go ahead and start the build yourself right now.

## Handling (Foreman)

**Split into two independent items (mixed email; §4 split rule):**

### Item A — Saved Sessions Paid/Unpaid toggle (DREW ticket, Foreman ships)
Dashboard-only, READ-ONLY derived. A saved session is **Paid** when a real customer has opened its
locked link and completed booking/payment: the booking site stamps `... (draft <draftId>)` into the
Acuity appointment notes (`create-checkout.js:1414-1415`, the DREW-21 "draft id = future KPI hook"),
which the Acuity ingest lands in `booking.notes`. So **Paid = a visible (non-cancelled, non-staging)
`v_booking` row whose notes reference this draft's id**. No money moves, no upstream write → not the
money gate, no staging dry-run; dashboard build + tests + live-DB render is the verify.
- Toggle in the Saved sessions header: **Unpaid** (light red when active) / **Paid** (light green when active). Default = Unpaid (matches "exactly what you have right now").
- Unpaid view = saved sessions with no paid booking; Paid view = saved sessions that have been paid.
- Per-card pill under the price + type: red **Unpaid** / green **Paid**.

### Item B — Watson full dashboard access (ESCALATED, Andrew)
Clarified scope from Drew: Watson (his personal AI agent) gets full read + operate access to the
dashboard, driven by his iMessage instructions — navigate, read data, build/save sessions, mint links,
check availability. **No autonomy, no preemptive tasks, "almost like an API."** He says "start the build
yourself right now." Per the recreation ladder ([[drew-agent-recreation-ladder]]) connecting his agent to
operate the dashboard **routes to Andrew** — Foreman does NOT start this build. Existing escalation
(`esc-drew-wants-to-connect-his-watson-agent-...`, reason architecture) stays OPEN and is enriched with
this clarified scope. Reply to Drew frames it as "that goes through Andrew" without naming any policy and
without asserting the outcome.
