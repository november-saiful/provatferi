'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { EventDetail } from '@/components/modules/event-detail';
import { useQueryParam } from '@/lib/use-query-param';

export default function EventItemPage() {
  const id = useQueryParam('id');
  return (
    <PublicShell>
      <Seo title="Event details" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <EventDetail eventId={id} />
      </div>
    </PublicShell>
  );
}
