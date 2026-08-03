'use client';

import { Mail, Phone, MapPin } from 'lucide-react';
import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { useCommitteeContacts, useAppConfig } from '@/lib/queries';
import { ROLE_NAMES } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';

export default function ContactPage() {
  const { data: contacts, isLoading } = useCommitteeContacts();
  const { data: email } = useAppConfig('contact_email');
  const { data: phone } = useAppConfig('contact_phone');

  return (
    <PublicShell>
      <Seo title="যোগাযোগ" />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <PageHeader title="কমিটি" description="বর্তমান প্রভাতফেরী কমিটির সাথে পরিচিত হোন।" />

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Mail,
              label: 'ইমেইল',
              value: email || process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@provatferi.org',
              href: `mailto:${email || ''}`
            },
            {
              icon: Phone,
              label: 'ফোন',
              value: phone || process.env.NEXT_PUBLIC_CONTACT_PHONE || '—'
            },
            {
              icon: MapPin,
              label: 'ক্লাব হাউস',
              value: 'মূল ক্যাম্পাস'
            }
          ].map((item) => (
            <Card key={item.label} className="card-hover">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-coffee-100 to-coffee-200 text-coffee-600 dark:from-coffee-900/50 dark:to-coffee-800/50 dark:text-coffee-400">
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{item.label}</p>
                  {'href' in item ? (
                    <a href={item.href} className="text-sm font-semibold hover:underline truncate block">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold truncate">{item.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && (!contacts || contacts.length === 0) && (
          <EmptyState title="কমিটির তালিকা শীঘ্রই আসছে" description="সদস্যদের প্রোফাইল এখানে দেখা যাবে।" />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts?.map((c) => (
            <Card key={c.id} className="card-hover border-2">
              <CardContent className="flex items-center gap-4 p-5">
                <Avatar name={c.profiles?.full_name} src={c.profiles?.avatar_url} className="h-14 w-14 text-base" ring />
                <div className="min-w-0">
                  <p className="font-semibold">{c.profiles?.full_name ?? 'কমিটি সদস্য'}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.roles?.name ?? (c.role_id ? ROLE_NAMES[c.role_id as keyof typeof ROLE_NAMES] : 'সদস্য')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
