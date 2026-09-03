const CACHE = 'brewpos-v1';
const ASSETS = ['/', '/index.html', '/manifest.json',
  '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // ไม่ cache external (QR API, fonts CDN)
  if (url.hostname !== self.location.hostname) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }
  // Cache-first สำหรับ local assets
  e.respondWith(
    caches.match(e.request).then(cached => cached ||
      fetch(e.request).then(r => {
        caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => caches.match('/index.html'))
    )
  );
});
