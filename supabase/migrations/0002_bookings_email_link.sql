-- 0002 — let a booking be persisted before the customer has an account, then
-- link it when they create/sign into an account with the same email.
--
-- A customer can complete a booking first and create their account afterward
-- (the post-payment "set a password" step). So a booking may have no customer
-- yet at write time: customer_id becomes nullable, and we stamp the booker
-- email to link on at account creation.

alter table public.bookings alter column customer_id drop not null;
alter table public.bookings add column if not exists email text;
create index if not exists bookings_email_idx on public.bookings (lower(email));
