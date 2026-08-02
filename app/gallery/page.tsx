'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { Gallery } from '@/components/modules/gallery';
import { PageHeader } from '@/components/ui/page-header';

export default function GalleryPage() {
  return (
    <>
      <Seo title="Gallery" />
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="Gallery" description="Moments from our events and activities." />
        <Gallery />
      </main>
      <PublicFooter />
    </>
  );
}
