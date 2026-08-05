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

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

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
            role="dialog"
            aria-modal="true"
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
                {title && <h2 className="text-base sm:text-lg font-semibold leading-tight">{title}</h2>}
                {description && <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
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
