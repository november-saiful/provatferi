'use client';

import { Sponsors } from '@/components/modules/sponsors';

export default function DashboardSponsorsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Sponsors</h1>
        <p className="text-sm text-muted-foreground">Sponsorship inquiries and partnerships.</p>
      </div>
      <Sponsors />
    </div>
  );
}
