# Drew — Repeat Clients: Active vs Inactive (dashboard build)

- **Source:** Gmail (work mailbox `andrew@entrpy.co`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Thu, 30 Jul 2026 19:16:03 -0400
- **Thread:** 19fb2c5108d1cb55 ("Whitewall x Watson build")
- **Message id:** 19fb55071473e9b0
- **Attachment:** `attachments/2026-07-30-drew-repeat-clients-mockup.png` (screenshot of the current "Clients – With Account" tab)
- **Classification:** change-request (dashboard, big multi-part), Drew's product/design call
- **Ticket:** DREW-36

## Verbatim

> Big build here.
>
> 1) on the Client with account toggle, lets add the same Repeat client columns we have in other areas.
>
> 2) I want to make a new tab on the left under Clients. This tab is to be called Repeat Clients.
> Within repeat clients, I want to define this whole page off of two variations of repeat clients: Active Repeat Clients, and Inactive Repeat Clients.
> So we have dashboard-wide 3 variations.
> 1) repeat clients, which is the sum of active and inactive
> 2) active repeat clients, which is a repeat client that books again within 6 months or less from their last booking
> 3) inactive repeat clients. Who is any client who has booked more than once, but they have more than a 6 month gap between bookings.
>
> I want to have analytics on our active repeat clients. What the LTV of an ARC (active repeat client) what about the LTV of an IRC (inactive repeat client)
> How far in between sessions do each type go?
> What is the velocity of active repeat clients? Is it positive? As in we get more active repeat clients over time, faster than we lose them? Or are active repeat clients transitioning to inactive repeat clients faster than the growth of active repeat clients, etc.
>
> But the rule is 6 months from last session booked.
>
> 3) in the Clients tab, keep the repeat visits toggle still there, but for a lot of these metrics we need to see a quick toggle on them to swap between the two, and then the combined. So they'll have three options. Total, active, inactive. Etc. this is a quick glance at the repeat visits view. But for more in depth analysis, you go to the designated Repeat Clients tab, where you can see all 3 variations of the data (where it applies )
>
> 4) I also don't like heat maps. Replace heat maps with whatever else you think works, or just get id of it all together. Do this site wide.
>
> Audit the repeat client info site wide. Even in the columns, it wont say "repeat client" anymore, it will say Active repeat client, or inactive repeat client.
>
> You get the gist. Two options, 3 views of the data (separate, or combined)
>
> Let it rip.

## Triage / interpretation

Core new concept — **Repeat Client classification** (rule: **6 months from last session booked**):
- **Repeat Client** = any client with >1 booking (sum of active + inactive).
- **Active Repeat Client (ARC)** = a repeat client whose gap to their **last** booking is **<= 6 months** (i.e. their most recent inter-booking gap is within 6 months — they came back within 6 months).
- **Inactive Repeat Client (IRC)** = a repeat client with **> 6 month gap** between bookings (they lapsed).

Interpretation nuance (to state to Drew, cheap to flip): "active" keys off whether their **latest** booking is within 6 months of the one before it — i.e. as of now, are they still in an active repeat cadence. A repeat client goes IRC once their most-recent gap exceeds 6 months. (Alternative reading: gap between last booking and *today* > 6 months = dormant. Will pick the "last inter-booking gap" reading and flag it.)

Items:
1. **Clients – With Account** toggle: add the same repeat-client columns present in other areas.
2. **New left-nav tab "Repeat Clients"** under Clients. Page built around ARC vs IRC, with the 3 variations (Total / Active / Inactive). Analytics:
   - LTV of ARC vs LTV of IRC
   - Avg gap between sessions per type ("how far in between sessions")
   - **Velocity of ARC**: net flow — are we gaining ARCs faster than losing them / are ARCs transitioning to IRC faster than ARC growth (cohort/flow over time).
3. **Clients tab**: keep the Repeat visits toggle, but add a quick **3-way toggle (Total / Active / Inactive)** on the metrics for a quick-glance swap; deep analysis lives in the Repeat Clients tab.
4. **Remove heat maps site-wide** — replace with something better or drop entirely (Foreman's judgment).
- **Site-wide audit:** wherever a client/column is labeled "Repeat client", relabel to "Active repeat client" / "Inactive repeat client".

## Scope / gates
- All **wws-dashboard**, read-only against upstreams. No money, no architecture change, no legal, no customer-scale. Drew's product/design call → **pre-authorized, no escalation.**
- "Let it rip" = **build-now** (not converse-first). Ship one dashboard PR.
- NOTE: item 4 (heat maps) is **distinct** from DREW-34 (the HBars horizontal-bar chart on Lead Source / Session Purpose, still open awaiting Drew's pick). Heat maps != horizontal bars. Keep DREW-34 open.

## Replies
- Ack `19fb554289aa1893` (confirmed ARC/IRC read + build plan, before build).
- Confirm live `19fb56f0da8c0e91` (shipped + prod-verified, 2 prod screenshots attached).

## Shipped
- wws-dashboard PR #110 (squash `b74b2c7`), merged + mini pulled/built/kickstarted, LIVE on :18794 + prod-verified.
- Reconciled: repeat 363 = 112 active (ARC) + 251 inactive (IRC); ARC avg LTV $899 vs IRC $483; velocity +6 over last 3 months.
- Ticket DREW-36 → done. revision-status Round 73.
- Definition built = recency of last booking (incl. upcoming), 6-month rule — matches the app-wide repeat count. Bookings-ledger per-booking Repeat tag left as-is (flagged, offered to switch).
