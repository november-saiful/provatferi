'use client';

import Link from 'next/link';
import { ClipboardEdit } from 'lucide-react';
import { Courses } from '@/components/modules/courses';
import { useAuthStore } from '@/lib/auth-store';
import { canManageAttendance } from '@/lib/permissions';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAttendancePage() {
  const { role } = useAuthStore();

  return (
    <div className="space-y-5">
      <PageHeader
        size="md"
        title="কোর্স উপস্থিতি"
        description="ছয়টি সংগীত কোর্সের উপস্থিতি ও অগ্রগতি।"
      >
        {canManageAttendance(role) && (
          <Link href="/dashboard/cia/manage" className={cn(buttonVariants(), 'shrink-0')}>
            <ClipboardEdit className="h-4 w-4" /> উপস্থিতি পূরণ করুন
          </Link>
        )}
      </PageHeader>
      <Courses />
    </div>
  );
}
