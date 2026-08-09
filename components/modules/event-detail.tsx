'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Images, Info, MapPin, MessageSquare, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import {
  useEvent,
  useEventComments,
  useEventRsvps,
  useGallery,
  useDeleteComment,
  useRealtimeInvalidate
} from '@/lib/queries';
import { canWrite } from '@/lib/permissions';
import { storageUrl, storageThumb } from '@/lib/supabase/client';
import { formatDateTime, relativeTime, renderMarkdown, toBengaliDigits } from '@/lib/utils';
import type { EventComment } from '@/lib/types';
import { RsvpButtons, RsvpCount, StatusPill, useRsvp, eventOrganizer } from '@/components/modules/event-shared';
import { Button } from '@/components/ui/button';
import { AddToCalendar } from '@/components/ui/add-to-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { CommentBox } from '@/components/forms/comment-box';
import { EventForm } from '@/components/forms/event-form';
import { useQueryClient } from '@tanstack/react-query';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

function RsvpGuests({ eventId }: { eventId: string }) {
  const { data: rsvps, isLoading } = useEventRsvps(eventId);
  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    );
  }
  const going = (rsvps ?? []).filter((r) => r.status === 'going');
  const interested = (rsvps ?? []).filter((r) => r.status === 'interested');
  if (going.length === 0 && interested.length === 0) {
    return <p className="text-sm text-muted-foreground">এখনো কেউ অংশগ্রহণ নিশ্চিত করেনি — প্রথম হতে পারেন!</p>;
  }
  return (
    <div className="space-y-3">
      {going.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">যাচ্ছেন ({toBengaliDigits(going.length)})</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {going.map((r) => (
              <span
                key={r.id}
                className="flex items-center gap-1.5 rounded-full bg-sage-100/70 px-2.5 py-1 text-xs font-medium dark:bg-sage-900/40"
              >
                <Avatar name={r.profiles?.full_name} src={r.profiles?.avatar_url} className="h-5 w-5 text-[8px]" />
                <span className="max-w-[6rem] truncate">{r.profiles?.full_name ?? 'সদস্য'}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {interested.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">আগ্রহী ({toBengaliDigits(interested.length)})</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {interested.map((r) => (
              <span
                key={r.id}
                className="flex items-center gap-1.5 rounded-full bg-gold-100/70 px-2.5 py-1 text-xs font-medium dark:bg-gold-900/40"
              >
                <Avatar name={r.profiles?.full_name} src={r.profiles?.avatar_url} className="h-5 w-5 text-[8px]" />
                <span className="max-w-[6rem] truncate">{r.profiles?.full_name ?? 'সদস্য'}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-base font-bold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-coffee-100 text-coffee-600 dark:bg-coffee-900/50 dark:text-coffee-300">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      {children}
    </h2>
  );
}

export function EventDetail({ eventId }: { eventId?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const { role, user } = useAuthStore();
  const { data: event, isLoading } = useEvent(eventId ?? undefined);
  const { data: comments } = useEventComments(eventId ?? undefined);
  const { data: gallery } = useGallery();
  const deleteComment = useDeleteComment();
  useRealtimeInvalidate('event_comments', [['event-comments', eventId ?? '']]);

  const [editing, setEditing] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const { rsvp, handleRsvp } = useRsvp(event?.id ? [event.id] : []);

  const canManage = canWrite(role, 'evf');
  // Return to the correct list depending on which shell hosted this page.
  const basePath = pathname?.startsWith('/dashboard') ? '/dashboard/evf' : '/events';

  const eventGallery = gallery?.filter((g) => g.event_id === eventId) ?? [];
  const hostName = eventOrganizer(event)?.full_name ?? 'প্রভাতফেরী';

  const handleDelete = async () => {
    if (!event) return;
    setDeleting(true);
    const { error } = await supabase.from('events').delete().eq('id', event.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('ইভেন্ট মুছে ফেলা হয়েছে');
      router.push(basePath);
    }
  };

  const handleDeleteComment = async (c: EventComment) => {
    await deleteComment.mutateAsync({ id: c.id, eventId: event!.id }, {
      onSuccess: () => toast.success('মন্তব্য মুছে ফেলা হয়েছে'),
      onError: (err) => toast.error(err.message)
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-[16/9] w-full rounded-2xl sm:aspect-[21/9]" />
        <Skeleton className="h-8 w-2/3 rounded-xl" />
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <EmptyState
        title="ইভেন্ট পাওয়া যায়নি"
        description="ইভেন্টটি সরিয়ে ফেলা হতে পারে।"
        action={<Button onClick={() => router.push(basePath)}>ইভেন্টে ফিরুন</Button>}
      />
    );
  }

  return (
    <Stagger className="space-y-5" gap={10}>
      {/* ── Cover hero ── */}
      <StaggerItem>
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-muted shadow-sm sm:aspect-[21/9]">
          {event.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={storageUrl(event.cover_image)}
              alt={event.title}
              className="h-full w-full object-cover"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coffee-800 via-coffee-700 to-taupe-700 px-6 text-center text-2xl font-bold text-white sm:text-3xl">
              {event.title}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" aria-hidden />

          {/* Back — glass */}
          <button
            type="button"
            onClick={() => router.push(basePath)}
            className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/60 hover:-translate-x-0.5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">ইভেন্টে ফিরুন</span>
          </button>

          {/* Status pill */}
          <span className="absolute bottom-3 left-3 z-10">
            <StatusPill status={event.status} className="px-3 py-1.5 text-[11px]" />
          </span>

          {/* Admin actions — glass */}
          {canManage && (
            <div className="absolute right-3 top-3 z-10 flex gap-1.5">
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="ইভেন্ট সম্পাদনা করুন"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/60 hover:scale-105"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="ইভেন্ট মুছুন"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all duration-200 hover:bg-warmred-600/90 hover:scale-105"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </StaggerItem>

      {/* ── Title + host + mobile RSVP ── */}
      <StaggerItem>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{event.title}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>পাবলিক ইভেন্ট</span>
              <span aria-hidden>·</span>
              <Avatar
                name={eventOrganizer(event)?.full_name}
                src={eventOrganizer(event)?.avatar_url}
                className="h-5 w-5 text-[8px]"
              />
              <span>
                আয়োজনে <span className="font-semibold text-foreground">{hostName}</span>
              </span>
              {event.courtesy && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    সৌজন্যে <span className="font-semibold text-foreground">{event.courtesy}</span>
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 lg:hidden">
            <RsvpButtons eventId={event.id} rsvp={rsvp} onToggle={handleRsvp} compact />
          </div>
        </div>
      </StaggerItem>

      {/* ── Two-column: content + sticky info card ── */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {/* বিবরণ — plain text, no card */}
          <StaggerItem>
            <section>
              <SectionTitle icon={Info}>বিবরণ</SectionTitle>
              {event.description ? (
                <div
                  className="max-w-2xl text-justify text-sm leading-7 text-foreground/90 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(event.description) }}
                />
              ) : (
                <p className="max-w-2xl text-justify text-sm leading-7 text-foreground/90">
                  এই ইভেন্ট সম্পর্কে এখনো কোনো বিবরণ যোগ করা হয়নি।
                </p>
              )}
            </section>
          </StaggerItem>

          {/* অতিথিরা */}
          <StaggerItem>
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <SectionTitle icon={Users}>অতিথিরা</SectionTitle>
              <RsvpGuests eventId={event.id} />
            </section>
          </StaggerItem>

          {/* গ্যালারি */}
          {eventGallery.length > 0 && (
            <StaggerItem>
              <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <SectionTitle icon={Images}>গ্যালারি</SectionTitle>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {eventGallery.map((g) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={g.id}
                      src={storageThumb(g.image_url, 400)}
                      alt={g.title ?? 'gallery image'}
                      className="aspect-square w-full rounded-xl object-cover transition-transform duration-300 hover:scale-[1.02]"
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
              </section>
            </StaggerItem>
          )}

          {/* আলোচনা — Facebook-style discussion feed */}
          <StaggerItem>
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <SectionTitle icon={MessageSquare}>
                আলোচনা ({toBengaliDigits(comments?.length ?? 0)})
              </SectionTitle>
              <div className="mb-5">
                <CommentBox eventId={event.id} />
              </div>
              {comments && comments.length === 0 && (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  এখনো কোনো মন্তব্য নেই। প্রথম মতামত দিন।
                </p>
              )}
              <ul className="space-y-4">
                {comments?.map((c) => {
                  const canDelete = user?.id === c.user_id || canWrite(role, 'evf');
                  return (
                    <li key={c.id} className="flex gap-3">
                      <Avatar name={c.profiles?.full_name} src={c.profiles?.avatar_url} className="h-9 w-9 shrink-0 text-xs" />
                      <div className="min-w-0 flex-1">
                        <div className="rounded-2xl rounded-tl-md bg-muted/70 px-3.5 py-2.5">
                          <p className="text-xs font-semibold text-foreground">
                            {c.profiles?.full_name ?? 'সদস্য'}
                          </p>
                          <div
                            className="mt-0.5 text-sm leading-relaxed text-foreground/90 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(c.content) }}
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-3 px-1.5 text-[11px] text-muted-foreground">
                          <span>{relativeTime(c.created_at)}</span>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c)}
                              className="font-semibold transition-colors hover:text-warmred-500"
                            >
                              মুছুন
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </StaggerItem>
        </div>

        {/* ── Sticky info card ── */}
        <StaggerItem className="lg:sticky lg:top-20">
          <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            {/* তারিখ ও সময় */}
            <div className="flex gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coffee-100 text-coffee-600 dark:bg-coffee-900/50 dark:text-coffee-300">
                <CalendarDays className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">তারিখ ও সময়</p>
                <p className="mt-0.5 text-sm font-semibold leading-snug">{formatDateTime(event.event_date)}</p>
              </div>
            </div>

            <div className="my-4 h-px bg-border" aria-hidden />

            {/* স্থান */}
            <div className="flex gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-600 dark:bg-sage-900/50 dark:text-sage-300">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">স্থান</p>
                <p className="mt-0.5 text-sm font-semibold leading-snug">
                  {event.location || 'অনলাইন / স্থান ঘোষিত হবে'}
                </p>
              </div>
            </div>

            <div className="my-4 h-px bg-border" aria-hidden />

            {/* Add to Calendar */}
            {event.event_date && (
              <>
                <AddToCalendar
                  data={{
                    title: event.title,
                    description: event.description,
                    location: event.location,
                    startDate: event.event_date,
                  }}
                  variant="outline"
                />
                <div className="my-4 h-px bg-border" aria-hidden />
              </>
            )}

            {/* RSVP */}
            <p className="mb-2.5 text-sm font-bold">আপনি কি অংশ নেবেন?</p>
            <RsvpButtons eventId={event.id} rsvp={rsvp} onToggle={handleRsvp} />
            <div className="mt-2.5 flex justify-center">
              <RsvpCount eventId={event.id} />
            </div>

            <div className="my-4 h-px bg-border" aria-hidden />

            {/* আয়োজক */}
            <div className="flex items-center gap-3">
              <Avatar
                name={eventOrganizer(event)?.full_name}
                src={eventOrganizer(event)?.avatar_url}
                className="h-11 w-11 text-sm"
                ring
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{hostName}</p>
                <p className="text-xs text-muted-foreground">ইভেন্টের আয়োজক</p>
              </div>
            </div>
            {event.courtesy && (
              <p className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                সৌজন্যে <span className="font-semibold text-foreground">{event.courtesy}</span>
              </p>
            )}
          </aside>
        </StaggerItem>
      </div>

      <EventForm
        open={editing}
        onClose={() => setEditing(false)}
        event={event}
        onSaved={() => qc.invalidateQueries({ queryKey: ['events', event.id] })}
      />

      <ConfirmDeleteDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="ইভেন্ট মুছুন"
        name={event.title}
        description="এটি ফেরানো যাবে না। নিশ্চিত করতে ইভেন্টের নাম টাইপ করুন।"
        isDeleting={deleting}
      />
    </Stagger>
  );
}
