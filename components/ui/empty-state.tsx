import * as React from 'react';
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

export function EmptyState({ title, description, icon, action, className, children }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-4 py-10 sm:py-14 text-center', className)}>
      {icon && (
        <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          {icon}
        </span>
      )}
      <div className="max-w-sm">
        <p className="text-sm sm:text-base font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
      {children}
    </div>
  );
}
