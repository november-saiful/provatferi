/**
 * Cloudflare Worker — static-asset fallback for the Next.js export.
 *
 * Also serves a live iCalendar (.ics) feed at /api/calendar.ics so users
 * can subscribe to all upcoming events in their preferred calendar app
 * (Google Calendar, Apple Calendar, Outlook, etc.).
 *
 * The feed is generated at request-time by querying Supabase's REST API
 * with the public anon key — no server-side auth needed for public data.
 */

export interface Env {
  ASSETS: Fetcher;
}

// ── Config (public anon key, safe to hardcode) ──────────────────────────
const SUPABASE_URL = 'https://uvilejtfmjykahnkujcm.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aWxlanRmbWp5a2Fobmt1amNtIiwicm9zZSI6ImFub24iLCJpYXQiOjE3ODU1ODE3MjgsImV4cCI6MjEwMTE1NzcyOH0.76TVV52Kkk4FszDgvK2IWYV896dgOYZ2HNz8gpAVOBo';

// ── iCalendar helpers (inlined from lib/calendar-utils.ts) ──────────────

/** iCalendar local datetime: YYYYMMDDTHHmmss (floating / no timezone). */
function toIcsDateTime(date: Date): string {
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const D = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${Y}${M}${D}T${h}${m}${s}`;
}

/** Escape text values per RFC 5545 §3.3.11. */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Strip HTML tags. */
function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').trim();
}

/** Generate one VEVENT block for an upcoming event. */
function vevent(e: { id: string; title: string; description: string | null; event_date: string; location: string | null }): string {
  const start = new Date(e.event_date);
  if (Number.isNaN(start.getTime())) return '';
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const lines: string[] = [
    'BEGIN:VEVENT',
    `DTSTART:${toIcsDateTime(start)}`,
    `DTEND:${toIcsDateTime(end)}`,
    `SUMMARY:${escapeIcsText(e.title)}`,
    // Stable UID so calendar apps can update existing events on re-fetch.
    `UID:${e.id}@provatferi.org`,
    `DTSTAMP:${toIcsDateTime(new Date())}`,
  ];

  if (e.location) lines.push(`LOCATION:${escapeIcsText(e.location)}`);
  if (e.description) {
    const desc = escapeIcsText(stripHtml(e.description));
    lines.push(`DESCRIPTION:${desc}`);
  }

  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

// ── Feed builder ─────────────────────────────────────────────────────────

async function calendarFeed(): Promise<string> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/events`);
  // Only upcoming events with a date, newest first, with anon key for public access.
  url.searchParams.set('status', 'eq.upcoming');
  url.searchParams.set('event_date', 'not.is.null');
  url.searchParams.set('order', 'event_date.asc');
  url.searchParams.set('select', 'id,title,description,event_date,location');

  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    console.error('Supabase events fetch failed:', res.status, await res.text().catch(() => ''));
    throw new Error(`Supabase fetch failed with status ${res.status}`);
  }

  const events = (await res.json()) as Array<{
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    location: string | null;
  }>;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Provatferi//Calendar//BN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:প্রভাতফেরী — আসন্ন ইভেন্ট',
    'X-WR-CALDESC:ঢাকা বিশ্ববিদ্যালয় প্রভাতফেরী সাংস্কৃতিক সংসদের আসন্ন ইভেন্ট।',
    'X-PUBLISHED-TTL:PT1H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ];

  for (const e of events) {
    const block = vevent(e);
    if (block) lines.push(block);
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// ── Main handler ─────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ── iCalendar feed ──
    if (url.pathname === '/api/calendar.ics' || url.pathname === '/api/calendar.ics/') {
      try {
        const ics = await calendarFeed();
        return new Response(ics, {
          headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'inline; filename="provatferi-events.ics"',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        });
      } catch (err) {
        console.error('Calendar feed error:', err);
        return new Response('Calendar feed temporarily unavailable.', { status: 502 });
      }
    }

    // ── Static assets (default behaviour) ──
    const asset = await env.ASSETS.fetch(url.pathname);

    if (asset.status === 200) {
      return asset;
    }

    // SPA fallback
    return env.ASSETS.fetch('/index.html');
  }
};
