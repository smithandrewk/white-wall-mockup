# Drew — folder-2 event photos (status) + events-page copy tweaks (DREW-44 follow-up + DREW-45)

- **Source:** Gmail thread `19fc3564aa0918a0` ("WhiteWall Website")
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Mon, 3 Aug 2026 15:53:18 -0400
- **msgid:** `19fc93042ab1b914`
- **Tickets:** DREW-44 (folder-2 photos, its open loop) + DREW-45 (events copy tweaks)

Reply to Andrew/pip's 3:47 PM live-confirm of DREW-44 (which told Drew the second Drive
folder's files were still owner/editors-only and asked him to drop them into the open
first folder).

## Verbatim

> Did you get these photo from this Google Drive folder too? If not, go to the other folder. I put the photos in that folder as well. Give me a status there so I can remove them after you already upload them, because they don't technically belong in that folder.
>
> https://drive.google.com/drive/folders/1XmETVMLsoZWNguFk9ZeOuNvajksggkYc?usp=sharing
> Let's bold that first sentence underneath the title on the events page and make it almost like a subtitle. Also, I want you to bold the last part of the last sentence saying "just 12 minutes from downtown Greenville", and I want you to use the number 12, not the word 12.
>
> Revise the wording in this paragraph to be this instead:
> We built WhiteWall to be an affordable, self-service event space in the Upstate of South Carolina, without compromising on a single amenity, all while maintaining the best natural light possible – Year round. Event venues get expensive fast, and most of that cost comes labor and logistics you shouldn't be forced to pay for. So we built the entire model around doing it yourself, online, at your own pace, with the most visually clean and aesthetic room that only ground-up construction can deliver.
> Everything is a la carte. If you want a crew of people to help you, we have that as an option. Have the space exactly as it is, or add chairs, tables, and other rentals only if you want them. Pricing is upfront and transparent from the first click. Even the cleaning fee is not required for smaller events, and when it does apply it is passed straight through to the cleaners, so we make nothing on it.
> The result is a private, comfortable, genuinely beautiful room, the kind of space people rent as a photo studio by day for the very best light, now open for your event.
>
> Get rid of the word "sits" when talking about the ADA spot in the paragraph under the subtitle of the space.
>
> Honestly, everything else is perfect.

## Triage

Two workstreams, both booking-site static assets/copy. No money / Acuity / Square / legal /
scale / architecture → **no escalation**, fast path.

### A) Folder-2 photos (DREW-44 open loop)
- Folder 2 (`1XmETVMLsoZWNguFk9ZeOuNvajksggkYc`) **still owner/editors-only at the file
  level** — `gdown --folder` re-tried, same "Only the owner and editors can download"
  error. Direct download of folder 2 remains blocked.
- BUT Drew followed the prior ask: he copied the folder-2 photos into the **open first
  folder** (`1v3XkmKY9dCA1KWh9BpKce3S9VnrqLIys`, subfolder `Jumpers`). Re-fetched folder 1
  → **8 files**: the original **3** (byte-identical to the already-live
  `event-flagship-01/02/03.jpg` — duplicates, skip) + **5 new hi-res event photos**
  (`2W2A1017/1023/1041/1042/1044.jpg`, 8192x5464, ~20MB each). The 5 new ones are a real
  workshop/networking event ("The Refine Network / Artist Academy" panel) shot in the
  flagship studio.
- **Status to give Drew:** got all 5 from the open folder, safe to remove them from the
  second folder.

### B) Events-page copy tweaks (DREW-45), all in `events.html`
1. **Bold the first sentence under the title as a subtitle** — "A flexible, self-service,
   open-concept space with the best natural light in the Upstate, year round." → its own
   bolded, larger subtitle line; the rest stays the paragraph.
2. **"twelve" → "12"** and bold **"just 12 minutes from downtown Greenville"**.
3. **Replace the "Built to be affordable" About paragraph(s)** with Drew's dictated text
   (all three sub-paragraphs). Faithful reproduction with ONE grammar fix flagged: Drew's
   "most of that cost comes labor and logistics" → "comes **from** labor and logistics"
   (obvious dropped word; shipping "comes labor" reads broken). Keeping his "– Year round"
   emphasis and voice otherwise.
4. **Drop "sits"** from the ADA line: "an ADA spot sits directly by the front door" → "an
   ADA spot directly by the front door".
