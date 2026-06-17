// Virtual Mind 2.0 — Service Worker
// Full PWA: Offline caching + Push Notifications + Background Sync
// This runs in the background, even when the app tab is closed.

// ⚡ BUMP THIS VERSION whenever you redeploy to force cache eviction
const CACHE_NAME = 'virtual-mind-v9';
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
// INDEXEDDB QUEUE HELPERS
// ───────────────────────────────────────────────
const DB_NAME = 'virtual-mind-offline';
const STORE_NAME = 'post-queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      event.target.result.createObjectStore(STORE_NAME, { autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToQueue(url, method, headers, body) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add({
    url, method, headers, body, timestamp: Date.now()
  });
  return new Promise(resolve => tx.oncomplete = resolve);
}

// ───────────────────────────────────────────────
// FETCH — Smart strategy per resource type
// ───────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // ⚡ OFFLINE QUEUE: Intercept POST requests to API
  if (event.request.method === 'POST' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        // Clone request because we might need to read the body if it fails
        const reqClone = event.request.clone();
        try {
          // Attempt the network request first
          return await fetch(event.request);
        } catch (error) {
          // If network fails, queue it in IndexedDB
          console.warn('[SW] Offline! Queuing POST request to', url.pathname);
          const headers = {};
          reqClone.headers.forEach((v, k) => { headers[k] = v; });
          
          let bodyText = null;
          try { bodyText = await reqClone.text(); } catch(e) {}
          
          await saveToQueue(url.href, reqClone.method, headers, bodyText);
          
          // Trigger background sync if supported
          if ('sync' in self.registration) {
            self.registration.sync.register('sync-offline-posts').catch(() => {});
          }

          // Return a fake successful response to the frontend so the UI doesn't crash
          return new Response(JSON.stringify({ 
            status: 'queued', 
            message: 'You are offline. Data securely queued.' 
          }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })()
    );
    return;
  }

  // Skip other non-GET requests
  if (event.request.method !== 'GET') return;

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

  // Default: Network-first, fall back to cache
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
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
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
// BACKGROUND SYNC — Replay offline POST queue
// ───────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-posts') {
    event.waitUntil(
      (async () => {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const allReq = store.getAllKeys();
        
        return new Promise((resolve) => {
          allReq.onsuccess = async () => {
            const keys = allReq.result;
            for (const key of keys) {
              const itemReq = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(key);
              const item = await new Promise(r => { itemReq.onsuccess = () => r(itemReq.result) });
              
              if (item) {
                try {
                  console.log('[SW] Background Sync: Replaying POST to', item.url);
                  const res = await fetch(item.url, {
                    method: item.method,
                    headers: item.headers,
                    body: item.body
                  });
                  if (res.ok) {
                    // Success! Remove from queue
                    const delTx = db.transaction(STORE_NAME, 'readwrite');
                    delTx.objectStore(STORE_NAME).delete(key);
                  }
                } catch (err) {
                  console.log('[SW] Background Sync failed, will retry later:', err);
                  // Stop processing if network is still down
                  break;
                }
              }
            }
            resolve();
          };
        });
      })()
    );
  }
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
