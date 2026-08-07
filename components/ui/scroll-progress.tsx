'use client';

import * as React from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Thin gradient progress bar fixed to the top of the viewport, above the
 * sticky header. Tracks overall page scroll with a spring for a fluid,
 * premium feel (framer-motion `useScroll` signature element).
 *
 * - transform/opacity only → no layout shift (CLS-safe)
 * - spring follows with low stiffness so the bar never lags behind content
 * - prefers-reduced-motion: still useful (it mirrors scroll position), but
 *   without the spring smoothing
 */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
    restDelta: 0.001
  });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-primary via-accent to-gold-500"
      style={{ scaleX: reduce ? scrollYProgress : scaleX }}
    />
  );
}
