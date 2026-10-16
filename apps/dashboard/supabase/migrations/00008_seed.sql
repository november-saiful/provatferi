-- 00008_seed.sql
-- Sample content for development. Roles were seeded in migration 00001.
-- Test *users* (auth accounts) are created by `npm run seed:users` using the
-- service-role key because auth.users cannot be inserted via plain SQL.

-- Seed sample events (public)
insert into events (title, description, status, event_date, location, cover_image, created_by)
select e.title, e.description, e.status::event_status, e.event_date, e.location, e.cover_image, null
from (values
  ('Annual Cultural Evening 2026', 'An evening of music and performances by Provatferi members.', 'upcoming', now() + interval '21 days', 'Main Auditorium', null),
  ('Freshers Welcome', 'Welcome orientation for new members of the club.', 'upcoming', now() + interval '10 days', 'Club House', null),
  ('Violin Workshop', 'Hands-on workshop with guest instructor.', 'ongoing', now() - interval '3 days', 'Music Room 2', null),
  ('Spring Concert', 'Open-air concert celebrating spring.', 'past', now() - interval '60 days', 'Central Park Stage', null),
  ('Independence Day Program', 'Commemorative program with cultural showcases.', 'past', now() - interval '120 days', 'Main Auditorium', null)
) as e(title, description, status, event_date, location, cover_image)
where not exists (select 1 from events limit 1);

-- Seed sample notices
insert into notices (title, content, is_pinned, created_by)
select n.title, n.content, n.is_pinned, null
from (values
  ('Committee Meeting — Monthly Review', 'All executive members are requested to attend the monthly review meeting.', true),
  ('Course Registration Open', 'Registration for the new violin, guitar and vocal batches is now open.', true),
  ('Cultural Week Schedule', 'The cultural week schedule has been published. Participants must confirm slots.', false)
) as n(title, content, is_pinned)
where not exists (select 1 from notices limit 1);

-- Seed calendar events
insert into calendar_events (title, category, start_date, end_date, description, created_by)
select c.title, c.category::calendar_category, c.start_date, c.end_date, c.description, null
from (values
  ('Executive Meeting', 'meeting', now() + interval '2 days', now() + interval '2 days' + interval '2 hours', 'Monthly executive meeting.'),
  ('Cultural Evening', 'event', now() + interval '21 days', now() + interval '21 days' + interval '5 hours', 'Annual cultural evening.'),
  ('Class Reschedule', 'custom', now() + interval '5 days', now() + interval '5 days' + interval '1 hour', 'Guitar class moved to Friday.')
) as c(title, category, start_date, end_date, description)
where not exists (select 1 from calendar_events limit 1);

-- Seed the 6 course schedules
insert into course_schedules (course, instructor_id, total_classes, start_date, status)
select c.course::course_type, null, 16, c.start_date, 'active'
from (values
  ('violin', 'violin'::text, now() - interval '30 days'),
  ('guitar', 'guitar'::text, now() - interval '28 days'),
  ('ukulele-western', 'ukulele-western'::text, now() - interval '25 days'),
  ('ukulele-dotara', 'ukulele-dotara'::text, now() - interval '22 days'),
  ('vocal', 'vocal'::text, now() - interval '20 days'),
  ('flute', 'flute'::text, now() - interval '18 days')
) as c(course, _ignore, start_date)
where not exists (select 1 from course_schedules limit 1);

-- Seed a few donations (public board)
insert into donations (donor_name, donor_email, amount, message, is_anonymous, show_on_board)
select d.donor_name, d.donor_email, d.amount, d.message, d.is_anonymous, d.show_on_board
from (values
  ('Rahim Uddin', 'rahim@example.com', 2000, 'Keep up the great work!', false, true),
  ('Anonymous', NULL, 500, 'From a well-wisher.', true, true),
  ('Nusrat Jahan', 'nusrat@example.com', 1500, 'Best wishes for cultural week.', false, true),
  ('Karim Family', 'karim@example.com', 5000, 'Proud to support Provatferi.', false, true)
) as d(donor_name, donor_email, amount, message, is_anonymous, show_on_board)
where not exists (select 1 from donations limit 1);

-- Seed a sponsor inquiry
insert into sponsors (company_name, representative_name, contact_email, contact_phone, brand_details, proposed_event, status)
select 'Cafe Aroma', 'Tanvir Ahmed', 'tanvir@cafearoma.example', '+8801700000000', 'Coffee catering & venue support', 'Annual Cultural Evening', 'pending'
where not exists (select 1 from sponsors limit 1);

-- Seed app_config
insert into app_config (key, value) values
  ('recruitment_url', 'https://example.com/recruitment'),
  ('contact_email', 'contact@provatferi.org'),
  ('contact_phone', '+8801XXXXXXXXX')
on conflict (key) do nothing;
