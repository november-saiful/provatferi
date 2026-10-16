-- 00037_root_bank.sql
-- Root Bank — an independent budget / expense / balance system.
--
-- Kept fully separate from the club `budgets` / `expenses` tables so the
-- existing club balance is untouched. Only `root`, `pr` (president) and
-- `admin` may read or write anything here (see the RLS policies below); the
-- public and every other role see nothing.

create table if not exists public.root_bank_budgets (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  allocated_amount decimal(12,2) not null check (allocated_amount >= 0),
  spent_amount decimal(12,2) default 0 check (spent_amount >= 0),
  description text,
  start_date date,
  end_date date,
  status text default 'active',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.root_bank_expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount decimal(12,2) not null check (amount >= 0),
  category text,
  description text,
  receipt_url text,
  expense_date date not null,
  budget_id uuid references public.root_bank_budgets(id) on delete set null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.root_bank_budgets enable row level security;
alter table public.root_bank_expenses enable row level security;

-- Only root, president (pr) and admin.
drop policy if exists "root_bank_budgets_access" on public.root_bank_budgets;
create policy "root_bank_budgets_access" on public.root_bank_budgets
  for all using (public.is_any_role(array['root', 'pr', 'admin']))
  with check (public.is_any_role(array['root', 'pr', 'admin']));

drop policy if exists "root_bank_expenses_access" on public.root_bank_expenses;
create policy "root_bank_expenses_access" on public.root_bank_expenses
  for all using (public.is_any_role(array['root', 'pr', 'admin']))
  with check (public.is_any_role(array['root', 'pr', 'admin']));

-- Keep each budget's spent_amount in sync with its linked expenses (mirrors
-- 00021_sync_budget_spent.sql for the club tables).
create or replace function public.sync_root_bank_budget_spent()
returns trigger as $$
declare
  v_budget_id uuid;
begin
  v_budget_id := case
    when TG_OP = 'DELETE' then OLD.budget_id
    else NEW.budget_id
  end;

  if v_budget_id is not null then
    update public.root_bank_budgets b
    set spent_amount = coalesce((
      select sum(e.amount) from public.root_bank_expenses e
      where e.budget_id = b.id
    ), 0),
    updated_at = now()
    where b.id = v_budget_id;
  end if;

  if TG_OP = 'UPDATE' and OLD.budget_id is distinct from NEW.budget_id and OLD.budget_id is not null then
    update public.root_bank_budgets b
    set spent_amount = coalesce((
      select sum(e.amount) from public.root_bank_expenses e
      where e.budget_id = b.id
    ), 0),
    updated_at = now()
    where b.id = OLD.budget_id;
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists root_bank_expenses_sync_spent on public.root_bank_expenses;
create trigger root_bank_expenses_sync_spent
  after insert or update or delete on public.root_bank_expenses
  for each row execute function public.sync_root_bank_budget_spent();

revoke execute on function public.sync_root_bank_budget_spent() from public;

-- Universal Root Bank balance: identical totals for the allowed roles.
create or replace function public.get_root_bank_balance()
returns table (
  allocated numeric,
  spent numeric
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce((select sum(allocated_amount) from public.root_bank_budgets where status = 'active'), 0)::numeric(14,2) as allocated,
    coalesce((select sum(amount) from public.root_bank_expenses), 0)::numeric(14,2) as spent;
$$;

revoke execute on function public.get_root_bank_balance() from public;
grant execute on function public.get_root_bank_balance() to authenticated;

-- Realtime: refresh the Root Bank balance live when its finance data changes.
do $$
declare
  t text;
begin
  foreach t in array array['public.root_bank_expenses', 'public.root_bank_budgets'] loop
    begin
      execute format('alter publication supabase_realtime add table %s', t);
    exception
      when duplicate_object then null; -- already a member
      when undefined_table then raise warning 'realtime: table % does not exist', t;
    end;
  end loop;
end;
$$;
