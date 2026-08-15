'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '@/components/ui/motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  topLevel?: boolean;
}

/**
 * Lightweight page transition: a quick fade/settle on the incoming page only.
 *
 * There is deliberately NO exit animation and no `AnimatePresence mode="wait"`:
 * waiting for the old page to animate out before mounting the new one adds a
 * visible ~350ms dead pause to every navigation — the main reason the app felt
 * laggy on both desktop and mobile. The next page mounts immediately and its
 * scroll position resets instantly.
 */
export function PageTransition({ children, className, topLevel = false }: PageTransitionProps) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const key = topLevel ? `/${pathname.split('/')[1] ?? ''}` : pathname;

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [key]);

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      key={key}
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
