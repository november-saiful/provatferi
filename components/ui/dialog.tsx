'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Accessible modal: focus is moved inside on open, trapped while open
 * (Tab/Shift+Tab cycle within the dialog), and restored to the trigger on
 * close. Escape closes; the backdrop closes. Labelled by the title so screen
 * readers announce the dialog's purpose.
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();
  const descId = React.useId();
  const lastFocusedRef = React.useRef<HTMLElement | null>(null);

  // Call sites often pass inline arrows; a ref keeps the focus effect from
  // re-running (and stealing focus from form inputs) on every parent render.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (!open) return;

    // Remember what had focus so we can hand it back on close.
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    // Move focus into the dialog on open (close button is the safest target).
    const raf = requestAnimationFrame(() => closeRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panel.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      lastFocusedRef.current?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            className={cn(
              'site-card-surface relative z-10 w-full max-w-full overflow-y-auto rounded-t-2xl border border-border bg-card shadow-2xl sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl',
              'max-h-[calc(100dvh-env(safe-area-inset-bottom,0px))] overscroll-contain',
              className
            )}
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30, mass: 0.8 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 sm:px-6 sm:py-5">
              <div className="min-w-0 flex-1">
                {title && <h2 id={titleId} className="text-base sm:text-lg font-semibold leading-tight">{title}</h2>}
                {description && <p id={descId} className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="বন্ধ করুন"
                className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
