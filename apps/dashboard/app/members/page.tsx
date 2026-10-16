'use client';

import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { PageHeader } from '@/components/ui/page-header';
import { MemberDirectory } from '@/components/modules/member-directory';
import { AlumniClaimCard } from '@/components/modules/alumni-claim';

export default function MembersPage() {
  return (
    <PublicShell>
      <Seo title="সদস্য ডিরেক্টরি" />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <PageHeader
          title="সদস্য ডিরেক্টরি"
          description="বর্তমান কমিটি ও প্রাক্তন সদস্যবৃন্দ — নাম, ভূমিকা ও যোগাযোগের তথ্যসহ সম্পূর্ণ তালিকা।"
        />
        <MemberDirectory />
        <AlumniClaimCard />
      </div>
    </PublicShell>
  );
}
