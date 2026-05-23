# Lisa Brantly Misroute — Production Incident Post-Mortem

**Date discovered:** 2026-05-22 ~21:30 EDT
**Reporter:** Drew (via text to Andrew, forwarded Acuity owner-notification email)
**Severity:** Customer-facing — wrong address on confirmation email, appointment on wrong calendar
**Status:** RESOLVED — Drew moved the appointment manually; code fix shipped to prevent recurrence

---

## Customer impact

Lisa Brantly booked **Taylor's Mill - Two Hours** on `whitewallstudios.co` at 2026-05-22 08:06 EDT for **2026-05-29 11:00 AM**. She paid $170 via Square (production). The Acuity-generated confirmation email she received showed the **Powdersville address (2709 Powdersville Rd. Easley, SC 29642)** instead of the Taylor's Mill address — because the appointment landed on the STAGING calendar in Acuity, and the STAGING calendar's `location` field inherits "Powdersville" from however Drew configured it.

If unaddressed, Lisa would have shown up at the wrong studio.

## Timeline

| Time (EDT) | Event |
|---|---|
| 2026-05-22 ~17:00 | Andrew asks Drew to set up a STAGING calendar in Acuity for the new staging-env work |
| 2026-05-22 ~17:30 | Drew creates calendar id `14110701` named "STAGING" and **adds it to every existing prod appointment type's `calendarIDs` array** (rather than creating new STAGING-specific types). Each prod type now belongs to `[14110701, prod_cal_id]`, with STAGING first |
| 2026-05-22 17:48 | Andrew sets `ACUITY_STAGING_CALENDAR_ID=14110701` in Vercel staging env |
| 2026-05-22 18:00 | First successful staging smoke test — `[STAGING] Andrew Smith` appt created on STAGING calendar ✅ |
| **2026-05-22 20:06** | **Lisa Brantly books TM - Two Hours on `whitewallstudios.co`. Production code POSTs to Acuity without specifying `calendarID`. Acuity defaults to the first calendar in the type's `calendarIDs` array → 14110701 (STAGING). Lisa's confirmation email shows the Powdersville address.** |
| 2026-05-22 ~21:25 | Drew receives owner-copy confirmation email titled "Lisa Brantly: Taylor's Mill - Two Hours (STAGING)" — notices the STAGING tag |
| 2026-05-22 21:32 | Drew texts Andrew: "It looks like Lisa here tried to make an appointment for two hours and it looks like it went through properly but it also looks like it is tied to the staging version?" |
| 2026-05-22 21:35 | Andrew + Claude diagnose: Acuity's default calendar selection picked STAGING because it was first in the array |
| 2026-05-22 21:38 | Code fix shipped: `api/booking-callback.js` now always passes `calendarID` explicitly (`stagingCalendarID() || CALENDAR_IDS[bookingState.location]`). Commit `c7a4749`. Deployed to prod ~21:40 |
| 2026-05-22 21:40 | Audit confirms only Lisa is affected — last 200 appointments scanned, only 2 entries on STAGING calendar: Lisa + Andrew's `[STAGING]` smoke test |
| 2026-05-22 21:42 | Andrew tells Drew to drag Lisa's appointment from STAGING to Taylor's Mill in the Acuity dashboard and send Lisa a corrected confirmation |
| 2026-05-22 ~22:00 | Drew confirms the fix is done |
| 2026-05-22 22:15 | Broader audit run on the entire booking pipeline. Three more calendarID-related bugs found and fixed (commit `e48ba94`): `availability-dates.js`, `availability-times.js`, `verify-availability.js`, `create-checkout.js` cleaning-fee buffer check, and `qbo-auth.js` / `qbo-callback.js` baseUrl hardcoding |

## Root cause

Acuity's `POST /appointments` endpoint requires `calendarID` to be explicit when the appointment type is a member of multiple calendars. **The API documentation does not state this clearly.** When `calendarID` is omitted and the type has multiple calendar members, Acuity silently picks the first one in the array — which became STAGING the moment Drew added it.

The same gotcha applies to **availability queries** (`/availability/dates`, `/availability/times`): without `calendarID`, Acuity returns the union of availability across every calendar the type is on. This was a second, undiscovered booking-failure mode at the time of Lisa's incident — a prod user could see a slot as available because it was free on STAGING, then payment would complete, then `POST /appointments` (with our new `calendarID` fix) would fail because the slot was actually blocked on the prod calendar. They'd hit `/booking-error` after paying.

## Fix

Two commits:

1. **`c7a4749` — URGENT: always pass calendarID — prod bookings landing on STAGING.** Adds explicit `calendarID` to the appointment-create POST in `api/booking-callback.js`. Pattern: `stagingCalendarID() || CALENDAR_IDS[bookingState.location]`. Shipped to both `main` and `staging` branches.

2. **`e48ba94` — URGENT: pass calendarID on every Acuity availability + buffer query.** Closes the second hole. `availability-dates.js`, `availability-times.js`, `verify-availability.js` all now compute `calendarID = stagingCalendarID() || TYPE_TO_CALENDAR[appointmentTypeID]` before calling Acuity. `create-checkout.js` cleaning-fee buffer check now uses `stagingCalendarID() || CALENDAR_IDS[location]` (was hardcoded to the prod calendar). `qbo-auth.js` and `qbo-callback.js` now derive `baseUrl` from `req.headers["x-forwarded-host"] || req.headers.host` (was hardcoded to `white-wall-mockup.vercel.app`).

Verification: pulled live Acuity availability for PV-1-Hour for June 2026 via three queries — direct prod-calendar query returned 27 dates, direct STAGING-calendar query returned 30 dates, the new prod endpoint returned 27 dates (filtered correctly), the new staging endpoint returned 30 dates. The 3-day delta is real cross-calendar bleed that the old code was exposing to prod users.

## Lessons / rules now codified

- **ALWAYS pass `calendarID` on every Acuity call that takes `appointmentTypeID`.** Documented in `vault/Acuity.md`, `vault/Staging.md`, and `CLAUDE.md`.
- **Staging fail-safe:** if `ACUITY_STAGING_CALENDAR_ID` is ever unset while `STAGING=1`, `booking-callback.js` MOCKS the Acuity write instead of falling through. Protects against the same shape of incident if config is ever cleared. See the `stagingMocked` branch.
- **Cross-environment HMAC isolation works:** because staging has a different `BOOKING_SECRET` than prod, a staging-signed checkout state replayed on prod would fail signature verification. We learned this the painful way when an earlier hardcoded redirect URL sent staging payments to prod's callback — invalid-signature errors caught the issue at the door.

## Customer follow-up

Drew sent Lisa a corrected confirmation with the Taylor's Mill address. Booking is for 2026-05-29 11:00 AM, $170, paid. No refund needed.
