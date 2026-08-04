'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, Clock3, Filter, Pin, Plus, Pencil, Search, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useNotices, useRealtimeInvalidate } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canWrite, canPinNotices } from '@/lib/permissions';
import { formatDate, relativeTime, truncate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { NoticeForm } from '@/components/forms/notice-form';
import { NoticeWall } from '@/components/modules/notice-wall';
import { AddToCalendar } from '@/components/ui/add-to-calendar';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import type { Notice } from '@/lib/types';

type NoticeFilter = 'all' | 'pinned' | 'recent';

function plainNoticeContent(content: string) {
  return content.replace(/!?(\[[^\]]*\])\([^)]*\)/g, '$1').replace(/[*_`#>-]/g, '').replace(/\s+/g, ' ').trim();
}

export function NoticeBoard({ basePath = '/dashboard/ntb' }: { basePath?: string }) {
  const qc = useQueryClient();
  const { role } = useAuthStore();
  const { data: notices, isLoading, isError } = useNotices();
  useRealtimeInvalidate('notices', [['notices']]);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<NoticeFilter>('all');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Notice | null>(null);

  const canEdit = canWrite(role, 'ntb');
  const canPin = canPinNotices(role);
  const allNotices = React.useMemo(() => notices ?? [], [notices]);
  const pinned = allNotices.filter((notice) => notice.is_pinned);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return [...allNotices]
      .filter((notice) => {
        if (filter === 'pinned') return notice.is_pinned;
        if (filter === 'recent') return Date.now() - new Date(notice.created_at).getTime() < 1000 * 60 * 60 * 24 * 30;
        return true;
      })
      .filter((notice) => !query || `${notice.title} ${plainNoticeContent(notice.content)}`.toLocaleLowerCase().includes(query));
  }, [allNotices, filter, search]);

  const togglePin = async (notice: Notice) => {
    const pinnedCount = allNotices.filter((item) => item.is_pinned).length;
    if (!notice.is_pinned && pinnedCount >= 3) {
      toast.error('সর্বোচ্চ ৩টি নোটিশ পিন করা যায়');
      return;
    }
    const { error } = await supabase.from('notices').update({ is_pinned: !notice.is_pinned }).eq('id', notice.id);
    if (error) toast.error(error.message);
    else {
      toast.success(notice.is_pinned ? 'পিন খোলা হয়েছে' : 'পিন করা হয়েছে');
      qc.invalidateQueries({ queryKey: ['notices'] });
    }
  };

  const handleDelete = async (notice: Notice) => {
    if (!confirm(`নোটিশ "${notice.title}" মুছে ফেলবেন?`)) return;
    const { error } = await supabase.from('notices').delete().eq('id', notice.id);
    if (error) toast.error(error.message);
    else {
      toast.success('নোটিশ মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['notices'] });
    }
  };

  return (
    <Stagger className="space-y-7">
      <StaggerItem>
        <div className="notice-board-hero relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-coffee-900 via-coffee-800 to-taupe-800 p-6 text-white shadow-xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-300">
                <span className="notice-board-live-dot" aria-hidden="true" /> লাইভ নোটিশ বোর্ড
              </div>
              <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">দেয়ালে যা নতুন</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                কমিটির ঘোষণা, জরুরি আপডেট ও ছোট ছোট খবর—একটি উষ্ণ, জীবন্ত বোর্ডে সাজানো।
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <Bell className="h-5 w-5 text-gold-300" aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold leading-none">{allNotices.length}</p>
                <p className="mt-1 text-xs text-white/65">প্রকাশ্য নোটিশ</p>
              </div>
            </div>
          </div>
        </div>
      </StaggerItem>

      {pinned.length > 0 && (
        <StaggerItem>
          <div className="notice-ticker flex items-stretch overflow-hidden rounded-2xl border border-warmred-200 bg-warmred-50 text-warmred-900 dark:border-warmred-800 dark:bg-warmred-900/30 dark:text-warmred-100">
            <div className="flex shrink-0 items-center gap-2 bg-warmred-500 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white sm:px-5">
              <Zap className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">গুরুত্বপূর্ণ</span>
            </div>
            <div className="notice-ticker-viewport flex min-w-0 items-center overflow-hidden px-4 py-3">
              <div className="notice-ticker-track flex min-w-max items-center text-sm font-semibold">
                <span>{pinned.map((notice) => notice.title).join('  ✦  ')}</span>
                <span aria-hidden="true">{pinned.map((notice) => notice.title).join('  ✦  ')}</span>
              </div>
            </div>
          </div>
        </StaggerItem>
      )}

      <StaggerItem>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-3 shadow-sm sm:flex-row sm:items-center sm:p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input aria-label="নোটিশ খুঁজুন" placeholder="নোটিশ খুঁজুন…" className="h-11 border-border/80 bg-background pl-10" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5" role="group" aria-label="নোটিশ ফিল্টার">
            <Filter className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {([
              ['all', 'সব'],
              ['pinned', 'পিন করা'],
              ['recent', 'সাম্প্রতিক']
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-all duration-300',
                  filter === value
                    ? 'border-transparent bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted hover:text-foreground'
                )}
              >
                {value === 'pinned' && <Pin className="h-3.5 w-3.5" />}
                {label}
                <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                  {value === 'all' ? allNotices.length : value === 'pinned' ? pinned.length : allNotices.filter((notice) => Date.now() - new Date(notice.created_at).getTime() < 1000 * 60 * 60 * 24 * 30).length}
                </span>
              </button>
            ))}
          </div>
          {canEdit && (
            <Button className="shrink-0" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus /> নতুন নোটিশ
            </Button>
          )}
        </div>
      </StaggerItem>

      {isError && <EmptyState title="নোটিশ লোড করা যায়নি" description="কিছুক্ষণ পর আবার চেষ্টা করুন।" icon={<Bell className="h-7 w-7" />} />}

      {!isError && pinned.length > 0 && filter === 'all' && !search && (
        <StaggerItem>
          <NoticeWall notices={pinned} hrefBase={basePath} limit={Math.min(5, pinned.length)} />
        </StaggerItem>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState title="কোনো নোটিশ নেই" description={search ? 'অন্য শব্দ দিয়ে খুঁজে দেখুন।' : 'এখনো কোনো নোটিশ প্রকাশিত হয়নি।'} icon={<Bell className="h-7 w-7" />} />
      )}

      {!isLoading && !isError && filtered.filter((notice) => !(filter === 'all' && !search && notice.is_pinned)).length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.filter((notice) => !(filter === 'all' && !search && notice.is_pinned)).map((notice) => (
            <StaggerItem key={notice.id}>
              <article className={cn('notice-card group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-border bg-card shadow-sm transition-all duration-400 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl', notice.is_pinned && 'border-l-4 border-l-gold-400')}>
                <div className="h-1 bg-gradient-to-r from-coffee-500 via-gold-400 to-sage-500 opacity-70" aria-hidden="true" />
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    {notice.is_pinned && <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-700 dark:bg-gold-900/50 dark:text-gold-300"><Pin className="h-4 w-4" /></span>}
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                        {notice.is_pinned && <span className="rounded-full bg-gold-100 px-2 py-1 text-gold-800 dark:bg-gold-900/50 dark:text-gold-300">পিন করা</span>}
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> {relativeTime(notice.created_at)}</span>
                      </div>
                      <Link href={`${basePath}/item?id=${notice.id}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                        <h3 className="font-serif text-xl font-bold leading-tight tracking-tight transition-colors group-hover:text-primary">{notice.title}</h3>
                        <p className="mt-3 line-clamp-4 text-sm leading-7 text-muted-foreground">{truncate(plainNoticeContent(notice.content), 220)}</p>
                      </Link>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border pt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span>{formatDate(notice.created_at)}{notice.profiles?.full_name ? ` · ${notice.profiles.full_name}` : ' · কমিটি'}</span>
                      <AddToCalendar
                        data={{
                          title: notice.title,
                          description: plainNoticeContent(notice.content),
                          startDate: notice.created_at,
                        }}
                        size="icon"
                      />
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                        {canPin && <Button variant="ghost" size="sm" onClick={() => togglePin(notice)} title="পিন / আনপিন" aria-label="পিন / আনপিন"><Pin className={cn('h-4 w-4', notice.is_pinned && 'text-gold-500')} /></Button>}
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(notice); setFormOpen(true); }} title="সম্পাদনা" aria-label="সম্পাদনা"><Pencil /></Button>
                        <Button variant="ghost" size="sm" className="text-warmred-500" onClick={() => handleDelete(notice)} title="মুছে ফেলুন" aria-label="মুছে ফেলুন"><Trash2 /></Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </StaggerItem>
          ))}
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">{filtered.length}টি নোটিশ · সর্বশেষ আপডেট {formatDate(allNotices[0]?.created_at)}</p>
      )}

      <NoticeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        notice={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ['notices'] })}
      />
    </Stagger>
  );
}
