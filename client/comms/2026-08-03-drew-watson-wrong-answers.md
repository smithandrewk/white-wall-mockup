# Drew — Watson connected but botching dashboard questions (2026-08-03)

Thread: `19fa478568fc46a2` ("WhiteWall Dashboard Revisions"), account `andrew@entrpy.co`.
Classification: **change-request / incident** (agent-API answer fidelity).
Access: PAID window active (through 06:00 reset), armed=ON.

Context: Andrew handed Drew the live Watson API key himself earlier today (his msg
`19fc86c5f46802e9`, 11:19 CDT — Base URL `https://wws.entrpy.co/api/agent/v1/`, the
`watson:` bearer key, "Watson's live and connected"). So the long-open Watson-connect
gate (DREW-28) is resolved on Andrew's side. Watson is now connected. Drew rapid-fire
tested it against the dashboard and it is answering wrong.

---

## Drew inbound — msg `19fc8e3379a5e71a` (Mon 3 Aug 2026 14:29:07 -0400, from `Drew Shahoud <drew@entrpy.co>`)

> Hey Pip,
>
> It looks like he's connected, but he's honestly totally botching the questions I want him to be answering properly. I'm including the screenshots so you can understand what he's going through. Can you take a look at these screenshots and tell me how we can fix this?

Attachments (saved under `attachments/2026-08-03-watson-wrong-answers/`):
- `screenshot-1-overview-projections.png` — Drew's iMessage w/ Watson: today revenue (gross vs net), month-end projection, Aug-16 projection vs average.
- `screenshot-2-yoy-and-brink.png` — year-end projection (Net total YoY chart), "top 3 On The Brink" clients.

### What the screenshots show (verbatim of the failures)

Every miss is the SAME root cause: Watson queries the raw agent API (`/query` = raw SQL)
and **recomputes** figures its own way, instead of returning the numbers the **dashboard
UI actually displays**.

1. **Gross vs net.** Watson: "Revenue made today: $130 gross / $125.93 net." Drew: the
   Overview tab uses NET → shows $126 today, $586 month-to-date. Watson was gross-oriented.
2. **Month-end projection.** Watson did a naive linear run-rate ($585.95/3 days × 31 ≈
   $6,055). Drew: the Overview tab shows a real **projected month = $11,694** and
   **average-month-by-this-point = $9,814** (we're +19.2%, currently behind pace at $586 vs
   ~$977 expected by day 3). Watson should READ those, not recompute.
3. **By-date projection.** For Aug 16 Watson guessed $6,102/$5,121, corrected to
   $5,795/$5,121 only after Drew pushed — the Overview chart already carries both.
4. **Year-end projection.** Watson hand-calculated 2026 ($68,697 actual + $11,694 Aug +
   $9,814/mo Sep-Dec = $119,647). Drew: "you didn't have to calculate it that way — the
   number is displayed in the **bottom right of the Net total, year over year chart** on the
   Overview page." That chart shows **Projected 2026 = $119,648**.
5. **On The Brink.** "Top 3 clients on the brink?" Watson first read it as top clients by
   net revenue (Wesley Cannon $8,399…), then by past value (Jatoya Rector…). Drew: there is
   a specific **Repeat Clients → On The Brink** section, sorted **most-urgent-first** (soonest
   to lapse), 27 clients = 23% of active base. Correct top 3 (per Drew's screenshot):
   Megan Byrne (lapses 2d), Hallie Phillips (4d), Kaitlynn Benton (4d).

---

## Triage / plan

**Root cause (ours):** the agent API (`app/api/agent/v1/`) exposes `query` (raw SQL),
`availability`, `sessions`, and the capabilities catalog — but NOT the dashboard's
*derived/displayed* figures. So Watson reverse-engineers overview net numbers, the
projected-month / average-pace, the YoY projected-year-end, and the On-The-Brink urgency
list — and gets them wrong. The dashboard already computes all of these in its own
`lib/stats/*` + `lib/data/queries.ts` loaders for the UI.

**Fix (ours, ship):** add a read-only agent-API endpoint that returns the SAME computed
figures the UI renders, by REUSING the existing dashboard loader/stat functions (so the
agent's numbers can never drift from the dashboard). Overview (today/MTD net, projected
month, average-month pace, vs-average %, by-date projection), YoY projected-year-end, and
the On-The-Brink list + summary (urgency-sorted). Read-only, wws-dashboard repo, no
money/architecture/legal/scale → no escalation, pre-authorized fast path.

**Fix (Watson's side — Drew's agent, can't reprogram from here):** point Watson at the new
metrics endpoint and tell it to prefer the dashboard's displayed figures over recomputing
from raw SQL. Communicate this to Drew in the reply.

Ticket: DREW-40 (new — distinct from DREW-28 "connect Watson", which Andrew closed by
handing over the key).

---

## Foreman replies

- **Ack** `19fc8e90ba053ca1` (diagnosis + two-part-fix plan; answered his direct question inline).
- **Live confirm** `19fc8f38b800bd91` (part 1 live + the Watson-side instruction to prefer
  `get_metrics`; invited him to re-run the rapid-fire test).

## Outcome — SHIPPED + LIVE ✅

**wws-dashboard PR #113** (squash `474c373`), merged → prod rebuilt + kickstarted →
**LIVE + prod-verified on :18794.** New read-only **`GET /api/agent/v1/metrics`** returns
the dashboard's displayed figures by reusing the exact page loaders (`getGlancePage`,
`getRepeatClients` + `getClients` joined by a new pure `onBrinkList()`), so the agent's
numbers can never drift from the UI. `capabilities` gains `get_metrics` and steers
overview/projection/brink questions to it over `query_data`.

Prod-verified (loopback, real watson key): 401 no key / 200 with key; **every figure
matches Drew's screenshots** — proj month 11694, avg 9814, +19.2%, Aug 16 5795/5121,
ytd 69284, projected 2026 119648, on-the-brink 27 = 23% soonest 2d, top 3 Byrne 2d /
Phillips 4d / Benton 4d. `npm run build` passes; 195 unit tests (3 new for `onBrinkList`).

Ticket **DREW-40 → done**. Revision-status **Round 78**.

**Watson-side piece is Drew's** (his agent — cannot reprogram from here): told him to
instruct Watson to prefer `get_metrics` for these questions. **Open loop = Drew re-testing
Watson** and flagging any remaining wrong number (would fold a new figure into the endpoint).

**Flagged to Andrew (soft, non-blocking):** wws-dashboard prod has uncommitted code drift
already baked into the live build (repo-relocation deploy-path fixes + a campaign-send
`?sync=1` loopback path). Recorded as `esc-wws-dashboard-prod-has-uncommitted-code-drift-not-in-git-decision`
(record:ok notify:ok). Left in place, not adopted — recommend committing it so git = prod.
