'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Music4, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Countdown } from '@/components/recruitment/countdown';
import { EASE } from '@/components/ui/motion';
import type { FormMode } from '@/lib/recruitment';

interface ModePickerProps {
  onSelect: (mode: FormMode) => void;
  /** Deadline for the current phase (end while open, start while scheduled). */
  countdownTarget?: string | null;
  countdownLabel?: string;
}

export function ModePicker({ onSelect, countdownTarget, countdownLabel }: ModePickerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recruitment-mode-title"
    >
      <motion.div
        className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 text-center text-card-foreground shadow-2xl sm:p-8"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="প্রভাতফেরী" className="mx-auto mb-5 h-16 w-auto object-contain" />
        <h2
          id="recruitment-mode-title"
          className="mb-6 text-xl font-bold tracking-tight text-primary sm:text-2xl"
        >
          আপনি কী করতে চান?
        </h2>

        <div className="space-y-3">
          <Button size="lg" className="w-full" onClick={() => onSelect('course')}>
            <Music4 />
            কোর্সে ভর্তি হতে চাই
          </Button>
          <Button size="lg" variant="outline" className="w-full" onClick={() => onSelect('member')}>
            <Users />
            ক্লাবের সদস্য হতে চাই
          </Button>
        </div>

        {countdownTarget && (
          <Countdown
            target={countdownTarget}
            label={countdownLabel ?? 'সময় বাকি'}
            className="mt-6 bg-muted/40"
          />
        )}
      </motion.div>
    </div>
  );
}
