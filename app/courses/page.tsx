'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { Courses } from '@/components/modules/courses';

export default function CoursesPage() {
  return (
    <>
      <Seo title="Courses" />
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Music courses</h1>
          <p className="mt-1 text-muted-foreground">Class attendance for violin, guitar, ukulele, vocal and flute.</p>
        </div>
        <Courses />
      </main>
      <PublicFooter />
    </>
  );
}
