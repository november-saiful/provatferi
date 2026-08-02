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
    <div className={cn('relative inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1', className)}>
      {items.map((item) => {
        const active = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onValueChange(item.value)}
            className={cn(
              'relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {active && (
              <motion.span
                layoutId="tabs-active"
                className="absolute inset-0 rounded-md bg-card shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
