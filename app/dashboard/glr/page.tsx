'use client';

import { Gallery } from '@/components/modules/gallery';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardGalleryPage() {
  return (
    <div className="space-y-5">
      <PageHeader size="md" title="গ্যালারি" description="ক্লাব ইভেন্ট ও কার্যক্রমের ছবি।" />
      <Gallery />
    </div>
  );
}
