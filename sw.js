// Lex Stack - service worker: önce ağ (her zaman güncel), ağ yoksa önbellek (çevrimdışı)
const CACHE = 'lexstack-v33';
const CORE = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'privacy.html', 'privacy-en.html',
  'js/main.js', 'js/board.js', 'js/pieces.js', 'js/render.js', 'js/input.js', 'js/theme.js',
  'js/music.js', 'js/sfx.js', 'js/maskot.js', 'js/menuyigin.js', 'js/skor.js', 'js/rehber.js', 'js/fx.js', 'js/roma.js', 'js/demo.js', 'js/i18n.js', 'js/gunluk.js', 'js/langsw.js', 'img/acilis-tapinak.webp', 'js/00-android.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
// Gerçek çalgı örnekleri (müzik motoru tembel yükler; çevrimdışı için önceden önbelleğe alınır)
const AUDIO = ['charp_A2.mp3', 'charp_A4.mp3', 'charp_B3.mp3', 'charp_C3.mp3', 'charp_D2.mp3', 'charp_D4.mp3', 'charp_E3.mp3', 'charp_F2.mp3', 'charp_F4.mp3', 'charp_G3.mp3', 'clap1.mp3', 'clap2.mp3', 'dar_doum1.mp3', 'dar_doum2.mp3', 'dar_ka1.mp3', 'dar_ka2.mp3', 'dar_slap1.mp3', 'dar_tek1.mp3', 'dar_tek2.mp3', 'fcym1.mp3', 'fdrum_doum1.mp3', 'fdrum_doum2.mp3', 'fdrum_tak1.mp3', 'fdrum_tek1.mp3', 'fdrum_tek2.mp3', 'harp_As3.mp3', 'harp_As4.mp3', 'harp_As5.mp3', 'harp_C3.mp3', 'harp_C4.mp3', 'harp_C5.mp3', 'harp_C6.mp3', 'harp_D3.mp3', 'harp_D4.mp3', 'harp_D5.mp3', 'harp_D6.mp3', 'harp_E3.mp3', 'harp_E4.mp3', 'harp_E5.mp3', 'harp_E6.mp3', 'harp_Fs3.mp3', 'harp_Fs4.mp3', 'harp_Fs5.mp3', 'harp_Fs6.mp3', 'harp_Gs3.mp3', 'harp_Gs4.mp3', 'harp_Gs5.mp3', 'harp_Gs6.mp3', 'psal_As5.mp3', 'psal_C5.mp3', 'psal_C6.mp3', 'psal_D5.mp3', 'psal_D6.mp3', 'psal_E5.mp3', 'psal_E6.mp3', 'psal_Fs5.mp3', 'psal_Fs6.mp3', 'psal_Gs5.mp3', 'psalb_C5.mp3', 'psalb_C6.mp3', 'psalb_E5.mp3', 'psalb_E6.mp3', 'psalb_Gs5.mp3', 'recS_l_As6.mp3', 'recS_l_E6.mp3', 'recS_l_Fs6.mp3', 'recS_s_As6.mp3', 'recS_s_E6.mp3', 'recS_s_Fs6.mp3', 'rec_l_As4.mp3', 'rec_l_As5.mp3', 'rec_l_D5.mp3', 'rec_l_D6.mp3', 'rec_l_Fs5.mp3', 'rec_s_As4.mp3', 'rec_s_As5.mp3', 'rec_s_C5.mp3', 'rec_s_C6.mp3', 'rec_s_D5.mp3', 'rec_s_D6.mp3', 'rec_s_E5.mp3', 'rec_s_Fs5.mp3', 'rec_s_Gs5.mp3', 'shk1.mp3', 'shk2.mp3', 'shk3.mp3', 'shk4.mp3', 'tamb_hit1.mp3', 'tamb_hit2.mp3', 'tamb_shake1.mp3'].map((n) => 'audio/' + n);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).then(() => Promise.all(AUDIO.map((u) => c.add(u).catch(() => {}))))).catch(() => {}));
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
