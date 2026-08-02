'use client';

import { Sponsors } from '@/components/modules/sponsors';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardSponsorsPage() {
  return (
    <div className="space-y-5">
      <PageHeader size="md" title="Sponsors" description="Sponsorship inquiries and partnerships." />
      <Sponsors />
    </div>
  );
}
