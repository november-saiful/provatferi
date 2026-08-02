import * as React from 'react';
import { cn } from '@/lib/utils';

/* Base building block — everything else composes this. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shimmer rounded-lg', className)} {...props} />;
}

/* A single shimmering text line. */
function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn('h-3.5 rounded-full', className)} />;
}

/* Circular avatar placeholder. */
function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn('h-10 w-10 shrink-0 rounded-full', className)} />;
}

/* Blank image block (aspect set by the caller). */
function SkeletonImage({ className }: { className?: string }) {
  return <Skeleton className={cn('w-full', className)} />;
}

/* Generic card shell with title + body lines. */
function SkeletonCard({
  className,
  lines = 3,
  avatar = false
}: {
  className?: string;
  lines?: number;
  avatar?: boolean;
}) {
  return (
    <div className={cn('rounded-xl2 border border-border bg-card p-5 shadow-soft', className)}>
      {avatar && <SkeletonAvatar className="mb-3 h-10 w-10" />}
      <div className="space-y-2.5">
        <SkeletonText className="h-4 w-2/3" />
        {Array.from({ length: Math.max(0, lines - 1) }).map((_, i) => (
          <SkeletonText key={i} className={i === lines - 2 ? 'w-1/2' : undefined} />
        ))}
      </div>
    </div>
  );
}

/* Card with a media image on top — for events, courses, gallery tiles. */
function SkeletonMediaCard({
  className,
  imageHeight = 'aspect-video',
  lines = 3
}: {
  className?: string;
  imageHeight?: string;
  lines?: number;
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl2 border border-border bg-card shadow-soft', className)}>
      <SkeletonImage className={cn(imageHeight, 'rounded-none border-0')} />
      <div className="space-y-2.5 p-4">
        <SkeletonText className="h-4 w-3/4" />
        {Array.from({ length: Math.max(0, lines - 1) }).map((_, i) => (
          <SkeletonText key={i} className={i === lines - 2 ? 'w-1/2' : undefined} />
        ))}
      </div>
    </div>
  );
}

/* Horizontal row with avatar + lines — notices, comments, list items. */
function SkeletonListRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl2 border border-border bg-card p-4 shadow-soft',
        className
      )}
    >
      <SkeletonAvatar className="h-10 w-10" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <SkeletonText className="h-4 w-2/3" />
        <SkeletonText className="w-full" />
        <SkeletonText className="w-1/3" />
      </div>
    </div>
  );
}

/* Compact avatar card — donor wall, committee members. */
function SkeletonAvatarCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl2 border border-border bg-card p-4 shadow-soft', className)}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar className="h-10 w-10" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonText className="h-4 w-2/3" />
          <SkeletonText className="w-1/2" />
        </div>
      </div>
      <SkeletonText className="mt-3 w-full" />
    </div>
  );
}

/* Data table placeholder — expenses, budgets, records, sponsors, admin. */
function SkeletonTable({
  className,
  rows = 5,
  columns = 5
}: {
  className?: string;
  rows?: number;
  columns?: number;
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl2 border border-border bg-card shadow-soft', className)}>
      <div className="flex items-center gap-6 border-b border-border bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonText key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-6 border-b border-border px-4 py-3.5 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonText
              key={c}
              className={cn('h-3 flex-1', c === 0 && 'flex-[1.6]', c === columns - 1 && 'w-12 flex-none')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* Small stat card — insights overview, dashboard numbers. */
function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl2 border border-border bg-card p-4 shadow-soft', className)}>
      <SkeletonText className="w-1/2" />
      <SkeletonText className="mt-3 h-7 w-2/3" />
    </div>
  );
}

/* Chart / tall content block — recharts panels. */
function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl2 border border-border bg-card p-5 shadow-soft', className)}>
      <SkeletonText className="h-4 w-1/3" />
      <SkeletonText className="mt-1.5 w-1/2" />
      <div className="mt-6 flex h-56 items-end gap-2">
        {[42, 68, 30, 82, 55, 72, 46, 90, 60, 36, 76, 50].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

/* Calendar grid placeholder — react-big-calendar. */
function SkeletonCalendar({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl2 border border-border bg-card p-3 shadow-soft', className)}>
      <div className="mb-3 flex items-center justify-between px-2 pt-1">
        <SkeletonText className="h-4 w-32" />
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-16 sm:h-20" />
        ))}
      </div>
    </div>
  );
}

/* Budget card with progress bar — budgets module. */
function SkeletonBudgetCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl2 border border-border bg-card p-5 shadow-soft', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <SkeletonText className="h-4 w-40" />
          <SkeletonText className="w-20" />
        </div>
        <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
      </div>
      <div className="mt-4 space-y-2.5">
        <SkeletonText className="w-full" />
        <SkeletonText className="w-2/3" />
      </div>
      <Skeleton className="mt-4 h-2 w-full rounded-full" />
      <SkeletonText className="mt-1.5 w-16" />
    </div>
  );
}

/* Form placeholder — attendance management, admin forms. */
function SkeletonForm({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl2 border border-border bg-card p-5 shadow-soft">
        <SkeletonText className="h-5 w-1/3" />
        <Skeleton className="mt-3 h-10 w-full rounded-lg" />
      </div>
      <div className="rounded-xl2 border border-border bg-card p-5 shadow-soft">
        <SkeletonText className="h-5 w-1/3" />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="rounded-xl2 border border-border bg-card p-5 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-20 w-full rounded-lg" />
        <Skeleton className="mt-3 h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

/* Detail page placeholder — event / notice detail views. */
function SkeletonDetail({ className, showComments = true }: { className?: string; showComments?: boolean }) {
  return (
    <div className={cn('space-y-4', className)}>
      <Skeleton className="h-9 w-36 rounded-lg" />
      <div className="overflow-hidden rounded-xl2 border border-border bg-card shadow-soft">
        <SkeletonImage className="aspect-video rounded-none border-0 sm:aspect-[21/9]" />
        <div className="space-y-2.5 p-5">
          <SkeletonText className="h-6 w-2/3" />
          <SkeletonText className="w-1/2" />
          <div className="space-y-2 pt-2">
            <SkeletonText className="w-full" />
            <SkeletonText className="w-full" />
            <SkeletonText className="w-3/4" />
          </div>
        </div>
      </div>
      {showComments && (
        <div className="rounded-xl2 border border-border bg-card p-5 shadow-soft">
          <SkeletonText className="h-4 w-1/4" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <SkeletonAvatar className="h-8 w-8" />
                <div className="min-w-0 flex-1 space-y-1.5">
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
