'use client';

import dynamic from 'next/dynamic';
import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
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

export default function InsightsPage() {
  return (
    <PublicShell>
      <Seo title="কোর্স বিশ্লেষণ" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="কোর্স বিশ্লেষণ" description="কোর্স উপস্থিতি ও সমাপ্তির ভিজ্যুয়াল বিশ্লেষণ।" />
        <CourseInsights />
      </div>
    </PublicShell>
  );
}
