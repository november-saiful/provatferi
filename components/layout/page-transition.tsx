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

export function PageTransition({ children, className, topLevel = false }: PageTransitionProps) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const key = topLevel ? `/${pathname.split('/')[1] ?? ''}` : pathname;

  const isPop = React.useRef(false);
  React.useEffect(() => {
    const onPop = () => {
      isPop.current = true;
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  React.useEffect(() => {
    const pop = isPop.current;
    isPop.current = false;
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
        initial={{ opacity: 0, y: 20, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.998 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
