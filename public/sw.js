/**
 * NewsScope — Service Worker PWA (v1.4.2)
 * Stratégie de mise en cache : Cache-First pour les ressources statiques & Network-First avec fallback pour les données
 */

const CACHE_NAME = 'newsscope-static-v1.4.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/icon-maskable.svg',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Pour les appels API GDELT, toujours essayer le réseau en priorité
  if (url.pathname.includes('/api/gdelt') || url.hostname.includes('gdeltproject.org')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Connectivité indisponible. Veuillez utiliser le mode hors-ligne.',
            offline: true,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // Pour les polices et assets statiques : Cache-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (event.request.method === 'GET')
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback vers index.html pour les navigations
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
