# Drew — booking site: lead-source dropdown + required "Other" text box

- Source: email, thread 19f6b708fb71898c, msg `19f6bb5d4cbc7012`, 2026-07-16 12:14, contact@whitewallstudios.co
- Repo: **white-wall-mockup** (booking SITE, not the dashboard). Behavioral booking-form change → staging pass required.

## Verbatim
"Another revision, but this is actually on the website itself, whenever they go through the booking process across all paths to book. Where it says 'How did you hear about us?' If they select 'Other', I want it to automatically pop up a text box where they have to fill in how they heard about us... The available options for the dropdown should be: Repeat customer, Google search, Instagram, Facebook, friend/referral, drove by, Instagram ad, Facebook ad, other. If they select 'other', the text box is required for them to fill in exactly how they heard about us, with a 3-character minimum."

## Triage / build (not §4-gated: booking-form field + validation, no money/architecture/legal/scale)
- `book-powdersville.html` + `book-taylors-mill.html`: replace the `#intake-lead-source` options with Drew's 9; add a hidden, required "Other" text box (`data-input='intake-lead-source-other'`).
- `scripts/booking-flow.js`: `state.intake.leadSourceOther`; select handler reveals/hides + clears the box on non-Other; input handler; validation in `isStepComplete(3)` baseComplete + `getValidationErrors` (Other ⇒ >=3 chars).
- Server records the EXACT text: `api/_lib/acuity.js` buildAppointmentNotes + `api/notify-owner.js` use `leadSourceOther` when leadSource === "Other" (so Acuity note reads "Heard about us: <their text>", not "Other"). Feeds the dashboard /stats/lead-source lens unchanged (parses whatever's in the note).
- Verify: node --check touched JS; staging deploy + Playwright (options present, Other reveals a required box, <3 chars blocks, resolves to the note); then prod (merge → Vercel auto-deploy) + confirm.
- Ack sent `19f6bc7162f7b335`.
