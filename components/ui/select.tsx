import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: { value: string; label: string }[];
  children?: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'theme-surface flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-8 text-sm shadow-sm transition-all duration-200 focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
);
Select.displayName = 'Select';

export { Select };
