-- 00020_payment_fields.sql
-- bKash/Nagad send-money for donations + sponsorships.
--
-- * donations.sponsors get payment_method ('bkash' | 'nagad') + transaction_id
--   so the treasurer can reconcile send-money payments.
-- * sponsors.contact_email is now optional (form allows leaving it blank), so
--   the NOT NULL constraint is dropped.

alter table public.donations
  add column if not exists payment_method text,
  add column if not exists transaction_id text;

alter table public.sponsors
  add column if not exists payment_method text,
  add column if not exists transaction_id text,
  alter column contact_email drop not null;
