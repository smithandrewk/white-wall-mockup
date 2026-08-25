# Drew — crew green-card color bug + Acuity access + crew mechanics status (Round 119)

- **Source:** Gmail (pip@entrpy.co)
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Tue, 25 Aug 2026 12:21:00 -0400
- **Thread:** 1a036c426017a325 ("Re: Dinner receipt")
- **Message id:** 1a039b9d5296d3db
- **Message-ID header:** <A486D808-990B-409C-AAC2-53E1A2B3C00A@gmail.com>
- **Attachments:** Screenshot 2026-08-25 at 12.15.36 PM.png (booking-process view — the crew card, "perfect"), Screenshot 2026-08-25 at 12.15.53 PM.png (Add-Ons page view — green card body text black outside bullets)

## Verbatim

> Set up and reset crew:
> This screenshot first is what it looks like when you're going through the booking process itself, and it's perfect, but then the second screenshot is what it looks like in the add-ons page itself. You can see that it's not quite the same because the text in that green card is black outside the bulleted points. We need to fix that.
>
> Acuity: I thought you had access already to Acuity since we've done so much with it directly. No worries, I just invited you to be an administrator within Acuity. You should have that invite, so go check it out. Let me knwo if thats what you needed.
>
> Crew add-on mechanics:  absolutely amazing. Status there?
>
> Thanks!

## Triage

Three distinct items:

1. **Green card color bug (change-request, fast path)** → new ticket **DREW-81** (follow-up to DREW-79).
   Root cause: the shared `.wws-crew` block is injected on two surfaces. On **add-ons.html** it lands inside
   `.menu-desc`, whose `.menu-desc p { color: rgba(0,0,0,.72) }` (specificity 0,2,0) outranked
   `.wws-crew__anchor { color:#f0c75e }` (0,1,0) → green callout body text painted black, while
   `.wws-crew__anchor strong` (0,2,1) still won → bold phrases stayed gold (exactly Drew's symptom). The
   booking-flow surface (`.addon-card-content`) has no competing `p` rule, so it rendered correctly there.
   **Fix:** self-defend the widget's own intro + anchor text colors with root-scoped `!important` in the shared
   `<style>`. **Booking PR #148 (merged `4a3da0a`), LIVE on prod** (verified: rule present in deployed
   booking-config.js; computed anchor color #f0c75e gold on add-ons.html).

2. **Acuity access (unblocks item 1 / DREW-77).** Drew sent a **Squarespace Contributor invite with
   Administrator permissions on the WhiteWall Studios site** (Acuity is a Squarespace product) to pip@entrpy.co
   — "New Squarespace Contributor Invitation", thread 1a039b780a110c4f, 25 Aug 16:18 UTC. This is the access
   that unblocks the DREW-77 flagship confirmation/reminder email audit (previously escalated as
   `esc-item-1-flagship-acuity-...`, blocked on access). Accepting to get into Acuity and do the parity +
   IG-video-link work, then send Drew a "what was missing" list. Reversible, Drew-granted → proceeding.

3. **Crew mechanics status (question)** → **DREW-80**, already SHIPPED + LIVE (4a/4b/4c booking PR #146 +
   4d dashboard PR #152). Answered inline: done + live. Marking DREW-80 done once confirmed to Drew.

## Reply sent

Foreman reply on thread 1a036c426017a325 (msgid recorded below): (1) green card fixed + live on both surfaces;
(2) got the Acuity Administrator invite, getting in to fix the flagship confirmation/reminder emails + will send
the list of what was off; (3) crew mechanics done + live, with a recap of what shipped. Did NOT assert item 1
done (keep-warm).
