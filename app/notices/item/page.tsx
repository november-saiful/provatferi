'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { NoticeDetail } from '@/components/modules/notice-detail';
import { useQueryParam } from '@/lib/use-query-param';

export default function NoticeItemPage() {
  const id = useQueryParam('id');
  return (
    <>
      <Seo title="Notice" />
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <NoticeDetail noticeId={id} />
      </main>
      <PublicFooter />
    </>
  );
}
