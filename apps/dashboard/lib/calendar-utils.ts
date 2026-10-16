/**
 * Client-side iCalendar (.ics) generation & Google Calendar link builder.
 *
 * Used by the AddToCalendar button on events, notices, and any entity that
 * carries a date. No backend — everything runs in the browser.
 */

// ── Format helpers ───────────────────────────────────────────────────────

/** iCalendar local datetime: YYYYMMDDTHHmmss (floating / no timezone). */
function toIcsDateTime(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    // Fall back to a known-safe timestamp so downstream consumers don't
    // produce broken .ics files.
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}T000000`;
  }
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const D = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${Y}${M}${D}T${h}${m}${s}`;
}

/** Strip HTML tags – safe enough for plain-text calendar descriptions. */
function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').trim();
}

/**
 * Escape iCalendar text values per RFC 5545 §3.3.11.
 * Backslash, semicolon, comma, and literal newlines must be escaped so they
 * aren't interpreted as property delimiters or line breaks.
 */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Safe-enough filename from a title string (retains Bengali codepoints). */
function safeFilename(title: string): string {
  const clean = title
    .replace(/[^a-zA-Z0-9\u0980-\u09FF\s_\-–—]+/g, '')
    .trim()
    .replace(/[\s–—]+/g, '_');
  return clean || 'event';
}

// ── Public API ───────────────────────────────────────────────────────────

export interface CalendarEventData {
  title: string;
  description?: string | null;
  location?: string | null;
  /** ISO-8601 datetime string. */
  startDate: string;
  /** ISO-8601 datetime string; defaults to start + 2 hours. */
  endDate?: string | null;
}

/**
 * Generate a standards-compliant .ics (iCalendar) file as a UTF-8 string.
 *
 * The file opens natively in Google Calendar, Apple Calendar, Outlook, etc.
 */
export function generateIcsContent(data: CalendarEventData): string {
  const start = new Date(data.startDate);
  const end = data.endDate ? new Date(data.endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  // iCalendar values: CRLF line endings, \n for literal newlines in text fields.
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Provatferi//Calendar//BN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${toIcsDateTime(start)}`,
    `DTEND:${toIcsDateTime(end)}`,
    `SUMMARY:${escapeIcsText(data.title)}`,
    `DTSTAMP:${toIcsDateTime(new Date())}`,
    `UID:${crypto.randomUUID()}@provatferi.org`,
  ];

  if (data.location) {
    lines.push(`LOCATION:${escapeIcsText(data.location)}`);
  }

  if (data.description) {
    const desc = escapeIcsText(stripHtml(data.description));
    lines.push(`DESCRIPTION:${desc}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Trigger a browser download of an .ics file. Call this inside a click handler.
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Google Calendar "Add to Calendar" deep-link with pre-filled fields.
 *
 * Opens https://calendar.google.com/calendar/render with title, dates,
 * details, and location set via query parameters so the user only has to
 * confirm.
 */
export function googleCalendarUrl(data: CalendarEventData): string {
  const start = new Date(data.startDate);
  const end = data.endDate ? new Date(data.endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const fmt = (d: Date) => toIcsDateTime(d);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: data.title,
    dates: `${fmt(start)}/${fmt(end)}`,
  });

  if (data.description) params.set('details', stripHtml(data.description));
  if (data.location) params.set('location', data.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Convenience: generate .ics content *and* trigger download in one call.
 */
export function downloadCalendarEvent(data: CalendarEventData): void {
  const ics = generateIcsContent(data);
  downloadIcsFile(`${safeFilename(data.title)}.ics`, ics);
}
