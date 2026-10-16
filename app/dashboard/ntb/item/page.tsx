'use client';

import { Seo } from '@/components/seo';
import { NoticeDetail } from '@/components/modules/notice-detail';
import { useQueryParam } from '@/lib/use-query-param';

export default function DashboardNoticeItemPage() {
  const id = useQueryParam('id');
  return (
    <>
      <Seo title="নোটিশ" />
      <NoticeDetail noticeId={id} />
    </>
  );
}
