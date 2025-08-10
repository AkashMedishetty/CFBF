/**
 * Development Service Worker
 * Minimal service worker for PWA functionality in development
 */

const CACHE_NAME = 'cfb-dev-cache-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW Dev] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW Dev] Caching app shell');
        return cache.addAll(urlsToCache.filter(url => url !== '/static/js/bundle.js')); // Skip bundle in dev
      })
      .then(() => {
        console.log('[SW Dev] Install complete');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW Dev] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW Dev] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW Dev] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - minimal caching for development
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip hot reload and webpack dev server requests
  if (event.request.url.includes('webpack') || 
      event.request.url.includes('hot-update') ||
      event.request.url.includes('sockjs-node')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache in development to avoid stale content
        return response;
      })
      .catch(() => {
        // Fallback to cache only for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/') || caches.match('/index.html');
        }
        return new Response('Network error', { status: 503 });
      })
  );
});

// Handle messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW Dev] Service Worker loaded');