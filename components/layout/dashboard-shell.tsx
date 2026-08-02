'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  Images,
  Calendar,
  Bell,
  HandCoins,
  Handshake,
  Receipt,
  Wallet,
  History,
  Music4,
  BarChart3,
  ExternalLink,
  LogIn,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  type LucideIcon
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { canRead, canWrite, ROLE_NAMES } from '@/lib/permissions';
import type { ModuleId } from '@/lib/types';
import { RECRUITMENT_URL, SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { SPRING, EASE } from '@/components/ui/motion';
import { PageTransition } from '@/components/layout/page-transition';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  module?: ModuleId;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'হোম', icon: LayoutDashboard, module: 'evf' },
  { href: '/dashboard/evf', label: 'ইভেন্ট', icon: CalendarDays, module: 'evf' },
  { href: '/dashboard/glr', label: 'গ্যালারি', icon: Images, module: 'glr' },
  { href: '/dashboard/cln', label: 'ক্যালেন্ডার', icon: Calendar, module: 'cln' },
  { href: '/dashboard/ntb', label: 'নোটিশ', icon: Bell, module: 'ntb' },
  { href: '/dashboard/dnt', label: 'অনুদান', icon: HandCoins, module: 'dnt' },
  { href: '/dashboard/spn', label: 'স্পনসর', icon: Handshake, module: 'spn' },
  { href: '/dashboard/xpm', label: 'ব্যয়', icon: Receipt, module: 'xpm' },
  { href: '/dashboard/bgm', label: 'বাজেট', icon: Wallet, module: 'bgm' },
  { href: '/dashboard/rcd', label: 'রেকর্ড', icon: History, module: 'rcd' },
  { href: '/dashboard/cia', label: 'উপস্থিতি', icon: Music4, module: 'cia' },
  { href: '/dashboard/coi', label: 'বিশ্লেষণ', icon: BarChart3, module: 'coi' },
  { href: '/dashboard/admin', label: 'অ্যাডমিন প্যানেল', icon: UserCog, module: 'admin' }
];

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'হোম', icon: LayoutDashboard },
  { href: '/events', label: 'ইভেন্ট', icon: CalendarDays },
  { href: '/gallery', label: 'গ্যালারি', icon: Images },
  { href: '/calendar', label: 'ক্যালেন্ডার', icon: Calendar },
  { href: '/notices', label: 'নোটিশ', icon: Bell },
  { href: '/donate', label: 'অনুদান', icon: HandCoins },
  { href: '/sponsor', label: 'স্পনসর', icon: Handshake },
  { href: '/courses', label: 'কোর্স', icon: Music4 },
  { href: '/insights', label: 'বিশ্লেষণ', icon: BarChart3 },
  { href: '/contact', label: 'যোগাযোগ', icon: Phone }
];

const SIDEBAR_PREF_KEY = 'provatferi:sidebar-collapsed';

/** Persisted preference for the desktop sidebar being collapsed to an icon rail. */
function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  // Read the persisted preference after mount (never during render) so SSR
  // and hydration always agree — no layout shift or hydration warnings.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_PREF_KEY);
      if (stored) setCollapsed(stored === '1');
    } catch {
      // storage may be unavailable (private mode) — fall back to expanded
    }
    setHydrated(true);
  }, []);

  // Persist only once the stored value has been applied, and only on change.
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(SIDEBAR_PREF_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore persistence failures
    }
  }, [collapsed, hydrated]);

  const toggle = React.useCallback(() => setCollapsed((c) => !c), []);
  return { collapsed, toggle };
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="h-9 w-9" />;
  }
  const isDark = theme === 'dark';
  return (
    <motion.button
      aria-label="থিম পরিবর্তন করুন"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.18 }}
          className="flex"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

function SidebarContent({
  items,
  onNavigate,
  groupId = 'nav',
  collapsed = false
}: {
  items: NavItem[];
  onNavigate?: () => void;
  groupId?: string;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const { user, profile, role, signOut } = useAuthStore();

  const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.25, delay: i * 0.03, ease: EASE }
    })
  };

  return (
    <motion.div
      className="flex h-full flex-col"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } } }}
    >
      <motion.div
        className={cn('flex items-center gap-2 px-5 py-4', collapsed && 'justify-center px-2')}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        title="Provatferi"
      >
        <motion.img
          src="/logo.png"
          alt="Provatferi"
          className={cn(
            'object-contain transition-all duration-300 ease-smooth',
            collapsed ? 'h-9 w-9 rounded-lg' : 'h-10 w-auto'
          )}
          whileHover={{ scale: 1.05, rotate: [0, -1, 1, 0] }}
          whileTap={{ scale: 0.95 }}
        />
      </motion.div>

      <motion.nav
        className={cn(
          'flex-1 space-y-0.5 overflow-y-auto py-2',
          collapsed ? 'px-2' : 'px-3'
        )}
      >
        {items.map((item, index) => {
          const active =
            item.href === '/' || item.href === '/dashboard'
              ? pathname === item.href
              : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <motion.a
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'text-primary-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              custom={index}
              whileHover={active ? {} : { x: collapsed ? 0 : 3 }}
              whileTap={{ scale: 0.98 }}
            >
              {active && (
                <motion.span
                  layoutId={`nav-active-${groupId}`}
                  className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                  transition={SPRING}
                />
              )}
              <motion.span
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                className="relative z-10"
              >
                <Icon className="h-4 w-4" />
              </motion.span>
              {!collapsed && <span className="relative z-10">{item.label}</span>}
            </motion.a>
          );
        })}

        <motion.a
          href={RECRUITMENT_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="নিয়োগ"
          title={collapsed ? 'নিয়োগ' : undefined}
          className={cn(
            'mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}
          initial="hidden"
          animate="visible"
          variants={itemVariants}
          custom={items.length}
          whileHover={{ x: collapsed ? 0 : 3 }}
          whileTap={{ scale: 0.98 }}
        >
          <ExternalLink className="h-4 w-4" />
          {!collapsed && <span className="relative z-10">নিয়োগ</span>}
        </motion.a>
      </motion.nav>

      <motion.div
        className={cn('border-t border-border', collapsed ? 'p-3' : 'p-4')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
      >
        {user ? (
          <motion.div
            className={cn('flex items-center gap-3', collapsed && 'flex-col gap-3')}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.a href="/dashboard" title="ড্যাশবোর্ড" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Avatar name={profile?.full_name} src={profile?.avatar_url} className="h-9 w-9 ring-2 ring-primary/20" />
            </motion.a>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile?.full_name ?? user.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {role ? ROLE_NAMES[role as keyof typeof ROLE_NAMES] : 'অজানা'} · {profile?.display_id ?? ''}
                </p>
              </div>
            )}
            <motion.button
            aria-label="সাইন আউট"
            title="সাইন আউট"
              onClick={signOut}
              className="p-2 rounded-lg transition-colors hover:bg-accent"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </motion.div>
        ) : collapsed ? (
          <motion.a
            href="/login"
            aria-label="সাইন ইন"
            title="সাইন ইন"
            className="flex h-10 w-full items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn className="h-4 w-4" />
          </motion.a>
        ) : (
          <motion.a
            href="/login"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn className="h-4 w-4" />
            সাইন ইন
          </motion.a>
        )}
      </motion.div>
    </motion.div>
  );
}

function AppShell({
  items,
  footerLabel,
  mainClassName,
  children
}: {
  items: NavItem[];
  footerLabel: string;
  mainClassName?: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { collapsed, toggle } = useSidebarCollapsed();

  return (
    <div className="flex min-h-screen bg-background">
      <motion.aside
        className="hidden shrink-0 overflow-hidden border-r border-border bg-card md:block"
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30, mass: 0.7 }}
      >
        <SidebarContent items={items} groupId="desktop" collapsed={collapsed} />
      </motion.aside>

      <AnimatePresence mode="wait">
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.2 } },
              exit: { opacity: 0, transition: { duration: 0.2 } }
            }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-lift"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            >
              <div className="flex h-full flex-col">
                <SidebarContent items={items} onNavigate={() => setMobileOpen(false)} groupId="mobile" />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <motion.button
            onClick={() => setMobileOpen(true)}
            aria-label="মেনু খুলুন"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
          >
            <Menu className="h-5 w-5" />
          </motion.button>
          <div className="flex-1" />
          <motion.button
            onClick={toggle}
            aria-label={collapsed ? 'সাইডবার খুলুন' : 'সাইডবার বন্ধ করুন'}
            title={collapsed ? 'সাইডবার খুলুন' : 'সাইডবার বন্ধ করুন'}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground md:flex"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={collapsed ? 'open' : 'close'}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <ThemeToggle />
        </header>
        <main className={cn('flex-1', mainClassName ?? 'p-4 md:p-6 lg:p-8')}>
          <PageTransition>{children}</PageTransition>
        </main>
        <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
          {footerLabel}
        </footer>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role } = useAuthStore();

  const visible = NAV_ITEMS.filter((item) => {
    if (item.module === 'admin') return canRead(role, 'admin');
    if (item.href === '/dashboard') return true;
    // Show write-only management entries to those with permission
    if (item.module === 'cia' && pathname?.startsWith('/dashboard/cia')) return true;
    return item.module ? canRead(role, item.module) || canWrite(role, item.module) : true;
  });

  return (
    <AppShell items={visible}    footerLabel={`${SITE_NAME} ড্যাশবোর্ড · কমিটির জন্য নির্মিত`}>
      {children}
    </AppShell>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      items={PUBLIC_NAV_ITEMS}
      footerLabel={`${SITE_NAME} · সংগীত, সংস্কৃতি ও কমিউনিটি`}
    >
      {children}
    </AppShell>
  );
}
