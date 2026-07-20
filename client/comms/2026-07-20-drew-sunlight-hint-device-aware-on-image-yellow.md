# Drew — Sunlight Simulator drag hint: device-aware copy + on-image + yellow

- **Source:** Gmail (account `andrew@entrpy.co`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 20 Jul 2026 11:02:53 -0400
- **Thread:** `19f6b708fb71898c` (WhiteWall Dashboard R&D)
- **Message-id:** `19f800d581e59f25`
- **In reply to:** my confirmation of the DREW-5 drag-hint ship (PR #91, `19f800ad4db9b934`)
- **Classification:** change-request (revision of DREW-5) — fast path (copy/static/UI, wrapper only)

## Verbatim

> This is great, but we need to change a few things:
> It should know automatically if the user is an iPhone user or a computer user, and then, depending on what the user is, change the button that pops up accordingly.
> I want this pill to be physically on the image itself. It's centered, which is great, but I want it to be centered on the actual image, on the very bottom. Put it on the sunlight simulator.
> Now I'm going to go ahead and make this a yellow background of the image and make it a yellow background with black text so it's abundantly clear to see. The language on the phone should be: "Drag your finger to interact with the simulator," and then the language on the desktop should be: "Drag your cursor to interact with the simulator."

## Triage

Four changes to the drag-hint pill shipped in PR #91 (DREW-5), all on the wrapper
`sunlight-simulator.html` (Drew's bundle stays byte-for-byte untouched):

1. **Device-aware copy** — touch/mobile device → "Drag your finger to interact with the
   simulator"; desktop → "Drag your cursor to interact with the simulator". Keyed on
   touch/coarse-pointer capability (covers iPhone + all touch devices, not just UA=iPhone).
2. **On the image, not the screen** — pin the pill to the bottom-center of the actual studio
   image (the bundle's `stageRef` box), not the viewport bottom. The iframe is same-origin,
   so the wrapper reads the stage's rect (`img[alt="Whitewall Studios interior"]` → parent)
   and tracks it on load/resize/scroll.
3. **Yellow background, black text** — solid yellow pill, black text + black icon (drop the
   dark blur chip). Maximum legibility on any scene.
4. New copy per (1).

Still `pointer-events: none` so it never intercepts the drag it advertises.
