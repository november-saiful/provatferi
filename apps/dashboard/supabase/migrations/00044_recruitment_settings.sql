-- Recruitment phase control, editable at Dashboard → অ্যাডমিন → রিক্রুটমেন্ট.
-- app_config is a key/value text table (00006) with public read and
-- pr/vp/admin/root write (00028).
--
--   recruitment_enabled     'true' | 'false'
--   recruitment_starts_at   ISO-8601 UTC timestamp, '' = no lower bound
--   recruitment_ends_at     ISO-8601 UTC timestamp, '' = no upper bound
insert into app_config (key, value) values
  ('recruitment_enabled', 'true'),
  ('recruitment_starts_at', ''),
  ('recruitment_ends_at', '')
on conflict (key) do nothing;
