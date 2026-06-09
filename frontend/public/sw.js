// Virtual Mind 2.0 — Service Worker
// Full PWA: Offline caching + Push Notifications + Background Sync
// This runs in the background, even when the app tab is closed.

// ⚡ BUMP THIS VERSION whenever you redeploy to force cache eviction
const CACHE_NAME = 'virtual-mind-v5';
const VM_APP_URL = self.location.origin;

// Critical shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// ───────────────────────────────────────────────
// INSTALL — Cache critical shell assets
// ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Virtual Mind Service Worker v5...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Some precache assets failed (non-critical):', err);
      });
    })
  );
  self.skipWaiting(); // Activate immediately
});

// ───────────────────────────────────────────────
// ACTIVATE — Clear ALL old caches, take control
// ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activated v5. Clearing old caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => clients.claim())
  );
});

// ───────────────────────────────────────────────
// FETCH — Smart strategy per resource type
// ───────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (POST workout logs etc.)
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // API calls: Network-first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses for offline use
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  // ⚡ CRITICAL: Next.js JS/CSS bundles MUST be network-first.
  // Cache-first causes stale webpack module IDs → black screen crash.
  // Next.js already uses content-hash filenames, so network-first is safe.
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache fresh bundle for offline fallback only
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline: serve cached bundle as last resort
          return caches.match(event.request);
        })
    );
    return;
  }

  // HTML navigation: Network-first so users always get fresh page shells
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request) || caches.match('/');
        })
    );
    return;
  }

  // Static icons/fonts: Cache-first (safe, they never change)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // Fallback for navigation requests: serve cached /command
        if (event.request.mode === 'navigate') {
          return caches.match('/command');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// ───────────────────────────────────────────────
// PUSH — Handle incoming push notifications
// ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[SW] Push received.');

  let payload = {
    title: '⚡ Virtual Mind',
    body: 'You have a new message from your Command Center.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/command',
    tag: 'vm-notification',
    data: {}
  };

  if (event.data) {
    try {
      const incoming = event.data.json();
      payload = { ...payload, ...incoming };
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || 'vm-notification',
    renotify: true,
    requireInteraction: payload.requireInteraction || false,
    vibrate: [200, 100, 200, 100, 400],
    data: {
      url: payload.url || '/command',
      ...payload.data
    },
    actions: payload.actions || [
      {
        action: 'open',
        title: '🎯 Open Command Center'
      },
      {
        action: 'workout',
        title: '🏋️ Workout Session'
      },
      {
        action: 'log',
        title: '📖 Secure Reflection'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// ───────────────────────────────────────────────
// NOTIFICATION CLICK — Route to correct page
// ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  let targetUrl = VM_APP_URL + '/command';

  if (event.action === 'log') {
    targetUrl = VM_APP_URL + '/log';
  } else if (event.action === 'workout') {
    targetUrl = VM_APP_URL + '/workout';
  } else if (event.notification.data && event.notification.data.url) {
    targetUrl = VM_APP_URL + event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If app is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(VM_APP_URL) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ───────────────────────────────────────────────
// NOTIFICATION CLOSE — Log dismissal
// ───────────────────────────────────────────────
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag);
});

// ───────────────────────────────────────────────
// PERIODIC SYNC — Keep alive (when browser supports it)
// ───────────────────────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'vm-keepalive') {
    event.waitUntil(
      fetch('/api/health').catch(() => {})
    );
  }
});
