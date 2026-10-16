import { UserRound } from 'lucide-react';
import { cn, initials } from '@/lib/utils';

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  className?: string;
  ring?: boolean;
  /** Always render the person-icon placeholder (no initials) when no photo. */
  iconPlaceholder?: boolean;
}

export function Avatar({ name, src, className, ring, iconPlaceholder }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? 'avatar'}
        className={cn(
          'rounded-full object-cover',
          ring && 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
          className
        )}
        loading="lazy"
        decoding="async"
      />
    );
  }

  const init = initials(name);

  return (
    <span
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-full font-semibold',
        'bg-gradient-to-br from-coffee-200 to-coffee-400 text-coffee-800 dark:from-coffee-800 dark:to-coffee-600 dark:text-coffee-200',
        ring && 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
        className
      )}
    >
      {/* Soft dot texture so the placeholder never reads as a flat blob */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1.5px)] bg-[length:14px_14px]"
      />
      {!iconPlaceholder && init ? (
        <span className="relative">{init}</span>
      ) : (
        <span className="relative flex items-center justify-center text-current/70">
          <UserRound className="h-[45%] w-[45%]" strokeWidth={1.75} aria-hidden />
        </span>
      )}
    </span>
  );
}
