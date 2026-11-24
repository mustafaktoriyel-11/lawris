// Lawris - "Nasıl oynanır" rehberi (4 kaydırmalı kart)
import { getSprite, sizeOf } from './pieces.js';

const LINES = [
  'Önce kontrolleri öğren, sonra kürsü senin!',
  'Altı parça, altı hukuk sembolü.',
  'Altın parça görürsen sevin!',
  'Yargıtay\'a kadar çıkabilir misin?',
];
const KEY = 'lawris.rehber';
const $ = (id) => document.getElementById(id);

export function initRehber({ onStart }) {
  const root = $('rehber'), track = $('rehberTrack');
  const cards = [...track.querySelectorAll('.rh-card')];
  const dots = [...$('rehberDots').children];
  const ileri = $('rehberIleri'), geri = $('rehberGeri');
  let idx = 0, opener = null;

  const isOpen = () => !root.hidden;

  function drawSprites() {
    const d = Math.min(3, window.devicePixelRatio || 1);
    track.querySelectorAll('canvas[data-t]').forEach((cv) => {
      const t = cv.dataset.t, g = cv.dataset.g === '1';
      const box = cv.getBoundingClientRect();
      const bw = cv.offsetWidth || box.width, bh = cv.offsetHeight || box.height;
      if (!bw || !bh) return;
      const sz = sizeOf(t, 0);
      const cell = Math.min(g ? 13 : 12, bw / sz.w, bh / sz.h);
      const s = Math.max(4, Math.round(cell * d));
      const sp = getSprite(t, 0, g, s);
      cv.width = Math.round(bw * d); cv.height = Math.round(bh * d);
      const c = cv.getContext('2d');
      c.imageSmoothingQuality = 'high';
      const w = sp.width * (cell * d / s), h = sp.height * (cell * d / s);
      c.drawImage(sp, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
    });
  }

  function show(i, smooth) {
    idx = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: idx * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    sync();
  }
  function sync() {
    dots.forEach((d, k) => d.classList.toggle('on', k === idx));
    cards.forEach((c, k) => c.setAttribute('aria-hidden', String(k !== idx)));
    $('rehberBubble').textContent = LINES[idx];
    ileri.textContent = idx === cards.length - 1 ? 'Başla' : 'İleri';
    geri.style.visibility = idx === 0 ? 'hidden' : 'visible';
  }

  let tm = 0;
  track.addEventListener('scroll', () => {
    clearTimeout(tm);
    tm = setTimeout(() => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (i !== idx) { idx = i; sync(); }
    }, 60);
  }, { passive: true });
  // kart içi kaydırmalar tahtaya ulaşmasın
  ['pointerdown', 'pointermove', 'pointerup', 'touchstart', 'touchmove'].forEach((ev) => root.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));

  function open(from) {
    opener = from || null;
    root.hidden = false;
    drawSprites();
    show(0, false);
    ileri.focus({ preventScroll: true });
  }
  function close(start) {
    if (root.hidden) return;
    root.hidden = true;
    try { localStorage.setItem(KEY, '1'); } catch (_) { /* yoksay */ }
    if (start) { onStart(); return; }
    if (opener && !opener.closest('[hidden]')) opener.focus({ preventScroll: true });
    opener = null;
  }

  ileri.addEventListener('click', () => { if (idx === cards.length - 1) close(true); else show(idx + 1, true); });
  geri.addEventListener('click', () => show(idx - 1, true));
  $('rehberX').addEventListener('click', () => close(false));
  window.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); close(false); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1, true); }
  });
  window.addEventListener('resize', () => { if (isOpen()) { drawSprites(); show(idx, false); } });

  $('rehberBtn').addEventListener('click', (e) => open(e.currentTarget));

  let seen = true;
  try { seen = localStorage.getItem(KEY) === '1'; } catch (_) { /* yoksay */ }
  if (!seen) open(null);
  return { open, close, isOpen };
}
