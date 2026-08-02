'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Images,
  Calendar,
  Bell,
  HandCoins,
  Handshake,
  Music4,
  BarChart3,
  Phone,
  Menu,
  X,
  LogIn,
  Moon,
  Sun,
  ExternalLink,
  Home
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { SPRING } from '@/components/ui/motion';

const LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/gallery', label: 'Gallery', icon: Images },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/notices', label: 'Notices', icon: Bell },
  { href: '/donate', label: 'Donate', icon: HandCoins },
  { href: '/sponsor', label: 'Sponsor', icon: Handshake },
  { href: '/courses', label: 'Courses', icon: Music4 },
  { href: '/insights', label: 'Insights', icon: BarChart3 }
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const { user, profile, loading } = useAuthStore();
  const recruitment = process.env.NEXT_PUBLIC_RECRUITMENT_URL ?? 'https://example.com/recruitment';
  const isDark = mounted && theme === 'dark';

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open, and close it with Escape
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300 ease-smooth',
        scrolled || open
          ? 'border-b border-border bg-background/85 shadow-soft backdrop-blur-xl supports-[backdrop-filter]:bg-background/80'
          : 'border-b border-transparent bg-background/60 backdrop-blur-md'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Provatferi Home">
          <motion.img
            src="/logo.png"
            alt="Provatferi"
            className="h-10 w-auto object-contain"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
            whileTap={{ scale: 0.95 }}
          />
        </Link>

        <nav className="ml-6 hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <motion.a
                key={l.href}
                href={l.href}
                className={cn(
                  'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                {active && (
                  <motion.span
                    layoutId="public-nav-active"
                    className="absolute inset-0 rounded-lg bg-primary/10 ring-1 ring-primary/20"
                    transition={SPRING}
                  />
                )}
                <span className="relative z-10">{l.label}</span>
              </motion.a>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <motion.button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label="Toggle theme"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mounted && (
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
              )}
            </AnimatePresence>
          </motion.button>
          {!loading &&
            (user ? (
              <motion.a href="/dashboard" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Avatar name={profile?.full_name} src={profile?.avatar_url} className="h-9 w-9 ring-2 ring-primary/20" />
              </motion.a>
            ) : (
              <motion.a
                href="/login"
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                whileTap={{ scale: 0.98 }}
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign in</span>
              </motion.a>
            ))}
          <motion.button
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            whileTap={{ scale: 0.92 }}
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 top-16 z-40 overflow-y-auto bg-background/98 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
              {LINKS.map((l, index) => {
                const active = pathname === l.href;
                const Icon = l.icon;
                return (
                  <motion.a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-foreground ring-1 ring-primary/20'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                    )}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04, ease: EASE }}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                        active ? 'bg-primary text-primary-foreground' : 'bg-accent/60 text-muted-foreground'
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    {l.label}
                  </motion.a>
                );
              })}
              <motion.a
                href={recruitment}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: LINKS.length * 0.04, ease: EASE }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/60 text-muted-foreground">
                  <ExternalLink className="h-[18px] w-[18px]" />
                </span>
                Recruitment
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-sm text-muted-foreground">
        <motion.a
          href="/"
          className="flex items-center gap-2 font-medium text-foreground hover:opacity-80 transition-opacity"
          aria-label="Provatferi Home"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.img
            src="/logo.png"
            alt="Provatferi"
            className="h-8 w-auto object-contain"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            whileHover={{ rotate: [0, 1, -1, 0] }}
          />
        </motion.a>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        >
          Celebrating music, culture and community.
        </motion.p>
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
        >
          <motion.a
            href={`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE ?? ''}`}
            className="flex items-center gap-1.5 hover:text-foreground"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Phone className="h-3.5 w-3.5" /> Contact
          </motion.a>
          <motion.a href="/contact" className="hover:text-foreground" whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
            Committee
          </motion.a>
        </motion.div>
      </div>
    </footer>
  );
}
