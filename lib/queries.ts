'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase/client';
import { useAuthStore } from './auth-store';
import type {
  AppNotification,
  AttendanceRecord,
  Budget,
  CalendarEvent,
  CommitteeContact,
  CourseSchedule,
  Donation,
  DonorBoardEntry,
  EventComment,
  EventItem,
  Expense,
  GalleryItem,
  Notice,
  Profile,
  RecordsLog,
  Sponsor
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
        .select(`*, profiles(${PROFILE_SELECT})`)
        .order('event_date', { ascending: true });
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
        .select(`*, profiles(${PROFILE_SELECT})`)
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

// ---------- Gallery ----------
export function useGallery() {
  return useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_items')
        .select(`*, events(id, title)`)
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
      const { data, error } = await supabase
        .from('donor_board')
        .select('id, donor_name, message, created_at')
        .order('created_at', { ascending: false });
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
export function useCommitteeContacts() {
  return useQuery({
    queryKey: ['committee-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_contacts')
        .select(`*, profiles(${PROFILE_SELECT}), roles(id, name)`)
        .eq('is_public', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return asRows<CommitteeContact>(data);
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
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          for (const key of queryKeys) {
            qc.invalidateQueries({ queryKey: key });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, keysKey, qc]);
}

// ---------- In-app notifications (spec §7) ----------

/**
 * Fetches the signed-in user's recent notifications and subscribes to Realtime
 * so the bell badge updates the moment a new notification is inserted (the
 * insert happens server-side via DB triggers — see 00017_inapp_notifications.sql).
 */
export function useNotifications(enabled = false) {
  const { user } = useAuthStore();
  const userId = user?.id;
  const qc = useQueryClient();

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
        () => {
          qc.invalidateQueries({ queryKey: ['notifications', userId] });
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
