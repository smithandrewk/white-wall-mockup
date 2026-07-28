# Drew — branded PDF recap of the multi-day event project

- **Source:** Gmail, thread `19f424228b20d389`  ·  **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Sun, 12 Jul 2026 01:11:33 -0400  ·  **Msg id:** `19f54bd14b590b2c`
- **Triage:** change-request / deliverable. No money/architecture/legal/customer-scale gate. Drew is an entrpy co-owner (not a customer); Andrew's standing order = handle the Drew relationship autonomously. → Foreman produces + emails it, then FYIs Andrew.

## VERBATIM
> Absolutely incredible pip. Truly.
>
> I now want you to go through all of the emails we've had over today and yesterday for this whole session's worth of back and forth, and I want you to make me a branded PDF summary recap of everything we did entirely. Summarize all of it, with all the nerdy inner workings and everything. Build this document out to the traditional branding guidelines of entropy. You should have access to those Brandon guidelines somewhere. And you can give it the credit of entropy building all of this. You can refer to whitewall as the client, and then what entropy did for them being the work that you did. Give all the details of where we started how we figured out the logic, and everything we did on the backend and front end and everything and how long it took from start to finish to successfully do everything the client wanted.
>
> Send that pdf to me via email when done.

## Deliverable spec
- **Branded** to entrpy brand guidelines (find them in the entrpy project); credit **entrpy = builder**, **White Wall = client**.
- **Comprehensive + technical** ("all the nerdy inner workings"): where we started, how the logic was figured out, backend + frontend, and total time start→finish.
- Output: **PDF**, emailed to Drew.

## Disposition — DELIVERED
- Found entrpy brand guidelines (no xelatex on this host, so replicated the entrpy LaTeX editorial system in HTML→PDF via headless Chromium using the system Charter + Helvetica Neue fonts): forest-green `#14532D` headings/wordmark, Charter serif body, cream `#EEE8D0` overview tables, the 4-color mark, editorial "quiet research report" layout. Brand source: `~/code/entrpy/vault/brand/` (marks/README.md + templates/entrpy-proposal.sty).
- Built a **7-page branded PDF**: cover + (1) exec summary w/ KPI strip [35h · 73 emails · 51 commits], (2) where we started, (3) figuring out the logic (3 builder iterations → the range model), (4) front end, (5) backend inner workings (one-event/N-appts/one-charge, the ET-offset timezone bug, the multi-calendar gotcha, the dead-end fix, the operations layer, crew buffers, the held-dark deposit), (6) staging dry-run verification, (7) go-live + what's next. entrpy=builder, White Wall=client.
- **Emailed to Drew** (msg `19f54d2388db8459`, PDF attached). **FYI'd Andrew** by iMessage (offered to revise/resend; no action needed).
- Deliverable + HTML source + render script preserved: `client/comms/2026-07-12-recap-deliverable/`.
