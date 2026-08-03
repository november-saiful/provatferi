import * as React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shimmer rounded-lg', className)} {...props} />;
}

function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn('h-4 rounded-full', className)} />;
}

function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn('h-11 w-11 shrink-0 rounded-full', className)} />;
}

function SkeletonImage({ className }: { className?: string }) {
  return <Skeleton className={cn('w-full rounded-xl', className)} />;
}

function SkeletonCard({ className, lines = 3, avatar = false }: { className?: string; lines?: number; avatar?: boolean }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-sm', className)}>
      {avatar && <SkeletonAvatar className="mb-4 h-10 w-10" />}
      <div className="space-y-3">
        <SkeletonText className="h-5 w-2/3" />
        {Array.from({ length: Math.max(0, lines - 1) }).map((_, i) => (
          <SkeletonText key={i} className={i === lines - 2 ? 'w-1/2' : undefined} />
        ))}
      </div>
    </div>
  );
}

function SkeletonMediaCard({ className, imageHeight = 'aspect-video', lines = 3 }: { className?: string; imageHeight?: string; lines?: number }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-sm', className)}>
      <SkeletonImage className={cn(imageHeight, 'rounded-none border-0')} />
      <div className="space-y-3 p-5">
        <SkeletonText className="h-5 w-3/4" />
        {Array.from({ length: Math.max(0, lines - 1) }).map((_, i) => (
          <SkeletonText key={i} className={i === lines - 2 ? 'w-1/2' : undefined} />
        ))}
      </div>
    </div>
  );
}

function SkeletonListRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm', className)}>
      <SkeletonAvatar className="h-11 w-11" />
      <div className="min-w-0 flex-1 space-y-3">
        <SkeletonText className="h-5 w-2/3" />
        <SkeletonText className="w-full" />
        <SkeletonText className="w-1/3" />
      </div>
    </div>
  );
}

function SkeletonAvatarCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-sm', className)}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar className="h-11 w-11" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <SkeletonText className="h-5 w-2/3" />
          <SkeletonText className="w-1/2" />
        </div>
      </div>
      <SkeletonText className="mt-4 w-full" />
    </div>
  );
}

function SkeletonTable({ className, rows = 5, columns = 5 }: { className?: string; rows?: number; columns?: number }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-sm', className)}>
      <div className="flex items-center gap-6 border-b border-border bg-muted/30 px-5 py-3.5">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonText key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-6 border-b border-border px-5 py-4 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonText key={c} className={cn('h-3.5 flex-1', c === 0 && 'flex-[1.6]', c === columns - 1 && 'w-14 flex-none')} />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-sm', className)}>
      <SkeletonText className="w-1/2" />
      <SkeletonText className="mt-3 h-8 w-2/3" />
    </div>
  );
}

function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-sm', className)}>
      <SkeletonText className="h-5 w-1/3" />
      <SkeletonText className="mt-1.5 w-1/2" />
      <div className="mt-6 flex h-60 items-end gap-2">
        {[42, 68, 30, 82, 55, 72, 46, 90, 60, 36, 76, 50].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function SkeletonCalendar({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 shadow-sm', className)}>
      <div className="mb-4 flex items-center justify-between px-2 pt-1">
        <SkeletonText className="h-5 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-5" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-20 sm:h-24" />
        ))}
      </div>
    </div>
  );
}

function SkeletonBudgetCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2.5">
          <SkeletonText className="h-5 w-44" />
          <SkeletonText className="w-24" />
        </div>
        <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
      </div>
      <div className="mt-4 space-y-3">
        <SkeletonText className="w-full" />
        <SkeletonText className="w-2/3" />
      </div>
      <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
      <SkeletonText className="mt-2 w-20" />
    </div>
  );
}

function SkeletonForm({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-5', className)}>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <SkeletonText className="h-6 w-1/3" />
        <Skeleton className="mt-4 h-11 w-full rounded-xl" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <SkeletonText className="h-6 w-1/3" />
        <div className="mt-4 grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        <Skeleton className="mt-4 h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonDetail({ className, showComments = true }: { className?: string; showComments?: boolean }) {
  return (
    <div className={cn('space-y-5', className)}>
      <Skeleton className="h-10 w-40 rounded-xl" />
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <SkeletonImage className="aspect-video rounded-none border-0 sm:aspect-[21/9]" />
        <div className="space-y-3 p-6">
          <SkeletonText className="h-7 w-2/3" />
          <SkeletonText className="w-1/2" />
          <div className="space-y-2.5 pt-2">
            <SkeletonText className="w-full" />
            <SkeletonText className="w-full" />
            <SkeletonText className="w-3/4" />
          </div>
        </div>
      </div>
      {showComments && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <SkeletonText className="h-5 w-1/4" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <SkeletonAvatar className="h-9 w-9" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonText className="w-1/3" />
                  <SkeletonText className="w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonImage,
  SkeletonCard,
  SkeletonMediaCard,
  SkeletonListRow,
  SkeletonAvatarCard,
  SkeletonTable,
  SkeletonStatCard,
  SkeletonChart,
  SkeletonCalendar,
  SkeletonBudgetCard,
  SkeletonForm,
  SkeletonDetail
};
