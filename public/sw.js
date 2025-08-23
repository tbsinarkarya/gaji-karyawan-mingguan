const CACHE_NAME = 'gajikaryawan-cache-v2';
// Aset inti yang akan selalu ada di cache. Vite akan menambahkan aset lain saat build.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/404.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching core assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Abaikan request yang bukan GET atau request dari ekstensi chrome
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Strategi: Cache-first, lalu network.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // Hanya cache response yang valid dan bukan dari picsum.photos
          if (networkResponse && networkResponse.ok && !event.request.url.includes('picsum.photos')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Jika network gagal, dan ini navigasi halaman, kembalikan halaman utama
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });

      // Kembalikan dari cache jika ada, jika tidak, tunggu hasil dari network.
      return cachedResponse || fetchPromise;
    })
  );
});