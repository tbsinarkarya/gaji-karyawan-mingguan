const CACHE_NAME = 'gajikaryawan-cache-v7';
const urlsToCache = [
  // Core files
  './',
  './index.html',
  './manifest.json',
  './404.html',

  // Scripts
  './index.tsx',
  './App.tsx',
  './types.ts',
  './services/storageService.ts',

  // Components
  './components/Dashboard.tsx',
  './components/PayrollCalculator.tsx',
  './components/PayrollHistory.tsx',
  './components/EmployeeFormModal.tsx',
  './components/BottomNav.tsx',
  './components/ConfirmationModal.tsx',

  // Icons
  './components/icons/CalendarDaysIcon.tsx',
  './components/icons/CameraIcon.tsx',
  './components/icons/ChevronDownIcon.tsx',
  './components/icons/ClockIcon.tsx',
  './components/icons/CurrencyDollarIcon.tsx',
  './components/icons/HistoryIcon.tsx',
  './components/icons/PencilIcon.tsx',
  './components/icons/PrintIcon.tsx',
  './components/icons/ShareIcon.tsx',
  './components/icons/TrashIcon.tsx',
  './components/icons/UserGroupIcon.tsx',

  // CDN Dependencies for offline reliability
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js'
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching core assets');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
              // If the request fails, and it's a navigation request, serve the offline page.
              if (event.request.mode === 'navigate') {
                  return caches.match('./index.html');
              }
              return response;
            }

            const responseToCache = response.clone();
            
            // Don't cache the random placeholder images from picsum.photos
            if (!event.request.url.includes('picsum.photos')) {
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
            }

            return response;
          }
        ).catch(() => {
            // For navigation requests, fallback to the main index page.
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        });
      })
    );
});

// Update a service worker
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