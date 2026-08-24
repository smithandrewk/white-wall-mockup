# Watson WhiteWall Skill — Dashboard is the Source of Truth

This is a standing skill for Watson. Once it is loaded, you do not have to prompt him
about WhiteWall every time. Any time WhiteWall comes up, he goes to the WhiteWall
dashboard first and answers or acts from there.

There are two parts below: **Part 1** is the skill text to give Watson (paste it in as
described in Part 3). **Part 2** is the quick intent map so you know what he can do.
**Part 3** is where to put it and how to feed it so it sticks.

---

## Part 1 — The skill (paste this to Watson verbatim)

> **WhiteWall operating rule (always on).**
>
> Whenever anything about WhiteWall Studios comes up, the WhiteWall dashboard is your
> single source of truth. Do not answer from memory or guess. Before you answer a
> WhiteWall question or take a WhiteWall action, go to the dashboard.
>
> **How you reach it.** The dashboard exposes an action API. Always start by fetching
> its capabilities so you are working from the current, live list of actions (new
> actions get added over time, so never rely on a stale list):
> - `GET /api/agent/v1/capabilities` with your WhiteWall API key as `Authorization: Bearer <key>`.
> Read the returned `actions` and use the one that fits the request. Send the key on
> every request.
>
> **The rule of thumb by intent:**
> - Any **number, stat, revenue, projection, or "how are we doing" question** →
>   `get_metrics` (these are the exact figures the owner sees on screen, so your answer
>   matches his). For a detailed or custom data question not covered by get_metrics, use
>   `query_data` (a single read-only SELECT). Never make up or estimate a number.
> - **Availability / open times / open dates** → `check_availability`.
> - **Block off time on the calendar** (hold a window so the site stops selling it) →
>   `block_off`. Use this action. Do not write to Acuity directly. Pass the studio
>   (`powdersville` or `taylors-mill`), the date, and 24 hour start and end times. If it
>   returns `armed:false` or a 403, say so plainly and stop, do not fall back to editing
>   the calendar another way.
> - **Saved sessions / custom offers** → `list_sessions`, `build_session`, `mint_link`,
>   `delete_session`.
> - **Coupons** → `list_coupons`, `create_coupon`, `deactivate_coupon`.
> - **Campaigns** → `list_campaigns`, `create_campaign` (a campaign is created as a draft
>   only, the owner approves and sends it in the dashboard).
>
> **Powdersville first** whenever both studios appear together.
>
> **The only two things you do NOT route through the dashboard:**
> 1. When the owner asks you to **make a Square payment link**, you do that directly with
>    Square, as you do today.
> 2. Your existing **cancellation refund routine** (scanning email for cancellation
>    notices and refunding) stays exactly as it is.
>
> Everything else about WhiteWall starts at the dashboard.

---

## Part 2 — Intent map (for your reference)

| You say something like… | Watson uses |
|---|---|
| "How much did we make this month?" / "What's our projection?" | `get_metrics` |
| "Who's on the brink? Draft them a reach out." | `get_metrics` (returns the draft) |
| "Pull me the bookings for X" / a custom data question | `query_data` |
| "Is Powdersville open Saturday afternoon?" | `check_availability` |
| "Block off Powdersville tomorrow 9 to 10 PM" | `block_off` |
| "Build a session for this client / send them a link" | `build_session` → `mint_link` |
| "Make a 20% coupon for Taylor's Mill" | `create_coupon` |
| "Where does the weekend campaign stand?" | `list_campaigns` |
| "Make me a Square payment link for $X" | Square directly (not the dashboard) |
| a cancellation comes in, refund them | his existing refund routine |

Because Watson refetches capabilities each time, any new dashboard action added later
shows up for him automatically, with no change to this skill.

---

## Part 3 — Where to put it so he does not forget

Load this as a **persistent skill / standing instruction**, not a one-off chat message,
so it is part of how Watson operates and survives across conversations:

1. Add the **Part 1** block to Watson's persistent instructions (his skills or standing
   system prompt, wherever his always-on rules live). That is the layer that applies to
   every conversation without you re-pasting it.
2. Make sure his WhiteWall **API key and dashboard base URL** are stored where he can use
   them (he already has these from when he was connected). The actions in Part 1 are all
   relative to that base URL.
3. Test it in one line, no hand holding. Tell him: **"Block off Powdersville tomorrow 9
   to 10 PM"** and separately **"How much have we netted this month?"** He should do both
   through the dashboard without you spelling out the steps.

If he ever says he can only read availability or cannot find an action, have him refetch
capabilities first (`GET /api/agent/v1/capabilities`), then retry. That refresh picks up
anything newly added.
