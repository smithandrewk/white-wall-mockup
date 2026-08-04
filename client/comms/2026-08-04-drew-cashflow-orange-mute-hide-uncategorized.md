# Drew — Cash Flow: orange mute buttons + remove the empty Uncategorized sections

- **From:** Drew Shahoud (drew@entrpy.co)
- **Date:** 2026-08-04 17:44 ET
- **Medium:** email, thread `19fcdbf43e68c496`, msg `19fcebc8eacdc7f1`.

## Verbatim

> Incredible. I want you to make both the mute buttons a little more noticeable. Make them
> have an orange background. Also, get rid of that weird uncategorized section underneath the
> Fixed Expenses and variable expenses

## Triage — DREW-61 (dashboard-only, client-only, fast path, no money)

Follows DREW-60. `components/cash-flow.client.tsx` only.

1. **Both mute buttons → orange background, more noticeable** — the Mute toggle next to the
   Variable Expenses title AND the "mute" toggle in the Current/Historic/Projected statement
   card. Give them an orange background so the affordance stands out.
2. **Remove the empty "Uncategorized" section** shown under Fixed and Variable expenses. Only
   render the Uncategorized bucket when it actually has line items; hide it when empty. The
   parent section stays a drop target so a line can still be dragged out to uncategorized (the
   bucket reappears once it holds a line).
