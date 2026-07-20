# Drew — Sunlight Simulator: "Time Lapse Entire Year" button

- **Source:** Gmail, thread `19f6b708fb71898c` ("WhiteWall Dashboard R&D")
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 20 Jul 2026 15:04:51 -0400
- **Message id:** `19f80eaddc87d8ef`
- **Ticket:** DREW-12
- **Access:** ACTIVE paid 24h window (armed)

## Verbatim

> I want you to now add a button left of the play day button that is a light blue color and says "Time Lapse Entire Year". It plays the entire year going from month to month, but it almost time lapses, where you essentially go through three full days per month. I want it to be on a month-by-month basis, where you can see the full day's time lapse for maybe three days per month. Maybe we just do it every 10 days or something? It should be a relatively quick one, full loop around the entire year, so it should take about 36 seconds, essentially one full second per day per month.

## Triage

- **Class:** change-request (behavioral, sunlight-simulator only). Fast path.
- **Not §4-gated:** self-contained UI feature on the sim page; no money / Acuity / Square / legal / customer-scale.
- **Distinct request** → new ticket DREW-12 (no open ticket on the thread; DREW-11 done).

## Spec reading (the math)

- New button **left of Play Day**, **light blue**, text **"Time Lapse Entire Year"**.
- Plays the whole year month-by-month; within each month, ~3 full-day time-lapses ("every ~10 days").
- ~1 second per day-sweep, ~36 seconds total = 12 months × 3 days × 1s. One full loop.
- Design: new `mode='tour'` in the bundle's animation engine. `dHour` sweeps 6→18 at 12/s
  (= 1s per full day); on each sunset advance `tourStep` (0..35) and set `dMonth = tourStep/3`
  → 3 samples per month spaced ~10 days apart across the whole year, then loop. 36 × 1s = 36s.

## SHIPPED + LIVE ✅

- **booking PR #97** (squash `37d432c`) merged → Vercel prod → live on
  whitewallstudios.co/sunlight-simulator.
- Surgical inline-JS edits to `sunlight-simulator-app.html` only (+1432 bytes); packed-bundle
  JSON/string integrity preserved (count-asserted anchors). New light-blue button `#7ec8e3`
  (dark text) left of Play Day; active = deep blue `#2b8cbe` + cream + "❚❚ Pause"; live badge
  "TIME LAPSE · YEAR". Play Day/Year, presets, sliders, share, wrapper (DREW-6/7) unchanged.
- **Verified** Playwright desktop 1280 + mobile 390, pre-ship AND on LIVE prod: button light
  blue + first/left of Play Day; tour advances month (0→1.0 in ~3s = 3 sweeps/month stepping
  Jan→Feb) with hour sweeping 6→18 each second (loop wrap observed); Pause/idle toggle; Play
  Day still works; zero console errors.
- Confirmed to Drew: reply `19f80f4d8e791344` (offered faster/slower + more/fewer sample days).
- Ticket **DREW-12 → done**. `last-seen-drew.txt` advanced to `19f80eaddc87d8ef`.
