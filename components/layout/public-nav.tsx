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

const navLinkVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: 'easeIn' as const } }
};

const mobileLinkVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15, ease: 'easeIn' as const } }
};

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const { user, profile, loading } = useAuthStore();
  const recruitment = process.env.NEXT_PUBLIC_RECRUITMENT_URL ?? 'https://example.com/recruitment';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
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

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          <AnimatePresence mode="wait">
            {LINKS.map((l, index) => (
              <motion.a
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === l.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={navLinkVariants}
                custom={index}
              >
                {l.label}
              </motion.a>
            ))}
          </AnimatePresence>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <motion.button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="p-2 rounded-lg transition-colors hover:bg-accent"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.button>
          {!loading &&
            (user ? (
              <motion.a
                href="/dashboard"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar name={profile?.full_name} src={profile?.avatar_url} className="h-9 w-9" />
              </motion.a>
            ) : (
              <motion.a
                href="/login"
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                whileTap={{ scale: 0.98 }}
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </motion.a>
            ))}
          <motion.button
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            className="lg:hidden p-2 rounded-lg transition-colors hover:bg-accent"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {open && (
          <motion.nav
            className="border-t border-border bg-background px-4 py-3 lg:hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0, height: 0 },
              visible: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeOut' as const } },
              exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: 'easeIn' as const } }
            }}
          >
            <div className="flex flex-col gap-1">
              <AnimatePresence mode="wait">
                {LINKS.map((l, index) => (
                  <motion.a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={mobileLinkVariants}
                    custom={index}
                  >
                    {l.label}
                  </motion.a>
                ))}
              </AnimatePresence>
              <motion.a
                href={recruitment}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={mobileLinkVariants}
                custom={LINKS.length}
                whileHover={{ x: 4 }}
              >
                Recruitment <ExternalLink className="h-3.5 w-3.5" />
              </motion.a>
            </div>
          </motion.nav>
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
          <motion.a
            href="/contact"
            className="hover:text-foreground"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            Committee
          </motion.a>
        </motion.div>
      </div>
    </footer>
  );
}
