'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // CSS transitions cover color/shadow only — framer-motion owns `transform`
  // (y-lift + press scale), so the spring never fights a CSS transition.
  'relative inline-flex min-w-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-[color,background-color,border-color,box-shadow] duration-300 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg',
        destructive:
          'bg-warmred-500 text-white shadow-md hover:bg-warmred-600 hover:shadow-lg',
        outline:
          'border-2 border-input bg-card shadow-sm hover:border-primary/50 hover:bg-accent/10 hover:text-accent-foreground hover:shadow-md',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md',
        ghost:
          'hover:bg-accent/10 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        glow: 'bg-gradient-to-r from-primary to-accent text-white shadow-glow hover:shadow-glow-lg'
      },
      size: {
        default: 'h-9 sm:h-10 px-4 sm:px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 sm:h-12 rounded-xl px-6 sm:px-7 text-sm sm:text-base',
        icon: 'h-9 w-9 sm:h-10 sm:w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      // These DOM events are redefined by framer-motion with incompatible
      // signatures (animation/drag handlers receive motion values).
      'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragExit' | 'onDragEnter' | 'onDragOver' | 'onDragLeave' | 'onDrop'
    >,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => {
    const reduce = useReducedMotion();
    // Text links shouldn't lift or scale; ghost buttons keep a light press
    // but no hover jump so dense tables stay calm.
    const lifts = variant !== 'link' && variant !== 'ghost';

    return (
      <motion.button
        type={type}
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        whileHover={reduce || !lifts ? undefined : { y: -2 }}
        whileTap={reduce || variant === 'link' ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24, mass: 0.6 }}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
