'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Bell, Pin } from 'lucide-react';
import { AddToCalendar } from '@/components/ui/add-to-calendar';
import type { Notice } from '@/lib/types';
import { cn, formatDate, truncate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const NOTE_STYLES = [
  'bg-amber-200 text-amber-950 dark:bg-amber-300 dark:text-amber-950',
  'bg-rose-200 text-rose-950 dark:bg-rose-300 dark:text-rose-950',
  'bg-sage-200 text-sage-900 dark:bg-sage-300 dark:text-sage-900',
  'bg-indigo-200 text-indigo-950 dark:bg-indigo-300 dark:text-indigo-950',
  'bg-cream-200 text-coffee-900 dark:bg-cream-300 dark:text-coffee-950'
];

const NOTE_ROTATIONS = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-3'];

function plainNoticeContent(content: string) {
  return content
    .replace(/!?(\[[^\]]*\])\([^)]*\)/g, '$1')
    .replace(/[*_`#>-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function NoticeWall({
  notices,
  isLoading = false,
  isError = false,
  hrefBase = '/notices',
  limit = 5,
  className
}: {
  notices?: Notice[];
  isLoading?: boolean;
  isError?: boolean;
  hrefBase?: string;
  limit?: number;
  className?: string;
}) {
  const notes = [...(notices ?? [])]
    .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

  return (
    <section className={cn('wall-section', className)} aria-labelledby="notice-wall-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-gold-400 to-coffee-500" aria-hidden="true" />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id="notice-wall-title" className="font-serif text-2xl font-bold tracking-tight md:text-3xl">নোটিশ বোর্ড</h2>
            <span className="font-serif text-sm italic text-muted-foreground"> গুরুত্বপূর্ণ </span>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            গুরুত্বপূর্ণ ঘোষণা, ছোট আপডেট আর কমিটির খবর—একটি দেয়ালে, যেন কিছুই চোখ এড়িয়ে না  যায়।
          </p>
        </div>
        <Link href={hrefBase} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/75">
          সব নোটিশ
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="notice-wall-board relative overflow-hidden rounded-[2rem] border-2 border-coffee-300/50 bg-cream-100 p-5 shadow-inner dark:border-coffee-700/50 dark:bg-coffee-950/40 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-50" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" aria-hidden="true" />
        {isLoading ? (
          <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: limit }).map((_, index) => <Skeleton key={index} className="h-64 rounded-lg bg-white/50 dark:bg-white/10" />)}
          </div>
        ) : isError ? (
          <div className="relative flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warmred-100 text-warmred-600 shadow-sm dark:bg-warmred-900/60 dark:text-warmred-300"><AlertTriangle className="h-6 w-6" /></span>
            <p className="mt-4 font-semibold text-coffee-900 dark:text-cream-100">দেয়ালটি এখন লোড করা যাচ্ছে না</p>
            <p className="mt-1 text-sm text-coffee-800/70 dark:text-cream-200/70">কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="relative flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 text-coffee-600 shadow-sm dark:bg-coffee-900/70 dark:text-coffee-300"><Bell className="h-6 w-6" /></span>
            <p className="mt-4 font-semibold text-coffee-900 dark:text-cream-100">এখনো দেয়ালে কোনো নোটিশ নেই</p>
            <p className="mt-1 text-sm text-coffee-800/70 dark:text-cream-200/70">নতুন ঘোষণা প্রকাশিত হলে এখানে দেখা যাবে।</p>
          </div>
        ) : (
          <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {notes.map((notice, index) => {
              const style = NOTE_STYLES[index % NOTE_STYLES.length];
              const rotation = NOTE_ROTATIONS[index % NOTE_ROTATIONS.length];
              return (
                <Link
                  key={notice.id}
                  href={`${hrefBase}/item?id=${notice.id}`}
                  className={cn(
                    'notice-paper group relative min-h-60 rounded-[0.35rem] px-5 pb-5 pt-10 shadow-xl transition-all duration-500 hover:z-10 hover:-translate-y-2 hover:rotate-0 hover:shadow-2xl focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40',
                    style,
                    rotation
                  )}
                >
                  <span className="paper-pin" aria-hidden="true"><Pin className="h-3.5 w-3.5 -rotate-45" /></span>
                  {notice.is_pinned && <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-black/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"><Pin className="h-3 w-3" /> পিন করা</span>}
                  <h3 className="line-clamp-3 font-serif text-lg font-bold leading-tight">{notice.title}</h3>
                  <p className="mt-3 line-clamp-5 text-sm leading-relaxed opacity-80">{truncate(plainNoticeContent(notice.content), 145)}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-3 text-[11px] font-semibold opacity-65">
                    <span>
                      <span>{formatDate(notice.created_at)}</span>
                      {notice.profiles?.full_name && <span> · {notice.profiles.full_name}</span>}
                    </span>
                    <AddToCalendar
                      data={{
                        title: notice.title,
                        description: plainNoticeContent(notice.content),
                        startDate: notice.created_at,
                      }}
                      size="icon"
                    />
                  </div>
                  <span className="absolute bottom-4 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-70" aria-hidden="true"><ArrowRight className="h-4 w-4" /></span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
