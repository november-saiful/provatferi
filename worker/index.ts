/**
 * Provatferi unified Worker — serves both static sites from ./dist
 * (dashboard at /, recruitment at /recruitment) plus live API routes.
 *
 * API routes:
 *   GET  /api/calendar.ics        iCalendar feed of upcoming public events
 *   GET  /api/health,
 *        /api/recruitment/health   warm-up probe
 *   POST /api/recruitment/submit,
 *        /api/submit               course/member registration + invoice PDF
 *        (legacy /api/submit kept for cached clients)
 */

import * as Sentry from '@sentry/cloudflare';
import {
  generateClientInvoice,
  generateAdminInvoice,
  generateMemberInvoice,
} from './recruitment-invoice';
import logoBytes from './logo';
import {
  getFullAmount,
  isDuStudentFlag,
  validateRegistration,
} from '../apps/dashboard/lib/recruitment';

export interface Env {
  ASSETS: Fetcher;
  /** Sentry DSN (Worker secret). Unset = error reporting disabled. */
  SENTRY_DSN?: string;
  APPS_SCRIPT_URL?: string;
  GOOGLE_SHEET_ID?: string;
  GOOGLE_DRIVE_FOLDER_ID?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

// Public anon key — safe to fall back to the baked-in value.
const DEFAULT_SUPABASE_URL = 'https://uvilejtfmjykahnkujcm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aWxlanRmbWp5a2Fobmt1amNtIiwicm9zZSI6ImFub24iLCJpYXQiOjE3ODU1ODE3MjgsImV4cCI6MjEwMTE1NzcyOH0.76TVV52Kkk4FszDgvK2IWYV896dgOYZ2HNz8gpAVOBo';

// ── iCalendar helpers (mirror apps/dashboard/lib/calendar-utils.ts) ───────

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
function vevent(e: {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
}): string {
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
    lines.push(`DESCRIPTION:${escapeIcsText(stripHtml(e.description))}`);
  }

  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

async function calendarFeed(env: Env): Promise<string> {
  const base = env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  const url = new URL(`${base}/rest/v1/events`);
  // Only upcoming events with a date, soonest first, public anon access.
  url.searchParams.set('status', 'eq.upcoming');
  url.searchParams.set('event_date', 'not.is.null');
  url.searchParams.set('order', 'event_date.asc');
  url.searchParams.set('select', 'id,title,description,event_date,location');

  const res = await fetch(url.toString(), {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    console.error('Supabase events fetch failed:', res.status);
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

// ── Recruitment submit (ported from the original standalone app) ──────────

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function callAppsScript(env: Env, payload: unknown): Promise<any> {
  const url = env.APPS_SCRIPT_URL;
  if (!url) return null;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await resp.json();
  } catch (e: any) {
    console.error('Apps Script call failed:', e?.message || e);
    return null;
  }
}

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const supabaseBase = (env: Env) => env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = (env: Env) => env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

/**
 * Mirrors the dashboard's recruitment phase gate (app_config, migration 00044)
 * so a cached page or a direct POST cannot register while the phase is closed.
 * Fails open: a Supabase hiccup must never block real registrations.
 */
async function isRecruitmentClosed(env: Env): Promise<boolean> {
  try {
    const res = await fetch(
      `${supabaseBase(env)}/rest/v1/app_config?select=key,value&key=in.(recruitment_enabled,recruitment_starts_at,recruitment_ends_at)`,
      {
        headers: {
          apikey: supabaseKey(env),
          Authorization: `Bearer ${supabaseKey(env)}`,
        },
      }
    );
    if (!res.ok) return false;
    const rows = (await res.json()) as Array<{ key: string; value: string | null }>;
    const map = new Map(rows.map((r) => [r.key, r.value ?? '']));

    if ((map.get('recruitment_enabled') ?? 'true').trim().toLowerCase() === 'false') {
      return true;
    }
    const now = Date.now();
    const start = Date.parse(map.get('recruitment_starts_at') || '');
    const end = Date.parse(map.get('recruitment_ends_at') || '');
    if (!Number.isNaN(start) && now < start) return true;
    if (!Number.isNaN(end) && now > end) return true;
    return false;
  } catch (error) {
    console.error('Recruitment phase check failed (failing open):', error);
    return false;
  }
}

async function handleRecruitmentSubmit(request: Request, env: Env): Promise<Response> {
  try {
    if (await isRecruitmentClosed(env)) {
      return json({ error: 'রিক্রুটমেন্ট বর্তমানে বন্ধ রয়েছে।' }, 403);
    }

    const body = await request.json();
    const {
      name,
      address,
      phone,
      service,
      amount,
      isDuStudent,
      academicSession,
      department,
      hallName,
      duRegistrationId,
      paymentMethod,
      transactionId,
      fullAmount,
      formMode,
    } = body;

    const isMember = formMode === 'member';
    const courseName = isMember ? 'N/A' : service;

    // Same rules as the client form (shared module) — never trust the browser.
    const errors = validateRegistration({
      name: name ?? '',
      address: address ?? '',
      phone: phone ?? '',
      service: service ?? '',
      isDuStudent: isDuStudent ?? false,
      academicSession: academicSession ?? '',
      department: department ?? '',
      hallName: hallName ?? '',
      duRegistrationId: duRegistrationId ?? '',
      paymentMethod: paymentMethod ?? '',
      transactionId: transactionId ?? '',
      formMode: formMode ?? null,
    });
    const firstError = Object.values(errors)[0];
    if (firstError) return json({ error: firstError }, 400);

    // Recompute the fee server-side instead of trusting the client's total.
    const expectedFull = getFullAmount(formMode, isDuStudentFlag(isDuStudent ?? false));

    // Step 1: Get invoice ID from Apps Script
    const idResult = await callAppsScript(env, {
      action: 'getId',
      isMember,
      sheetId: env.GOOGLE_SHEET_ID,
    });
    const invoiceId =
      idResult?.invoiceId || (isMember ? 'M01' : `${new Date().getFullYear()}01`);

    const timestamp = new Date().toISOString();
    const logo = logoBytes();

    const baseInvoiceData = {
      name,
      email: isMember ? '' : address,
      phone,
      service: courseName,
      amount: Number(amount),
      invoiceId,
      serialNumber: invoiceId,
      timestamp,
      isDuStudent: isMember ? true : Boolean(isDuStudent),
      academicSession: academicSession || '',
      department: department || '',
      hallName: hallName || '',
      duRegistrationId: duRegistrationId || '',
      paymentMethod,
      transactionId,
      paymentType: 'full',
      fullAmount: expectedFull,
    };

    let clientPdfBytes: Uint8Array;
    let adminPdfBytes: Uint8Array | null = null;
    let attachmentFilename: string;

    if (isMember) {
      clientPdfBytes = await generateMemberInvoice(baseInvoiceData, logo);
      adminPdfBytes = await generateAdminInvoice(baseInvoiceData, logo);
      attachmentFilename = `member-${invoiceId}-admin.pdf`;
    } else {
      clientPdfBytes = await generateClientInvoice(baseInvoiceData, logo);
      adminPdfBytes = await generateAdminInvoice(baseInvoiceData, logo);
      attachmentFilename = `invoice-${invoiceId}-admin.pdf`;
    }

    // Step 2: Send PDF + data to Apps Script for sheet append + Drive upload.
    // Awaited so the Worker isn't terminated mid-write.
    const saveResult = await callAppsScript(env, {
      action: 'save',
      isMember,
      invoiceId,
      name,
      address,
      phone,
      service,
      amount,
      isDuStudent,
      academicSession,
      department,
      hallName,
      duRegistrationId,
      paymentMethod,
      transactionId,
      fullAmount: expectedFull,
      formMode,
      sheetId: env.GOOGLE_SHEET_ID,
      folderId: env.GOOGLE_DRIVE_FOLDER_ID,
      pdfBase64: adminPdfBytes ? uint8ToBase64(adminPdfBytes) : null,
      filename: attachmentFilename,
    });
    if (!saveResult?.success) {
      console.error('Save to sheet/Drive failed:', JSON.stringify(saveResult));
    }

    return new Response(clientPdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoiceId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Submit error:', error);
    return json(
      { error: error?.message || 'সার্ভার প্রক্রিয়াকরণে সমস্যা হয়েছে।' },
      500
    );
  }
}

// ── Static assets ──────────────────────────────────────────────────────────

async function tryAssets(env: Env, paths: string[]): Promise<Response | null> {
  for (const p of paths) {
    const res = await env.ASSETS.fetch(p);
    if (res.status === 200) return res;
  }
  return null;
}

// ── Main handler ───────────────────────────────────────────────────────────

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── API: calendar feed ──
    if (path === '/api/calendar.ics' || path === '/api/calendar.ics/') {
      try {
        const ics = await calendarFeed(env);
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

    // ── API: health probes ──
    if (path === '/api/health' || path === '/api/recruitment/health') {
      return json({ ok: true });
    }

    // ── API: recruitment submit (legacy /api/submit kept for cached pages) ──
    if (
      request.method === 'POST' &&
      (path === '/api/recruitment/submit' || path === '/api/submit')
    ) {
      return handleRecruitmentSubmit(request, env);
    }

    // ── Recruitment app under /recruitment ──
    if (path === '/recruitment' || path === '/recruitment/') {
      return env.ASSETS.fetch('/recruitment/index.html');
    }
    if (path.startsWith('/recruitment/')) {
      const hit = await tryAssets(env, [path, `${path}/index.html`]);
      if (hit) return hit;
      return env.ASSETS.fetch('/recruitment/index.html');
    }

    // ── Dashboard (site root, SPA fallback) ──
    const hit = await tryAssets(env, [path, `${path}/index.html`]);
    if (hit) return hit;
    return env.ASSETS.fetch('/index.html');
  },
};

export default Sentry.withSentry(
  (env: Env) => ({
    // Unset secret = SDK disabled, handler runs normally.
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 0,
  }),
  handler
);
