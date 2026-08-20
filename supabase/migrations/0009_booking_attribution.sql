-- 0009 — Google Ads attribution on the booking record (WWA-3, step 2).
--
-- Additive + nullable. Stores the ad click ids (gclid / wbraid / gbraid) and
-- utm_* context captured on landing by scripts/attribution.js and threaded
-- through /api/create-checkout, so the confirmed-booking conversion upload has a
-- durable, structured home on the booking row (alongside square_payment_id and
-- total_cents) for audit and future conversion adjustments (refund/cancel →
-- negative adjustment, WWA-3 step 6).
--
-- create-checkout writes this via a DECOUPLED best-effort update AFTER the
-- booking row insert, so the booking still persists even if this migration
-- hasn't been applied yet. No PII beyond the opaque Google click ids.
--
-- Shape (jsonb): { gclid?, wbraid?, gbraid?, utm_source?, utm_medium?,
--                  utm_campaign?, utm_term?, utm_content? }

alter table public.bookings
  add column if not exists attribution jsonb;
