'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Mail, Phone, Search, Users } from 'lucide-react';
import { useAlumni, useCommitteeMembers } from '@/lib/queries';
import { ROLE_NAMES } from '@/lib/permissions';
import { cn, toBengaliDigits } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SkeletonAvatarCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import type { AlumniMember, CommitteeMember } from '@/lib/types';

function usablePhone(phone: string | null | undefined): phone is string {
  if (!phone) return false;
  return phone.replace(/\D/g, '').length >= 7;
}

function ContactRow({ email, phone }: { email: string; phone: string | null }) {
  if (!email && !phone) {
    return (
      <p className="mt-4 border-t border-border/70 pt-3 text-xs text-muted-foreground">
        যোগাযোগের তথ্য শীঘ্রই যোগ হবে।
      </p>
    );
  }
  return (
    <div className="mt-4 space-y-1 border-t border-border/70 pt-3">
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
        >
          <Mail className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
          <span className="truncate">{email}</span>
        </a>
      )}
      {usablePhone(phone) && (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, '')}`}
          className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
        >
          <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
          <span className="truncate">{phone}</span>
        </a>
      )}
    </div>
  );
}

function DirectoryCard({
  name,
  badge,
  sub,
  avatarUrl,
  email,
  phone,
}: {
  name: string;
  badge: string;
  sub?: string | null;
  avatarUrl: string | null;
  email: string;
  phone: string | null;
}) {
  return (
    <Card className="group relative h-full overflow-hidden border-2 border-border/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/30" aria-hidden="true" />
      <CardContent className="p-5 pt-6">
        <div className="flex items-start gap-4">
          <Avatar name={name} src={avatarUrl} iconPlaceholder className="h-14 w-14 shrink-0 text-base" ring />
          <div className="min-w-0 pt-0.5">
            <p className="break-words font-semibold leading-snug tracking-tight">{name}</p>
            <div className="mt-1.5">
              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {badge}
              </span>
            </div>
            {sub && <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
        <ContactRow email={email} phone={phone} />
      </CardContent>
    </Card>
  );
}

type Tab = 'committee' | 'alumni';

export function MemberDirectory() {
  const [tab, setTab] = React.useState<Tab>('committee');
  const [query, setQuery] = React.useState('');
  const committee = useCommitteeMembers(tab === 'committee');
  const alumni = useAlumni();

  const q = query.trim().toLowerCase();
  const visibleCommittee = React.useMemo(() => {
    const list = committee.data ?? [];
    if (!q) return list;
    return list.filter(
      (m: CommitteeMember) =>
        (m.full_name ?? '').toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q) ||
        (ROLE_NAMES[m.role_id] ?? '').includes(query.trim())
    );
  }, [committee.data, q, query]);
  const visibleAlumni = React.useMemo(() => {
    const list = alumni.data ?? [];
    if (!q) return list;
    return list.filter(
      (m: AlumniMember) =>
        (m.full_name ?? '').toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q) ||
        (m.department ?? '').toLowerCase().includes(q) ||
        (m.academic_session ?? '').toLowerCase().includes(q)
    );
  }, [alumni.data, q]);

  const loading = tab === 'committee' ? committee.isLoading : alumni.isLoading;
  const isError = tab === 'committee' ? committee.isError : alumni.isError;
  const count = tab === 'committee' ? visibleCommittee.length : visibleAlumni.length;

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'committee', label: 'কমিটি', icon: Users, total: committee.data?.length },
            { id: 'alumni', label: 'অ্যালামনাই', icon: GraduationCap, total: alumni.data?.length },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
              tab === t.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            )}
          >
            <t.icon className="h-4 w-4" aria-hidden="true" />
            {t.label}
            {typeof t.total === 'number' && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-bold',
                  tab === t.id ? 'bg-white/20' : 'bg-background'
                )}
              >
                {toBengaliDigits(t.total)}
              </span>
            )}
          </button>
        ))}
        <div className="relative ml-auto w-full max-w-xs">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম, ইমেইল বা বিভাগ দিয়ে খুঁজুন…"
            aria-label="সদস্য খুঁজুন"
            className="pl-10"
          />
        </div>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonAvatarCard key={i} className="h-full" />
          ))}
        </div>
      )}

      {!loading && isError && (
        <EmptyState
          title="তথ্য লোড করা যায়নি"
          description="কিছুক্ষণ পর আবার চেষ্টা করুন।"
          icon={<Users className="h-7 w-7" />}
        />
      )}

      {!loading && !isError && count === 0 && (
        <EmptyState
          title="কোনো সদস্য পাওয়া যায়নি"
          description="ভিন্ন নাম বা ইমেইল দিয়ে চেষ্টা করুন।"
          icon={<Search className="h-7 w-7" />}
        />
      )}

      {!loading && !isError && count > 0 && tab === 'committee' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCommittee.map((m: CommitteeMember) => (
            <DirectoryCard
              key={m.id}
              name={m.full_name ?? 'কমিটি সদস্য'}
              badge={ROLE_NAMES[m.role_id] ?? m.role_id}
              avatarUrl={m.avatar_url}
              email={m.email}
              phone={m.phone}
            />
          ))}
        </div>
      )}

      {!loading && !isError && count > 0 && tab === 'alumni' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleAlumni.map((m: AlumniMember) => (
              <DirectoryCard
                key={m.id}
                name={m.full_name ?? 'অ্যালামনাই সদস্য'}
                badge="অ্যালামনাই"
                sub={m.department ?? m.academic_session}
                avatarUrl={m.avatar_url}
                email={m.email}
                phone={m.phone}
              />
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            শিক্ষাবর্ষ অনুযায়ী সাজানো তালিকা দেখুন{' '}
            <Link href="/alumni" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              অ্যালামনাই পাতায় <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
