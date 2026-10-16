'use client';

import * as React from 'react';
import {
  ArrowRight,
  GraduationCap,
  Mail,
  Phone,
  Search,
  UserRound
} from 'lucide-react';
import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { useAlumni } from '@/lib/queries';
import { cn, toBengaliDigits } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SkeletonAvatarCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { AlumniClaimCard } from '@/components/modules/alumni-claim';
import { PageHeader } from '@/components/ui/page-header';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import type { AlumniMember } from '@/lib/types';

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function usablePhone(phone: string | null | undefined) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7;
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

interface SessionGroup {
  session: string | null;
  members: AlumniMember[];
}

/** First 4-digit year inside a session string ("2015-16" → 2015). */
function sessionYear(session: string): number {
  const match = session.match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

/**
 * Groups alumni by academic session, newest session first. Members without a
 * session go into a trailing "শিক্ষাবর্ষ উল্লেখ নেই" group.
 */
function groupBySession(members: AlumniMember[]): SessionGroup[] {
  const map = new Map<string, AlumniMember[]>();
  for (const m of members) {
    const key = m.academic_session ?? '';
    const list = map.get(key) ?? [];
    list.push(m);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .map(([session, groupMembers]) => ({ session: session || null, members: groupMembers }))
    .sort((a, b) => {
      if (a.session === null) return 1;
      if (b.session === null) return -1;
      const byYear = sessionYear(b.session) - sessionYear(a.session);
      return byYear !== 0 ? byYear : a.session.localeCompare(b.session);
    });
}

function AlumniCard({ member }: { member: AlumniMember }) {
  const name = member.full_name ?? 'অ্যালামনাই সদস্য';
  const email = member.email;
  const phone = usablePhone(member.phone) ? member.phone : null;

  return (
    <Card className="group relative h-full overflow-hidden border-2 border-border/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/30" aria-hidden="true" />
      <CardContent className="p-5 pt-6 sm:p-6 sm:pt-6 md:pt-6">
        <div className="flex items-start gap-4">
          <Avatar name={name} src={member.avatar_url} iconPlaceholder className="h-14 w-14 shrink-0 text-base" ring />
          <div className="min-w-0 pt-0.5">
            <p className="break-words font-semibold leading-snug tracking-tight">{name}</p>
            {member.department && (
              <div className="mt-1.5">
                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {member.department}
                </span>
              </div>
            )}
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

export default function AlumniPage() {
  const { data: alumni, isLoading, isError } = useAlumni();
  const [query, setQuery] = React.useState('');

  const visibleAlumni = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return alumni ?? [];
    return (alumni ?? []).filter(
      (m) =>
        (m.full_name ?? '').toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q) ||
        (m.department ?? '').toLowerCase().includes(q) ||
        (m.academic_session ?? '').toLowerCase().includes(q)
    );
  }, [alumni, query]);

  const groups = React.useMemo(() => groupBySession(visibleAlumni), [visibleAlumni]);

  return (
    <PublicShell>
      <Seo title="অ্যালামনাই" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <PageHeader
          title="অ্যালামনাই"
          description="প্রভাতফেরীর প্রাক্তন সদস্যবৃন্দ — সংগঠনের অতীত থেকে আজ পর্যন্ত যারা সংগীত ও সংস্কৃতির ধারা বয়ে নিয়ে গেছেন। বিভাগ, শিক্ষাবর্ষ ও যোগাযোগের তথ্যসহ সম্পূর্ণ তালিকা।"
        />

        {/* Stats strip */}
        <section className="mb-10" aria-label="অ্যালামনাই পরিসংখ্যান">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="h-full">
              <CardContent className="flex items-center gap-4 p-5 pt-5 sm:p-6 sm:pt-6 md:pt-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coffee-100 text-coffee-700 dark:bg-coffee-900/50 dark:text-coffee-300">
                  <GraduationCap className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none">{isLoading ? '—' : toBengaliDigits(alumni?.length ?? 0)}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">মোট অ্যালামনাই</p>
                </div>
              </CardContent>
            </Card>
            <Card className="h-full">
              <CardContent className="flex items-center gap-4 p-5 pt-5 sm:p-6 sm:pt-6 md:pt-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-300">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none">
                    {isLoading ? '—' : toBengaliDigits(new Set((alumni ?? []).map((m) => m.department).filter(Boolean)).size)}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">বিভাগ</p>
                </div>
              </CardContent>
            </Card>
            <Card className="h-full">
              <CardContent className="flex items-center gap-4 p-5 pt-5 sm:p-6 sm:pt-6 md:pt-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-700 dark:bg-gold-900/50 dark:text-gold-300">
                  <GraduationCap className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none">
                    {isLoading ? '—' : toBengaliDigits(new Set((alumni ?? []).map((m) => m.academic_session).filter(Boolean)).size)}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">শিক্ষাবর্ষ</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Alumni directory */}
        <section aria-labelledby="alumni-title">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/75">প্রাক্তন সদস্যবৃন্দ</p>
              <h2 id="alumni-title" className="mt-1 text-2xl font-bold tracking-tight">অ্যালামনাই ডিরেক্টরি</h2>
            </div>
            {!isLoading && (alumni?.length ?? 0) > 0 && (
              <div className="relative w-full max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="নাম, বিভাগ, শিক্ষাবর্ষ বা ইমেইল দিয়ে খুঁজুন…"
                  aria-label="অ্যালামনাই খুঁজুন"
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
              icon={<GraduationCap className="h-7 w-7" />}
            />
          )}

          {!isLoading && !isError && (alumni?.length ?? 0) === 0 && (
            <EmptyState
              title="অ্যালামনাই তালিকা শীঘ্রই আসছে"
              description="প্রাক্তন সদস্যদের প্রোফাইল ও যোগাযোগের তথ্য এখানে দেখা যাবে।"
              icon={<GraduationCap className="h-7 w-7" />}
            />
          )}

          {!isLoading && !isError && (alumni?.length ?? 0) > 0 && visibleAlumni.length === 0 && (
            <EmptyState
              title="কোনো ফলাফল পাওয়া যায়নি"
              description="ভিন্ন নাম, বিভাগ, শিক্ষাবর্ষ বা ইমেইল দিয়ে চেষ্টা করুন।"
              icon={<Search className="h-7 w-7" />}
            />
          )}

          {!isLoading && !isError && visibleAlumni.length > 0 && (
            <Stagger className="space-y-10" gap={10} y={12}>
              {groups.map((group) => (
                <StaggerItem key={group.session ?? '__no_session__'} className="min-w-0">
                  <section aria-label={`শিক্ষাবর্ষ ${group.session ?? 'উল্লেখ নেই'}`}>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coffee-100 text-coffee-700 dark:bg-coffee-900/50 dark:text-coffee-300">
                        <GraduationCap className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/75">শিক্ষাবর্ষ</p>
                        <h3 className="truncate text-lg font-bold tracking-tight leading-tight">
                          {group.session ?? 'শিক্ষাবর্ষ উল্লেখ নেই'}
                        </h3>
                      </div>
                      <span className="ml-auto rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        {toBengaliDigits(group.members.length)} জন
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {group.members.map((member) => (
                        <AlumniCard key={member.id} member={member} />
                      ))}
                    </div>
                  </section>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </section>

        <div className="mt-10">
          <AlumniClaimCard />
        </div>
      </div>
    </PublicShell>
  );
}
