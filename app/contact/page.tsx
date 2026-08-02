'use client';

import { Mail, Phone, MapPin, Music } from 'lucide-react';
import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { useCommitteeContacts, useAppConfig } from '@/lib/queries';
import { ROLE_NAMES } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Mail className="h-5 w-5 text-coffee-600" />
              <div>
                <p className="text-xs text-muted-foreground">ইমেইল</p>
                <a href={`mailto:${email ?? ''}`} className="text-sm font-medium hover:underline">
                  {email || process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@provatferi.org'}
                </a>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Phone className="h-5 w-5 text-coffee-600" />
              <div>
                <p className="text-xs text-muted-foreground">ফোন</p>
                <p className="text-sm font-medium">{phone || process.env.NEXT_PUBLIC_CONTACT_PHONE || '—'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <MapPin className="h-5 w-5 text-coffee-600" />
              <div>
                <p className="text-xs text-muted-foreground">ক্লাব হাউস</p>
                <p className="text-sm font-medium">মূল ক্যাম্পাস</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {!isLoading && (!contacts || contacts.length === 0) && (
          <EmptyState title="কমিটির তালিকা শীঘ্রই আসছে" description="সদস্যদের প্রোফাইল এখানে দেখা যাবে।" />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts?.map((c) => (
            <Card key={c.id} className="card-hover">
              <CardContent className="flex items-center gap-3 p-5">
                <Avatar name={c.profiles?.full_name} src={c.profiles?.avatar_url} className="h-12 w-12 text-sm" />
                <div className="min-w-0">
                  <p className="font-medium">{c.profiles?.full_name ?? 'কমিটি সদস্য'}</p>
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
