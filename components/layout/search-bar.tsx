'use client';

import * as React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Optional filter chip trigger. */
  onFilter?: () => void;
}

/**
 * Google-Drive-style search input: rounded-full, tinted background, with the
 * iconic left search icon and an `Esc`/clear-button affordance. Press `/`
 * globally to focus it.
 */
export function SearchBar({ value, onChange, placeholder, className, onFilter }: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const inForm =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement | null)?.isContentEditable;
      if (e.key === '/' && !inForm) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onChange]);

  return (
    <div className={cn('group relative flex w-full max-w-2xl items-center', className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted-foreground"
      >
        <Search className="h-4 w-4" />
      </span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Provatferi-তে খুঁজুন'}
        aria-label="অনুসন্ধান"
        className={cn(
          'h-10 w-full rounded-full border border-border bg-secondary/70 pl-11 pr-24 text-sm text-foreground placeholder:text-muted-foreground/80',
          'transition-all duration-200 outline-none',
          'hover:bg-secondary focus:bg-card focus:border-primary/40 focus:ring-4 focus:ring-primary/10',
          'dark:bg-secondary/40 dark:hover:bg-secondary/60'
        )}
      />
      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center gap-2 text-muted-foreground">
        {value ? (
          <button
            type="button"
            aria-label="অনুসন্ধান মুছুন"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-muted-foreground/15 text-foreground/80 transition-all hover:bg-muted-foreground/25 active:scale-95"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden h-6 select-none items-center justify-center rounded-md border border-border bg-card px-1.5 font-mono text-[10px] font-semibold text-muted-foreground sm:inline-flex">
            /
          </kbd>
        )}
        {onFilter && (
          <button
            type="button"
            aria-label="ফিল্টার"
            onClick={onFilter}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Match helper for nav filtering.
 */
export function matchesQuery(label: string, hint: string | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  const q = needle.trim().toLowerCase();
  return (
    label.toLowerCase().includes(q) ||
    (hint ? hint.toLowerCase().includes(q) : false)
  );
}
