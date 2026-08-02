'use client';

import { Gallery } from '@/components/modules/gallery';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardGalleryPage() {
  return (
    <div className="space-y-5">
      <PageHeader size="md" title="Gallery" description="Photos from club events and activities." />
      <Gallery />
    </div>
  );
}
