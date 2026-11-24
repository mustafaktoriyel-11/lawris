import { THEME } from './theme.js';
// Lex Stack - parça tanımları ve sprite çizimi
export const TYPES = ['sutun', 'tokmak', 'kanun', 'terazi', 'paragraf', 'kilic', 'kalem'];
// Üretim ağırlıkları (Kılıç yarı olasılıkla gelir)
export const WEIGHTS = { sutun: 1, tokmak: 1, kanun: 1, terazi: 1, paragraf: 1, kilic: 0.5, kalem: 1 };

const BASE = {
  sutun: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  tokmak: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
  kanun: [[0, 0], [1, 0], [0, 1], [1, 1]],
  terazi: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1]],
  paragraf: [[1, 0], [2, 0], [0, 1], [1, 1]],   // 4'lü S (§ biçimine uygun)
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
  tokmak: { main: '#4E3A35', dark: '#1A1211', acc: '#E0B23A' },
  terazi: { main: '#A9B0BA', dark: '#5C6470', acc: '#7A5E10', pivot: C.gold },
  sutun: { main: C.marble, dark: C.marbleD, acc: C.marbleD },
  // Roma yasa levhasi: sicak travertin / kumtasi, bronz perçinler
  kanun: { main: '#CDBB94', dark: '#8E7A55', acc: '#B8862B', accD: '#6E4E12' },
  paragraf: { main: '#3A9168', dark: '#1A4A35', acc: C.gold },
  kilic: { main: '#5877AB', dark: '#2A3550', acc: '#F1F3F5', hilt: C.gold },
  // porfir moru: mavi, turkuaz, kiremit ve lacivert zeminlere karsi kontrast
  kalem: { main: '#8D49A4', dark: '#3E1B4E', acc: '#F4ECD6', ring: '#D9A93A' },
};
// Deneme: ?islem=pirinc ile normal parçaların işlemeleri antik pirinç olur (parlak altın yalnızca altın parçalarda)
const ISLEM = (() => { try { return new URLSearchParams(location.search).get('islem'); } catch (_) { return null; } })();
if (ISLEM === 'pirinc') {
  const B = '#C2A26A', BD = '#6E5A33';
  PAL.tokmak.acc = '#D2B47E'; PAL.kanun.acc = B; PAL.kanun.accD = BD; PAL.paragraf.acc = B;
  PAL.terazi.acc = BD; PAL.terazi.pivot = B; PAL.kilic.hilt = B; PAL.kalem.ring = B;
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
  // Tokmak: parlak metal altın (gradyan + ince kontur + parlama), plakaya hafif gölge düşürür
  const tone = (hex, t) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t));
    return `rgb(${f(r)},${f(g)},${f(b)})`; };
  const sekil = (p) => {
    p.beginPath();
    rrp(p, 0.66 * s, 0.26 * s, 1.68 * s, 0.48 * s, 0.16 * s);
    rrp(p, 0.5 * s, 0.2 * s, 0.26 * s, 0.6 * s, 0.1 * s);
    rrp(p, 2.24 * s, 0.2 * s, 0.26 * s, 0.6 * s, 0.1 * s);
    rrp(p, 1.34 * s, 0.7 * s, 0.32 * s, 0.12 * s, 0.04 * s);
    p.moveTo(1.39 * s, 0.8 * s); p.lineTo(1.61 * s, 0.8 * s); p.lineTo(1.58 * s, 2.42 * s); p.lineTo(1.42 * s, 2.42 * s); p.closePath();
    p.moveTo(1.67 * s, 2.55 * s); p.ellipse(1.5 * s, 2.55 * s, 0.17 * s, 0.15 * s, 0, 0, Math.PI * 2);
  };
  // gölge
  c.save(); c.translate(0.04 * s, 0.06 * s); sekil(c); c.fillStyle = 'rgba(0,0,0,.38)'; c.fill(); c.restore();
  // gövde: dikey metal gradyan
  const g = c.createLinearGradient(0, 0.2 * s, 0, 0.8 * s);
  g.addColorStop(0, tone(A, 0.55)); g.addColorStop(0.45, tone(A, 0.12)); g.addColorStop(1, tone(A, -0.35));
  sekil(c); c.fillStyle = g; c.fill();
  const gh = c.createLinearGradient(1.36 * s, 0, 1.64 * s, 0);
  gh.addColorStop(0, tone(A, -0.3)); gh.addColorStop(0.4, tone(A, 0.5)); gh.addColorStop(1, tone(A, -0.35));
  c.save(); c.beginPath(); c.rect(1.3 * s, 0.82 * s, 0.4 * s, 1.9 * s); c.clip(); sekil(c); c.fillStyle = gh; c.fill(); c.restore();
  c.lineWidth = Math.max(1, s * 0.035); c.strokeStyle = tone(A, -0.62); sekil(c); c.stroke();
  // bilezikler ve parlama
  c.fillStyle = tone(A, -0.55); c.fillRect(0.86 * s, 0.27 * s, 0.05 * s, 0.46 * s); c.fillRect(2.09 * s, 0.27 * s, 0.05 * s, 0.46 * s); c.fillRect(1.41 * s, 2.08 * s, 0.18 * s, 0.05 * s);
  c.fillStyle = 'rgba(255,255,240,.75)'; rr(c, 0.95 * s, 0.32 * s, 1.1 * s, 0.06 * s, 0.03 * s); c.fill();
  c.fillStyle = 'rgba(255,255,240,.55)'; c.beginPath(); c.ellipse(1.45 * s, 2.5 * s, 0.06 * s, 0.04 * s, 0, 0, Math.PI * 2); c.fill();
}
// rr'nin yol ekleyen hâli (beginPath yapmaz; birden çok şekil tek yolda birleşir)
function rrp(c, x, y, w, h, r) {
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
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
// Kanun: 2x2 Roma yasa levhasi (On Iki Levha), her zaman dik cizilir
function dKanun(c, s, P) {
  const cells = BASE.kanun, gold = P === GOLDEN;
  const A = gold ? '#FFF1B8' : P.acc, AD = gold ? P.dark : P.accD, D = P.dark;
  unionPlate(c, s, cells, P);
  const lw = Math.max(1, s * 0.035);
  // kemerli ic levha
  const x0 = 0.2 * s, x1 = 1.8 * s, y0 = 0.2 * s, y1 = 1.8 * s, r = 0.5 * s;
  c.beginPath();
  c.moveTo(x0, y1); c.lineTo(x0, y0 + r); c.quadraticCurveTo(x0, y0, x0 + r, y0);
  c.lineTo(x1 - r, y0); c.quadraticCurveTo(x1, y0, x1, y0 + r); c.lineTo(x1, y1); c.closePath();
  c.fillStyle = 'rgba(255,248,225,0.30)'; c.fill();
  c.strokeStyle = D; c.lineWidth = lw; c.stroke();
  c.save(); c.clip(); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x0, y0, 1.6 * s, 0.05 * s); c.restore();
  // oyma LEX: acik alt kenar + koyu ic
  const cx = s, fs = Math.round(s * 0.52);
  c.font = 'bold ' + fs + 'px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(255,250,232,0.85)'; c.fillText('LEX', cx, 0.86 * s + Math.max(1, s * 0.035));
  c.fillStyle = D; c.fillText('LEX', cx, 0.86 * s);
  // Latince düstur: DVRA LEX / SED LEX ("Kanun serttir ama kanundur"). Çok küçük boyutta (önizleme) oyma satırlar kalır.
  if (s >= 40) {
    const sat = ['DVRA LEX', 'SED LEX'], ys = [1.27, 1.55];
    let f2 = s * 0.22; c.font = 'bold ' + f2 + 'px Georgia, "Times New Roman", serif';
    const w = Math.max(...sat.map((t) => c.measureText(t).width)); if (w > s * 1.12) { f2 *= s * 1.12 / w; c.font = 'bold ' + f2 + 'px Georgia, "Times New Roman", serif'; }
    sat.forEach((t, i) => {
      c.fillStyle = 'rgba(255,250,232,0.8)'; c.fillText(t, cx, ys[i] * s + Math.max(1, s * 0.022));
      c.fillStyle = D; c.fillText(t, cx, ys[i] * s);
    });
  } else {
    c.lineCap = 'round';
    for (const [yy, a, b] of [[1.2, 0.46, 1.54], [1.4, 0.46, 1.4], [1.6, 0.46, 1.5]]) {
      c.strokeStyle = 'rgba(255,250,232,0.7)'; c.lineWidth = Math.max(1, s * 0.05);
      c.beginPath(); c.moveTo(a * s, yy * s + s * 0.03); c.lineTo(b * s, yy * s + s * 0.03); c.stroke();
      c.strokeStyle = D; c.lineWidth = Math.max(1, s * 0.045);
      c.beginPath(); c.moveTo(a * s, yy * s); c.lineTo(b * s, yy * s); c.stroke();
    }
  }
  c.lineCap = 'butt';
  // bronz perçinler
  for (const [px, py] of [[0.2, 0.2], [1.8, 0.2], [0.2, 1.8], [1.8, 1.8]]) {
    c.beginPath(); c.arc(px * s, py * s, s * 0.085, 0, Math.PI * 2); c.fillStyle = A; c.fill();
    c.strokeStyle = AD; c.lineWidth = Math.max(1, s * 0.03); c.stroke();
    c.beginPath(); c.arc(px * s - s * 0.025, py * s - s * 0.025, s * 0.025, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fill();
  }
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
  // § işareti şeklin ağırlık merkezindeki iki hücreye (dikey ya da yatay ikili) sığdırılır; asla taşmaz
  const cx = cells.reduce((t, q) => t + q[0] + 0.5, 0) / cells.length, cy = cells.reduce((t, q) => t + q[1] + 0.5, 0) / cells.length;
  // § uzun bir işaret: ağırlık merkezine en yakın DİKEY ikiliye yerleşir (yoksa merkezdeki ikiliye)
  const dikey = cells.filter(([x, y]) => cells.some((q) => q[0] === x && q[1] === y + 1)).map(([x, y]) => [[x, y], [x, y + 1]]);
  dikey.sort((a, b) => Math.hypot(a[0][0] + 0.5 - cx, a[0][1] + 1 - cy) - Math.hypot(b[0][0] + 0.5 - cx, b[0][1] + 1 - cy));
  const kut = dikey.length ? dikey[0] : cells.filter(([x, y]) => cx >= x - 1e-6 && cx <= x + 1 + 1e-6 && cy >= y - 1e-6 && cy <= y + 1 + 1e-6);
  const x0 = Math.min(...kut.map((q) => q[0])), y0 = Math.min(...kut.map((q) => q[1]));
  const bw = (Math.max(...kut.map((q) => q[0])) + 1 - x0) * s, bh = (Math.max(...kut.map((q) => q[1])) + 1 - y0) * s;
  const pay = 0.2 * s;   // plaka kenarı + nefes payı
  let fs = s * 1.6;
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = 'bold ' + fs + 'px Georgia, serif';
  let m = c.measureText('§'), gw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, gh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const k = Math.min(1, (bw - 2 * pay) / gw, (bh - 2 * pay) / gh);
  fs *= k; c.font = 'bold ' + fs + 'px Georgia, serif';
  m = c.measureText('§'); gw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight; gh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const tx = x0 * s + bw / 2 - gw / 2 + m.actualBoundingBoxLeft, ty = y0 * s + bh / 2 - gh / 2 + m.actualBoundingBoxAscent;
  c.fillStyle = P.acc; c.fillText('§', tx, ty);
}
function dTerazi(c, s, P, cells) {
  // Iustitia terazisi: sade gumus levha, ince kiris, altin mafsal ve kefe kenarlari
  unionPlate(c, s, cells, P);
  const gold = P === GOLDEN;
  const ctr = (q) => [(q[0] + 0.5) * s, (q[1] + 0.5) * s];
  const arms = cells.filter(([x, y]) => nb(cells, x, y).length === 1);
  const bar = cells.filter((q) => !arms.includes(q));
  const mid = bar.find(([x, y]) => !arms.some((a) => Math.abs(a[0] - x) + Math.abs(a[1] - y) === 1));
  const ends = bar.filter((q) => q !== mid);
  const endOf = (a) => ends.find((q) => Math.abs(q[0] - a[0]) + Math.abs(q[1] - a[1]) === 1);
  const E = gold ? '#FFF1B8' : '#39414F';          // kiris, zincir, kefe govdesi
  const G = gold ? '#7A5E10' : '#D9A93A';          // altin: mafsal ve kefe kenari
  const GD = gold ? '#4A3A08' : '#7A5810';
  const [mx, my] = ctr(mid);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const [e0x, e0y] = ctr(ends[0]), [e1x, e1y] = ctr(ends[1]);
  // kiris: ortada kalin, uclara incelen
  c.fillStyle = E;
  { const dx = e1x - e0x, dy = e1y - e0y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, w0 = s * 0.085, w1 = s * 0.035;
    c.beginPath();
    c.moveTo(e0x + nx * w1, e0y + ny * w1); c.lineTo(mx + nx * w0, my + ny * w0); c.lineTo(e1x + nx * w1, e1y + ny * w1);
    c.lineTo(e1x - nx * w1, e1y - ny * w1); c.lineTo(mx - nx * w0, my - ny * w0); c.lineTo(e0x - nx * w1, e0y - ny * w1); c.closePath(); c.fill(); }
  for (const [ex, ey] of [[e0x, e0y], [e1x, e1y]]) { c.beginPath(); c.arc(ex, ey, s * 0.07, 0, Math.PI * 2); c.fill(); }
  // zincirler ve kefeler (her zaman asagi sarkar)
  for (const a of arms) {
    const [bx, by] = ctr(endOf(a));
    const hx = (a[0] + 0.5) * s, hy = (a[1] + 0.1) * s, ry = (a[1] + 0.6) * s, w = 0.36 * s;
    c.strokeStyle = E; c.lineWidth = Math.max(1, s * 0.05);
    if (Math.abs(bx - hx) > 1 || Math.abs(by - hy) > 0.2 * s) { c.beginPath(); c.moveTo(bx, by); c.lineTo(hx, hy); c.stroke(); }
    c.lineWidth = Math.max(1, s * 0.03);
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - w, ry); c.moveTo(hx, hy); c.lineTo(hx + w, ry); c.stroke();
    // sig kase
    c.beginPath(); c.moveTo(hx - w - 0.04 * s, ry); c.quadraticCurveTo(hx, ry + 0.5 * s, hx + w + 0.04 * s, ry); c.closePath();
    c.fillStyle = E; c.fill();
    c.strokeStyle = G; c.lineWidth = Math.max(1.2, s * 0.06);
    c.beginPath(); c.moveTo(hx - w - 0.04 * s, ry); c.lineTo(hx + w + 0.04 * s, ry); c.stroke();
  }
  // mafsal: altin yuvarlak, ustunde kucuk topuz
  c.beginPath(); c.moveTo(mx - s * 0.07, my - s * 0.16); c.lineTo(mx, my - s * 0.34); c.lineTo(mx + s * 0.07, my - s * 0.16); c.closePath();
  c.fillStyle = G; c.fill();
  c.beginPath(); c.arc(mx, my, s * 0.17, 0, Math.PI * 2); c.fillStyle = G; c.fill();
  c.strokeStyle = GD; c.lineWidth = Math.max(1, s * 0.04); c.stroke();
  c.beginPath(); c.arc(mx, my, s * 0.06, 0, Math.PI * 2); c.fillStyle = GD; c.fill();
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
  // Levha: 1x3 porfir plaka + ustune islenmis tuy kalem (krem tuy, koyu kalem govdesi, altin uc; ucu asagida)
  const cells = BASE.kalem, gold = P === GOLDEN;
  const V = gold ? '#FFF1B8' : P.acc, VD = gold ? '#8C6F12' : '#B9A98A', K = gold ? '#5E4A0C' : '#2A1630', R = P.ring || P.acc;
  unionPlate(c, s, cells, P);
  const cx = 0.5 * s, lw = Math.max(1, s * 0.03);
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.save(); c.globalAlpha = 0.3; c.strokeStyle = V; c.lineWidth = lw;
  c.strokeRect(0.14 * s, 0.14 * s, 0.72 * s, 2.72 * s); c.restore();
  // tuy: sivri uclu yaprak biçimli, hafif egri
  const top = 0.2 * s, bot = 2.12 * s, hw = 0.3 * s;
  c.beginPath();
  c.moveTo(cx + 0.05 * s, top);
  c.bezierCurveTo(cx + hw * 1.5, top + 0.35 * s, cx + hw * 1.1, bot - 0.5 * s, cx, bot);
  c.bezierCurveTo(cx - hw * 1.0, bot - 0.5 * s, cx - hw * 1.4, top + 0.45 * s, cx + 0.05 * s, top);
  c.closePath(); c.fillStyle = V; c.fill(); c.strokeStyle = VD; c.lineWidth = lw; c.stroke();
  // yelpaze bicimli tuy kilcallari
  c.save(); c.clip();
  c.strokeStyle = VD; c.lineWidth = Math.max(1, s * 0.022); c.globalAlpha = 0.9;
  for (let t = 0.12; t < 0.98; t += 0.1) {
    const yy = top + t * (bot - top), len = hw * 1.7 * Math.sin(Math.PI * Math.min(1, t * 1.05)) + 0.1 * s;
    c.beginPath(); c.moveTo(cx, yy + 0.08 * s); c.lineTo(cx - len, yy - 0.16 * s);
    c.moveTo(cx, yy + 0.08 * s); c.lineTo(cx + len, yy - 0.16 * s); c.stroke();
  }
  c.restore();
  // govde ustundeki yarik (tuyun iki yarisi arasinda kopuk)
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(cx - 0.12 * s, 0.75 * s, 0.035 * s, 0.35 * s, 0.1, 0, Math.PI * 2); c.fill();
  // govde (rakis): tuyun icinden uca dogru
  c.strokeStyle = K; c.lineWidth = Math.max(1.4, s * 0.06);
  c.beginPath(); c.moveTo(cx + 0.05 * s, top - 0.02 * s); c.quadraticCurveTo(cx + 0.02 * s, 1.2 * s, cx, 2.34 * s); c.stroke();
  // koyu kalem govdesi
  c.lineWidth = Math.max(2, s * 0.11);
  c.beginPath(); c.moveTo(cx, bot - 0.06 * s); c.lineTo(cx, 2.34 * s); c.stroke();
  // altin uc
  c.beginPath();
  c.moveTo(cx - 0.11 * s, 2.3 * s); c.lineTo(cx + 0.11 * s, 2.3 * s);
  c.bezierCurveTo(cx + 0.15 * s, 2.5 * s, cx + 0.06 * s, 2.7 * s, cx, 2.88 * s);
  c.bezierCurveTo(cx - 0.06 * s, 2.7 * s, cx - 0.15 * s, 2.5 * s, cx - 0.11 * s, 2.3 * s); c.closePath();
  c.fillStyle = R; c.fill(); c.strokeStyle = K; c.lineWidth = lw; c.stroke();
  c.beginPath(); c.moveTo(cx, 2.5 * s); c.lineTo(cx, 2.84 * s); c.stroke();
  c.beginPath(); c.arc(cx, 2.46 * s, 0.03 * s, 0, Math.PI * 2); c.fillStyle = K; c.fill();
  c.lineCap = 'butt'; c.lineJoin = 'miter';
}
const UPRIGHT = new Set(['paragraf', 'kanun']);
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
// Kenar bandı: sprite alfa'sının iç kenarında t px kalınlıkta koyu (ve isteğe bağlı açık) çizgi; her zeminde silüet seçilir
function rimBand(src, t, col) {
  const w = src.width, h = src.height, pad = Math.ceil(t) + 1, W = w + 2 * pad, H = h + 2 * pad;
  const inv = mk(W, H), ic = inv.getContext('2d');     // ters alfa (sprite dışı = dolu)
  ic.fillStyle = '#000'; ic.fillRect(0, 0, W, H); ic.globalCompositeOperation = 'destination-out'; ic.drawImage(src, pad, pad);
  const band = mk(w, h), bc = band.getContext('2d');   // ters alfayı t kadar genişlet, sprite ile kes -> iç kenar bandı
  const N = 12; for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; bc.drawImage(inv, Math.cos(a) * t - pad, Math.sin(a) * t - pad); }
  bc.globalCompositeOperation = 'destination-in'; bc.drawImage(src, 0, 0);
  bc.globalCompositeOperation = 'source-in'; bc.fillStyle = col; bc.fillRect(0, 0, w, h);
  return band;
}
function finish(cv, s, light) {
  const c = cv.getContext('2d'), t = Math.max(1, s * 0.05);
  if (light) { c.drawImage(rimBand(cv, t * 2, 'rgba(255,240,200,0.55)'), 0, 0); }
  c.drawImage(rimBand(cv, t, 'rgba(6,8,22,0.8)'), 0, 0);
  return cv;
}
const LIGHTRIM = new Set(['tokmak', 'kalem', 'paragraf', 'kilic']);   // koyu/orta tonlu parçalara ince açık iç kenar
const cache = new Map();
// type/rot/golden için s piksel hücre boyutunda tüm parça görüntüsü
export function getSprite(type, rot, golden, s) {
  const key = type + '|' + (rot & 3) + '|' + (golden ? 1 : 0) + '|' + s;
  let cv = cache.get(key);
  if (cv) return cv;
  if (UPRIGHT.has(type)) {
    const sz = sizeOf(type, rot);
    cv = mk(sz.w * s, sz.h * s);
    DRAW[type](cv.getContext('2d'), s, golden ? GOLDEN : PAL[type], cellsOf(type, rot)); finish(cv, s, golden || LIGHTRIM.has(type));
  } else if ((rot & 3) === 0) {
    const sz = sizeOf(type, 0);
    cv = mk(sz.w * s, sz.h * s);
    DRAW[type](cv.getContext('2d'), s, golden ? GOLDEN : PAL[type], cellsOf(type, 0)); finish(cv, s, golden || LIGHTRIM.has(type));
  } else {
    cv = rotateCanvas(getSprite(type, (rot & 3) - 1, golden, s));
  }
  cache.set(key, cv);
  return cv;
}
export function clearSpriteCache() { cache.clear(); mcache.clear(); }

// ---------- Mermer kabartma (kilitli parçalar) ----------
export const MERMER = typeof location === 'undefined' || !/[?&]mermer=0/.test(location.search);
const MRAMP = [[0x8E, 0x85, 0x74], [0xCF, 0xC6, 0xB3], [0xEE, 0xE8, 0xDA]];
function mramp(t, o, i) {
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const k = t < 0.5 ? 0 : 1, f = t < 0.5 ? t * 2 : (t - 0.5) * 2, A = MRAMP[k], B = MRAMP[k + 1];
  return A[i] + (B[i] - A[i]) * f;
}
function seeded(n) { let a = (n | 0) + 0x9E3779B9; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; return h; }
function veins(cv, seed, s) {
  const c = cv.getContext('2d'), R = seeded(seed), w = cv.width, h = cv.height;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const n = 2 + Math.round((w * h) / (s * s * 5));
  for (let i = 0; i < n; i++) {
    let x = R() * w, y = R() * h, a = R() * Math.PI * 2;
    const len = s * (0.8 + R() * 1.6), step = s * 0.18;
    c.beginPath(); c.moveTo(x, y);
    for (let d = 0; d < len; d += step) { a += (R() - 0.5) * 1.1; x += Math.cos(a) * step; y += Math.sin(a) * step; c.lineTo(x, y); }
    c.strokeStyle = 'rgba(120,112,98,' + (0.10 + R() * 0.10).toFixed(3) + ')'; c.lineWidth = Math.max(0.6, s * (0.015 + R() * 0.02)); c.stroke();
    if (R() < 0.5) { c.strokeStyle = 'rgba(255,255,250,0.22)'; c.lineWidth = Math.max(0.6, s * 0.02); c.translate(s * 0.02, s * 0.02); c.stroke(); c.setTransform(1, 0, 0, 1, 0, 0); }
  }
}
// Renkli sprite'tan bir kez türetilen mermer kabartma: sembol oyulmuş, dış kenar net gri çizgi + iç pah
function buildMarble(src, seed, s) {
  const w = src.width, h = src.height, out = mk(w, h), x = out.getContext('2d');
  x.drawImage(src, 0, 0);
  const img = x.getImageData(0, 0, w, h), a = img.data, N = w * h;
  const t = Math.max(1, s * 0.055), R = Math.ceil(t * 2) + 2;
  const op = (px, py) => px >= 0 && py >= 0 && px < w && py < h && a[(py * w + px) * 4 + 3] > 127;
  const dist = new Float32Array(N), lum = new Float32Array(N);
  const hist = new Uint32Array(256); let cnt = 0;
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const i = py * w + px; if (a[i * 4 + 3] < 8) continue;
    let d = R + 1;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      if (!op(px + dx, py + dy)) { const q = Math.sqrt(dx * dx + dy * dy); if (q < d) d = q; }
    }
    dist[i] = d;
    const L = 0.3 * a[i * 4] + 0.59 * a[i * 4 + 1] + 0.11 * a[i * 4 + 2]; lum[i] = L;
    if (d > t * 2 + 1) { hist[L | 0]++; cnt++; }
  }
  let base = 128, acc = 0; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= cnt / 2) { base = v; break; } }
  // oyma derinliği (0..1): taban tondan sapma (koyu ya da açık), hafif yumuşatılır
  const raw = new Float32Array(N), carve = new Float32Array(N);
  for (let i = 0; i < N; i++) { if (a[i * 4 + 3] < 8) continue; raw[i] = dist[i] <= t * 1.6 ? 0 : Math.min(1, Math.abs(lum[i] - base) / 90); }
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    let sum = 0, wt = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = px + dx, Y = py + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
      const k = (dx || dy) ? 1 : 2; sum += raw[Y * w + X] * k; wt += k;
    }
    carve[py * w + px] = sum / wt;
  }
  const rnd = seeded(seed), ph1 = rnd() * 6, ph2 = rnd() * 6, f1 = 0.9 / s, f2 = 2.3 / s;
  const cg = (px, py) => carve[Math.max(0, Math.min(h - 1, py)) * w + Math.max(0, Math.min(w - 1, px))];
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const i = py * w + px, o = i * 4; if (a[o + 3] < 8) continue;
    const c0 = carve[i], e = cg(px - 1, py - 1) - cg(px + 1, py + 1);
    let T = 0.9 + 0.035 * Math.sin(px * f1 * 3 + py * f1 * 2 + ph1) + 0.025 * Math.sin(px * f2 - py * f2 * 1.3 + ph2);
    T -= 0.66 * Math.min(1, c0 * 2.1) + 0.75 * e;
    let r = mramp(T, 0, 0), g = mramp(T, 0, 1), b = mramp(T, 0, 2);
    const sr = a[o], sg = a[o + 1], sb = a[o + 2];
    if (c0 > 0.45 && sr > 150 && sr > sb * 1.5 && sg > sb * 1.2) { const k = Math.min(0.35, (c0 - 0.45) * 0.9); r += (150 - r) * k; g += (118 - g) * k; b += (42 - b) * k; }   // oluklarda çok ince altın
    const d = dist[i];
    if (d <= t) { const k = 1; r = 0x7A * k; g = 0x72 * k; b = 0x63 * k; }
    else if (d <= t + 1.2) { r = r * 0.55 + 0xFA * 0.45; g = g * 0.55 + 0xF7 * 0.45; b = b * 0.55 + 0xEE * 0.45; }
    else if (d <= t + 2.4) { r *= 0.96; g *= 0.96; b *= 0.96; }
    a[o] = r; a[o + 1] = g; a[o + 2] = b;
  }
  x.putImageData(img, 0, 0);
  const vn = mk(w, h); veins(vn, seed, s);
  x.globalCompositeOperation = 'source-atop'; x.drawImage(vn, 0, 0); x.globalCompositeOperation = 'source-over';
  return out;
}
const mcache = new Map();
export function getMarbleSprite(type, rot, s) {
  const key = type + '|' + (rot & 3) + '|' + s;
  let cv = mcache.get(key);
  if (!cv) { cv = buildMarble(getSprite(type, rot, false, s), hashStr(type) + 17 * (rot & 3), s); mcache.set(key, cv); }
  return cv;
}
// Sembolsüz düz mermer hücre (altın sütun etkisiyle oluşan dolgu)
export function getPlainMarble(s, k) {
  const key = 'plain|' + s + '|' + (k & 3);
  let cv = mcache.get(key);
  if (cv) return cv;
  cv = mk(s, s); const c = cv.getContext('2d'), t = Math.max(1, s * 0.055);
  const g = c.createLinearGradient(0, 0, s, s); g.addColorStop(0, '#EFE9DB'); g.addColorStop(1, '#DAD2BF');
  c.fillStyle = g; c.fillRect(0, 0, s, s);
  veins(cv, 91 + (k & 3) * 13, s);
  c.fillStyle = 'rgba(255,252,244,0.55)'; c.fillRect(t, t, s - 2 * t, t * 0.9); c.fillRect(t, t, t * 0.9, s - 2 * t);
  c.fillStyle = 'rgba(120,112,96,0.28)'; c.fillRect(t, s - t * 1.9, s - 2 * t, t * 0.9); c.fillRect(s - t * 1.9, t, t * 0.9, s - 2 * t);
  c.strokeStyle = '#7A7263'; c.lineWidth = t * 1.1; c.strokeRect(t * 0.55, t * 0.55, s - t * 1.1, s - t * 1.1);
  mcache.set(key, cv); return cv;
}

export const COLORS = C;
