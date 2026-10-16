'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { Donations } from '@/components/modules/donations';
import { PageHeader } from '@/components/ui/page-header';

export default function DonatePage() {
  return (
    <PublicShell>
      <Seo title="অনুদান" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="প্রভাতফেরীকে সহায়তা করুন" description="আপনার সহায়তা আমাদের সংগীত ও সংস্কৃতিকে বাঁচিয়ে রাখে।" />
        <Donations />
      </div>
    </PublicShell>
  );
}
