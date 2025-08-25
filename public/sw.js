const CACHE_NAME = 'gajikaryawan-cache-v3';
// Aset inti yang akan selalu ada di cache. 
// Aset lain (seperti file JS/CSS hasil build Vite) akan di-cache secara dinamis saat diakses.
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
      // Jika ada di cache, langsung kembalikan.
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Jika tidak ada di cache, ambil dari network.
      return fetch(event.request).then(networkResponse => {
          // Hanya cache response yang valid dan bukan dari picsum.photos
          if (networkResponse && networkResponse.ok && !event.request.url.includes('picsum.photos')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Jika network gagal, dan ini navigasi halaman, kembalikan halaman 404
          if (event.request.mode === 'navigate') {
            return caches.match('/404.html');
          }
        });
    })
  );
});
