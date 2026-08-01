'use client';

import { CourseInsights } from '@/components/modules/course-insights';

export default function DashboardInsightsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Course insights</h1>
        <p className="text-sm text-muted-foreground">Visual analytics of attendance and completion.</p>
      </div>
      <CourseInsights />
    </div>
  );
}
