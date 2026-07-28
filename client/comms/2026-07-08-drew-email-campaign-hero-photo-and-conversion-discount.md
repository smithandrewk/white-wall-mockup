# Drew — campaign hero photo + Taylors Mill→flagship conversion discount + data

- **Source:** email (NEW thread — the dashboard/infra does not yet watch this thread id)
- **Thread id:** `19f424228b20d389`
- **Subject:** WhiteWall email campaigns — add this hero photo in PIP
- **From:** Drew Shahoud <drew@entrpy.co>
- **Account (mailbox):** andrew@entrpy.co
- **Two Drew inbound messages** (Jul 8 11:04am + Jul 8 4:05pm). Logged verbatim below.
- **Attachment:** `WhiteWall Powdersville hero - windows light.jpg` (inline + attached original,
  1600x1066 JPEG, 289 KB, Sony A7IV, edited in Lightroom) — downloaded to
  `2026-07-08-drew-hero-photo-attachments/` in this comms dir.

---

## Message 1 — Jul 8 2026 11:04 AM EDT (msgid `19f424228b20d389`, header `<CA+_J_6Ww7u--NER8wArch2J90AFbeQ4Qcn+-tCn38Ne8cMadBA@mail.gmail.com>`)

> Hey Pip,
>
> Can you update the WhiteWall email campaigns in PIP to feature this
> Powdersville / flagship photo?
>
> [image: WhiteWall Powdersville hero photo with windows]
>
> Main goal: make the campaigns feel less like a generic “touch base” email
> and spice them up a little visually. The copy and overall campaign flow can
> stay the same — I just want this photo added as a hero image at the top (or
> somewhere prominent that looks cool).
>
> We can use this exact same photo every single time. When I preview the
> emails in the campaigns folder, I should be able to see the photo pop
> up/load properly in the email preview.
>
> I included the photo here for reference and attached the original as well.
>
> Thanks,
> Drew

---

## Message 2 — Jul 8 2026 4:05 PM EDT (msgid `19f4355b3c69b9c3`, header `<0D98100C-7D91-4826-B1FF-9A25044C4D7F@entrpy.co>`)

> Also pip, r we still giving people a 10% discount code when they go to book Taylors Mill to convert over to flagship location on the site? If not, let’s do that again, but bump it to 20% now, and make sure we give them a 20% code that actually works of course.e just off the session time alone. We should of course measure theamout of bookings made at flagship location WITH that specific convert code.
>
> Additionally, do you have the data on how many people have converted from the old 10% off code we had from Taylors Mill to flagship? Anyway we can see how successful that was in the past up to this point?

*(sic — verbatim, including typos. "e just off the session time alone" reads as "…code that
actually works of course. Just off the session time alone." — i.e. the discount applies to the
session line item only, not add-ons/fees.)*

---

## Foreman triage (2026-07-08 / processed 2026-07-09)

Three asks, three different gates:

### Ask 1 — hero photo on the campaign emails (FAST PATH, in-repo)
The WhiteWall email campaigns live **inside a White Wall repo** — `wws-dashboard`
(`emails/WeekendRecovery.tsx` = the one React Email template; `lib/emails/render.ts` = the
single render fn feeding both the Resend send and the dashboard preview; the Email tab on
`/campaigns/[id]` renders the stored `body_html` in a sandboxed `<iframe srcDoc>`). So this is
in scope → fast-path branch + PR. Build: add the Powdersville hero as a table-based `<img>` at
the top of the template. **Hosting decision:** the image must render in BOTH the dashboard
preview iframe AND real customer inboxes. Hosting on `wws.entrpy.co` would hit the Cloudflare
Access login wall for external recipients (same class of bug as the 2026-06-30
unsubscribe-behind-CF-Access issue), so host it on the **public booking site**
(`whitewallstudios.co`, Vercel) — the emails already link there. Two coordinated PRs:
image asset → white-wall-mockup; `<img>` → wws-dashboard. READ-ONLY upstreams preserved.

### Ask 2 — 10%→20% Taylors-Mill→flagship "convert" discount code (HARD GATE: money/pricing → escalated to Andrew)
- **Is there a live 10% code today?** There is a `WW10` coupon (10% off session, company-wide,
  no expiry, active) minted in the Round-7 batch on 2026-06-26 — but it is NOT a dedicated
  TM→flagship *conversion* code. There is **no** "give them a code when they go to book Taylors
  Mill to convert to flagship" mechanism: no such scoped code, no TM-page "Switch to
  Powdersville, here's X% off" offer surface, and no conversion tracking. (A generic `20OFF`
  20%-off-session company-wide code also already exists + is active.)
- **What system issues it?** The wws-dashboard coupon system → local `wws` Postgres `coupon`
  table → pushed to Vercel Edge Config (key `coupons`) → the booking site
  (`api/_lib/coupons.js`) reads it and discounts the **session line item only**, server-side;
  Square then charges the discounted total. Not Acuity, not Square-native.
- **What "make the 20% code actually work" entails:** deciding to run a 20%-off flagship promo
  (spends money on every flagship session booked with it), picking scope (reuse company-wide
  `20OFF` vs a new flagship-only code = calendar `6255578`), building the TM→flagship offer
  surface (doesn't exist), and wiring redemption tracking so we can "measure bookings made at
  flagship WITH that convert code." The pricing decision is the money gate.
- **Action:** `foreman-escalate --reason money`. Do NOT create/ship any code. Keep-warm reply
  to Drew ("finalizing on our end"), no outcome asserted.

### Ask 3 — data on conversions from the old 10% code (read-only analytics → answered inline)
- `WW10` (the only 10% code) has **0 recorded redemptions** since it was created 2026-06-26.
- The ONLY coupon redemption ever recorded in the dashboard ledger is 1× `TM-SAT-JUN27-25` (a
  25% weekend-campaign code, not a conversion code).
- There is no dedicated TM→flagship conversion code, so there is no conversion-specific data to
  report. Honesty boundary: the dashboard's redemption ledger derives from the Acuity ingest
  parsing `Promo code:` notes and only became authoritative ~2026-06-13; any older ad-hoc manual
  discount applied directly in Square/Acuity before then would not appear here. Net: no evidence
  of any redemptions on a 10% TM→flagship code, because no such distinct code/flow existed.
