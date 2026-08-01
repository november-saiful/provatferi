'use client';

import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { EventForum } from '@/components/modules/event-forum';

export default function EventsPage() {
  return (
    <>
      <Seo title="Events" />
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="mt-1 text-muted-foreground">Programs, workshops and gatherings of Provatferi.</p>
        </div>
        <EventForum basePath="/events" />
      </main>
      <PublicFooter />
    </>
  );
}
