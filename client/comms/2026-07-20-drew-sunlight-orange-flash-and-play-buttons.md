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

---

## Follow-up — Drew payment + FYI (already answered, logged for the record)

- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 20 Jul 2026 11:42:21 -0400
- **Message id:** `19f80316e1847115`
- **Class:** fyi + payment notification. NOT a change request. NO work owed.

### Verbatim

> Hahahahahahahah pip you gotta tell Andrew it worked hahahaha.
>
> Totally fine pip. I'll go ahead and get it paid right now. Bu the time youre reading this,
> it's already paid.

### Disposition — ALREADY ANSWERED, do not re-reply

This is Drew reacting to the pay-per-24h out-of-office paywall email (`19f802e53b846701`,
"the fee is $20") and confirming he paid. It was **fully answered before this Foreman
picked it up**, by two later replies on the same thread:

- **`19f803baf638e847`** (Mon 11:53) — "Payment landed, thank you Drew..." → answers
  "I'll go ahead and get it paid right now / it's already paid."
- **`19f804c7f9835e7f`** (Mon 12:12) — both-live confirmation, closing with "And yeah, I
  will let Andrew know it worked." → answers "you gotta tell Andrew it worked."

The launchd watcher re-flagged this only because the `last-seen` pointer had lagged at the
DREW-8 *request* (`19f802a8dc0092d6`). Pointer is now current at `19f80316e1847115`. The one
live obligation carried by the answered reply — pip's promise to "let Andrew know it worked"
— is honored via an iMessage FYI to Andrew (the pay-per-24h loop ran end-to-end for the
first time: paywall → Drew paid $20 → foreman auto-shipped DREW-8). No Drew-facing action.

---

## Follow-up 2 — Play Day/Year STILL flaky after PR #94 (DREW-9)

- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 20 Jul 2026 13:47:00 -0400
- **Message id:** `19f80a39a9ab62d3`
- **Thread:** `19f6b708fb71898c` (account andrew@entrpy.co)
- **Class:** incident / change-request (behavioral bug). Ticket **DREW-9**.

### Verbatim

> Pippy did an amazing job, and that weird orange logo thing doesn't show up anymore. However, it is still bugging out whenever I go through the different play buttons for Play Day or Play Year.
>
> I'm going to live communicate what I'm doing as I speak. I just refreshed the page and watched the intro animation. I'm now pressing Play Day, and it didn't work. I'm pressing Play Year, and it didn't work. I'm now going to select October in the top slider, and I'm going to press Play Day. It worked, and now it's on a loop, which is great.
>
> I'm now pausing it. It's not working as I click the pause button. I clicked it again, and it didn't work. I clicked on the actual image itself, and it paused it immediately. I now have it set to 2 p.m. in October, and I'm going to press Play Day. It's working, and when I press pause, it worked. I'm now manually setting it to 9:54 a.m. in October, and I'm going to press Play Year. It's not working. I just clicked it, and it didn't work. I clicked the image and then clicked Play Year, and now it's working. I clicked the image and paused it. I clicked Play Day, and nothing. It's still very much bugging out with these play buttons. They need to be flawless no matter what combination of clicks or things happens prior or after.

### Diagnosis

Drew's own A/B is the proof: **clicking the IMAGE always works; the Play buttons are flaky.**
The image is wired on the native `pointerdown` event (`bindDrag`), which fires the instant a
finger/cursor touches it. The buttons were wired on the `click` event (React `onClick` via the
bundle's `sc-camel-on-click`), which on touch devices is delayed and frequently cancelled (a
tap that drifts a pixel, the ~300ms synthesized-click delay, and the button's text being
rewritten every animation frame all suppress `click`). PR #94 fixed the animation *timer* but
left the buttons on the fragile `click` path.

### Fix (this session, DREW-9)

In the bundle `sunlight-simulator-app.html`, make the buttons behave exactly like the image:
1. Bind **`pointerdown`** on both buttons (instant, identical for touch + mouse) + `touch-action:manipulation`.
2. **Debounce** each toggle (per button) so the redundant synthesized `click` can't double-toggle and rapid taps can't desync state.
3. Stop the per-frame `textContent` churn (only update the Pause/Play label when it actually changes).

Behavioral change in Drew's own bundle → verify with a real headless drive (pointerdown-only,
double-fire, rapid taps), pre-ship and on live prod.
