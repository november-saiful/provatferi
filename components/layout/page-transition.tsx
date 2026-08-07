'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EASE } from '@/components/ui/motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  topLevel?: boolean;
}

/**
 * Direction-aware page transition: forward navigation (link click) enters from
 * below and exits upward; backward navigation (browser back) settles down.
 * Directional motion keeps spatial continuity — the user always knows which
 * way the app is moving (motion rule: navigation-direction / continuity).
 */
export function PageTransition({ children, className, topLevel = false }: PageTransitionProps) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const key = topLevel ? `/${pathname.split('/')[1] ?? ''}` : pathname;

  const isBackRef = React.useRef(false);
  React.useEffect(() => {
    const onPop = () => {
      isBackRef.current = true;
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  React.useEffect(() => {
    // If this render came from a popstate (browser back/forward), keep the
    // back direction for the exit of the current page, then reset for the
    // next push navigation.
    const wasBack = isBackRef.current;
    isBackRef.current = false;
    if (wasBack) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [key]);

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        className={className}
        initial={{ opacity: 0, y: isBackRef.current ? -18 : 22, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: isBackRef.current ? 18 : -14, scale: 0.998 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
