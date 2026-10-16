-- Update get_club_balance to include approved donations
-- in the total balance calculation

-- Drop the existing function first since we're changing the return type
DROP FUNCTION IF EXISTS public.get_club_balance();

create or replace function public.get_club_balance()
returns table (
  allocated numeric,
  spent numeric,
  donations numeric
)
language sql
security definer
set search_path = public
as $$
  select
    -- Allocated from active budgets
    coalesce((select sum(allocated_amount) from public.budgets where status = 'active'), 0)::numeric(14,2) as allocated,
    -- Spent from expenses
    coalesce((select sum(amount) from public.expenses), 0)::numeric(14,2) as spent,
    -- Approved donations (show_on_board = true indicates approval)
    coalesce((select sum(amount) from public.donations where show_on_board = true), 0)::numeric(14,2) as donations;
$$;

-- Re-grant execute permission
REVOKE EXECUTE ON FUNCTION public.get_club_balance() FROM public;
GRANT EXECUTE ON FUNCTION public.get_club_balance() TO authenticated;
