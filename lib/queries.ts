'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase/client';
import { useAuthStore } from './auth-store';
import { COMMITTEE_ROLES, ROLE_ORDER } from './permissions';
import type {
  AlumniMember,
  AppNotification,
  AttendanceRecord,
  Budget,
  RootBankBalance,
  RootBankBudget,
  RootBankExpense,
  CalendarEvent,
  ClubBalance,
  CommitteeMember,
  CourseSchedule,
  Donation,
  DonorBoardEntry,
  EventComment,
  EventItem,
  EventRsvp,
  Expense,
  GalleryItem,
  Notice,
  Profile,
  RecordsLog,
  RoleExtraPermission,
  RolePermission,
  Sponsor,
  UserNotificationSettings
} from './types';

const PROFILE_SELECT = 'id, full_name, avatar_url';

function embed(schema: string) {
  return `${schema}, profiles(${PROFILE_SELECT})`;
}

// Supabase's generated types are not wired up here, so select() returns a generic
// shape. These helpers keep row typing explicit and safe at the boundary.
function asRows<T>(data: unknown): T[] {
  return (data ?? []) as unknown as T[];
}

function asRow<T>(data: unknown): T | null {
  return (data ?? null) as unknown as T | null;
}

// ---------- Events ----------
export function useEvents(status?: string) {
  return useQuery({
    queryKey: ['events', status ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('events')
        .select(
          `*, profiles!events_created_by_fkey(${PROFILE_SELECT}), organizer:profiles!events_organizer_id_fkey(${PROFILE_SELECT}), coordinator:profiles!events_coordinator_id_fkey(${PROFILE_SELECT})`
        )
        .order('event_date', { ascending: false });
      if (status && status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return asRows<EventItem>(data);
    }
  });
}

export function useEvent(id?: string) {
  return useQuery({
    queryKey: ['events', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(
          `*, profiles!events_created_by_fkey(${PROFILE_SELECT}), organizer:profiles!events_organizer_id_fkey(${PROFILE_SELECT}), coordinator:profiles!events_coordinator_id_fkey(${PROFILE_SELECT})`
        )
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return asRow<EventItem>(data);
    }
  });
}

export function useEventComments(eventId?: string) {
  return useQuery({
    queryKey: ['event-comments', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_comments')
        .select(`*, profiles(${PROFILE_SELECT})`)
        .eq('event_id', eventId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return asRows<EventComment>(data);
    }
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, content }: { eventId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in required');
      const { error } = await supabase
        .from('event_comments')
        .insert({ event_id: eventId, user_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['event-comments', v.eventId] })
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('event_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['event-comments', v.eventId] })
  });
}

// ---------- Event RSVPs (00022_event_rsvps.sql) ----------

/** Full RSVP list for an event with attendee profiles (guest lists). */
export function useEventRsvps(eventId?: string) {
  return useQuery({
    queryKey: ['event-rsvps', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`*, profiles(${PROFILE_SELECT})`)
        .eq('event_id', eventId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return asRows<EventRsvp>(data);
    }
  });
}

/** Lightweight going/interested counts for a single event. */
export function useEventRsvpCounts(eventId?: string) {
  return useQuery({
    queryKey: ['event-rsvp-counts', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const [going, interested] = await Promise.all([
        supabase
          .from('event_rsvps')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', eventId!)
          .eq('status', 'going'),
        supabase
          .from('event_rsvps')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', eventId!)
          .eq('status', 'interested')
      ]);
      if (going.error) throw going.error;
      if (interested.error) throw interested.error;
      return { going: going.count ?? 0, interested: interested.count ?? 0 };
    }
  });
}

/** Insert/update (upsert) or delete the signed-in user's RSVP for an event. */
export function useSetEventRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: 'interested' | 'going' | null }) => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in required');
      if (status === null) {
        const { error } = await supabase
          .from('event_rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from('event_rsvps')
        .upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: 'event_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-rsvp-counts'] });
      qc.invalidateQueries({ queryKey: ['event-rsvps'] });
      qc.invalidateQueries({ queryKey: ['my-rsvps'] });
    }
  });
}

// ---------- Gallery ----------
export function useGallery() {
  return useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_items')
        .select(`*, events(id, title, event_date, status)`)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return asRows<GalleryItem>(data);
    }
  });
}

// ---------- Calendar ----------
export function useCalendarEvents() {
  return useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('is_public', true)
        .order('start_date', { ascending: true });
      if (error) throw error;
      return asRows<CalendarEvent>(data);
    }
  });
}

// ---------- Notices ----------
export function useNotices() {
  return useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select(`*, profiles(${PROFILE_SELECT})`)
        .eq('is_public', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return asRows<Notice>(data);
    }
  });
}

export function useNotice(id?: string) {
  return useQuery({
    queryKey: ['notices', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select(`*, profiles(${PROFILE_SELECT})`)
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return asRow<Notice>(data);
    }
  });
}

// ---------- Donations ----------
export function useDonorBoard() {
  return useQuery({
    queryKey: ['donor-board'],
    queryFn: async () => {
      // SECURITY DEFINER RPC (migration 00027) — replaces the donor_board view
      // so the linter's security-definer-view finding is resolved.
      const { data, error } = await supabase.rpc('get_donor_board');
      if (error) throw error;
      return asRows<DonorBoardEntry>(data);
    }
  });
}

export function useDonations(enabled = false) {
  return useQuery({
    queryKey: ['donations'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return asRows<Donation>(data);
    }
  });
}

// ---------- Sponsors ----------
export function useSponsors(enabled = false) {
  return useQuery({
    queryKey: ['sponsors'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return asRows<Sponsor>(data);
    }
  });
}

// ---------- Expenses ----------
export function useExpenses(enabled = false) {
  return useQuery({
    queryKey: ['expenses'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(embed('*'))
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return asRows<Expense>(data);
    }
  });
}

// ---------- Budgets ----------
export function useBudgets(enabled = false) {
  return useQuery({
    queryKey: ['budgets'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select(embed('*'))
        .order('created_at', { ascending: false });
      if (error) throw error;
      return asRows<Budget>(data);
    }
  });
}

// ---------- Universal balance (00025) ----------

/**
 * Universal club balance — the same aggregated totals for every signed-in
 * user (migration 00027 `get_club_balance` RPC — replaced the club_balance
 * view). Invalidate with `useRealtimeInvalidate('expenses'/'budgets',
 * [['club-balance']])` so the widgets refresh live.
 */
export function useClubBalance(enabled = true) {
  // Refresh the universal total live whenever finance data changes. Centralized
  // here (not in each consumer) so widgets like the sidebar + dashboard balance
  // card don't open duplicate realtime channels.
  useRealtimeInvalidate('expenses', [['club-balance']]);
  useRealtimeInvalidate('budgets', [['club-balance']]);

  return useQuery({
    queryKey: ['club-balance'],
    enabled,
    queryFn: async () => {
      // SECURITY DEFINER RPC (migration 00027) — replaces the club_balance view
      // so the linter's security-definer-view finding is resolved.
      const { data, error } = await supabase.rpc('get_club_balance').maybeSingle();
      if (error) throw error;
      return asRow<ClubBalance>(data);
    }
  });
}

// ---------- Root Bank (migration 00037) ----------
// Independent budget/expense system — RLS restricts every row to root, pr,
// admin only, so these queries return nothing for every other role.

export function useRootBankBudgets(enabled = false) {
  return useQuery({
    queryKey: ['root-bank-budgets'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('root_bank_budgets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return asRows<RootBankBudget>(data);
    }
  });
}

export function useRootBankExpenses(enabled = false) {
  return useQuery({
    queryKey: ['root-bank-expenses'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('root_bank_expenses')
        .select(embed('*'))
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return asRows<RootBankExpense>(data);
    }
  });
}

/**
 * Universal Root Bank balance — computed server-side via the
 * `get_root_bank_balance` RPC so the allowed roles all see identical totals.
 * Refreshes live whenever root bank finance data changes.
 */
export function useRootBankBalance(enabled = true) {
  useRealtimeInvalidate('root_bank_expenses', [['root-bank-balance']]);
  useRealtimeInvalidate('root_bank_budgets', [['root-bank-balance']]);

  return useQuery({
    queryKey: ['root-bank-balance'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_root_bank_balance').maybeSingle();
      if (error) throw error;
      return asRow<RootBankBalance>(data);
    }
  });
}

// ---------- Records ----------
export function useRecords(enabled = false) {
  return useQuery({
    queryKey: ['records'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('records_log')
        .select(
          `*, modifier:profiles!records_log_modified_by_fkey(${PROFILE_SELECT}), creator:profiles!records_log_original_creator_fkey(${PROFILE_SELECT})`
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return asRows<RecordsLog>(data);
    }
  });
}

// ---------- Courses & Attendance ----------
export function useCourseSchedules() {
  return useQuery({
    queryKey: ['course-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_schedules')
        .select(`*, instructor:profiles(${PROFILE_SELECT})`)
        .order('course', { ascending: true });
      if (error) throw error;
      return asRows<CourseSchedule>(data);
    }
  });
}

export function useAttendance(courseScheduleId?: string) {
  return useQuery({
    queryKey: ['attendance', courseScheduleId],
    enabled: !!courseScheduleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('course_schedule_id', courseScheduleId!)
        .order('class_day', { ascending: true });
      if (error) throw error;
      return asRows<AttendanceRecord>(data);
    }
  });
}

export function useAllAttendance(enabled = true) {
  return useQuery({
    queryKey: ['attendance', 'all'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('class_day', { ascending: true });
      if (error) throw error;
      return asRows<AttendanceRecord>(data);
    }
  });
}

// ---------- Committee / config ----------

/**
 * All active committee members — every profile whose role is neither visitor
 * nor alumni (see committee-members-reference.md). Derived directly from
 * `profiles.role_id`, so the roster always mirrors the real roles.
 */
export function useCommitteeMembers() {
  return useQuery({
    queryKey: ['committee-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`id, full_name, avatar_url, email, phone, role_id, is_active, roles(id, name, display_order)`)
        .in('role_id', COMMITTEE_ROLES)
        .eq('is_active', true);
      if (error) throw error;
      const rows = asRows<CommitteeMember>(data);
      // Order by role hierarchy (ROLE_ORDER), then by name within a role.
      const rank = new Map(ROLE_ORDER.map((r, i) => [r, i]));
      return rows.sort(
        (a, b) =>
          (rank.get(a.role_id) ?? 99) - (rank.get(b.role_id) ?? 99) ||
          (a.full_name ?? '').localeCompare(b.full_name ?? '')
      );
    }
  });
}

/**
 * All active alumni — every profile whose role is `alm`. Public directory:
 * name, contact details, department and session for the alumni page.
 */
export function useAlumni() {
  return useQuery({
    queryKey: ['alumni'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email, phone, academic_session, department')
        .eq('role_id', 'alm')
        .eq('is_active', true)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return asRows<AlumniMember>(data);
    }
  });
}

export function useAppConfig(key: string) {
  return useQuery({
    queryKey: ['app-config', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? '') as string;
    }
  });
}

// ---------- Admin: users & roles ----------
export function useProfiles(enabled = false) {
  return useQuery({
    queryKey: ['profiles'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role_id', { ascending: true });
      if (error) throw error;
      return asRows<Profile>(data);
    }
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('roles').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      return asRows<{ id: string; name: string; display_order: number }>(data);
    }
  });
}

import { subscribeTable, unsubscribeTable } from './realtime-subscriptions';

/**
 * Subscribes to Supabase Realtime changes on a table and invalidates the given
 * React Query keys, so lists/charts refresh without a manual reload.
 * Requires the table to be part of the `supabase_realtime` publication
 * (see supabase/migrations/00009_realtime.sql).
 */
export function useRealtimeInvalidate(table: string, queryKeys: Array<Array<string | number>>) {
  const qc = useQueryClient();
  const keysKey = JSON.stringify(queryKeys);

  React.useEffect(() => {
    const onChanges = (keys: string[]) => {
      for (const k of keys) {
        qc.invalidateQueries({ queryKey: JSON.parse(k) as Array<string | number> });
      }
    };
    for (const key of queryKeys) {
      subscribeTable(table, key, onChanges);
    }
    return () => {
      for (const key of queryKeys) {
        unsubscribeTable(table, key);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, keysKey, qc]);
}

// ---------- In-app notifications (spec §7) ----------

/**
 * Fetches the signed-in user's recent notifications and subscribes to Realtime
 * so the bell badge updates the moment a new notification is inserted (the
 * insert happens server-side via DB triggers — see 00017_inapp_notifications.sql).
 *
 * `onInsert` is called with each newly-inserted notification (used by the bell
 * menu to show a live toast/preview). The callback is stored in a ref, so a
 * changing identity does not resubscribe the channel.
 */
export function useNotifications(enabled = false, onInsert?: (n: AppNotification) => void) {
  const { user } = useAuthStore();
  const userId = user?.id;
  const qc = useQueryClient();
  const onInsertRef = React.useRef(onInsert);
  React.useEffect(() => {
    onInsertRef.current = onInsert;
  }, [onInsert]);

  const query = useQuery({
    queryKey: ['notifications', userId],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return asRows<AppNotification>(data);
    }
  });

  React.useEffect(() => {
    if (!enabled || !userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            onInsertRef.current?.(payload.new as unknown as AppNotification);
          }
          // Invalidate the list and the exact unread-count query together.
          qc.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, qc]);

  return query;
}

/**
 * Exact unread count for the bell badge. Uses a `head: true` count query (no
 * row payload) so it is not capped by the 30-row list query — the badge always
 * reflects the true number of unread notifications. Realtime invalidations from
 * `useNotifications` (and the mark-read/clear mutations) keep it fresh.
 */
export function useUnreadNotificationCount(enabled = false) {
  const { user } = useAuthStore();
  const userId = user?.id;

  return useQuery({
    queryKey: ['notifications', userId, 'unread-count'],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    }
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] })
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] })
  });
}

export function useClearNotifications() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] })
  });
}

// ---------- Role Permissions (migration 00029) ----------

/**
 * Fetch all role permissions from the database.
 */
export function useRolePermissions() {
  return useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role_id');
      if (error) throw error;
      return asRows<RolePermission>(data);
    }
  });
}

/**
 * Fetch all extra permissions from the database.
 */
export function useRoleExtraPermissions() {
  return useQuery({
    queryKey: ['role-extra-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_extra_permissions')
        .select('*')
        .order('role_id');
      if (error) throw error;
      return asRows<RoleExtraPermission>(data);
    }
  });
}

/**
 * Update a role's module permission.
 */
export function useUpdateRolePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      moduleId,
      canRead,
      canWrite
    }: {
      roleId: string;
      moduleId: string;
      canRead: boolean;
      canWrite: boolean;
    }) => {
      const { error } = await supabase
        .from('role_permissions')
        .upsert(
          { role_id: roleId, module_id: moduleId, can_read: canRead, can_write: canWrite },
          { onConflict: 'role_id,module_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['role-permissions'] })
  });
}

/**
 * Update a role's extra permissions.
 */
export function useUpdateRoleExtraPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      permissions
    }: {
      roleId: string;
      permissions: Partial<Omit<RoleExtraPermission, 'id' | 'role_id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { error } = await supabase
        .from('role_extra_permissions')
        .upsert(
          { role_id: roleId, ...permissions },
          { onConflict: 'role_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['role-extra-permissions'] })
  });
}

// ---------- Notification preferences (spec §7 + migration 00019) ----------

export const DEFAULT_NOTIFICATION_SETTINGS = {
  mute_record_change: false,
  mute_role_change: false,
  mute_sponsor_inquiry: false,
  mute_donation: false,
  mute_event_comment: false,
  mute_event_rsvp: false
};

/**
 * Fetches the signed-in user's notification preferences. If no row exists yet
 * the user is treated as having all categories enabled (the DB default).
 */
export function useNotificationSettings(enabled = false) {
  const { user } = useAuthStore();
  const userId = user?.id;

  return useQuery({
    queryKey: ['notification-settings', userId],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return { user_id: userId!, ...DEFAULT_NOTIFICATION_SETTINGS, updated_at: '' } as UserNotificationSettings;
      }
      return data as UserNotificationSettings;
    }
  });
}

/**
 * Upserts the user's preference row (creates it on first toggle).
 */
export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<UserNotificationSettings, 'mute_record_change' | 'mute_role_change' | 'mute_sponsor_inquiry' | 'mute_donation' | 'mute_event_comment' | 'mute_event_rsvp'>>) => {
      if (!user) throw new Error('Sign in required');
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-settings'] })
  });
}
