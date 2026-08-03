'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Wallet, CircleDollarSign, ChevronRight } from 'lucide-react';
import { cn, formatMoney, toBengaliDigits } from '@/lib/utils';
import { useExpenses, useBudgets } from '@/lib/queries';
import { canRead } from '@/lib/permissions';
import { useAuthStore } from '@/lib/auth-store';

interface StorageIndicatorProps {
  collapsed?: boolean;
  className?: string;
}

const BUDGET_FLOOR = 100_000;

/**
 * Drive-style storage indicator pinned at the bottom of the sidebar.
 * Gated on finance permissions so non-finance members don't trigger
 * data loads they can't see. Uses live expense / budget aggregation
 * so the bar grows as the club spends.
 */
export function StorageIndicator({ collapsed, className }: StorageIndicatorProps) {
  const { role } = useAuthStore();
  const canSeeFinance = canRead(role, 'xpm');
  const canSeeBudget = canRead(role, 'bgm');

  const { data: expenses } = useExpenses(canSeeFinance);
  const { data: budgets } = useBudgets(canSeeBudget);

  const spent = (expenses ?? []).reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const allocated = (budgets ?? [])
    .filter((b) => b.status === 'active')
    .reduce((s, b) => s + Number(b.allocated_amount ?? 0), 0);
  // Drive uses a fixed quota; we synthesise one from existing budgets.
  // BUDGET_FLOOR keeps the bar visible while spending ramps up.
  const totalCapacity = Math.max(allocated + spent, BUDGET_FLOOR);

  const used = spent;
  const remaining = Math.max(totalCapacity - used, 0);
  const pct = totalCapacity > 0 ? Math.min(100, Math.round((used / totalCapacity) * 100)) : 0;

  if (collapsed) {
    return (
      <div className={cn('flex justify-center', className)}>
        <div
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/70 text-foreground shadow-inner"
          title={`${pct}% ব্যবহৃত`}
        >
          <CircleDollarSign className="h-4 w-4" />
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="hsl(var(--primary) / 0.18)"
              strokeWidth="2.5"
            />
            <motion.circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="100"
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - pct }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
        </div>
      </div>
    );
  }

  const barColor =
    pct < 60 ? 'bg-sage-500' : pct < 85 ? 'bg-amber-500' : 'bg-warmred-500';

  return (
    <div className={cn('rounded-xl border border-border bg-secondary/50 p-3 theme-surface', className)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Wallet className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">ব্যালেন্স</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {canSeeFinance ? 'বাজেট বরাদ্দ ও ব্যয়' : 'ক্লাব বাজেট'}
          </p>
        </div>
      </div>

      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground leading-none">
          {toBengaliDigits(pct)}% ব্যবহৃত
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums leading-none">
          {formatMoney(used)} / {formatMoney(totalCapacity)}
        </p>
      </div>

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={cn('absolute inset-y-0 left-0 rounded-full', barColor)}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[10.5px]">
        <span className="text-muted-foreground tabular-nums">
          অবশিষ্ট · {formatMoney(remaining)}
        </span>
        <a
          href="/dashboard/bgm"
          className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
        >
          বাজেট দেখুন
          <ChevronRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
