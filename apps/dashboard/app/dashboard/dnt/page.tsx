'use client';

import { Seo } from '@/components/seo';
import { Donations } from '@/components/modules/donations';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardDonationsPage() {
  return (
    <div className="space-y-5">
      <Seo title="অনুদান" />
      <PageHeader size="md" title="অনুদান" description="অনুদান দিন, দাতাদের তালিকা দেখুন ও পরিমাণ ট্র্যাক করুন।" />
      <Donations />
    </div>
  );
}
