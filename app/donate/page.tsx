'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { Donations } from '@/components/modules/donations';
import { PageHeader } from '@/components/ui/page-header';

export default function DonatePage() {
  return (
    <PublicShell>
      <Seo title="Donate" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="Support Provatferi" description="Your support keeps our music and culture alive." />
        <Donations />
      </div>
    </PublicShell>
  );
}
