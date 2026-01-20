const CACHE_NAME = 'ayed-cache-v20260120';

// List of assets to cache for offline support
const ASSETS = [
  '.',
  './index.html',
  './course-content.html',
  './faq.html',
  './testimonials.html',
  './support.html',
  './level-test.html',
  './results.html',
  './register.html',
  './privacy.html',
  './terms.html',
  './refund.html',
  './404.html',
  './assets/styles.css?v=20260120',
  './assets/app.js?v=20260120',
  './assets/site-data.js?v=20260120',
  './assets/test.js?v=20260120',
  './assets/register.js?v=20260120',
  './assets/questions.json?v=20260120',
  './assets/images/logo.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  // Cache all defined assets
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // Remove old caches
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET requests
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          // Optionally update cache with new responses for versioned resources
          return response;
        })
      );
    })
  );
});