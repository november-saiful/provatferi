// Row types mirroring the Supabase schema. Keep in sync with /supabase/migrations.

export type RoleId =
  | 'root'
  | 'pr'
  | 'vp'
  | 'admin'
  | 'gs'
  | 'jgs'
  | 'tr'
  | 'ofs'
  | 'ors'
  | 'cs'
  | 'acs'
  | 'pps'
  | 'prs'
  | 'rds'
  | 'cc'
  | 'alm'
  | 'visitor';

export type ModuleId =
  | 'evf'
  | 'glr'
  | 'cln'
  | 'ntb'
  | 'dnt'
  | 'spn'
  | 'xpm'
  | 'bgm'
  | 'rcd'
  | 'cia'
  | 'coi'
  | 'admin';

export interface Profile {
  id: string;
  role_id: RoleId;
  full_name: string | null;
  email: string;
  phone: string | null;
  academic_session: string | null;
  department: string | null;
  hall_name: string | null;
  reg_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  status: 'upcoming' | 'ongoing' | 'past';
  event_date: string | null;
  location: string | null;
  cover_image: string | null;
  created_by: string | null;
  /** Selected organizer (আয়োজক) — falls back to the creator when unset. */
  organizer_id: string | null;
  /** Selected coordinator (সংগঠক) — a committee member credited alongside the organizer. */
  coordinator_id: string | null;
  /** Courtesy line (সৌজন্যে) — a person or organization name. */
  courtesy: string | null;
  created_at: string;
  updated_at: string;
  /** Creator profile (created_by). */
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  /** Selected organizer profile (organizer_id). */
  organizer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  /** Selected coordinator profile (coordinator_id). */
  coordinator?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  comments?: EventComment[];
}

export interface EventComment {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

export type RsvpStatus = 'interested' | 'going';

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

export interface GalleryItem {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  event_id: string | null;
  uploaded_by: string | null;
  is_public: boolean;
  created_at: string;
  events?: Pick<EventItem, 'id' | 'title' | 'event_date' | 'status'> | null;
}

export type CalendarCategory = 'general' | 'meeting' | 'event' | 'emergency' | 'custom';

export interface CalendarEvent {
  id: string;
  title: string;
  category: CalendarCategory;
  custom_category: string | null;
  start_date: string;
  end_date: string | null;
  description: string | null;
  location: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string | null;
  description: string | null;
  receipt_url: string | null;
  expense_date: string;
  budget_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

export interface Budget {
  id: string;
  project_name: string;
  allocated_amount: number;
  spent_amount: number;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

export type RecordAction = 'create' | 'update' | 'delete';
export type RecordTableName = 'expenses' | 'budgets' | 'notices' | 'calendar_events' | 'events';

export interface RecordsLog {
  id: string;
  table_name: RecordTableName;
  record_id: string;
  action: RecordAction;
  original_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  modified_by: string | null;
  original_creator: string | null;
  created_at: string;
  modifier?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  creator?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

export type CourseType = 'violin' | 'guitar' | 'ukulele-western' | 'ukulele-dotara' | 'vocal' | 'flute';

export interface CourseSchedule {
  id: string;
  course: CourseType;
  instructor_id: string | null;
  total_classes: number;
  start_date: string | null;
  status: string;
  instructor?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

export interface AttendanceRecord {
  id: string;
  course_schedule_id: string;
  class_day: number;
  arrival_time: string | null;
  exit_time: string | null;
  note: string | null;
  is_present: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_name: string;
  donor_email: string | null;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  show_on_board: boolean;
  payment_method: 'bkash' | 'nagad' | null;
  transaction_id: string | null;
  created_at: string;
}

export interface DonorBoardEntry {
  id: string;
  donor_name: string;
  message: string | null;
  created_at: string;
}

export interface Sponsor {
  id: string;
  company_name: string;
  representative_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  brand_details: string | null;
  proposed_event: string | null;
  status: string;
  payment_method: 'bkash' | 'nagad' | null;
  transaction_id: string | null;
  created_at: string;
}

/**
 * A committee member — every profile whose role is neither visitor nor alumni
 * (see committee-members-reference.md). Fetched from `profiles` joined with
 * `roles`, so the roster always mirrors the real roles.
 */
export interface CommitteeMember {
  id: string;
  role_id: RoleId;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  roles?: { id: string; name: string; display_order: number } | null;
}

export interface AppConfig {
  key: string;
  value: string;
}

/**
 * Universal club balance (migration 00025). Computed server-side so every
 * user sees identical totals regardless of their role's row-level access.
 */
export interface ClubBalance {
  allocated: number | string;
  spent: number | string;
  donations: number | string;
}

// ── In-app notifications (spec §7) ───────────────────────────────────────

export type AppNotificationType =
  | 'record_edited'
  | 'record_deleted'
  | 'sponsor_inquiry'
  | 'donation'
  | 'role_changed'
  | 'event_comment'
  | 'event_rsvp';

export interface AppNotification {
  id: string;
  user_id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  data: { href?: string; [key: string]: unknown } | null;
  is_read: boolean;
  created_at: string;
}

/**
 * Per-user notification preferences (migration 00019). A `mute_*` flag of
 * true stops the DB triggers from inserting that notification type.
 */
export interface UserNotificationSettings {
  user_id: string;
  mute_record_change: boolean;
  mute_role_change: boolean;
  mute_sponsor_inquiry: boolean;
  mute_donation: boolean;
  mute_event_comment: boolean;
  mute_event_rsvp: boolean;
  updated_at: string;
}

// ── Role Permissions (migration 00029) ─────────────────────────────────────

export interface RolePermission {
  id: string;
  role_id: RoleId;
  module_id: ModuleId;
  can_read: boolean;
  can_write: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleExtraPermission {
  id: string;
  role_id: RoleId;
  pin_notices: boolean;
  edit_expense: boolean;
  edit_budget: boolean;
  manage_sponsors: boolean;
  manage_donations: boolean;
  manage_attendance: boolean;
  manage_users: boolean;
  created_at: string;
  updated_at: string;
}
