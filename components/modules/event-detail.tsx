'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { useEvent, useEventComments, useGallery, useDeleteComment, useRealtimeInvalidate } from '@/lib/queries';
import { canWrite } from '@/lib/permissions';
import { EVENT_STATUS_LABELS } from '@/lib/constants';
import { storageUrl, storageThumb } from '@/lib/supabase/client';
import { formatDate, formatDateTime, relativeTime, initials, cn, toBengaliDigits } from '@/lib/utils';
import type { EventComment } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { CommentBox } from '@/components/forms/comment-box';
import { EventForm } from '@/components/forms/event-form';
import { useQueryClient } from '@tanstack/react-query';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

export function EventDetail({ eventId }: { eventId?: string | null }) {
  const router = useRouter();
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
  const canManage = canWrite(role, 'evf');
  const canEditEvent = canManage;

  const eventGallery = gallery?.filter((g) => g.event_id === eventId) ?? [];

  const handleDelete = async () => {
    if (!event) return;
    setDeleting(true);
    const { error } = await supabase.from('events').delete().eq('id', event.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('ইভেন্ট মুছে ফেলা হয়েছে');
      router.push('/dashboard/evf');
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
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <EmptyState
        title="ইভেন্ট পাওয়া যায়নি"
        description="ইভেন্টটি সরিয়ে ফেলা হতে পারে।"
        action={<Button onClick={() => router.push('/dashboard/evf')}>ইভেন্টে ফিরুন</Button>}
      />
    );
  }

  return (
    <Stagger className="space-y-6">
      <StaggerItem className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => router.push('/dashboard/evf')}>
          <ArrowLeft /> ইভেন্টে ফিরুন
        </Button>
        <div className="flex flex-wrap gap-2">
          {canEditEvent && (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>সম্পাদনা</Button>
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 /> মুছুন
              </Button>
            </>
          )}
        </div>
      </StaggerItem>

      <StaggerItem>
        <Card className="overflow-hidden">
          <div className="relative aspect-video w-full bg-muted sm:aspect-[21/9]">
            {event.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={storageUrl(event.cover_image)} alt={event.title} className="h-full w-full object-cover" decoding="async" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coffee-200 to-taupe-300 text-3xl font-bold text-coffee-700">
                {event.title}
              </div>
            )}
            <div className="absolute right-3 top-3">
              <Badge variant={event.status === 'ongoing' ? 'success' : event.status === 'upcoming' ? 'coffee' : 'taupe'}>
                {EVENT_STATUS_LABELS[event.status] ?? event.status}
              </Badge>
            </div>
          </div>
          <CardContent className="p-5 md:p-6">
            <h1 className="text-2xl font-bold md:text-3xl">{event.title}</h1>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span>📅 {formatDateTime(event.event_date)}</span>
              {event.location && <span>📍 {event.location}</span>}
              {event.profiles?.full_name && <span>পোস্ট করেছেন {event.profiles.full_name}</span>}
            </div>
            {event.description && (
              <p className="mt-4 whitespace-pre-line text-foreground/90">{event.description}</p>
            )}
          </CardContent>
        </Card>
      </StaggerItem>

      {eventGallery.length > 0 && (
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle>গ্যালারি</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {eventGallery.map((g) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={g.id}
                    src={storageThumb(g.image_url, 400)}
                    alt={g.title ?? 'gallery image'}
                    className="aspect-square w-full rounded-lg object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      )}

      <StaggerItem>
        <Card>
          <CardHeader>
            <CardTitle>মন্তব্য ({toBengaliDigits(comments?.length ?? 0)})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CommentBox eventId={event.id} />
            {comments && comments.length === 0 && (
              <p className="text-sm text-muted-foreground">এখনো কোনো মন্তব্য নেই। প্রথম মতামত দিন।</p>
            )}
            <ul className="space-y-4">
              {comments?.map((c) => {
                const canDelete = user?.id === c.user_id || canWrite(role, 'evf');
                return (
                  <li key={c.id} className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <Avatar name={c.profiles?.full_name} src={c.profiles?.avatar_url} className="h-8 w-8 text-xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{c.profiles?.full_name ?? 'সদস্য'}</span>
                        <span className="text-xs text-muted-foreground">{relativeTime(c.created_at)}</span>
                        {canDelete && (
                          <button
                            className="ml-auto text-muted-foreground hover:text-warmred-500"
                            onClick={() => handleDeleteComment(c)}
                            aria-label="মন্তব্য মুছুন"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm">{c.content}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </StaggerItem>

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
