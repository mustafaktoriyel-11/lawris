// Lex Stack - oyun mantığı
import { Board, COLS, ROWS, nextId } from './board.js';
import { TYPES, WEIGHTS, cellsOf, sizeOf, clearSpriteCache } from './pieces.js';
import { Renderer } from './render.js';
import { setLevelColors, tickColors } from './theme.js';
import { initInput } from './input.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import * as skor from './skor.js';
import { initRehber } from './rehber.js';
import { t, setLang, onLang, fmtDate, courtLabel, isDefaultName } from './i18n.js';
import { aslanHukum, aslanSeviye, kediSoyle, kediMenu, kediOver, maskotReset } from './maskot.js';
import './menuyigin.js';

const DEBUG_LV = (() => { try { const v = +new URLSearchParams(location.search).get('seviye'); return v >= 1 && v <= 3 ? v | 0 : 0; } catch (_) { return 0; } })();
const LEVEL_COUNT = 4;   // mahkeme adları i18n'de: court.N.short / court.N.full
const levelName = (i) => t('court.' + i + '.short');
const LINE_SCORE = [0, 100, 300, 500, 800, 1200, 1800];
const GOLD_CHANCE = 0.08;
const LOCK_DELAY = 500;   // yere değdikten sonra kayma/döndürme süresi (ms)
const MAX_RESETS = 15;    // aynı yükseklikte süreyi en fazla kaç kez yenileyebilir
const $ = (id) => document.getElementById(id);

const board = new Board();
const canvas = $('board');
const renderer = new Renderer(canvas);
const prevCvs = [$('next'), $('next2'), $('next3')];
const holdCv = $('hold');
const QUEUE_LEN = 3;

let playMs = 0, sureSn = -1;
const fmtSure = (ms) => { const s = Math.floor(ms / 1000), m = Math.floor(s / 60); return (m < 10 ? '0' : '') + m + ':' + String(s % 60).padStart(2, '0'); };
let state = 'menu'; // menu | play | pause | over
let piece = null, queue = [], held = null, holdUsed = false;
let score = 0, rows = 0, level = 0, best = 0;
let lockMs = 0, resets = 0, lowestY = 0;
let flashInfo = null, pvMs = 0;
const bursts = [];
const burst = (o) => { bursts.push({ ...o, t0: performance.now() }); if (bursts.length > 8) bursts.shift(); };
const announced = new WeakSet();
let doubleLeft = 0, slowMs = 0, acc = 0, last = 0;

best = skor.enIyi();

function newPiece() {
  let r = Math.random() * TYPES.reduce((a, t) => a + WEIGHTS[t], 0), type = TYPES[0];
  for (const t of TYPES) { r -= WEIGHTS[t]; if (r < 0) { type = t; break; } }
  return { type, rot: 0, x: 0, y: 0, golden: Math.random() < GOLD_CHANCE, id: 0 };
}
function announce(p) {
  if (p && p.golden && !announced.has(p)) { announced.add(p); music.chime(); }
}
function refill() {
  while (queue.length < QUEUE_LEN) queue.push(newPiece());
  queue.forEach(announce);
}
const hasGoldenView = () => queue.some((p) => p.golden) || (held && held.golden);
function drawQueue() {
  prevCvs.forEach((cv, i) => renderer.drawPreview(cv, queue[i]));
  renderer.drawPreview(holdCv, held);
  $('holdBox').classList.toggle('used', holdUsed);
}
// parçayı tepeye yerleştirir; sığmazsa oyun biter
function place(p) {
  piece = p;
  announce(piece);
  piece.id = nextId();
  piece.rot = 0; piece.rx = 0; piece.ry = 0;
  piece.x = Math.floor((COLS - sizeOf(piece.type, 0).w) / 2);
  piece.y = 0;
  acc = 0; lockMs = 0; resets = 0; lowestY = 0;
  drawQueue();
  if (board.collides(piece)) gameOver();
}
function spawn() {
  refill();
  holdUsed = false;
  const p = queue.shift();
  refill();
  place(p);
}

const gravityMs = () => {
  let ms = Math.max(110, 800 * Math.pow(0.95, Math.floor(rows / 3)));
  if (slowMs > 0) ms *= 1.8;
  return ms;
};

function toast(text, gold) {
  if (state === 'play' && gold) { kediSoyle(text, 2200); return; }
  const el = $('toast');
  el.textContent = text;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
function flash(text) {
  const el = $('flash');
  el.textContent = text;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

function hud() {
  $('score').textContent = score;
  $('best').textContent = best;
  $('menuBest').textContent = best;
  $('level').textContent = levelName(level);
  $('status').textContent = (doubleLeft > 0 ? t('hud.x2', { n: doubleLeft }) : '') + (slowMs > 0 ? t('hud.slow', { n: Math.ceil(slowMs / 1000) }) : '');
  $('level').parentElement.classList.toggle('st', doubleLeft > 0 || slowMs > 0);   // dar ekranda süre yerine durum görünür
}

function ghostY() {
  let y = piece.y;
  while (!board.collides(piece, piece.x, y + 1)) y++;
  return y;
}

// Altın Kanun: puanın yanında "x2" rozeti (DOM; hareket azaltılmışsa gösterilmez)
function x2Badge() {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const host = $('score').parentElement, el = document.createElement('span');
  el.className = 'x2pop'; el.textContent = '\u00D72'; el.setAttribute('aria-hidden', 'true');
  host.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
  setTimeout(() => el.remove(), 1500);
}

function applyGolden(p) {
  const cells = cellsOf(p.type, p.rot);
  music.sfx(p.type);
  switch (p.type) {
    case 'tokmak': {
      const ys = new Set(cells.map((c) => p.y + c[1]));
      { const rs = [...ys].filter((y) => y >= 0 && y < ROWS); burst({ rows: rs, gold: true, kind: 'tokmak' }); board.removeRows(rs); } score += 150;
      toast(t('toast.tokmak'), true);
      break;
    }
    case 'sutun': {
      const cols = new Map();
      for (const [cx, cy] of cells) cols.set(p.x + cx, Math.max(cols.get(p.x + cx) ?? -1, p.y + cy));
      for (const [x, y] of cols) board.fillPlain(x, y + 1);
      burst({ cols: [...cols.keys()], from: Math.min(...cols.values()) + 1, gold: true, kind: 'sutun' });
      toast(t('toast.sutun'), true);
      break;
    }
    case 'terazi':
      score += 250; slowMs = 10000;
      toast(t('toast.terazi'), true);
      break;
    case 'kanun':
      doubleLeft = 3; x2Badge();
      toast(t('toast.kanun'), true);
      break;
    case 'paragraf': {
      const tr0 = board.topRow();
      if (tr0 >= 0) { burst({ rows: [tr0], gold: true, kind: 'paragraf' }); board.removeRows([tr0]); }
      toast(t('toast.paragraf'), true);
      break;
    }
    case 'kalem': {
      const y = board.fullestRow();
      if (y >= 0) { burst({ rows: [y], gold: true, kind: 'kalem' }); board.fillRowPlain(y); }
      score += 100;
      toast(t('toast.kalem'), true);
      break;
    }
    case 'kilic': {
      // son iki hücre bıçaktır (döndürmede sıra korunur)
      const ys = cells.slice(4, 6).map((c) => p.y + c[1]);
      const set = new Set(ys);
      const below = Math.max(...ys) + 1;
      if (below < ROWS) set.add(below);
      { const rs = [...set].filter((y) => y >= 0 && y < ROWS); burst({ rows: rs, gold: true, kind: 'kilic' }); board.removeRows(rs); } score += 150;
      toast(t('toast.kilic'), true);
      break;
    }
  }
}

// Müzik gerilimi: en yüksek dolu satırın yüksekliğine göre 0..1 (kilitlenme / satır silme / altın etki sonrası)
function updateTension() {
  const top = board.topRow(), height = top < 0 ? 0 : ROWS - top;
  music.setTension(Math.max(0, Math.min(1, (height - 0.45 * ROWS) / (0.4 * ROWS))));
}

function lockPiece(hard) {
  const wasGold = piece.golden, ltype = piece.type;
  board.lock({ ...piece, golden: false });   // etkisini gösterince söner
  if (wasGold) { flashInfo = { id: piece.id, t0: performance.now() }; applyGolden(piece); }
  const full = board.fullRows();
  if (!full.length) { if (!hard) sfx.lock(ltype); }   // satır silinmiyorsa tok yerleşme sesi (hard: whoosh+thud ayrıca çalındı)
  if (full.length) {
    burst({ rows: full });
    board.removeRows(full);
    const n = full.length;
    let pts = (LINE_SCORE[Math.min(n, LINE_SCORE.length - 1)]) * (level + 1);
    if (doubleLeft > 0) { pts *= 2; doubleLeft--; }
    score += pts; rows += n;
    flash(t('flash.verdict'));
    if (n >= 2) aslanHukum(n);
    sfx.lineClear(n, level);
    const nl = Math.min(LEVEL_COUNT - 1, Math.floor(rows / 8));
    if (nl > level) { level = nl; music.setLevel(level); aslanSeviye(level); setLevelColors(level); sfx.levelUp(level, 0.45); }
  }
  piece = null;
  updateTension();
  spawn();
  hud();
}

const grounded = () => board.collides(piece, piece.x, piece.y + 1);
function fell() {
  if (piece.y > lowestY) { lowestY = piece.y; resets = 0; }
}
function stepDown() {
  if (!grounded()) { piece.y++; fell(); }
}
// Yerdeyken yapılan başarılı hareket kilit süresini yeniler (sınırlı sayıda)
function moved() {
  if (resets < MAX_RESETS) { lockMs = 0; resets++; }
}

const act = {
  left() { if (state === 'play' && !board.collides(piece, piece.x - 1, piece.y)) { piece.x--; moved(); sfx.move(); } },
  right() { if (state === 'play' && !board.collides(piece, piece.x + 1, piece.y)) { piece.x++; moved(); sfx.move(); } },
  down() {
    if (state !== 'play') return;
    if (!grounded()) { piece.y++; fell(); score += 1; acc = 0; hud(); }
  },
  rotate() {
    if (state !== 'play') return;
    const nr = (piece.rot + 1) & 3;
    // Parça kendi merkezi etrafında döner. Yarım hücrelik kayma rx/ry'de saklanır,
    // böylece 4 dönüşte parça başladığı yere döner (yukarı/sola tırmanmaz).
    const o = sizeOf(piece.type, piece.rot), n = sizeOf(piece.type, nr);
    const ex = piece.x + (piece.rx || 0) + (o.w - n.w) / 2, ey = piece.y + (piece.ry || 0) + (o.h - n.h) / 2;
    const bx = Math.round(ex), by = Math.round(ey), rx = ex - bx, ry = ey - by;
    // Önce yerinde, sonra yanlara, sonra aşağı; yukarı itme en son çare
    const kicks = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, 1], [-1, 1], [1, 1],
      [0, -1], [-1, -1], [1, -1], [-2, -1], [2, -1], [0, -2], [-1, -2], [1, -2]];
    for (const [dx, dy] of kicks) {
      const x = bx + dx, y = by + dy;
      if (y >= 0 && !board.collides(piece, x, y, nr)) { piece.x = x; piece.y = y; piece.rot = nr; piece.rx = rx; piece.ry = ry; moved(); sfx.rotate(); return; }
    }
  },
  drop() {
    if (state !== 'play') return;
    let n = 0;
    while (!board.collides(piece, piece.x, piece.y + 1)) { piece.y++; n++; }
    score += n * 2;
    sfx.hardDrop(piece.type, n);
    lockPiece(true);
  },
  hold() {
    if (state !== 'play' || !piece || holdUsed) return;
    const cur = { type: piece.type, golden: piece.golden };
    if (announced.has(piece)) announced.add(cur);
    let nx;
    if (held) nx = held;
    else { refill(); nx = queue.shift(); refill(); }
    held = cur; holdUsed = true;
    sfx.hold();
    place(nx);
  },
  pause() {
    if (state === 'play') { state = 'pause'; $('pause').hidden = false; music.pause(); }
    else if (state === 'pause') { state = 'play'; $('pause').hidden = true; last = performance.now(); music.resume(); }
  },
};

function start() {
  sonKayit = null;
  playMs = 0; sureSn = -1; $('sure').textContent = '00:00';
  maskotReset();
  music.init();
  music.start();
  music.setTension(0);
  board.reset();
  score = 0; rows = 0; level = DEBUG_LV; doubleLeft = 0; slowMs = 0;
  if (level) rows = level * 8;
  setLevelColors(level, true);
  queue = []; held = null; holdUsed = false; piece = null;
  for (const id of ['menu', 'over', 'pause', 'rehber']) $(id).hidden = true;
  state = 'play';
  spawn();
  hud();
  last = performance.now();
}

// ---- Şeref kürsüsü ----
let sonKayit = null, kursuOnceki = null, temizOnay = 0;

function kayitHazirla() {
  $('kayitSonuc').hidden = true; $('kayitSonuc').classList.remove('yeni');
  const f = $('kayit');
  f.hidden = !skor.sigarMi(score);
  if (!f.hidden) $('adIn').value = skor.sonAd();
}
function kayitEt(e) {
  e.preventDefault();
  if ($('kayit').hidden) return;
  const ad = skor.temizAd($('adIn').value);
  const sira = skor.ekle(ad, score, 'c' + level, rows);
  sonKayit = { ad, puan: score };
  best = Math.max(best, skor.enIyi());
  hud(); $('finalBest').textContent = best;
  $('kayit').hidden = true;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  const r = $('kayitSonuc');
  r.textContent = t('kayit.saved', { n: sira });
  r.dataset.sira = sira;
  r.hidden = false; r.classList.remove('yeni'); void r.offsetWidth; r.classList.add('yeni');
}
function kursuCiz() {
  const ol = $('kursuList'), l = skor.liste();
  ol.textContent = '';
  l.forEach((e, i) => {
    const li = document.createElement('li');
    if (i < 3) li.classList.add('r' + (i + 1));
    if (sonKayit && sonKayit.ad === e.ad && sonKayit.puan === e.puan) li.classList.add('yeni');
    const mk = (cls, t) => { const s = document.createElement('span'); s.className = cls; s.textContent = t; li.appendChild(s); };
    mk('rk', String(i + 1));
    mk('nm', isDefaultName(e.ad) ? t('kayit.defaultName') : e.ad);
    mk('pn', String(e.puan));
    mk('mt', [courtLabel(e.mahkeme), fmtDate(e.tarih)].filter(Boolean).join(' · '));
    ol.appendChild(li);
  });
  $('kursuBos').hidden = l.length > 0;
  ol.hidden = l.length === 0;
  $('kursuTemizle').hidden = l.length === 0;
  temizOnay = 0; $('kursuTemizle').textContent = t('kursu.clear');
}
function kursuAc(opener) {
  kursuOnceki = opener || null;
  kursuCiz();
  $('kursu').hidden = false;
  $('kursuKapat').focus({ preventScroll: true });
}
function kursuKapat() {
  $('kursu').hidden = true;
  if (kursuOnceki && !kursuOnceki.closest('[hidden]')) kursuOnceki.focus({ preventScroll: true });
  kursuOnceki = null;
}
$('kursuBtn').addEventListener('click', (e) => kursuAc(e.currentTarget));
$('overKursu').addEventListener('click', (e) => kursuAc(e.currentTarget));
$('kursuKapat').addEventListener('click', kursuKapat);
$('kursuTemizle').addEventListener('click', () => {
  const b = $('kursuTemizle');
  if (!temizOnay) {
    temizOnay = 1; b.textContent = t('kursu.confirm');
    setTimeout(() => { if (temizOnay) { temizOnay = 0; b.textContent = t('kursu.clear'); } }, 4000);
    return;
  }
  skor.temizle(); sonKayit = null;
  kursuCiz();
  $('menuBest').textContent = best;
});
$('kayit').addEventListener('submit', kayitEt);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('kursu').hidden) kursuKapat(); });

function gameOver() {
  state = 'over';
  music.fadeOut(1.0); music.setTension(0);
  sfx.gameOver();
  music.startMenu(2800);   // sting bitince menü müziği (Tekrar oyna başlatırsa iptal olur)
  if (score > best) {
    best = score;
    try { localStorage.setItem('lawris.best', String(best)); } catch (_) { /* yoksay */ }
  }
  kayitHazirla();
  $('final').textContent = score;
  $('finalBest').textContent = best;
  $('finalSure').textContent = fmtSure(playMs);
  $('over').hidden = false;
  maskotReset();
  kediOver();
  hud();
}

function frame(t) {
  const dt = Math.min(100, t - last); last = t;
  tickColors(dt);
  if (state === 'play' && piece) {
    playMs += dt;
    const sn = Math.floor(playMs / 1000);
    if (sn !== sureSn) { sureSn = sn; $('sure').textContent = fmtSure(playMs); }
    if (slowMs > 0) { slowMs = Math.max(0, slowMs - dt); }
    if (grounded()) {
      acc = 0; lockMs += dt;
      if (lockMs >= LOCK_DELAY) lockPiece();
    } else {
      lockMs = 0; acc += dt;
      const g = gravityMs();
      while (acc >= g && state === 'play' && !grounded()) { acc -= g; stepDown(); }
    }
    if ($('status').textContent !== '' || slowMs > 0) hud();
  }
  if (state !== 'menu' && hasGoldenView() && t - pvMs > 33) { pvMs = t; drawQueue(); }
  renderer.draw({ board, piece: state === 'menu' ? null : piece, ghostY: piece ? ghostY() : 0, flash: flashInfo, bursts, slow: slowMs > 0 });
  requestAnimationFrame(frame);
}

let lastKey = '';
function layout() {
  const w = $('stage');
  const cw = w.clientWidth, ch = w.clientHeight;
  if (!cw || !ch) return;
  const d = window.devicePixelRatio || 1;
  renderer.resize(cw, ch);
  // hücre boyutu ya da çözünürlük değişmediyse sprite önbelleği korunur
  const key = renderer.s + '@' + d;
  if (key !== lastKey) { clearSpriteCache(); lastKey = key; }
  for (const cv of [...prevCvs, holdCv]) {
    const px = cv.clientWidth || Number(cv.dataset.px);
    const n = Math.round(px * d);
    if (cv.width !== n) cv.width = cv.height = n;
  }
  // balon, uyarı ve bildirimler görünüm penceresine değil tahta dikdörtgenine göre konumlanır
  const st = w.style;
  st.setProperty('--bx', canvas.offsetLeft + 'px'); st.setProperty('--by', canvas.offsetTop + 'px');
  st.setProperty('--bw', canvas.offsetWidth + 'px'); st.setProperty('--bh', canvas.offsetHeight + 'px');
  drawQueue();
}
let layoutTm = 0;
function layoutSoon() { clearTimeout(layoutTm); layoutTm = setTimeout(layout, 60); }

$('play').addEventListener('click', start);
$('again').addEventListener('click', start);
// Ana menüye dönüş
function toMenu() {
  state = 'menu'; piece = null;
  for (const id of ['over', 'pause', 'kursu', 'rehber']) { const el = $(id); if (el) el.hidden = true; }
  board.reset(); setLevelColors(0, true);
  music.startMenu(); music.setTension(0); maskotReset(); kediMenu();
  $('menuBest').textContent = best;
  $('menu').hidden = false;
}
$('overMenu').addEventListener('click', toMenu);
$('pauseMenu').addEventListener('click', toMenu);
$('resume').addEventListener('click', () => act.pause());
$('pauseBtn').addEventListener('click', () => act.pause());
// Müzik / efekt düğmeleri (HUD + açılış ekranı); durum localStorage'da (music.js)
function showSnd() {
  const mm = music.isMuted(), sm = music.isSfxMuted();
  document.querySelectorAll('[data-snd]').forEach((b) => {
    const isMusic = b.dataset.snd === 'music', off = isMusic ? mm : sm;
    b.classList.toggle('off', off);
    b.setAttribute('aria-pressed', String(!off));
    b.setAttribute('aria-label', t(isMusic ? (off ? 'aria.musicOn' : 'aria.musicOff') : (off ? 'aria.sfxOn' : 'aria.sfxOff')));
  });
}
document.querySelectorAll('[data-snd]').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.snd === 'music') music.setMuted(!music.isMuted());
  else { music.setSfxMuted(!music.isSfxMuted()); if (!music.isSfxMuted()) sfx.ui(); }
  showSnd();
}));
showSnd();
// Dil düğmeleri (açılış ekranı + duraklatma kartı) ve canlı yenileme
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.lang); b.blur(); }));
onLang(() => {
  showSnd(); hud();
  if (!$('kursu').hidden) kursuCiz();
  const r = $('kayitSonuc');
  if (!r.hidden && r.dataset.sira) r.textContent = t('kayit.saved', { n: r.dataset.sira });
  kediMenu(); if (!$('over').hidden) kediOver(true);
});
// İlk kullanıcı hareketi: ses bağlamını aç; menüdeysek menü müziğini başlat (tarayıcılar otomatik çalmayı engeller)
let gestured = false;
function firstGesture() {
  if (gestured) return;
  gestured = true;
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.removeEventListener(ev, firstGesture, true));
  music.init();
  if (state === 'menu') music.startMenu();
}
['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, firstGesture, true));
// Arayüz tıkı: tek belge dinleyicisi (yakalama evresi; oyun içi hareket düğmeleri kendi sesini çalar)
document.addEventListener('click', (e) => {
  const el = e.target.closest && e.target.closest('button, [role="button"], .chip');
  if (!el || el.disabled || el.hasAttribute('data-act')) return;
  sfx.ui();
}, true);
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') act.pause(); music.setHidden(document.hidden); });
window.addEventListener('resize', layoutSoon);
window.addEventListener('orientationchange', () => { layoutSoon(); setTimeout(layout, 300); });
if (typeof ResizeObserver === 'function') new ResizeObserver(layoutSoon).observe($('stage'));
// Üst çubuk düğmeleri odakta kalmasın (Boşluk tuşu düşürme olarak çalışsın)
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('#hud button, #hud [data-act]'); if (b && b.blur) b.blur(); });

initInput(act, canvas, () => renderer.cellCss);
initRehber({ onStart: start });
$('best').textContent = best;
$('menuBest').textContent = best;
kediMenu();
layout();
requestAnimationFrame((t) => { last = t; frame(t); });
window.__lawris = { board, act, applyGolden, lockPiece, get state() { return state; }, get piece() { return piece; }, get held() { return held; }, get queue() { return queue; }, get holdUsed() { return holdUsed; }, get score() { return score; }, setLevel(n) { level = n; setLevelColors(n); } };

// Çevrimdışı çalışma ve her açılışta güncel sürüm
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
