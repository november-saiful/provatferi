'use client';

import { Seo } from '@/components/seo';
import { EventDetail } from '@/components/modules/event-detail';
import { useQueryParam } from '@/lib/use-query-param';

export default function DashboardEventItemPage() {
  const id = useQueryParam('id');
  return (
    <div className="mx-auto max-w-5xl">
      <Seo title="ইভেন্টের বিবরণ" />
      <EventDetail eventId={id} />
    </div>
  );
}
