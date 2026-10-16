import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  max?: number;
}

export function Progress({ value, className, barClassName, max = 100 }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-700 ease-out-expo',
          barClassName
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
