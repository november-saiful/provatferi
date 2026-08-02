'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEvents } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canWrite } from '@/lib/permissions';
import { EVENT_STATUS_LABELS } from '@/lib/constants';
import { storageUrl, storageThumb } from '@/lib/supabase/client';
import { supabase } from '@/lib/supabase/client';
import { formatDate, truncate, cn } from '@/lib/utils';
import type { EventItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { EventForm } from '@/components/forms/event-form';
import { useQueryClient } from '@tanstack/react-query';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

const STATUS_STYLE: Record<string, 'coffee' | 'success' | 'taupe'> = {
  upcoming: 'coffee',
  ongoing: 'success',
  past: 'taupe'
};

export function EventForum({ basePath = '/dashboard/evf' }: { basePath?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { role, user } = useAuthStore();
  const [status, setStatus] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<EventItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const canManage = canWrite(role, 'evf');
  const { data: events, isLoading } = useEvents(status);

  const filtered = React.useMemo(() => {
    if (!events) return [];
    const q = search.toLowerCase();
    return events.filter(
      (e) => !q || e.title.toLowerCase().includes(q) || (e.description ?? '').toLowerCase().includes(q)
    );
  }, [events, search]);

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
    <Stagger className="space-y-5">
      <StaggerItem>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'all', label: 'সব অবস্থা' },
              { value: 'upcoming', label: 'আসন্ন' },
              { value: 'ongoing', label: 'চলমান' },
              { value: 'past', label: 'সমাপ্ত' }
            ]}
            className="w-40"
          />
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="ইভেন্ট খুঁজুন…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {canManage && (
            <Button onClick={() => setShowForm(true)}>
              <Plus /> ইভেন্ট যোগ করুন
            </Button>
          )}
        </div>
      </StaggerItem>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          title="কোনো ইভেন্ট পাওয়া যায়নি"
          description="আপনার ফিল্টারের সাথে মিলে এমন কোনো ইভেন্ট এখনো নেই।"
          action={canManage ? <Button onClick={() => setShowForm(true)}><Plus /> প্রথম ইভেন্ট যোগ করুন</Button> : undefined}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((event) => (
          <StaggerItem key={event.id}>
            <Card className="card-hover overflow-hidden">
              <button
              type="button"
              className="block w-full text-left"
              onClick={() => router.push(`${basePath}/item?id=${event.id}`)}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {event.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={storageThumb(event.cover_image, 640)}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coffee-200 to-taupe-300 text-2xl font-bold text-coffee-700">
                    {truncate(event.title, 2)}
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <Badge variant={STATUS_STYLE[event.status]}>
                    {EVENT_STATUS_LABELS[event.status] ?? event.status}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold leading-snug">{event.title}</h3>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>{formatDate(event.event_date)}</p>
                  {event.location && <p>{event.location}</p>}
                </div>
                {event.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
                )}
              </CardContent>
            </button>
            {(user?.id === event.created_by || canWrite(role, 'evf')) && canManage && (
              <div className="flex items-center justify-between border-t border-border px-4 py-2">
                <span className="text-xs text-muted-foreground">
                  {event.profiles?.full_name ?? 'কমিটি'}
                </span>
                <Button variant="ghost" size="sm" className="text-warmred-500" onClick={() => setDeleteTarget(event)}>
                  <Trash2 /> মুছুন
                </Button>
              </div>
            )}
            </Card>
          </StaggerItem>
        ))}
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

export function EventCardSkeleton() {
  return <Skeleton className="h-56 w-full rounded-xl2" />;
}
