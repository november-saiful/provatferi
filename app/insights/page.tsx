'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { CourseInsights } from '@/components/modules/course-insights';

export default function InsightsPage() {
  return (
    <>
      <Seo title="Course insights" />
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Course insights</h1>
          <p className="mt-1 text-muted-foreground">Visual analytics of course attendance and completion.</p>
        </div>
        <CourseInsights />
      </main>
      <PublicFooter />
    </>
  );
}
