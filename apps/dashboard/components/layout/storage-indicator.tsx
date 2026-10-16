'use client';

import { motion } from 'framer-motion';
import { CircleDollarSign } from 'lucide-react';
import { cn, toBengaliDigits } from '@/lib/utils';
import { useClubBalance } from '@/lib/queries';
import { BalanceWidget } from '@/components/layout/balance-widget';

interface StorageRingProps {
  className?: string;
}

/** Compact circular usage ring — the only consumer of the balance when collapsed. */
function StorageRing({ className }: StorageRingProps) {
  const { data: balance } = useClubBalance();

  const allocated = Number(balance?.allocated ?? 0);
  const spent = Number(balance?.spent ?? 0);
  const totalCapacity = Math.max(allocated, 100_000);
  const pct = totalCapacity > 0 ? Math.min(100, Math.round((spent / totalCapacity) * 100)) : 0;

  return (
    <div className={cn('flex justify-center', className)}>
      <div
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/70 text-foreground shadow-inner"
        title={`${toBengaliDigits(pct)}% ব্যবহৃত`}
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

interface StorageIndicatorProps {
  collapsed?: boolean;
  className?: string;
}

/**
 * Drive-style storage indicator pinned at the bottom of the sidebar.
 * Delegates to the shared BalanceWidget for the expanded view and renders its
 * own ring only when collapsed — exactly one balance subscriber is active per
 * state. Reads the universal balance via the `get_club_balance` RPC (migration
 * 00027) so every signed-in user sees the same totals.
 */
export function StorageIndicator({ collapsed, className }: StorageIndicatorProps) {
  if (collapsed) {
    return <StorageRing className={className} />;
  }

  return <BalanceWidget variant="sidebar" className={className} />;
}
