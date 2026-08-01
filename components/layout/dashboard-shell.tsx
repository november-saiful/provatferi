'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
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
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-4">
        <img src="/logo.png" alt="Provatferi" className="h-9 w-9 rounded-xl object-contain" />
        <div>
          <p className="text-sm font-bold leading-none">{SITE_NAME}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Club Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {visible.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <a
          href={RECRUITMENT_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          Recruitment
        </a>
      </nav>

      <div className="border-t border-border p-4">
        {user ? (
          <div className="flex items-center gap-3">
            <Avatar name={profile?.full_name} src={profile?.avatar_url} className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile?.full_name ?? user.email}</p>
              <p className="truncate text-xs text-muted-foreground">
                {role ? ROLE_NAMES[role] : 'Unknown'} · {profile?.display_id ?? ''}
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
              <LogOut />
            </Button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
        )}
      </div>
    </div>
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

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-card shadow-lift">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
          {SITE_NAME} Dashboard · Built for the committee
        </footer>
      </div>
    </div>
  );
}
