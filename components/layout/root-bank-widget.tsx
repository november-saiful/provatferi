'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Landmark, ChevronRight } from 'lucide-react';
import { cn, formatMoney, toBengaliDigits } from '@/lib/utils';
import { useRootBankBalance } from '@/lib/queries';

interface RootBankWidgetProps {
  className?: string;
}

/**
 * Compact Root Bank balance widget — the right-side-menu counterpart of the
 * club `BalanceWidget` (storage indicator). Reads the server-computed totals
 * via the `get_root_bank_balance` RPC (migration 00037) and links to the
 * full Root Bank panel. Rendered only for root / president / admin.
 */
export function RootBankWidget({ className }: RootBankWidgetProps) {
  const { data: balance } = useRootBankBalance();

  const deposits = Number(balance?.deposits ?? 0);
  const spent = Number(balance?.spent ?? 0);
  const remaining = deposits - spent;
  const pct = deposits > 0 ? Math.min(100, Math.round((spent / deposits) * 100)) : 0;
  const barColor = pct < 60 ? 'bg-sage-500' : pct < 85 ? 'bg-amber-500' : 'bg-warmred-500';

  return (
    <div className={cn('rounded-xl border border-border bg-secondary/50 p-3 theme-surface', className)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Landmark className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">রুট ব্যাংক</p>
          <p className="truncate text-[10px] text-muted-foreground">জমা ও ব্যয়</p>
        </div>
      </div>

      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground leading-none">
          {toBengaliDigits(pct)}% ব্যবহৃত
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums leading-none">
          {formatMoney(spent)} / {formatMoney(deposits)}
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

      <div className="mt-2.5 flex items-center justify-between gap-2 text-[10.5px]">
        <span className="text-muted-foreground tabular-nums">
          অবশিষ্ট ·{' '}
          <span className={cn('font-semibold', remaining < 0 ? 'text-warmred-500' : 'text-sage-600 dark:text-sage-400')}>
            {formatMoney(remaining)}
          </span>
        </span>
        <Link
          href="/dashboard/root-bank"
          className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
        >
          খুলুন
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
