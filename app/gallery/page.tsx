'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { Gallery } from '@/components/modules/gallery';

export default function GalleryPage() {
  return (
    <PublicShell>
      <Seo title="গ্যালারি" />
      <Gallery />
    </PublicShell>
  );
}
