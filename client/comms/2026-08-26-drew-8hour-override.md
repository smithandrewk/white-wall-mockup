# Drew — 8-Hour Override in Session Builder (owner-only)

- **Source:** Gmail (pip@entrpy.co)
- **From:** Drew Shahoud <drewshahoud@gmail.com>
- **Date:** Wed, 26 Aug 2026 16:55:51 -0400
- **Thread:** 1a03ee7679c69e27 (White Wall dashboard revisions)
- **Message id:** 1a03fdbc854e1ec5
- **Class:** change-request
- **Path:** deliberative-lite (dashboard-only, owner tool, additive)

## Verbatim

> Pip another dashboard revision.
>
> Right now, we dont allow the 8 hour session to book earlier than 12:30pm. Thats fine by default, but I want the ability to override that when im building the session out in the session builder. Can you make a way to have a small button that pops up that says 8-Hour Override and put it next to the "Available Times For X day" after I select the 8 hour session and the date on the calendar – but only in the session builder for me as the owner to override my own 8-hour rule. Not on the site.
>
> And then of course we need other make sure it reflect sin the schedule properly too.

## Triage

- **Scope:** wws-dashboard Session Builder ONLY. Explicitly "Not on the site" — the public
  booking-site 12:30pm floor for the 8-hour session stays as-is.
- **Ask:** a small "8-Hour Override" button next to "Available Times For X day" that appears
  after the 8-hour session + a date are selected in the Session Builder. Toggling it lifts the
  12:30pm floor so earlier start times become selectable. Owner-only (it lives only in the
  dashboard, which is already gated).
- **"reflect in the schedule properly":** the overridden earlier start must carry through to
  the generated/locked session so the booked slot and any schedule view show the real earlier
  start, not the 12:30pm default.
- **Gate:** none. Dashboard-only UI feature, additive, reversible, no customer-facing change,
  no money/architecture/legal/scale. Drew is the owner overriding his own rule in his own tool.
- **Ticket:** DREW-93 (in_progress).

## Reply (ack) — sent

- pip → drewshahoud@gmail.com, 2026-08-26, msg id `1a03fe0639cf27ae` (autonomous, cycle approved).
  Told Drew: button shows next to "Available times for [day]" after 8hr + date, off by default
  (12:30 floor holds), tap it to open earlier slots, builder-only never on the site, and the early
  start carries through to the schedule. Promised a "it's live" note when shipped.

## Confirmation (shipped + live) — sent

- pip → drewshahoud@gmail.com, 2026-08-26, msg id `1a03ff3c515d5e64` (autonomous, cycle approved).
  Told Drew it is LIVE in the Session Builder: pick 8hr + date, tap "8-Hour Override" next to
  "Available times", earlier slots open; builder-only (never on the customer site); the early
  start carries through to the booked schedule; with override on the list shows all calendar
  slots so pick the real start. Booking PR #170 (merged db345da, prod), dashboard PR #161
  (merged 7fb655c, deployed + kickstarted). DREW-93.
