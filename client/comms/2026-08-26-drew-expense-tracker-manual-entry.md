# Drew — manual expense entry in the Expense Tracker

**Source:** Gmail thread `1a03ee7679c69e27` (pip@entrpy.co)
**From:** Drew Shahoud <drewshahoud@gmail.com>
**Date:** Wed, 26 Aug 2026 12:28:56 -0400
**msgid:** `1a03ee7679c69e27`
**Subject:** White Wall dashboard revisions
**Classification:** change-request (dashboard) · fast path
**Paid window:** Drew paid $30 (invoice 7b383a5a-6a64-4f97-8637-de4e4e7ebf5f); access active through 2026-08-27 06:00.

## Verbatim

> Pip, send me a link. Let's get to work. White wall dashboard revisions
>
> First off to get started, in the expense tracker, I want to be able to
> manually input things in there. So make it so I can manually input data,
> but obviously still keep the automations That we already have set up for
> the cleaning expenses, set up Crew, etc. But I want to be able to manually
> add things in those different categories as well.

## Triage

- Dashboard change (wws-dashboard), READ-ONLY-upstream preserved: manual entries write only a new pip-owned local table `expense_manual_entry` (same precedent as DREW-56 cashflow CRUD + the coupon CRUD). No money moved, reversible.
- Keep the automations: Cleaning Fees (DREW-69, $110/fee auto) and Setup/Reset Crew (DREW-84, $250/booking auto) sections stay exactly as they are. Manual entry is ADDED alongside, grouped by category (those two + Backdrops + free-text custom categories).
- NOT an escalation: no money/architecture/legal/customer-scale gate. Drew self-authorizes his own dashboard data.
