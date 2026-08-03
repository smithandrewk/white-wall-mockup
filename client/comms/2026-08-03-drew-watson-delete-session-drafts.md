# Drew — Watson can't delete session drafts

- **Source:** Gmail (work mailbox `andrew@entrpy.co`)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Mon, 3 Aug 2026 18:39:48 -0400
- **Thread:** 19fa478568fc46a2 ("WhiteWall Dashboard Revisions")
- **Message id:** 19fc9c8b2ab839cc
- **Attachment:** IMG_0822.png (iMessage screenshot of Drew ↔ Watson) — saved at
  `attachments/2026-08-03-watson-delete-drafts/IMG_0822.png`

## Verbatim

> Watson can't delete session drafts. See screenshot. Let's fix that

### Screenshot content (Watson's iMessage reply, transcribed verbatim)

Drew (blue, top): "Perfect. How many saved drafts do we have right now? Did you
just revise the current one that we built? Or did you make an entire duplicate? If
you build another version that's more properly, that's fine, but make sure [to
delete] the old one."

Watson (grey reply):

> You're right to check.
>
> Dashboard shows 3 saved drafts right now:
>
> 1. Watson Drew Test - Corrected 100 Chairs — correct one
> 2. Watson Drew Test — old incorrect 50-chair version
> 3. Veronica Adams – Baby Shower
>
> I did make a duplicate, not a revision. I tried to delete/archive the old one
> through the API, but the current WhiteWall action catalog does not expose a delete
> draft action yet.
>
> So the old incorrect draft is still there for now. The one to keep/use is:
>
> Watson Drew Test - Corrected 100 Chairs

## Triage

- **Class:** change-request (agent-API capability gap).
- **Ask:** add a *delete session draft* action to the Watson agent API so Watson can
  remove a saved draft (e.g. the stale duplicate) instead of leaving it around.
- **Path:** fast / pre-authorized. This is a **local `session_draft` table write**
  (delete a row), not an upstream Acuity/Square/QBO write, not money, not code. It sits
  inside Watson's data-write ladder (read OK, write-data OK; only code/git/deploy is the
  hard NO). The dashboard's own Delete button already does exactly this
  (`app/api/session-drafts/[id]/route.ts` DELETE) with the correct revoke-customer-link-
  first logic; the agent surface just never got the DELETE verb. DREW-28's own header
  named "any edit/delete of a saved session over the API" as the sequenced next slice.
- **No hard gate.** Deleting a pre-payment draft is not spending money; the revoke-link
  step (already coded) just makes a link Drew wants gone stop working — same as clicking
  Delete in the dashboard UI.

## Build

- Extract `deleteSessionDraft(id)` into `lib/session-builder/draft-actions.ts` (twin of
  `createSessionDraft`): revoke the customer link first (required — if revoke fails the
  draft stays), then `delete from session_draft`. Return a discriminated result.
- Refactor the dashboard `app/api/session-drafts/[id]/route.ts` DELETE to call it (one
  implementation, no drift).
- Add `DELETE /api/agent/v1/sessions/[id]` (key-authenticated) calling the shared fn.
- Add `delete_session` to the agent `capabilities` catalog so Watson can introspect it.
