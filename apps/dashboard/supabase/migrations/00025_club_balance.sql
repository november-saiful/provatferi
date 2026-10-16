-- 00025_club_balance.sql
-- Universal club balance.
--
-- Budget and expense ROW-level access stays role-restricted (finance roles
-- only), but the AGGREGATE totals should be identical for every signed-in
-- user. Previously each client summed `budgets`/`expenses` directly, so RLS
-- filtered the rows differently per role (e.g. jgs saw zero spent) — the
-- balance was inconsistent.
--
-- This view computes the totals server-side as the view owner (postgres), so
-- every caller sees exactly the same numbers regardless of role. Grants are
-- limited to `authenticated` (the dashboard is behind a sign-in gate).
--
-- Also adds `expenses` and `budgets` to the realtime publication so the
-- balance widget refreshes live when finance data changes.
--
-- Known limitation: Realtime postgres_changes is filtered by each subscriber's
-- RLS, so roles without read access to expenses/budgets won't get live
-- invalidation events — their balance refreshes on navigation/refetch instead.
-- Totals are always correct on fetch (the view computes them as its owner).

create or replace view public.club_balance
with (security_invoker = false)
as
select
  coalesce(
    (select sum(allocated_amount) from public.budgets where status = 'active'),
    0
  )::numeric(14, 2) as allocated,
  coalesce(
    (select sum(amount) from public.expenses),
    0
  )::numeric(14, 2) as spent;

grant select on public.club_balance to authenticated;

-- Realtime: refresh the universal balance live when finance data changes.
do $$
declare
  t text;
begin
  foreach t in array array['public.expenses', 'public.budgets'] loop
    begin
      execute format('alter publication supabase_realtime add table %s', t);
    exception
      when duplicate_object then null; -- already a member
      when undefined_table then raise warning 'realtime: table % does not exist', t;
    end;
  end loop;
end;
$$;
