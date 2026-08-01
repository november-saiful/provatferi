'use client';

import { Donations } from '@/components/modules/donations';

export default function DashboardDonationsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Donations</h1>
        <p className="text-sm text-muted-foreground">Donate, view the donor wall, and track amounts.</p>
      </div>
      <Donations />
    </div>
  );
}
