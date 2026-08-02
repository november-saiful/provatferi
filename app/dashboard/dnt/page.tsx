'use client';

import { Donations } from '@/components/modules/donations';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardDonationsPage() {
  return (
    <div className="space-y-5">
      <PageHeader size="md" title="Donations" description="Donate, view the donor wall, and track amounts." />
      <Donations />
    </div>
  );
}
