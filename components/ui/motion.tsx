'use client';

import * as React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

export function useFluidMotion() {
  const reduce = useReducedMotion();
  const enabled = !reduce;
  const transition = { duration: enabled ? 0.45 : 0, ease: EASE };
  const spring = {
    type: 'spring',
    stiffness: 320,
    damping: 30,
    mass: 0.6
  } as const;
  return { enabled, transition, spring };
}

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  gap?: number;
  y?: number;
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
};

const itemVariants = (gap: number, y: number): Variants => ({
  hidden: { opacity: 0, y: y, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  },
  exit: { opacity: 0, y: gap > 0 ? y : -y, transition: { duration: 0.2, ease: 'easeIn' } }
});

export function Stagger({ children, className, gap = 12, y = 14 }: StaggerProps) {
  const { enabled } = useFluidMotion();
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, gap = 12, y = 14 }: StaggerProps) {
  const { enabled } = useFluidMotion();
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants(gap, y)}>
      {children}
    </motion.div>
  );
}

export { EASE };
