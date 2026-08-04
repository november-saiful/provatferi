'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Sparkles, Users } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn, toBengaliDigits } from '@/lib/utils';
import { EVENT_STATUS_LABELS } from '@/lib/constants';
import { useAuthStore } from '@/lib/auth-store';
import { supabase } from '@/lib/supabase/client';
import {
  useEventRsvpCounts,
  useSetEventRsvp,
  useRealtimeInvalidate
} from '@/lib/queries';

// ── Shared Facebook-style event UI (forum, detail page and homepage) ──

export const STATUS_PILL: Record<string, { dot: string; text: string; bg: string }> = {
  upcoming: { dot: 'bg-gold-500', text: 'text-gold-700 dark:text-gold-300', bg: 'bg-gold-100/80 dark:bg-gold-900/50' },
  ongoing: { dot: 'bg-sage-500', text: 'text-sage-700 dark:text-sage-300', bg: 'bg-sage-100/80 dark:bg-sage-900/50' },
  past: { dot: 'bg-taupe-400', text: 'text-taupe-700 dark:text-taupe-300', bg: 'bg-taupe-100/80 dark:bg-taupe-900/50' }
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const pill = STATUS_PILL[status];
  if (!pill) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm',
        pill.bg,
        pill.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', pill.dot)} aria-hidden />
      {EVENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** Compact Bengali date box: month word + Bengali day number. */
export function dateBox(value?: string | null) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return {
    month: d.toLocaleDateString('bn', { month: 'short' }),
    day: toBengaliDigits(d.getDate())
  };
}

export function compactDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('bn', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export type RsvpState = Record<string, 'interested' | 'going' | null>;

export function RsvpButtons({
  eventId,
  rsvp,
  onToggle,
  compact = false
}: {
  eventId: string;
  rsvp: RsvpState;
  onToggle: (id: string, type: 'interested' | 'going') => void;
  compact?: boolean;
}) {
  const size = compact ? 'px-2.5 py-1.5 text-[11px]' : 'flex-1 py-2 text-xs';
  const state = rsvp[eventId];

  return (
    <div className={cn('flex gap-2', !compact && 'w-full')}>
      <button
        type="button"
        onClick={() => onToggle(eventId, 'interested')}
        aria-pressed={state === 'interested'}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-200 active:scale-[0.97]',
          size,
          'rounded-lg',
          state === 'interested'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-muted text-foreground hover:bg-muted/70 hover:text-primary'
        )}
      >
        <Sparkles className={cn('h-3.5 w-3.5', compact && 'h-3 w-3')} aria-hidden />
        আগ্রহী
      </button>
      <button
        type="button"
        onClick={() => onToggle(eventId, 'going')}
        aria-pressed={state === 'going'}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-200 active:scale-[0.97]',
          size,
          'rounded-lg',
          state === 'going'
            ? 'bg-sage-600 text-white shadow-sm'
            : 'bg-muted text-foreground hover:bg-muted/70 hover:text-sage-700 dark:hover:text-sage-300'
        )}
      >
        <CalendarDays className={cn('h-3.5 w-3.5', compact && 'h-3 w-3')} aria-hidden />
        যাব
      </button>
    </div>
  );
}

/**
 * RSVP state backed by the `event_rsvps` table. Pass the ids of every event in
 * view: the hook fetches the signed-in user's rows for those events in one
 * query, toggles optimistically, and persists via upsert/delete. Anonymous
 * users get a sign-in prompt. Counts refresh live via Realtime.
 */
export function useRsvp(eventIds: string[]) {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;
  const [local, setLocal] = React.useState<RsvpState>({});
  // Ids whose optimistic change hasn't been confirmed by the server yet —
  // prevents a stale query response from clobbering the fresh local value.
  const dirtyRef = React.useRef<Set<string>>(new Set());

  const enabled = !!userId && eventIds.length > 0;
  const { data: myRsvps } = useQuery({
    queryKey: ['my-rsvps', userId ?? 'anon', eventIds],
    enabled,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('event_id, status')
        .eq('user_id', userId)
        .in('event_id', eventIds);
      if (error) throw error;
      return (data ?? []) as Array<{ event_id: string; status: string }>;
    }
  });

  React.useEffect(() => {
    const server: RsvpState = {};
    for (const r of myRsvps ?? []) {
      if (r.status === 'interested' || r.status === 'going') server[r.event_id] = r.status;
    }
    setLocal((prev) => {
      const next = { ...server };
      dirtyRef.current.forEach((id) => {
        if (id in prev) next[id] = prev[id];
      });
      return next;
    });
  }, [myRsvps]);

  const setRsvp = useSetEventRsvp();

  const handleRsvp = (id: string, type: 'interested' | 'going') => {
    if (!userId) {
      toast('অংশগ্রহণ নিশ্চিত করতে সাইন ইন করুন');
      router.push('/login');
      return;
    }
    const next = local[id] === type ? null : type;
    dirtyRef.current.add(id);
    setLocal((prev) => ({ ...prev, [id]: next }));
    toast.success(
      next === 'going'
        ? 'দারুণ! ইভেন্টে যাচ্ছেন বলে চিহ্নিত হয়েছে'
        : next === 'interested'
          ? 'আগ্রহ প্রকাশ করা হয়েছে'
          : 'আপনার জবাব সরানো হয়েছে'
    );
    setRsvp.mutate(
      { eventId: id, status: next },
      {
        onSuccess: () => dirtyRef.current.delete(id),
        onError: (err) => {
          dirtyRef.current.delete(id);
          toast.error(err.message);
          qc.invalidateQueries({ queryKey: ['my-rsvps'] });
        }
      }
    );
  };

  // Live updates: counts and lists refresh the moment anyone RSVPs.
  useRealtimeInvalidate('event_rsvps', [['event-rsvp-counts'], ['event-rsvps'], ['my-rsvps']]);

  return { rsvp: local, handleRsvp };
}

/** Compact "X জন যাচ্ছে · Y আগ্রহী" counter for event cards and heroes. */
export function RsvpCount({ eventId, className }: { eventId: string; className?: string }) {
  const { data: counts } = useEventRsvpCounts(eventId);
  const going = counts?.going ?? 0;
  const interested = counts?.interested ?? 0;
  if (going === 0 && interested === 0) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground',
        className
      )}
    >
      <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {toBengaliDigits(going)} জন যাচ্ছে
      {interested > 0 && <> · {toBengaliDigits(interested)} আগ্রহী</>}
    </span>
  );
}
