'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Music,
  ArrowRight,
  ExternalLink,
  Handshake,
  Bell,
  CalendarDays,
  Calendar,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { useEvents, useNotices, useDonorBoard, useAppConfig } from '@/lib/queries';
import { storageThumb } from '@/lib/supabase/client';
import { formatDate, truncate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function LandingPage() {
  const router = useRouter();
  const { data: events, isLoading: loadingEvents } = useEvents('all');
  const { data: notices } = useNotices();
  const { data: donors } = useDonorBoard();
  const { data: recruitment } = useAppConfig('recruitment_url');
  const recruitmentUrl = recruitment || process.env.NEXT_PUBLIC_RECRUITMENT_URL || 'https://example.com/recruitment';

  const upcoming = (events ?? []).filter((e) => e.status === 'upcoming').slice(0, 3);
  const pinned = (notices ?? []).filter((n) => n.is_pinned).slice(0, 3);
  const recentDonors = (donors ?? []).slice(0, 6);

  return (
    <>
      <Seo title="Provatferi" />
      <PublicNav />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-coffee-700 via-coffee-600 to-taupe-600 text-white">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
              <Sparkles className="h-4 w-4" /> Celebrating music &amp; culture
            </span>
            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight md:text-6xl">
              Provatferi
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">
              A home for music, courses and community. Explore our events, follow our courses and stay
              connected with the club.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-coffee-700 hover:bg-cream-100" onClick={() => router.push('/events')}>
                Explore events <ArrowRight />
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={() => router.push('/courses')}>
                View courses
              </Button>
              <a
                href={recruitmentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/30 px-6 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4" /> Recruitment
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Upcoming events</h2>
            <Link href="/events" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loadingEvents && (
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full" />
              ))}
            </div>
          )}
          {!loadingEvents && upcoming.length === 0 && (
            <p className="text-muted-foreground">No upcoming events right now — check back soon.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            {upcoming.map((e) => (
              <Card key={e.id} className="card-hover overflow-hidden">
                <div className="relative aspect-video w-full bg-muted">
                  {e.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={storageThumb(e.cover_image, 640)} alt={e.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coffee-200 to-taupe-300 text-2xl font-bold text-coffee-700">
                      {truncate(e.title, 2)}
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <Badge variant="coffee" className="capitalize">{e.status}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{e.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(e.event_date)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
            <Link href="/calendar" className="group rounded-xl2 border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <Calendar className="h-7 w-7 text-coffee-600" />
              <h3 className="mt-3 font-semibold">Club calendar</h3>
              <p className="mt-1 text-sm text-muted-foreground">Meetings, events and rehearsals in one place.</p>
            </Link>
            <Link href="/notices" className="group rounded-xl2 border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <Bell className="h-7 w-7 text-coffee-600" />
              <h3 className="mt-3 font-semibold">Notice board</h3>
              <p className="mt-1 text-sm text-muted-foreground">Official announcements and updates.</p>
            </Link>
            <Link href="/insights" className="group rounded-xl2 border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <BarChart3 className="h-7 w-7 text-coffee-600" />
              <h3 className="mt-3 font-semibold">Course insights</h3>
              <p className="mt-1 text-sm text-muted-foreground">Attendance trends for all six courses.</p>
            </Link>
          </div>
        </section>

        {pinned.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="mb-6 text-2xl font-bold">Featured notices</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {pinned.map((n) => (
                <Card key={n.id} className="border-l-4 border-l-amber-400">
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{n.title}</h3>
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{n.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {recentDonors.length > 0 && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-6xl px-4 py-14">
              <h2 className="mb-6 text-2xl font-bold">Recent supporters</h2>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {recentDonors.map((d) => (
                  <div key={d.id} className="rounded-xl2 border border-border bg-card p-4 text-center shadow-soft">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-coffee-100 text-coffee-600">
                      <Music className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-sm font-medium">{d.donor_name}</p>
                  </div>
                ))}
              </div>
              <Link href="/donate" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Become a supporter <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        <section className="bg-gradient-to-br from-coffee-700 to-taupe-700 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center">
            <Handshake className="h-8 w-8 text-white/80" />
            <h2 className="text-2xl font-bold md:text-3xl">Partner with Provatferi</h2>
            <p className="max-w-xl text-white/85">
              Reach a passionate community of musicians and culture lovers.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/sponsor"
                className="inline-flex h-11 items-center rounded-lg bg-white px-6 font-medium text-coffee-700 hover:bg-cream-100"
              >
                Sponsor us
              </Link>
              <Link href="/contact" className="inline-flex h-11 items-center rounded-lg border border-white/30 px-6 font-medium hover:bg-white/10">
                Meet the committee
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
