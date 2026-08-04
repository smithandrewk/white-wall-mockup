# Drew — Max got NO owner-text on a real larger shoot (Fox still not activated)

- **From:** Drew Shahoud (drew@entrpy.co)
- **Date:** 2026-08-04 15:47 ET
- **Medium:** email, thread `19fcdbf43e68c496`, msg `19fce516794d6b41`, in-reply-to
  `<7F18A895-771B-4648-9054-41A64EF40F89@entrpy.co>` (the Cash Flow line-item confirm).
- **Attachment:** `2026-08-04-drew-max-no-text-larger-shoot.png` — screenshot of the owner
  text Drew received for the larger shoot (the one Max did not get).

## Verbatim

> Any progress on getting the texts to sen to max through fox? He didn't tight the other
> text that you said you set up – and we just got a larger shoot. I got it, but he didnt.
> And not just not through fox, bruin general, he didnt get any text. This is the one I
> got, he didnt get it, through fox or standard text.
>
> [screenshot of the owner text Drew received]

## Triage (reads through the typos)

"Any progress on getting the texts to send to Max through Fox? He didn't get the other
text that you said you set up — and we just got a larger shoot. I got it, but he didn't.
And not just not through Fox, but in general, he didn't get any text. This is the one I
got [screenshot], he didn't get it, through Fox or standard text."

This is **DREW-55**. The gap: on Round 96 we shipped a DIRECT text to Max (`MAX_PHONE`),
Drew reversed it on Round 97 ("through Fox, not a normal text"), so the direct text was
turned OFF and a **dark `FOX_*` transport** was shipped in its place — but the `FOX_*`
creds were never set, so the Fox path never went live. Net result: **Max currently gets
NOTHING** (direct text removed + Fox dark), and a **real larger-shoot owner alert just
fired to Drew but not to Max** — the exact coverage hole that opening between "turned off
direct" and "Fox not activated" created.

Drew's ask: get Max receiving these owner texts. Preference is **through Fox**; but the
loud part is "he didn't get ANY text" — Max missing real booking alerts is the live pain.

### What's needed to activate Fox (the 5 `FOX_*` values)
- `FOX_SMS_URL` — Fox's BlueBubbles server URL (its Cloudflare tunnel hostname)
- `FOX_CF_ACCESS_CLIENT_ID` / `FOX_CF_ACCESS_CLIENT_SECRET` — CF Access service token for Fox's tunnel
- `FOX_BLUEBUBBLES_PASSWORD` — BB REST password on Fox's server
- `FOX_HANDLE` — the iMessage handle Fox ingests on

These live on Max's / Fox's infrastructure. If they can't be self-served, the stopgap so
Max stops missing real shoots is to re-enable the direct text (`MAX_PHONE`) until Fox is
wired — but Drew explicitly rejected the plain text on Round 97, so that trade is a
judgment call for Andrew (coverage now vs. Drew's stated Fox-only preference).
