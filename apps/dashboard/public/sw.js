/* Provatferi service worker — offline shell + static-asset cache.
 *
 * Strategy:
 * - API calls (/api/*) and non-GET requests: network only, never cached.
 *   (The same SW scope also covers /recruitment/* — its form POSTs stay live.)
 * - Navigations: network first, fall back to the cached home shell offline.
 * - Same-origin static assets (_next/, images, fonts, manifest): cache first.
 */

const VERSION = 'provatferi-v1';
const CORE = ['/', '/site.webmanifest', '/icon-192.png', '/icon-512.png'];
const STATIC_PREFIXES = ['/_next/', '/icon-', '/maskable-', '/logo.', '/favicon', '/og-image'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(pathname) {
  return STATIC_PREFIXES.some((p) => pathname.startsWith(p));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests; everything else goes to network.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: try network, fall back to cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match('/'))
        )
    );
    return;
  }

  // Versioned/static assets: cache first.
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((cache) => cache.put(request, copy));
            }
            return res;
          })
      )
    );
  }
});
