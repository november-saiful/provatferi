'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { Gallery } from '@/components/modules/gallery';
import { PageHeader } from '@/components/ui/page-header';

export default function GalleryPage() {
  return (
    <PublicShell>
      <Seo title="গ্যালারি" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="গ্যালারি" description="আমাদের ইভেন্ট ও কার্যক্রমের মুহূর্তগুলো।" />
        <Gallery />
      </div>
    </PublicShell>
  );
}
