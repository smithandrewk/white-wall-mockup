# Drew — Sunlight Simulator: orange logo flash on load + flaky Play Day/Year + pause

- **Source:** Gmail, thread `19f6b708fb71898c` ("WhiteWall Dashboard R&D")
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 20 Jul 2026 11:34:47 -0400
- **Message id:** `19f802a8dc0092d6`
- **Access:** ACTIVE PAID window — Drew paid $20 (~11:47), 24h. Request landed just before the
  paywall auto-fired; parked, then this Foreman picked it up. Armed.
- **Class:** change-request / bug-fix (booking site, Sunlight Simulator). NOT §4-gated.

## Verbatim

> Whenever you go to the page for the first time or you refresh the page, this weird orange
> logo thing pops up in the very top left as the page is loading. Can we get rid of that?
>
> Also, the play day and play year buttons don't always work. For example, if I refresh the
> page, it does a little intro simulation to welcome you to the page. If I click play day, it
> will have a loop going back and forth of the sun moving as you play the day. That's great,
> but pausing it is already difficult. If I refresh the page again, I go back to square one,
> and if I press play year, nothing happens. It should work, but it doesn't work. It almost
> bugs out or loads slowly, and it doesn't give me any feedback or response. Eventually, it
> starts working and starts playing, so I click pause, and then it takes forever to actually
> pause. I'm clicking it multiple times, and nothing is happening, so I manually click on the
> actual slider to get it to stop.
>
> Let's say I click on October, and then I move the time slider to be 2:00 p.m. Exactly, if I
> press play year, nothing happens. Sometimes it works. I just clicked it again, and it
> worked, but there's no predictability as to why it's working. I click pause, nothing
> happens, and then I click it again, nothing happens, so then I have to manually click on the
> slider up top. Same thing on the play day: if I press the play day button, it's a gamble if
> it's going to work or not, and it doesn't pause every single time.
>
> Can you just look into this and make sure it flows and functions perfectly?

## Triage

Two parts, both on `/sunlight-simulator`:

1. **Orange logo flash top-left on load/refresh** — a brief flash of an orange logo before
   the page settles. Kill it.
2. **Play Day / Play Year buttons flaky** — unreliable to start, pause barely responds (must
   manually grab the slider), no feedback, laggy/bugs out. Make play/pause deterministic.

Part 2 is a behavioral bug in the simulator's own animation logic (inside Drew's bundle
`sunlight-simulator-app.html`), so — unlike every prior Sunlight round — this one may require
touching the bundle JS rather than only the wrapper overlay. Investigate first.

Path: booking site (`white-wall-mockup`). Copy/static-tier does not apply — this is
behavioral, so verify with a real headless drive of play/pause on the live-ish page.
