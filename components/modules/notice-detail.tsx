'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, CalendarDays, Pin } from 'lucide-react';
import { useNotice } from '@/lib/queries';
import { formatDateTime, renderMarkdown } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AddToCalendar } from '@/components/ui/add-to-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export function NoticeDetail({
  noticeId,
  basePath = '/dashboard/ntb'
}: {
  noticeId?: string | null;
  basePath?: string;
}) {
  const router = useRouter();
  const { data: notice, isLoading } = useNotice(noticeId ?? undefined);

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
        <Button variant="ghost" onClick={() => router.push(basePath)}>
          <ArrowLeft /> নোটিশে ফিরুন
        </Button>
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
    </Stagger>
  );
}
