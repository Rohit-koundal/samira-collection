const CACHE = 'samira-spa-v2';
const STATIC_PATTERN = /\.(?:js|css|woff2?|png|jpe?g|gif|svg|ico|webp)$/i;

async function precacheAppShell() {
  const cache = await caches.open(CACHE);
  try {
    const index = await fetch('/index.html', { cache: 'reload' });
    if (index.ok) {
      await cache.put('/index.html', index.clone());
      await cache.put('/', index.clone());
    }
  } catch (_) {
    /* Offline or first install on a host that has not rewritten yet. */
  }
}

async function serveAppShell(request) {
  const cache = await caches.open(CACHE);

  try {
    const fresh = await fetch(request);
    const type = fresh.headers.get('content-type') || '';
    if (fresh.ok && type.includes('text/html')) {
      await cache.put('/index.html', fresh.clone());
      await cache.put('/', fresh.clone());
      return fresh;
    }
  } catch (_) {
    /* Host may 404 this path until the SPA rewrite is in place. */
  }

  const cached = (await cache.match('/index.html')) || (await cache.match('/'));
  if (cached) return cached;

  try {
    const index = await fetch('/index.html');
    if (index.ok) {
      await cache.put('/index.html', index.clone());
      await cache.put('/', index.clone());
      return index;
    }
  } catch (_) {
    /* Last resort: let the original navigation request fail. */
  }

  return fetch(request);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await precacheAppShell();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(serveAppShell(event.request));
    return;
  }

  if (!STATIC_PATTERN.test(url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok) cache.put(event.request, response.clone());
    return response;
  })());
});
