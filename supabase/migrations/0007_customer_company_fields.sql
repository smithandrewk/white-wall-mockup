-- 0007 — customer company fields on customers (item 6, round 4).
--
-- AUTHORED, NOT APPLIED (see README). Additive columns only; no existing
-- behavior changes. Drew's round-4 account page lets a signed-in customer save
-- their company name + website alongside the existing contact info (full_name,
-- phone, instagram from 0001). These are optional profile fields, written by
-- /api/account/profile-update and surfaced by /api/account/profile.
--
-- Will be APPLIED to the shared wws-booking Supabase at ship (additive/safe).

alter table public.customers
  add column if not exists company_name text;

alter table public.customers
  add column if not exists company_website text;
