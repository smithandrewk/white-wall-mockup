# Drew — multi-day event flow refinements + "summarize back before building"

- **Source:** email (same thread `19f424228b20d389`)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Fri, 10 Jul 2026 15:16:02 -0400
- **msgid:** `19f4d75874ffbbec` (header `<177AFC5D-56B1-4DCF-BD2B-DBBBC1D2FC02@entrpy.co>`)
- **Account:** andrew@entrpy.co
- **Attachment:** `Refine Network - Custom Event Quote.pdf` (a "Silver Salon" custom event quote,
  saved to `2026-07-10-drew-multiday-attachments/`). **Drew's explicit instruction: take ONLY
  the discounted add-on rate logic from it, nothing else.** Everything else in the PDF (the
  specific customer, dates Nov 6–8, Drew's office / Max's office add-ons, the specific totals)
  is deliberately DISREGARDED.
- **Path:** DELIBERATIVE. Drew's final line: "Before you start building, summarize everything
  back to me so I can make sure we're completely on the same page." → this turn = SUMMARY back +
  wait. NO build yet.

---

## Message — verbatim (Drew's non-quoted text)

> I absolutely love this. At the very first step, where it says "What are you booking?", we should
> put some subtext in the photo/video session option that says, "If you will be booking a multi-day
> photo/video session, please select the Event.”
>
> Once they select Event, I think we should have another question that says "Multi-day event?" or
> "Single-day event." We can have subtext for the two options:
> For the multi-day event, the subtext could say, "If your event is going to go overnight into the
> next day, select this option."
> For the single-day event, say, "If your event will be started and completed on the same day for a
> set duration, select this option.”
>  I like that path because if they just have a single-day event, they can select that option, and
> then everything will be as normal for them. They can just easily click the duration and move
> forward, like we already have it set up.
>
> If they have a multi-day event, we can start nurturing that process better, with the Selecting
> Options being almost like a menu where the first question would be, what time would you like to
> start having access to the space, starting on what day?  and I want to take almost a day-by-day
> situation there, where they build out the total duration first.  and also remember that the
> add-ons are charged per day with the discount rate we already had solidified. If they have a
> two-day event and they have 25 chairs for each day, they don't just pay for the chairs one time.
> They get charged for the chairs for the two days with the discounted rate we already had
> established, for each day in their event.
>
> Your questions you asked.
> 1) All the add-ons are specific to each individual day, except for the Setup Crew. The Setup Crew
> is per booking as a whole. Everything else is charged per day:
> the TV
> PA system
> chairs
> tables
> rolling walls
> backdrops
> all of it
> is charged per day. We already have the logic of the progressively discounted rates figured out.
> If we don't, I'm just assuming falsely. Take a look at this PDF that I made that breaks it down.
> Don't marry anything in this subject line. Don't marry anything in this PDF except the logic of
> discounted add-on rates. I almost don't want to send this because I don't want you to take any
> other information from this PDF. By me telling you to not look at all the other data, I think
> we're good.
>
> 2) yes that right.
>
> let's just go full steam ahead and try and build this thing as fast as possible. I won't lose the
> lead because I'm texting them personally, but we do need to try and make this system work for
> them. Before you start building, summarize everything back to me so I can make sure we're
> completely on the same page

---

## Foreman triage (2026-07-10)

**Answered decisions from my prior proposal:**
- Q1 (add-ons per event vs per day): **per DAY for all add-ons EXCEPT the Setup Crew** (Setup Crew
  = once per booking). TV, PA, chairs, tables, rolling walls, backdrops all per day, with the
  established progressive multi-day discount.
- Q2 (per-day duration + start time model): **confirmed ("yes that right").**

**Discount-rate logic (the ONLY thing taken from the PDF) — confirmed it already exists in code:**
`scripts/pricing-shared.js` `dayDiscountMultiplier`: **Day 1 full (100%), Day 2 15% off (85%),
Day 3+ 30% off (70%)**, applied to the five eligible add-ons (**rolling walls, chairs, tables, PA,
TV**); **Setup Crew is flat / once per booking**. The PDF's "Daily Add-Ons" table states the same
(Day 1 full, Day 2 15% off, Day 3 30% off). So "we already have it" is TRUE — no new rate logic needed.

**One precise open confirm → backdrops.** Drew verbally listed backdrops among the per-day add-ons,
but backdrops are NOT in the established discount-eligible set (walls/chairs/tables/PA/TV) and not in
the PDF's discount table. Need Drew to confirm: do backdrops get the same Day1/Day2-15%/Day3-30%
progressive discount, or are they charged per day at full price each day?

**New flow spec (Drew's refinements):**
1. Step 1 "What are you booking?": **Photo/Video Session** vs **Event**. Photo/Video subtext:
   "If you will be booking a multi-day photo/video session, please select the Event."
2. On Event → **"Single-day event?" vs "Multi-day event?"** with Drew's exact subtext.
   - Single-day → today's normal flow (pick duration, date, time).
   - Multi-day → guided day-by-day builder: start with "what time would you like to start having
     access, starting on what day?", then build each day's duration + start time across the window;
     add-ons per day (progressive discount) + Setup Crew once; one checkout + 60/40 event deposit.

**This turn:** sent Drew the full summary-back (per his request) + the one backdrops confirm. NO build
until he confirms. Do NOT ask Andrew (standing order 2026-07-10). See [[drew-self-authorizes-money]].
