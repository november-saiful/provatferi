'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { Courses } from '@/components/modules/courses';
import { PageHeader } from '@/components/ui/page-header';

export default function CoursesPage() {
  return (
    <PublicShell>
      <Seo title="কোর্স" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="সংগীত কোর্স" description="ভায়োলিন, গিটার, উকুলেলে, কণ্ঠসংগীত ও বাঁশির ক্লাস হাজিরা।" />
        <Courses />
      </div>
    </PublicShell>
  );
}
