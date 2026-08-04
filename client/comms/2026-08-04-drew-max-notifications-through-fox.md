# Drew — route Max's notifications through Fox, NOT a direct text (DREW-55 revision)

- **From:** Drew Shahoud (drew@entrpy.co)
- **Date:** 2026-08-04 13:07 ET
- **Medium:** email, thread `19fcdbf43e68c496` (its own thread; reply to Foreman's Max-live
  confirm), msg `19fcdbf43e68c496`, in-reply-to `<620B2232-F1D1-4531-8B83-CDB43962EEB4@entrpy.co>`.

## Verbatim

> Lets do it through for for max. Not through a normal text.

(Reads "Let's do it through **Fox** for Max. Not through a normal text." — a reply to the Max
setup confirm, opting into the Fox-routing alternative Foreman offered and rejecting the direct
text just shipped.)

## Triage — DREW-55 revision

- Drew does NOT want the direct text to Max's number (803-682-5691) that PR #120/#128 shipped +
  went live this session. **First action: turn OFF the direct text** (unset MAX_PHONE on both
  surfaces) so Max stops getting the normal texts he doesn't want. Reversible, directly instructed.
- He wants the same notifications routed **through Fox** (Max's OpenClaw agent) instead. This is a
  CROSS-AGENT integration: Fox is Max Huggins's agent (Watson is Drew's). To deliver "through Fox"
  we need Fox's inbound delivery mechanism (a webhook/API endpoint, or a handle Fox monitors) —
  which we do not currently have, and which touches connecting to someone else's agent (recreation
  ladder). → needs Fox's endpoint + Andrew's cross-agent sign-off. Escalate/clarify, do not fabricate
  an endpoint. Fox routing NOT built blind.
