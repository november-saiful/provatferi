'use client';

/**
 * Client-side error monitoring (Sentry), loaded lazily.
 *
 * - No-ops entirely when NEXT_PUBLIC_SENTRY_DSN is unset (local dev, or
 *   deploys without the SENTRY_DSN secret).
 * - Dynamically imports @sentry/nextjs so the SDK never lands in the
 *   initial bundle when monitoring is disabled.
 */

let enabled = false;
let failed = false;
let loadPromise: Promise<typeof import('@sentry/nextjs') | null> | null = null;

function loadSentry(): Promise<typeof import('@sentry/nextjs') | null> | null {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || failed || typeof window === 'undefined') return null;
  if (!loadPromise) {
    loadPromise = import('@sentry/nextjs')
      .then((Sentry) => {
        if (!enabled) {
          Sentry.init({
            dsn,
            environment: process.env.NODE_ENV,
            // Errors only — no performance tracing (keeps event volume at zero
            // cost on the free tier).
            tracesSampleRate: 0,
          });
          enabled = true;
        }
        return Sentry;
      })
      // A failed SDK load must never break the app.
      .catch(() => {
        failed = true;
        return null;
      });
  }
  return loadPromise;
}

/** Initialize once at app startup (called from Providers). */
export function initMonitoring(): void {
  const loader = loadSentry();
  if (!loader) return;
  loader.catch(() => {});
  // Also forward uncaught errors/rejections that escape React boundaries.
  window.addEventListener('error', (event) => {
    if (event.error) void captureError(event.error);
  });
  window.addEventListener('unhandledrejection', (event) => {
    void captureError(event.reason);
  });
}

/** Report an error if monitoring is enabled; otherwise a silent no-op. */
export async function captureError(error: unknown): Promise<void> {
  const loader = loadSentry();
  if (!loader) return;
  try {
    const Sentry = await loader;
    if (Sentry && enabled) Sentry.captureException(error);
  } catch {
    // Reporting must never throw.
  }
}
