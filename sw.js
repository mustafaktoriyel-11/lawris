// Lawris - service worker: önce ağ (her zaman güncel), ağ yoksa önbellek (çevrimdışı)
const CACHE = 'lawris-v6';
const CORE = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'privacy.html',
  'js/main.js', 'js/board.js', 'js/pieces.js', 'js/render.js', 'js/input.js', 'js/theme.js',
  'js/music.js', 'js/maskot.js', 'js/skor.js', 'js/rehber.js', 'js/fx.js', 'js/demo.js', 'img/acilis-adliye.webp', 'icons/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
