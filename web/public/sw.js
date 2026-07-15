const CACHE_NAME = 'houziee-v4';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;
  if (request.url.includes('/proxy/')) return;
  if (request.url.includes('/socket.io')) return;

  // Navigation - network first
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }

  // JS/CSS - network first (Vite HMR)
  if (request.url.includes('.js') || request.url.includes('.css')) {
    event.respondWith(
      fetch(request).then((res) => {
        if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Images & other assets - cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
        return res;
      });
    })
  );
});
