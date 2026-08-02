'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { Courses } from '@/components/modules/courses';
import { PageHeader } from '@/components/ui/page-header';

export default function CoursesPage() {
  return (
    <PublicShell>
      <Seo title="Courses" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="Music courses" description="Class attendance for violin, guitar, ukulele, vocal and flute." />
        <Courses />
      </div>
    </PublicShell>
  );
}
