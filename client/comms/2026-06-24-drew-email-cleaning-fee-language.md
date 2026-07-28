# Drew email — cleaning-fee policy language (universal) + accounts status (verbatim)

- **Source:** Reply on thread `19ed260797a3f02c` ("Re: WhiteWall dashboard revisions"), work mailbox (andrew@entrpy.co).
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Wed, 24 Jun 2026 10:50:16 -0400
- **msgid:** `<1BDFBBFA-9C49-46AF-97C4-865468C040F1@entrpy.co>`
- **Repo:** white-wall-mockup (booking site copy). First live **Foreman** cycle.

---

## Verbatim message body

Hey Pip,

Generally across the entire white wall website, we need to make sure that our policy regarding the cleaning fee is universal. We have information about it: on the events tab, whenever you click Events on the website, as well as whenever you're booking the flagship location, on the right side underneath the Good to Know summary, it says, "Events with 35+ attendees require confirmation from our team." That's not necessarily true anymore.

It should just say, universally across the entire site, that events with 35+ attendees require a mandatory cleaning fee added to their booking. There is no approval from the team, and there is no gray area as to if we think they're going to need a cleaning fee or not. It's just a flat policy now.

Just triple check everywhere across the whole website to make sure that language is synonymous: 35 people or more, mandatory cleaning fee automatically added to the booking. The booking logistics are already set up that way, so we don't need to worry about that. It's just more the language themselves about that policy.

Also, what's the status update on setting up a login account process?

---

## Triage

**Two items in one email:**

1. **Cleaning-fee language sweep (change-request, fast path).** Intent is unambiguous: everywhere the site says events with 35+ attendees "require confirmation from our team" (or any approval/gray-area framing), change it to the flat policy — **35 or more attendees → a mandatory cleaning fee is automatically added to the booking. No approval, no gray area.** Drew confirms the booking LOGIC already does this (it's the 35+/50+ surcharge); this is a COPY-only change. He explicitly named the Events tab and the flagship booking "Good to Know" panel, and asked to triple-check the whole site for synonymous language. Ship-now, no money/architecture/legal/customer-send → no escalation.

2. **Accounts status (question).** "What's the status on setting up a login account process?" → answered in the reply to Drew: it's V3 item 7, scaffolded in the `v3-foundation` draft (PR #65, Supabase accounts + profile + card-on-file), but it shares ONE datastore/scheduler architecture decision with items 2 + 6 that is Andrew's call and is the gating blocker. Status = designed + scaffolded, paused on that one architecture decision.

**Action:** PR the copy sweep (worker/cleaning-fee-language), verify all instances changed, ship via Vercel. Draft the Drew reply (cleaning-fee shipped + accounts status). First live Foreman run → confirm the outbound reply with Andrew before sending.
