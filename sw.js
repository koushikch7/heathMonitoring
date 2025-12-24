
const CACHE_NAME = 'health-v7-final';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.map((k) => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).then((nw) => {
        if (nw.status === 200) {
          const cp = nw.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, cp));
        }
        return nw;
      }).catch(() => null);
    })
  );
});
