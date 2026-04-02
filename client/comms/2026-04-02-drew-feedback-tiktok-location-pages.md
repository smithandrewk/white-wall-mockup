---
source: Drew (client)
date: 2026-04-02
medium: Voice note relayed by Andrew
topic: TikTok-style location page feedback
---

## Verbatim Feedback (transcribed)

### Button Labels
- About sections (paragraphs): "Read More" / "Read Less"
- Feature card sections: "Show More" / "Show Less"
- Photo sections: "See More" / "See Less"
- Be specific with label text per content type

### Button Positioning
- Show More / Read More button should be a centered floating pill, right under the last visible content
- "Book This Location" / "View Full Gallery" should be centered below the pill
- NOT side-by-side — pill on top, CTA below

### Concurrent Scroll Bug
- From the second card on (About), clicking Read More shows text but doesn't scroll simultaneously — needs to happen concurrently
- From the third card (Features), cards come in but you have to click Show More a second time for it to scroll — first scroll should happen concurrently with Show More
- This is the same issue on both: the translateY shift needs to fire at the same time as the expand animation

### Events Section (Host Your Event)
- Loves the frosted glass window — "I think it's perfect"
- Text could have fit without Show More — remove expand, show all text
- Only lets you expand/collapse (one group), and when expanded text gets cut off mid-sentence

### Photos Section
- "Show More inside the location works fine" — just needs floating pill style
- "View Full Gallery" should be centered below the pill

### General
- Swiping is great — snaps to next section properly
- These notes apply to both mobile and desktop
