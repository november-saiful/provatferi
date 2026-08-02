'use client';

import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

const CourseInsights = dynamic(
  () => import('@/components/modules/course-insights').then((m) => m.CourseInsights),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }
);

export default function DashboardInsightsPage() {
  return (
    <div className="space-y-5">
      <PageHeader size="md" title="কোর্স বিশ্লেষণ" description="উপস্থিতি ও সমাপ্তির ভিজ্যুয়াল বিশ্লেষণ।" />
      <CourseInsights />
    </div>
  );
}
