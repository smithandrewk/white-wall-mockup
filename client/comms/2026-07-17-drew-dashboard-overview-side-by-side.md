# Drew — WhiteWall Dashboard R&D (Overview: chart + calendar side by side)

- **Source:** Gmail, thread `19f6b708fb71898c` ("WhiteWall Dashboard R&D"), account `andrew@entrpy.co`
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew's WhiteWall alias)
- **Date:** Fri, 17 Jul 2026 15:14:33 -0400
- **Msg id:** `19f7180aeade755d`
- **Classification:** change-request (dashboard layout) — READ-ONLY lens, not §4-gated

## Verbatim

> Pay up on the overview page. I have a bar chart for this week where you can see how much revenue we made per day within that week, and then we have the calendar underneath it.
>
> Is it possible to use the total space that we're consuming for the bar chart on this week and the booking calendar underneath it, and then essentially chop it into two halves, where the first half is the chart for this week, and then also put the calendar next to it, essentially just keeping everything as it is, but just putting them side by side and just a little bit more condensed, with the same UI for seeing the information as I click on the different days and everything in the calendar.

(Reply-quoted my prior confirmation `19f6bd0dbea483d8` about the booking-site "How did you hear about us?" dropdown — not part of this request.)

## Triage

Layout-only change on the dashboard Overview page (`/`). Today: "This Week" revenue bar chart card
stacked on top, full-width month calendar card underneath. Drew wants the two cards placed **side by
side** (chart left, calendar right), more condensed, keeping the same click-a-day unfold interaction.

- No money, no schema, no architecture, no legal, no customer-scale → **not §4-gated**.
- Iterates on the prior "make it stretch full-width" (Round 1/2) — his call; not a standing-decision conflict.
- Dashboard gate: `npm run build`. Verify with a live-DB Playwright render (desktop two-column + mobile stack, click a day).

## Outcome — SHIPPED + LIVE ✅ (2026-07-17)

- **wws-dashboard PR #90** (squash `c8c2ded`) merged + deployed + kickstarted + prod-verified on wws.entrpy.co.
- Exported `WeekChartCard` from `glance-view.tsx`, dropped it from the `GlanceView` stack, and rendered
  `[WeekChartCard | MonthCalendarCard]` as a two-column `lg:grid-cols-2` row (`items-start`) in `glance-page.tsx`.
  Stacks to one column below `lg`; the calendar's click-a-day unfold renders inside the card, unchanged.
- **Verified:** `npm run build` clean; live-DB Playwright — desktop two-column (chart left x≈300, calendar right
  x≈796, same row), 390px mobile stack, click-a-day unfold works on both (July 1 / July 17 detail unfolds inside
  the card), 0px horizontal overflow, live data (no seed banner), zero console errors. Prod re-verified on the
  deployed `:18794` process (two-column PASS, unfold PASS, live DB, no errors); public tunnel healthy (302 CF Access).
- **Confirmed SHIPPED to Drew** (reply `19f71c22a197b86a`, thread `19f6b708fb71898c`). No open loops.
