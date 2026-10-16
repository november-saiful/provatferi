'use client';

import * as React from 'react';
import { motion, useScroll, useReducedMotion } from 'framer-motion';

/**
 * Thin gradient progress bar fixed to the top of the viewport, above the
 * sticky header. Tracks overall page scroll.
 *
 * - transform/opacity only → no layout shift (CLS-safe)
 * - scroll position maps 1:1 to the bar (no spring): one less per-frame
 *   animation to run, which keeps low-end and mobile devices smooth
 */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-primary via-accent to-gold-500"
      style={{ scaleX: scrollYProgress }}
      {...(reduce ? { animate: false } : {})}
    />
  );
}
