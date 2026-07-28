# Drew email — dashboard logins: Drew + Max (Google, full) + Matt (guest, read-only)

- **Source:** Gmail thread "WhiteWall dashboard revisions" (`19ed260797a3f02c`)
- **From:** Drew Shahoud <drew@entrpy.co> | **Date:** Thu, 2 Jul 2026 10:40:20 -0400
- **Msg id:** `19f23463acf91c32`
- **Class:** change-request (dashboard access / auth go-live). Caught by WATCH pass (auto-watch cron had died on prior session close).

## Verbatim
> Pip, can you get me an update on th login credential for me and max's personal email to the dashboard? We'd sign in through our google accounts.
> drewshahoud@gmail.com
> maxahuggins@gmail.com
> Of course, we get full access to do everything just like the contact WhiteWall email has .
>
> Also, can we make a guest login that logs in via username and password? He can see the ehwol dashboard – but only read access. And send any campaigns or anything.
> Make his credentials:
> UN: Matt
> PW: WhiteWall
>
> He'll just need a way to go to the url and log in. I'll send him the was.entrpy.co url.

## Triage

This is the **go-live** of the dashboard auth built DARK in PR #72 (Round 31). Three logins:
1. **Drew** — `drewshahoud@gmail.com`, full/admin, via Google.
2. **Max** — `maxahuggins@gmail.com`, full/admin, via Google.
3. **Matt** — guest, username/password (`Matt` / `WhiteWall`), **read-only** (can view the
   whole dashboard, cannot send campaigns). ("And send any campaigns" reads as "can't send
   any campaigns" — read-only = the `viewer` role, which is confined to `/stats*` and 403s
   write paths incl. campaign send.)

**Architecture reality (from the code):**
- The PR #72 in-app auth is **username/password only** (`ingest/create-user.ts`, scrypt+HMAC
  session). It has **no Google path**. Google sign-in exists ONLY at the Cloudflare Access
  layer (Google IdP), which grants FULL access with NO roles.
- Matt's read-only role only exists in the in-app auth, which requires `AUTH_ENABLED=1`. Once
  that's on, the in-app middleware gates EVERYONE — so Drew + Max would also need in-app
  credentials (username/password), contradicting "sign in through Google," unless Google OAuth
  is added to the dashboard first.
- Going live also requires **relaxing the Cloudflare Access wall** so outsiders (Matt, and
  Drew/Max on their personal Gmails) can reach `/login`. That needs a CF token the mini does
  not have = Andrew.

**Disposition:** ESCALATED to Andrew (architecture + security-boundary + outside-repo CF +
needs his CF token). Not a Drew-authority question (Drew owns who gets dashboard access) — an
execution gate only Andrew can clear. Keep-warm reply sent to Drew (no outcome asserted).
