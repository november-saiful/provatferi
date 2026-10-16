-- 00008_seed.sql planted placeholder contact values. Replace them with the
-- real public contact info (idempotent — safe to re-run).
insert into app_config (key, value) values
  ('recruitment_url', '/recruitment/'),
  ('contact_email', 'provatferi2009@gmail.com'),
  ('contact_phone', '+880 1839-858853')
on conflict (key) do update set value = excluded.value;
