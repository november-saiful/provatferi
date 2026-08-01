# PROVATFERI DASHBOARD — PROJECT PLANNING DOCUMENT

> **Version:** 1.0  
> **Date:** 2026-08-01  
> **Status:** Planning Phase — Open for Modifications  
> **Platform:** Cloudflare Pages (Frontend) + Supabase (Backend)  
> **Design:** Material 3 Neural Expressive, Light Theme, Coffee Accent  

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [User Roles & Hierarchy](#2-user-roles--hierarchy)
3. [Access Control Matrix (ACL)](#3-access-control-matrix-acl)
4. [Module Specifications](#4-module-specifications)
5. [Data Flow & Relationships](#5-data-flow--relationships)
6. [Public vs Private Scope](#6-public-vs-private-scope)
7. [Notification System](#7-notification-system)
8. [Future Considerations](#8-future-considerations)
9. [Open Questions & TODOs](#9-open-questions--todos)

---

## 1. PROJECT OVERVIEW

### 1.1 Purpose
A centralized digital hub for **Provatferi** — managing events, finances, attendance, communications, and public presence. Replaces scattered spreadsheets, WhatsApp announcements, and manual record-keeping.

### 1.2 Core Principles
- **Transparency:** Public modules show club activity to visitors and alumni.
- **Accountability:** Financial records are audited and notify creators on changes.
- **Accessibility:** All signed-in members access relevant data; no information silos except where privacy requires it.
- **Longevity:** Built to outlast current committee terms. Data persists across administrations.

### 1.3 Tech Stack (Confirmed)
| Layer | Service | Cost |
|-------|---------|------|
| Frontend | Next.js 14 (App Router) + TypeScript | Free |
| Hosting | Cloudflare Pages | Free |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) | Free |
| Email | Resend | Free (3,000/mo) |
| Keep-Alive | GitHub Actions | Free |
| Domain | `home.provatferi2009.workers.dev` | Free |

### 1.4 Design Direction
- **System:** Google Material Design 3 (Material You)
- **Style:** Neural Expressive — organic shapes, soft elevations, warm textures
- **Theme:** Light mode primary
- **Accent:** Coffee palette (rich browns, cream, taupe, sage green complements)
- **Motion:** Rich micro-interactions, staggered entrances, ripple effects, smooth page transitions

---

## 2. USER ROLES & HIERARCHY

### 2.1 Role Definitions

| Code | Full Title | Tier | Description |
|------|------------|------|-------------|
| `pr` | President | Executive | Top authority. Full system access. Can modify any record, manage users, change roles. |
| `vp` | Vice President | Executive | Substitute President. Identical privileges to PR. Acts when PR is unavailable. |
| `gs` | General Secretary | Management | Operations overseer. Access to calendar, notice board, expense viewing. |
| `jgs` | Joint General Secretary | Management | GS assistant. Shared GS workload. Same access as GS. |
| `tr` | Treasurer | Financial | Fund manager. Expense tracking, donation oversight, sponsor coordination. |
| `ofs` | Office Secretary | Administrative | Documentation and correspondence. Expense, event, notice, gallery access. |
| `ors` | Organizing Secretary | Administrative | Event logistics. Same access as OFS. |
| `cs` | Cultural Secretary | Creative | Cultural program lead. Budget creation for cultural projects. |
| `acs` | Assistant Cultural Secretary | Creative | CS assistant. Same budget access as CS. |
| `pps` | Publicity & Publication Secretary | Media | PR & content. Gallery uploads, event coverage, public visibility. |
| `prs` | Public Relations Secretary | Outreach | External relations. Event forum access, public communications. |
| `rds` | Record & Documentation Secretary | Archival | Central record keeper. Full read access to financials. Edit access with audit trails. |
| `cc` | Course Coordinator | Education | Music course management. Full attendance system control. |
| `alm` | Alumni | Legacy | Former members. Read-only public access + commenting on events. |
| `visitor` | Visitor / Public | External | Non-authenticated users. Read-only public modules. |

### 2.2 Naming Convention — CRITICAL

The `display_id` field in the `profiles` table **must** follow this strict format:

```
{lowercase_role_code}-{two_digit_number}
```

| Role | display_id Examples | full_name Example |
|------|---------------------|-------------------|
| President (`pr`) | `pr-01`, `pr-02` | "Rahim Khan" |
| Vice President (`vp`) | `vp-01`, `vp-02` | "Karim Ahmed" |
| General Secretary (`gs`) | `gs-01`, `gs-02` | "Sadia Islam" |
| Joint General Secretary (`jgs`) | `jgs-01`, `jgs-02` | "Tanvir Hossain" |
| Treasurer (`tr`) | `tr-01`, `tr-02` | "Nusrat Jahan" |
| Office Secretary (`ofs`) | `ofs-01`, `ofs-02` | "Fahim Rahman" |
| Organizing Secretary (`ors`) | `ors-01`, `ors-02` | "Priya Saha" |
| Cultural Secretary (`cs`) | `cs-01`, `cs-02` | "Arif Hossain" |
| Assistant Cultural Secretary (`acs`) | `acs-01`, `acs-02` | "Mina Akter" |
| Publicity & Publication Secretary (`pps`) | `pps-01`, `pps-02` | "Sohan Ali" |
| Public Relations Secretary (`prs`) | `prs-01`, `prs-02` | "Tania Begum" |
| Record & Documentation Secretary (`rds`) | `rds-01`, `rds-02` | "Imran Hossain" |
| Course Coordinator (`cc`) | `cc-01`, `cc-02` | "Riya Das" |
| Alumni (`alm`) | `alm-01`, `alm-02` | "Former Member Name" |
| Visitor (`visitor`) | `visitor-{random}` | "Self-registered User" |

**Rules:**
- ✅ `pr-01`, `pps-01`, `rds-02` — lowercase role code, hyphen, two digits
- ❌ `PR One`, `PPS Two`, `President 1` — NEVER use title case, words, or single digits
- ❌ `pr1`, `vp2` — NEVER omit the hyphen
- ❌ `PR-01`, `PPS-01` — NEVER use uppercase
- The `full_name` field holds the actual person's real name. `display_id` is the system identifier.
- Login uses email + password (managed by Supabase Auth), NOT the display_id.

### 2.3 Role Assignment Rules
- Only `pr` and `vp` can assign/change roles.
- A user cannot change their own role (prevents self-elevation).
- Role changes are logged in an audit table (optional but recommended).
- When a committee term ends, `pr` bulk-updates outgoing members to `alm`.

---

## 3. ACCESS CONTROL MATRIX (ACL)

### 3.1 Module Legend

| Code | Module Name | Type |
|------|-------------|------|
| `evf` | Event Forum | Public + Restricted Write |
| `glr` | Gallery | Public + Restricted Upload |
| `cln` | Calendar | Public + Restricted Edit |
| `ntb` | Notice Board | Public + Restricted Edit |
| `dnt` | Donations | Public Form + Tiered Visibility |
| `spn` | Sponsors | Public Form + Admin Review |
| `xpm` | Expense Management | Private (Restricted) |
| `bgm` | Budget Management | Private (Restricted) |
| `rcd` | Records & Audit Log | Private (Read-Only / Admin Edit) |
| `cia` | Course Instructor Attendance | Public View + Restricted Form |
| `coi` | Course Insights | Public Charts |
| `rec` | Recruitment (External Bookmark) | External Link |

### 3.2 Full Permission Matrix

> **Legend:** ✅ = Full Access (CRUD) | 👁️ = Read Only | 📝 = Create Only | ❌ = No Access | 🔧 = Admin Override

| Role | evf | glr | cln | ntb | dnt | spn | xpm | bgm | rcd | cia | coi | rec |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **pr** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| **vp** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| **gs** | 📝 | 👁️ | ✅ | ✅ | 👁️ | 👁️ | 👁️ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ |
| **jgs** | 📝 | 👁️ | ✅ | ✅ | 👁️ | 👁️ | ❌ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ |
| **tr** | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ |
| **ofs** | 📝 | 📝 | ✅ | ✅ | 👁️ | 👁️ | ✅ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ |
| **ors** | 📝 | 📝 | ✅ | ✅ | 👁️ | 👁️ | ✅ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ |
| **cs** | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ |
| **acs** | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ |
| **pps** | 👁️ | 📝 | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ |
| **prs** | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ |
| **rds** | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | 👁️ | ✅ | 👁️ | 👁️ | 👁️ |
| **cc** | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ❌ | 👁️ | ✅ | 👁️ | 👁️ |
| **alm** | 📝* | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ❌ | ❌ | 👁️ | 👁️ | 👁️ |
| **visitor** | 👁️ | 👁️ | 👁️ | 👁️ | 📝** | 📝** | ❌ | ❌ | ❌ | 👁️ | 👁️ | 👁️ |

> *`alm` can comment on events (write comments, not edit events)  
> **Visitors can submit donations and sponsor inquiries (forms only)

### 3.3 Special Permissions

| Action | Allowed Roles |
|--------|---------------|
| Change user roles | `pr`, `vp` |
| Delete any record (override) | `pr`, `vp` |
| Edit expense records | `pr`, `vp`, `rds` |
| Edit budget records | `pr`, `vp`, `cs`, `acs`, `rds` |
| Pin notices | `pr`, `vp` |
| Upload gallery images | `pr`, `vp`, `gs`, `jgs`, `pps`, `prs`, `ofs`, `ors` |
| Manage course schedules | `pr`, `vp`, `cc` |
| View donation amounts | All signed-in users (`pr` through `alm`) |
| View donor board (names only) | Everyone including visitors |
| Approve sponsors | `pr`, `vp`, `gs`, `tr` |

---

## 4. MODULE SPECIFICATIONS

### 4.1 Event Forum (evf)

**Purpose:** Showcase all club events — past, present, and upcoming.

**Public View:**
- Grid of event cards with cover image, title, date, location, status badge
- Filter by status: Upcoming / Ongoing / Past
- Search by title or description
- Click to view full event detail page
- Comment section on detail page (threaded flat list)

**Restricted Actions:**
- Add new event: Modal form with title, description, status, date range, location, cover image upload
- Edit event: Inline or modal, pre-filled
- Delete event: Confirmation dialog with "Type event name to confirm"
- Comments: All signed-in users (including `alm`) can add. Authors can delete their own. `pr`/`vp` can delete any.

**Data Model:**
- Event: id, title, description, status, event_date, location, cover_image, created_by, created_at
- Comment: id, event_id, user_id, content, created_at

**Design Notes:**
- Event cards: 16px radius, image aspect ratio 16:9, status badge top-right corner
- Status colors: Upcoming = coffee primary, Ongoing = sage green, Past = taupe
- Comment avatars: 32px circles with user initials fallback

---

### 4.2 Gallery (glr)

**Purpose:** Visual archive of club activities and events.

**Public View:**
- Masonry grid layout (Pinterest-style) or uniform grid
- Lightbox on click: Full-screen viewer with navigation arrows, image title, description
- Filter by event (dropdown linking to events table)
- Lazy loading with blur-up placeholder

**Restricted Actions:**
- Upload: Drag-and-drop zone, multi-file select, auto-resize to max 1920px width
- Delete: Image owner or `pr`/`vp`
- Edit metadata: Title, description, linked event

**Data Model:**
- GalleryItem: id, title, description, image_url, event_id, uploaded_by, is_public, created_at

**Storage:**
- Supabase Storage bucket: `gallery`
- Folder structure: `gallery/{event_id}/{filename}` or `gallery/general/{filename}`
- RLS: Public read, authenticated write for authorized roles

**Design Notes:**
- Grid gap: 12px desktop, 8px mobile
- Hover: Image zooms 1.05x within container, overlay shows title
- Upload zone: Dashed border, coffee accent on drag-over, animated upload progress (coffee cup fill)

---

### 4.3 Calendar (cln)

**Purpose:** Centralized schedule for all club activities.

**Public View:**
- FullCalendar month/week/day view
- Color-coded events by category
- Click event for detail popup
- Mini calendar widget on dashboard home

**Categories:**
| Category | Color | Use Case |
|----------|-------|----------|
| General | `#8D6E63` (taupe) | Regular announcements |
| Meeting | `#6F4E37` (coffee) | Committee meetings |
| Event / Program | `#4E7C5C` (sage) | Public events |
| Emergency | `#C62828` (warm red) | Urgent notices |
| Custom | `#D4A017` (amber) | User-defined title |

**Restricted Actions:**
- Add event: Modal with title, category (dropdown + conditional custom title), date range, description, location
- Edit: Click event → edit modal
- Delete: Confirmation dialog
- Drag to reschedule (desktop only)

**Data Model:**
- CalendarEvent: id, title, category, custom_category, start_date, end_date, description, location, is_public, created_by

**Design Notes:**
- Calendar cell: 40px min-height, event dots pulse for upcoming items
- Today highlight: Coffee primary container background
- Category badges: Pill-shaped chips in category colors

---

### 4.4 Notice Board (ntb)

**Purpose:** Official club announcements and public notices.

**Public View:**
- Pinned notices displayed prominently at top (horizontal scroll or featured cards)
- Chronological list below: Card with title, excerpt, date, author
- Click to read full notice
- Search by title

**Restricted Actions:**
- Add notice: Rich text editor (TipTap) or markdown. Title, content, pin toggle.
- Edit: Full content editable
- Delete: Confirmation dialog
- Pin/Unpin: `pr`/`vp` only. Max 3 pinned notices at a time.

**Data Model:**
- Notice: id, title, content, is_pinned, is_public, created_by, created_at, updated_at

**Design Notes:**
- Pinned notices: Elevated cards with pin icon (Material "keep" icon), amber left border accent
- Regular notices: Standard cards, 16px radius
- Rich text: Support bold, italic, lists, links. No images in notice content (use gallery for visuals).

---

### 4.5 Donations (dnt)

**Purpose:** Collect funds for Provatferi activities and display appreciation.

**Public Form:**
- Donor name (text input)
- Anonymous checkbox (hides name on public board)
- Email (optional, for receipt)
- Amount (number input)
- Message (optional, textarea)
- Submit button

> **Note:** Phase 1 is record-keeping only (pledge tracking). Phase 2 can integrate Stripe/PayPal for actual payments.

**Donor Board (Public):**
- Grid of donor cards: Name (or "Anonymous"), message snippet, date
- NO amounts displayed
- Filter: Recent / All Time
- Total donor count badge

**Signed-in View (Private):**
- Same donor board PLUS amount column
- Summary statistics: Total donated, average donation, highest donation
- Export to CSV (optional)

**Data Model:**
- Donation: id, donor_name, donor_email, amount, message, is_anonymous, show_on_board, created_at

**Design Notes:**
- Donor cards: Warm cream background, coffee accent border, heart icon
- Anonymous entries: Show "Anonymous" with a masked avatar (Material "incognito" icon)
- Form: Floating labels, amount input with currency prefix (৳ if Bangladeshi, $ if international)

---

### 4.6 Sponsors (spn)

**Purpose:** Allow companies to reach out for sponsorship opportunities.

**Public Form:**
- Company name
- Representative name
- Contact email (required)
- Contact phone
- Brand details / what they offer (textarea)
- Proposed event / program (dropdown of upcoming events or "General")
- Submit button

**Admin View (pr/vp/gs/tr):**
- Table of submissions: Company, representative, email, proposed event, status, date
- Status actions: Pending → Approved / Rejected
- Contact button (opens email client with pre-filled subject)
- Export to CSV

**Data Model:**
- Sponsor: id, company_name, representative_name, contact_email, contact_phone, brand_details, proposed_event, status, created_at

**Design Notes:**
- Form: Professional layout, company icon in header
- Admin table: Status badges (Pending = amber, Approved = sage green, Rejected = warm red)

---

### 4.7 Expense Management (xpm)

**Purpose:** Track all club expenditures with full audit trail.

**Form:**
- Title (text)
- Amount (decimal, min 0)
- Category (dropdown): Venue, Equipment, Transport, Food, Marketing, Miscellaneous
- Description (textarea)
- Receipt image upload (optional)
- Expense date (date picker)
- Submit

**List View:**
- Table: Date, Title, Category, Amount, Receipt (icon if attached), Created By
- Sortable by all columns
- Filter by category, date range
- Pagination: 25 items per page
- Summary row: Total amount for filtered view

**Edit/Delete:**
- Only `pr`, `vp`, `rds` can edit
- Edit triggers audit log + email notification to original creator
- Delete requires confirmation and is logged

**Data Model:**
- Expense: id, title, amount, category, description, receipt_url, expense_date, created_by, created_at, updated_at

**Design Notes:**
- Table: Zebra striping with `--surface-variant`
- Amount column: Right-aligned, monospaced font, coffee color
- Receipt icon: Material "receipt" icon, clickable to open image in lightbox
- Category badges: Tonal chips with category color

---

### 4.8 Budget Management (bgm)

**Purpose:** Plan and monitor project budgets.

**Form:**
- Project name
- Allocated amount (decimal)
- Description (textarea)
- Start date (optional)
- End date (optional)
- Submit

**List View:**
- Table: Project, Allocated, Spent, Remaining, Progress Bar, Status, Dates
- Progress bar: `spent / allocated` as percentage, color-coded (green < 75%, amber 75-95%, red > 95%)
- Status: Active / Completed / Cancelled
- Link to related expenses (filter xpm by project name)

**Edit/Delete:**
- `pr`, `vp`, `cs`, `acs`, `rds` can edit
- Edit triggers audit log + email notification

**Data Model:**
- Budget: id, project_name, allocated_amount, spent_amount, description, start_date, end_date, status, created_by, created_at

**Design Notes:**
- Progress bars: Rounded, 8px height, animated fill on load (800ms)
- Remaining amount: Green if positive, red if negative (over budget)
- Cards alternative: Each project as a card with visual progress ring

---

### 4.9 Records & Audit Log (rcd)

**Purpose:** Centralized history of all changes to financial and operational records.

**View:**
- Unified table showing all audit entries
- Columns: Date/Time, Table, Action, Record ID, Modified By, Original Creator, View Changes
- Filter by table (expenses, budgets, notices, calendar, events), action (create, update, delete), date range
- Sort by date (newest first default)

**Detail Modal:**
- Side-by-side diff: Original data vs New data
- Highlight changed fields with amber background
- Show who made the change and when

**Access:**
- Read: All signed-in users except `alm`
- Edit underlying record: Only `pr`, `vp`, `rds` (navigates to original module)

**Notification:**
- When a record is modified, email sent to original creator
- Email contains: What changed, who changed it, when, link to view
- Uses Resend via Supabase Edge Function

**Data Model:**
- RecordsLog: id, table_name, record_id, action, original_data, new_data, modified_by, original_creator, notified, created_at

**Design Notes:**
- Action badges: Update = amber, Delete = red, Create = sage green
- Diff view: JSON formatted with syntax highlighting (muted colors)
- Table row hover: Reveals "View Record" action button

---

### 4.10 Course Instructor Attendance (cia)

**Purpose:** Track attendance for 6 music courses across 16 class days.

**Courses:**
1. Violin
2. Guitar
3. Ukulele (Western)
4. Ukulele (Dotara)
5. Vocal
6. Flute

**Public View:**
- Grid of 6 course cards
- Each card shows: Course name, instructor, progress bar (classes completed / 16), status
- Click card to expand: List of all 16 days with presence indicator (check/cross)
- Detail per day: Arrival time, exit time, note

**Management View (cc/pr/vp only):**
- Select course (dropdown or tabs)
- Select class day (1–16, grid of buttons)
- Form:
  - Arrival time (time picker)
  - Exit time (time picker)
  - Note (textarea — e.g., "Late by 15 min", "Substitute instructor")
  - Is Present (toggle, default true)
- Submit: If day already has data, shows "Update"; otherwise "Add"
- Below form: Table of all 16 days with edit/delete actions

**Data Model:**
- CourseSchedule: id, course, instructor_id, total_classes, start_date, status
- Attendance: id, course_schedule_id, class_day, arrival_time, exit_time, note, is_present, created_by

**Design Notes:**
- Course cards: Instrument icon (Material "music_note" or custom), warm gradient background
- Day grid: 4×4 grid of day buttons, completed days have checkmark, empty days are outlined
- Time inputs: Material time pickers, 24-hour format

---

### 4.11 Course Insights (coi)

**Purpose:** Visual analytics of course attendance and completion.

**Public Charts:**
- **Completion Overview:** Horizontal bar chart per course showing completed / remaining classes (out of 16)
- **Attendance Trend:** Line chart per course showing daily attendance rate over 16 days
- **Summary Cards:** Total classes held (all courses), average attendance rate, most attended course, least attended course
- **Course Comparison:** Radar chart or grouped bar chart comparing all 6 courses

**Data Source:**
- Aggregated from `attendance` table
- Real-time updates when `cc` adds/modifies attendance

**Design Notes:**
- Charts: Recharts with custom tooltip styling (coffee theme)
- Bar colors: Coffee primary for completed, surface-variant for remaining
- Line colors: Each course gets a distinct warm tone from the palette
- Animated entrance: Bars grow up, lines draw left-to-right

---

### 4.12 Recruitment Bookmark (rec)

**Purpose:** Quick access to external recruitment platform.

**Implementation:**
- Prominent card/button on dashboard home and public landing page
- External link icon (Material "open_in_new")
- URL stored in environment variable or config table
- Opens in new tab

**Design Notes:**
- Card: Elevated style with handshake or people icon
- Gradient background: Coffee to taupe
- Hover: Slight lift + shadow deepen

---

## 5. DATA FLOW & RELATIONSHIPS

### 5.1 Entity Relationship Diagram (Simplified)

```
[User/Auth] ←──→ [Profile] ←──→ [Role]
    │
    ├──→ [Events] ←──→ [EventComments]
    │       ↑
    ├──→ [GalleryItems] (linked to Events)
    │
    ├──→ [CalendarEvents]
    │
    ├──→ [Notices]
    │
    ├──→ [Expenses] ←──→ [RecordsLog]
    │       ↑
    ├──→ [Budgets] ←──→ [RecordsLog]
    │
    ├──→ [Donations] (independent)
    │
    ├──→ [Sponsors] (independent)
    │
    ├──→ [CourseSchedules] ←──→ [Attendance]
    │       ↑
    └──→ [RecordsLog] (audit trail for Expenses + Budgets)
```

### 5.2 Key Relationships

| Parent | Child | Relationship |
|--------|-------|--------------|
| Events | GalleryItems | One-to-Many (an event can have many photos) |
| Events | EventComments | One-to-Many |
| Profiles (as instructor) | CourseSchedules | One-to-Many |
| CourseSchedules | Attendance | One-to-Many (16 entries max) |
| Profiles (as creator) | All tables | One-to-Many (creator tracking) |

**Note on Profiles:** The `display_id` field must strictly follow `{role_code}-{two_digit_number}` format (e.g., `pr-01`, `pps-01`). This is the user's system identifier, separate from their `full_name`.

### 5.3 Data Lifecycle

1. **Creation:** User submits form → Supabase inserts row → RLS validates permissions → Trigger fires (if applicable) → Realtime subscription updates UI
2. **Update:** User edits → Supabase updates → Audit log trigger records change → Email trigger notifies original creator → UI updates via Realtime
3. **Deletion:** User deletes → Confirmation modal → Supabase deletes → Audit log records deletion (with original data) → Email notification → UI removes item

---

## 6. PUBLIC vs PRIVATE SCOPE

### 6.1 Public Modules (No Login Required)

| Module | What's Public | What's Hidden |
|--------|---------------|---------------|
| **Event Forum** | Event list, detail, comments | Add/Edit/Delete buttons |
| **Gallery** | All images, lightbox | Upload/Delete buttons |
| **Calendar** | All events, month/week/day view | Add/Edit/Delete buttons |
| **Notice Board** | All notices, pinned + regular | Add/Edit/Delete/Pin buttons |
| **Donor Board** | Donor names, messages, count | Amounts, donor emails |
| **Course Insights** | All charts, statistics | Raw attendance data table |
| **Sponsor Form** | Submission form | Admin review table |
| **Contact Info** | Committee member names, roles | Personal contact details (optional) |

### 6.2 Private Modules (Login Required)

| Module | Minimum Role | What's Visible |
|--------|--------------|----------------|
| **Expense Management** | `tr`, `ofs`, `ors`, `rds`, `pr`, `vp` | Expense table, forms, receipts |
| **Budget Management** | `cs`, `acs`, `rds`, `pr`, `vp` | Budget table, forms, progress |
| **Records Log** | All except `alm` | Audit history, diffs |
| **Attendance Management** | `cc`, `pr`, `vp` | Attendance forms, day management |
| **Donation Amounts** | Any signed-in user | Amount column in donor board |
| **Admin Panel** | `pr`, `vp` | User management, role assignment |

---

## 7. NOTIFICATION SYSTEM

### 7.1 Email Notifications

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Record edited | Original creator | "Your [expense/budget] record was modified by [Name] on [Date]. View changes." |
| Record deleted | Original creator | "Your [expense/budget] record was deleted by [Name]." |
| New sponsor inquiry | `pr`, `vp`, `gs`, `tr` | "New sponsor inquiry from [Company]." |
| New donation | `tr`, `pr`, `vp` | "New donation received from [Donor Name]." (optional) |
| Role changed | Affected user | "Your role has been updated to [New Role] by [Admin]." |

### 7.2 In-App Notifications (Future Enhancement)

- Bell icon in top app bar with badge count
- Dropdown panel showing recent notifications
- Mark as read / clear all
- Types: Record changes, new comments on your events, sponsor updates

### 7.3 Realtime Updates

- Supabase Realtime subscriptions for:
  - New events appearing in calendar
  - New comments on event detail page
  - New gallery uploads
  - New notices
- No page refresh required

---

## 8. FUTURE CONSIDERATIONS

### 8.1 Phase 2 Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| **Payment Gateway** | Integrate Stripe/bKash for real donation processing | Medium |
| **In-App Notifications** | Bell icon with notification panel | Medium |
| **Mobile App** | React Native or PWA wrapper | Low |
| **Advanced Analytics** | Monthly financial reports, attendance heatmaps | Low |
| **Multi-Language** | Bengali + English support | Low |
| **SMS Alerts** | Twilio integration for urgent notices | Low |
| **Document Vault** | Upload meeting minutes, constitutions, certificates | Medium |
| **Member Directory** | Searchable profiles with contact info (role-based visibility) | Medium |
| **Task Management** | Assign tasks to roles with deadlines | Low |
| **Event Registration** | Public event RSVP system | Medium |

### 8.2 Scalability Planning

- Current free tier handles ~500MB DB + 1GB storage
- If gallery grows beyond 1GB: Migrate to Cloudflare R2 (zero egress fees)
- If user base grows beyond free tier: Supabase Pro ($25/mo) or self-hosted PostgreSQL
- If email volume exceeds 3,000/mo: Resend paid tier ($20/mo for 50,000)

---

## 9. OPEN QUESTIONS & TODOs

### 9.1 Decisions Needed

- [ ] **Password Policy:** What are the minimum requirements? (e.g., 8 chars, 1 number, 1 symbol)
- [ ] **Domain Strategy:** Is `home.provatferi2009.workers.dev` final? Do you own `provatferi2009.workers.dev` already?
- [ ] **Currency:** Are donations/expenses in BDT (৳) or USD ($)?
- [ ] **Committee Term:** How long is a committee term? This affects role transition workflows.
- [ ] **Alumni Onboarding:** How do alumni get accounts? Self-register then request role change? Or admin creates accounts?
- [ ] **Image Retention:** Should deleted gallery images be soft-deleted (hidden but recoverable) or hard-deleted?
- [ ] **Notice Expiry:** Should notices auto-archive after a certain period?
- [ ] **Sponsor Workflow:** What happens after a sponsor is "approved"? Is there a contract template?
- [ ] **Donation Receipts:** Should donors receive an email receipt automatically?

### 9.2 Content Preparation

- [ ] **Logo & Brand Assets:** High-res Provatferi logo, brand colors (if different from coffee palette), favicon
- [ ] **Committee Photos:** Profile photos for current committee members
- [ ] **Historical Data:** Past events, old gallery photos, previous budgets/expenses (for seeding)
- [ ] **Course Details:** Current instructor names, start dates for each of the 6 courses
- [ ] **Contact Information:** Public contact details (email, phone, social media links)
- [ ] **Recruitment URL:** External link for the Recruitment bookmark
- [ ] **Constitution/Bylaws:** Document defining roles and responsibilities (for reference during development)

### 9.3 Technical TODOs

- [ ] Set up Supabase project and note the project reference + API keys
- [ ] Create Cloudflare Pages project and connect GitHub repo
- [ ] Register Resend account and verify sending domain
- [ ] Set up GitHub repository with keep-alive workflow
- [ ] Configure environment variables for all services
- [ ] Create test accounts for each role (14+ accounts)
- [ ] Seed database with initial roles and sample data
- [ ] Test RLS policies with each role account
- [ ] Verify email notifications are delivered correctly
- [ ] Run accessibility audit (contrast ratios, keyboard navigation)
- [ ] Performance test on slow 3G connection

### 9.4 Design TODOs

- [ ] Finalize coffee palette hex codes (if different from suggested)
- [ ] Create/provide Provatferi logo in SVG format
- [ ] Decide on custom instrument icons for the 6 courses (or use Material icons)
- [ ] Choose loading animation style (coffee cup fill, spinner, etc.)
- [ ] Design empty state illustrations (or use Material empty state patterns)
- [ ] Define error page designs (404, 403, 500)
- [ ] Create onboarding flow for first-time users

---

## APPENDIX A: ROLE ABBREVIATION REFERENCE

| Short | Full Title |
|-------|------------|
| PR | President |
| VP | Vice President |
| GS | General Secretary |
| JGS | Joint General Secretary |
| TR | Treasurer |
| OFS | Office Secretary |
| ORS | Organizing Secretary |
| CS | Cultural Secretary |
| ACS | Assistant Cultural Secretary |
| PPS | Publicity & Publication Secretary |
| PRS | Public Relations Secretary |
| RDS | Record & Documentation Secretary |
| CC | Course Coordinator |
| ALM | Alumni |

## APPENDIX B: MODULE ABBREVIATION REFERENCE

| Short | Full Name | Visibility |
|-------|-----------|------------|
| EVF | Event Forum | Public |
| GLR | Gallery | Public |
| CLN | Calendar | Public |
| NTB | Notice Board | Public |
| DNT | Donations | Public Form + Tiered Data |
| SPN | Sponsors | Public Form + Admin Review |
| XPM | Expense Management | Private |
| BGM | Budget Management | Private |
| RCD | Records & Audit Log | Private (Read-Only) |
| CIA | Course Instructor Attendance | Public View + Private Form |
| COI | Course Insights | Public |
| REC | Recruitment (External) | Public |

---

> **End of Document**  
> This is a living document. Modify, add, or remove sections as the project evolves. All sections are suggestions — nothing is final until build begins.
