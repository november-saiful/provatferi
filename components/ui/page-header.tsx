'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EASE } from '@/components/ui/motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg';
}

export function PageHeader({ title, description, children, className, size = 'lg' }: PageHeaderProps) {
  return (
    <motion.div
      className={cn('mb-8', className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-accent" />
          <h1
            className={cn(
              'font-bold tracking-tight text-balance',
              size === 'lg' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
            )}
          >
            {title}
          </h1>
          {description && <p className="mt-2 text-base text-muted-foreground max-w-2xl">{description}</p>}
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </motion.div>
  );
}
