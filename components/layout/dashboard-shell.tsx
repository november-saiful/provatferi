'use client';

import * as React from 'react';
import Link from 'next/link';
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
  type LucideIcon
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { canRead, canWrite, ROLE_NAMES } from '@/lib/permissions';
import type { ModuleId } from '@/lib/types';
import { SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  module: ModuleId;
  writeOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, module: 'evf' },
  { href: '/dashboard/evf', label: 'Events', icon: CalendarDays, module: 'evf' },
  { href: '/dashboard/glr', label: 'Gallery', icon: Images, module: 'glr' },
  { href: '/dashboard/cln', label: 'Calendar', icon: Calendar, module: 'cln' },
  { href: '/dashboard/ntb', label: 'Notices', icon: Bell, module: 'ntb' },
  { href: '/dashboard/dnt', label: 'Donations', icon: HandCoins, module: 'dnt' },
  { href: '/dashboard/spn', label: 'Sponsors', icon: Handshake, module: 'spn' },
  { href: '/dashboard/xpm', label: 'Expenses', icon: Receipt, module: 'xpm' },
  { href: '/dashboard/bgm', label: 'Budgets', icon: Wallet, module: 'bgm' },
  { href: '/dashboard/rcd', label: 'Records', icon: History, module: 'rcd' },
  { href: '/dashboard/cia', label: 'Attendance', icon: Music4, module: 'cia' },
  { href: '/dashboard/coi', label: 'Insights', icon: BarChart3, module: 'coi' },
  { href: '/dashboard/admin', label: 'Admin Panel', icon: UserCog, module: 'admin' }
];

const RECRUITMENT_URL =
  process.env.NEXT_PUBLIC_RECRUITMENT_URL ?? 'https://example.com/recruitment';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <motion.button
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.95 }}
      className="p-2 rounded-lg transition-colors hover:bg-accent"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </motion.button>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, profile, role, signOut } = useAuthStore();

  const visible = NAV_ITEMS.filter((item) => {
    if (item.module === 'admin') return canRead(role, 'admin');
    if (item.href === '/dashboard') return true;
    // Show write-only management entries to those with permission
    if (item.module === 'cia' && pathname?.startsWith('/dashboard/cia')) return true;
    return canRead(role, item.module) || canWrite(role, item.module);
  });

  const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.2, delay: i * 0.04, ease: 'easeOut' as const }
    })
  };

  return (
    <motion.div
      className="flex h-full flex-col"
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      <motion.div
        className="flex items-center gap-2 px-5 py-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.img
          src="/logo.png"
          alt="Provatferi"
          className="h-10 w-auto object-contain"
          whileHover={{ scale: 1.05, rotate: [0, -1, 1, 0] }}
          whileTap={{ scale: 0.95 }}
        />
      </motion.div>

      <motion.nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        <AnimatePresence mode="wait">
          {visible.map((item, index) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <motion.a
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={itemVariants}
                custom={index}
                whileHover={active ? {} : { x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.span
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="h-4 w-4" />
                </motion.span>
                {item.label}
              </motion.a>
            );
          })}
        </AnimatePresence>

        <motion.a
          href={RECRUITMENT_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          initial="hidden"
          animate="visible"
          variants={itemVariants}
          custom={visible.length}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <ExternalLink className="h-4 w-4" />
          Recruitment
        </motion.a>
      </motion.nav>

      <motion.div
        className="border-t border-border p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      >
        {user ? (
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.a
              href="/dashboard"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Avatar name={profile?.full_name} src={profile?.avatar_url} className="h-9 w-9" />
            </motion.a>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile?.full_name ?? user.email}</p>
              <p className="truncate text-xs text-muted-foreground">
                {role ? ROLE_NAMES[role] : 'Unknown'} · {profile?.display_id ?? ''}
              </p>
            </div>
            <motion.button
              aria-label="Sign out"
              onClick={signOut}
              className="p-2 rounded-lg transition-colors hover:bg-accent"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </motion.div>
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
            Sign in
          </motion.a>
        )}
      </motion.div>
    </motion.div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { profile } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
        <SidebarContent />
      </aside>

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
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-64 bg-card shadow-lift"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          <motion.button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-accent"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: mobileOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Menu className="h-5 w-5" />
          </motion.button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <motion.main
          className="flex-1 p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
        <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
          {SITE_NAME} Dashboard · Built for the committee
        </footer>
      </div>
    </div>
  );
}
