'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Check,
  HelpCircle,
  LogOut,
  Moon,
  Phone,
  Sparkles,
  Sun,
  User,
  Monitor,
  ChevronRight,
  type LucideIcon
} from 'lucide-react';
import { GoogleButton } from '@/components/auth/google-button';
import { useAuthStore } from '@/lib/auth-store';
import { ROLE_NAMES } from '@/lib/permissions';
import { SITE_NAME } from '@/lib/constants';
import { initials, cn } from '@/lib/utils';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownAccountCard
} from '@/components/ui/dropdown-menu';

interface AvatarRingProps {
  name?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  active?: boolean;
  /** Render as button (clickable) or static span. */
  asButton?: boolean;
  className?: string;
  /**
   * 'visitor' renders a clean default-avatar look (neutral fill plus a
   * subtle silhouette) and skips the warm 4-color conic ring entirely so
   * the entire button reads as a default profile placeholder — used when
   * the user is not signed in and we don't want any brand mark on it.
   */
  variant?: 'authed' | 'visitor';
}

/** Account blob: warm Drive-style ring for signed-in users, neutral
 *  default-avatar placeholder for visitors. */
export function AccountBlob({
  name,
  src,
  size = 'md',
  onClick,
  active,
  asButton = true,
  variant = 'authed',
  className
}: AvatarRingProps) {
  const outer =
    size === 'sm'
      ? 'h-8 w-8 p-[2px]'
      : size === 'lg'
        ? 'h-12 w-12 p-[3px]'
        : 'h-9 w-9 p-[2.5px]';
  const inner =
    size === 'sm'
      ? 'h-[calc(100%-4px)] w-[calc(100%-4px)] text-[11px]'
      : size === 'lg'
        ? 'h-[calc(100%-6px)] w-[calc(100%-6px)] text-base'
        : 'h-[calc(100%-5px)] w-[calc(100%-5px)] text-[13px]';

  // For authed users: Drive uses blue→red→yellow→green; for our warm brand
  // we use coffee → gold → sage → warmred so each segment adds character.
  // For visitors: a clean neutral gradient fill PLUS a hairline border —
  // the WHOLE pill reads as the default profile placeholder, with a subtle
  // account glyph rendered inside for non-signed-in users.
  const ringClass =
    variant === 'visitor'
      ? 'bg-gradient-to-br from-coffee-100 via-cream-200 to-coffee-200 dark:from-coffee-900/40 dark:via-coffee-900/30 dark:to-coffee-800/40 border border-border dark:border-white/15'
      : 'bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-coffee-500 via-gold-400 via-sage-400 to-warmred-500';

  const handleClick = onClick;

  const innerNode = (
    <span
      className={cn(
        'flex items-center justify-center rounded-full font-bold overflow-hidden',
        variant === 'visitor' ? 'bg-transparent' : 'bg-card text-foreground',
        inner
      )}
    >
      {(() => {
        if (variant === 'visitor') {
          // Visitor = the whole grad + border pill IS the default-avatar
          // placeholder. A subtle account icon stands in for the missing
          // photo — no initials, no brand mark.
          return (
            <User
              className="h-[52%] w-[52%] text-coffee-600/75 dark:text-coffee-300/75"
              strokeWidth={2}
              aria-hidden
            />
          );
        }
        if (src) {
          // eslint-disable-next-line @next/next/no-img-element
          return <img src={src} alt={name ?? 'avatar'} className="h-full w-full object-cover" />;
        }
        const init = initials(name);
        if (init) return <span className="text-foreground/80">{init}</span>;
        // Authed but somehow no name yet — render a soft default-avatar
        // pill INSIDE the conic ring so the conic frame never appears
        // hollow. Same neutral gradient as the visitor variant, in a
        // small lozenge, no glyph.
        return (
          <span
            aria-hidden
            className="h-[58%] w-[58%] rounded-full bg-gradient-to-br from-coffee-100 via-cream-200 to-coffee-200 dark:from-coffee-800/50 dark:via-coffee-900/40 dark:to-coffee-800/50"
          />
        );
      })()}
    </span>
  );

  if (!asButton) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center shrink-0 rounded-full',
          outer,
          ringClass,
          active && 'shadow-[0_0_0_4px_hsl(var(--primary)/0.18)]'
        )}
      >
        {innerNode}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
       aria-label="অ্যাকাউন্ট মেনু"
       className={cn(
         'group relative inline-flex items-center justify-center shrink-0 rounded-full hover:scale-[1.04] active:scale-[0.96]',
         'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
         outer,
         ringClass,
         active && 'shadow-[0_0_0_4px_hsl(var(--primary)/0.18)]',
         className
       )}
     >
      {innerNode}
    </button>
  );
}

const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'লাইট', icon: Sun },
  { value: 'dark', label: 'ডার্ক', icon: Moon },
  { value: 'system', label: 'সিস্টেম', icon: Monitor }
];

interface AccountMenuProps {
  size?: 'sm' | 'md' | 'lg';
  /** Where "আমার ড্যাশবোর্ড" navigates. Defaults to `/dashboard`; visitors fall back to `/` from the shell. */
  dashboardHref?: string;
}

function ThemePicker({
  current,
  onSet
}: {
  current: 'light' | 'dark' | 'system';
  onSet: (theme: 'light' | 'dark' | 'system') => void;
}) {
  return (
    <div className="px-1 pb-1" role="group" aria-label="থিম নির্বাচন">
      {THEME_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSet(opt.value)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors duration-100 select-none',
              selected
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-muted focus-visible:bg-muted'
            )}
            role="menuitemradio"
            aria-checked={selected}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1 text-left">{opt.label}</span>
            {selected && <Check className="h-4 w-4 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

export function AccountMenu({ size = 'md', dashboardHref = '/dashboard' }: AccountMenuProps) {
  const router = useRouter();
  const { user, profile, role, signOut } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const currentTheme: 'light' | 'dark' | 'system' = mounted
    ? (theme as 'light' | 'dark' | 'system')
    : 'light';

  const handleSetTheme = (next: 'light' | 'dark' | 'system') => {
    setTheme(next);
  };

  return (
    <Dropdown align="end" side="bottom" sideOffset={10}>
      <DropdownTrigger asChild>
        <AccountBlob
          name={profile?.full_name ?? user?.email}
          src={profile?.avatar_url}
          size={size}
          variant={user ? 'authed' : 'visitor'}
        />
      </DropdownTrigger>
      <DropdownContent size="md" align="end" className="p-2">
        {user ? (
          <>
            <div className="px-1 pt-1 pb-2">
              <DropdownAccountCard
                name={profile?.full_name ?? 'প্রভাতফেরী সদস্য'}
                email={user.email}
                role={role ? ROLE_NAMES[role] : undefined}
                avatar={
                  <AccountBlob
                    name={profile?.full_name ?? user.email}
                    src={profile?.avatar_url}
                    size="lg"
                    asButton={false}
                    variant="authed"
                  />
                }
              />
            </div>

            <DropdownLabel>সাইন ইন করা আছে</DropdownLabel>

            <DropdownItem icon={<User className="h-4 w-4" />} href="/dashboard/profile">
              আমার প্রোফাইল
            </DropdownItem>
            <DropdownItem
              icon={<LayoutDashboard className="h-4 w-4" />}
              href={dashboardHref}
            >
              আমার ড্যাশবোর্ড
            </DropdownItem>
            <DropdownItem icon={<HelpCircle className="h-4 w-4" />} href="/contact">
              সহায়তা ও যোগাযোগ
            </DropdownItem>

            <DropdownSeparator />

            <DropdownLabel>থিম</DropdownLabel>
            <ThemePicker current={currentTheme} onSet={handleSetTheme} />

            <DropdownSeparator />

            <DropdownItem
              icon={<Phone className="h-4 w-4" />}
              href="/contact"
            >
              যোগাযোগ
            </DropdownItem>
            <DropdownItem
              icon={<Sparkles className="h-4 w-4 text-gold-500" />}
              href="https://recruitment.provatferi2009.workers.dev/"
              trailing={<ChevronRight className="h-3.5 w-3.5" />}
            >
              নতুন নিয়োগ দেখুন
            </DropdownItem>

            <DropdownSeparator />

            <DropdownItem
              icon={<LogOut className="h-4 w-4" />}
              destructive
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
            >
              সাইন আউট
            </DropdownItem>

            <div className="px-3 pt-2">
              <p className="text-[10.5px] leading-relaxed text-muted-foreground">
                <a className="hover:underline" href="/contact">
                  গোপনীয়তা নীতি
                </a>{' '}
                · <a className="hover:underline" href="/contact">সেবার শর্তাবলী</a>
              </p>
              <p className="mt-1 text-[10.5px] text-muted-foreground/70">
                {SITE_NAME} · v2
              </p>
            </div>
          </>
        ) : (
          <>
            <DropdownLabel>স্বাগতম</DropdownLabel>
            <div className="px-1 pb-2">
              <GoogleButton label="Google দিয়ে সাইন ইন" />
            </div>
            <DropdownSeparator />
            <DropdownLabel>থিম</DropdownLabel>
            <ThemePicker current={currentTheme} onSet={handleSetTheme} />
          </>
        )}
      </DropdownContent>
    </Dropdown>
  );
}
