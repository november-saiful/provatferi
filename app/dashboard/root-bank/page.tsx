'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Seo } from '@/components/seo';
import { RootBank } from '@/components/modules/root-bank';
import { PageHeader } from '@/components/ui/page-header';

export default function RootBankPage() {
  return (
    <RoleGuard allowedRoles={['root', 'pr', 'admin']}>
      <div className="space-y-5">
        <Seo title="রুট ব্যাংক" />
        <PageHeader
          size="md"
          title="রুট ব্যাংক"
          description="ক্লাব বাজেট থেকে আলাদা একটি স্বাধীন বাজেট–ব্যয়–ব্যালেন্স ব্যবস্থা — শুধুমাত্র রুট, সভাপতি ও অ্যাডমিনের জন্য।"
        />
        <RootBank />
      </div>
    </RoleGuard>
  );
}
