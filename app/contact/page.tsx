'use client';

import { Mail, Phone, MapPin, Music } from 'lucide-react';
import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { useCommitteeContacts, useAppConfig } from '@/lib/queries';
import { ROLE_NAMES } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';

export default function ContactPage() {
  const { data: contacts, isLoading } = useCommitteeContacts();
  const { data: email } = useAppConfig('contact_email');
  const { data: phone } = useAppConfig('contact_phone');

  return (
    <>
      <Seo title="Contact" />
      <PublicNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Committee</h1>
          <p className="mt-1 text-muted-foreground">Meet the current Provatferi committee.</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Mail className="h-5 w-5 text-coffee-600" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
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
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{phone || process.env.NEXT_PUBLIC_CONTACT_PHONE || '—'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <MapPin className="h-5 w-5 text-coffee-600" />
              <div>
                <p className="text-xs text-muted-foreground">Club house</p>
                <p className="text-sm font-medium">Main Campus</p>
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
          <EmptyState title="Committee list coming soon" description="Member profiles will appear here." />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts?.map((c) => (
            <Card key={c.id} className="card-hover">
              <CardContent className="flex items-center gap-3 p-5">
                <Avatar name={c.profiles?.full_name} src={c.profiles?.avatar_url} className="h-12 w-12 text-sm" />
                <div className="min-w-0">
                  <p className="font-medium">{c.profiles?.full_name ?? 'Committee member'}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.roles?.name ?? (c.role_id ? ROLE_NAMES[c.role_id as keyof typeof ROLE_NAMES] : 'Member')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
