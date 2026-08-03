# Drew — flagship page: What's Included button, Host Your Event CTA, studio photo swaps

- **Source:** Gmail, thread `19fc3564aa0918a0` "WhiteWall Website" (Re:)
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- **To:** Andrew - Entrpy <andrew@entrpy.co>
- **Date:** Mon, 3 Aug 2026 15:57:09 -0400
- **Msgid:** `19fc933cc7d9d2d0`
- **Attachment:** `attachments/2026-08-03-flagship-whats-included/showmore-deadspace.png` (screenshot of the Show More dead space on a large screen)
- **Classification:** change-request (3 distinct asks, all on the flagship location page `powdersville.html`)

## Verbatim (new content only; quoted trailer below was the prior/Round-82 message)

> On the flagship location page, in the "What's Included" section, the button that says "Show More" lets have that display right below the shown cards. Right now, it displays at the bottom of the window automatically. I want it to be the opposite, depending on the person's window size. It shows as high as it possibly can, closest to the cards.
>
> I'm on a very big screen, so the four cards that show within the "What's Included" page leave a ton of dead space. I know that's because I have a massive scree￼n, so it'd be cool if this "Show More" button was centered right under the fully private card, but underneath where a third row would exist, essentially. I send you a screenshot so you can see them talking about.
>
> On that same page, the "Host Your Event" section looks great. Let's change the background photo to be one of the bounce house photos that you think looks the best. Get rid of all the text underneath the video, and then just add text that says, "Visit our events page to learn more," and then make a big, massive button that says "Visit Events Page" or something, where they can click on that and it takes them to the new events page.
>
> Within the eight photos being displayed, there are two photos that have the mirror on top of the table and the chair underneath it. Let's get rid of those two photos and replace them with one photo of the bounce houses and one photo from that event with the Refine Network. Let's also replace the last photo that you have there with another photo from the event Refine Network.

## Triage → DREW-46 (new ticket)

Three distinct asks, all `powdersville.html`, all static/layout/copy — no money / booking logic / Acuity / Square / legal / scale. Pre-authorized fast path, one booking-site PR. No open ticket on the thread (DREW-44/45 closed).

1. **What's Included — Show More button hugs the cards.** The section is a full-height scroll-snap panel; `#container-features` is `flex-1` and fills the panel, so the button block pins to the viewport bottom → big dead gap on large screens. Fix: move the button block inside the content column right after the grid and make the container `flex-initial` (no grow) so the button sits directly under the cards; dead space falls below. Preserve the row-pagination expand mechanism. Apply the same to the identical `#studio-photos` "See More".
2. **Host Your Event section** — bg photo → best bounce-house photo; remove the two paragraphs + expand text under the video; add caption "Visit our events page to learn more" + a large "Visit Events Page" button → `/events`. Drop the now-empty "See More" expand.
3. **Inside the Location (8 studio photos)** — remove the two vanity/mirror photos; replace with one bounce-house photo + one Refine Network event photo; replace the last photo with another Refine Network photo.
