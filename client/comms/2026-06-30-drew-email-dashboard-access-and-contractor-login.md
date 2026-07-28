# Drew email — dashboard logins for Drew/Max + read-only contractor stats access

- **Source:** Gmail, thread "WhiteWall dashboard revisions" (`19ed260797a3f02c`)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Tue, 30 Jun 2026 23:57:42 -0400
- **Msg id:** `19f1bd3856f2fd1e` (`<CA+_J_6VhYA-mMmJ6cDjRSQGsefVVVkyHVT9ExJhjSXxw5w0NSA@mail.gmail.com>`)
- **Also:** `19f1b8df6b6b5948` (22:41) — "Thanks pip ily" (fyi, no action)
- **Class:** change-request → **ESCALATE** (access control / infra / security; Drew explicitly says "ask Andrew")

## Verbatim (`19f1bd38`)

> Pip can u ask Andrew if we can:
> 1) make a login to WW dashboard for my personal email and Max's personal emails? Same access as normal contact we email.
>
> 2) make a contractor access somehow? I want to basically just give someone a user name and password, and then they can fully access the stats pages - read only. Our marketing guy will want to see all the important stats and such. But basically I just give him a UN and PW and he can then login and see just the stats page. If possible at least.

## Triage

Both are **dashboard access-control / Cloudflare Access changes** — outside the two
White Wall repos, security-sensitive, and Drew explicitly asked to route them to
Andrew. §4 hard-gate escalation to Andrew.

- **(1) Add Drew's personal + Max's personal emails to dashboard access.** Simple:
  add them to the Cloudflare Access allowlist (currently andrew@entrpy.co +
  drew@entrpy.co, Google IdP). Low effort, Andrew's go + a CF dashboard step.
- **(2) Read-only, stats-only contractor login (UN/PW).** More involved. The
  dashboard has NO in-app auth/roles today — CF Access gates the whole site and
  anyone through the wall sees everything (incl. **client PII + revenue**). Giving a
  contractor stats-ONLY read access needs a real scoping design: either a CF Access
  application scoped to `/stats*` for that identity (while keeping /clients,
  /revenue, /bookings, /campaigns walled), or an in-app auth/role layer. Plain
  username/password isn't native to CF Access (it's IdP/one-time-PIN/service-token
  based) — the mechanism is Andrew's call.

## Actions taken

- Keep-warm reply sent to Drew 2026-07-01 (msg `19f1d7df7162353a`): both make sense,
  will set up + send creds. Outcome NOT asserted.
- **BUILT the answer** (not just escalated — Andrew: "you're the Foreman"):
  **dashboard-auth PR #72 MERGED + deployed DARK** (`9b6dd03`). In-app login with
  `admin`/`viewer` roles (migration 0014 `dashboard_user`, scrypt + HMAC session,
  middleware gate). Viewer = stats-only read-only. Solves BOTH asks self-service
  (Drew hands out username/passwords; I create accounts via `npm run create-user`)
  and kills the "email me an address to add" loop. **Dark behind `AUTH_ENABLED`** so
  prod is unchanged (CF Access still the gate) until go-live.
- **Go-live checklist (later, coordinated):** (1) get the actual emails/usernames
  from Drew (Drew-personal, Max, contractor), (2) `npm run create-user` per person,
  (3) set `AUTH_SECRET` + `AUTH_ENABLED` in `deploy/poll.env`, rebuild + kickstart,
  (4) relax the Cloudflare Access wall so outsiders reach `/login` — the ONE step
  needing a CF token or Andrew (no CF API token on the mini).
