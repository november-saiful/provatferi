'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { EventForum } from '@/components/modules/event-forum';
import { PageHeader } from '@/components/ui/page-header';

export default function EventsPage() {
  return (
    <PublicShell>
      <Seo title="Events" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="Events" description="Programs, workshops and gatherings of Provatferi." />
        <EventForum basePath="/events" />
      </div>
    </PublicShell>
  );
}
