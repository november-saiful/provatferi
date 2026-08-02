'use client';

import { Courses } from '@/components/modules/courses';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAttendancePage() {
  return (
    <div className="space-y-5">
      <PageHeader size="md" title="Course attendance" description="Public view of all six music courses." />
      <Courses />
    </div>
  );
}
