// Lawris - parça tanımları ve sprite çizimi
export const TYPES = ['tokmak', 'terazi', 'sutun', 'cilt', 'paragraf', 'muhur'];
export const NAMES = {
  tokmak: 'Tokmak', terazi: 'Terazi', sutun: 'Sütun',
  cilt: 'Kanun cildi', paragraf: 'Paragraf', muhur: 'Mühür',
};

const BASE = {
  tokmak: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
  terazi: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1]],
  sutun: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  cilt: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]],
  paragraf: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
  muhur: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
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
  green: '#2F5D50', greenD: '#1B3A31', seal: '#A33B2B', sealD: '#6A2216',
  ink: '#F3EBD3', steel: '#888780', steelD: '#5F5E5A',
};
const PAL = {
  tokmak: { main: C.wood, dark: C.woodD, acc: C.gold },
  terazi: { main: C.steel, dark: C.steelD, acc: C.ink },
  sutun: { main: C.marble, dark: C.marbleD, acc: C.marbleD },
  cilt: { main: C.bordo, dark: C.bordoD, acc: C.gold },
  paragraf: { main: C.green, dark: C.greenD, acc: C.ink },
  muhur: { main: C.seal, dark: C.sealD, acc: C.ink },
};
const GOLDEN = { main: C.gold, dark: C.goldD, acc: C.ink };

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
  // sap (konik) + topuz
  c.beginPath();
  c.moveTo(1.5 * s - 0.22 * s, 0.7 * s); c.lineTo(1.5 * s + 0.22 * s, 0.7 * s);
  c.lineTo(1.5 * s + 0.13 * s, 2.72 * s); c.lineTo(1.5 * s - 0.13 * s, 2.72 * s);
  c.closePath(); fillStroke(c, P.main, P.dark, lw);
  c.beginPath(); c.arc(1.5 * s, 2.77 * s, 0.2 * s, 0, Math.PI * 2); fillStroke(c, P.main, P.dark, lw);
  // başlık
  rr(c, 0.04 * s, 0.16 * s, 2.92 * s, 0.7 * s, 0.12 * s); fillStroke(c, P.main, P.dark, lw);
  // koyu uç kapaklar
  c.fillStyle = P.dark;
  rr(c, 0.04 * s, 0.16 * s, 0.38 * s, 0.7 * s, 0.1 * s); c.fill();
  rr(c, 2.58 * s, 0.16 * s, 0.38 * s, 0.7 * s, 0.1 * s); c.fill();
  // halkalar
  c.fillStyle = P.acc;
  c.fillRect(0.5 * s, 0.16 * s, 0.1 * s, 0.7 * s);
  c.fillRect(2.4 * s, 0.16 * s, 0.1 * s, 0.7 * s);
}
function dSutun(c, s, P) {
  const lw = Math.max(1, s * 0.04);
  c.fillStyle = P.main; c.strokeStyle = P.dark; c.lineWidth = lw;
  // gövde
  c.fillRect(0.16 * s, 0.3 * s, 0.68 * s, 4.4 * s);
  c.strokeRect(0.16 * s, 0.3 * s, 0.68 * s, 4.4 * s);
  c.strokeStyle = P.dark;
  for (const fx of [0.34, 0.5, 0.66]) { c.beginPath(); c.moveTo(fx * s, 0.4 * s); c.lineTo(fx * s, 4.6 * s); c.stroke(); }
  // başlık
  c.fillRect(0.04 * s, 0.04 * s, 0.92 * s, 0.14 * s); c.strokeRect(0.04 * s, 0.04 * s, 0.92 * s, 0.14 * s);
  rr(c, 0.1 * s, 0.16 * s, 0.8 * s, 0.16 * s, 0.05 * s); fillStroke(c, P.main, P.dark, lw);
  // kaide
  c.fillRect(0.08 * s, 4.68 * s, 0.84 * s, 0.14 * s); c.strokeRect(0.08 * s, 4.68 * s, 0.84 * s, 0.14 * s);
  c.fillRect(0.04 * s, 4.82 * s, 0.92 * s, 0.14 * s); c.strokeRect(0.04 * s, 4.82 * s, 0.92 * s, 0.14 * s);
}
function dCilt(c, s, P) {
  const lw = Math.max(1, s * 0.05);
  rr(c, 0.05 * s, 0.05 * s, 1.9 * s, 2.9 * s, 0.1 * s); fillStroke(c, P.main, P.dark, lw);
  // sırt
  c.fillStyle = P.dark; rr(c, 0.05 * s, 0.05 * s, 0.4 * s, 2.9 * s, 0.1 * s); c.fill();
  // altın bantlar
  c.fillStyle = P.acc;
  for (const by of [0.3, 2.58]) { c.fillRect(0.05 * s, by * s, 1.9 * s, 0.13 * s); }
  c.fillRect(0.05 * s, 1.4 * s, 0.4 * s, 0.13 * s);
  // başlık plakası
  c.fillStyle = P.acc; c.fillRect(0.75 * s, 0.95 * s, 0.95 * s, 1.1 * s);
  c.strokeStyle = P.dark; c.lineWidth = lw; c.strokeRect(0.82 * s, 1.02 * s, 0.81 * s, 0.96 * s);
  c.beginPath(); c.moveTo(0.95 * s, 1.3 * s); c.lineTo(1.5 * s, 1.3 * s);
  c.moveTo(0.95 * s, 1.5 * s); c.lineTo(1.5 * s, 1.5 * s); c.moveTo(0.95 * s, 1.7 * s); c.lineTo(1.35 * s, 1.7 * s); c.stroke();
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
  const m = cells.find(([x, y]) => nb(cells, x, y).length === 3);
  c.fillStyle = P.acc; c.font = 'bold ' + Math.round(s * 0.95) + 'px Georgia, serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('§', (m[0] + 0.5) * s, (m[1] + 0.55) * s);
}
function dTerazi(c, s, P, cells) {
  const lw = Math.max(1, s * 0.05), ctr = (q) => [(q[0] + 0.5) * s, (q[1] + 0.5) * s];
  const arms = cells.filter(([x, y]) => nb(cells, x, y).length === 1);
  const bar = cells.filter((q) => !arms.includes(q));
  const mid = bar.find(([x, y]) => !arms.some((a) => Math.abs(a[0] - x) + Math.abs(a[1] - y) === 1));
  const ends = bar.filter((q) => q !== mid);
  c.lineCap = 'round';
  // kiriş (çubuk) bar boyunca
  c.strokeStyle = P.dark; c.lineWidth = s * 0.26;
  c.beginPath(); c.moveTo(...ctr(ends[0])); c.lineTo(...ctr(ends[1])); c.stroke();
  c.strokeStyle = P.main; c.lineWidth = s * 0.16;
  c.beginPath(); c.moveTo(...ctr(ends[0])); c.lineTo(...ctr(ends[1])); c.stroke();
  for (const a of arms) {
    const b = ends.find((q) => Math.abs(q[0] - a[0]) + Math.abs(q[1] - a[1]) === 1);
    const hx = (a[0] + 0.5) * s, hy = (a[1] + 0.1) * s;
    // askı kolu: kiriş ucundan kefenin asılma noktasına
    c.strokeStyle = P.dark; c.lineWidth = s * 0.08;
    c.beginPath(); c.moveTo(...ctr(b)); c.lineTo(hx, hy); c.stroke();
    // zincirler ve kefe (hep aşağı sarkar)
    const py = (a[1] + 0.52) * s;
    c.lineWidth = Math.max(1, s * 0.05);
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - 0.36 * s, py); c.moveTo(hx, hy); c.lineTo(hx + 0.36 * s, py); c.stroke();
    c.beginPath(); c.arc(hx, py, 0.38 * s, 0, Math.PI); c.closePath(); fillStroke(c, P.main, P.dark, lw);
  }
  c.lineCap = 'butt';
  // orta mafsal
  const [mx, my] = ctr(mid);
  c.beginPath(); c.arc(mx, my, 0.2 * s, 0, Math.PI * 2); fillStroke(c, P.acc, P.dark, lw);
  c.beginPath(); c.arc(mx, my, 0.07 * s, 0, Math.PI * 2); c.fillStyle = P.dark; c.fill();
}
function dMuhur(c, s, P) {
  unionPlate(c, s, BASE.muhur, P);
  const lw = Math.max(1, s * 0.05);
  c.beginPath(); c.arc(1.5 * s, 1.5 * s, 0.42 * s, 0, Math.PI * 2); fillStroke(c, P.dark, P.acc, lw);
  c.beginPath(); c.arc(1.5 * s, 1.5 * s, 0.26 * s, 0, Math.PI * 2); c.strokeStyle = P.main; c.lineWidth = lw; c.stroke();
  c.fillStyle = P.main; c.fillRect(1.5 * s - lw / 2, 1.5 * s - 0.14 * s, lw, 0.28 * s);
  c.fillRect(1.5 * s - 0.14 * s, 1.5 * s - lw / 2, 0.28 * s, lw);
}
const UPRIGHT = new Set(['terazi', 'paragraf']);
const DRAW = { tokmak: dTokmak, terazi: dTerazi, sutun: dSutun, cilt: dCilt, paragraf: dParagraf, muhur: dMuhur };

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
