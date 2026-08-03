# Drew — dedicated Events page (booking site)

Source: Gmail thread `19fc3564aa0918a0` ("WhiteWall Website"), account `andrew@entrpy.co`
From: WhiteWall Studios <contact@whitewallstudios.co>
Date: Mon, 3 Aug 2026 12:10:57 -0400
msgid: `19fc864bc0e9f40e`
Classification: change-request (booking site) — new page + nav tab retarget
Ticket: DREW-39
Paid window: ACTIVE (armed=ON)

---

## Inbound (verbatim)

> Okay, first things first, I want to make an actual events page. Right now, when you click on the Events tab within the menu bar, it will take you to the anchor that we have on the flagship location about events. We can leave that anchor there, and we'll get back to that section later.
>
> Now I still want to keep the same Events tab, but I want to make a full-blown, separate page specifically to events. We're going to have that same video on that page as well, and you can make a general summary from the information we have on the anchor there that displays. I want to make it interactive in a way where people can see answers to the most recent questions. You and I will work on those questions later. But for now, we can just get the design down. I don't want it to be like our frequently asked questions page. I want it to be interactive and easy to read. My target audience is usually going to be mothers of brides or mothers of baby/bridal showers, so they're good at tech, but they need things to be right in front of them and easy to understand. They're going to go to the Events tab and then be able to see the video and the small paragraph explaining the About Events at WhiteWall. We should just have easy access to things and easy answers. I'll rattle off a few:
> How many cars can we fit in the parking lot?
> Is there extra parking?
> How many bathrooms are there?
> Can I host an X event there?
> Can I set up the night before?
> How much does it cost?
> Are there multi-day event options?
> Can I have food and drink there?
> Does it come with tables and chairs?
> What will the space look like when we show up?
> How many people can I fit in there?
> Is it soundproof?
> Can I request a tour?
> How do I book an event, etc.?
> Those are just a few options. I'm sure we'll think of more and then maybe even get rid of a few of them, but right now I want to have clear answers to all these things. Let's make that page actually alive. Let's make it very visually appealing and easy to read. Just continue scrolling. Keep in mind that most SEO and Google Ads are going to go straight to this page, so we need to probably have some information and such about that. We also need to have, front and center, a very big card that says "View the Gallery," where they can go straight to the gallery for the flagship location and see photos and videos of it, as well as see the floor plans (because we already have a tab that shows all the different floor plans and occupancy and stuff). I don't think we need to reinvent the wheel, but we do need to make it very, very easy for people to find that page. Probably a button or a card or something that shows them how to access that page. They just click anywhere on that button/card, and it takes them to the floor plans page. We can have a little small paragraph explaining what's on that page and how many people can fit in, everything.

---

## Triage

- **Type:** change-request, booking site (`white-wall-mockup`). New standalone page `events.html` served at `/events`, plus retarget the global "Events" nav tab from `/powdersville#events` to `/events`.
- **Path:** fast / pre-authorized. Static HTML + copy, no JS booking logic, no money path, no Acuity/Square, no legal text, no customer-scale send, in-repo. **No escalation.**
- **Keep the anchor:** the `#events` section on `powdersville.html` stays untouched ("leave that anchor there... we'll get back to that section later").
- **Answers = design pass, not final** — Drew: "You and I will work on those questions later. But for now, we can just get the design down." So the page ships with the interactive Q&A structure and **honest starter answers**: real facts where the site already states them (Drew-approved), and non-fabricated placeholders (invite contact) for business facts only Drew holds. No fabricated numbers on a live, ad-landing page.

### Answer sourcing (real vs placeholder)
REAL (from Drew-approved live copy / floor plans):
- Tables & chairs → 100 chairs + 10 eight-foot tables (flagship anchor).
- Capacity → up to 281 standing / ~160 ceremony seated / 80 banquet + dance floor (floor-plans).
- Bathroom → a private on-site restroom (8'x8', floor-plans + powdersville "Private bathroom").
- What it looks like → as-is or cleared completely to empty (flagship anchor); Gallery + Floor Plans.
- Cost → depends on date/hours/guests; 35+ guests include a $150 cleaning fee (live copy); start a booking for live pricing. (No fabricated base price.)
- Multi-day → yes, multi-day events are bookable (notify-multiday path exists).
- Host X event → yes; event types from flagship "Best For".
- Request a tour → yes, via contact.
- How to book → /book-powdersville.

PLACEHOLDER (business facts only Drew holds — honest holding copy, flagged to Drew):
- Parking stall count / extra parking.
- Set up the night before (policy — no commitment).
- Soundproofing.
- Food/drink specifics (welcomed in general; catering/alcohol details soft).

### Build
- New `events.html`: video hero (same event tour video, YouTube `BsyruYsoA-I`) + "About Events at WhiteWall" summary; two big fully-clickable cards front-and-center — **View the Gallery** (`/gallery?location=powdersville`) and **See the Floor Plans** (`/floor-plans`, with occupancy blurb); interactive accordion Q&A (native `<details>`, grouped, not FAQ-styled) with the questions above; booking + tour CTAs. SEO title/description/canonical/OG for the ad-landing page.
- `scripts/site-nav.js`: `LINKS` Events entry → `/events` (retargets the tab site-wide, one line). Legacy per-page Events source links updated for hygiene.

---

## Replies

- Ack `19fc86acc53e8da5` — back at keys, building the dedicated Events page now (plan + placeholder-answers note).
- Live confirm `19fc87049ed25cb2` — page live at https://whitewallstudios.co/events; recapped video / About / two cards / interactive grouped Q&A; listed real-answered items and the placeholders that are Drew's to lock (parking count + extra parking, night-before setup, soundproofing, catering/beverage specifics); invited add/cut/reword and offered to finalize answers together.

## Outcome

SHIPPED + LIVE + prod-verified. Booking-site **PR #112** (squash `06a5682`), merged → Vercel deployed → `/events` 200 on prod. Verified on prod: H1, event video (`BsyruYsoA-I`), both clickable cards + gallery link, `100 chairs and 10 eight-foot tables` real answer, 14 `<details>` accordions, canonical `/events`; `site-nav.js` Events tab → `/events`; flagship `#events` anchor kept. Ticket **DREW-39 → done**; revision-status **Round 77**. `last-seen-drew.txt` at `19fc864bc0e9f40e`. No escalation (static page + one nav line; no money/architecture/legal/scale/upstream). **Open loop = Drew's final answers** for the placeholder questions (owner: Drew's reply).
