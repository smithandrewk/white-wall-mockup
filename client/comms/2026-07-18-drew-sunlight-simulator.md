# Drew — Sunlight Simulator: publish live + add to menu + link from FAQ

- **Source:** Email (Gmail), thread `19f6b708fb71898c` ("Re: WhiteWall Dashboard R&D")
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew's WhiteWall alias)
- **Date:** Sat, 18 Jul 2026 22:09:25 -0400
- **Message id:** `19f7822ca6f71be2`
- **Attachment:** `Whitewall Sunlight Simulator.html` (2,947,072 bytes, self-contained bundle)
- **Classification:** change-request · **Path:** fast (static/copy addition, no money/booking-logic)

## Verbatim

> Pip, can you post this HTM live onto the official WhiteWall website, and put it in the menu bar as the Sunlight Simulator? Also check our faqs page. If we have any questions about "when is the best time to book the studio" or "when is the best natural light in the studio" just add this link on the page to this, and say we have a live simulator to show you what the sunlight will look like in the space at what time on what month. Hyperlink that new page to that answer.

## What shipped

Repo: `smithandrewk/white-wall-mockup` (booking/marketing site, whitewallstudios.co), branch `worker/sunlight-simulator`.

1. **New page.** Drew's bundle added byte-for-byte as `sunlight-simulator-app.html`, wrapped by a thin
   `sunlight-simulator.html` (proper `<title>`, meta, favicon; full-viewport iframe of the bundle). Served
   at the clean route **`/sunlight-simulator`** (`cleanUrls: true`). Wrapper needed because the bundle
   rewrites its own `<head>` on unpack, leaving an empty tab title — the wrapper owns the title/meta while
   Drew's artifact stays untouched.
2. **Menu bar.** "Sunlight Simulator" added to the nav on every menu-bearing page (index, powdersville,
   taylors-mill, gallery, floor-plans, faq, add-ons, book-powdersville, book-taylors-mill), desktop + mobile,
   placed right after "Floor Plans", cloning each page's own nav styling. 14 insertions total.
3. **FAQ link.** Existing FAQ question "What is the best time of day for natural light?" (covers both of
   Drew's phrasings) gets a new answer line: "Want to see it for yourself? We have a **live Sunlight
   Simulator** that shows you exactly what the sunlight will look like in the space at any time of day, in
   any month of the year." — hyperlinked to `/sunlight-simulator`.

Verify tier: copy/static — `node --check` (no JS touched), grep completeness, headless render of the wrapper,
Vercel deploy spot-check on the live URL.
