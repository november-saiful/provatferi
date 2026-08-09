'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Clock,
  Images,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useEvents, useGallery, useRealtimeInvalidate } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canWrite } from '@/lib/permissions';
import { storageThumb } from '@/lib/supabase/client';
import { supabase } from '@/lib/supabase/client';
import { cn, toBengaliDigits, truncate } from '@/lib/utils';
import type { EventItem } from '@/lib/types';
import { dateBox, compactDateTime, eventOrganizer, RsvpButtons, RsvpCount, StatusPill, useRsvp, type RsvpState } from '@/components/modules/event-shared';
import { AddToCalendar } from '@/components/ui/add-to-calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { EventForm } from '@/components/forms/event-form';
import { useQueryClient } from '@tanstack/react-query';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'সব' },
  { value: 'upcoming', label: 'আসন্ন' },
  { value: 'ongoing', label: 'চলমান' },
  { value: 'past', label: 'সমাপ্ত' }
];

/* ────────────────────────── Event card (Facebook style) ────────────────────────── */

function EventCard({
  event,
  saved,
  rsvp,
  onSave,
  onRsvp,
  onDelete,
  basePath
}: {
  event: EventItem;
  saved: boolean;
  rsvp: RsvpState;
  onSave: (e: EventItem) => void;
  onRsvp: (id: string, type: 'interested' | 'going') => void;
  onDelete?: (e: EventItem) => void;
  basePath: string;
}) {
  const router = useRouter();
  const box = dateBox(event.event_date);

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg"
    >
      {/* Cover — save button is a sibling of the cover button (no nested
          interactive elements, which is invalid HTML) */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <button
          type="button"
          className="absolute inset-0 block h-full w-full text-left"
          onClick={() => router.push(`${basePath}/item?id=${event.id}`)}
          aria-label={event.title}
        >
          {event.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={storageThumb(event.cover_image, 640)}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coffee-700 via-coffee-600 to-taupe-600 text-2xl font-bold text-white/90">
              {truncate(event.title, 2)}
            </div>
          )}

          {/* Date badge — Facebook style */}
          {box && (
            <span className="absolute left-3 top-3 flex w-12 flex-col items-center rounded-lg bg-white px-1 py-1.5 text-center shadow-md">
              <span className="text-[9px] font-bold uppercase leading-none text-warmred-600">{box.month}</span>
              <span className="mt-0.5 text-lg font-bold leading-none text-foreground">{box.day}</span>
            </span>
          )}

          {/* Status pill over the cover */}
          <span className="absolute bottom-3 left-3">
            <StatusPill status={event.status} />
          </span>
        </button>

        {/* Save button */}
        <button
          type="button"
          onClick={() => onSave(event)}
          aria-label={saved ? 'সংরক্ষণ সরান' : 'সংরক্ষণ করুন'}
          aria-pressed={saved}
          className={cn(
            'absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110',
            saved
              ? 'bg-primary text-primary-foreground'
              : 'bg-white/90 text-muted-foreground hover:bg-white hover:text-primary'
          )}
        >
          <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3.5">
        <button
          type="button"
          className="text-left"
          onClick={() => router.push(`${basePath}/item?id=${event.id}`)}
        >
          <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {event.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" aria-hidden />
            {compactDateTime(event.event_date)}
          </p>
          {event.location && (
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="line-clamp-1">{event.location}</span>
            </p>
          )}
        </button>

        {/* Organizer row */}
        <div className="mt-3 flex items-center gap-2 border-t border-border/70 pt-3">
          <Avatar
            name={eventOrganizer(event)?.full_name}
            src={eventOrganizer(event)?.avatar_url}
            className="h-6 w-6 text-[9px]"
          />
          <span className="min-w-0 flex-1 text-[11px] text-muted-foreground">
            <span className="block truncate">
              আয়োজনে <span className="font-semibold text-foreground">{eventOrganizer(event)?.full_name ?? 'প্রভাতফেরী'}</span>
            </span>
            {event.courtesy && (
              <span className="block truncate">
                সৌজন্যে <span className="font-semibold text-foreground">{event.courtesy}</span>
              </span>
            )}
          </span>
          {event.event_date && (
            <AddToCalendar
              data={{
                title: event.title,
                description: event.description,
                location: event.location,
                startDate: event.event_date,
              }}
              size="icon"
            />
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-warmred-500"
              onClick={() => onDelete(event)}
              aria-label="ইভেন্ট মুছুন"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Attendee count + RSVP row */}
        <div className="mt-2.5">
          <RsvpCount eventId={event.id} />
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <RsvpButtons eventId={event.id} rsvp={rsvp} onToggle={onRsvp} />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── Featured hero ────────────────────────── */

function FeaturedEvent({
  event,
  rsvp,
  onRsvp,
  basePath
}: {
  event: EventItem;
  rsvp: RsvpState;
  onRsvp: (id: string, type: 'interested' | 'going') => void;
  basePath: string;
}) {
  const router = useRouter();
  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <button
        type="button"
        className="relative block h-52 w-full overflow-hidden text-left sm:h-60"
        onClick={() => router.push(`${basePath}/item?id=${event.id}`)}
        aria-label={event.title}
      >
        {event.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storageThumb(event.cover_image, 1200)}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coffee-800 via-coffee-700 to-taupe-700 text-3xl font-bold text-white">
            {event.title}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <span className="mb-2 inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            <Sparkles className="h-3 w-3" aria-hidden />
            বৈশিষ্ট্যযুক্ত
          </span>
          <h2 className="text-xl font-bold text-white sm:text-2xl">{event.title}</h2>
          <p className="mt-1 text-xs text-white/80 sm:text-sm">
            {compactDateTime(event.event_date)}
            {event.location && <> · {event.location}</>}
          </p>
        </div>
      </button>        <div className="flex flex-wrap items-center gap-3 p-4">
        <Avatar
          name={eventOrganizer(event)?.full_name}
          src={eventOrganizer(event)?.avatar_url}
          className="h-9 w-9 text-xs"
          ring
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{eventOrganizer(event)?.full_name ?? 'প্রভাতফেরী'}</p>
          <p className="text-[11px] text-muted-foreground">
            পাবলিক ইভেন্ট · আয়োজক
            {event.courtesy && <> · সৌজন্যে {event.courtesy}</>}
          </p>
          <RsvpCount eventId={event.id} className="mt-0.5" />
        </div>
        <div className="flex gap-2">
          <RsvpButtons eventId={event.id} rsvp={rsvp} onToggle={onRsvp} compact />
        </div>
      </div>

      {event.event_date && (
        <div className="border-t border-border/70 px-4 pb-3 pt-2">
          <AddToCalendar
            data={{
              title: event.title,
              description: event.description,
              location: event.location,
              startDate: event.event_date,
            }}
            size="xs"
            variant="ghost"
          />
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── Sidebar ────────────────────────── */

function SidebarCard({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-tight">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-coffee-100 text-coffee-600 dark:bg-coffee-900/50 dark:text-coffee-300">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ────────────────────────── Main forum ────────────────────────── */

export function EventForum({ basePath = '/dashboard/evf' }: { basePath?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { role, user } = useAuthStore();
  const [status, setStatus] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [visibleCount, setVisibleCount] = React.useState(6);
  const [showForm, setShowForm] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<EventItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [saved, setSaved] = React.useState<Set<string>>(new Set());

  const canManage = canWrite(role, 'evf');
  const { data: events, isLoading } = useEvents(status);
  // Sync RSVP for every fetched event in one query (one row per event+user).
  const eventIds = React.useMemo(
    () => Array.from(new Set((events ?? []).map((e) => e.id))),
    [events]
  );
  const { rsvp, handleRsvp } = useRsvp(eventIds);
  const { data: gallery } = useGallery();
  // Spec §7.2: new events appear in the lists without a refresh.
  useRealtimeInvalidate('events', [['events']]);

  const filtered = React.useMemo(() => {
    if (!events) return [];
    const q = search.toLowerCase();
    return events.filter(
      (e) => !q || e.title.toLowerCase().includes(q) || (e.description ?? '').toLowerCase().includes(q)
    );
  }, [events, search]);

  const featured = React.useMemo(
    () => (events ?? []).find((e) => e.status === 'upcoming') ?? null,
    [events]
  );

  // The hero only appears on the default "সব" tab without a search, mirroring
  // Facebook's featured card; it never contradicts the active filter.
  const showFeatured = !!featured && status === 'all' && !search;

  const gridEvents = React.useMemo(() => {
    const withoutFeatured = showFeatured ? filtered.filter((e) => e.id !== featured?.id) : filtered;
    return withoutFeatured.slice(0, visibleCount);
  }, [filtered, featured, showFeatured, visibleCount]);

  const displayCount = Math.max(0, filtered.length - (showFeatured ? 1 : 0));

  const upcomingList = React.useMemo(
    () => (events ?? []).filter((e) => e.status === 'upcoming' && e.id !== featured?.id).slice(0, 4),
    [events, featured]
  );

  const recentGallery = React.useMemo(() => (gallery ?? []).slice(0, 3), [gallery]);

  React.useEffect(() => {
    setVisibleCount(6);
  }, [status, search]);

  const handleSave = (event: EventItem) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(event.id)) {
        next.delete(event.id);
        toast.success('সংরক্ষণ সরানো হয়েছে');
      } else {
        next.add(event.id);
        toast.success('ইভেন্ট সংরক্ষিত হয়েছে');
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('events').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('ইভেন্ট মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['events'] });
      setDeleteTarget(null);
    }
  };

  return (
    <Stagger className="space-y-5" gap={10}>
      {/* ── Sticky filter bar (Facebook sub-nav) ── */}
      <StaggerItem>
        <div className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/85 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="group" aria-label="ইভেন্ট ফিল্টার">
              {STATUS_TABS.map((tab) => {
                const active = status === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatus(tab.value)}
                    className={cn(
                      'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.97]',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  placeholder="ইভেন্ট খুঁজুন…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-44 pl-9 sm:w-56"
                  aria-label="ইভেন্ট খুঁজুন"
                />
              </div>
              {canManage && (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4" /> ইভেন্ট যোগ করুন
                </Button>
              )}
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* ── Featured event ── */}
      {showFeatured && featured && (
        <StaggerItem>
          <FeaturedEvent event={featured} rsvp={rsvp} onRsvp={handleRsvp} basePath={basePath} />
        </StaggerItem>
      )}

      {/* ── Main + sidebar ── */}
      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <StaggerItem className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">
              {status === 'all' ? 'সব ইভেন্ট' : `${STATUS_TABS.find((t) => t.value === status)?.label} ইভেন্ট`}
            </h2>
            {!isLoading && displayCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Users className="h-3 w-3" aria-hidden />
                {toBengaliDigits(displayCount)} টি
              </span>
            )}
          </StaggerItem>

          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <Skeleton className="aspect-[16/9] w-full rounded-none" />
                  <div className="space-y-2.5 p-3.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="mt-2 h-8 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <EmptyState
              title="কোনো ইভেন্ট পাওয়া যায়নি"
              description={
                status === 'all' && !search
                  ? 'এখনো কোনো ইভেন্ট যোগ করা হয়নি।'
                  : 'আপনার ফিল্টারের সাথে মিলে এমন কোনো ইভেন্ট নেই।'
              }
              icon={<CalendarDays className="h-7 w-7" />}
              action={canManage && status === 'all' && !search ? (
                <Button onClick={() => setShowForm(true)}>
                  <Plus /> প্রথম ইভেন্ট যোগ করুন
                </Button>
              ) : undefined}
            />
          )}

          {!isLoading && gridEvents.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {gridEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  saved={saved.has(event.id)}
                  rsvp={rsvp}
                  onSave={handleSave}
                  onRsvp={handleRsvp}
                  onDelete={
                    user?.id === event.created_by || canManage ? (e) => setDeleteTarget(e) : undefined
                  }
                  basePath={basePath}
                />
              ))}
            </div>
          )}

          {!isLoading && filtered.length > visibleCount && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + 6)}
                className="min-w-40"
              >
                আরও ইভেন্ট দেখুন
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <aside className="hidden space-y-4 2xl:block">
          <StaggerItem>
            <SidebarCard title="আসন্ন ইভেন্ট" icon={CalendarDays}>
              {upcomingList.length === 0 && (
                <p className="py-2 text-center text-xs text-muted-foreground">কোনো আসন্ন ইভেন্ট নেই।</p>
              )}
              <div className="space-y-1">
                {upcomingList.map((event) => {
                  const box = dateBox(event.event_date);
                  return (
                    <Link
                      key={event.id}
                      href={`${basePath}/item?id=${event.id}`}
                      className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
                    >
                      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-coffee-100 text-coffee-700 dark:bg-coffee-900/50 dark:text-coffee-300">
                        {box ? (
                          <>
                            <span className="text-[8px] font-bold uppercase leading-none">{box.month}</span>
                            <span className="text-sm font-bold leading-tight">{box.day}</span>
                          </>
                        ) : (
                          <CalendarDays className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold group-hover:text-primary">
                          {event.title}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {compactDateTime(event.event_date)}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
              <Link
                href={basePath}
                className="mt-2 block text-xs font-semibold text-primary hover:underline"
              >
                সব দেখুন
              </Link>
            </SidebarCard>
          </StaggerItem>

          <StaggerItem>
            <SidebarCard title="সাম্প্রতিক ছবি" icon={Images}>
              {recentGallery.length === 0 && (
                <p className="py-2 text-center text-xs text-muted-foreground">ছবি শীঘ্রই আসছে।</p>
              )}
              <div className="grid grid-cols-3 gap-1.5">
                {recentGallery.map((g) => (
                  <Link
                    key={g.id}
                    href="/gallery"
                    className="overflow-hidden rounded-lg transition-transform duration-200 hover:scale-[1.03]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={storageThumb(g.image_url, 200)}
                      alt={g.title ?? 'গ্যালারির ছবি'}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>
                ))}
              </div>
              <Link
                href="/gallery"
                className="mt-2 block text-xs font-semibold text-primary hover:underline"
              >
                গ্যালারি দেখুন
              </Link>
            </SidebarCard>
          </StaggerItem>
        </aside>
      </div>

      <EventForm open={showForm} onClose={() => setShowForm(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['events'] })} />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="ইভেন্ট মুছুন"
        name={deleteTarget?.title ?? ''}
        description="এটি ফেরানো যাবে না। নিশ্চিত করতে ইভেন্টের নাম টাইপ করুন।"
        isDeleting={deleting}
      />
    </Stagger>
  );
}
