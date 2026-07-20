# Drew — Sunlight Simulator: remove Blue Hour + month-relative Golden Hour

- **Source:** Gmail, account `andrew@entrpy.co`
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 20 Jul 2026 14:13:03 -0400
- **Thread:** `19f6b708fb71898c` (WhiteWall Dashboard R&D)
- **Message id:** `19f80bb7f821206f`
- **Ticket:** DREW-10
- **Classification:** change-request (behavioral, Sunlight Simulator) — fast path, not §4-gated

## Verbatim

> It works perfectly. Great job.
>
> Let's get rid of the blue hour button entirely, and let's change the golden hour button to always go to whatever the golden hour time would be for each specific month. Whenever you click on it, right off the bat, I think it auto defaults to November and 4:36 p.m. That's totally fine. If I select a random month, let's say April, and then the time is at 10:00 a.m., but then I click golden hour, I want it to adjust the time to golden hour but keep the month still April. That way, I can essentially have a way to see the golden hour every single month by just clicking that button, and it will automatically move it according to what month I'm in currently

## Disposition — SHIPPED + LIVE ✅

- **PR #96** (squash `2000a71`) merged → Vercel prod → live on whitewallstudios.co/sunlight-simulator.
- Also confirms DREW-9 (Play Day/Year touch fix) accepted: *"It works perfectly. Great job."*
- **Reply to Drew:** `19f80c5bcad062ee` (confirm live; flag summer-evening clamp).

### What changed (all in `sunlight-simulator-app.html`)
1. **Blue Hour button removed entirely** — markup, `presetBlue` handler, and renderVals binding. No trace remains.
2. **Golden Hour is month-relative** — keeps the selected month, moves only the time to that month's golden hour (~5.2° evening sun, the altitude the old Nov 4:36pm preset sat at), computed live from the sim's own sun model (`sunAt`/`LAT`/`DOY`), clamped to the 6pm slider cap.

### Golden hour by month
Jan 4:29p · Feb 4:56p · Mar 5:27p · Apr–Aug 6:00p (clamped) · Sep 5:41p · Oct 5:07p · Nov 4:36p · Dec 4:21p

Summer (Apr–Aug) true golden hour is after 6pm, past the slider range → lands at 6pm (lowest visible sun). Flagged to Drew; extending the range is a separate change if he wants it.

### Verified
Playwright, desktop 1280 + mobile 390, zero console errors, PRE-ship and on LIVE prod:
- Blue Hour absent, Golden Hour present.
- April 10am → stays April, 6:00pm; October 8am → stays October, 5:08pm; January 3pm → stays January, 4:29pm.
