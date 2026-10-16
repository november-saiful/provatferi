'use client';

import Link from 'next/link';
import { ClipboardEdit } from 'lucide-react';
import { Courses } from '@/components/modules/courses';
import { useAuthStore } from '@/lib/auth-store';
import { canManageAttendance } from '@/lib/permissions';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Seo } from '@/components/seo';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardAttendancePage() {
  const { role } = useAuthStore();

  return (
    <div className="space-y-5">
      <Seo title="কোর্স হাজিরা" />
      <PageHeader
        size="md"
        title="কোর্স হাজিরা"
        description="ছয়টি সংগীত কোর্সের হাজিরা ও অগ্রগতি।"
      >
        {canManageAttendance(role) && (
          <Link
            href="/dashboard/cia/manage"
            className={cn(
              buttonVariants(),
              'shrink-0 transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.97]'
            )}
          >
            <ClipboardEdit className="h-4 w-4" /> হাজিরা পূরণ করুন
          </Link>
        )}
      </PageHeader>
      <Courses />
    </div>
  );
}
