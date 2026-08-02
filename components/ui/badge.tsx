import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-sage-100 text-sage-700 dark:bg-sage-900 dark:text-sage-200',
        warning: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        destructive: 'border-transparent bg-warmred-100 text-warmred-700 dark:bg-warmred-900 dark:text-warmred-200',
        coffee: 'border-transparent bg-coffee-100 text-coffee-700 dark:bg-coffee-900 dark:text-coffee-200',
        taupe: 'border-transparent bg-taupe-100 text-taupe-700 dark:bg-taupe-900 dark:text-taupe-200'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
