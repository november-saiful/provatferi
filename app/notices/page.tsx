'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { NoticeBoard } from '@/components/modules/notice-board';

export default function NoticesPage() {
  return (
    <>
      <Seo title="Notices" />
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Notice board</h1>
          <p className="mt-1 text-muted-foreground">Official announcements from the committee.</p>
        </div>
        <NoticeBoard basePath="/notices" />
      </main>
      <PublicFooter />
    </>
  );
}
