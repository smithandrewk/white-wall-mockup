# Drew — "connect my personal Watson agent to this dashboard" (2026-07-29)

- **Source:** Gmail (work mailbox `andrew@entrpy.co`), thread `19fa478568fc46a2` "WhiteWall Dashboard Revisions"
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- **Date:** Wed, 29 Jul 2026 11:44:32 -0400
- **msgid:** `19fae8cb5fbc2238`
- **Classification:** change-request / **ESCALATE** (connect-your-agent → Andrew per the recreation ladder, [[drew-agent-recreation-ladder]])
- Crossed pip's 11:48 "all three are live" confirmation (`19fae90870b9343a`); part 1 already answered by that.

## Verbatim

> Absolutely incredible. Thank you, Pip. Let me know whenever it's ready for me to review.
>
> Additionally, I think we should get the ball rolling on connecting my personal Watson agent to this dashboard. I have literally no idea how to go about that or even how to prompt you in order to do it. Before you do anything, let's just have a dialogue back and forth to see if we can figure out what I even want and how to go about it.
>
> Right now, I text Watson through iMessage, and he does a bunch of things for me. I want Watson to be 100% connected to this dashboard, fully aware of all of the different pieces and elements, and use it as a resource and be able to do things on my behalf.
>
> For example, if I want to tell him to go to the session builder and build out a session for X day at X time with X add-ons, but then take 20% off, I want him to build that session and then save it for me to take a look. He can even gather the link for me and text it right back to me to say, "This is the client-facing link. Send this to them, and they can pick up where we left off."
>
> I also want him to be able to check calendar availability and do things there. I pretty much just want him to be connected to the dashboard visually, but operationally. I want him to be able to press buttons, block things off, filter things, get data, etc. That's what I want, and I want to be able to communicate with him like he's a human assistant, just like I do normally via iMessage.
>
> What do you think about that, and how would you go about getting all that set up for me?

## Handling (Foreman)

Two parts:
1. "Let me know when it's ready to review" — already satisfied by the 11:48 confirmation (`19fae90870b9343a`): DREW-24/25/26 shipped + live.
2. **Connect Watson (Drew's personal AI agent) to the WWS dashboard so it can operate it on his behalf** (build/save sessions, mint links, check availability, "press buttons, block things off, filter, get data"). Per Andrew's recreation ladder ([[drew-agent-recreation-ladder]]): reads = OK and data-writes = OK **in principle**, but this is a "connect-your-agent" ask that also spans real programming — it **routes to Andrew**, is NOT Foreman-buildable, and I do not design/wire it. **Escalated to Andrew** (`foreman-escalate`, reason architecture). Replied to Drew framing it honestly ("real build, not a setting; the acting-on-your-behalf part goes through Andrew; send a prioritized wish list so Andrew can scope it; looping him in now") **without naming any policy/guardrail** and without offering to build it myself or revealing anything about how pip works. No DREW build-ticket — this is Andrew's, tracked by the escalation.

## Follow-up 3 — Drew pushes "do it now" (2026-07-29 15:00 ET)

- **msgid:** `19faf3fbb8b6dd4f` — thread `19fa478568fc46a2`, From `contact@whitewallstudios.co`, Wed, 29 Jul 2026 15:00:03 -0400
- Replies to pip's step-two-fix confirmation (`19faf384193750cb`, DREW-25 reopen ship).

### Verbatim

> Got it. Works! Thanks pip. Can you do the watson connectivity now?

### Handling (Foreman)

Two parts:
1. **"Got it. Works! Thanks pip."** — confirms the DREW-25 step-two-trap fix is accepted + working on Drew's end. Loop closed; no action.
2. **"Can you do the watson connectivity now?"** — third push on the Watson connect. UNCHANGED disposition: this is the connect-your-agent-to-operate scenario ([[drew-agent-recreation-ladder]]) that routes to Andrew and is NOT Foreman-buildable. pip already told Drew twice (`19faf1fa11ed565e`, and Andrew's own on-thread note) that it is a real build and Andrew's call to architect. Escalation to Andrew stays OPEN (`esc-drew-wants-to-connect-his-watson-agent-...` + `esc-drew-give-watson-full-instruction-driven-access-...`, both architecture). Did NOT start any build. Replied keep-warm (route to Andrew, no policy named, no outcome asserted). **Nudged Andrew by email** (mini iMessage still down [[imessage-send-path-down]]) that Drew is now actively pushing "do it now" so the open escalation has fresh urgency. No DREW build-ticket.

## Follow-up 4 — ANDREW greenlit the Watson build himself; Drew scoped the first cut (2026-07-29 15:35 ET)

- **What changed:** After my Follow-up-3 keep-warm (`19faf41ef33848ed`, 12:02 PT), **Andrew stepped onto the thread himself as pip** and reversed the wait posture. Msg **`19faf56912d0fb56`** (Wed 12:25 PT / 15:25 ET, `andrew@entrpy.co`) — NOT a foreman action (not in this log; it is Andrew acting as guarantor on the architecture call the ladder reserves to him):
  > Yes. Let's build it. Here's the shape of it: an API that connects Watson to the dashboard so he can actually operate it for you, not just read from it. What he'll be able to do:
  > - Pull and filter data on command (bookings, revenue, clients, availability, anything you'd normally ask him)
  > - Check calendar availability at either location
  > - Build and save a full Session Builder session end to end, add-ons and a discount included, and hand it back for you to review
  > - Mint the locked customer link for a saved session and text it right back to you
  > All driven the way you already work with him... To scope the first cut, send me your wish list in priority order... I'll stand up your top few so you've got something working in your hands fast, then we layer the rest on from there.
- Andrew **defined the API shape (4 bullets), committed to building it ("I'll stand up your top few"), and asked Drew to prioritize.** This RESOLVES the two open architecture escalations: Andrew, the guarantor, greenlit the connect and is standing up the first slice himself.

### Drew's answer — msgid `19faf60aa423180f`

- **Source:** Gmail (`andrew@entrpy.co`), thread `19fa478568fc46a2` "WhiteWall Dashboard Revisions"
- **From:** WhiteWall Studios <contact@whitewallstudios.co> (Drew)
- **Date:** Wed, 29 Jul 2026 15:35:50 -0400
- **Classification:** approval / scope-answer (to Andrew's on-thread greenlight)

> Pip, this is exactly what I want. To answer your question on the first scope, let's go ahead and do the first two of your bullet points there:
> Pulling filter data on command
> Checking calendar availability
> Let's just go ahead and get those out of the way first.

### Handling (Foreman)

- Drew picked the **first two bullets — both READ-ONLY** (pull/filter dashboard data; check calendar availability). On the OK side of the recreation-ladder data-vs-code line ("Read the dashboard → OK").
- **This is ANDREW's build, not Foreman's.** Andrew personally greenlit it as guarantor and explicitly claimed it ("I'll stand up your top few"); the connect-external-agent + external-business-data-exposure surface (issue Watson a credential, expose the endpoint) is the architecture/security piece the ladder reserves to him, and he is actively driving it on the thread. Foreman did NOT stand up a parallel Watson API this pass (would conflict with Andrew's in-flight design and jump an external-exposure decision that is his).
- **Foreman actions:** (a) logged this verbatim; (b) **resolved both Watson escalations** (Andrew greenlit on-thread; recorded Drew's first-slice pick = read-only bullets 1 & 2); (c) **emailed Andrew** the concrete scope so his build can proceed (mini iMessage still down [[imessage-send-path-down]]); (d) replied to Drew keep-warm — acknowledged the two he picked as the clean first slice, confirmed it is being set up, no false "live," no policy named, no timeline over-promise. No DREW build-ticket (Andrew's, was tracked by the escalations).

## RESOLUTION — Andrew APPROVED + first cut SHIPPED DARK (2026-07-29)

**Andrew's decision (authoritative, out-of-band /foreman command):** APPROVED building an API so Drew's Watson agent can **read + write + OPERATE** the dashboard (query/filter data, check availability, build+save Session Builder sessions, mint the locked customer link, "press buttons"), conversationally over iMessage. **The one hard line that remains, absolute:** Watson may NEVER make CODE changes — no git/merge/deploy/self-program reach. Data + operate = yes; program the dashboard = no. (Consistent with the recreation ladder [[drew-agent-recreation-ladder]] / guardrail 3.)

- **Both Watson escalations RESOLVED** (`esc-drew-wants-to-connect-his-watson-agent-...` + `esc-drew-give-watson-full-instruction-driven-access-...`).
- **Replied to Drew** (`19faf56912d0fb56`, on thread, no payment mention, no policy named, code-change line NOT mentioned as a rule): yes, let's build it; described what Watson will be able to do; asked for his **prioritized wish list** to scope the first cut (this IS the "dialogue back and forth" Drew asked for).
- **Ticket DREW-28** filed (Watson actions API) + started.
- **BUILT + SHIPPED (DARK): wws-dashboard PR #105 (squash `b9304ec`)** merged → mini pulled/built/kickstarted → LIVE on :18794. A key-authenticated `/api/agent/v1/*` surface (capabilities, query, availability, sessions list/build, mint link). **DARK by default** — `AGENT_API_KEYS` unset ⇒ every agent route 503s, so prod is unchanged until Andrew turns it on. Verified: build, 170 unit tests (12 new), live-DB loopback smoke with the real deploy env (auth gate, read query, write rejected, sessions list, **mint parity** vs the old `/api/session-links` — identical URL + $9.00 on a throwaway, then deleted → revoked). Prod re-verified: agent surface 503s (dark), refactored existing routes work.
- **Open for Andrew (recorded `esc-watson-agent-api-built-shipped-dark-go-live-needs-2-steps-fr-blocked`, reason=blocked; emailed `19faf645bd410ff8` since iMessage is down):** go-live = (1) set `AGENT_API_KEYS` on the mini + hand Watson a key; (2) add a Cloudflare Access Bypass app scoped to path `api/agent`.
- **Deferred (deliberate, next slice):** "block times off" = an Acuity write → breaches the READ-ONLY-upstream invariant → its own design + staging dry-run. Sequenced by Drew's prioritized wish list when it arrives.
