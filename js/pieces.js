import { THEME } from './theme.js';
// Lawris - parça tanımları ve sprite çizimi
export const TYPES = ['sutun', 'tokmak', 'kanun', 'terazi', 'paragraf', 'kilic', 'kalem'];
export const NAMES = {
  sutun: 'Sütun', tokmak: 'Tokmak', kanun: 'Kanun',
  terazi: 'Terazi', paragraf: 'Paragraf', kilic: 'Kılıç', kalem: 'Kalem',
};
// Üretim ağırlıkları (Kılıç yarı olasılıkla gelir)
export const WEIGHTS = { sutun: 1, tokmak: 1, kanun: 1, terazi: 1, paragraf: 1, kilic: 0.5, kalem: 1 };

const BASE = {
  sutun: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  tokmak: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
  kanun: [[0, 0], [1, 0], [0, 1], [1, 1]],
  terazi: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1]],
  paragraf: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]],
  // son iki hücre bıçaktır (dönmede sıra korunur)
  kilic: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]],
  kalem: [[0, 0], [0, 1], [0, 2]],
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
  tokmak: { main: '#9A6433', dark: '#4E2F18', acc: C.gold },
  terazi: { main: '#A9B0BA', dark: '#5C6470', acc: '#7A5E10', pivot: C.gold },
  sutun: { main: C.marble, dark: C.marbleD, acc: C.marbleD },
  kanun: { main: THEME.kanun ? THEME.kanun.main : C.bordo, dark: THEME.kanun ? THEME.kanun.dark : C.bordoD, acc: C.gold, accD: C.goldD },
  paragraf: { main: '#33805F', dark: '#1A4A35', acc: C.gold },
  kilic: { main: '#6C7A94', dark: '#323A4C', acc: '#F1F3F5', hilt: C.gold },
  // vermilyon lak: dört zemin rengine karşı kontrast >= 4.2:1
  kalem: { main: '#D9573A', dark: '#6B2010', acc: '#F6E3A1', ring: '#F2C94C' },
};
// Deneme: ?islem=pirinc ile normal parçaların işlemeleri antik pirinç olur (parlak altın yalnızca altın parçalarda)
const ISLEM = (() => { try { return new URLSearchParams(location.search).get('islem'); } catch (_) { return null; } })();
if (ISLEM === 'pirinc') {
  const B = '#C2A26A', BD = '#6E5A33';
  PAL.tokmak.acc = '#D2B47E'; PAL.kanun.acc = B; PAL.kanun.accD = BD; PAL.paragraf.acc = B;
  PAL.terazi.acc = BD; PAL.terazi.pivot = B; PAL.kilic.hilt = B; PAL.kalem.acc = '#DCC89E'; PAL.kalem.ring = B;
}
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
  // Levha: T biçimli ceviz plaka + üstüne altınla işlenmiş tokmak
  const cells = BASE.tokmak, A = P.acc, D = P.dark;
  unionPlate(c, s, cells, P);
  c.save(); c.globalAlpha = 0.35; c.strokeStyle = A; c.lineWidth = Math.max(1, s * 0.03);
  for (const [x, y] of cells) {
    const has = (dx, dy) => cells.some((q) => q[0] === x + dx && q[1] === y + dy), i = 0.16 * s;
    c.beginPath();
    if (!has(0, -1)) { c.moveTo(x * s + (has(-1, 0) ? 0 : i), y * s + i); c.lineTo((x + 1) * s - (has(1, 0) ? 0 : i), y * s + i); }
    if (!has(0, 1)) { c.moveTo(x * s + (has(-1, 0) ? 0 : i), (y + 1) * s - i); c.lineTo((x + 1) * s - (has(1, 0) ? 0 : i), (y + 1) * s - i); }
    if (!has(-1, 0)) { c.moveTo(x * s + i, y * s + (has(0, -1) ? 0 : i)); c.lineTo(x * s + i, (y + 1) * s - (has(0, 1) ? 0 : i)); }
    if (!has(1, 0)) { c.moveTo((x + 1) * s - i, y * s + (has(0, -1) ? 0 : i)); c.lineTo((x + 1) * s - i, (y + 1) * s - (has(0, 1) ? 0 : i)); }
    c.stroke();
  }
  c.restore();
  c.fillStyle = A;
  // başlık: ortalanmış, dolgun fıçı biçimi; uçlarda kalın kapaklar
  rr(c, 0.66 * s, 0.26 * s, 1.68 * s, 0.48 * s, 0.16 * s); c.fill();
  rr(c, 0.5 * s, 0.2 * s, 0.26 * s, 0.6 * s, 0.1 * s); c.fill();
  rr(c, 2.24 * s, 0.2 * s, 0.26 * s, 0.6 * s, 0.1 * s); c.fill();
  c.fillStyle = D; c.fillRect(0.86 * s, 0.26 * s, 0.05 * s, 0.48 * s); c.fillRect(2.09 * s, 0.26 * s, 0.05 * s, 0.48 * s);
  c.globalAlpha = 0.35; c.fillRect(0.9 * s, 0.34 * s, 1.2 * s, 0.07 * s); c.globalAlpha = 1;
  // sap: hafif incelen, bilezikli, topuzlu
  c.fillStyle = A; rr(c, 1.34 * s, 0.7 * s, 0.32 * s, 0.12 * s, 0.04 * s); c.fill();
  c.beginPath(); c.moveTo(1.39 * s, 0.8 * s); c.lineTo(1.61 * s, 0.8 * s); c.lineTo(1.58 * s, 2.42 * s); c.lineTo(1.42 * s, 2.42 * s); c.closePath(); c.fill();
  c.fillStyle = D; c.fillRect(1.4 * s, 2.08 * s, 0.2 * s, 0.05 * s);
  c.fillStyle = A; c.beginPath(); c.ellipse(1.5 * s, 2.55 * s, 0.17 * s, 0.15 * s, 0, 0, Math.PI * 2); c.fill();
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
  // Levha: 2x2 kanun cildi, kapakta "LAW"
  const cells = BASE.kanun, A = P.acc, D = P.dark;
  unionPlate(c, s, cells, P);
  c.fillStyle = D; c.globalAlpha = 0.55; c.fillRect(0.1 * s, 0.1 * s, 0.32 * s, 1.8 * s); c.globalAlpha = 1;
  c.fillStyle = A; c.fillRect(0.1 * s, 0.3 * s, 0.32 * s, 0.07 * s); c.fillRect(0.1 * s, 1.63 * s, 0.32 * s, 0.07 * s);
  c.save(); c.globalAlpha = 0.5; c.strokeStyle = A; c.lineWidth = Math.max(1, s * 0.03);
  rr(c, 0.52 * s, 0.16 * s, 1.32 * s, 1.68 * s, 0.06 * s); c.stroke(); c.restore();
  const cx = 1.18 * s;
  c.fillStyle = A; c.fillRect(cx - 0.42 * s, 0.62 * s, 0.84 * s, 0.05 * s); c.fillRect(cx - 0.42 * s, 1.33 * s, 0.84 * s, 0.05 * s);
  c.font = 'bold ' + Math.round(s * 0.5) + 'px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('LAW', cx, 1.02 * s);
}
function canlandir(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, sa = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; sa = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  const s2 = Math.min(1, sa * 1.15 + 0.03), l2 = Math.min(0.92, l * 1.04);
  const f = (n) => { const k = (n + h * 12) % 12, a = s2 * Math.min(l2, 1 - l2); return Math.round(255 * (l2 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
function unionPlate(c, s, cells, P) {
  const has = (x, y) => cells.some((q) => q[0] === x && q[1] === y);
  const lw = Math.max(1.5, s * 0.07), i = 0.04 * s;
  c.fillStyle = canlandir(P.main);
  for (const [x, y] of cells) {
    const x0 = x * s + (has(x - 1, y) ? 0 : i), x1 = (x + 1) * s - (has(x + 1, y) ? 0 : i);
    const y0 = y * s + (has(x, y - 1) ? 0 : i), y1 = (y + 1) * s - (has(x, y + 1) ? 0 : i);
    c.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  {   // üstten ışık, alttan gölge: cilalı levha hissi
    const e = lw * 1.6;
    for (const [x, y] of cells) {
      const L = x * s + i, R = (x + 1) * s - i, T = y * s + i, B = (y + 1) * s - i;
      if (!has(x, y - 1)) { c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(L, T, R - L, e); }
      if (!has(x - 1, y)) { c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(L, T, e, B - T); }
      if (!has(x, y + 1)) { c.fillStyle = 'rgba(0,0,0,0.26)'; c.fillRect(L, B - e, R - L, e); }
      if (!has(x + 1, y)) { c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(R - e, T, e, B - T); }
    }
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
  // Kabartma levha: hücreleri tam dolduran plaka + üstüne işlenmiş dik terazi
  unionPlate(c, s, cells, P);
  const ctr = (q) => [(q[0] + 0.5) * s, (q[1] + 0.5) * s];
  const arms = cells.filter(([x, y]) => nb(cells, x, y).length === 1);
  const bar = cells.filter((q) => !arms.includes(q));
  const mid = bar.find(([x, y]) => !arms.some((a) => Math.abs(a[0] - x) + Math.abs(a[1] - y) === 1));
  const ends = bar.filter((q) => q !== mid);
  const endOf = (a) => ends.find((q) => Math.abs(q[0] - a[0]) + Math.abs(q[1] - a[1]) === 1);
  const E = P.acc, G = P.pivot || P.acc;
  const [mx, my] = ctr(mid);
  c.lineCap = 'round'; c.lineJoin = 'round';
  // iç çerçeve (kabartma hissi)
  c.save(); c.globalAlpha = 0.35; c.strokeStyle = E; c.lineWidth = Math.max(1, s * 0.03);
  for (const [x, y] of cells) {
    const has = (dx, dy) => cells.some((q) => q[0] === x + dx && q[1] === y + dy), i = 0.16 * s;
    c.beginPath();
    if (!has(0, -1)) { c.moveTo(x * s + (has(-1, 0) ? 0 : i), y * s + i); c.lineTo((x + 1) * s - (has(1, 0) ? 0 : i), y * s + i); }
    if (!has(0, 1)) { c.moveTo(x * s + (has(-1, 0) ? 0 : i), (y + 1) * s - i); c.lineTo((x + 1) * s - (has(1, 0) ? 0 : i), (y + 1) * s - i); }
    if (!has(-1, 0)) { c.moveTo(x * s + i, y * s + (has(0, -1) ? 0 : i)); c.lineTo(x * s + i, (y + 1) * s - (has(0, 1) ? 0 : i)); }
    if (!has(1, 0)) { c.moveTo((x + 1) * s - i, y * s + (has(0, -1) ? 0 : i)); c.lineTo((x + 1) * s - i, (y + 1) * s - (has(0, 1) ? 0 : i)); }
    c.stroke();
  }
  c.restore();
  // kiriş
  const [e0x, e0y] = ctr(ends[0]), [e1x, e1y] = ctr(ends[1]);
  // kiriş: ortada kalın, uçlara doğru incelen zarif kol
  c.fillStyle = E;
  { const dx = e1x - e0x, dy = e1y - e0y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, w0 = s * 0.1, w1 = s * 0.04;
    c.beginPath();
    c.moveTo(e0x + nx * w1, e0y + ny * w1); c.lineTo(mx + nx * w0, my + ny * w0); c.lineTo(e1x + nx * w1, e1y + ny * w1);
    c.lineTo(e1x - nx * w1, e1y - ny * w1); c.lineTo(mx - nx * w0, my - ny * w0); c.lineTo(e0x - nx * w1, e0y - ny * w1); c.closePath(); c.fill(); }
  for (const [ex, ey] of [[e0x, e0y], [e1x, e1y]]) { c.beginPath(); c.arc(ex, ey, s * 0.08, 0, Math.PI * 2); c.fill(); }
  // kefeler (her zaman aşağı sarkar)
  for (const a of arms) {
    const [bx, by] = ctr(endOf(a));
    const hx = (a[0] + 0.5) * s, hy = (a[1] + 0.14) * s, ry = (a[1] + 0.56) * s, w = 0.34 * s;
    c.lineWidth = s * 0.06; c.strokeStyle = E;
    if (Math.abs(bx - hx) > 1 || Math.abs(by - hy) > 0.35 * s) { c.beginPath(); c.moveTo(bx, by); c.lineTo(hx, hy); c.stroke(); }
    c.lineWidth = Math.max(1, s * 0.035);
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - w, ry); c.moveTo(hx, hy); c.lineTo(hx + w, ry); c.stroke();
    c.beginPath(); c.moveTo(hx - w - 0.05 * s, ry); c.quadraticCurveTo(hx, ry + 0.5 * s, hx + w + 0.05 * s, ry); c.closePath();
    c.fillStyle = E; c.fill();
    c.beginPath(); c.arc(hx, hy, s * 0.05, 0, Math.PI * 2); c.fill();
  }
  // orta mafsal ve tepelik
  c.beginPath(); c.arc(mx, my, s * 0.2, 0, Math.PI * 2); c.fillStyle = G; c.fill();
  c.strokeStyle = P.dark; c.lineWidth = Math.max(1, s * 0.04); c.stroke();
  c.beginPath(); c.arc(mx, my, s * 0.07, 0, Math.PI * 2); c.fillStyle = P.dark; c.fill();
  c.lineCap = 'butt'; c.lineJoin = 'miter';
}
function dKilic(c, s, P) {
  // Levha: hücreleri tam dolduran plaka + üstüne işlenmiş kılıç (ucu aşağıda)
  const cells = BASE.kilic;
  unionPlate(c, s, cells, P);
  const E = P.acc, G = P.hilt || P.dark, D = P.dark;
  const cx = 1.5 * s;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // iç çerçeve
  c.save(); c.globalAlpha = 0.35; c.strokeStyle = E; c.lineWidth = Math.max(1, s * 0.03);
  for (const [x, y] of cells) {
    const has = (dx, dy) => cells.some((q) => q[0] === x + dx && q[1] === y + dy), i = 0.16 * s;
    c.beginPath();
    if (!has(0, -1)) { c.moveTo(x * s + (has(-1, 0) ? 0 : i), y * s + i); c.lineTo((x + 1) * s - (has(1, 0) ? 0 : i), y * s + i); }
    if (!has(0, 1)) { c.moveTo(x * s + (has(-1, 0) ? 0 : i), (y + 1) * s - i); c.lineTo((x + 1) * s - (has(1, 0) ? 0 : i), (y + 1) * s - i); }
    if (!has(-1, 0)) { c.moveTo(x * s + i, y * s + (has(0, -1) ? 0 : i)); c.lineTo(x * s + i, (y + 1) * s - (has(0, 1) ? 0 : i)); }
    if (!has(1, 0)) { c.moveTo((x + 1) * s - i, y * s + (has(0, -1) ? 0 : i)); c.lineTo((x + 1) * s - i, (y + 1) * s - (has(0, 1) ? 0 : i)); }
    c.stroke();
  }
  c.restore();
  // namlu: balçaktan uca kadar, ortasında oluk
  c.beginPath();
  c.moveTo(cx - 0.2 * s, 1.62 * s); c.lineTo(cx + 0.2 * s, 1.62 * s);
  c.lineTo(cx + 0.2 * s, 3.3 * s); c.lineTo(cx, 3.8 * s); c.lineTo(cx - 0.2 * s, 3.3 * s); c.closePath();
  c.fillStyle = E; c.fill();
  c.strokeStyle = D; c.lineWidth = Math.max(1, s * 0.04); c.stroke();
  c.beginPath(); c.moveTo(cx, 1.7 * s); c.lineTo(cx, 3.4 * s); c.stroke();
  // balçak: üç hücre boyunca
  rr(c, 0.62 * s, 1.37 * s, 1.76 * s, 0.26 * s, 0.13 * s); c.fillStyle = G; c.fill();
  for (const ex of [0.66, 2.34]) { c.beginPath(); c.arc(ex * s, 1.5 * s, 0.17 * s, 0, Math.PI * 2); c.fill(); }
  c.beginPath(); c.arc(cx, 1.5 * s, 0.12 * s, 0, Math.PI * 2); c.fillStyle = C.bordo; c.fill();
  // kabza ve topuz
  rr(c, cx - 0.12 * s, 0.42 * s, 0.24 * s, 0.94 * s, 0.06 * s); c.fillStyle = D; c.fill();
  c.strokeStyle = G; c.lineWidth = Math.max(1, s * 0.04);
  for (const yy of [0.62, 0.84, 1.06]) { c.beginPath(); c.moveTo(cx - 0.12 * s, yy * s); c.lineTo(cx + 0.12 * s, yy * s + 0.06 * s); c.stroke(); }
  c.beginPath(); c.arc(cx, 0.32 * s, 0.15 * s, 0, Math.PI * 2); c.fillStyle = G; c.fill();
  c.lineCap = 'butt'; c.lineJoin = 'miter';
}
function dKalem(c, s, P) {
  // Levha: 1x3 plaka + üstüne işlenmiş klasik dolma kalem (siyah lake gövde, altın aksam, ucu aşağıda)
  const cells = BASE.kalem, E = P.acc, R = P.ring || E;
  const K = P === GOLDEN ? '#5E4A0C' : '#17120F', KH = P === GOLDEN ? '#8C6F12' : '#3A302A';
  unionPlate(c, s, cells, P);
  const cx = 0.5 * s, lw = Math.max(1, s * 0.03), w = 0.22 * s;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.save(); c.globalAlpha = 0.35; c.strokeStyle = E; c.lineWidth = Math.max(1, s * 0.03);
  c.strokeRect(0.14 * s, 0.14 * s, 0.72 * s, 2.72 * s); c.restore();
  // kapak: kubbeli üst
  c.beginPath();
  c.moveTo(cx - w, 1.02 * s); c.lineTo(cx - w, 0.42 * s);
  c.bezierCurveTo(cx - w, 0.2 * s, cx + w, 0.2 * s, cx + w, 0.42 * s);
  c.lineTo(cx + w, 1.02 * s); c.closePath(); c.fillStyle = K; c.fill();
  c.fillStyle = KH; c.fillRect(cx - w * 0.55, 0.4 * s, w * 0.28, 0.56 * s); // parlaklık
  // kapak tepesi altın halka
  c.fillStyle = R; rr(c, cx - w * 0.7, 0.24 * s, w * 1.4, 0.06 * s, 0.03 * s); c.fill();
  // kapak bileziği: kalın + ince
  rr(c, cx - w - 0.02 * s, 0.9 * s, 2 * w + 0.04 * s, 0.1 * s, 0.03 * s); c.fill();
  c.fillRect(cx - w, 0.84 * s, 2 * w, 0.025 * s);
  // klips: kapaktan sarkan altın dil, ucu bilyeli
  c.beginPath(); c.moveTo(cx + w * 0.15, 0.3 * s); c.lineTo(cx + w * 0.55, 0.3 * s); c.lineTo(cx + w * 0.5, 0.86 * s); c.lineTo(cx + w * 0.2, 0.86 * s); c.closePath(); c.fill();
  c.beginPath(); c.arc(cx + w * 0.35, 0.9 * s, 0.045 * s, 0, Math.PI * 2); c.fill();
  // gövde: hafif incelen puro biçimi
  c.beginPath();
  c.moveTo(cx - w, 1.0 * s); c.lineTo(cx + w, 1.0 * s); c.lineTo(cx + w * 0.86, 1.98 * s); c.lineTo(cx - w * 0.86, 1.98 * s); c.closePath();
  c.fillStyle = K; c.fill(); c.fillStyle = KH; c.fillRect(cx - w * 0.55, 1.04 * s, w * 0.26, 0.9 * s);
  // gövde altı altın bilezik
  c.fillStyle = R; rr(c, cx - w * 0.95, 1.96 * s, w * 1.9, 0.07 * s, 0.03 * s); c.fill();
  // tutuş bölümü
  c.beginPath(); c.moveTo(cx - w * 0.8, 2.03 * s); c.lineTo(cx + w * 0.8, 2.03 * s); c.lineTo(cx + w * 0.6, 2.24 * s); c.lineTo(cx - w * 0.6, 2.24 * s); c.closePath();
  c.fillStyle = K; c.fill();
  // uç: geniş omuzlu altın uç, yarık ve kalp biçimli nefes deliği
  c.beginPath();
  c.moveTo(cx - w * 0.78, 2.22 * s); c.lineTo(cx + w * 0.78, 2.22 * s);
  c.bezierCurveTo(cx + w * 0.95, 2.45 * s, cx + w * 0.35, 2.66 * s, cx, 2.86 * s);
  c.bezierCurveTo(cx - w * 0.35, 2.66 * s, cx - w * 0.95, 2.45 * s, cx - w * 0.78, 2.22 * s); c.closePath();
  c.fillStyle = R; c.fill(); c.strokeStyle = K; c.lineWidth = lw; c.stroke();
  c.globalAlpha = 0.35; c.fillStyle = '#FFF6D6'; c.beginPath(); c.moveTo(cx - w * 0.55, 2.26 * s); c.lineTo(cx - w * 0.1, 2.26 * s); c.lineTo(cx - w * 0.08, 2.6 * s); c.closePath(); c.fill(); c.globalAlpha = 1;
  c.strokeStyle = K; c.lineWidth = Math.max(1, s * 0.028);
  c.beginPath(); c.moveTo(cx, 2.48 * s); c.lineTo(cx, 2.84 * s); c.stroke();
  c.beginPath(); c.arc(cx, 2.43 * s, 0.045 * s, 0, Math.PI * 2); c.fillStyle = K; c.fill();
  c.lineCap = 'butt'; c.lineJoin = 'miter';
}
const UPRIGHT = new Set(['terazi', 'paragraf', 'kanun']);
const DRAW = { tokmak: dTokmak, terazi: dTerazi, sutun: dSutun, kanun: dKanun, paragraf: dParagraf, kilic: dKilic, kalem: dKalem };

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
