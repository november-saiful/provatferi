'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { Sponsors } from '@/components/modules/sponsors';

export default function SponsorPage() {
  return (
    <>
      <Seo title="Sponsorship" />
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Sponsorship</h1>
          <p className="mt-1 text-muted-foreground">Partner with Provatferi to reach a passionate community.</p>
        </div>
        <Sponsors />
      </main>
      <PublicFooter />
    </>
  );
}
