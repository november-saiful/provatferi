'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { Donations } from '@/components/modules/donations';

export default function DonatePage() {
  return (
    <>
      <Seo title="Donate" />
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Support Provatferi</h1>
          <p className="mt-1 text-muted-foreground">Your support keeps our music and culture alive.</p>
        </div>
        <Donations />
      </main>
      <PublicFooter />
    </>
  );
}
