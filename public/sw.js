const CACHE_VERSION = 'pwa-gaji-v1';
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(RUNTIME_CACHE).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== RUNTIME_CACHE) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navigation requests: network-first with offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error())
    );
    return;
  }

  const url = new URL(req.url);

  // Cache-first for Next static assets and common static types
  const isStatic =
    url.origin === location.origin &&
    (url.pathname.startsWith('/_next/static') ||
      url.pathname.startsWith('/_next/image') ||
      ['image', 'style', 'script', 'font'].includes(req.destination));

  if (isStatic) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (!res || res.status !== 200) return res;
            const resClone = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, resClone));
            return res;
          })
          .catch(() => cached);
      })
    );
    return;
  }
});

