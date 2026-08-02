'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { Sponsors } from '@/components/modules/sponsors';
import { PageHeader } from '@/components/ui/page-header';

export default function SponsorPage() {
  return (
    <>
      <Seo title="Sponsorship" />
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="Sponsorship" description="Partner with Provatferi to reach a passionate community." />
        <Sponsors />
      </main>
      <PublicFooter />
    </>
  );
}
