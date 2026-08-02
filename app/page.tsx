'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Music,
  ArrowRight,
  ExternalLink,
  Handshake,
  Bell,
  CalendarDays,
  Calendar,
  BarChart3,
  Sparkles,
  Heart,
  MapPin
} from 'lucide-react';
import { PublicNav, PublicFooter } from '@/components/layout/public-nav';
import { Seo } from '@/components/seo';
import { useEvents, useNotices, useDonorBoard, useAppConfig, useRealtimeInvalidate } from '@/lib/queries';
import { storageThumb } from '@/lib/supabase/client';
import { formatDate, truncate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal, RevealStagger, RevealItem, EASE } from '@/components/ui/motion';

const heroSection = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE }
};

export default function LandingPage() {
  const router = useRouter();
  const { data: events, isLoading: loadingEvents } = useEvents('all');
  const { data: notices } = useNotices();
  const { data: donors } = useDonorBoard();
  const { data: recruitment } = useAppConfig('recruitment_url');
  useRealtimeInvalidate('events', [['events']]);
  useRealtimeInvalidate('notices', [['notices']]);
  useRealtimeInvalidate('donations', [['donor-board'], ['donations']]);
  const recruitmentUrl = recruitment || process.env.NEXT_PUBLIC_RECRUITMENT_URL || 'https://example.com/recruitment';

  const upcoming = (events ?? []).filter((e) => e.status === 'upcoming').slice(0, 3);
  const pinned = (notices ?? []).filter((n) => n.is_pinned).slice(0, 3);
  const recentDonors = (donors ?? []).slice(0, 6);

  return (
    <>
      <Seo title="Provatferi" />
      <PublicNav />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-coffee-800 via-coffee-700 to-taupe-700 text-white">
          {/* Decorative texture + glow */}
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden />
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl animate-glow-pulse"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-sage-400/20 blur-3xl animate-glow-pulse"
            style={{ animationDelay: '1.5s' }}
            aria-hidden
          />

          <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
            <motion.div {...heroSection}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur">
                <Sparkles className="h-4 w-4" /> Celebrating music &amp; culture
              </span>
            </motion.div>
            <motion.h1
              className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-balance md:text-6xl"
              {...heroSection}
              transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            >
              Provatferi
            </motion.h1>
            <motion.p
              className="mt-4 max-w-xl text-lg leading-relaxed text-white/85"
              {...heroSection}
              transition={{ duration: 0.6, delay: 0.16, ease: EASE }}
            >
              A home for music, courses and community. Explore our events, follow our courses and stay
              connected with the club.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
            >
              <Button
                size="lg"
                className="bg-white text-coffee-700 shadow-lg shadow-black/10 hover:bg-cream-100 hover:shadow-xl hover:shadow-black/15"
                onClick={() => router.push('/events')}
              >
                Explore events <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="border border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/15 hover:text-white"
                onClick={() => router.push('/courses')}
              >
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
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <Reveal className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Upcoming events</h2>
              <p className="mt-1 text-sm text-muted-foreground">Programs and gatherings worth marking on your calendar.</p>
            </div>
            <Link href="/events" className="group flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all{' '}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
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
          <RevealStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <RevealItem key={e.id}>
                <Card className="group card-hover h-full overflow-hidden">
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {e.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={storageThumb(e.cover_image, 640)}
                        alt={e.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coffee-200 to-taupe-300 text-2xl font-bold text-coffee-700">
                        {truncate(e.title, 2)}
                      </div>
                    )}
                    <div className="absolute right-2 top-2">
                      <Badge variant="coffee" className="backdrop-blur capitalize">{e.status}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold leading-snug">{e.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" /> {formatDate(e.event_date)}
                    </p>
                    {e.location && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {e.location}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </RevealItem>
            ))}
          </RevealStagger>
        </section>

        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
            {[
              {
                href: '/calendar',
                icon: Calendar,
                title: 'Club calendar',
                desc: 'Meetings, events and rehearsals in one place.'
              },
              {
                href: '/notices',
                icon: Bell,
                title: 'Notice board',
                desc: 'Official announcements and updates.'
              },
              {
                href: '/insights',
                icon: BarChart3,
                title: 'Course insights',
                desc: 'Attendance trends for all six courses.'
              }
            ].map((c) => (
              <Reveal key={c.href}>
                <Link
                  href={c.href}
                  className="group flex h-full flex-col rounded-xl2 border border-border bg-card p-6 shadow-soft transition-all duration-300 ease-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-coffee-50 text-coffee-600 transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground dark:bg-coffee-900/40 dark:text-coffee-300">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {pinned.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-14">
            <Reveal className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Featured notices</h2>
            </Reveal>
            <RevealStagger className="grid gap-4 md:grid-cols-3">
              {pinned.map((n) => (
                <RevealItem key={n.id}>
                  <Card className="card-hover h-full border-l-4 border-l-amber-400">
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{n.title}</h3>
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{n.content}</p>
                    </CardContent>
                  </Card>
                </RevealItem>
              ))}
            </RevealStagger>
          </section>
        )}

        {recentDonors.length > 0 && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-6xl px-4 py-14">
              <Reveal className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Recent supporters</h2>
                <p className="mt-1 text-sm text-muted-foreground">The generous hearts keeping the music playing.</p>
              </Reveal>
              <RevealStagger className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {recentDonors.map((d) => (
                  <RevealItem key={d.id}>
                    <div className="flex h-full flex-col items-center rounded-xl2 border border-border bg-card p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coffee-50 text-coffee-600 dark:bg-coffee-900/40 dark:text-coffee-300">
                        <Heart className="h-5 w-5" />
                      </div>
                      <p className="mt-2 line-clamp-1 text-sm font-medium">{d.donor_name}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealStagger>
              <Reveal>
                <Link
                  href="/donate"
                  className="group mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Become a supporter{' '}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Reveal>
            </div>
          </section>
        )}

        <section className="relative overflow-hidden bg-gradient-to-br from-coffee-800 to-taupe-800 text-white">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" aria-hidden />
          <Reveal className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center">
            <motion.span
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur animate-float"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <Handshake className="h-7 w-7 text-white/90" />
            </motion.span>
            <h2 className="text-2xl font-bold md:text-3xl">Partner with Provatferi</h2>
            <p className="max-w-xl text-white/85">
              Reach a passionate community of musicians and culture lovers.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/sponsor"
                className="inline-flex h-11 items-center rounded-lg bg-white px-6 font-medium text-coffee-700 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cream-100 hover:shadow-xl"
              >
                Sponsor us
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center rounded-lg border border-white/30 px-6 font-medium transition-colors hover:bg-white/10"
              >
                Meet the committee
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
