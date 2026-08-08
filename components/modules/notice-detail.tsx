'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, CalendarDays, Pencil, Pin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useNotice, useRealtimeInvalidate } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canWrite, canPinNotices } from '@/lib/permissions';
import { formatDateTime, renderMarkdown, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AddToCalendar } from '@/components/ui/add-to-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { NoticeForm } from '@/components/forms/notice-form';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export function NoticeDetail({
  noticeId,
  basePath = '/dashboard/ntb'
}: {
  noticeId?: string | null;
  basePath?: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { role } = useAuthStore();
  const { data: notice, isLoading } = useNotice(noticeId ?? undefined);
  useRealtimeInvalidate('notices', [['notices', noticeId ?? '']]);

  const canEdit = canWrite(role, 'ntb');
  const canPin = canPinNotices(role);

  const [editing, setEditing] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [togglingPin, setTogglingPin] = React.useState(false);

  const togglePin = async () => {
    if (!notice) return;
    if (!notice.is_pinned) {
      const { count, error: countError } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_pinned', true);
      if (countError) {
        toast.error(countError.message);
        return;
      }
      if ((count ?? 0) >= 3) {
        toast.error('সর্বোচ্চ ৩টি নোটিশ পিন করা যায়');
        return;
      }
    }
    setTogglingPin(true);
    const { error } = await supabase.from('notices').update({ is_pinned: !notice.is_pinned }).eq('id', notice.id);
    setTogglingPin(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(notice.is_pinned ? 'পিন খোলা হয়েছে' : 'পিন করা হয়েছে');
      qc.invalidateQueries({ queryKey: ['notices'] });
    }
  };

  const handleDelete = async () => {
    if (!notice) return;
    setDeleting(true);
    const { error } = await supabase.from('notices').delete().eq('id', notice.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('নোটিশ মুছে ফেলা হয়েছে');
      router.push(basePath);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[28rem] w-full rounded-[2rem]" />
      </div>
    );
  }

  if (!notice) {
    return (
      <EmptyState
        title="নোটিশ পাওয়া যায়নি"
        description="লিংকটি পুরোনো হতে পারে, অথবা নোটিশটি সরিয়ে নেওয়া হয়েছে।"
        icon={<Bell className="h-7 w-7" />}
        action={<Button onClick={() => router.push(basePath)}>নোটিশে ফিরুন</Button>}
      />
    );
  }

  return (
    <Stagger className="mx-auto max-w-3xl space-y-5">
      <StaggerItem>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.push(basePath)}>
            <ArrowLeft /> নোটিশে ফিরুন
          </Button>
          {canEdit && (
            <div className="flex items-center gap-2">
              {canPin && (
                <Button variant="outline" size="sm" onClick={togglePin} disabled={togglingPin}>
                  <Pin className={cn('h-4 w-4', notice.is_pinned && 'text-gold-500')} aria-hidden="true" />
                  {notice.is_pinned ? 'আনপিন করুন' : 'পিন করুন'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" aria-hidden="true" /> সম্পাদনা
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" /> মুছুন
              </Button>
            </div>
          )}
        </div>
      </StaggerItem>
      <StaggerItem>
        <article className="notice-detail-paper relative overflow-hidden rounded-[2rem] border-2 border-border bg-card shadow-xl">
          <div className="h-2 bg-gradient-to-r from-coffee-500 via-gold-400 to-sage-500" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" aria-hidden="true" />
          <div className="relative p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDateTime(notice.created_at)}
              </span>
              <span>·</span>
              <span>{notice.profiles?.full_name ?? 'কমিটি'}</span>
              {notice.is_pinned && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1.5 text-gold-800 dark:bg-gold-900/50 dark:text-gold-300">
                  <Pin className="h-3.5 w-3.5" aria-hidden="true" /> পিন করা
                </span>
              )}
              <AddToCalendar
                data={{
                  title: notice.title,
                  // Render markdown to HTML first so stripHtml produces clean text.
                  description: renderMarkdown(notice.content),
                  startDate: notice.created_at,
                }}
                variant="ghost"
                className="h-auto rounded-full px-2.5 py-1 text-[11px]"
              />
            </div>
            <h1 className="mt-6 max-w-2xl font-serif text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{notice.title}</h1>
            <div className="notice-detail-rule mt-7 flex items-center gap-3" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-warmred-500 shadow-sm" />
              <span className="h-px flex-1 bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-gold-400 shadow-sm" />
            </div>
            <div
              className="notice-detail-content mt-8 max-w-2xl text-base leading-8 text-foreground/90 sm:text-lg"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(notice.content) }}
            />
          </div>
          <footer className="relative flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border bg-muted/30 px-6 py-4 text-xs text-muted-foreground sm:px-10">
            <span>প্রভাতফেরী নোটিশ বোর্ড</span>
            <span>সর্বশেষ প্রকাশ: {formatDateTime(notice.created_at)}</span>
          </footer>
        </article>
      </StaggerItem>

      <NoticeForm
        open={editing}
        onClose={() => setEditing(false)}
        notice={notice}
        onSaved={() => qc.invalidateQueries({ queryKey: ['notices'] })}
      />

      <ConfirmDeleteDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="নোটিশ মুছুন"
        name={notice.title}
        description="এটি ফেরানো যাবে না। নিশ্চিত করতে নোটিশের শিরোনাম টাইপ করুন।"
        isDeleting={deleting}
      />
    </Stagger>
  );
}
