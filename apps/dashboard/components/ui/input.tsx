import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'theme-surface flex h-10 sm:h-11 w-full rounded-xl border-2 border-input bg-card px-3 sm:px-4 py-2 sm:py-2.5 text-sm shadow-sm transition-all duration-200 placeholder:text-muted-foreground/60 hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-40',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
