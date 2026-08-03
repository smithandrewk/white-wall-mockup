# Drew — gallery event photos (Drive links) + cleaning-fee wording confirm (DREW-44)

- **Source:** Gmail thread `19fc3564aa0918a0` ("WhiteWall Website")
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 3 Aug 2026 15:40:25 -0400
- **msgid:** `19fc9247ac09e2a5`
- **Ticket:** DREW-44

This closes the DREW-43 open loop #1 (gallery photos, previously blocked because both
Drive folders were owner/editors-only) and confirms open loop #2 (cleaning-fee wording).

## Verbatim

> Try these two Google Drive links. I just made them viewable for anyone with the link and everyone as an editor. If this doesn't work, I'm not sure what to do. Outside of just manually emailing them individually to you over multiple emails because the email is too big to send all at once
>
> I agree with you: 35 or more is the right wording.
> https://drive.google.com/drive/folders/1v3XkmKY9dCA1KWh9BpKce3S9VnrqLIys?usp=sharing
> https://drive.google.com/drive/folders/1XmETVMLsoZWNguFk9ZeOuNvajksggkYc?usp=sharing

(Reply to Andrew/pip's 3:36 PM live-confirm of the DREW-43 events-page copy pass, which
listed the two open loops.)

## Triage

- **Change request (fast path, booking site static assets/copy).** No money / Acuity /
  Square / legal / scale / architecture → no escalation.
- **Folder 1** (`1v3XkmKY9dCA1KWh9BpKce3S9VnrqLIys`) — `gdown --folder` fetched **3 JPGs**
  cleanly (event setup: white bounce houses + slide, pastel balloon garlands, the flagship
  studio interior). 1206px wide, web-ready.
- **Folder 2** (`1XmETVMLsoZWNguFk9ZeOuNvajksggkYc`) — folder is shared but every file
  inside is still **"Only the owner and editors can download this file"** — the folder-level
  share did not propagate to the individual files. 0 files fetched. BLOCKED until Drew opens
  the files themselves (or drops them into folder 1, which worked).
- **Cleaning-fee wording** — Drew: "35 or more is the right wording." Copy already reads
  "35 or more guests" (matches server `effectiveCount >= 35`). **No change needed** — open
  loop #2 resolved.
