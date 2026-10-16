'use client';

import { useAuthStore } from '@/lib/auth-store';
import { canManageAttendance } from '@/lib/permissions';
import { Seo } from '@/components/seo';
import { AttendanceManage } from '@/components/modules/attendance-manage';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function DashboardAttendanceManagePage() {
  const { role } = useAuthStore();
  const canManage = canManageAttendance(role);

  if (!canManage) {
    return (
      <div className="space-y-5">
        <Seo title="হাজিরা পরিচালনা" />
        <PageHeader size="md" title="হাজিরা পরিচালনা" description="ছয়টি কোর্সের ক্লাস হাজিরা রেকর্ড করুন।" />
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">অনুমতি নেই</h3>
            <p className="text-sm text-muted-foreground mt-2">
              এই পৃষ্ঠাটি দেখার অনুমতি আপনার নেই।
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Seo title="হাজিরা পরিচালনা" />
      <PageHeader size="md" title="হাজিরা পরিচালনা" description="ছয়টি কোর্সের ক্লাস হাজিরা রেকর্ড করুন।" />
      <AttendanceManage />
    </div>
  );
}
