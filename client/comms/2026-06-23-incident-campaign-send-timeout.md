# Incident — campaign full-list send timed out (200/1267 sent) — RESOLVED 2026-06-24

> **RESOLVED 2026-06-24 ~10:42 ET.** Full list drained: **1,267/1,267 sent** (1,067 new,
> 200 skipped by idempotency, 0 failed, 0 suppressed, 0 duplicates), every send with a
> Resend message ID.
>
> **BOTH blockers were real — it took two fixes, not one:**
> 1. **Cloudflare ~100s timeout** (the original § diagnosis) — caused the first stop at 200.
>    Fixed by the deployed background/resumable send (PR #64).
> 2. **Resend daily sending cap** (the second theory — it was NOT wrong) — the 200 had
>    exhausted that day's quota, which is why a post-fix re-run on 2026-06-23 still did not
>    drain. **Andrew upgraded the Resend account to UNLIMITED daily emails**, lifting the cap.
>
> With the cap lifted, re-running the send over the loopback
> (`POST /api/campaigns/<id>/send?sync=1`, no edge timeout) pushed all ~1,067 through Resend
> in ~11.7 min at the ~2 rps throttle with zero rejections. Drew still has the stale "goes
> out in daily batches over a few days" message — a correction is worth drafting (outbound →
> confirm with Andrew first); the accurate story is "both the timeout fix and the Resend
> plan upgrade are now in place, so the whole list goes in one run."

- **2026-06-23 ~20:30.** Drew reviewed the deployed dashboard (positive: "everything looks amazing, email copy great"), ran the campaign TEST (worked), then hit SEND on the full client list. UI showed "Send Failed" after loading a while.
- **Drew msg:** thread 19ed260797a3f02c, 2026-06-23 20:34 (msgid 1B296FAA-7D4C-41AC-9F58-80E76F0F190D).

## Diagnosis (ground truth from the wws DB)
- Campaign `65980200-58da-42cb-8a7e-26f0a806290a` ("This weekend's open at White Wall — 25%"), status `sent`, **1,267 recipients, exactly 200 with sent_at** (last 20:30:43), then stopped.
- Root cause: `lib/campaigns/send.ts` is a SEQUENTIAL per-recipient loop (suppression + idempotency DB checks + one Resend fetch each, no throttle/background). The dashboard is behind a **Cloudflare tunnel with a ~100s origin timeout**; ~200 emails ≈ 100s of work, so the proxy/browser killed the request and the UI showed "Send Failed" — while ~200 had already gone out. No Resend 429/cap in the err log; it's a request-DURATION timeout, not a provider cap.
- **Idempotent + safe:** send.ts skips any recipient with a `sent_at` and never double-sends; suppression (unsubscribed/do_not_promo) is enforced per recipient. So the 200 will NOT be re-emailed; the other 1,067 simply did not send.

## State
- 200 sent (real), 1,067 pending. Campaign marked `sent` (so a naive re-run is refused — send.ts requires status `approved`; the resume path must allow a partially-sent campaign).
- No duplicates possible on retry (idempotency). No data corruption.

## Fix plan
1. CODE: make the send NOT one long synchronous request — run the send loop as a background job server-side (self-hosted next start survives a detached async loop), return immediately to the UI ("sending started, N queued, completes in background"). Add light throttle (~Resend 2/sec) + 429 retry. Make it RESUMABLE for a partially-sent campaign (skip sent_at, allow re-run on a 'sent'/'approved' campaign). Build on worker/v3-dashboard, redeploy wws.entrpy.co.
2. COMPLETE THIS SEND: deliver the remaining 1,067 (throttled, idempotent — skips the 200). Pending Drew's quick go (he initiated it but thinks it failed; outbound mass send, so confirm before firing).

## Comms
- Replied to Drew with the accurate state + asked whether to push the remaining 1,067 now.
- iMessaged Andrew (FYI, recoverable).

---

## UPDATE 2026-06-24 — corrected diagnosis + current state (the §8 diagnosis above is superseded)

The "request-DURATION timeout, no provider cap" read in the Diagnosis section was the
*first* theory and is **superseded**. Sequence of what actually happened on the night of
2026-06-23:

1. **Timeout fix shipped + deployed.** `worker/campaign-send-background` (commit
   `11a78a7`, "campaigns: background + throttled + resumable send") landed via PR #64 and
   is merged to `wws-dashboard` main. The running dashboard was rebuilt at 23:19
   (`.next/BUILD_ID` newer than the 21:17 merge) and `next start` (launchd
   `co.entrpy.wws-dashboard`, pid live) is serving it. So the send is now a detached
   background loop, throttled ~2 rps, with 429 retry, resumable (skips `sent_at`). The
   Cloudflare ~100s timeout is no longer the blocker.
2. **Re-run attempted, remaining still did not drain.** After the fix deployed, the
   remaining recipients still did not go out — which is what surfaced the *second* theory.
3. **Second theory (told to Drew, 23:23 EDT):** Resend hit a **daily sending limit** —
   the 200 that went out used up the account's daily quota, so further sends are rejected
   until the quota resets; the full list would then drain in daily batches over a few days
   unless the Resend plan is sized to cover the whole ~1,248 list in one day.

**Honest status of the two theories (unresolved):** the Resend-daily-cap theory is **not
yet hard-confirmed.** Against it: the DB shows *exactly 200 sent then stop*, which fits a
100s wall-clock timeout better than a quota (a quota tends to stop at a round number), and
200 already exceeds Resend's free 100/day cap, so the account is on a paid plan whose daily
limit we have not read off. For it: a post-fix re-run reportedly did not drain. Resend's
API exposes no quota endpoint, so the **only decisive test is to re-run the resumable drain
and watch** whether it sends or 429s on a daily cap. `campaign_recipient` has **no
status/error column**, so failed attempts leave no on-disk trace — worth adding so the next
incident is diagnosable.

**Current DB state (verified 2026-06-24):** campaign `65980200…`, status `sent`,
**200 / 1,267 sent**, 1,067 still pending. Idempotent: a re-run skips the 200, no
duplicates.

**Authorization on file:** Drew (relayed, 22:10 EDT) said "blast it to everyone we can on
the list, and don't send repeats… go ahead and continue the blast." The coupon is
time-bound ("this weekend"), so the drain is time-sensitive. This is still an outbound mass
send the previous session never executed, so confirm with Andrew before firing in this
session.

**Two open decisions for Andrew (the second is his, not Drew's):**
1. Re-run the resumable drain now to push the remaining 1,067 (also settles the
   timeout-vs-cap question empirically) — yes/hold.
2. **Resend plan sizing** — upgrade so one day's limit covers the full ~1,248 list, vs.
   letting it batch over several days. Billing/account call. Andrew's email said "Andrew
   and I are sorting that now."
