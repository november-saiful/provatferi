'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { Gallery } from '@/components/modules/gallery';

export default function GalleryPage() {
  return (
    <>
      <Seo title="Gallery" />
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Gallery</h1>
          <p className="mt-1 text-muted-foreground">Moments from our events and activities.</p>
        </div>
        <Gallery />
      </main>
      <PublicFooter />
    </>
  );
}
