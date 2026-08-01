import { cn, initials } from '@/lib/utils';

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  className?: string;
}

export function Avatar({ name, src, className }: AvatarProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? 'avatar'} className={cn('rounded-full object-cover', className)} />;
  }
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full bg-coffee-100 font-semibold text-coffee-700 dark:bg-coffee-900 dark:text-coffee-300',
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
