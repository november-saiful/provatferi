import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 px-8 py-20 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-coffee-100 to-coffee-200 text-coffee-600 shadow-sm dark:from-coffee-900/60 dark:to-coffee-800/60 dark:text-coffee-400">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <div>
        <p className="text-lg font-semibold">{title}</p>
        {description && <p className="mt-1.5 max-w-md text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      {action}
    </div>
  );
}
