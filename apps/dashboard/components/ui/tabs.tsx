'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: string }[];
  className?: string;
}

export function Tabs({ value, onValueChange, items, className }: TabsProps) {
  return (
    <div className={cn('tabs-scrollable relative flex min-w-0 max-w-full h-10 sm:h-11 items-center rounded-xl bg-muted p-1 sm:p-1.5', className)}>
      <div className="inline-flex min-w-max items-center gap-0.5 sm:gap-1">
        {items.map((item) => {
          const active = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onValueChange(item.value)}
              className={cn(
                'relative z-10 inline-flex min-h-8 items-center justify-center whitespace-nowrap rounded-lg px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <motion.span
                  layoutId="tabs-active"
                  className="site-card-surface absolute inset-0 rounded-lg bg-card shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
