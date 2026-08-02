'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Pin, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useNotices } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canWrite, canPinNotices } from '@/lib/permissions';
import { formatDate, relativeTime, truncate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { NoticeForm } from '@/components/forms/notice-form';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import type { Notice } from '@/lib/types';

export function NoticeBoard({ basePath = '/dashboard/ntb' }: { basePath?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { role } = useAuthStore();
  const { data: notices, isLoading } = useNotices();
  const [search, setSearch] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Notice | null>(null);

  const canEdit = canWrite(role, 'ntb');
  const canPin = canPinNotices(role);

  const filtered = React.useMemo(() => {
    if (!notices) return [];
    const q = search.toLowerCase();
    return notices.filter((n) => !q || n.title.toLowerCase().includes(q));
  }, [notices, search]);

  const togglePin = async (n: Notice) => {
    const pinnedCount = notices?.filter((x) => x.is_pinned).length ?? 0;
    if (!n.is_pinned && pinnedCount >= 3) {
      toast.error('Maximum 3 pinned notices');
      return;
    }
    const { error } = await supabase.from('notices').update({ is_pinned: !n.is_pinned }).eq('id', n.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(n.is_pinned ? 'Unpinned' : 'Pinned');
      qc.invalidateQueries({ queryKey: ['notices'] });
    }
  };

  const handleDelete = async (n: Notice) => {
    if (!confirm(`Delete notice "${n.title}"?`)) return;
    const { error } = await supabase.from('notices').delete().eq('id', n.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Notice deleted');
      qc.invalidateQueries({ queryKey: ['notices'] });
    }
  };

  return (
    <Stagger className="space-y-5">
      <StaggerItem className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search notices…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> New notice
          </Button>
        )}
      </StaggerItem>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState title="No notices" description="There are no notices yet." />
      )}

      <StaggerItem className="space-y-3">
        {filtered.map((n) => (
          <StaggerItem key={n.id}>
            <Card
              className={cn('card-hover cursor-pointer overflow-hidden', n.is_pinned && 'border-l-4 border-l-amber-400')}
            >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <button type="button" className="flex-1 text-left" onClick={() => router.push(`${basePath}/item?id=${n.id}`)}>
                  <div className="flex items-center gap-2">
                    {n.is_pinned && <Pin className="h-4 w-4 shrink-0 text-amber-500" />}
                    <h3 className="font-semibold">{n.title}</h3>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{truncate(n.content, 160)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(n.created_at)} · {n.profiles?.full_name ?? 'Committee'}
                  </p>
                </button>
                {canEdit && (
                  <div className="flex shrink-0 gap-1">
                    {canPin && (
                      <Button variant="ghost" size="sm" onClick={() => togglePin(n)} title="Pin / unpin">
                        <Pin className={cn('h-4 w-4', n.is_pinned && 'text-amber-500')} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(n);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-warmred-500" onClick={() => handleDelete(n)}>
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerItem>

      <NoticeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        notice={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ['notices'] })}
      />
    </Stagger>
  );
}
