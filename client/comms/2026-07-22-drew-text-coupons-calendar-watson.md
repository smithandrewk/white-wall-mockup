# Drew text — coupons, calendar control, Watson integration

- **From:** Drew Shahoud
- **Relayed by:** Andrew
- **Date:** 2026-07-22
- **Medium:** text message (iMessage), relayed into the session
- **Ask:** "File issues please"

## Verbatim

> 1) enhance coupons to allow flat amount off.
>
> 2) make new coupon tab - not hiding it in campaigns. Just literally love it to a tab. It's good as is.
>
> 3) make a way in the dashboard to alter and interact the calendars for either cal. Taylor's mill and flagship. Make it so I can have Watson block things off upon a text.
>
> 4) connect Watson to dashboard so he can quickscope coupons and scheduling.

_("love it to a tab" reads as an autocorrect of "move it to a tab" — item 2 is
about promoting the existing Coupons page to its own top-level tab.)_

## Triage → Linear (WW project)

1. **Flat amount off coupons** — ALREADY SHIPPED this same day as **WW-12** (done):
   flat-dollar (`amountOff` cents, whole-order) codes end to end + `SHARON200`
   live. Drew's request is satisfied; noted on WW-12 rather than duplicated.
2. **Coupons as its own top-level tab** — filed **WW-13**. Coupons is currently a
   sub-tab folded under Campaigns (`components/sub-tabs.tsx` `CAMPAIGNS_SUBTABS`);
   the `/coupons` page already exists. Content stays as-is; only the nav entry moves.
3. **Interactive calendar control + Watson block-by-text** — filed **WW-14**.
   ⚠️ This WRITES to Acuity (create blocks / block off times), which BREAKS the
   dashboard's hard READ-ONLY-against-upstreams invariant. Architecture decision
   for Andrew, not a straight build.
4. **Connect Watson to dashboard — quickscope coupons + scheduling by text** —
   filed **WW-15** (related to WW-14).
