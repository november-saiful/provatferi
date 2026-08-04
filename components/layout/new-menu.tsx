'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  CalendarPlus,
  Megaphone,
  Wallet,
  Receipt,
  ImagePlus,
  Handshake,
  Calendar as CalendarIcon,
  Users,
  ListChecks,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { canWrite } from '@/lib/permissions';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator
} from '@/components/ui/dropdown-menu';

type WritableModule = 'evf' | 'ntb' | 'cln' | 'glr' | 'bgm' | 'xpm' | 'spn' | 'cia' | 'admin';

interface NewTarget {
  href: string;
  label: string;
  desc?: string;
  icon: LucideIcon;
  module: WritableModule;
  tone?: 'coffee' | 'sage' | 'gold' | 'taupe' | 'warmred';
}

const TONE_STYLE: Record<NonNullable<NewTarget['tone']>, string> = {
  coffee: 'bg-coffee-100 text-coffee-700 dark:bg-coffee-900/50 dark:text-coffee-300',
  sage: 'bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-300',
  gold: 'bg-gold-100 text-gold-700 dark:bg-gold-900/50 dark:text-gold-300',
  taupe: 'bg-taupe-100 text-taupe-700 dark:bg-taupe-900/50 dark:text-taupe-300',
  warmred: 'bg-warmred-100 text-warmred-700 dark:bg-warmred-900/50 dark:text-warmred-300'
};

const PRIMARY_TARGETS: NewTarget[] = [
  { href: '/dashboard/evf?new=1', label: 'নতুন ইভেন্ট', icon: CalendarPlus, module: 'evf', tone: 'coffee' },
  { href: '/dashboard/ntb?new=1', label: 'নতুন নোটিশ', icon: Megaphone, module: 'ntb', tone: 'gold' },
  { href: '/dashboard/cln?new=1', label: 'নতুন ক্যালেন্ডার আইটেম', icon: CalendarIcon, module: 'cln', tone: 'sage' },
  { href: '/dashboard/glr?new=1', label: 'গ্যালারিতে আপলোড', icon: ImagePlus, module: 'glr', tone: 'taupe' },
  { href: '/dashboard/bgm?new=1', label: 'নতুন বাজেট', icon: Wallet, module: 'bgm', tone: 'sage' },
  { href: '/dashboard/xpm?new=1', label: 'নতুন ব্যয়', icon: Receipt, module: 'xpm', tone: 'warmred' },
  { href: '/dashboard/spn?new=1', label: 'নতুন স্পনসর', icon: Handshake, module: 'spn', tone: 'gold' },
  { href: '/dashboard/cia?manage=1', label: 'কোর্স হাজিরা', icon: ListChecks, module: 'cia', tone: 'coffee' },
  { href: '/dashboard/admin/users', label: 'সদস্য যোগ করুন', icon: Users, module: 'admin', tone: 'taupe' }
];

interface NewMenuProps {
  collapsed?: boolean;
  className?: string;
}

export function NewMenu({ collapsed = false, className }: NewMenuProps) {
  const router = useRouter();
  const { role } = useAuthStore();

  const primary = React.useMemo(
    () => PRIMARY_TARGETS.filter((t) => canWrite(role, t.module)),
    [role]
  );
  const visibleCount = primary.length;

  if (visibleCount === 0) return null;

  return (
    <Dropdown align={collapsed ? 'start' : 'start'} side="bottom" sideOffset={8}>
      <DropdownTrigger asChild>
        {collapsed ? (
          <button
            type="button"
            aria-label="নতুন তৈরি করুন"
            className={cn(
              'group relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md',
              'transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95',
              className
            )}
          >
            <Plus className="h-6 w-6" strokeWidth={2.25} />
          </button>
        ) : (
          <motion.button
            type="button"
            aria-label="নতুন তৈরি করুন"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'group relative flex h-12 w-full items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent px-4 text-sm font-bold text-primary-foreground shadow-md transition-shadow duration-200 hover:shadow-lg',
              className
            )}
          >
            <span className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" />
            <Plus className="h-5 w-5 shrink-0" strokeWidth={2.4} />
            <span className="flex-1 text-left tracking-tight">নতুন</span>
            <span className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rotate-45 border-r-2 border-t-2 border-primary-foreground/70" />
          </motion.button>
        )}
      </DropdownTrigger>
      <DropdownContent size="lg" align="start" sideOffset={collapsed ? 10 : 6} className="p-2">
        <DropdownLabel>একটি নতুন আইটেম তৈরি করুন</DropdownLabel>
        <div className="grid gap-1">
          {primary.map((t) => {
            const Icon = t.icon;
            return (
              <DropdownItem
                key={t.href}
                href={t.href}
                icon={
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      TONE_STYLE[t.tone ?? 'coffee']
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                }
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-semibold leading-tight">{t.label}</span>
                  {t.desc && (
                    <span className="text-[11px] font-normal text-muted-foreground">{t.desc}</span>
                  )}
                </div>
              </DropdownItem>
            );
          })}
        </div>
        <DropdownSeparator />
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground"
        >
          <CalendarPlus className="h-4 w-4" />
          <span className="flex-1 text-left">শীঘ্রই আসছে…</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
            আলফা
          </span>
        </button>
      </DropdownContent>
    </Dropdown>
  );
}
