'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Images,
  Calendar as CalendarIcon,
  Bell,
  HandCoins,
  Handshake,
  Receipt,
  Wallet,
  History,
  Music4,
  BarChart3,
  ExternalLink,
  UserCog,
  Phone,
  UserPlus,
  type LucideIcon
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { canRead, canWrite, ROLE_NAMES } from '@/lib/permissions';
import type { ModuleId, RoleId } from '@/lib/types';
import { RECRUITMENT_URL, SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/layout/page-transition';
import { AccountMenu } from '@/components/layout/account-menu';
import { NotificationsMenu } from '@/components/layout/notifications-menu';

import { StorageIndicator } from '@/components/layout/storage-indicator';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator
} from '@/components/ui/dropdown-menu';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  module?: ModuleId;
  hint?: string;
}

interface NavGroup {
  id: 'quick' | 'workspace' | 'finance' | 'community' | 'admin' | 'browse';
  label: string;
  items: NavItem[];
}

const DASHBOARD_NAV: NavGroup[] = [
  {
    id: 'quick',
    label: 'দ্রুত প্রবেশ',
    items: [
      { href: '/dashboard', label: 'আমার হোম', icon: LayoutDashboard, hint: 'সারসংক্ষেপ' }
    ]
  },
  {
    id: 'workspace',
    label: 'ওয়ার্কস্পেস',
    items: [
      { href: '/dashboard/evf', label: 'ইভেন্ট', icon: CalendarDays, module: 'evf' },
      { href: '/dashboard/glr', label: 'গ্যালারি', icon: Images, module: 'glr' },
      { href: '/dashboard/cln', label: 'ক্যালেন্ডার', icon: CalendarIcon, module: 'cln' },
      { href: '/dashboard/ntb', label: 'নোটিশ', icon: Bell, module: 'ntb' }
    ]
  },
  {
    id: 'finance',
    label: 'অর্থ ও সম্পাস',
    items: [
      { href: '/dashboard/dnt', label: 'অনুদান', icon: HandCoins, module: 'dnt' },
      { href: '/dashboard/spn', label: 'স্পনসর', icon: Handshake, module: 'spn' },
      { href: '/dashboard/xpm', label: 'ব্যয়', icon: Receipt, module: 'xpm' },
      { href: '/dashboard/bgm', label: 'বাজেট', icon: Wallet, module: 'bgm' },
      { href: '/dashboard/rcd', label: 'রেকর্ড', icon: History, module: 'rcd' }
    ]
  },
  {
    id: 'community',
    label: 'কমিউনিটি',
    items: [
      { href: '/dashboard/cia', label: 'হাজিরা', icon: Music4, module: 'cia' },
      { href: '/dashboard/coi', label: 'বিশ্লেষণ', icon: BarChart3, module: 'coi' }
    ]
  },
  {
    id: 'admin',
    label: 'অ্যাডমিন',
    items: [
      { href: '/dashboard/admin', label: 'কন্ট্রোল প্যানেল', icon: UserCog, module: 'admin' },
      { href: '/dashboard/admin/roles', label: 'রোল সুপারভাইজ', icon: UserCog, module: 'admin' }
    ]
  }
];

const PUBLIC_NAV: NavGroup[] = [
  {
    id: 'browse',
    label: 'ব্রাউজ',
    items: [
      { href: '/', label: 'হোম', icon: LayoutDashboard },
      { href: '/events', label: 'ইভেন্ট', icon: CalendarDays },
      { href: '/gallery', label: 'গ্যালারি', icon: Images },
      { href: '/calendar', label: 'ক্যালেন্ডার', icon: CalendarIcon },
      { href: '/notices', label: 'নোটিশ', icon: Bell },
      { href: '/donate', label: 'অনুদান', icon: HandCoins },
      { href: '/sponsor', label: 'স্পনসর', icon: Handshake },
      { href: '/courses', label: 'কোর্স', icon: Music4 },
      { href: '/insights', label: 'বিশ্লেষণ', icon: BarChart3 },
      { href: '/contact', label: 'যোগাযোগ', icon: Phone }
    ]
  }
];

/**
 * Returns the appropriate navigation groups based on auth state.
 * When logged in: shows dashboard navigation (filtered by permissions).
 * When logged out: shows public navigation.
 */
function useNavGroups(): NavGroup[] {
  const authed = !!useAuthStore().user;
  return authed ? DASHBOARD_NAV : PUBLIC_NAV;
}

function isItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/' || href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

/* ──────────────── Nav Menu (dropdown) ──────────────── */

interface NavMenuProps {
  groups: NavGroup[];
  role: RoleId | null;
  authed: boolean;
  pathname: string | null;
}

function NavMenu({ groups, role, authed, pathname }: NavMenuProps) {
  const [open, setOpen] = React.useState(false);

  const filteredGroups = React.useMemo<NavGroup[]>(() => {
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          if (!item.module) return true;
          return canRead(role, item.module) || canWrite(role, item.module);
        })
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, role]);

  return (
    <Dropdown open={open} onOpenChange={setOpen}>
      <DropdownTrigger asChild>
        <button
          type="button"
          aria-label="নেভিগেশন মেনু"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
        >
          {/* Custom 3-line menu icon (SVG Repo) — rotates 90° when menu is open */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              open && 'rotate-90'
            )}
          >
            <path d="M4 6H20M7 12H17M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </DropdownTrigger>
      <DropdownContent
        size="auto"
        align="start"
        side="bottom"
        sideOffset={8}
        staggered
        className="max-h-[calc(100vh-5rem)] w-72 overflow-y-auto"
      >
        {filteredGroups.map((group, gIdx) => (
          <React.Fragment key={group.id}>
            {gIdx > 0 && <DropdownSeparator staggered />}
            {group.label && <DropdownLabel staggered>{group.label}</DropdownLabel>}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(pathname, item.href);
              return (
                <DropdownItem
                  key={item.href}
                  staggered
                  href={item.href}
                  icon={<Icon className="h-4 w-4" />}
                  selected={active}
                >
                  {item.label}
                </DropdownItem>
              );
            })}
          </React.Fragment>
        ))}

        {/* External link: Recruitment */}
        <DropdownSeparator staggered />
        <DropdownItem
          staggered
          href={RECRUITMENT_URL}
          icon={<UserPlus className="h-4 w-4 text-gold-500" />}
        >
          <span className="flex items-center gap-1.5">
            রিক্রুটমেন্ট
            <ExternalLink className="h-3 w-3 opacity-60" />
          </span>
        </DropdownItem>

        {/* Storage indicator */}
        {authed && (
          <>
            <DropdownSeparator staggered />
            <div className="px-1 pb-1">
              <StorageIndicator collapsed={false} />
            </div>
          </>
        )}


      </DropdownContent>
    </Dropdown>
  );
}

/* ──────────────── Header ──────────────── */

interface HeaderProps {
  groups: NavGroup[];
  role: RoleId | null;
  authed: boolean;
  pathname: string | null;
}

function Header({ groups, role, authed, pathname }: HeaderProps) {
  const { profile, role: userRole, user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background px-3 md:gap-3 md:px-4">
      {/* Nav menu (hamburger dropdown — works on all screen sizes) */}
      <NavMenu groups={groups} role={role} authed={authed} pathname={pathname} />

      {/* Spacer keeps right actions pushed to the edge */}
      <div className="flex-1" aria-hidden />

      {/* Center logo (clickable — goes to homepage) — absolutely centered so
          it stays dead-centre regardless of left/right content widths */}
      <Link
        href="/"
        aria-label={SITE_NAME}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="প্রভাতফেরী" className="h-14 w-14 p-1 object-contain" />
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-1 md:gap-1.5">
        {authed && profile && (
          <div className="hidden flex-col items-end leading-tight xl:flex">
            <p className="text-xs font-semibold text-foreground">{profile.full_name ?? user?.email}</p>
            <p className="text-[10px] text-muted-foreground">
              {userRole ? ROLE_NAMES[userRole] : ''}
            </p>
          </div>
        )}
        {authed && <NotificationsMenu />}
        <AccountMenu size="md" dashboardHref={authed ? '/dashboard' : '/'} />
      </div>
    </header>
  );
}

/* ──────────────── App Shell ──────────────── */

interface AppShellProps {
  footerLabel: string;
  mainClassName?: string;
  children: React.ReactNode;
}

function AppShell({ footerLabel, mainClassName, children }: AppShellProps) {
  const pathname = usePathname();
  const { role } = useAuthStore();
  const authed = !!useAuthStore().user;
  const groups = useNavGroups();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header groups={groups} role={role} authed={authed} pathname={pathname} />
      <main className={cn('flex-1', mainClassName ?? 'p-4 md:p-6 lg:p-8')}>
        <PageTransition>{children}</PageTransition>
      </main>
      <footer className="border-t border-border bg-muted/20 px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">{footerLabel}</p>
      </footer>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell footerLabel={`${SITE_NAME} ড্যাশবোর্ড · কমিটির জন্য নির্মিত`}>
      {children}
    </AppShell>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell footerLabel={`${SITE_NAME} · সংগীত, সংস্কৃতি ও কমিউনিটি`}>
      {children}
    </AppShell>
  );
}
