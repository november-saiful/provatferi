'use client';

import * as React from 'react';
import {
  ArrowRight,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Users
} from 'lucide-react';
import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { useCommitteeMembers, useAppConfig } from '@/lib/queries';
import { ROLE_NAMES, isOrganizationRole } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SkeletonAvatarCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import type { CommitteeMember } from '@/lib/types';

const FALLBACK_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@provatferi.org';
const FALLBACK_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || '';

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function usablePhone(phone: string | null | undefined) {
  return !!phone && phone.replace(/\D/g, '').length >= 7;
}

function memberRole(member: CommitteeMember) {
  return ROLE_NAMES[member.role_id] ?? member.roles?.name ?? 'সদস্য';
}

function ContactMethod({
  icon: Icon,
  label,
  value,
  href
}: {
  icon: typeof Mail;
  label: string;
  value: string | null | undefined;
  href: string;
}) {
  if (!value) return null;

  return (
    <a
      href={href}
      className="group/contact flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
      <span className="truncate">{value}</span>
      <ArrowRight
        className="ml-auto h-3 w-3 shrink-0 opacity-0 transition-all group-hover/contact:translate-x-0.5 group-hover/contact:opacity-70"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </a>
  );
}

function OrgBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gold-100 to-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-800 ring-1 ring-gold-300/50 dark:from-gold-900/40 dark:to-amber-900/40 dark:text-gold-300 dark:ring-gold-600/40">
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>
      প্রতিষ্ঠান
    </span>
  );
}

function MemberCard({ member }: { member: CommitteeMember }) {
  const name = member.full_name ?? 'কমিটি সদস্য';
  const email = member.email;
  const phone = usablePhone(member.phone) ? member.phone : null;
  const isOrg = isOrganizationRole(member.role_id);

  return (
    <Card className={cn(
      'group relative h-full overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
      isOrg
        ? 'border-gold-300/60 bg-gradient-to-br from-card via-card to-gold-50/50 dark:to-gold-900/10 hover:border-gold-400/80'
        : 'border-border/80 hover:border-primary/25'
    )}>
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1',
          isOrg
            ? 'bg-gradient-to-r from-gold-400 via-amber-400 to-gold-500'
            : 'bg-gradient-to-r from-primary via-accent to-primary/30'
        )}
        aria-hidden="true"
      />
      <CardContent className="p-5 pt-6 sm:p-6 sm:pt-6">
        <div className="flex items-start gap-4">
          <Avatar name={name} src={member.avatar_url} iconPlaceholder className={cn('h-14 w-14 shrink-0 text-base', isOrg && 'ring-2 ring-gold-300/60 dark:ring-gold-600/50')} ring />
          <div className="min-w-0 pt-0.5">
            <p className="truncate font-semibold tracking-tight">{name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <p className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                isOrg
                  ? 'bg-gradient-to-r from-gold-100 to-amber-100 text-gold-800 dark:from-gold-900/40 dark:to-amber-900/40 dark:text-gold-300'
                  : 'bg-primary/10 text-primary'
              )}>
                {memberRole(member)}
              </p>
              {isOrg && <OrgBadge />}
            </div>
          </div>
        </div>

        {email || phone ? (
          <div className="mt-5 space-y-1 border-t border-border/70 pt-3">
            <ContactMethod icon={Mail} label="ইমেইলে যোগাযোগ করুন" value={email} href={`mailto:${email}`} />
            <ContactMethod icon={Phone} label="ফোনে যোগাযোগ করুন" value={phone} href={phoneHref(phone ?? '')} />
          </div>
        ) : (
          <p className="mt-5 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            যোগাযোগের তথ্য শীঘ্রই যোগ হবে।
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ContactPage() {
  const { data: members, isLoading, isError } = useCommitteeMembers();
  const { data: email } = useAppConfig('contact_email');
  const { data: phone } = useAppConfig('contact_phone');
  const [query, setQuery] = React.useState('');

  const officeEmail = email || FALLBACK_EMAIL;
  const officePhone = phone || FALLBACK_PHONE;

  const visibleMembers = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members ?? [];
    return (members ?? []).filter(
      (m) =>
        (m.full_name ?? '').toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q) ||
        memberRole(m).toLowerCase().includes(q)
    );
  }, [members, query]);

  return (
    <PublicShell>
      <Seo title="যোগাযোগ" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <PageHeader
          title="যোগাযোগ করুন"
          description="প্রভাতফেরী কমিটির বর্তমান সদস্যদের সঙ্গে সরাসরি যোগাযোগ করুন — ভিজিটর ও অ্যালামনাই ছাড়া পুরো কমিটি এখানে তালিকাভুক্ত।"
        />

        {/* Hero — club office contacts */}
        <section
          className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-coffee-800 via-coffee-700 to-taupe-700 p-6 text-white shadow-xl sm:p-8"
          aria-labelledby="contact-intro-title"
        >
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" aria-hidden="true" />
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                <MessageCircle className="h-5 w-5 text-gold-300" aria-hidden="true" />
              </div>
              <h2 id="contact-intro-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
                আমরা আপনার কথা শুনতে প্রস্তুত
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
                অনুষ্ঠান, কোর্স, সহযোগিতা বা সংগঠনের যেকোনো বিষয়ে সঠিক সদস্যের সঙ্গে যোগাযোগ করতে নিচের তালিকা ব্যবহার করুন।
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`mailto:${officeEmail}`}
                  className="group inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/25"
                >
                  <Mail className="h-4 w-4 text-gold-300" aria-hidden="true" />
                  <span className="truncate max-w-56 sm:max-w-none">{officeEmail}</span>
                </a>
                {usablePhone(officePhone) && (
                  <a
                    href={phoneHref(officePhone)}
                    className="group inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/25"
                  >
                    <Phone className="h-4 w-4 text-gold-300" aria-hidden="true" />
                    {officePhone}
                  </a>
                )}
              </div>
            </div>
            <div className="hidden rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm sm:block lg:min-w-52">
              <Users className="h-6 w-6 text-gold-300" aria-hidden="true" />
              <p className="mt-3 text-2xl font-bold">{isLoading ? '—' : (members?.length ?? 0)}</p>
              <p className="text-xs text-white/65">কমিটি সদস্য</p>
            </div>
          </div>
        </section>

        {/* Office cards */}
        <section className="mb-12" aria-labelledby="office-contact-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/75">সরাসরি যোগাযোগ</p>
              <h2 id="office-contact-title" className="mt-1 text-xl font-bold tracking-tight">ক্লাব অফিস</h2>
            </div>
            <MapPin className="h-5 w-5 text-primary/60" aria-hidden="true" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="card-hover">
              <CardContent className="flex items-center gap-4 p-5 pt-5 sm:p-6 sm:pt-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coffee-100 text-coffee-700 dark:bg-coffee-900/50 dark:text-coffee-300">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ইমেইল</p>
                  <a
                    href={`mailto:${officeEmail}`}
                    className="mt-1 block truncate text-sm font-semibold hover:text-primary hover:underline"
                  >
                    {officeEmail}
                  </a>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="flex items-center gap-4 p-5 pt-5 sm:p-6 sm:pt-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-300">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ফোন</p>
                  {usablePhone(officePhone) ? (
                    <a
                      href={phoneHref(officePhone)}
                      className="mt-1 block truncate text-sm font-semibold hover:text-primary hover:underline"
                    >
                      {officePhone}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-semibold">শীঘ্রই জানানো হবে</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="flex items-center gap-4 p-5 pt-5 sm:p-6 sm:pt-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ক্লাব হাউস</p>
                  <p className="mt-1 truncate text-sm font-semibold">মূল ক্যাম্পাস</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Committee members */}
        <section aria-labelledby="committee-title">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/75">আমাদের নেতৃত্ব</p>
              <h2 id="committee-title" className="mt-1 text-2xl font-bold tracking-tight">কমিটি সদস্যবৃন্দ</h2>
            </div>
            {!isLoading && (members?.length ?? 0) > 0 && (
              <div className="relative w-full max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="নাম, পদবি বা ইমেইল দিয়ে খুঁজুন…"
                  aria-label="কমিটি সদস্য খুঁজুন"
                  className="pl-10"
                />
              </div>
            )}
          </div>

          {isLoading && (
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <StaggerItem key={i}>
                  <SkeletonAvatarCard className="h-full" />
                </StaggerItem>
              ))}
            </Stagger>
          )}

          {!isLoading && isError && (
            <EmptyState
              title="তথ্য লোড করা যায়নি"
              description="কিছুক্ষণ পর আবার চেষ্টা করুন।"
              icon={<Users className="h-7 w-7" />}
            />
          )}

          {!isLoading && !isError && (members?.length ?? 0) === 0 && (
            <EmptyState
              title="কমিটির তালিকা শীঘ্রই আসছে"
              description="কমিটি সদস্যদের প্রোফাইল ও যোগাযোগের তথ্য এখানে দেখা যাবে।"
              icon={<Users className="h-7 w-7" />}
            />
          )}

          {!isLoading && !isError && (members?.length ?? 0) > 0 && visibleMembers.length === 0 && (
            <EmptyState
              title="কোনো ফলাফল পাওয়া যায়নি"
              description="ভিন্ন নাম, পদবি বা ইমেইল দিয়ে চেষ্টা করুন।"
              icon={<Search className="h-7 w-7" />}
            />
          )}

          {!isLoading && !isError && visibleMembers.length > 0 && (
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={10} y={12}>
              {visibleMembers.map((member) => (
                <StaggerItem key={member.id} className="min-w-0">
                  <MemberCard member={member} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </section>
      </div>
    </PublicShell>
  );
}
