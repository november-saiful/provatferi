'use client';

import * as React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1] as const;

export const SPRING = {
  type: 'spring',
  stiffness: 320,
  damping: 30,
  mass: 0.6
} as const;

export const SPRING_SLOW = {
  type: 'spring',
  stiffness: 200,
  damping: 26,
  mass: 0.8
} as const;

export function useFluidMotion() {
  const reduce = useReducedMotion();
  const enabled = !reduce;
  const transition = { duration: enabled ? 0.45 : 0, ease: EASE };
  return { enabled, transition, spring: SPRING };
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
    transition: { staggerChildren: 0.05, delayChildren: 0.04 }
  }
};

const itemVariants = (gap: number, y: number): Variants => ({
  hidden: { opacity: 0, y: y, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: EASE }
  },
  exit: { opacity: 0, y: gap > 0 ? y : -y, transition: { duration: 0.18, ease: 'easeIn' } }
});

export function Stagger({ children, className, gap = 12, y = 14 }: StaggerProps) {
  const { enabled } = useFluidMotion();
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial="hidden" animate="visible" variants={containerVariants}>
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

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  amount?: number;
}

export function Reveal({ children, className, delay = 0, y = 20, once = true, amount = 0.1 }: RevealProps) {
  const { enabled } = useFluidMotion();
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function RevealStagger({ children, className, gap = 12, y = 20 }: StaggerProps) {
  const { enabled } = useFluidMotion();
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } }
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className, gap = 12, y = 20 }: StaggerProps) {
  const { enabled } = useFluidMotion();
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants(gap, y)}>
      {children}
    </motion.div>
  );
}
