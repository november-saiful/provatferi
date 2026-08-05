import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        success: 'border-transparent bg-sage-100 text-sage-700 dark:bg-sage-900/60 dark:text-sage-300',
        warning: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
        destructive: 'border-transparent bg-warmred-100 text-warmred-700 dark:bg-warmred-900/60 dark:text-warmred-300',
        coffee: 'border-transparent bg-coffee-100 text-coffee-700 dark:bg-coffee-900/60 dark:text-coffee-300',
        taupe: 'border-transparent bg-taupe-100 text-taupe-700 dark:bg-taupe-900/60 dark:text-taupe-300',
        gold: 'border-transparent bg-gold-100 text-gold-700 dark:bg-gold-900/60 dark:text-gold-300',
        org: 'border-dashed border-gold-400/60 bg-gradient-to-r from-gold-50 to-amber-50 text-gold-800 dark:from-gold-900/30 dark:to-amber-900/30 dark:text-gold-300 ring-1 ring-gold-300/30'
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
