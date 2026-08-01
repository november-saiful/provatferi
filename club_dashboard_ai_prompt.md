# PROVATFERI DASHBOARD — COMPLETE BUILD PROMPT

> **Context:** You are building a full-stack web application for Provatferi. The system has 14 distinct user roles with granular module-level permissions, financial record management with audit trails, course attendance tracking, and a public-facing site with private member areas. 
> 
> **Build Method:** Vibe-code the entire application. Prioritize clean architecture, type safety, and security over visual polish. Use the exact stack specified below. Do not deviate without explicit justification.

---

## 1. TECH STACK (NON-NEGOTIABLE)

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend Framework** | Next.js 14+ (App Router) with TypeScript | Static export for Cloudflare Pages compatibility |
| **Frontend Hosting** | **Cloudflare Pages** | Zero cold starts, edge-cached globally, free unlimited bandwidth |
| **Backend/Database/Auth** | **Supabase** (PostgreSQL) | Native RLS for 14 roles, auto-generated REST API, free tier |
| **File Storage** | **Supabase Storage** | Integrated with RLS, CDN-ready |
| **Email Service** | **Resend** (free tier: 3,000 emails/month) | Triggered via Supabase Edge Functions or Database Webhooks |
| **Styling** | Tailwind CSS + shadcn/ui components | Rapid, consistent UI without custom CSS bloat |
| **Charts/Graphs** | Recharts | For course attendance insights (coi) |
| **Calendar** | FullCalendar or react-big-calendar | For Provatferi calendar (cln) |
| **State Management** | Zustand + React Query (TanStack Query) | Server state caching, optimistic updates |
| **Forms** | React Hook Form + Zod | Type-safe validation matching database schema |
| **Keep-Alive** | GitHub Actions cron workflow | Prevents Supabase free-tier pausing after 7 days |

**CRITICAL:** The frontend must be built as a **static export** (`output: 'export'` in next.config.js) to deploy on Cloudflare Pages. All dynamic data fetching happens client-side via Supabase JS client.

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Deployment Architecture
```
User → Cloudflare Pages (Static HTML/JS) → Supabase API (PostgreSQL + Auth)
                                      ↓
                              Supabase Storage (Images)
                                      ↓
                              Resend API (Email alerts)
```

### 2.2 Keep-Alive Mechanism
Create a GitHub repository with this workflow at `.github/workflows/keepalive.yml`:
```yaml
name: Keep Supabase Alive
on:
  schedule:
    - cron: '0 0 */5 * *'  # Every 5 days
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -s "https://[PROJECT_REF].supabase.co/rest/v1/roles?select=id&limit=1" -H "apikey: [ANON_KEY]"
```

---

## 3. DATABASE SCHEMA (SUPABASE POSTGRESQL)

Execute these migrations in order. Use UUIDs for all primary keys. Use `timestamptz` for all timestamps.

### 3.1 Roles Table
```sql
create table roles (
  id text primary key,
  name text not null,
  display_order int default 99,
  created_at timestamptz default now()
);

insert into roles (id, name, display_order) values
  ('pr', 'President', 1),
  ('vp', 'Vice President', 2),
  ('gs', 'General Secretary', 3),
  ('jgs', 'Joint General Secretary', 4),
  ('tr', 'Treasurer', 5),
  ('ofs', 'Office Secretary', 6),
  ('ors', 'Organizing Secretary', 7),
  ('cs', 'Cultural Secretary', 8),
  ('acs', 'Assistant Cultural Secretary', 9),
  ('pps', 'Publicity and Publication Secretary', 10),
  ('prs', 'Public Relations Secretary', 11),
  ('rds', 'Record and Documentation Secretary', 12),
  ('cc', 'Course Coordinator', 13),
  ('alm', 'Alumni', 14),
  ('visitor', 'Visitor', 99);
```

### 3.2 Profiles Table (Extends Supabase Auth)
```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role_id text not null references roles(id) default 'visitor',
  display_id text, -- e.g., "pr-01", "pr-02"
  full_name text,
  email text not null,
  phone text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role_id, full_name)
  values (
    new.id, 
    new.email, 
    'visitor',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 3.3 Events Forum (evf)
```sql
create type event_status as enum ('upcoming', 'ongoing', 'past');

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status event_status default 'upcoming',
  event_date timestamptz,
  location text,
  cover_image text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  user_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);
```

### 3.4 Gallery (glr)
```sql
create table gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  image_url text not null,
  event_id uuid references events(id),
  uploaded_by uuid references profiles(id),
  is_public boolean default true,
  created_at timestamptz default now()
);
```

### 3.5 Calendar (cln)
```sql
create type calendar_category as enum ('general', 'meeting', 'event', 'emergency', 'custom');

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category calendar_category default 'general',
  custom_category text, -- only used when category = 'custom'
  start_date timestamptz not null,
  end_date timestamptz,
  description text,
  location text,
  is_public boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

### 3.6 Notice Board (ntb)
```sql
create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_pinned boolean default false,
  is_public boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 3.7 Expense Management (xpm)
```sql
create table expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount decimal(12,2) not null,
  category text,
  description text,
  receipt_url text,
  expense_date date not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 3.8 Budget Management (bgm)
```sql
create table budgets (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  allocated_amount decimal(12,2) not null,
  spent_amount decimal(12,2) default 0,
  description text,
  start_date date,
  end_date date,
  status text default 'active',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 3.9 Records & Audit Log (rcd)
```sql
create type record_action as enum ('create', 'update', 'delete');
create type record_table as enum ('expenses', 'budgets', 'notices', 'calendar_events', 'events');

create table records_log (
  id uuid primary key default gen_random_uuid(),
  table_name record_table not null,
  record_id uuid not null,
  action record_action not null,
  original_data jsonb,
  new_data jsonb,
  modified_by uuid references profiles(id),
  original_creator uuid references profiles(id),
  notified boolean default false,
  created_at timestamptz default now()
);
```

### 3.10 Course Instructor Attendance (cia)
```sql
create type course_type as enum ('violin', 'guitar', 'ukulele-western', 'ukulele-dotara', 'vocal', 'flute');

create table course_schedules (
  id uuid primary key default gen_random_uuid(),
  course course_type not null,
  instructor_id uuid references profiles(id),
  total_classes int default 16,
  start_date date,
  status text default 'active'
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  course_schedule_id uuid references course_schedules(id),
  class_day int not null check (class_day between 1 and 16),
  arrival_time time,
  exit_time time,
  note text,
  is_present boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique(course_schedule_id, class_day)
);
```

### 3.11 Donations (dnt)
```sql
create table donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  donor_email text,
  amount decimal(12,2) not null,
  message text,
  is_anonymous boolean default false,
  show_on_board boolean default true,
  created_at timestamptz default now()
);
```

### 3.12 Sponsors (spn)
```sql
create table sponsors (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  representative_name text,
  contact_email text not null,
  contact_phone text,
  brand_details text,
  proposed_event text,
  status text default 'pending',
  created_at timestamptz default now()
);
```

### 3.13 Contact / Committee Info
```sql
create table committee_contacts (
  id uuid primary key default gen_random_uuid(),
  role_id text references roles(id),
  profile_id uuid references profiles(id),
  display_order int,
  is_public boolean default true
);
```

---

## 4. ROW LEVEL SECURITY (RLS) POLICIES

Enable RLS on ALL tables. Use these exact policies. The `pr` and `vp` roles are super-admins.

### 4.1 Profiles
```sql
alter table profiles enable row level security;

-- Everyone can read public profiles
create policy "profiles_read_public" on profiles
  for select using (true);

-- Users can update their own profile (except role)
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Only PR/VP can update roles
create policy "profiles_role_update" on profiles
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role_id in ('pr', 'vp'))
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role_id in ('pr', 'vp'))
  );
```

### 4.2 Events (evf)
```sql
alter table events enable row level security;

-- Public read
create policy "events_read_public" on events for select using (true);

-- Write access: PR, VP, GS, JGS, OFS, ORS
create policy "events_write_authorized" on events
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('pr', 'vp', 'gs', 'jgs', 'ofs', 'ors')
    )
  );
```

### 4.3 Event Comments
```sql
alter table event_comments enable row level security;

create policy "comments_read_public" on event_comments for select using (true);

-- Signed-in users (including alumni) can comment
create policy "comments_write_signedin" on event_comments
  for insert with check (auth.uid() = user_id);

-- Users can delete their own comments; PR/VP can delete any
create policy "comments_delete" on event_comments
  for delete using (
    auth.uid() = user_id 
    or exists (select 1 from profiles where id = auth.uid() and role_id in ('pr', 'vp'))
  );
```

### 4.4 Gallery (glr)
```sql
alter table gallery_items enable row level security;

create policy "gallery_read_public" on gallery_items for select using (true);

-- Upload: PR, VP, GS, JGS, PPS, PRS, OFS, ORS
create policy "gallery_write_authorized" on gallery_items
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('pr', 'vp', 'gs', 'jgs', 'pps', 'prs', 'ofs', 'ors')
    )
  );
```

### 4.5 Calendar (cln)
```sql
alter table calendar_events enable row level security;

create policy "calendar_read_public" on calendar_events for select using (true);

-- Edit: PR, VP, GS, JGS, OFS, ORS
create policy "calendar_write_authorized" on calendar_events
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('pr', 'vp', 'gs', 'jgs', 'ofs', 'ors')
    )
  );
```

### 4.6 Notices (ntb)
```sql
alter table notices enable row level security;

create policy "notices_read_public" on notices for select using (true);

-- Edit: PR, VP, GS, JGS, OFS, ORS
create policy "notices_write_authorized" on notices
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('pr', 'vp', 'gs', 'jgs', 'ofs', 'ors')
    )
  );
```

### 4.7 Expenses (xpm)
```sql
alter table expenses enable row level security;

-- View: PR, VP, GS, JGS, TR, OFS, ORS, RDS
create policy "expenses_read_authorized" on expenses
  for select using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('pr', 'vp', 'gs', 'jgs', 'tr', 'ofs', 'ors', 'rds')
    )
  );

-- Create: PR, VP, TR, OFS, ORS, RDS
create policy "expenses_create_authorized" on expenses
  for insert with check (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('pr', 'vp', 'tr', 'ofs', 'ors', 'rds')
    )
  );

-- Update/Delete: PR, VP, RDS (with audit trigger)
create policy "expenses_modify_authorized" on expenses
  for update using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('pr', 'vp', 'rds')
    )
  );
```

### 4.8 Budgets (bgm)
```sql
alter table budgets enable row level security;

-- View: PR, VP, GS, JGS, CS, ACS, RDS
create policy "budgets_read_authorized" on budgets
  for select using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('pr', 'vp', 'gs', 'jgs', 'cs', 'acs', 'rds')
    )
  );

-- Create/Update: PR, VP, CS, ACS, RDS
create policy "budgets_write_authorized" on budgets
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('pr', 'vp', 'cs', 'acs', 'rds')
    )
  );
```

### 4.9 Records Log (rcd)
```sql
alter table records_log enable row level security;

-- View: All signed-in users EXCEPT alumni
create policy "records_read_signedin" on records_log
  for select using (
    auth.uid() is not null 
    and exists (select 1 from profiles where id = auth.uid() and role_id != 'alm')
  );

-- Insert: System only (via trigger)
create policy "records_insert_system" on records_log
  for insert with check (false); -- Only via security definer functions
```

### 4.10 Attendance (cia)
```sql
alter table course_schedules enable row level security;
alter table attendance enable row level security;

-- Public read for course schedules and attendance
create policy "courses_read_public" on course_schedules for select using (true);
create policy "attendance_read_public" on attendance for select using (true);

-- Write: CC, PR, VP
create policy "attendance_write_authorized" on attendance
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('cc', 'pr', 'vp')
    )
  );

create policy "courses_write_authorized" on course_schedules
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('cc', 'pr', 'vp')
    )
  );
```

### 4.11 Donations (dnt)
```sql
alter table donations enable row level security;

-- Public can see donor names and messages (not amounts)
create policy "donations_read_public" on donations
  for select using (true);

-- Signed-in users can see amounts
create policy "donations_read_amounts" on donations
  for select using (auth.uid() is not null);

-- Anyone can donate (insert)
create policy "donations_insert_public" on donations
  for insert with check (true);
```

### 4.12 Sponsors (spn)
```sql
alter table sponsors enable row level security;

-- Public can submit (insert)
create policy "sponsors_insert_public" on sponsors
  for insert with check (true);

-- Read/Manage: PR, VP, GS, TR
create policy "sponsors_manage_authorized" on sponsors
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role_id in ('pr', 'vp', 'gs', 'tr')
    )
  );
```

---

## 5. DATABASE FUNCTIONS & TRIGGERS

### 5.1 Audit Log Trigger (for rcd)
```sql
create or replace function log_record_change()
returns trigger as $$
declare
  v_original_creator uuid;
  v_modifier uuid := auth.uid();
begin
  if TG_OP = 'UPDATE' then
    -- Get original creator
    v_original_creator := OLD.created_by;

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
    v_original_creator := OLD.created_by;

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

-- Apply to expenses
create trigger expenses_audit
  after update or delete on expenses
  for each row execute function log_record_change();

-- Apply to budgets
create trigger budgets_audit
  after update or delete on budgets
  for each row execute function log_record_change();
```

### 5.2 Email Notification Trigger
```sql
create or replace function notify_on_record_change()
returns trigger as $$
begin
  -- This will be caught by a Supabase webhook
  -- The webhook sends a POST to your edge function
  perform pg_notify('record_changed', json_build_object(
    'log_id', NEW.id,
    'original_creator', NEW.original_creator,
    'table_name', NEW.table_name,
    'record_id', NEW.record_id
  )::text);

  return NEW;
end;
$$ language plpgsql security definer;

create trigger records_log_notify
  after insert on records_log
  for each row execute function notify_on_record_change();
```

---

## 6. SUPABASE EDGE FUNCTION (EMAIL SENDER)

Create `supabase/functions/send-notification/index.ts`:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { record } = await req.json()

  // Fetch original creator's email
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: user } = await supabase.auth.admin.getUserById(record.original_creator)

  if (!user.user?.email) return new Response('No email', { status: 200 })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Provatferi <noreply@home.provatferi2009.workers.dev>',
      to: user.user.email,
      subject: 'Your record was modified',
      html: `<p>Your ${record.table_name} record was modified. <a href="${Deno.env.get('SITE_URL')}/records">View changes</a></p>`
    })
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Wire this to a **Database Webhook** on `records_log` table, firing `INSERT` events.

---

## 7. FRONTEND STRUCTURE

### 7.1 Route Structure (Next.js App Router)
```
app/
├── layout.tsx                 # Root layout with auth provider
├── page.tsx                   # Public landing page
├── login/page.tsx             # Auth page
├── dashboard/
│   ├── layout.tsx             # Protected layout with sidebar
│   ├── page.tsx               # Dashboard home (role-based widgets)
│   ├── evf/
│   │   ├── page.tsx           # Events list (public view)
│   │   └── [id]/page.tsx      # Event detail + comments
│   ├── glr/
│   │   └── page.tsx           # Gallery grid
│   ├── cln/
│   │   └── page.tsx           # Calendar view
│   ├── ntb/
│   │   └── page.tsx           # Notice board
│   ├── dnt/
│   │   └── page.tsx           # Donation form + donor wall
│   ├── spn/
│   │   └── page.tsx           # Sponsor form
│   ├── xpm/
│   │   └── page.tsx           # Expense form + list
│   ├── bgm/
│   │   └── page.tsx           # Budget form + list
│   ├── rcd/
│   │   └── page.tsx           # Records log (read-only for most, editable for rds/pr/vp)
│   ├── cia/
│   │   ├── page.tsx           # Attendance view (public)
│   │   └── manage/page.tsx    # Attendance form (cc/pr/vp only)
│   ├── coi/
│   │   └── page.tsx           # Course insights charts
│   └── admin/
│       ├── users/page.tsx     # User management (pr/vp only)
│       └── roles/page.tsx     # Role permissions view
components/
├── ui/                        # shadcn components
├── auth/
│   ├── auth-provider.tsx
│   └── role-guard.tsx         # HOC for role-based route protection
├── forms/
│   ├── expense-form.tsx
│   ├── budget-form.tsx
│   ├── attendance-form.tsx
│   └── donation-form.tsx
├── modules/
│   ├── event-card.tsx
│   ├── gallery-grid.tsx
│   ├── calendar-view.tsx
│   ├── notice-item.tsx
│   ├── record-table.tsx
│   └── course-chart.tsx
lib/
├── supabase.ts                # Supabase client setup
├── queries.ts                 # React Query hooks
└── utils.ts
```

### 7.2 Role Guard Component
Build a `<RoleGuard allowedRoles={['pr','vp','gs']}>` component that:
1. Reads the current user's role from the `profiles` table
2. Renders children if allowed
3. Renders a "403 - Insufficient Permissions" state if not
4. Redirects unauthenticated users to `/login`

### 7.3 Navigation Sidebar
Build a dynamic sidebar that renders menu items based on the user's role:
- **Public (visitor/alm):** Home, Events, Gallery, Calendar, Notices, Donate, Course Insights, Contact, Recruitment (external link)
- **PR/VP:** Everything + Admin panel
- **GS/JGS:** + Calendar edit, Notice edit, Event edit
- **TR/OFS/ORS/RDS:** + Expenses, Budgets (if applicable), Records
- **CS/ACS:** + Budgets
- **CC:** + Attendance management
- **PPS/PRS:** + Gallery upload
- **ALM:** Same as public, but can comment on events

---

## 8. MODULE SPECIFICATIONS

### 8.1 Event Forum (evf)
- **Public view:** Grid of event cards with cover image, title, date, status badge (upcoming/ongoing/past)
- **Detail view:** Full description, location, image gallery linked to this event, comment section
- **Comments:** Threaded flat list. Alumni and all signed-in users can comment. Show user avatar + name + timestamp.
- **Add Event:** Modal form with title, description, status, date, location, cover image upload. Only authorized roles see the "Add Event" button.
- **Edit/Delete:** Inline edit or modal. Only event creator or PR/VP can edit.

### 8.2 Gallery (glr)
- **Public view:** Masonry grid of images. Click to open lightbox.
- **Upload:** Drag-and-drop zone. Auto-resize images to max 1920px width before upload to Supabase Storage bucket `gallery`. Store URL in `gallery_items` table.
- **Filter:** By event (dropdown linking to events table).

### 8.3 Calendar (cln)
- **View:** FullCalendar month/week/day view. Color-coded by category (general=gray, meeting=blue, event=green, emergency=red, custom=purple).
- **Public:** Read-only view.
- **Add Event:** Modal with title, category (dropdown + conditional custom title field), date range, description, location. Authorized roles only.
- **Edit:** Click event to edit. Authorized roles only.

### 8.4 Notice Board (ntb)
- **Public view:** Pinned notices at top, then chronological list. Card style with title, excerpt, date.
- **Detail:** Full content page.
- **Add/Edit:** Simple rich text editor (TipTap or basic markdown). Authorized roles only.
- **Pin:** Toggle pin status. PR/VP only.

### 8.5 Donations (dnt)
- **Public form:** Name (optional anonymous checkbox), email, amount, message. **No actual payment gateway** — this is a record-keeping form. (If payment is needed later, integrate Stripe, but for now just store the pledge/intent).
- **Donor Wall:** Public page showing donor names (excluding anonymous) in a grid/tile layout. NO amounts shown.
- **Signed-in view:** Separate tab/page showing amounts for all donors. Use RLS to enforce.

### 8.6 Sponsors (spn)
- **Public form:** Company name, representative name, email, phone, brand details, proposed event.
- **Admin view:** Table of submissions with status (pending/approved/rejected). PR/VP/GS/TR can update status.

### 8.7 Expense Management (xpm)
- **Form:** Title, amount (number), category (dropdown: venue, equipment, transport, food, miscellaneous), description, receipt image upload, expense date.
- **List:** Table view with sortable columns. Filter by category, date range.
- **Access:** Hidden from sidebar if user role not in allowed list.

### 8.8 Budget Management (bgm)
- **Form:** Project name, allocated amount, description, start/end dates.
- **List:** Table showing allocated vs spent (calculated from linked expenses or manual entry). Progress bar showing % spent.
- **Access:** Hidden from sidebar if user role not in allowed list.

### 8.9 Records (rcd)
- **View:** Unified table showing all changes from `records_log`. Columns: Date, Table, Action, Modified By (name lookup), Original Creator (name lookup), View Changes (modal showing diff).
- **Read-only:** For all signed-in users except ALM. They see the log but cannot edit.
- **Edit access:** PR/VP/RDS can click through to the actual record and modify it (which triggers another audit log entry).
- **Email notification:** When a record is modified, the original creator receives an email via the edge function.

### 8.10 Course Instructor Attendance (cia)
- **Public view:** Grid of 6 courses. Each course shows a progress bar (classes completed / 16) and a list of attendance entries.
- **Management view (CC/PR/VP only):**
  - Select course → Select class day (1-16) → Form with arrival time, exit time, note, is_present checkbox.
  - If entry exists for that day, show "Update" instead of "Add".
  - List below the form showing all 16 days with checkmark/X for presence.

### 8.11 Course Insights (coi)
- **Public charts:** For each of the 6 courses:
  - Bar chart: Classes completed vs remaining (out of 16)
  - Line chart: Attendance trend over 16 days
  - Summary stats: Total classes held, average attendance rate
- **Data source:** Aggregated from `attendance` table grouped by `course_schedule_id`.

### 8.12 Recruitment Bookmark
- Simple prominent button/card in the navigation or hero section linking to an external recruitment URL (configurable in an `app_config` table or env variable).

---

## 9. UI/UX REQUIREMENTS

- **Theme:** Clean, professional, Provatferi-branded. Dark mode support (system preference + toggle).
- **Responsive:** Must work perfectly on mobile. Sidebar becomes bottom nav or hamburger menu.
- **Loading states:** Skeleton loaders for all data tables and lists.
- **Empty states:** Illustration + text when no data exists.
- **Toasts:** Sonner or react-hot-toast for all mutations (success/error).
- **Forms:** Inline validation with Zod. Disable submit button while loading.
- **Tables:** TanStack Table (React Table) with sorting, filtering, pagination.
- **Charts:** Recharts with tooltips and responsive containers.
- **Images:** Next.js Image component with fallback placeholder. Lazy load gallery.

---

## 10. SECURITY REQUIREMENTS

- **Never** expose the Supabase service role key in the frontend.
- **Never** disable RLS on any table.
- Use `supabase.auth.getSession()` on every protected route.
- Store the Resend API key only in Supabase Edge Function secrets, never in client code.
- All file uploads must go through Supabase Storage with RLS policies (not direct client uploads with service key).
- Sanitize all user inputs. Use parameterized queries (Supabase client does this automatically).
- Implement rate limiting on public forms (donation, sponsor) using Supabase Edge Functions or client-side debouncing.

---

## 11. PERFORMANCE REQUIREMENTS

- **Static Export:** The Next.js app must export to static HTML/JS. No SSR.
- **Data Fetching:** All Supabase queries happen client-side. Use React Query for caching.
- **Revalidation:** Implement manual refresh buttons and optimistic updates.
- **Image Optimization:** Compress images before upload. Use Supabase Storage transformations (`/storage/v1/object/public/gallery/image.jpg?width=800`).
- **Bundle Size:** Keep initial JS bundle under 200KB. Code-split heavy components (charts, calendar, rich text editor).

---

## 12. DEPLOYMENT CHECKLIST

### Supabase Setup
1. Create new Supabase project
2. Run all SQL migrations (schema + RLS + triggers)
3. Create Storage bucket `gallery` with public read, authenticated write
4. Set Edge Function secrets: `RESEND_API_KEY`, `SITE_URL`
5. Configure Database Webhook on `records_log` → `INSERT` → Edge Function URL
6. Add authorized redirect URLs in Auth settings (your Cloudflare Pages domain)

### Cloudflare Pages Setup
1. Connect GitHub repo to Cloudflare Pages
2. Build command: `npm run build`
3. Build output directory: `out` (or `dist` depending on next.config)
4. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Ensure `next.config.js` has `output: 'export'` and `images: { unoptimized: true }`

### GitHub Keep-Alive
1. Create `.github/workflows/keepalive.yml` in the repo
2. Add repository secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
3. Verify the cron runs every 5 days

---

## 13. DELIVERABLES

The AI agent must produce:
1. **Complete Next.js codebase** with TypeScript, ready for static export
2. **Supabase migration files** (all schema, RLS, triggers, functions)
3. **Supabase Edge Function** for email notifications
4. **GitHub Actions workflow** for keep-alive
5. **README.md** with setup instructions, environment variables, and deployment guide
6. **Seed data** for roles and at least 2 test users per role for testing

---

## 14. TESTING SCENARIOS

Build the app so these scenarios work:
1. A visitor lands on the site → sees events, calendar, notices, gallery, course insights. Cannot see financial modules.
2. An Alumni logs in → can comment on events. Cannot see expenses/budgets.
3. A Treasurer logs in → sees and can add expenses. Cannot edit budgets (unless also RDS).
4. A Record Secretary edits an expense → the original creator gets an email notification.
5. A Course Coordinator fills attendance for Violin Day 1 → the Course Insights chart updates immediately.
6. The President can do everything, including changing another user's role in the admin panel.

---

**FINAL INSTRUCTION:** Build the entire application following this specification exactly. Do not swap technologies. Do not skip RLS policies. Do not skip the audit log system. Prioritize functionality over visual perfection — the Provatferi system must be secure, role-accurate, and deployable to Cloudflare Pages + Supabase free tiers immediately.
