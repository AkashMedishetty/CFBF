/*
  Enhanced Service Worker for PWA with comprehensive offline support, 
  intelligent caching, background sync, and emergency notification handling
*/

const APP_VERSION = 'v2.0-dev'; // This will be replaced during build
const CACHE_VERSION = `cfb-cache-${APP_VERSION}`;
const RUNTIME_CACHE = `cfb-runtime-${APP_VERSION}`;
const EMERGENCY_CACHE = `cfb-emergency-${APP_VERSION}`;
const API_CACHE = `cfb-api-${APP_VERSION}`;

// Cache configurations
const CACHE_CONFIG = {
  // Static assets that rarely change
  STATIC_CACHE_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  // API responses cache duration
  API_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  // Emergency data cache duration
  EMERGENCY_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  // Maximum cache size
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  // Maximum number of cached items
  MAX_CACHE_ITEMS: 1000
};

// URLs to precache for offline functionality
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Emergency pages that should work offline (HTML requests only)
  '/emergency',
  '/login',
  '/donor/dashboard'
];

// Critical API endpoints to cache for offline access
const CRITICAL_API_ENDPOINTS = [
  '/api/v1/auth/me',
  '/api/v1/public/facilities/nearby',
  '/api/v1/blood-requests'
];

// Emergency notification queue
let emergencyNotificationQueue = [];
let backgroundSyncQueue = [];

// Utility: clean up old caches
async function cleanupOldCaches() {
  const keys = await caches.keys();
  const currentCaches = [CACHE_VERSION, RUNTIME_CACHE, EMERGENCY_CACHE, API_CACHE];

  await Promise.all(
    keys.map((key) => {
      if (!key.startsWith('cfb-') || currentCaches.includes(key)) return Promise.resolve();
      console.log(`[SW] Deleting old cache: ${key}`);
      return caches.delete(key);
    })
  );
}

// Utility: manage cache size
async function manageCacheSize(cacheName, maxSize = CACHE_CONFIG.MAX_CACHE_SIZE) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > CACHE_CONFIG.MAX_CACHE_ITEMS) {
    // Remove oldest entries
    const keysToDelete = keys.slice(0, keys.length - CACHE_CONFIG.MAX_CACHE_ITEMS);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
    console.log(`[SW] Cleaned up ${keysToDelete.length} old cache entries from ${cacheName}`);
  }
}

// Utility: check if request is for emergency data
function isEmergencyRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/emergency') ||
    url.pathname.includes('/blood-request') ||
    url.pathname.includes('/donor/dashboard');
}

// Utility: check if request is for API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

// Utility: create cache key with timestamp
function createCacheKey(request, timestamp = Date.now()) {
  return `${request.url}?sw_cache_timestamp=${timestamp}`;
}

// Utility: check if cached response is still fresh
function isCacheResponseFresh(response, maxAge) {
  if (!response) return false;

  const cachedTime = response.headers.get('sw-cached-time');
  if (!cachedTime) return false;

  return (Date.now() - parseInt(cachedTime)) < maxAge;
}

// Enhanced cache strategies
const CacheStrategies = {
  // Network first with cache fallback (for critical data)
  networkFirst: async (request, cacheName, maxAge = CACHE_CONFIG.API_CACHE_DURATION) => {
    const cache = await caches.open(cacheName);

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Clone and add timestamp header
        const responseToCache = networkResponse.clone();
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cached-time', Date.now().toString());

        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });

        cache.put(request, cachedResponse);
      }
      return networkResponse;
    } catch (error) {
      console.log(`[SW] Network failed for ${request.url}, trying cache`);
      const cachedResponse = await cache.match(request);
      if (cachedResponse && isCacheResponseFresh(cachedResponse, maxAge)) {
        return cachedResponse;
      }
      throw error;
    }
  },

  // Cache first with network update (for static assets)
  cacheFirst: async (request, cacheName, maxAge = CACHE_CONFIG.STATIC_CACHE_DURATION) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse && isCacheResponseFresh(cachedResponse, maxAge)) {
      // Update cache in background
      fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
          const headers = new Headers(networkResponse.headers);
          headers.set('sw-cached-time', Date.now().toString());

          const responseToCache = new Response(networkResponse.body, {
            status: networkResponse.status,
            statusText: networkResponse.statusText,
            headers: headers
          });

          cache.put(request, responseToCache);
        }
      }).catch(() => {
        // Ignore background update failures
      });

      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cached-time', Date.now().toString());

      const responseToCache = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: headers
      });

      cache.put(request, responseToCache);
    }

    return networkResponse;
  },

  // Stale while revalidate (for frequently updated data)
  staleWhileRevalidate: async (request, cacheName, maxAge = CACHE_CONFIG.API_CACHE_DURATION) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    // Always try to update from network
    const networkResponsePromise = fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        const headers = new Headers(networkResponse.headers);
        headers.set('sw-cached-time', Date.now().toString());

        const responseToCache = new Response(networkResponse.body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers: headers
        });

        cache.put(request, responseToCache);
      }
      return networkResponse;
    }).catch(() => null);

    // Return cached response immediately if available and fresh
    if (cachedResponse && isCacheResponseFresh(cachedResponse, maxAge)) {
      return cachedResponse;
    }

    // Wait for network response
    return networkResponsePromise || cachedResponse;
  }
};

self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${APP_VERSION}`);

  event.waitUntil(
    (async () => {
      // Create all cache stores
      const staticCache = await caches.open(CACHE_VERSION);
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      const emergencyCache = await caches.open(EMERGENCY_CACHE);
      const apiCache = await caches.open(API_CACHE);

      // Precache core routes and manifest only. Static assets are cached at runtime to avoid hashed filename mismatches.
      console.log('[SW] Precaching core routes and manifest');
      await staticCache.addAll(PRECACHE_URLS);

      // Precache critical API endpoints
      console.log('[SW] Precaching critical API endpoints');
      for (const endpoint of CRITICAL_API_ENDPOINTS) {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            const headers = new Headers(response.headers);
            headers.set('sw-cached-time', Date.now().toString());

            const cachedResponse = new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: headers
            });

            await apiCache.put(endpoint, cachedResponse);
          }
        } catch (error) {
          console.log(`[SW] Failed to precache ${endpoint}:`, error);
        }
      }

      console.log('[SW] Installation complete, skipping waiting');
      // Force activate updated SW immediately
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${APP_VERSION}`);

  event.waitUntil(
    (async () => {
      // Clean up old caches
      await cleanupOldCaches();

      // Manage cache sizes
      await manageCacheSize(RUNTIME_CACHE);
      await manageCacheSize(API_CACHE);

      // Become active immediately
      await self.clients.claim();

      // Initialize background sync registration
      try {
        await self.registration.sync.register('background-sync');
        console.log('[SW] Background sync registered');
      } catch (error) {
        console.log('[SW] Background sync not supported');
      }

      // Notify clients that an update is ready
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          version: APP_VERSION,
          features: {
            backgroundSync: 'sync' in self.registration,
            notifications: 'showNotification' in self.registration,
            offlineSupport: true
          }
        });
      });

      console.log('[SW] Activation complete');
    })()
  );
});

// Enhanced fetch handler with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Do not intercept non-GET requests at all (avoid interfering with uploads/API writes)
  if (request.method !== 'GET') {
    return;
  }

  // Only handle same-origin requests (avoid caching third-party assets)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (isAPIRequest(request)) {
    // API requests - network first with cache fallback
    event.respondWith(handleAPIRequest(request));
  } else if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    // Navigation requests - network first with offline fallback
    event.respondWith(handleNavigationRequest(request));
  } else if (isEmergencyRequest(request)) {
    // Emergency requests - cache first for speed
    event.respondWith(CacheStrategies.cacheFirst(request, EMERGENCY_CACHE));
  } else {
    // Static assets - stale while revalidate
    event.respondWith(CacheStrategies.staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});

// Handle API requests with intelligent caching
async function handleAPIRequest(request) {
  const url = new URL(request.url);

  try {
    // Critical endpoints get cached for offline access
    if (CRITICAL_API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
      return await CacheStrategies.networkFirst(request, API_CACHE);
    }

    // Emergency-related API calls
    if (url.pathname.includes('/blood-request') || url.pathname.includes('/emergency')) {
      return await CacheStrategies.networkFirst(request, EMERGENCY_CACHE, CACHE_CONFIG.EMERGENCY_CACHE_DURATION);
    }

    // Regular API calls - network only with error handling
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log(`[SW] API request failed: ${request.url}`);

    // Try to return cached response for critical endpoints
    if (CRITICAL_API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
      const cache = await caches.open(API_CACHE);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Return offline response
    return new Response(JSON.stringify({
      success: false,
      error: 'Network unavailable',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log(`[SW] Navigation request failed: ${request.url}`);

    // Try to serve from cache
    const cache = await caches.open(CACHE_VERSION);
    let cachedResponse = await cache.match(request);

    if (!cachedResponse) {
      // Fallback to index.html for SPA routing
      cachedResponse = await cache.match('/') || await cache.match('/index.html');
    }

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - CallforBlood Foundation</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
            .retry-btn { background: #dc2626; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button class="retry-btn" onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Add request to background sync queue
async function addToBackgroundSyncQueue(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now()
    };

    backgroundSyncQueue.push(requestData);

    // Store in IndexedDB for persistence
    const db = await openDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    await store.add(requestData);

    console.log('[SW] Request added to background sync queue');
  } catch (error) {
    console.error('[SW] Failed to add request to sync queue:', error);
  }
}

// Open IndexedDB for background sync
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CFBServiceWorkerDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'timestamp' });
        store.createIndex('url', 'url', { unique: false });
      }
    };
  });
}

// Enhanced message handling
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage({ type: 'CACHE_STATUS', data: status });
      });
      break;

    case 'CLEAR_CACHE':
      clearSpecificCache(data.cacheName).then(success => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED', success });
      });
      break;

    case 'QUEUE_EMERGENCY_NOTIFICATION':
      queueEmergencyNotification(data);
      break;

    case 'SYNC_NOW':
      performBackgroundSync();
      break;

    case 'PROCESS_BACKGROUND_NOTIFICATION':
      processBackgroundNotification(data).then(result => {
        // Send response back to background processor
        event.source.postMessage({
          type: 'BACKGROUND_NOTIFICATION_RESPONSE',
          data: {
            id: data.id,
            success: result.success,
            error: result.error
          }
        });
      });
      break;

    case 'UPDATE_BADGE_COUNT':
      updateAppBadge(data.count);
      break;

    case 'CLEAR_BADGE':
      clearAppBadge();
      break;

    case 'GET_NOTIFICATION_QUEUE_STATUS':
      getNotificationQueueStatus().then(status => {
        event.ports[0].postMessage({ type: 'NOTIFICATION_QUEUE_STATUS', data: status });
      });
      break;

    default:
      console.log(`[SW] Unknown message type: ${type}`);
  }
});

// Get cache status information
async function getCacheStatus() {
  const cacheNames = [CACHE_VERSION, RUNTIME_CACHE, EMERGENCY_CACHE, API_CACHE];
  const status = {};

  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = {
        exists: true,
        itemCount: keys.length,
        urls: keys.map(req => req.url).slice(0, 10) // First 10 URLs
      };
    } catch (error) {
      status[cacheName] = { exists: false, error: error.message };
    }
  }

  return status;
}

// Clear specific cache
async function clearSpecificCache(cacheName) {
  try {
    const success = await caches.delete(cacheName);
    console.log(`[SW] Cache ${cacheName} cleared: ${success}`);
    return success;
  } catch (error) {
    console.error(`[SW] Failed to clear cache ${cacheName}:`, error);
    return false;
  }
}

// Queue emergency notification for later delivery
function queueEmergencyNotification(notificationData) {
  emergencyNotificationQueue.push({
    ...notificationData,
    timestamp: Date.now(),
    attempts: 0
  });

  // Try to deliver immediately
  deliverQueuedNotifications();
}

// Enhanced push event handling with emergency prioritization
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  event.waitUntil(
    (async () => {
      try {
        const data = event.data ? event.data.json() : {};

        // Determine notification priority and type
        const isEmergency = data.priority === 'emergency' || data.type === 'blood_request_urgent';
        const title = data.title || 'CallforBlood Foundation';

        // Enhanced notification options based on priority
        const options = {
          body: data.body || 'You have a new notification',
          icon: data.icon || '/logo192.png',
          badge: '/logo192.png',
          data: {
            ...data.data,
            timestamp: Date.now(),
            priority: data.priority || 'normal'
          },
          tag: data.tag || 'cfb-notification',
          requireInteraction: isEmergency,
          silent: false,
          vibrate: isEmergency ? [200, 100, 200, 100, 200] : [100, 50, 100],
          actions: []
        };

        // Add action buttons based on notification type
        if (data.type === 'blood_request_urgent' || data.type === 'blood_request_critical') {
          options.actions = [
            { action: 'accept', title: 'Accept' },
            { action: 'decline', title: 'Decline' },
            { action: 'view_details', title: 'View Details' },
            { action: 'call_hospital', title: 'Call Hospital' }
          ];
        } else if (data.type === 'donation_reminder') {
          options.actions = [
            { action: 'schedule', title: 'Schedule' },
            { action: 'remind_later', title: 'Remind Later' }
          ];
        }

        // Show notification
        await self.registration.showNotification(title, options);

        // Log emergency notifications
        if (isEmergency) {
          console.log('[SW] Emergency notification displayed');

          // Store emergency notification for offline handling
          const cache = await caches.open(EMERGENCY_CACHE);
          const notificationRecord = new Response(JSON.stringify({
            notification: data,
            timestamp: Date.now(),
            displayed: true
          }), {
            headers: { 'Content-Type': 'application/json' }
          });

          await cache.put(`/emergency-notification-${Date.now()}`, notificationRecord);
        }

      } catch (error) {
        console.error('[SW] Push event handling failed:', error);

        // Fallback notification
        await self.registration.showNotification('CallforBlood Foundation', {
          body: 'You have a new notification',
          icon: '/logo192.png',
          badge: '/logo192.png'
        });
      }
    })()
  );
});

// Enhanced notification click and action handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  event.waitUntil(
    (async () => {
      const data = event.notification.data || {};
      const action = event.action;

      // Handle different actions
      switch (action) {
        case 'accept':
        case 'accept_emergency':
          await handleEmergencyResponse(data, 'accept');
          await openOrFocusWindow('/donor/dashboard?action=accept&requestId=' + (data.requestId || data.emergencyId || ''));
          break;

        case 'decline':
        case 'decline_emergency':
          await handleEmergencyResponse(data, 'decline');
          // Don't open window for decline, just log the response
          break;

        case 'view_details':
          await openOrFocusWindow('/emergency/' + (data.requestId || data.emergencyId || ''));
          break;

        case 'call_hospital':
          if (data.hospitalPhone) {
            await openOrFocusWindow('tel:' + data.hospitalPhone);
            // Track hospital contact
            await trackHospitalContact(data);
          }
          break;

        case 'share_emergency':
          await handleEmergencyShare(data);
          break;

        case 'schedule':
          await openOrFocusWindow('/donor/schedule');
          break;

        case 'remind_later':
          await scheduleReminderNotification(data);
          break;

        default:
          // Default click - open appropriate page
          const targetUrl = data.url || '/donor/dashboard';
          await openOrFocusWindow(targetUrl);
      }
    })()
  );
});

// Handle emergency response actions
async function handleEmergencyResponse(data, response) {
  try {
    const responseData = {
      emergencyId: data.emergencyId || data.requestId,
      requestId: data.requestId,
      response: response,
      timestamp: Date.now(),
      source: 'notification',
      donorId: data.donorId || 'current-user'
    };

    // Try to send response immediately
    const result = await fetch('/api/v1/emergency/respond', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getStoredToken()}`
      },
      body: JSON.stringify(responseData)
    });

    if (result.ok) {
      console.log('[SW] Emergency response sent successfully');

      // Show confirmation notification
      await self.registration.showNotification(
          response === 'accept' ? 'Response Confirmed' : 'Response Recorded',
          {
            body: response === 'accept'
              ? 'Thank you for accepting! Hospital has been notified.'
              : 'Thank you for your response.',
            icon: '/icons/confirmation.png',
            tag: 'response-confirmation',
            requireInteraction: false
          }
        );

    } else {
      throw new Error('Response failed');
    }
  } catch (error) {
    console.log('[SW] Failed to send emergency response, queuing for sync');
    await addToBackgroundSyncQueue(new Request('/api/v1/emergency/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responseData)
    }));
  }
}

// Track hospital contact for analytics
async function trackHospitalContact(data) {
  try {
    const contactData = {
      emergencyId: data.emergencyId || data.requestId,
      hospitalPhone: data.hospitalPhone,
      timestamp: Date.now(),
      source: 'notification'
    };

    await fetch('/api/v1/analytics/hospital-contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getStoredToken()}`
      },
      body: JSON.stringify(contactData)
    });

    console.log('[SW] Hospital contact tracked');
  } catch (error) {
    console.log('[SW] Failed to track hospital contact:', error);
  }
}

// Handle emergency sharing
async function handleEmergencyShare(data) {
  try {
    const shareText = `URGENT: ${data.bloodType || 'Blood'} needed at ${data.hospitalName || 'hospital'}. Can you help or share with someone who can? #BloodDonation #SaveLives`;
    const shareUrl = `${self.location.origin}/emergency/${data.emergencyId || data.requestId}`;

    // Try to use Web Share API
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'SHARE_EMERGENCY',
        data: {
          title: 'Emergency Blood Request',
          text: shareText,
          url: shareUrl
        }
      });
    }

    console.log('[SW] Emergency share initiated');
  } catch (error) {
    console.log('[SW] Failed to handle emergency share:', error);
  }
}

// Open or focus existing window
async function openOrFocusWindow(url) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

  // Try to focus existing window with same origin
  for (const client of clients) {
    if (client.url.startsWith(self.location.origin)) {
      await client.focus();
      client.postMessage({ type: 'NAVIGATE', url: url });
      return;
    }
  }

  // Open new window
  await self.clients.openWindow(url);
}

// Get stored authentication token
async function getStoredToken() {
  try {
    // Try to get token from IndexedDB first
    const db = await openDB();
    const transaction = db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    const session = await store.get('current_session');

    if (session && session.tokens && session.tokens.accessToken) {
      return session.tokens.accessToken;
    }
  } catch (error) {
    console.log('[SW] Failed to get token from IndexedDB');
  }

  // Fallback: try to get from clients
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    try {
      const response = await new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => resolve(event.data);
        client.postMessage({ type: 'GET_TOKEN' }, [channel.port2]);
        setTimeout(() => resolve(null), 1000); // Timeout after 1 second
      });

      if (response && response.token) {
        return response.token;
      }
    } catch (error) {
      console.log('[SW] Failed to get token from client');
    }
  }

  return null;
}

// Schedule reminder notification
async function scheduleReminderNotification(data) {
  // In a real implementation, this would schedule a future notification
  // For now, we'll just log it
  console.log('[SW] Reminder scheduled for later');
}

// Enhanced background sync with priority queuing
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync());
  } else if (event.tag === 'emergency-sync') {
    event.waitUntil(performEmergencySync());
  }
});

// Perform background sync of queued requests
async function performBackgroundSync() {
  console.log('[SW] Performing background sync');

  try {
    const db = await openDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const requests = await store.getAll();

    const successfulSyncs = [];

    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });

        if (response.ok) {
          successfulSyncs.push(requestData.timestamp);
          console.log(`[SW] Successfully synced: ${requestData.url}`);
        } else {
          console.log(`[SW] Sync failed for: ${requestData.url} (${response.status})`);
        }
      } catch (error) {
        console.log(`[SW] Sync error for: ${requestData.url}`, error);
      }
    }

    // Remove successfully synced requests
    for (const timestamp of successfulSyncs) {
      await store.delete(timestamp);
    }

    console.log(`[SW] Background sync completed: ${successfulSyncs.length}/${requests.length} successful`);

  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Perform emergency sync (higher priority)
async function performEmergencySync() {
  console.log('[SW] Performing emergency sync');

  // Deliver queued emergency notifications
  await deliverQueuedNotifications();

  // Sync emergency responses
  await performBackgroundSync();
}

// Deliver queued emergency notifications
async function deliverQueuedNotifications() {
  const deliveredNotifications = [];

  for (let i = 0; i < emergencyNotificationQueue.length; i++) {
    const notification = emergencyNotificationQueue[i];

    try {
      await self.registration.showNotification(notification.title, notification.options);
      deliveredNotifications.push(i);
      console.log('[SW] Queued notification delivered');
    } catch (error) {
      console.log('[SW] Failed to deliver queued notification:', error);
      notification.attempts = (notification.attempts || 0) + 1;

      // Remove notifications that have failed too many times
      if (notification.attempts >= 3) {
        deliveredNotifications.push(i);
      }
    }
  }

  // Remove delivered notifications (in reverse order to maintain indices)
  for (let i = deliveredNotifications.length - 1; i >= 0; i--) {
    emergencyNotificationQueue.splice(deliveredNotifications[i], 1);
  }
}

// Error handling for service worker
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log(`[SW] Service Worker ${APP_VERSION} loaded with enhanced PWA capabilities`);

// Periodic cleanup and maintenance
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(performCacheCleanup());
  }
});

// Perform cache cleanup
async function performCacheCleanup() {
  console.log('[SW] Performing periodic cache cleanup');

  try {
    // Clean up old cache entries
    await manageCacheSize(RUNTIME_CACHE);
    await manageCacheSize(API_CACHE);
    await manageCacheSize(EMERGENCY_CACHE);

    // Clean up expired emergency notifications
    const emergencyCache = await caches.open(EMERGENCY_CACHE);
    const keys = await emergencyCache.keys();

    for (const request of keys) {
      if (request.url.includes('emergency-notification-')) {
        const response = await emergencyCache.match(request);
        const data = await response.json();

        // Remove notifications older than 24 hours
        if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
          await emergencyCache.delete(request);
        }
      }
    }

    console.log('[SW] Cache cleanup completed');
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}

// Process background notification when PWA is closed
async function processBackgroundNotification(data) {
  try {
    console.log('[SW] Processing background notification', data.id);

    const { notification, priority } = data;

    // Determine notification options based on priority and type
    const options = buildNotificationOptions(notification, priority);

    // Show notification
    await self.registration.showNotification(
      notification.title || 'CallforBlood Foundation',
      options
    );

    // Store notification for tracking
    await storeNotificationRecord(data.id, notification, 'delivered');

    // Update badge count if needed
    if (notification.updateBadge !== false) {
      await updateAppBadge(1);
    }

    console.log('[SW] Background notification processed successfully');
    return { success: true };

  } catch (error) {
    console.error('[SW] Failed to process background notification:', error);

    // Store failure record
    await storeNotificationRecord(data.id, data.notification, 'failed', error.message);

    return { success: false, error: error.message };
  }
}

// Handle fetch errors and offline scenarios
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log(`[SW] Service Worker ${APP_VERSION} loaded with enhanced PWA capabilities`);

// Build notification options based on priority and type
function buildNotificationOptions(notification, priority) {
  const isEmergency = priority <= 2 || notification.type?.includes('emergency') || notification.type?.includes('critical');

  const options = {
    body: notification.body || 'You have a new notification',
    icon: notification.icon || '/logo192.png',
    badge: '/logo192.png',
    data: {
      ...notification.data,
      timestamp: Date.now(),
      priority: priority,
      processedInBackground: true
    },
    tag: notification.tag || `cfb-${notification.type || 'notification'}`,
    requireInteraction: isEmergency,
    silent: false,
    vibrate: isEmergency ? [300, 100, 300, 100, 300] : [100, 50, 100],
    actions: []
  };

  // Add action buttons based on notification type
  if (notification.type === 'blood_request_urgent' || notification.type === 'blood_request_critical') {
    options.actions = [
      { action: 'accept', title: 'Accept Emergency' },
      { action: 'decline', title: 'Decline' },
      { action: 'view_details', title: 'View Details' },
      { action: 'call_hospital', title: 'Call Hospital' }
    ];
  } else if (notification.type === 'donation_reminder') {
    options.actions = [
      { action: 'schedule', title: 'Schedule Donation' },
      { action: 'remind_later', title: 'Remind Later' }
    ];
  } else if (notification.type === 'response_confirmation') {
    options.actions = [
      { action: 'view_dashboard', title: 'View Dashboard' }
    ];
  }

  // Add emergency-specific styling
  if (isEmergency) {
    options.image = notification.image || undefined;
    options.renotify = true;
    options.timestamp = Date.now();
  }

  return options;
}

// Store notification record for tracking
async function storeNotificationRecord(notificationId, notification, status, error = null) {
  try {
    const record = {
      id: notificationId,
      notification: notification,
      status: status,
      timestamp: Date.now(),
      error: error
    };

    const cache = await caches.open(EMERGENCY_CACHE);
    const recordResponse = new Response(JSON.stringify(record), {
      headers: { 'Content-Type': 'application/json' }
    });

    await cache.put(`/notification-record-${notificationId}`, recordResponse);
  } catch (error) {
    console.error('[SW] Failed to store notification record:', error);
  }
}

// Update app badge count
async function updateAppBadge(increment = 1) {
  try {
    // Get current badge count from storage
    let currentCount = await getBadgeCount();
    currentCount = Math.max(0, currentCount + increment);

    // Update badge
    if ('setAppBadge' in self.registration) {
      if (currentCount > 0) {
        await self.registration.setAppBadge(currentCount);
      } else {
        await self.registration.clearAppBadge();
      }
    }

    // Store updated count
    await setBadgeCount(currentCount);

    console.log(`[SW] Badge count updated: ${currentCount}`);
  } catch (error) {
    console.error('[SW] Failed to update badge count:', error);
  }
}

// Clear app badge
async function clearAppBadge() {
  try {
    if ('clearAppBadge' in self.registration) {
      await self.registration.clearAppBadge();
    }

    await setBadgeCount(0);
    console.log('[SW] Badge cleared');
  } catch (error) {
    console.error('[SW] Failed to clear badge:', error);
  }
}

// Get badge count from storage
async function getBadgeCount() {
  try {
    const cache = await caches.open(EMERGENCY_CACHE);
    const response = await cache.match('/badge-count');

    if (response) {
      const data = await response.json();
      return data.count || 0;
    }

    return 0;
  } catch (error) {
    console.error('[SW] Failed to get badge count:', error);
    return 0;
  }
}

// Set badge count in storage
async function setBadgeCount(count) {
  try {
    const cache = await caches.open(EMERGENCY_CACHE);
    const countResponse = new Response(JSON.stringify({ count, timestamp: Date.now() }), {
      headers: { 'Content-Type': 'application/json' }
    });

    await cache.put('/badge-count', countResponse);
  } catch (error) {
    console.error('[SW] Failed to set badge count:', error);
  }
}

// Get notification queue status
async function getNotificationQueueStatus() {
  try {
    const cache = await caches.open(EMERGENCY_CACHE);
    const keys = await cache.keys();

    const notificationRecords = keys.filter(key => key.url.includes('/notification-record-'));
    const pendingNotifications = keys.filter(key => key.url.includes('/emergency-notification-'));
    const badgeCount = await getBadgeCount();

    return {
      totalRecords: notificationRecords.length,
      pendingNotifications: pendingNotifications.length,
      badgeCount: badgeCount,
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error('[SW] Failed to get queue status:', error);
    return {
      totalRecords: 0,
      pendingNotifications: 0,
      badgeCount: 0,
      lastUpdated: Date.now(),
      error: error.message
    };
  }
}

// Enhanced notification retry mechanism with exponential backoff
async function retryFailedNotifications() {
  try {
    const cache = await caches.open(EMERGENCY_CACHE);
    const keys = await cache.keys();

    const failedNotifications = [];

    for (const key of keys) {
      if (key.url.includes('/notification-record-')) {
        const response = await cache.match(key);
        const record = await response.json();

        if (record.status === 'failed' && (record.retryCount || 0) < 5) {
          // Implement exponential backoff
          const retryDelay = Math.pow(2, record.retryCount || 0) * 60 * 1000; // 1min, 2min, 4min, 8min, 16min
          const timeSinceLastRetry = Date.now() - (record.lastRetry || record.timestamp);

          if (timeSinceLastRetry >= retryDelay) {
            failedNotifications.push(record);
          }
        }
      }
    }

    console.log(`[SW] Retrying ${failedNotifications.length} failed notifications`);

    for (const record of failedNotifications) {
      try {
        // Increment retry count
        record.retryCount = (record.retryCount || 0) + 1;
        record.lastRetry = Date.now();

        // Attempt to process notification again
        const result = await processBackgroundNotification({
          id: record.id,
          notification: record.notification,
          priority: record.notification.priority || 4
        });

        if (result.success) {
          record.status = 'delivered';
          console.log(`[SW] Successfully retried notification ${record.id}`);
        } else {
          record.status = 'failed';
          record.error = result.error;
        }

        // Update record
        await storeNotificationRecord(record.id, record.notification, record.status, record.error);

      } catch (error) {
        console.error(`[SW] Failed to retry notification ${record.id}:`, error);
      }
    }

  } catch (error) {
    console.error('[SW] Failed to retry failed notifications:', error);
  }
}

// Periodic cleanup of old notification records
async function cleanupOldNotificationRecords() {
  try {
    const cache = await caches.open(EMERGENCY_CACHE);
    const keys = await cache.keys();

    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    let cleanedCount = 0;

    for (const key of keys) {
      if (key.url.includes('/notification-record-')) {
        const response = await cache.match(key);
        const record = await response.json();

        if (record.timestamp < cutoffTime) {
          await cache.delete(key);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`[SW] Cleaned up ${cleanedCount} old notification records`);
    }

  } catch (error) {
    console.error('[SW] Failed to cleanup old notification records:', error);
  }
}

// Set up periodic tasks
setInterval(() => {
  retryFailedNotifications();
}, 5 * 60 * 1000); // Every 5 minutes

setInterval(() => {
  cleanupOldNotificationRecords();
}, 60 * 60 * 1000); // Every hour

console.log(`[SW] Service Worker ${APP_VERSION} loaded with enhanced PWA capabilities`);