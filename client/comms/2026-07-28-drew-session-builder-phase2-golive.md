# Drew — Session Builder Phase 2 green-light (shareable locked customer link)

- **Source:** Gmail (account `andrew@entrpy.co`)
- **From:** WhiteWall Studios <contact@whitewallstudios.co>
- **Date:** Tue, 28 Jul 2026 16:28:22 -0400
- **Thread:** 19fa478568fc46a2 ("WhiteWall Dashboard Revisions")
- **Msg id:** 19faa6a33b20bfdb
- **In reply to:** my stale-tab resolution reply `19faa67c3f077b22`
- **Classification:** approval + change-request (Phase 2 build authorization)
- **Ticket:** DREW-21 (new — distinct from DREW-19/20; Phase 2 was explicitly parked as its own future work)

## Verbatim

> Looks great. I think it's ready for phase 2 is there anything you need to
> do on the backend to make that happen? I talked with Andrew and I believe
> you can handle phase 2.
>
> Let's go ahead and ship it and start building it out

## Triage

- **Change request, deliberative path** (largest build of the engagement so far).
- **What Phase 2 is** (design already settled in DREW-14 comms, 2026-07-27): saved
  Session Builder draft → shareable link → customer opens a pre-filled, **fully locked**
  replica of the booking flow (add-on carousel visible but grayed/unclickable, ownership
  adjustment lines + notes shown), fills in only their own info (email, terms, waiver),
  pays the **server-forced custom price** through the normal Square path, and the normal
  Acuity booking + emails follow. Changes = customer contacts Drew, who deletes the draft
  and makes a new one. KPIs (viewed vs paid) noted as a future nice-to-have.
- **Gate status:** this was PARKED behind the open soft escalation (reason=architecture,
  2026-07-27) for Andrew. Drew now reports he talked with Andrew and Andrew said pip can
  handle it. Drew's relay is second-hand, so: build + verify proceeds now (reversible),
  the escalation record gets updated to Andrew with the design + Drew's relay
  (assume-then-offer), and the money-path merge follows the standing rule — **staging
  booking dry-run before prod, every time**. No outcome of the escalation is asserted to
  Drew.
- **Drew's direct question** ("anything you need to do on the backend?") answered inline
  in the ack: yes — link signing/persistence, the locked offer mode on the site, and
  forcing the custom price into the Square checkout server-side; all on pip, nothing
  needed from Drew.

## Handling

- Ack + inline answer sent to Drew: (reply id recorded below when sent)
- Escalation update to Andrew via foreman-escalate (reason=architecture)
- Build: one PR per repo (booking site offer mode + dashboard link generation)
