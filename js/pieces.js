import { THEME } from './theme.js';
// Lawris - parça tanımları ve sprite çizimi
export const TYPES = ['sutun', 'tokmak', 'kanun', 'terazi', 'paragraf', 'kilic'];
export const NAMES = {
  sutun: 'Sütun', tokmak: 'Tokmak', kanun: 'Kanun',
  terazi: 'Terazi', paragraf: 'Paragraf', kilic: 'Kılıç',
};
// Üretim ağırlıkları (Kılıç yarı olasılıkla gelir)
export const WEIGHTS = { sutun: 1, tokmak: 1, kanun: 1, terazi: 1, paragraf: 1, kilic: 0.5 };

const BASE = {
  sutun: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  tokmak: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
  kanun: [[0, 0], [1, 0], [0, 1], [1, 1]],
  terazi: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1]],
  paragraf: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]],
  // son iki hücre bıçaktır (dönmede sıra korunur)
  kilic: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]],
};

// 90 derece saat yönü: (x,y) -> (h-1-y, x)
function rotateCells(cells) {
  const h = Math.max(...cells.map((c) => c[1])) + 1;
  return cells.map(([x, y]) => [h - 1 - y, x]);
}
const SHAPES = {};
const SETS = {};
for (const t of TYPES) {
  SHAPES[t] = [BASE[t]];
  for (let i = 1; i < 4; i++) SHAPES[t][i] = rotateCells(SHAPES[t][i - 1]);
  SETS[t] = SHAPES[t].map((cs) => new Set(cs.map((c) => c[0] + ',' + c[1])));
}
export const cellsOf = (type, rot) => SHAPES[type][rot & 3];
export const hasCell = (type, rot, x, y) => SETS[type][rot & 3].has(x + ',' + y);
export function sizeOf(type, rot) {
  const cs = cellsOf(type, rot);
  return { w: Math.max(...cs.map((c) => c[0])) + 1, h: Math.max(...cs.map((c) => c[1])) + 1 };
}

// ---------- Renk paleti ----------
const C = {
  gold: '#C9A227', goldD: '#8C6F12', wood: '#7A4E2D', woodD: '#4E2F18',
  marble: '#E8E4DA', marbleD: '#A9A397', bordo: '#7A1F2B', bordoD: '#4A1119',
  green: '#2F5D50', greenD: '#1B3A31',
  ink: '#F3EBD3', steel: '#888780', steelD: '#5F5E5A',
};
const PAL = {
  tokmak: { main: C.wood, dark: C.woodD, acc: C.gold },
  terazi: { main: C.steel, dark: C.steelD, acc: C.gold },
  sutun: { main: C.marble, dark: C.marbleD, acc: C.marbleD },
  kanun: { main: THEME.kanun ? THEME.kanun.main : C.bordo, dark: THEME.kanun ? THEME.kanun.dark : C.bordoD, acc: C.gold, accD: C.goldD },
  paragraf: { main: C.green, dark: C.greenD, acc: C.ink },
  kilic: { main: C.steel, dark: C.steelD, acc: C.gold, accD: C.goldD, grip: C.wood, gripD: C.woodD, gem: C.bordo },
};
const GOLDEN = { main: C.gold, dark: C.goldD, acc: C.ink, accD: '#A89C74', grip: C.goldD, gripD: '#5E4A0C', gem: C.bordo };

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function fillStroke(c, fill, stroke, lw) {
  c.fillStyle = fill; c.fill();
  c.strokeStyle = stroke; c.lineWidth = lw; c.stroke();
}

// ---------- Parça çizimleri (rot 0) ----------
function dTokmak(c, s, P) {
  const lw = Math.max(1, s * 0.05);
  // sap: (1,1) ve (1,2) hücrelerini geniş ve düz doldurur
  rr(c, 1.2 * s, 0.85 * s, 0.6 * s, 1.85 * s, 0.05 * s); fillStroke(c, P.main, P.dark, lw);
  c.fillStyle = P.dark; c.fillRect(1.2 * s + lw, 0.9 * s, 0.1 * s, 1.7 * s);
  // sapta altın bilezikler
  c.fillStyle = P.acc;
  c.fillRect(1.2 * s, 1.15 * s, 0.6 * s, 0.1 * s);
  c.fillRect(1.2 * s, 2.0 * s, 0.6 * s, 0.1 * s);
  // topuz
  rr(c, 1.08 * s, 2.58 * s, 0.84 * s, 0.38 * s, 0.14 * s); fillStroke(c, P.main, P.dark, lw);
  // başlık: 0. satırı tamamen doldurur
  rr(c, 0.03 * s, 0.06 * s, 2.94 * s, 0.88 * s, 0.12 * s); fillStroke(c, P.main, P.dark, lw);
  c.fillStyle = P.dark;
  rr(c, 0.03 * s, 0.06 * s, 0.46 * s, 0.88 * s, 0.1 * s); c.fill();
  rr(c, 2.51 * s, 0.06 * s, 0.46 * s, 0.88 * s, 0.1 * s); c.fill();
  c.fillStyle = P.acc;
  c.fillRect(0.55 * s, 0.06 * s, 0.12 * s, 0.88 * s);
  c.fillRect(2.33 * s, 0.06 * s, 0.12 * s, 0.88 * s);
}
function dSutun(c, s, P) {
  const lw = Math.max(1, s * 0.04);
  c.fillStyle = P.main; c.strokeStyle = P.dark; c.lineWidth = lw;
  // gövde
  c.fillRect(0.1 * s, 0.3 * s, 0.8 * s, 4.4 * s);
  c.strokeRect(0.1 * s, 0.3 * s, 0.8 * s, 4.4 * s);
  for (const fx of [0.3, 0.5, 0.7]) { c.beginPath(); c.moveTo(fx * s, 0.4 * s); c.lineTo(fx * s, 4.6 * s); c.stroke(); }
  // başlık
  c.fillRect(0.03 * s, 0.03 * s, 0.94 * s, 0.14 * s); c.strokeRect(0.03 * s, 0.03 * s, 0.94 * s, 0.14 * s);
  rr(c, 0.06 * s, 0.16 * s, 0.88 * s, 0.16 * s, 0.05 * s); fillStroke(c, P.main, P.dark, lw);
  // kaide
  c.fillRect(0.06 * s, 4.68 * s, 0.88 * s, 0.14 * s); c.strokeRect(0.06 * s, 4.68 * s, 0.88 * s, 0.14 * s);
  c.fillRect(0.03 * s, 4.82 * s, 0.94 * s, 0.15 * s); c.strokeRect(0.03 * s, 4.82 * s, 0.94 * s, 0.15 * s);
}
// Kanun: 2x2 kitap, her zaman dik çizilir
function dKanun(c, s, P) {
  const lw = Math.max(1, s * 0.05);
  rr(c, 0.04 * s, 0.04 * s, 1.92 * s, 1.92 * s, 0.1 * s); fillStroke(c, P.main, P.dark, lw);
  // sırt
  c.fillStyle = P.dark; rr(c, 0.04 * s, 0.04 * s, 0.46 * s, 1.92 * s, 0.1 * s); c.fill();
  // altın bantlar (üst/alt)
  c.fillStyle = P.acc;
  c.fillRect(0.5 * s, 0.2 * s, 1.46 * s, 0.14 * s);
  c.fillRect(0.5 * s, 1.66 * s, 1.46 * s, 0.14 * s);
  c.fillRect(0.04 * s, 0.2 * s, 0.46 * s, 0.14 * s);
  c.fillRect(0.04 * s, 1.66 * s, 0.46 * s, 0.14 * s);
  // başlık çerçevesi + yazı satırları
  c.fillStyle = P.acc; c.fillRect(0.72 * s, 0.5 * s, 1.1 * s, 1.0 * s);
  c.strokeStyle = P.dark; c.lineWidth = lw; c.strokeRect(0.8 * s, 0.58 * s, 0.94 * s, 0.84 * s);
  c.lineWidth = Math.max(1.5, s * 0.07);
  c.beginPath();
  c.moveTo(0.95 * s, 0.82 * s); c.lineTo(1.59 * s, 0.82 * s);
  c.moveTo(0.95 * s, 1.0 * s); c.lineTo(1.59 * s, 1.0 * s);
  c.moveTo(0.95 * s, 1.18 * s); c.lineTo(1.4 * s, 1.18 * s);
  c.stroke();
}
function unionPlate(c, s, cells, P) {
  const has = (x, y) => cells.some((q) => q[0] === x && q[1] === y);
  const lw = Math.max(1.5, s * 0.07), i = 0.04 * s;
  c.fillStyle = P.main;
  for (const [x, y] of cells) {
    const x0 = x * s + (has(x - 1, y) ? 0 : i), x1 = (x + 1) * s - (has(x + 1, y) ? 0 : i);
    const y0 = y * s + (has(x, y - 1) ? 0 : i), y1 = (y + 1) * s - (has(x, y + 1) ? 0 : i);
    c.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  c.strokeStyle = P.dark; c.lineWidth = lw; c.lineCap = 'square';
  for (const [x, y] of cells) {
    const L = x * s + i, R = (x + 1) * s - i, T = y * s + i, B = (y + 1) * s - i;
    c.beginPath();
    if (!has(x, y - 1)) { c.moveTo(L, T); c.lineTo(R, T); }
    if (!has(x, y + 1)) { c.moveTo(L, B); c.lineTo(R, B); }
    if (!has(x - 1, y)) { c.moveTo(L, T); c.lineTo(L, B); }
    if (!has(x + 1, y)) { c.moveTo(R, T); c.lineTo(R, B); }
    c.stroke();
  }
  c.lineCap = 'butt';
}
function nb(cells, x, y) { return cells.filter((q) => Math.abs(q[0] - x) + Math.abs(q[1] - y) === 1); }
// Döndürülmüş hücrelerden dik (yerçekimine göre) çizim
function dParagraf(c, s, P, cells) {
  unionPlate(c, s, cells, P);
  // ortadaki hücre: iki komşusu karşılıklı
  const m = cells.find(([x, y]) => {
    const n = nb(cells, x, y);
    return n.length === 2 && n[0][0] + n[1][0] === 2 * x && n[0][1] + n[1][1] === 2 * y;
  });
  c.fillStyle = P.acc; c.font = 'bold ' + Math.round(s * 1.05) + 'px Georgia, serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('§', (m[0] + 0.5) * s, (m[1] + 0.55) * s);
}
function dTerazi(c, s, P, cells) {
  const lw = Math.max(1, s * 0.05), ctr = (q) => [(q[0] + 0.5) * s, (q[1] + 0.5) * s];
  const arms = cells.filter(([x, y]) => nb(cells, x, y).length === 1);
  const bar = cells.filter((q) => !arms.includes(q));
  const mid = bar.find(([x, y]) => !arms.some((a) => Math.abs(a[0] - x) + Math.abs(a[1] - y) === 1));
  const ends = bar.filter((q) => q !== mid);
  const horiz = ends[0][1] === ends[1][1];
  const endOf = (a) => ends.find((q) => Math.abs(q[0] - a[0]) + Math.abs(q[1] - a[1]) === 1);
  const d = [arms[0][0] - endOf(arms[0])[0], arms[0][1] - endOf(arms[0])[1]]; // kefe yönü
  const [mx, my] = ctr(mid);
  c.lineCap = 'butt';
  // kısa direk (kefelerin tarafına doğru)
  c.beginPath();
  c.moveTo(mx - d[1] * 0.16 * s, my - d[0] * 0.16 * s); c.lineTo(mx + d[1] * 0.16 * s, my + d[0] * 0.16 * s);
  c.lineTo(mx + d[0] * 0.48 * s + d[1] * 0.26 * s, my + d[1] * 0.48 * s + d[0] * 0.26 * s);
  c.lineTo(mx + d[0] * 0.48 * s - d[1] * 0.26 * s, my + d[1] * 0.48 * s - d[0] * 0.26 * s);
  c.closePath(); fillStroke(c, P.dark, P.dark, lw);
  // kefeler: askı kolu, zincirler, kase (hep aşağı sarkar)
  for (const a of arms) {
    const b = endOf(a), [bx, by] = ctr(b);
    const hx = (a[0] + 0.5) * s, hy = (a[1] + 0.1) * s;
    const ry = (a[1] + 0.52) * s;
    c.strokeStyle = P.dark; c.lineWidth = s * 0.1; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx, by); c.lineTo(hx, hy); c.stroke();
    c.lineCap = 'butt';
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - 0.42 * s, ry); c.lineTo(hx + 0.42 * s, ry); c.closePath();
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.fill();
    c.strokeStyle = P.dark; c.lineWidth = Math.max(1.2, s * 0.06); c.stroke();
    c.beginPath(); c.ellipse(hx, ry, 0.46 * s, 0.44 * s, 0, 0, Math.PI);
    c.closePath(); fillStroke(c, P.main, P.dark, lw);
    c.fillStyle = P.acc; c.fillRect(hx - 0.46 * s, ry - 0.04 * s, 0.92 * s, 0.1 * s);
  }
  // kiriş: bar hücrelerini kalın bir çubukla doldurur
  const xs = ends.map((q) => q[0]), ys = ends.map((q) => q[1]);
  const x0 = Math.min(...xs) * s, y0 = Math.min(...ys) * s;
  const bw = horiz ? 3 * s : s, bh = horiz ? s : 3 * s, t = 0.5 * s;
  const rx = horiz ? x0 + 0.03 * s : x0 + (s - t) / 2, ry2 = horiz ? y0 + (s - t) / 2 : y0 + 0.03 * s;
  const rw = horiz ? bw - 0.06 * s : t, rh = horiz ? t : bh - 0.06 * s;
  rr(c, rx, ry2, rw, rh, 0.1 * s); fillStroke(c, P.main, P.dark, lw);
  c.fillStyle = P.acc;
  if (horiz) { c.fillRect(rx + 0.45 * s, ry2, 0.08 * s, t); c.fillRect(rx + rw - 0.53 * s, ry2, 0.08 * s, t); }
  else { c.fillRect(rx, ry2 + 0.45 * s, t, 0.08 * s); c.fillRect(rx, ry2 + rh - 0.53 * s, t, 0.08 * s); }
  // orta mafsal
  c.beginPath(); c.arc(mx, my, 0.3 * s, 0, Math.PI * 2); fillStroke(c, P.acc, P.dark, lw);
  c.beginPath(); c.arc(mx, my, 0.1 * s, 0, Math.PI * 2); c.fillStyle = P.dark; c.fill();
}
function dKilic(c, s, P) {
  const lw = Math.max(1, s * 0.05);
  // kabza: altın topuz + koyu ahşap sap, altın sargılar (hücre 1,0)
  rr(c, 1.3 * s, 0.34 * s, 0.4 * s, 0.7 * s, 0.05 * s); fillStroke(c, P.grip, P.gripD, lw);
  c.fillStyle = P.acc;
  for (const y of [0.5, 0.66, 0.82]) c.fillRect(1.3 * s, y * s, 0.4 * s, 0.07 * s);
  c.beginPath(); c.arc(1.5 * s, 0.22 * s, 0.2 * s, 0, Math.PI * 2); fillStroke(c, P.acc, P.accD, lw);
  // bıçak: (1,2),(1,3) hücrelerinde, alta doğru sivrilir
  c.beginPath();
  c.moveTo(1.25 * s, 1.5 * s); c.lineTo(1.75 * s, 1.5 * s); c.lineTo(1.75 * s, 3.4 * s);
  c.lineTo(1.5 * s, 3.97 * s); c.lineTo(1.25 * s, 3.4 * s); c.closePath();
  fillStroke(c, P.main, P.dark, lw);
  c.save(); c.clip();
  c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(1.5 * s, 1.5 * s, 0.3 * s, 2.6 * s);
  c.restore();
  c.strokeStyle = P.dark; c.lineWidth = Math.max(1.2, s * 0.07);
  c.beginPath(); c.moveTo(1.5 * s, 1.95 * s); c.lineTo(1.5 * s, 3.55 * s); c.stroke();
  // kabza altı: kılıç kabzası (1. satırın tamamı)
  rr(c, 0.03 * s, 1.14 * s, 2.94 * s, 0.72 * s, 0.14 * s); fillStroke(c, P.acc, P.accD, lw);
  c.fillStyle = P.accD;
  rr(c, 0.03 * s, 1.14 * s, 0.3 * s, 0.72 * s, 0.1 * s); c.fill();
  rr(c, 2.67 * s, 1.14 * s, 0.3 * s, 0.72 * s, 0.1 * s); c.fill();
  c.beginPath(); c.arc(1.5 * s, 1.5 * s, 0.2 * s, 0, Math.PI * 2); fillStroke(c, P.gem, P.accD, lw);
}
const UPRIGHT = new Set(['terazi', 'paragraf', 'kanun']);
const DRAW = { tokmak: dTokmak, terazi: dTerazi, sutun: dSutun, kanun: dKanun, paragraf: dParagraf, kilic: dKilic };

function mk(w, h) {
  const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w)); cv.height = Math.max(1, Math.round(h));
  return cv;
}
function rotateCanvas(src) {
  const cv = mk(src.height, src.width), c = cv.getContext('2d');
  c.translate(src.height, 0); c.rotate(Math.PI / 2); c.drawImage(src, 0, 0);
  return cv;
}
const cache = new Map();
// type/rot/golden için s piksel hücre boyutunda tüm parça görüntüsü
export function getSprite(type, rot, golden, s) {
  const key = type + '|' + (rot & 3) + '|' + (golden ? 1 : 0) + '|' + s;
  let cv = cache.get(key);
  if (cv) return cv;
  if (UPRIGHT.has(type)) {
    const sz = sizeOf(type, rot);
    cv = mk(sz.w * s, sz.h * s);
    DRAW[type](cv.getContext('2d'), s, golden ? GOLDEN : PAL[type], cellsOf(type, rot));
  } else if ((rot & 3) === 0) {
    const sz = sizeOf(type, 0);
    cv = mk(sz.w * s, sz.h * s);
    DRAW[type](cv.getContext('2d'), s, golden ? GOLDEN : PAL[type]);
  } else {
    cv = rotateCanvas(getSprite(type, (rot & 3) - 1, golden, s));
  }
  cache.set(key, cv);
  return cv;
}
export function clearSpriteCache() { cache.clear(); }
export const COLORS = C;
