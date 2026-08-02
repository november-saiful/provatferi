'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EASE } from '@/components/ui/motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  /**
   * When true, transitions are grouped by the first path segment (e.g. all
   * `/dashboard/*` routes share one key). Use this at the app root so the
   * dashboard shell stays mounted while module-to-module navigation happens
   * inside it — only the shell's own content transition animates then.
   */
  topLevel?: boolean;
}

/**
 * Cross-fades between pages whenever the route changes. The destination page
 * is keyed by the current pathname so AnimatePresence can play the outgoing
 * page's exit animation before mounting the incoming one.
 *
 * Forward navigations (link clicks / router.push) start the new page at the
 * top, while browser back/forward are allowed to restore their previous
 * scroll position. A `topLevel` instance at the root groups dashboard routes
 * together; the DashboardShell then places a full-pathname instance around
 * its content so dashboard module navigation animates just the content area.
 */
export function PageTransition({ children, className, topLevel = false }: PageTransitionProps) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const key = topLevel ? `/${pathname.split('/')[1] ?? ''}` : pathname;

  // Track whether a navigation came from browser back/forward (popstate),
  // which fires before the route update re-renders this component.
  const isPop = React.useRef(false);
  React.useEffect(() => {
    const onPop = () => {
      isPop.current = true;
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // New pages start at the top on forward navigation; back/forward keep the
  // browser's restored scroll position. 'instant' overrides the global
  // `scroll-behavior: smooth` so the jump doesn't fight the transition.
  React.useEffect(() => {
    const pop = isPop.current;
    isPop.current = false; // always reset so a pop that didn't change `key` can't leak
    if (pop) return;
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.32, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
