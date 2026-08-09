-- 00038_root_bank_deposits.sql
-- Root Bank v2: budgets are replaced by deposits (income).
--
-- The budget system from 00037 never shipped (no deployed data), so the
-- `root_bank_budgets` table, its spent-amount sync trigger and the expense
-- `budget_id` link are removed entirely. Balance is now:
--
--     deposits (sum of root_bank_deposits) − expenses (sum of root_bank_expenses)

-- ── Deposits table (income) ──────────────────────────────────────────────
create table if not exists public.root_bank_deposits (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount decimal(12,2) not null check (amount >= 0),
  -- Date & time are stamped automatically at insert time.
  deposited_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.root_bank_deposits enable row level security;

drop policy if exists "root_bank_deposits_access" on public.root_bank_deposits;
create policy "root_bank_deposits_access" on public.root_bank_deposits
  for all using (public.is_any_role(array['root', 'pr', 'admin']))
  with check (public.is_any_role(array['root', 'pr', 'admin']));

-- ── Remove the budget system ─────────────────────────────────────────────
drop trigger if exists root_bank_expenses_sync_spent on public.root_bank_expenses;
drop function if exists public.sync_root_bank_budget_spent();
alter table public.root_bank_expenses drop column if exists budget_id;
drop table if exists public.root_bank_budgets;

-- ── Balance RPC: deposits − expenses ─────────────────────────────────────
-- The return type changed (allocated → deposits), so the old function must
-- be dropped first — CREATE OR REPLACE cannot change a function's signature.
drop function if exists public.get_root_bank_balance();

create or replace function public.get_root_bank_balance()
returns table (
  deposits numeric,
  spent numeric
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce((select sum(amount) from public.root_bank_deposits), 0)::numeric(14,2) as deposits,
    coalesce((select sum(amount) from public.root_bank_expenses), 0)::numeric(14,2) as spent;
$$;

revoke execute on function public.get_root_bank_balance() from public;
grant execute on function public.get_root_bank_balance() to authenticated;

-- ── Realtime: refresh the balance when deposits change ───────────────────
-- (root_bank_expenses was already added in 00037; dropping root_bank_budgets
--  removes it from the publication automatically.)
do $$
declare
  t text;
begin
  foreach t in array array['public.root_bank_deposits'] loop
    begin
      execute format('alter publication supabase_realtime add table %s', t);
    exception
      when duplicate_object then null; -- already a member
      when undefined_table then raise warning 'realtime: table % does not exist', t;
    end;
  end loop;
end;
$$;
