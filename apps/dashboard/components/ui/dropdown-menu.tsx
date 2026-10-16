'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DropdownContextValue {
  open: boolean;
  setOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  toggle: () => void;
  rootRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error('Dropdown sub-components must be used inside <Dropdown />');
  return ctx;
}

interface DropdownProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'bottom' | 'top';
  sideOffset?: number;
}

export function Dropdown({
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  align = 'end',
  side = 'bottom',
  sideOffset = 8
}: DropdownProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const onChangeRef = React.useRef(onOpenChange);
  React.useEffect(() => {
    onChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const setOpen = React.useCallback<DropdownContextValue['setOpen']>(
    (next) => {
      const value = typeof next === 'function' ? next(open) : next;
      if (openProp === undefined) setInternalOpen(value);
      onChangeRef.current?.(value);
    },
    [open, openProp]
  );

  const toggle = React.useCallback(() => setOpen((p) => !p), [setOpen]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, toggle, rootRef, contentRef }}>
      <DropdownLayout rootRef={rootRef} contentRef={contentRef}>{children}</DropdownLayout>
    </DropdownContext.Provider>
  );
}

function DropdownLayout({
  children,
  rootRef,
  contentRef,
}: {
  children: React.ReactNode;
  rootRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
}) {
  const { open, setOpen } = useDropdownContext();

  React.useEffect(() => {
    if (!open) return;
    // pointerdown (not mousedown) to avoid closing during text-selection drags.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const insideTrigger = rootRef.current?.contains(target);
      const insideContent = contentRef.current?.contains(target);
      if (!insideTrigger && !insideContent) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      {children}
    </div>
  );
}

interface DropdownTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
  className?: string;
}

export function DropdownTrigger({ children, asChild, className }: DropdownTriggerProps) {
  const { open, toggle } = useDropdownContext();

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  const onClickAny = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle();
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      onClick?: (e: React.MouseEvent) => void;
      onKeyDown?: (e: React.KeyboardEvent) => void;
      className?: string;
      tabIndex?: number;
      'aria-expanded'?: boolean;
      'aria-haspopup'?: 'menu' | 'dialog' | 'listbox' | 'true' | 'false';
    }>;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        if (!e.defaultPrevented) {
          child.props.onClick?.(e);
          if (!e.defaultPrevented) onClickAny(e);
        }
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        child.props.onKeyDown?.(e);
        if (!e.defaultPrevented) onKeyDown(e);
      },
      'aria-expanded': open,
      'aria-haspopup': 'menu',
      tabIndex: child.props.tabIndex ?? 0,
      className: cn(child.props.className, className)
    });
  }

  return (
    <span
      onClick={onClickAny}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-expanded={open}
      aria-haspopup="menu"
      className={cn(
        'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full',
        className
      )}
    >
      {children}
    </span>
  );
}

interface DropdownContentProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'auto';
  align?: 'start' | 'center' | 'end';
  side?: 'bottom' | 'top';
  sideOffset?: number;
  forceMount?: boolean;
  /** Render outside overflow-hidden ancestors so menus cannot be clipped. */
  portal?: boolean;
  /** Enable staggered entrance animations for child items. */
  staggered?: boolean;
}

const sizeMap: Record<NonNullable<DropdownContentProps['size']>, string> = {
  sm: 'w-56',
  md: 'w-72',
  lg: 'w-80',
  auto: 'min-w-[14rem]'
};

const sideClassMap = {
  bottom: 'top-full',
  top: 'bottom-full'
} as const;

const alignClassMap = {
  start: 'left-0 origin-top-left',
  center: 'left-1/2 -translate-x-1/2 origin-top',
  end: 'right-0 origin-top-right'
} as const;

/* ── Stagger variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.025, delayChildren: 0.04 }
  },
  exit: { opacity: 0, transition: { staggerChildren: 0.015, staggerDirection: -1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } }
};

export function DropdownContent({
  children,
  className,
  size = 'md',
  align = 'end',
  side = 'bottom',
  sideOffset = 10,
  forceMount,
  portal = false,
  staggered = false
}: DropdownContentProps) {
  const { open, rootRef, contentRef } = useDropdownContext();
  const visible = forceMount || open;
  const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null);

  const alignClass = alignClassMap[align];
  const sideClass = sideClassMap[side];
  // Portal positioning already accounts for the trigger edge. Applying a second
  // `translateX(-100%)` to end-aligned menus was shifting them completely off
  // screen on phones. Only centered menus need a horizontal transform.
  const alignmentX = align === 'center' ? '-50%' : 0;

  React.useLayoutEffect(() => {
    if (!portal || !visible) return;
    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) setTriggerRect(rect);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [portal, visible, rootRef]);

  const portalStyle: React.CSSProperties | undefined = portal && triggerRect
    ? (() => {
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
        const menuMaxWidth = Math.min(352, viewportWidth - 32); // 22rem = 352px, minus padding
        
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
        const edge = 8;
        // Prefer the requested side, but flip when the trigger is close to the
        // viewport edge. This matters most for bottom-right mobile controls.
        const flip = side === 'bottom'
          ? triggerRect.bottom > viewportHeight * 0.68
          : triggerRect.top < viewportHeight * 0.32;
        const effectiveSide = flip ? (side === 'bottom' ? 'top' : 'bottom') : side;
        const vertical = effectiveSide === 'bottom'
          ? { top: triggerRect.bottom + sideOffset }
          : { bottom: viewportHeight - triggerRect.top + sideOffset };

        // Use the viewport edge for end alignment instead of guessing the
        // rendered menu width. This keeps custom widths (notifications, action
        // menus, etc.) aligned and clamped on narrow screens.
        if (align === 'end') {
          return {
            position: 'fixed' as const,
            ...vertical,
            right: Math.max(edge, viewportWidth - triggerRect.right),
          };
        }

        if (align === 'center') {
          const center = triggerRect.left + triggerRect.width / 2;
          const halfMenu = menuMaxWidth / 2;
          return {
            position: 'fixed' as const,
            ...vertical,
            left: Math.max(halfMenu + edge, Math.min(center, viewportWidth - halfMenu - edge)),
          };
        }

        return {
          position: 'fixed' as const,
          ...vertical,
          left: Math.max(edge, Math.min(triggerRect.left, viewportWidth - menuMaxWidth - edge)),
        };
      })()
    : undefined;
  const offsetStyle: React.CSSProperties =
    portal ? portalStyle ?? { visibility: 'hidden' } : side === 'bottom' ? { marginTop: sideOffset } : { marginBottom: sideOffset };

  const menu = (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={contentRef}
          role="menu"
          aria-orientation="vertical"
          variants={staggered ? containerVariants : undefined}
          initial={staggered ? 'hidden' : { opacity: 0, y: side === 'top' ? 6 : -6, scale: 0.97, x: portal ? alignmentX : 0 }}
          animate={staggered ? 'show' : { opacity: 1, y: 0, scale: 1, x: portal ? alignmentX : 0 }}
          exit={staggered ? 'exit' : { opacity: 0, y: side === 'top' ? 6 : -6, scale: 0.97, x: portal ? alignmentX : 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          onPointerDown={(e) => e.stopPropagation()}
          style={offsetStyle}
          className={cn(
            'site-card-surface z-50 overflow-hidden rounded-xl border border-border text-popover-foreground shadow-xl',
            'backdrop-blur-none',
            'max-w-[calc(100vw-1rem)] min-w-0',
            'p-1.5',
            sizeMap[size],
            // Non-portal menus are anchored to the header, so cap them to the
            // viewport and let them scroll internally — otherwise a tall menu
            // (e.g. account) is unreachable below the fold on mobile.
            portal ? 'fixed max-h-[calc(100dvh-1rem)] overflow-y-auto' : 'absolute max-h-[calc(100dvh-5rem)] overflow-y-auto',
            !portal && sideClass,
            !portal && alignClass,
            className
          )}
        >
          {open ? children : null}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return portal && typeof document !== 'undefined' ? createPortal(menu, document.body) : menu;
}

interface DropdownItemProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'onClick'
  > {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  destructive?: boolean;
  selected?: boolean;
  keepOpenOnClick?: boolean;
  href?: string;
  /** Accepts clicks from both `<button>` (default) and `<a>` (when `href` is set). */
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  /** When true, wraps the item in a motion.div with stagger variants. */
  staggered?: boolean;
}

export function DropdownItem({
  children,
  icon,
  trailing,
  destructive,
  selected,
  keepOpenOnClick,
  className,
  href,
  onClick,
  type,
  staggered = false,
  ...rest
}: DropdownItemProps) {
  const { setOpen } = useDropdownContext();
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    onClick?.(e);
    if (!keepOpenOnClick) {
      setTimeout(() => setOpen(false), 0);
    }
  };

  const baseInteractive =
    'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors duration-100 select-none cursor-pointer';
  const stateClass = destructive
    ? 'text-warmred-600 hover:bg-warmred-50 dark:hover:bg-warmred-900/20'
    : selected
      ? 'bg-primary/10 text-primary'
      : 'text-foreground hover:bg-muted focus-visible:bg-muted';

  const inner = (
    <>
      {icon && (
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center',
            destructive ? 'text-warmred-500' : selected ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-left">{children}</span>
      {trailing && <span className="ml-auto shrink-0 text-muted-foreground">{trailing}</span>}
    </>
  );

  const itemNode = href ? (
    <a
      href={href}
      role="menuitem"
      onClick={handleClick as React.MouseEventHandler<HTMLAnchorElement>}
      className={cn(baseInteractive, stateClass, className)}
    >
      {inner}
    </a>
  ) : (
    <button
      type={type ?? 'button'}
      role="menuitem"
      onClick={handleClick as React.MouseEventHandler<HTMLButtonElement>}
      className={cn(baseInteractive, stateClass, className)}
      {...rest}
    >
      {inner}
    </button>
  );

  if (staggered) {
    return (
      <motion.div variants={itemVariants} className="w-full">
        {itemNode}
      </motion.div>
    );
  }

  return itemNode;
}

interface DropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownLabel({ children, className, staggered }: DropdownLabelProps & { staggered?: boolean }) {
  const node = (
    <div
      className={cn(
        'px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  );
  if (staggered) {
    return <motion.div variants={itemVariants}>{node}</motion.div>;
  }
  return node;
}

export function DropdownSeparator({ className, staggered }: { className?: string; staggered?: boolean }) {
  const node = <div role="separator" className={cn('my-1.5 h-px w-full bg-border', className)} />;
  if (staggered) {
    return <motion.div variants={itemVariants}>{node}</motion.div>;
  }
  return node;
}

interface DropdownAccountCardProps {
  name: string;
  email?: string;
  avatar?: React.ReactNode;
  role?: React.ReactNode;
}

export function DropdownAccountCard({ name, email, avatar, role }: DropdownAccountCardProps) {
  return (
    <div className="site-card-surface flex items-center gap-3 rounded-xl p-3">
      <div className="shrink-0">{avatar}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
        {role && <p className="mt-0.5 text-[11px] font-medium text-primary">{role}</p>}
      </div>
    </div>
  );
}
