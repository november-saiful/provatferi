'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { NoticeDetail } from '@/components/modules/notice-detail';
import { useQueryParam } from '@/lib/use-query-param';

export default function NoticeItemPage() {
  const id = useQueryParam('id');
  return (
    <PublicShell>
      <Seo title="Notice" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <NoticeDetail noticeId={id} />
      </div>
    </PublicShell>
  );
}
