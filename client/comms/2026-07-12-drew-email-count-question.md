# Drew — "how many emails did I send during this build?"

- **Source:** Gmail, thread `19f424228b20d389`  ·  **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Sun, 12 Jul 2026 09:28:25 -0400  ·  **Msg id:** `19f5683f8f0f5338`
- **Triage:** question (data lookup). No gate. Answered inline.

## VERBATIM
> Pip, how many emails in total did I send you during this build? Give me the total amount, and then give me a sub amount from that total that was a quick, short and sweet email that you could tell I sent relatively rapid fire.

## Answer (msg `19f5690e29211050`) — CONTAINED AN ERROR, corrected below
- First reply said **75 total / 14 short**. The 75 was WRONG.
- **BUG:** attribution filter matched the substring `drew@entrpy.co`, which is contained inside `an​drew@entrpy.co` (Foreman's own send address) — so my own 36 replies were counted as Drew's. Andrew caught it.

## CORRECTED (thread total = 79 messages: 43 from Drew, 36 from Foreman)
- **Drew's emails: 43 across the whole thread, 41 during the multi-day build (Jul 10-12).** Not 75.
- **Short / rapid-fire (≤20 words): 14** (this was correct — those were genuinely short + correctly attributed).
- Distribution of the 41 build emails: 4 one-liners, 10 short, 7 medium, 9 steers, 11 longer/spec (median 59 words).
- **Correction sent to Drew** (msg `19f569a97ad4221c`), crediting Andrew for catching it.

## Andrew's follow-on (in the Foreman session, not the Drew thread)
- Asked for an honest estimate of Drew's ACTIVE time. Bottom-up from the 41 emails: ~4.8h writing/thinking + ~30-45m staging testing = **~5 to 5.5 hours** of genuine active time, concentrated in bursts (mostly Jul 11 afternoon). Roughly half a working day of real attention to direct a live platform feature.
- **Lesson logged:** never attribute email senders by a bare address substring; match the full address or the display name. `andrew@` contains `drew@`.

## Drew follow-up (`19f56a05114c2dea`, 09:59): "How long u think I spent On it?"
- Same question Andrew asked; gave Drew the honest bottom-up estimate: **~5 hours of active hands-on time** (14 quick reactions + ~11 detailed steers + staging testing), concentrated in bursts, mostly Saturday afternoon; wall-clock looked like 2 days but active was ~half a working day of high-leverage direction. Reply msg `19f56abbfb067bf7`.
