'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useGallery, useRealtimeInvalidate } from '@/lib/queries';
import { storageThumb } from '@/lib/supabase/client';

const MAX_ALBUMS = 10;

/**
 * 3D infinite album slider for the landing hero.
 *
 * Every gallery "album" is an event (gallery_items.event_id), so this picks
 * the most recent photo from each album and streams them along a conveyor.
 * The animation math mirrors the classic 3D carousel: cards travel across the
 * section on a `--dur` timer with staggered negative delays, so at any moment
 * the cards are evenly spaced along the path and the center card scales up.
 * Each card deep-links to its album: /gallery?event=<id> (the Gallery module
 * reads that param to pre-filter).
 */
export function AlbumSlider() {
  const { data: items, isLoading } = useGallery();
  useRealtimeInvalidate('gallery_items', [['gallery']]);

  const photos = useMemo(() => {
    // Group all images by album (event_id).
    const albumMap = new Map<
      string,
      Array<{ id: string; image_url: string; title: string; event_id: string | null }>
    >();
    for (const item of items ?? []) {
      if (!item.image_url) continue;
      const key = item.event_id ?? 'general';
      const entry = {
        id: item.id,
        image_url: item.image_url,
        title: item.events?.title ?? item.title ?? 'গ্যালারি',
        event_id: item.event_id
      };
      const list = albumMap.get(key);
      if (list) list.push(entry);
      else albumMap.set(key, [entry]);
    }
    // Pick a random photo from each album.
    const result: Array<{ id: string; image_url: string; title: string; event_id: string | null }> = [];
    for (const photos of Array.from(albumMap.values())) {
      if (result.length >= MAX_ALBUMS) break;
      result.push(photos[Math.floor(Math.random() * photos.length)]);
    }
    return result;
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-36 w-28 animate-pulse rounded-2xl bg-white/10" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) return null;

  const num = photos.length;
  // 1s per card (quadrupled back from the fast 0.25s pace); cards stay evenly
  // spaced because the stagger delays scale with --dur too.
  const dur = Math.max(num, 4);

  return (
    <div
      className="album-slider w-full max-w-4xl px-1 sm:px-4"
      style={{ '--num': num, '--dur': `${dur}s` } as CSSProperties}
    >
      <ul className="album-gallery">
        {photos.map((p, i) => (
          <li key={p.id} className="card" style={{ '--timer': i + 1 } as CSSProperties}>
            <Link
              href={p.event_id ? `/gallery?event=${p.event_id}` : '/gallery'}
              aria-label={p.title}
              title={p.title}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={storageThumb(p.image_url, 640)} alt={p.title} loading="lazy" decoding="async" />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/gallery"
        className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 transition-colors duration-300 hover:text-white"
      >
        সব ছবি দেখুন
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
