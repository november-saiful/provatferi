import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative inline-flex min-w-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-300 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-md hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg',
        destructive:
          'bg-warmred-500 text-white shadow-md hover:-translate-y-0.5 hover:bg-warmred-600 hover:shadow-lg',
        outline:
          'border-2 border-input bg-card shadow-sm hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/10 hover:text-accent-foreground hover:shadow-md',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/80 hover:shadow-md',
        ghost:
          'hover:bg-accent/10 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        glow: 'bg-gradient-to-r from-primary to-accent text-white shadow-glow hover:-translate-y-0.5 hover:shadow-glow-lg'
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
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
