# Drew text — booking confirmation email + cleaning-fee threshold

- **From:** Drew
- **Date:** 2026-06-10 16:28
- **Medium:** Text message (iMessage)
- **Topic:** Per-booking confirmation email (client vs owner copy) + cleaning-fee threshold language

## Verbatim

> In this email that goes out to us from whitewall (we get one every booking which I love)
>
> 1) does the client get this exact same email?
>
> 2) if they do, can we delete the client facing language that says the 2.5 hour cleaning buffer?
>
> 3) if not, that's fine. Leave it. But:
>
> For both us, and client, it should be 35 or more people the cleaning fee is automatic. Not 50. Can we verify that's the case, and reflect it in the language there too?

## Notes / context (Andrew)

Three asks:
1. **Audit** — confirm whether the customer receives the same email as the owner notification (they do not: owner gets `api/notify-owner.js`, customer gets a separate Acuity confirmation; our Resend customer email is distinct). Answer the question.
2. **Remove client-facing 2.5-hour cleaning-buffer language** if the customer sees it.
3. **Cleaning fee threshold → 35+ automatic, not 50.**

⚠️ #3 is a **semantic change, not just wording.** Current code logic:
- `effectiveCount >= 50` → cleaning fee auto-applies unconditionally
- `effectiveCount >= 35 && eventIntent === "yes"` → fee applies with "team may reach out to waive" note
- 35–49 non-event → no fee

Drew is asking for **35+ = automatic, full stop.** Open question for Drew: does he want to drop the event-intent condition entirely (35+ unconditional auto), or keep event-gating but make 35–49 events non-waivable? Flagged `needs-decision`.

Code touchpoints: `api/create-checkout.js:222-227`, `api/notify-owner.js:193-194`, `api/_lib/acuity.js:135-136,280-282`, `api/booking-callback.js:122`, `api/_lib/notify-sms.js:27`.
