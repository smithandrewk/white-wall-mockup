# Drew — Sunlight Simulator: horizontal (azimuth) accuracy question

- **Source:** Gmail, thread `19f6b708fb71898c` ("WhiteWall Dashboard R&D")
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 20 Jul 2026 14:45:12 -0400
- **Message id:** `19f80d8e2d28a12e`
- **Class:** question (astronomical-accuracy audit — NOT yet a change request; Drew explicitly asked to talk first)
- **Access:** ACTIVE paid 24h window (armed)

## Verbatim

> Pit, before doing anything, just respond to me here so I can see if we're on the same page or not, because I'm curious if I'm actually looking into this properly.
>
> I'm looking at the simulator right now, and all the work you've done is incredible, but I'm questioning the integrity of the simulator. I think it did a really good job on the vertical elevation of the sun throughout the months. For example, if you click on January, the sun is lower in the sky, so the angle is greater. If you click on April, the sun is higher in the sky, so that same lighting is at a much more sloped or steep angle. I think that aspect makes sense. I think we crushed that as far as the vertical elevation/placement of the sun.
>
> One thing that I'm questioning is the horizontal placement of the sun. In the month of January, the days are so short that I'm wondering if the sun is in the exact same spot at 3:00 p.m., horizontally, as it is in April. My gut tells me the obvious answer is no, but I think our simulator assumes that the answer is yes. Looking at January 15th at 3:00 p.m., the sun vertically is differently placed, but horizontally it looks like the sun is in the exact same spot as it would be if you compare it to April at 3:00 p.m. Vertically different, but horizontally the exact same placement. That doesn't seem to be accurate to me in real life. Would you agree with that?
>
> Obviously, you can apply that same logic to all the months. Right now, if I keep the time at 3:00 p.m. and I just grab the month slider and slide all the way throughout the years, the sun/light in this space only changes as far as its angle internally in respect to the windows. It either gets the sunlight stretching further away from the windows or condensing closer to the windows. While I think that's correct in theory, I think the problem is that the sun should also be moving horizontally as well according to the months that you change the slider on. It shouldn't just be moving in and out from the wall with the windows. It should also be sliding left and right a little bit as well, or is that completely incorrect? Audit my thought process there and let me know if I'm crazy. There's a high chance that I'm just completely incorrect here, but if I'm right, that means that the integrity of the simulator isn't accurate.

## Triage / findings (from reading the sim's own sun model)

`sunAt(hour, doy)` in `sunlight-simulator-app.html` computes a full solar position:
declination from day-of-year → altitude AND **azimuth** (`az`), then a 3D light-direction
vector `p = [-cos(alt)·sin(az), -cos(alt)·cos(az), -sin(alt)]`. The first component is the
**sideways (east-west) component**, and `az` depends on declination (the month). So the
sim does NOT assume the horizontal spot is fixed — it varies azimuth with season and feeds
it into where the light lands.

Computed from the sim's own math at **3:00pm**, LAT 34.75 (window wall modeled as **due
south**, `beta = az - 180`):

| Month | alt | azimuth | sideways-throw | depth-throw |
|---|---|---|---|---|
| Dec 21 | 17.8° | 223.0° | 2.12 | 2.28 |
| Jan 15 | 19.6° | 224.4° | 1.97 | 2.01 |
| Oct 15 | 28.5° | 232.5° | 1.46 | 1.12 |
| Apr 15 | 41.8° | 249.3° | 1.05 | 0.39 |
| Jun 21 | 49.4° | 266.2° | 0.85 | 0.06 |

So: azimuth swings **~43°** across the year at 3pm (Dec 223° → Jun 266°) — **Drew's physics
is correct**, the sun is NOT in the same horizontal spot. The sim's sideways-throw does
change with season (2.12 → 0.85, ~2.5x), but the **depth-throw** (in/out) changes far more
dramatically (2.28 → 0.06) and both move together diagonally, so visually the in/out swamps
the sideways shift — which is exactly what Drew perceives.

**Real assumption worth confirming:** the model treats the studio's window wall as facing
**due south**. If the actual building faces a different bearing, the horizontal behavior on
screen would differ.

## Disposition

- Replied to Drew directly (CONVERSE step): confirmed his physics is right, explained the
  sim already varies azimuth but the sideways move is subtle vs the in/out at fixed time,
  flagged the south-facing assumption, offered a proper accuracy audit + fix as the next
  step. Did NOT build (he asked to align first).
- Ticket: DREW-11 (audit horizontal/azimuth accuracy of the sunlight simulator).

---

## Follow-up — Drew confirms windows face TRUE SOUTH (msg `19f80e6afb77b8ca`, Mon 20 Jul 2026 15:00:16 -0400, from contact@whitewallstudios.co)

### Verbatim

> Okay, this is super helpful. Thank you for clarifying all that. Believe it or not, the windows are facing 100% true south. We built it from the ground up with the GPS to make sure that we have these windows facing 100% completely true south. With that said, technically it's good, isn't it?

### Disposition

- Drew answered the one open question: the studio's main window wall faces **100% true south**
  (GPS-verified during construction). That is **exactly the assumption the sim's model already
  bakes in** (`beta = az - 180`, i.e. window normal = due south). So the single assumption I
  flagged in the audit is now **confirmed correct** — there is no orientation error to fix.
- Net: the simulator is astronomically accurate. Vertical elevation right, horizontal (azimuth)
  right, and the reason the left-right shift reads quiet on screen is a perception effect (in/out
  swing dominates the diagonal at a fixed afternoon time), not a physics error. **No build.**
- Replied confirming "yes, technically it is good," explained why, and offered — purely optional —
  a readability aid (a faint marker tracking the sun's left-right position through the year) so the
  subtle sideways motion is easier to SEE, framed explicitly as a readability aid, not an accuracy
  fix (accuracy is already there). Reply id: `19f80e8d2e8bba1c`.
- **DREW-11 → done** (audit complete, conclusion: accurate, orientation confirmed, no fix needed).
  If Drew wants the optional readability aid, that spawns a fresh foreman as a new distinct request.
