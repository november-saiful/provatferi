-- 00041_tasks_public_read.sql
-- Allow anonymous (public / unauthenticated) users to read tasks so the
-- public tasks page and home-page calendar widget work without login.

create policy "Tasks are readable by anonymous users"
  on public.tasks for select
  to anon
  using (true);
