-- Store payment (bkash/nagad) wallet numbers in app_config so they are
-- editable by authorized users (admin, root, president) without a code deploy.
insert into app_config (key, value) values
  ('bkash_number', '01407604000'),
  ('nagad_number', '01839858853')
on conflict (key) do nothing;
