'use client';

import { Courses } from '@/components/modules/courses';

export default function DashboardAttendancePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Course attendance</h1>
        <p className="text-sm text-muted-foreground">Public view of all six music courses.</p>
      </div>
      <Courses />
    </div>
  );
}
