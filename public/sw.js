const CACHE_VERSION = 'mrs-offline-v1.0.1-20261125';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
  '/icons/apple-touch-icon.png',
  '/assets/aistudio/_________________________________12eb8902.png',
];

self.addEventListener('install', (event) => {
  // Do NOT call skipWaiting() automatically so we never overwrite an active lesson without user notice.
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return Promise.allSettled(APP_SHELL_URLS.map((url) => cache.add(url)));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('mrs-offline-') && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'DOWNLOAD_OFFLINE_PACK') {
    const urls = Array.isArray(data.urls) ? data.urls : APP_SHELL_URLS;
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_VERSION);
        let completed = 0;
        const total = urls.length;
        const failed = [];
        const clients = await self.clients.matchAll();

        for (const url of urls) {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response && response.ok) {
              await cache.put(url, response.clone());
            } else {
              failed.push(url);
            }
          } catch {
            failed.push(url);
          }
          completed += 1;
          clients.forEach((client) => {
            client.postMessage({
              type: 'OFFLINE_DOWNLOAD_PROGRESS',
              completed,
              total,
              percent: Math.round((completed / total) * 100),
              version: CACHE_VERSION,
              failed,
            });
          });
        }

        clients.forEach((client) => {
          client.postMessage({
            type: 'OFFLINE_DOWNLOAD_COMPLETE',
            completed,
            total,
            version: CACHE_VERSION,
            failed,
            timestamp: new Date().toISOString(),
          });
        });
      })()
    );
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network first with offline SPA fallback to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Static assets: cache first, update in background (stale-while-revalidate)
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
