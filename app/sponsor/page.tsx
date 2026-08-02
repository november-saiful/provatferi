'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { Sponsors } from '@/components/modules/sponsors';
import { PageHeader } from '@/components/ui/page-header';

export default function SponsorPage() {
  return (
    <PublicShell>
      <Seo title="Sponsorship" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="Sponsorship" description="Partner with Provatferi to reach a passionate community." />
        <Sponsors />
      </div>
    </PublicShell>
  );
}
