// Lawris - oyun mantığı
import { Board, COLS, ROWS, nextId } from './board.js';
import { TYPES, NAMES, cellsOf, sizeOf, clearSpriteCache } from './pieces.js';
import { Renderer } from './render.js';
import { initInput } from './input.js';

const LEVELS = ['Sulh', 'Asliye', 'İstinaf', 'Yargıtay'];
const LINE_SCORE = [0, 100, 300, 500, 800, 1200, 1800];
const GOLD_CHANCE = 0.08;
const $ = (id) => document.getElementById(id);

const board = new Board();
const canvas = $('board');
const renderer = new Renderer(canvas);
const prevCv = $('next');

let state = 'menu'; // menu | play | pause | over
let piece = null, next = null;
let score = 0, rows = 0, level = 0, best = 0;
let doubleLeft = 0, slowMs = 0, swapAvail = false, acc = 0, last = 0;

try { best = parseInt(localStorage.getItem('lawris.best') || '0', 10) || 0; } catch (_) { best = 0; }

function newPiece(forceNormal) {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  return { type, rot: 0, x: 0, y: 0, golden: !forceNormal && Math.random() < GOLD_CHANCE, id: 0 };
}
function spawn() {
  piece = next || newPiece();
  next = newPiece();
  piece.id = nextId();
  piece.rot = 0;
  piece.x = Math.floor((COLS - sizeOf(piece.type, 0).w) / 2);
  piece.y = 0;
  acc = 0;
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
  $('swap').hidden = !swapAvail;
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
    case 'cilt':
      doubleLeft = 3;
      toast('Altın Kanun cildi: sonraki 3 satır silmede puan iki katı.');
      break;
    case 'paragraf': {
      const t = board.topRow();
      if (t >= 0) board.removeRows([t]);
      toast('Altın Paragraf: itiraz! En üst satır kaldırıldı.');
      break;
    }
    case 'muhur':
      swapAvail = true;
      toast('Altın Mühür: sıradaki davayı değiştirmek için önizlemeye dokun.');
      break;
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
    const nl = Math.min(LEVELS.length - 1, Math.floor(rows / 8));
    if (nl > level) { level = nl; toast('Yeni mahkeme: ' + LEVELS[level]); }
  }
  piece = null;
  spawn();
  hud();
}

function stepDown() {
  if (!board.collides(piece, piece.x, piece.y + 1)) piece.y++;
  else lockPiece();
}

const act = {
  left() { if (state === 'play' && !board.collides(piece, piece.x - 1, piece.y)) piece.x--; },
  right() { if (state === 'play' && !board.collides(piece, piece.x + 1, piece.y)) piece.x++; },
  down() {
    if (state !== 'play') return;
    if (!board.collides(piece, piece.x, piece.y + 1)) { piece.y++; score += 1; acc = 0; hud(); }
  },
  rotate() {
    if (state !== 'play') return;
    const nr = (piece.rot + 1) & 3;
    for (const dx of [0, -1, 1, -2, 2]) {
      if (!board.collides(piece, piece.x + dx, piece.y, nr)) { piece.x += dx; piece.rot = nr; return; }
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
    if (state === 'play') { state = 'pause'; $('pause').hidden = false; }
    else if (state === 'pause') { state = 'play'; $('pause').hidden = true; last = performance.now(); }
  },
};

function start() {
  board.reset();
  score = 0; rows = 0; level = 0; doubleLeft = 0; slowMs = 0; swapAvail = false;
  next = null; piece = null;
  for (const id of ['menu', 'over', 'pause']) $(id).hidden = true;
  state = 'play';
  spawn();
  hud();
  last = performance.now();
}

function gameOver() {
  state = 'over';
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
  if (state === 'play' && piece) {
    if (slowMs > 0) { slowMs = Math.max(0, slowMs - dt); }
    acc += dt;
    const g = gravityMs();
    while (acc >= g && state === 'play') { acc -= g; stepDown(); }
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
$('nextBox').addEventListener('click', () => {
  if (state !== 'play' || !swapAvail) return;
  swapAvail = false;
  next = newPiece(true);
  renderer.drawPreview(prevCv, next);
  toast('Sıradaki dava değiştirildi.');
  hud();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') act.pause(); });
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 150));

initInput(act, canvas, () => renderer.cellCss);
$('best').textContent = best;
layout();
requestAnimationFrame((t) => { last = t; frame(t); });
window.__lawris = { board, act, get state() { return state; }, get piece() { return piece; } };
