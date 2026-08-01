'use client';

import { Gallery } from '@/components/modules/gallery';

export default function DashboardGalleryPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Gallery</h1>
        <p className="text-sm text-muted-foreground">Photos from club events and activities.</p>
      </div>
      <Gallery />
    </div>
  );
}
