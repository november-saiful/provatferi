-- 00043_alumni_claims.sql
-- Alumni onboarding: signed-in visitors claim a former-member profile.
-- Reviewers (pr/vp/admin/root) approve → profile becomes 'alm';
-- reject → claim closed. Run in order.

create table if not exists public.alumni_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  academic_session text,
  department text,
  hall_name text,
  reg_id text,
  phone text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.alumni_claims enable row level security;

-- Claimant: file and read own claims.
drop policy if exists "alumni_claims_insert_own" on public.alumni_claims;
create policy "alumni_claims_insert_own" on public.alumni_claims
  for insert with check (auth.uid() = user_id);

drop policy if exists "alumni_claims_select_own" on public.alumni_claims;
create policy "alumni_claims_select_own" on public.alumni_claims
  for select using (
    auth.uid() = user_id
    or public.is_any_role('{pr,vp,admin,root}')
  );

-- Reviewers: triage the queue.
drop policy if exists "alumni_claims_review" on public.alumni_claims;
create policy "alumni_claims_review" on public.alumni_claims
  for update using (public.is_any_role('{pr,vp,admin,root}'))
  with check (public.is_any_role('{pr,vp,admin,root}'));

-- Live queue updates for the admin review UI.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'alumni_claims'
  ) then
    alter publication supabase_realtime add table public.alumni_claims;
  end if;
end $$;
