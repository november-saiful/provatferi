'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { NoticeDetail } from '@/components/modules/notice-detail';
import { useQueryParam } from '@/lib/use-query-param';

export default function NoticeItemPage() {
  const id = useQueryParam('id');
  return (
    <PublicShell>
      <Seo title="নোটিশ" />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <NoticeDetail noticeId={id} basePath="/notices" />
      </div>
    </PublicShell>
  );
}
