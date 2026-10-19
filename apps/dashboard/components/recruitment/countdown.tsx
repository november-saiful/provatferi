'use client';

import * as React from 'react';
import { Timer } from 'lucide-react';
import { toBanglaNum } from '@/lib/recruitment';
import { cn } from '@/lib/utils';

interface CountdownProps {
  /** ISO timestamp to count down to. */
  target: string | null;
  /** Short Bengali label shown above the digits. */
  label?: string;
  className?: string;
  tone?: 'light' | 'dark';
}

function split(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60
  };
}

/**
 * Live day/hour/minute/second countdown to a single ISO deadline.
 *
 * Starts ticking after mount so the statically-exported HTML (rendered at
 * build time) never disagrees with the client during hydration.
 */
export function Countdown({ target, label, className, tone = 'light' }: CountdownProps) {
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!target) return null;

  const msLeft = Date.parse(target) - (now ?? Date.now());
  const done = msLeft <= 0;
  const { days, hours, minutes, seconds } = split(msLeft);

  const units = [
    { value: days, label: 'দিন' },
    { value: hours, label: 'ঘণ্টা' },
    { value: minutes, label: 'মিনিট' },
    { value: seconds, label: 'সেকেন্ড' }
  ];

  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        tone === 'dark'
          ? 'border-white/15 bg-white/8 text-white backdrop-blur-sm'
          : 'border-border bg-card text-foreground',
        className
      )}
      role="timer"
      aria-live="off"
    >
      {label && (
        <p
          className={cn(
            'mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold sm:text-sm',
            tone === 'dark' ? 'text-white/80' : 'text-muted-foreground'
          )}
        >
          <Timer className="h-3.5 w-3.5" />
          {label}
        </p>
      )}

      {done ? (
        <p className="text-center text-sm font-bold text-rose-500">সময় শেষ হয়েছে</p>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {units.map((u) => (
            <div
              key={u.label}
              className={cn(
                'flex flex-col items-center rounded-xl px-1 py-2',
                tone === 'dark' ? 'bg-black/20' : 'bg-muted/60'
              )}
            >
              <span className="text-lg font-black tabular-nums leading-none sm:text-2xl">
                {toBanglaNum(u.value).padStart(2, '০')}
              </span>
              <span
                className={cn(
                  'mt-1 text-[10px] leading-none sm:text-xs',
                  tone === 'dark' ? 'text-white/70' : 'text-muted-foreground'
                )}
              >
                {u.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
