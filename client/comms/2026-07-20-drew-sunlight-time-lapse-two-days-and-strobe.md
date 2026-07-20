# Drew — Sunlight Simulator: Time Lapse revise to 2 days/month + reduce the strobe flash

Follow-up / revision to DREW-12 (the "Time Lapse Entire Year" button shipped in PR #97).

- **Source:** Gmail thread `19f6b708fb71898c` ("WhiteWall Dashboard R&D"), account `andrew@entrpy.co`
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- **Date:** Mon, 20 Jul 2026 15:21:15 -0400
- **Message-id:** `19f80f9e2874c40b`
- **In reply to:** pip `19f80f4d8e791344` (the DREW-12 ship confirmation)
- **Ticket:** DREW-12 (reopened — same feature, tweak)

## Verbatim

> Incredible job. Let's revise it a little bit. Let's just make it two days per month instead of three days, and that should hopefully shorten the total time.
>
> Also, in between certain days, the screen goes to nighttime and it's kind of abrasive whenever it quickly switches over to a bright day the next morning. It doesn't happen for the entire time lapse, but it does flash you really hard, which I'm sure that's supposed to happen because technically that's what's happening every single day. The sun goes, the sun sets, it gets dark into that nighttime vibe for certain hours in the winter months, and then the sun comes the next morning and flashes the screen.
>
> However, when looking at the time lapse, it's very abrasive and literally feels like a strobe is happening. Is there any way to remediate that? If there's no way to remediate it, then don't worry about it because it is technically accurate.

## Triage

- **Type:** change-request (revision of DREW-12). Copy/animation change inside Drew's bundle
  `sunlight-simulator-app.html`. No money / Acuity / Square path. Not §4-gated. Fast path.
- **Part 1 — 2 days/month:** tour was 3 samples/month (36 total, ~36s). Change to 2/month
  (24 total). Loop shortens to ~22-24s.
- **Part 2 — strobe:** root cause found. `grade1(s)` uses a **binary** night flag
  `night = s.alt<=0.5 ? 1 : 0` that snaps the mood wash by +0.35 the instant the sun crosses
  0.5° altitude. During the tour each day-sample crosses sunrise (dark→bright snap) and sunset
  (bright→dark snap); 24-36 hard steps back-to-back = the strobe. The fixed 6am→6pm sweep also
  renders dead-black pre-dawn/post-dusk in winter.
  - **Remediation (tour-scoped, nothing else touched):** sweep only the **daylight arc**
    (sunrise→sunset, sun kept above ~0.8° so `night` never flips) for each sample, computed from
    the sim's own sun model (`sunAt`/`DOY`/`LAT`). Consecutive samples then transition dusk→dawn
    (both low, similar wash) with no horizon-crossing discontinuity — the strobe is gone, and it's
    still honest (a day time-lapse showing sunrise→sunset). Play Day / Play Year / idle / presets
    are byte-for-byte unchanged.
