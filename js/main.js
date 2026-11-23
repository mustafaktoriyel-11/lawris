// Lawris - oyun mantığı
import { Board, COLS, ROWS, nextId } from './board.js';
import { TYPES, WEIGHTS, cellsOf, sizeOf, clearSpriteCache } from './pieces.js';
import { Renderer } from './render.js';
import { setLevelColors, tickColors } from './theme.js';
import { initInput } from './input.js';
import { music } from './music.js';

const LEVELS = ['Sulh', 'Asliye', 'İstinaf', 'Yargıtay'];
const LINE_SCORE = [0, 100, 300, 500, 800, 1200, 1800];
const GOLD_CHANCE = 0.08;
const LOCK_DELAY = 500;   // yere değdikten sonra kayma/döndürme süresi (ms)
const MAX_RESETS = 15;    // aynı yükseklikte süreyi en fazla kaç kez yenileyebilir
const $ = (id) => document.getElementById(id);

const board = new Board();
const canvas = $('board');
const renderer = new Renderer(canvas);
const prevCv = $('next');

let state = 'menu'; // menu | play | pause | over
let piece = null, next = null;
let score = 0, rows = 0, level = 0, best = 0;
let lockMs = 0, resets = 0, lowestY = 0;
let doubleLeft = 0, slowMs = 0, acc = 0, last = 0;

try { best = parseInt(localStorage.getItem('lawris.best') || '0', 10) || 0; } catch (_) { best = 0; }

function newPiece() {
  let r = Math.random() * TYPES.reduce((a, t) => a + WEIGHTS[t], 0), type = TYPES[0];
  for (const t of TYPES) { r -= WEIGHTS[t]; if (r < 0) { type = t; break; } }
  return { type, rot: 0, x: 0, y: 0, golden: Math.random() < GOLD_CHANCE, id: 0 };
}
function spawn() {
  piece = next || newPiece();
  next = newPiece();
  piece.id = nextId();
  piece.rot = 0;
  piece.x = Math.floor((COLS - sizeOf(piece.type, 0).w) / 2);
  piece.y = 0;
  acc = 0; lockMs = 0; resets = 0; lowestY = 0;
  renderer.drawPreview(prevCv, next);
  if (board.collides(piece)) gameOver();
}

const gravityMs = () => {
  let ms = Math.max(90, 800 * Math.pow(0.86, Math.floor(rows / 3)));
  if (slowMs > 0) ms *= 1.8;
  return ms;
};

function toast(text) {
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
  $('level').textContent = LEVELS[level];
  $('status').textContent = (doubleLeft > 0 ? 'x2 puan (' + doubleLeft + ') ' : '') + (slowMs > 0 ? 'yavaş ' + Math.ceil(slowMs / 1000) + 'sn' : '');
}

function ghostY() {
  let y = piece.y;
  while (!board.collides(piece, piece.x, y + 1)) y++;
  return y;
}

function applyGolden(p) {
  const cells = cellsOf(p.type, p.rot);
  switch (p.type) {
    case 'tokmak': {
      const low = p.y + Math.max(...cells.map((c) => c[1]));
      board.removeRows([low]); score += 150;
      toast('Altın Tokmak: dokunduğu en alt satır silindi.');
      break;
    }
    case 'sutun': {
      const cols = new Map();
      for (const [cx, cy] of cells) cols.set(p.x + cx, Math.max(cols.get(p.x + cx) ?? -1, p.y + cy));
      for (const [x, y] of cols) board.fillPlain(x, y + 1);
      toast('Altın Sütun: altındaki boşluklar mermerle dolduruldu.');
      break;
    }
    case 'terazi':
      score += 250; slowMs = 10000;
      toast('Altın Terazi: +250 puan, yerçekimi 10 sn yavaş.');
      break;
    case 'kanun':
      doubleLeft = 3;
      toast('Altın Kanun: sonraki 3 satır silmede puan iki katı.');
      break;
    case 'paragraf': {
      const t = board.topRow();
      if (t >= 0) board.removeRows([t]);
      toast('Altın Paragraf: itiraz! En üst satır kaldırıldı.');
      break;
    }
    case 'kilic': {
      const bl = [cells[4], cells[5]];
      if (bl[0][0] === bl[1][0]) board.clearColumn(p.x + bl[0][0]);
      else board.removeRows([p.y + bl[0][1]]);
      score += 150;
      toast('Kılıç hükmü kesti: bıçağın sütunu temizlendi.');
      break;
    }
  }
}

function lockPiece() {
  board.lock(piece);
  if (piece.golden) applyGolden(piece);
  const full = board.fullRows();
  if (full.length) {
    board.removeRows(full);
    const n = full.length;
    let pts = (LINE_SCORE[Math.min(n, LINE_SCORE.length - 1)]) * (level + 1);
    if (doubleLeft > 0) { pts *= 2; doubleLeft--; }
    score += pts; rows += n;
    flash('Hüküm!');
    music.knock();
    const nl = Math.min(LEVELS.length - 1, Math.floor(rows / 8));
    if (nl > level) { level = nl; music.setLevel(level); toast('Yeni mahkeme: ' + LEVELS[level]); setLevelColors(level); }
  }
  piece = null;
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
  left() { if (state === 'play' && !board.collides(piece, piece.x - 1, piece.y)) { piece.x--; moved(); } },
  right() { if (state === 'play' && !board.collides(piece, piece.x + 1, piece.y)) { piece.x++; moved(); } },
  down() {
    if (state !== 'play') return;
    if (!grounded()) { piece.y++; fell(); score += 1; acc = 0; hud(); }
  },
  rotate() {
    if (state !== 'play') return;
    const nr = (piece.rot + 1) & 3;
    const kicks = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]];
    for (const [dx, dy] of kicks) {
      if (piece.y + dy >= 0 && !board.collides(piece, piece.x + dx, piece.y + dy, nr)) { piece.x += dx; piece.y += dy; piece.rot = nr; moved(); return; }
    }
  },
  drop() {
    if (state !== 'play') return;
    let n = 0;
    while (!board.collides(piece, piece.x, piece.y + 1)) { piece.y++; n++; }
    score += n * 2;
    lockPiece();
  },
  pause() {
    if (state === 'play') { state = 'pause'; $('pause').hidden = false; music.pause(); }
    else if (state === 'pause') { state = 'play'; $('pause').hidden = true; last = performance.now(); music.resume(); }
  },
};

function start() {
  music.init();
  music.start();
  board.reset();
  score = 0; rows = 0; level = 0; doubleLeft = 0; slowMs = 0;
  setLevelColors(0, true);
  next = null; piece = null;
  for (const id of ['menu', 'over', 'pause']) $(id).hidden = true;
  state = 'play';
  spawn();
  hud();
  last = performance.now();
}

function gameOver() {
  state = 'over';
  music.fadeOut();
  if (score > best) {
    best = score;
    try { localStorage.setItem('lawris.best', String(best)); } catch (_) { /* yoksay */ }
  }
  $('final').textContent = score;
  $('finalBest').textContent = best;
  $('over').hidden = false;
  hud();
}

function frame(t) {
  const dt = Math.min(100, t - last); last = t;
  tickColors(dt);
  if (state === 'play' && piece) {
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
  renderer.draw({ board, piece: state === 'menu' ? null : piece, ghostY: piece ? ghostY() : 0 });
  requestAnimationFrame(frame);
}

function layout() {
  const w = $('stage');
  renderer.resize(w.clientWidth, w.clientHeight);
  clearSpriteCache();
  const d = window.devicePixelRatio || 1;
  prevCv.width = Math.round(64 * d); prevCv.height = Math.round(64 * d);
  renderer.drawPreview(prevCv, next);
}

$('play').addEventListener('click', start);
$('again').addEventListener('click', start);
$('resume').addEventListener('click', () => act.pause());
$('pauseBtn').addEventListener('click', () => act.pause());
function showMute() {
  const b = $('muteBtn'), m = music.isMuted();
  b.textContent = m ? '\u266A\u0338' : '\u266A';
  b.classList.toggle('off', m);
  b.setAttribute('aria-pressed', String(!m));
  b.setAttribute('aria-label', m ? 'Müziği aç' : 'Müziği kapat');
}
$('muteBtn').addEventListener('click', () => { music.setMuted(!music.isMuted()); showMute(); });
showMute();
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') act.pause(); });
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 150));

initInput(act, canvas, () => renderer.cellCss);
$('best').textContent = best;
layout();
requestAnimationFrame((t) => { last = t; frame(t); });
window.__lawris = { board, act, get state() { return state; }, get piece() { return piece; } };
