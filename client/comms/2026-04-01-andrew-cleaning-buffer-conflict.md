# Andrew — Cleaning Buffer Conflict Prevention

**Date:** 2026-04-01
**Source:** Andrew (during testing session)
**Type:** Internal improvement

---

**Problem:** When a booking has 50+ participants (triggering $150 cleaning fee), a 2.5hr cleaning buffer is created after the session. But if there's already a booking in that buffer window, we have a conflict — the cleaners can't come in.

**Solution:** Before checkout, check if the 2.5hr buffer window after the session is clear. If it's not:
- Offer an earlier time that would accommodate the buffer before the next booking
- If no earlier time works, let the customer pick a different slot

This prevents the situation where a high-traffic booking blocks access for cleaners before the next session.
