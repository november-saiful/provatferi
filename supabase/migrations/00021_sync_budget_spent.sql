-- 00021_sync_budget_spent.sql
-- Keep budget.spent_amount in sync with actual expenses automatically.

-- 1. Add optional budget_id to expenses so we know which budget each expense belongs to.
alter table public.expenses
  add column if not exists budget_id uuid references public.budgets(id) on delete set null;

-- 2. Function: recalculate a budget's spent_amount from its linked expenses.
create or replace function public.sync_budget_spent_amount()
returns trigger as $$
declare
  v_budget_id uuid;
begin
  -- Determine which budget needs recalculation.
  -- On INSERT/UPDATE: use the NEW row's budget_id (may be null).
  -- On DELETE: use the OLD row's budget_id (may be null).
  v_budget_id := case
    when TG_OP = 'DELETE' then OLD.budget_id
    else NEW.budget_id
  end;

  -- Recalculate for the directly affected budget (if any).
  if v_budget_id is not null then
    update public.budgets b
    set spent_amount = coalesce((
      select sum(e.amount) from public.expenses e
      where e.budget_id = b.id
    ), 0),
    updated_at = now()
    where b.id = v_budget_id;
  end if;

  -- On UPDATE, if the budget_id changed, also recalculate the OLD budget.
  if TG_OP = 'UPDATE' and OLD.budget_id is distinct from NEW.budget_id and OLD.budget_id is not null then
    update public.budgets b
    set spent_amount = coalesce((
      select sum(e.amount) from public.expenses e
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
$$ language plpgsql security definer;

-- 3. Fire the trigger on every expense change.
drop trigger if exists sync_budget_spent on public.expenses;
create trigger sync_budget_spent
  after insert or update or delete on public.expenses
  for each row execute function public.sync_budget_spent_amount();
