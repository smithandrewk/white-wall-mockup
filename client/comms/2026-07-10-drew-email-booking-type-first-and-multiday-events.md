# Drew — booking-type-first + multi-day event window selection (flagship booking flow)

- **Source:** email (same thread `19f424228b20d389`, "Re: WhiteWall email campaigns — add this hero photo in PIP")
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Fri, 10 Jul 2026 14:23:01 -0400
- **msgid:** `19f4d44fadd246e7` (header `<1B5B956C-C959-4ACB-AED8-94B78A609047@entrpy.co>`)
- **Account (mailbox):** andrew@entrpy.co
- **Path:** DELIBERATIVE — Drew explicitly wants a PROPOSAL to confirm before the build
  ("give me what you think is the smoothest option, and then I can confirm it, and then you can
  actually initiate the build"). Foreman (me) is Drew's direct interlocutor; Andrew instructed
  2026-07-10 to run this back-and-forth autonomously, never ask Andrew for approval, ask Drew
  directly and always wait for his reply.

---

## Message — verbatim

> Hey Pip,
>
> I think we need to change something on the White Wall Studios website. I think the very first
> thing on the flagship location should be "If you're booking an event or a photo session." I
> believe we have everything else worked within our inner logic, but that should be the first
> selection. The reason I'm saying that is because if someone wants to book a multi-day event that
> goes across multiple days, then it's hard to do that with the current setup. Right now, they
> select the duration of a session they want to book, and then they have to select the date on the
> calendar for that specific duration. For photo/video sessions, that works perfectly, but for an
> event that could stretch a few days, that may be rather complex. See what you can do here. I
> think it would be best if we keep the general flow the same for photo/video sessions, but you
> have to select that first before you can select your duration and date. For event bookings, you
> click on Event first, and then you have all the same available duration options, but then maybe
> an option that allows you to select a window of time over a couple of days? More specifically, I
> have someone right this second who's trying to book October 3rd through 5th. They're probably
> going to want to add on a bunch of different add-ons:
> the setup crew (which I know is specific to the event bookings themselves, or at least it should be)
> chairs and all that stuff as well
> Now I don't know if they're going to want to book three full days starting the 3rd and ending
> with the 5th, or if they're going to want to book a half day on the 3rd and then the 4th and 5th
> as full days. I think that's the point: once they select Event, they should have some sort of a
> way to target the exact amount of time/window they need within the duration selection options. I
> think you know what I'm going for here, and then they can choose the actual dates themselves and
> the times that those dates start, if it is a starting point of a half day or something. Do your
> very best here and give me what you think is the smoothest option, and then I can confirm it, and
> then you can actually initiate the build.
>
> I almost wonder if it would be smoother if the very first thing they book is either photo or event.

---

## Foreman triage (2026-07-10)

**What Drew wants (two coupled changes to the FLAGSHIP / Powdersville booking flow):**
1. **Booking type first.** Make "Event or Photo/Video session" the very FIRST choice, before
   duration and date. Photo/Video keeps the current flow (type → duration → date/time). Event
   branches into a multi-day capable flow.
2. **Multi-day event window.** After choosing Event, let them target a window across multiple days
   (e.g. Oct 3–5), choosing per-day duration (e.g. half day on the 3rd, full days on the 4th/5th)
   and each day's start time, plus event-only add-ons (Event Setup and Reset Crew, chairs, etc.).

**Live driver:** a real customer is trying to book **Oct 3–5** right now.

**Gate:** DELIBERATIVE. Drew wants my recommended design, his confirmation, THEN the build. This
turn = propose the smoothest option to Drew + clarifying questions, then wait for his reply. No
build yet. Do NOT ask Andrew (his standing instruction 2026-07-10). See [[drew-self-authorizes-money]].

**Relevant existing work:** this is the V3 **item-2 multi-day cart** territory (T018). The V3
foundation already shipped a multi-session cart primitive (PR #65, money dark). The proposal
should lean on what exists rather than a from-scratch rebuild.
