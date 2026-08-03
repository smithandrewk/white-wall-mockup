# Drew — On the Brink Reach Out copy revision (DREW-42 follow-up)

Follow-up to the DREW-42 On the Brink "Reach Out" feature (dashboard PR #115, shipped + live
this afternoon). Drew reviewed the live reach-out note and wants the copy changed.

---

**Source:** Gmail (work mailbox `andrew@entrpy.co`)
**From:** Drew Shahoud <drew@entrpy.co>
**Date:** Mon, 3 Aug 2026 17:27:07 -0400
**Thread:** 19fa478568fc46a2 ("WhiteWall Dashboard Revisions")
**Message-id:** 19fc986293b3cadc

> Absolutely incredible work here. I don't like the heart emoji. Let's change the heart emoji to the camera emoji. Also, get rid of the "whenever works for you" and a link. Just get rid of that altogether. I also needed to feel less robotic. I'm going to read a new copy that I think would work out well. I genuinely love this language. This is for the email, but I honestly love this for the text too. Maybe this, but a little shorter for the text copy.
>
> Hey Megan,
>
> Drew here with Whitewall. I wanted to personally reach out and just say how thankful we are for your continued support. I'm looking through our most loyal clients, and there's no doubt about it, you are one of our day-ones! I just want to say how thankful I am for that. It's because of clients like you that I'm is able to stay in business and keep serving the upstate.
>
> Because of that, I just wanted to give you a 75% coupon code. Obviously, this isn't going public anywhere, but I wanted to just say a personal thank you.
>
> Anyway, I hope you guys are doing well, and let us know if there's anything we could be doing better at Whitewall! We're genuinely always trying to improve. If you need anything at all, just shoot me a text. My personal number is 803-873-8153.
>
> Thanks so much!
>
> Drew with WhiteWall

---

## Triage

- **Type:** change-request (copy). Same work as **DREW-42** (the shipped Reach Out feature) →
  reopen DREW-42, do not mint a new ticket (DREW-37-follow-up precedent).
- **Path:** fast path. Verbatim-dictated copy + a trivial emoji swap + a deletion. Dashboard
  `lib/reachout/copy.ts` only (the one pure generator feeding both the Reach Out UI cell and the
  Watson `get_metrics` payload). No money/architecture/legal/scale → **no hard gate.** The 75%
  code is unchanged (already Drew-authorized, minted on prod).

## The three asks + how handled

1. **Heart emoji → camera emoji.** The old copy used 💛 (yellow heart) in the subject + both
   bodies → swap to **📸 (camera with flash)**. Drew's dictated copy has no emoji marker, so the
   single camera sits on the sign-off line ("Drew with WhiteWall 📸") — one emoji, tasteful.
2. **Remove "whenever works for you" + the link.** Deleted the `Book whenever works for you:
   <bookUrl>` line (email) and `Book anytime: <bookUrl>` (SMS), and dropped `BOOK_URL` entirely.
   Drew's new copy has no book link — the note is now a pure personal thank-you.
3. **New, less-robotic copy (dictated).** Replaced the email body with Drew's verbatim text.
   Text/SMS = a shorter version of the same, per "a little shorter for the text copy."

## Foreman notes / flags (offered back to Drew)

- **Grammar fix (one):** Drew's "that I'm is able to stay in business" → "that **I'm able** to
  stay in business" (stray doubled word). Flagged.
- **Brand casing:** Drew wrote "Whitewall" lowercase in the body but "WhiteWall" in his own
  signature; normalized to **WhiteWall** (the site brand) throughout. Flagged.
- **Coupon code inserted:** Drew's copy says "give you a 75% coupon code" but does not state the
  actual code, and a thank-you with no redeemable code is useless — appended the live code so it
  reads "a 75% coupon code: **THANKYOU75**." Still driven by the shared `THANKYOU_CODE` constant
  so it can never drift from the minted coupon. Flagged.
- **Subject line** (Drew didn't dictate one): retuned to the new thank-you tone with the camera
  emoji — "A personal thank you from WhiteWall 📸". Offered to change.
