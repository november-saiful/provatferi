'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Music,
  CalendarDays,
  Images,
  Calendar,
  Bell,
  HandCoins,
  Handshake,
  BarChart3,
  Phone,
  Menu,
  X,
  LogIn,
  Moon,
  Sun,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/notices', label: 'Notices' },
  { href: '/donate', label: 'Donate' },
  { href: '/sponsor', label: 'Sponsor' },
  { href: '/courses', label: 'Courses' },
  { href: '/insights', label: 'Insights' }
];

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const { user, profile, loading } = useAuthStore();
  const recruitment = process.env.NEXT_PUBLIC_RECRUITMENT_URL ?? 'https://example.com/recruitment';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Provatferi" className="h-9 w-9 rounded-xl object-contain" />
          <span className="text-base font-bold">{SITE_NAME}</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === l.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          {!loading &&
            (user ? (
              <Link href="/dashboard">
                <Avatar name={profile?.full_name} src={profile?.avatar_url} className="h-9 w-9" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            ))}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <a href={recruitment} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">
              Recruitment <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Music className="h-4 w-4 text-coffee-600" />
          {SITE_NAME}
        </div>
        <p>Celebrating music, culture and community.</p>
        <div className="flex items-center gap-4">
          <a href={`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE ?? ''}`} className="flex items-center gap-1.5 hover:text-foreground">
            <Phone className="h-3.5 w-3.5" /> Contact
          </a>
          <Link href="/contact" className="hover:text-foreground">
            Committee
          </Link>
        </div>
      </div>
    </footer>
  );
}
