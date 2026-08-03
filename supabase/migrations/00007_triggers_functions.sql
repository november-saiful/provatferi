-- 00007_triggers_functions.sql
-- Audit log trigger (rcd) + storage setup
-- (The email notification trigger that used to live here was removed in
--  favour of the in-app notification system — see 00016/00017.)

-- 5.1 Audit log trigger for expenses + budgets
create or replace function public.log_record_change()
returns trigger as $$
declare
  v_original_creator uuid;
  v_modifier uuid := auth.uid();
begin
  if TG_OP = 'UPDATE' then
    v_original_creator := coalesce(OLD.created_by, v_modifier);

    insert into records_log (table_name, record_id, action, original_data, new_data, modified_by, original_creator)
    values (
      TG_TABLE_NAME::record_table,
      OLD.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      v_modifier,
      v_original_creator
    );

    return NEW;
  elsif TG_OP = 'DELETE' then
    v_original_creator := coalesce(OLD.created_by, v_modifier);

    insert into records_log (table_name, record_id, action, original_data, modified_by, original_creator)
    values (
      TG_TABLE_NAME::record_table,
      OLD.id,
      'delete',
      to_jsonb(OLD),
      v_modifier,
      v_original_creator
    );

    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists expenses_audit on public.expenses;
create trigger expenses_audit
  after update or delete on public.expenses
  for each row execute function public.log_record_change();

drop trigger if exists budgets_audit on public.budgets;
create trigger budgets_audit
  after update or delete on public.budgets
  for each row execute function public.log_record_change();

-- Storage: `gallery` bucket (public read, authenticated write for authorized roles)
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "gallery_storage_public_read"
on storage.objects for select
using (bucket_id = 'gallery');

create policy "gallery_storage_authorized_write"
on storage.objects for insert
with check (
  bucket_id = 'gallery'
  and public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
);

create policy "gallery_storage_authorized_update"
on storage.objects for update
using (
  bucket_id = 'gallery'
  and public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
)
with check (
  bucket_id = 'gallery'
  and public.is_any_role(array['pr', 'vp', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors'])
);

create policy "gallery_storage_delete_owner_or_admin"
on storage.objects for delete
using (
  bucket_id = 'gallery'
  and (
    owner = (select auth.uid())
    or public.is_any_role(array['pr', 'vp'])
  )
);
