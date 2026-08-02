'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { NoticeBoard } from '@/components/modules/notice-board';
import { PageHeader } from '@/components/ui/page-header';

export default function NoticesPage() {
  return (
    <>
      <Seo title="Notices" />
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <PageHeader title="Notice board" description="Official announcements from the committee." />
        <NoticeBoard basePath="/notices" />
      </main>
      <PublicFooter />
    </>
  );
}
