'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { CalendarPlus, Download, ExternalLink } from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  downloadCalendarEvent,
  googleCalendarUrl,
  type CalendarEventData,
} from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';

type CalendarSize = 'sm' | 'xs' | 'icon';

interface AddToCalendarProps {
  data: CalendarEventData;
  variant?: 'primary' | 'ghost' | 'outline';
  /** Default 'sm'. 'xs' = compact pill. 'icon' = icon-only (no label). */
  size?: CalendarSize;
  className?: string;
}

/**
 * Floating tooltip for icon-only buttons.
 *
 * Rendered into document.body so it can never be clipped by parent
 * overflow-hidden cards, and works even when the button sits inside a
 * `<Link>` wrapper (invalid HTML that browsers sometimes mangle).
 */
function FloatingTooltip({
  targetRef,
  label,
}: {
  targetRef: React.RefObject<HTMLElement | null>;
  label: string;
}) {
  const [pos, setPos] = React.useState<{ top: number; left: number; above: boolean } | null>(null);
  const [visible, setVisible] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const raf = React.useRef(0);

  const update = React.useCallback(() => {
    const el = targetRef.current;
    if (!el) {
      setPos(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const above = rect.bottom + 38 > window.innerHeight && rect.top > 44;
    setPos({
      top: above ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(window.innerWidth - 8, rect.left + rect.width / 2)),
      above,
    });
  }, [targetRef]);

  React.useEffect(() => {
    update();
    // Fade in after the first paint so the transition works.
    const t = requestAnimationFrame(() => setVisible(true));

    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(update);
    };
    const onResize = () => update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(t);
      cancelAnimationFrame(raf.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [update]);

  // Correct horizontal placement after the tooltip's actual width is known.
  // This prevents the Bengali label from being cropped at viewport edges.
  React.useEffect(() => {
    if (!pos) return;
    const frame = requestAnimationFrame(() => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      const halfWidth = tooltip.getBoundingClientRect().width / 2;
      const left = Math.max(halfWidth + 8, Math.min(window.innerWidth - halfWidth - 8, pos.left));
      if (left !== pos.left) setPos((current) => current ? { ...current, left } : current);
    });
    return () => cancelAnimationFrame(frame);
  }, [pos]);

  if (!pos) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      className={cn(
        'pointer-events-none fixed z-[100] -translate-x-1/2 whitespace-nowrap rounded-lg',
        'bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg',
        'transition-all duration-150',
        visible
          ? pos.above ? 'opacity-100 -translate-y-full' : 'opacity-100 translate-y-0'
          : pos.above ? 'opacity-0 -translate-y-[calc(100%_-_4px)]' : 'opacity-0 translate-y-1',
      )}
      style={{ top: pos.top, left: pos.left }}
    >
      {label}
    </div>,
    document.body,
  );
}

/**
 * Dropdown button that offers
 *   1. Download .ics file (opens in Apple Calendar, Outlook, etc.)
 *   2. Google Calendar link (opens in new tab with pre-filled fields)
 *
 * Three sizes:
 *   - `sm`  (default): full button with label
 *   - `xs`:  compact pill suitable for cards and dense lists
 *   - `icon`: icon-only, suitable for the tightest card footers
 */
export function AddToCalendar({
  data,
  variant = 'primary',
  size = 'sm',
  className,
}: AddToCalendarProps) {
  const handleDownloadIcs = () => downloadCalendarEvent(data);

  const handleGoogleCalendar = () => {
    window.open(googleCalendarUrl(data), '_blank', 'noopener,noreferrer');
  };

  // ── Tooltip state (icon variant only) ──
  const iconRef = React.useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const tooltipTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending timer on unmount.
  React.useEffect(() => {
    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    };
  }, []);

  const onPointerEnter = React.useCallback(() => {
    tooltipTimer.current = setTimeout(() => setShowTooltip(true), 500);
  }, []);
  const onPointerLeave = React.useCallback(() => {
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }
    setShowTooltip(false);
  }, []);

  // Classes per size
  const sizeClasses: Record<CalendarSize, string> = {
    sm: 'gap-2',
    xs: 'gap-1.5 h-8 px-2.5 text-[11px]',
    icon: 'gap-0 h-8 w-8 p-0',
  };

  const btnClasses = cn(
    sizeClasses[size],
    variant === 'primary' && size === 'sm' && 'w-full',
    variant === 'outline' && size === 'sm' && 'w-full',
    className,
  );

  // For icon-only, render a plain icon button (no Button wrapper)
  if (size === 'icon') {
    return (
      <Dropdown>
        <DropdownTrigger asChild>
          <button
            ref={iconRef}
            type="button"
            aria-label="ক্যালেন্ডারে যোগ করুন"
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onPointerDown={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setShowTooltip(false);
            }}
            onClick={() => setShowTooltip(false)}
            className={cn(
              'inline-flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              btnClasses,
            )}
          >
            <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </DropdownTrigger>

        {showTooltip && (
          <FloatingTooltip targetRef={iconRef} label="ক্যালেন্ডারে যোগ করুন" />
        )}

        <DropdownContent size="auto" align="end" sideOffset={4} portal>
          <DropdownItem icon={<Download className="h-4 w-4" />} onClick={handleDownloadIcs}>
            <div>
              <span className="block">.ics ফাইল ডাউনলোড</span>
              <span className="block text-[10px] text-muted-foreground">Apple Calendar · Outlook</span>
            </div>
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={<ExternalLink className="h-4 w-4" />} onClick={handleGoogleCalendar}>
            <div>
              <span className="block">Google Calendar</span>
              <span className="block text-[10px] text-muted-foreground">নতুন ট্যাবে খুলবে</span>
            </div>
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
    );
  }

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          variant={variant === 'outline' ? 'outline' : variant === 'ghost' ? 'ghost' : 'default'}
          size={size === 'xs' ? 'sm' : 'sm'}
          className={btnClasses}
        >
          <CalendarPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">ক্যালেন্ডারে যোগ করুন</span>
        </Button>
      </DropdownTrigger>

      <DropdownContent size="auto" align="end" sideOffset={6} portal>
        <DropdownItem icon={<Download className="h-4 w-4" />} onClick={handleDownloadIcs}>
          <div>
            <span className="block">.ics ফাইল ডাউনলোড</span>
            <span className="block text-[10px] text-muted-foreground">Apple Calendar · Outlook</span>
          </div>
        </DropdownItem>

        <DropdownSeparator />

        <DropdownItem icon={<ExternalLink className="h-4 w-4" />} onClick={handleGoogleCalendar}>
          <div>
            <span className="block">Google Calendar</span>
            <span className="block text-[10px] text-muted-foreground">নতুন ট্যাবে খুলবে</span>
          </div>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
