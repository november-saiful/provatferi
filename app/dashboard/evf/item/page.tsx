'use client';

import { EventDetail } from '@/components/modules/event-detail';
import { useQueryParam } from '@/lib/use-query-param';

export default function DashboardEventItemPage() {
  const id = useQueryParam('id');
  return <EventDetail eventId={id} />;
}
