-- 00039_root_bank_expense_timestamp.sql
-- Root Bank expenses get the same automatic timestamp as deposits: replace
-- the date-only `expense_date` column with `expensed_at` (timestamptz,
-- default now()). The table is brand new (00037, no deployed data), so the
-- column swap is safe. The club `expenses` table is untouched.

alter table public.root_bank_expenses add column if not exists expensed_at timestamptz;
update public.root_bank_expenses set expensed_at = created_at where expensed_at is null;
alter table public.root_bank_expenses alter column expensed_at set not null;
alter table public.root_bank_expenses alter column expensed_at set default now();
alter table public.root_bank_expenses drop column if exists expense_date;
