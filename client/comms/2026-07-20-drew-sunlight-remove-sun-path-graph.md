# Drew — Sunlight Simulator: remove the sun path graph

- **Source:** Gmail (account `andrew@entrpy.co`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 20 Jul 2026 11:17:24 -0400
- **Thread:** `19f6b708fb71898c` (WhiteWall Dashboard R&D)
- **Message-id:** `19f801aa148b72cf`
- **Classification:** change-request — fast path (static/UI, wrapper only)
- **Access:** message arrived within the ACTIVE paid window.

## Verbatim

> Great job. In the top right of the image, there's a sun path graph where you can literally see where the sun is moving throughout the sky and the angle of it. I don't want that anywhere. Just get rid of that little chart thing altogether for both mobile and desktop.

## Triage

Remove the "SUN PATH" mini-chart that sits in the top-right corner of the studio image,
on both mobile and desktop. In Drew's bundle that widget is a self-contained card
(absolutely positioned `top:14px; right:14px`) holding a "SUN PATH" label + the `pathRef`
canvas that draws the sun's arc.

Approach: hide it from the wrapper (`sunlight-simulator.html`) — the same-origin iframe lets
us find the "SUN PATH" card in the bundle's live DOM and set `display:none`, continuously
enforced in the existing poll loop. Drew's bundle (`sunlight-simulator-app.html`) stays
byte-for-byte untouched (we only read its DOM and hide one element), consistent with how the
drag-hint pill is done. Fully reversible.
