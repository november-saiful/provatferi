'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Sparkles } from 'lucide-react';
import { storageThumb } from '@/lib/supabase/client';
import { renderMarkdown, truncate } from '@/lib/utils';
import type { EventItem } from '@/lib/types';
import {
  dateBox,
  compactDateTime,
  RsvpButtons,
  RsvpCount,
  StatusPill,
  useRsvp
} from '@/components/modules/event-shared';
import { AddToCalendar } from '@/components/ui/add-to-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { RevealStagger, RevealItem } from '@/components/ui/motion';
import { Avatar } from '@/components/ui/avatar';

function OverviewCard({ event }: { event: EventItem }) {
  const box = dateBox(event.event_date);
  return (
    <Link
      href={`/events/item?id=${event.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {event.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storageThumb(event.cover_image, 640)}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coffee-700 via-coffee-600 to-taupe-600 text-2xl font-bold text-white/90">
            {truncate(event.title, 2)}
          </div>
        )}
        {box && (
          <span className="absolute left-3 top-3 flex w-12 flex-col items-center rounded-lg bg-white px-1 py-1.5 text-center shadow-md">
            <span className="text-[9px] font-bold uppercase leading-none text-warmred-600">{box.month}</span>
            <span className="mt-0.5 text-lg font-bold leading-none text-foreground">{box.day}</span>
          </span>
        )}
        <span className="absolute bottom-3 left-3">
          <StatusPill status={event.status} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
          {event.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" aria-hidden />
          {compactDateTime(event.event_date)}
        </p>
        {event.location && (
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span className="line-clamp-1">{event.location}</span>
          </p>
        )}
        <div className="mt-3 flex items-center gap-2 border-t border-border/70 pt-3">
          <Avatar name={event.profiles?.full_name} src={event.profiles?.avatar_url} className="h-6 w-6 text-[9px]" />
          <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
            আয়োজনে <span className="font-semibold text-foreground">{event.profiles?.full_name ?? 'প্রভাতফেরী'}</span>
          </span>
          <RsvpCount eventId={event.id} />
          {event.event_date && (
            <AddToCalendar
              data={{
                title: event.title,
                description: event.description,
                location: event.location,
                startDate: event.event_date,
              }}
              size="icon"
            />
          )}
          <ArrowRight
            className="h-3.5 w-3.5 shrink-0 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}

export function EventOverview({ events, isLoading }: { events?: EventItem[]; isLoading: boolean }) {
  const upcoming = React.useMemo(() => (events ?? []).filter((e) => e.status === 'upcoming'), [events]);
  const featured = upcoming[0] ?? null;
  const rest = upcoming.slice(1, 4);
  const eventIds = React.useMemo(() => upcoming.map((e) => e.id), [upcoming]);
  const { rsvp, handleRsvp } = useRsvp(eventIds);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-72 w-full rounded-2xl lg:h-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border bg-muted/20 px-6 py-14 text-center">
        <p className="text-sm font-semibold">এখন কোনো আসন্ন ইভেন্ট নেই</p>
        <p className="mt-1 text-sm text-muted-foreground">শীঘ্রই নতুন প্রোগ্রাম ও সমাবেশ যোগ হবে — আবার দেখুন।</p>
        <Link
          href="/events"
          className="group mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          সব ইভেন্ট দেখুন
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Featured upcoming event hero ── */}
      {featured && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg lg:grid lg:grid-cols-[1.35fr_1fr]">
          <Link
            href={`/events/item?id=${featured.id}`}
            className="group relative block aspect-[16/9] overflow-hidden bg-muted sm:aspect-[21/10] lg:h-full lg:aspect-auto lg:min-h-72"
          >
            {featured.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storageThumb(featured.cover_image, 1200)}
                alt={featured.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coffee-800 via-coffee-700 to-taupe-700 px-6 text-center text-2xl font-bold text-white sm:text-3xl">
                {featured.title}
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <p className="text-[11px] font-semibold tracking-wide text-white/80">বৈশিষ্ট্যযুক্ত ইভেন্ট</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">{featured.title}</h3>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/85">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {compactDateTime(featured.event_date)}
                </span>
                {featured.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {featured.location}
                  </span>
                )}
              </p>
            </div>
          </Link>

          {/* Hero side panel */}
          <div className="flex flex-col justify-center gap-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100/80 px-2.5 py-1 text-[10px] font-bold text-gold-700 dark:bg-gold-900/50 dark:text-gold-300">
                <Sparkles className="h-3 w-3" aria-hidden />
                বৈশিষ্ট্যযুক্ত
              </span>
              <StatusPill status={featured.status} />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">{featured.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {compactDateTime(featured.event_date)}
                {featured.location && <> · {featured.location}</>}
              </p>
            </div>
            {featured.description && (
              <div
                className="line-clamp-2 text-sm leading-relaxed text-muted-foreground [&_p]:m-0 [&_p]:inline"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(featured.description) }}
              />
            )}
            <div className="flex items-center gap-2">
              <Avatar name={featured.profiles?.full_name} src={featured.profiles?.avatar_url} className="h-7 w-7 text-[10px]" />
              <span className="text-xs text-muted-foreground">
                আয়োজনে <span className="font-semibold text-foreground">{featured.profiles?.full_name ?? 'প্রভাতফেরী'}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
              <RsvpButtons eventId={featured.id} rsvp={rsvp} onToggle={handleRsvp} compact />
              <RsvpCount eventId={featured.id} />
              {featured.event_date && (
                <AddToCalendar
                  data={{
                    title: featured.title,
                    description: featured.description,
                    location: featured.location,
                    startDate: featured.event_date,
                  }}
                  size="xs"
                  variant="ghost"
                />
              )}
              <Link
                href={`/events/item?id=${featured.id}`}
                className="group/link ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                বিস্তারিত দেখুন
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Remaining upcoming events ── */}
      {rest.length > 0 && (
        <RevealStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((event) => (
            <RevealItem key={event.id} className="h-full">
              <OverviewCard event={event} />
            </RevealItem>
          ))}
        </RevealStagger>
      )}
    </div>
  );
}
