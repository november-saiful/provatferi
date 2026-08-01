-- 00004_finance.sql
-- Expenses (xpm), Budgets (bgm), Records & Audit log (rcd)

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount decimal(12,2) not null check (amount >= 0),
  category text,
  description text,
  receipt_url text,
  expense_date date not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.budgets (
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

create type if not exists public.record_action as enum ('create', 'update', 'delete');
create type if not exists public.record_table as enum ('expenses', 'budgets', 'notices', 'calendar_events', 'events');

create table if not exists public.records_log (
  id uuid primary key default gen_random_uuid(),
  table_name record_table not null,
  record_id uuid not null,
  action record_action not null,
  original_data jsonb,
  new_data jsonb,
  modified_by uuid references profiles(id),
  original_creator uuid references profiles(id),
  notified boolean default false,
  created_at timestamptz default now()
);

alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.records_log enable row level security;

-- Expenses
drop policy if exists "expenses_read_authorized" on public.expenses;
create policy "expenses_read_authorized" on public.expenses
  for select using (
    public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'rds'])
  );

drop policy if exists "expenses_create_authorized" on public.expenses;
create policy "expenses_create_authorized" on public.expenses
  for insert with check (
    public.is_any_role(array['pr', 'vp', 'tr', 'ofs', 'ors', 'rds'])
  );

drop policy if exists "expenses_modify_authorized" on public.expenses;
create policy "expenses_modify_authorized" on public.expenses
  for update using (
    public.is_any_role(array['pr', 'vp', 'rds'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'rds'])
  );

drop policy if exists "expenses_delete_authorized" on public.expenses;
create policy "expenses_delete_authorized" on public.expenses
  for delete using (
    public.is_any_role(array['pr', 'vp', 'rds'])
  );

-- Budgets
drop policy if exists "budgets_read_authorized" on public.budgets;
create policy "budgets_read_authorized" on public.budgets
  for select using (
    public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'cs', 'acs', 'rds'])
  );

drop policy if exists "budgets_write_authorized" on public.budgets;
create policy "budgets_write_authorized" on public.budgets
  for all using (
    public.is_any_role(array['pr', 'vp', 'cs', 'acs', 'rds'])
  )
  with check (
    public.is_any_role(array['pr', 'vp', 'cs', 'acs', 'rds'])
  );

-- Records log: signed-in users except alumni can read. Writes only via triggers.
drop policy if exists "records_read_signedin" on public.records_log;
create policy "records_read_signedin" on public.records_log
  for select using (
    auth.uid() is not null
    and exists (select 1 from profiles where id = auth.uid() and role_id != 'alm')
  );

drop policy if exists "records_insert_system" on public.records_log;
create policy "records_insert_system" on public.records_log
  for insert with check (false);
