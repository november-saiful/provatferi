'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pin } from 'lucide-react';
import { useNotice } from '@/lib/queries';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export function NoticeDetail({ noticeId }: { noticeId?: string | null }) {
  const router = useRouter();
  const { data: notice, isLoading } = useNotice(noticeId ?? undefined);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!notice) {
    return (
      <EmptyState
        title="Notice not found"
        action={<Button onClick={() => router.push('/dashboard/ntb')}>Back to notices</Button>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" onClick={() => router.push('/dashboard/ntb')}>
        <ArrowLeft /> Back to notices
      </Button>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            {notice.is_pinned && <Pin className="h-4 w-4 text-amber-500" />}
            <h1 className="text-2xl font-bold">{notice.title}</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDateTime(notice.created_at)} · {notice.profiles?.full_name ?? 'Committee'}
          </p>
          <div className="mt-6 whitespace-pre-line text-foreground/90">{notice.content}</div>
        </CardContent>
      </Card>
    </div>
  );
}
