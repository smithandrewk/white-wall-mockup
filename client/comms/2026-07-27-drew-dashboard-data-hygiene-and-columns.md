# Drew — Dashboard data hygiene + client columns + stats default

- **Source:** Gmail thread `19fa478568fc46a2` ("WhiteWall Dashboard Revisions"), account `andrew@entrpy.co`
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 27 Jul 2026 17:09:53 -0400
- **msgid:** `19fa569db8e7fb7a`
- **Classification:** change-request (dashboard, batch) — plus a Phase-1 ship-ack (already live)
- **Ticket:** DREW-15 (UI: stats default + clients repeat column + drop redundant column) / DREW-16 (data exclusion + client consolidation)

## Verbatim

> Also, before I forget, can you do a couple things in the dashboard real quick?
> Whenever I log in to the website for the first time, the stats tab is already open. Can we default it to be collapsed?
> Whenever I click on the clients tab, I would love to see a column on the lifetime clients list that displays if they are a repeat client or not, just like we have in the bookings tab.
> Whenever I go to the repeat visits toggle, we don't need to have that column anymore on the repeat clients list because they're all inherently repeat clients.
> Across the entire dashboard as a whole, delete any display of Andrew Smith sessions ever made.
> Delete any display of Lucas Williams sessions booked before January 1, 2026. He has multiple different emails, so if any variation of Lucas Williams is booked before January 1, 2026, do not display that data.
> Same thing for Wesley Cannon and Nick Riddle. After January 1, 2026, you can display all their data and all their finances and everything. That's totally fine, but anything before then, even if they paid or not, don't display that data anywhere.
> More specifically, when I click on the clients tab, Lucas Williams is our first client with 100 bookings. I suspect he's still going to be our number one client, but I only want to show data starting January 1, 2026.
> When you look at that client's lifetime list, you'll notice that Lucas is in there twice in the top four people. I couldn't tell you why. It's probably an email thing or something, but he's in first place with 100 bookings, with his last visit being January 2026. He's also in fourth place with 39 bookings, with his last visit being May 2026. I'm pretty sure he's on here even more, and probably something very similar with Nick Riddle and Wesley Cannon/West Cannon. Just do what you need to do to consolidate the data between those.
> If it's Drew Shahoud, delete it all together. I'm the owner. We don't  phase 2, that sounds great. You have crushed it. Thanks, pip. Let me know your thoughts on all the points above, and then whenever phase one is done need stats on myself.
> Same with Andrew Smith and Max Huggins. We don't need any of the data or anything from them. They shouldn't be included in any of our lists.
>
>
> Okay back to you email. This is my response now.
>  phase 1: You absolutely crushed it. Go ahead and get all that done. That scope is perfect, and I'll take a look at it, and we can revise from there. That sounds perfect. It should look and feel identical to the website's booking paths

## Triage

Dictated + partly jumbled (a Phase-1 ack got spliced mid-list). The Phase-1 line ("you crushed it, go ahead") confirms the ALREADY-SHIPPED Session Builder (DREW-14, live) — **no action, do not rebuild.**

The NEW actionable work is all **wws-dashboard** display-layer:

**UI (DREW-15):**
1. Stats/overview tab **default collapsed** on first login (currently opens expanded).
2. **Repeat?** column on the Clients lifetime list, same Repeat/New badge as the bookings table (DREW-13).
3. On the "repeat visits" toggle/filter view, **drop** that new column (redundant — everyone shown is a repeat).

**Data exclusion + consolidation (DREW-16):**
4. Exclude **Andrew Smith**, **Max Huggins**, **Drew Shahoud** from ALL dashboard lists/metrics (staff + owner; all dates).
5. Exclude **Lucas Williams**, **Wesley Cannon** (aka "West Cannon"), **Nick Riddle** data booked **before 2026-01-01** — any email variation, paid or not. On/after 2026-01-01 shows normally.
6. **Consolidate** duplicate client identities (same person across multiple emails collapses to one client row — Lucas appears ≥2x: #1 with 100 bookings, #4 with 39).

## Gate check (§4)
- No money spent, no architecture change, no legal/policy text, no customer-scale send.
- **READ-ONLY upstream invariant honored:** this is display-layer filtering/grouping only — nothing is written to Acuity/Square/QBO. We are not deleting source data, only hiding/consolidating it in the dashboard's own read path.
- Drew owns WWS data/policy → NOT gated on Andrew. Ship.
- ⚠️ Silently-wrong-output watch: excluding rows changes displayed counts/financials. This is legitimate (owner/staff/pre-2026 test data inflating client metrics) but must be applied CONSISTENTLY across every list + KPI so no view contradicts another.
