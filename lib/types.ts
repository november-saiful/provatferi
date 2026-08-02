// Row types mirroring the Supabase schema. Keep in sync with /supabase/migrations.

export type RoleId =
  | 'pr'
  | 'vp'
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
  display_id: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  academic_session: string | null;
  department: string | null;
  hall_name: string | null;
  reg_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
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
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'id' | 'full_name'> | null;
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

export interface GalleryItem {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  event_id: string | null;
  uploaded_by: string | null;
  is_public: boolean;
  created_at: string;
  events?: Pick<EventItem, 'id' | 'title'> | null;
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
  profiles?: Pick<Profile, 'id' | 'full_name'> | null;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string | null;
  description: string | null;
  receipt_url: string | null;
  expense_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'id' | 'full_name'> | null;
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
  profiles?: Pick<Profile, 'id' | 'full_name'> | null;
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
  notified: boolean;
  created_at: string;
  modifier?: Pick<Profile, 'id' | 'full_name'> | null;
  creator?: Pick<Profile, 'id' | 'full_name'> | null;
}

export type CourseType = 'violin' | 'guitar' | 'ukulele-western' | 'ukulele-dotara' | 'vocal' | 'flute';

export interface CourseSchedule {
  id: string;
  course: CourseType;
  instructor_id: string | null;
  total_classes: number;
  start_date: string | null;
  status: string;
  instructor?: Pick<Profile, 'id' | 'full_name'> | null;
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
  contact_email: string;
  contact_phone: string | null;
  brand_details: string | null;
  proposed_event: string | null;
  status: string;
  created_at: string;
}

export interface CommitteeContact {
  id: string;
  role_id: string | null;
  profile_id: string | null;
  display_order: number | null;
  is_public: boolean;
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  roles?: { id: string; name: string } | null;
}

export interface AppConfig {
  key: string;
  value: string;
}
