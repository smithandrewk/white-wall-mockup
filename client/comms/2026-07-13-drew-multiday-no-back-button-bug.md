# Drew — BUG: no way to go back during the multi-day event flow

- **Source:** Gmail, thread `19f424228b20d389`  ·  **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Mon, 13 Jul 2026 19:32:49 -0400  ·  **Msg id:** `19f5dd3aef2fbe85`
- **Triage:** **incident / bug** on the LIVE booking flow. Not money/architecture/legal/customer-scale → Foreman fixes + ships. Customers can get stuck.

## VERBATIM
> Absolutely incredible, Pip. I also just noticed an inconvenient bug here, so I'm going to dictate what's going on live as I do it.
> Start on the home page.
> Go to Book Now.
> Click Event.
> Click Multi-Day Event.
> Let's say I choose 4:00 p.m. Day 1 Access.
> I choose July 29.
> I choose July 31, but then I decide, "Oh wait, actually 4:00 p.m. is not going to work. I need the entire day."
> There's no back button to go back. If I just press back on the browser, it takes me back to the home page entirely. It doesn't let me go back in steps specifically during this booking process, so there's no way for me to go back to choose a different time on step one, let alone go back to just choosing a single date  or maybe even a photo or video session .

## The bug (two parts)
1. **No in-flow back.** In the multi-day range flow the static "Back" nav is deliberately hidden (it was hidden when the range Step-2 was built, because the old per-day nav did not apply). So once you pick the Day-1 access time and start picking dates, there is no way to:
   - go back to Step 1 to change the **Day-1 access time** (Drew's exact case: picked 4 PM, wants a full day)
   - go back to the **gate** to switch Multi-day → Single-day, or Event → Photo/Video
2. **Browser back exits the site.** The flow is a SPA with no history entries, so the browser back button leaves the booking page entirely instead of stepping back.

## Fix plan
- Add an explicit **Back** affordance in the multi-day flow: Step 2 (calendar) → Step 1 (access time); Step 1 → the "What are you booking?" gate.
- Re-picking the Day-1 access time already rebuilds the event with the existing date range (`select-duration` → `buildEventRangeCart()`), so changing 4 PM → full day just works once they can reach Step 1.
- Make the step breadcrumb usable for going back during the range flow.
- Wire browser **back/forward** to step through the flow (pushState/popstate) instead of leaving the page.

## Disposition — FIXED + LIVE (booking PR #80, squash `fc3d374`)
Confirmed to Drew (`19f5de892885950d`). Three separate holes, all fixed:

1. **No in-flow Back.** `renderScheduleStep`'s multi-day **RANGE branch** hid the ENTIRE `[data-step2-nav]` — which holds **both** Continue and Back. Hiding Continue was intentional (range advances via "Review your event") but it took Back with it. Now only Continue is hidden; **Back stays**, labeled "← Back · change Day 1 access time". Re-picking the access time already rebuilds the event over the existing range, so 4 PM → Full Day just works. (The legacy per-day branch had the identical bug — fixed too. I initially patched only that one and the staging test correctly caught that the range flow was still broken.)
2. **No way back to the gate.** New quiet **"← Change booking type"** control on Step 1 (Powdersville only; TM never gates) + `gate-restart` action + `clearEventBuild()` helper → switch Multi-day ↔ Single-day, Event ↔ Photo/Video without reloading.
3. **Browser Back left the site.** SPA with no history entries. Now `replaceState` the gate on load, `pushState` per step, `popstate` restores → Back/Forward walks Step 2 → Step 1 → gate. Guarded (foreign entries ignored; History API failure falls back to the buttons).

**Verified on staging against Drew's exact script:** Back → Step 1 → re-pick Full Day → event rebuilds on the same dates at **$2,790** (3×$980 + $150 cleaning − $300 multi-day discount, discount intact); "Change booking type" → gate → switched to Photo/Video; browser Back steps Step 2 → Step 1 → gate while staying on the page. **No regression:** photo/single-session keeps both Back and Continue; TM hides the gate control. Zero JS errors. Prod verified.

**⚠️ Deploy trap hit AGAIN (2nd time):** a fresh worktree has **no `.vercel` directory at all**, so `cp .../project.json .vercel/` silently fails and `vercel deploy` auto-creates a stray project — staging keeps serving OLD code. **`mkdir -p .vercel` FIRST, then copy, then verify `projectName` is `white-wall-mockup` before deploying.** Stray `multiday-back` project removed.
