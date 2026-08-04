'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, ChevronRight } from 'lucide-react';
import { cn, formatMoney, toBengaliDigits } from '@/lib/utils';
import { useClubBalance } from '@/lib/queries';

const BUDGET_FLOOR = 100_000;

interface BalanceWidgetProps {
  /** When true renders a compact card for the dashboard top; otherwise the sidebar version. */
  variant?: 'dashboard' | 'sidebar';
  className?: string;
}

/**
 * Shared balance widget showing budget allocation, spending, and remaining.
 * Used in both the sidebar (storage indicator) and the dashboard top card.
 *
 * Reads the universal balance via the `get_club_balance` RPC (migration
 * 00027), so every signed-in user sees the exact same totals regardless of
 * their role's row-level access.
 */
export function BalanceWidget({ variant = 'sidebar', className }: BalanceWidgetProps) {
  const { data: balance } = useClubBalance();

  // Total budget = sum of active budgets' allocated_amount
  const allocated = Number(balance?.allocated ?? 0);
  // Total spent = sum of actual expense records (not budget.spent_amount which may be stale)
  const spent = Number(balance?.spent ?? 0);

  const totalCapacity = Math.max(allocated, BUDGET_FLOOR);
  const used = spent;
  const remaining = Math.max(totalCapacity - used, 0);
  const pct = totalCapacity > 0 ? Math.min(100, Math.round((used / totalCapacity) * 100)) : 0;

  const barColor =
    pct < 60 ? 'bg-sage-500' : pct < 85 ? 'bg-amber-500' : 'bg-warmred-500';

  /* ── Dashboard variant: wider card for the top of the dashboard ── */
  if (variant === 'dashboard') {
    return (
      <div className={cn('rounded-xl border border-border bg-secondary/50 p-4 theme-surface', className)}>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">ব্যালেন্স</p>
            <p className="truncate text-xs text-muted-foreground">
              বাজেট বরাদ্দ ও ব্যয়
            </p>
          </div>
          <Link
            href="/dashboard/bgm"
            className="group inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            বাজেট দেখুন
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground leading-none">
            {toBengaliDigits(pct)}% ব্যবহৃত
          </p>
          <p className="text-xs text-muted-foreground tabular-nums leading-none">
            {formatMoney(used)} / {formatMoney(totalCapacity)}
          </p>
        </div>

        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={cn('absolute inset-y-0 left-0 rounded-full', barColor)}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground tabular-nums">
            অবশিষ্ট · {formatMoney(remaining)}
          </span>
          <span className="text-muted-foreground tabular-nums">
            বরাদ্দ · {formatMoney(allocated)}
          </span>
        </div>
      </div>
    );
  }

  /* ── Sidebar variant: compact for the sidebar bottom ── */
  return (
    <div className={cn('rounded-xl border border-border bg-secondary/50 p-3 theme-surface', className)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Wallet className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">ব্যালেন্স</p>
          <p className="truncate text-[10px] text-muted-foreground">
            ক্লাব বাজেট
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
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}            className={cn('absolute inset-y-0 left-0 rounded-full', barColor)}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[10.5px]">
        <span className="text-muted-foreground tabular-nums">
          অবশিষ্ট · {formatMoney(remaining)}
        </span>
        <Link
          href="/dashboard/bgm"
          className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
        >
          বাজেট দেখুন
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
