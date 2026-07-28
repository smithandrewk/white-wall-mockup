# Drew email — remove Brittany from campaigns + broken Unsubscribe link

- **Source:** Gmail, thread "WhiteWall dashboard revisions" (`19ed260797a3f02c`)
- **From:** Drew Shahoud <drew@entrpy.co>
- **Date:** Tue, 30 Jun 2026 21:39:11 -0400
- **Msg id:** `19f1b54af8da0d57` (`<79045D13-B5B3-4E14-B2F8-72BD38ED84C5@entrpy.co>`)
- **Class:** change-request (dashboard) + incident (broken unsubscribe = compliance)

## Verbatim

> Pip we need to remove this email from the email campaigns from whitewall dashboard email campaigns. brittany.isenberg@gmail.com
>
> Also, she said that our Unsubscribe link is broken. Can you look into that? We need to make sure people can unsubscribe and get off the email list.

## Triage

Two items, both dashboard (`wws-dashboard`):

1. **Remove `brittany.isenberg@gmail.com` from campaigns** — suppress/unsubscribe this
   address so no future campaign email goes to her. Internal data op. Do it.
2. **Unsubscribe link broken** — real compliance bug (people must be able to unsubscribe).
   Investigate the unsubscribe flow (link generation in the campaign email + the endpoint
   that handles the click) and fix. Compliance-positive fix, no policy change → no gate;
   gate is `npm run build`. Ship-now once root-caused.

Neither is money/architecture/legal-policy/customer-scale send. Both proceed autonomously.
