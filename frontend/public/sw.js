const CACHE_NAME = 'lms-v1.0.0';
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_NAME}-dynamic`;
const API_CACHE_NAME = `${CACHE_NAME}-api`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Add core CSS and JS files here when available
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/v1/leaves/dashboard-stats',
  '/api/v1/leaves/balances',
  '/api/v1/notifications',
  '/api/v1/holidays',
  '/api/v1/users/me'
];

// Network-first cache strategy for API calls
const NETWORK_FIRST_PATHS = [
  '/api/v1/leaves',
  '/api/v1/notifications',
  '/api/v1/users'
];

// Cache-first strategy for static assets
const CACHE_FIRST_PATHS = [
  '/icons/',
  '/images/',
  '/assets/',
  '.css',
  '.js',
  '.woff2',
  '.woff',
  '.ttf'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('lms-') &&
                cacheName !== STATIC_CACHE_NAME &&
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - handle caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (shouldCacheFirst(url.pathname)) {
    event.respondWith(handleCacheFirst(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default strategy for other requests
  event.respondWith(handleNetworkFirst(request, DYNAMIC_CACHE_NAME));
});

// API request handler - Network first with cache fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);

  try {
    // Try network first
    const networkResponse = await fetch(request.clone());

    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for failed API calls
    return new Response(
      JSON.stringify({
        success: false,
        message: 'You are offline. Please check your internet connection.',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Cache first strategy
async function handleCacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch asset:', request.url);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Navigation request handler
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, serving offline page');

    // Serve offline page
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }

    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Leave Management System - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              text-align: center;
              padding: 50px;
              background: #f5f5f5;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #333; margin-bottom: 10px; }
            p { color: #666; line-height: 1.5; }
            button {
              background: #1976d2;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 20px;
            }
            button:hover { background: #1565c0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📴</div>
            <h1>You're Offline</h1>
            <p>Unable to connect to the Leave Management System. Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Network first with cache fallback
async function handleNetworkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Content not available offline', { status: 503 });
  }
}

// Helper functions
function shouldCacheFirst(pathname) {
  return CACHE_FIRST_PATHS.some(path => pathname.includes(path));
}

function shouldNetworkFirst(pathname) {
  return NETWORK_FIRST_PATHS.some(path => pathname.startsWith(path));
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'leave-request-sync') {
    event.waitUntil(syncLeaveRequests());
  }

  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Sync leave requests when back online
async function syncLeaveRequests() {
  try {
    // Get pending leave requests from IndexedDB
    const pendingRequests = await getPendingLeaveRequests();

    for (const request of pendingRequests) {
      try {
        const response = await fetch('/api/v1/leaves', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${request.token}`
          },
          body: JSON.stringify(request.data)
        });

        if (response.ok) {
          await removePendingLeaveRequest(request.id);
          console.log('[SW] Synced leave request:', request.id);
        }
      } catch (error) {
        console.log('[SW] Failed to sync leave request:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Background sync failed:', error);
  }
}

// Sync notifications
async function syncNotifications() {
  try {
    const response = await fetch('/api/v1/notifications');
    if (response.ok) {
      const data = await response.json();
      // Update notification cache
      const cache = await caches.open(API_CACHE_NAME);
      cache.put('/api/v1/notifications', new Response(JSON.stringify(data)));
    }
  } catch (error) {
    console.log('[SW] Failed to sync notifications:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'lms-notification',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-24x24.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/close-24x24.png'
      }
    ],
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Leave Management System',
      options
    )
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view') {
    const urlToOpen = event.notification.data.url || '/notifications';

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.focus();
              client.postMessage({ action: 'navigate', url: urlToOpen });
              return;
            }
          }

          // Open new window
          if (self.clients.openWindow) {
            return self.clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const { urls } = event.data;
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.addAll(urls);
      })
    );
  }
});

// Placeholder functions for IndexedDB operations
async function getPendingLeaveRequests() {
  // This would integrate with IndexedDB to get pending requests
  return [];
}

async function removePendingLeaveRequest(id) {
  // This would remove the synced request from IndexedDB
  console.log('Removing pending request:', id);
}

console.log('[SW] Service worker script loaded');