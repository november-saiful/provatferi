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
      className={cn('mb-6', className)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className={cn(
              'font-bold tracking-tight text-balance',
              size === 'lg' ? 'text-3xl md:text-4xl' : 'text-2xl'
            )}
          >
            {title}
          </h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground md:text-base">{description}</p>}
        </div>
        {children}
      </div>
    </motion.div>
  );
}
