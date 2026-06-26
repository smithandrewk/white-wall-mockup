-- 0008 — customer-level saved-card handle (round 5, item 1).
--
-- Additive. The card-on-file was previously surfaced only from the newest
-- booking row carrying a square_card_id, so an account holder with ZERO
-- bookings (e.g. a fresh Google sign-in) couldn't see a card they just saved.
-- This column gives /api/account/save-card a customer-level place to stamp the
-- handle, and /api/account/profile.js falls back to it when no booking carries
-- one — covering "all account holders" (Drew round 5).
--
-- square_customer_id already exists on customers from 0001. PAN never stored;
-- only the Square card handle.

alter table public.customers
  add column if not exists square_card_id text;
