'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { EventDetail } from '@/components/modules/event-detail';
import { useQueryParam } from '@/lib/use-query-param';

export default function EventItemPage() {
  const id = useQueryParam('id');
  return (
    <>
      <Seo title="Event details" />
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <EventDetail eventId={id} />
      </main>
      <PublicFooter />
    </>
  );
}
