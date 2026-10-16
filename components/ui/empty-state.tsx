'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** Backward-compatible action slot for existing modules. */
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Empty / error / no-results state. Icon sits in a warm gradient-tinted chip
 * (matches the app's heritage palette) and the whole block rises in with a
 * gentle spring — friendly direction rather than a dead blank space.
 */
export function EmptyState({ title, description, icon, action, className, children }: EmptyStateProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn('flex flex-col items-center gap-3 px-4 py-10 sm:py-14 text-center', className)}
      initial={reduce ? false : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.7 }}
    >
      {icon && (
        <span className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-accent/8 to-transparent text-primary ring-1 ring-primary/15 shadow-sm">
          {icon}
        </span>
      )}
      <div className="max-w-sm">
        <p className="text-sm sm:text-base font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
      {children}
    </motion.div>
  );
}
