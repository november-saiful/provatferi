import { cn, initials } from '@/lib/utils';

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  className?: string;
  ring?: boolean;
}

export function Avatar({ name, src, className, ring }: AvatarProps) {
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
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-coffee-200 to-coffee-400 font-semibold text-coffee-800 dark:from-coffee-800 dark:to-coffee-600 dark:text-coffee-200',
        ring && 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
