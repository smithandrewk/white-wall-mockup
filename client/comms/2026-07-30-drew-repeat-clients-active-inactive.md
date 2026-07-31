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

---

## Follow-up 1 — 2026-07-30 23:55 ET (msg `19fb650398452ef4`, thread `19fb2c5108d1cb55`, from WhiteWall Studios <contact@whitewallstudios.co>) — VERBATIM

> Pip, This is incredible. You did a great job here. For the Bookings tab, let's have the exact same logic with the inactive options, but we also will have an option that's new. The options are going to be:
> New
> Active Repeat
> Inactive
> Also, in the lead source and session purpose, let's make sure that those charts are the pie charts. I like that idea a lot, where you can hover over it and it gives you the data instead of the horizontal bar chart.
>
>  In the Repeat Clients tab, for all the toggle options, I want the client list to order the columns as follows:
> clients
> repeat?
> months since most recent booking
> first visit
> last visit
> On The Brink?
> LTV
> Instagram
> bookings
>  and I want all the client list to be in the exact same position as normal. When I toggle from total to active and inactive, all the columns should stay in the exact same spot. They shouldn't slide around left to right.
>
> Lastly, I want a section underneath the velocity bar chart named "On the Brink". This section should have a couple cards of data that are analyzed monthly. It is pulling data from our active repeat clients. That tells you how many clients we have that are on the brink of transitioning to inactive. "On the Brink" is defined by whether they don't book in the next 45 days, then they will transition to inactive.
>
> I would like it to be a very similar client list again, where you display all the ones that are on the brink. It doesn't matter how many clients there are. Hopefully it's not many at all, but display all the exact same information that you have in the chart below. Highlight these with a light red color for every single one of them, and then we could see exactly which clients are on the brink and how many days until transition. That would be a column as well.
>
> The On The Brink column within the actual repeat clients list will either say the word "no" if they're not on the brink, or it will say the amount of days until they transition. It's just either "no" or a certain amount of days.
>
>  also, within the Repeat Clients tab, I love the bar chart you have there for each month, where I can see the total amount of Active Repeat clients. I can also see the amount gained and the amount lapsed.
>
> What I want you to do is find what the averages are and put a horizontal line going through all the bars. If it's underneath the average, make the bar a light red. If it's at or over the average, make the bar a light green. I don't know what that average is going to be. Are we, on average, losing more repeat customers faster than we are gaining? If so, how much are we losing on average, or the inverse: maybe we're actually gaining more Active Repeat customers than we are losing Active Repeat customers? Whatever it is, quantify that number, average it over the past six months because we're doing a six-month analysis on the customers, not three months, and then put that horizontal line.
>
> Also, to hover over any of these bars, see the same information. I also want to see a net number when I hover over it. That's one thing you don't have in the data. Whenever I hover over it, you tell me how much we gained and how many lapsed, but also tell me the sum, negative or positive. The bar color will be dependent on its performance in comparison to the average month, but the hovered bubble text, whenever I hover over it, will be a color dependent on if it was positive or negative.
>
> For example, in June 2025, we were negative about 11 clients. In theory, if June 2025 was still over the average, the bar itself would be a light green, but the bubble hovering over it would be a light red. Cumulatively, the bubble math says we were at a loss of 11 Active Repeat customers, but the bar may, in theory, be above the average for Active Repeat customers. I'm not sure if that hypothetical is correct or not, but that paints the image that I'm trying to do.

## Triage / interpretation (Follow-up 1)

Praise on DREW-36 + SIX distinct build asks. All wws-dashboard, read-only, Drew's product/design call → pre-authorized, NO escalation. Split across two tickets:

**DREW-34 (the open chart pick — RESOLVED):**
1. Lead Source + Session Purpose: swap the horizontal bar chart for a **pie/donut** with hover tooltip (his exact pick = option 1 I recommended). Both tabs.

**DREW-37 (NEW — Repeat Clients v2 + Bookings toggle):**
2. **Bookings tab 3-way toggle:** New / Active Repeat / Inactive (same logic as the Repeat Clients toggle, + a "New" = first-time/non-repeat client bucket). Client-side filter over loaded rows; classify each booking by its client's current class. (Adding an "All" default so the unfiltered view is preserved — flag it.)
3. **Repeat Clients client list — exact column order, all toggle views:** Client · Repeat? · Months since most recent booking · First visit · Last visit · On the Brink? · LTV · Instagram · Bookings. Columns must NOT slide when toggling Total/Active/Inactive → dedicated `table-fixed` + colgroup table (same fix pattern as DREW-33).
4. **"On the Brink" section under the velocity chart:** cards (count on the brink + share of active base) analyzed monthly from active repeat clients. On the brink = active repeat whose 6-month active window expires within the next **45 days** (no upcoming booking to reset it). Plus a client list of ALL on-the-brink clients, same columns, every row highlighted light red, + a "Days until transition" column.
5. **"On the Brink?" column** in the main repeat list: "No" or the number of days until transition.
6. **Velocity bar chart upgrades:** horizontal average line = avg ARC over the past 6 months; bars below avg → light red, at/above → light green. Tooltip adds a signed **net** number (gained − lapsed); the hovered net text is colored by its sign (green positive / red negative) INDEPENDENT of the bar color (which keys off ARC-vs-average). Also quantify the avg monthly net over 6 months (are we net gaining or losing). Per his June-2025 example: bar = ARC level vs its 6-mo average; bubble = that month's net flow.

## Scope / gates
- All wws-dashboard, read-only against Acuity/Square/QBO. No money, architecture, legal, or customer-scale → pre-authorized converse + build, NO escalation.
- Build-now (concrete spec, no open questions that only Drew holds). One dashboard PR covering DREW-34 + DREW-37 (they share charts.tsx).

## Replies (Follow-up 1)
- Ack `19fb657e3fd3004f` (read-back of all 6 items + the June-2025 bar-vs-bubble model, before build).
- Confirm live `19fb66c8a04a4d85` (SHIPPED + prod-verified, 3 prod screenshots: repeat-clients / lead-source donut / bookings filtered to Active repeat).

## Shipped (Follow-up 1)
- wws-dashboard **PR #111** (squash `5a44908`), merged + mini pulled/built/kickstarted, **LIVE on :18794 + prod-verified**.
- DREW-34 (pie) → done. DREW-37 (bookings toggle + repeat-clients v2 + On the Brink + velocity avg line) → done. revision-status **Round 74**.
- Reconciled vs Postgres: 363 repeat = 112 active + 251 inactive; **27 on the brink** (24% of active, soonest 5d); 6-mo avg ARC = 105; net gaining ~3.8/mo.
- Verify: npm run build + 192 unit tests (+7 core) + live-DB Playwright light+dark @1440+390 (0 overflow; columns hold position across Total/Active/Inactive; pie renders; bookings filter 500→293).
- Judgment calls flagged to Drew: added an "All" default on the Bookings Client toggle (kept the full list); "Months since" reads "Upcoming" for clients with a future session; velocity avg line is over the past 6 months (105). All offered for tuning.
