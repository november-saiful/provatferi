'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Handshake,
  Bell,
  Calendar,
  BarChart3,
  UserPlus,
  Heart,
  Star,
  Sparkles
} from 'lucide-react';
import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { useEvents, useNotices, useDonorBoard } from '@/lib/queries';
import { RECRUITMENT_URL } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Reveal, RevealStagger, RevealItem, EASE } from '@/components/ui/motion';
import { AlbumSlider } from '@/components/modules/album-slider';
import { NoticeWall } from '@/components/modules/notice-wall';
import { EventOverview } from '@/components/modules/event-overview';
import dynamic from 'next/dynamic';

const TaskCalendarView = dynamic(
  () => import('@/components/modules/task-calendar-view').then((m) => m.TaskCalendarView),
  { ssr: false, loading: () => <div className="h-[50vh] w-full animate-pulse rounded-xl bg-muted" /> }
);

const heroSection = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: EASE }
};

export default function LandingPage() {
  const router = useRouter();
  const { data: events, isLoading: loadingEvents } = useEvents('all');
  const { data: notices, isLoading: loadingNotices, isError: noticesError } = useNotices();
  const { data: donors } = useDonorBoard();
  const recruitmentUrl = RECRUITMENT_URL;

  const recentDonors = (donors ?? []).slice(0, 6);

  return (
    <PublicShell>
      <Seo title="প্রভাতফেরী সাংস্কৃতিক সংসদ, ঢাকা বিশ্ববিদ্যালয়" />
      <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6 lg:-mx-8 lg:-mt-8">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-coffee-900 via-coffee-800 to-taupe-800 text-white">
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden />
          <div
            className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-amber-400/15 blur-[100px] animate-glow-pulse"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-40 -left-20 h-[400px] w-[400px] rounded-full bg-sage-400/12 blur-[100px] animate-glow-pulse"
            style={{ animationDelay: '2s' }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/8 blur-[120px]"
            aria-hidden
          />

          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16 md:py-20 lg:py-24">
            <motion.div {...heroSection} className="flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-gold-400" />
                <span className="text-white/90"> শিকড়ের সন্ধানে দিনবদলের  আহ্বানে</span>
              </span>
            </motion.div>
            <motion.h1
              className="mt-8 text-center text-4xl font-extrabold leading-[1.1] tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl"
              {...heroSection}
              transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
            >
              <span className="bg-gradient-to-r from-white via-cream-200 to-gold-300 bg-clip-text text-transparent">
              ঢাকা বিশ্ববিদ্যালয় প্রভাতফেরী সাংস্কৃতিক সংসদ
              </span>
            </motion.h1>
            <motion.p
              className="mx-auto mt-6 max-w-xl text-center text-lg leading-relaxed text-white/75 md:text-xl"
              {...heroSection}
              transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            >
              বাঙালি সঙ্গীত, জীবনধারা ও সংস্কৃতির অঙ্গীকার <br/> আমাদের কোর্স ও ইভেন্টগুলো জানতে সংযুক্ত থাকুন
            </motion.p>
            <motion.div
              className="mt-10 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.18, ease: EASE }}
            >
              <AlbumSlider />
            </motion.div>
            <motion.div
              className="mt-8 flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
            >
              <Button
                size="lg"
                className="bg-white text-coffee-800 shadow-xl shadow-black/20 hover:bg-cream-100 hover:shadow-2xl hover:shadow-black/25"
                onClick={() => router.push('/events')}
              >
                ইভেন্ট দেখুন <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="border-2 border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/12 hover:text-white hover:border-white/35"
                onClick={() => router.push('/courses')}
              >
                কোর্স দেখুন
              </Button>
              <a
                href={recruitmentUrl}
                className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-gold-400/30 bg-gold-500/10 px-6 text-base font-semibold text-gold-300 transition-all duration-300 hover:bg-gold-500/20 hover:border-gold-400/50 hover:-translate-y-0.5"
              >
                <UserPlus className="h-4 w-4" /> রিক্রুটমেন্ট
              </a>
            </motion.div>
          </div>
        </section>

        {/* ── Events Overview ── */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <Reveal className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-accent" />
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">ইভেন্ট</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                আসন্ন প্রোগ্রাম, ওয়ার্কশপ ও সমাবেশের ওভারভিউ।
              </p>
            </div>
            <Link
              href="/events"
              className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              সব দেখুন
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <EventOverview events={events} isLoading={loadingEvents} />
        </section>

        {/* ── Tasks Overview ── */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <Reveal className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 to-primary" />
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">টাস্ক</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                ক্লাবের কাজের তালিকা ও দায়িত্ব বণ্টন।
              </p>
            </div>
            <Link
              href="/tasks"
              className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              সব দেখুন
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <TaskCalendarView />
        </section>

        {/* ── Quick Links ── */}
        <section className="relative overflow-hidden border-y border-border bg-gradient-to-br from-muted/60 via-background to-muted/40">
          <div className="pointer-events-none absolute inset-0 bg-grid-subtle" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl gap-5 px-4 py-16 md:grid-cols-3">
            {[
              { href: '/calendar', icon: Calendar, title: 'ক্লাব ক্যালেন্ডার', desc: 'সভা, ইভেন্ট ও রিহার্সাল এক জায়গায়।' },
              { href: '/notices', icon: Bell, title: 'নোটিশ বোর্ড', desc: 'অফিসিয়াল ঘোষণা ও আপডেট।' },
              { href: '/insights', icon: BarChart3, title: 'কোর্স বিশ্লেষণ', desc: 'ছয়টি কোর্সের হাজিরার প্রবণতা।' }
            ].map((c) => (
              <Reveal key={c.href}>
                <Link
                  href={c.href}
                  className="group flex h-full flex-col rounded-2xl border-2 border-border bg-card p-7 shadow-sm transition-all duration-400 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-xl"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-coffee-100 to-coffee-200 text-coffee-600 transition-all duration-400 group-hover:from-primary group-hover:to-accent group-hover:text-white group-hover:shadow-glow dark:from-coffee-900/60 dark:to-coffee-800/60 dark:text-coffee-400">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── The Wall ── */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <Reveal>
            <NoticeWall
              notices={(notices ?? []).filter((notice) => notice.is_pinned)}
              isLoading={loadingNotices}
              isError={noticesError}
              limit={5}
            />
          </Reveal>
        </section>

        {/* ── Recent Donors ── */}
        {recentDonors.length > 0 && (
          <section className="border-t border-border bg-muted/20">
            <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
              <Reveal className="mb-8">
                <div className="mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-warmred-400 to-coffee-400" />
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">সম্প্রতি সহায়তাকারীরা</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  সংগীতকে বাঁচিয়ে রাখা উদার হৃদয়গুলো।
                </p>
              </Reveal>
              <RevealStagger className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {recentDonors.map((d) => (
                  <RevealItem key={d.id} className="min-w-0">
                    <div className="flex h-full flex-col items-center rounded-2xl border-2 border-border bg-card p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-lg">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-warmred-100 to-coffee-100 text-coffee-600 dark:from-coffee-900/60 dark:to-warmred-900/40 dark:text-coffee-400">
                        <Heart className="h-5 w-5" />
                      </div>
                      <p className="mt-3 line-clamp-1 text-sm font-semibold">{d.donor_name}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealStagger>
              <Reveal className="mt-8 text-center">
                <Link
                  href="/donate"
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  সহায়তাকারী হোন
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Reveal>
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-coffee-900 via-coffee-800 to-taupe-800 text-white">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-35" aria-hidden />
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-amber-400/10 blur-[80px] animate-glow-pulse"
            aria-hidden
          />
          <Reveal className="relative mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center md:py-20">
            <motion.span
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/8 backdrop-blur-sm animate-float"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <Handshake className="h-7 w-7 text-white/80" />
            </motion.span>
            <h2 className="text-2xl font-bold md:text-4xl">প্রভাতফেরীর সাথে অংশীদার হোন</h2>
            <p className="max-w-lg text-white/70 text-base">
              সংগীতশিল্পী ও সংস্কৃতিপ্রেমীদের একটি আবেগী কমিউনিটিতে পৌঁছান।
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/sponsor"
                className="inline-flex h-12 items-center rounded-xl bg-white px-7 font-semibold text-coffee-800 shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cream-100 hover:shadow-2xl"
              >
                স্পনসর করুন
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center rounded-xl border-2 border-white/25 px-7 font-semibold transition-all duration-300 hover:bg-white/10 hover:border-white/40"
              >
                কমিটির সাথে দেখা করুন
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </PublicShell>
  );
}
