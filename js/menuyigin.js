// Lex Stack - ana menünün altında oyunun gerçek parçalarıyla canlı bir yığın:
// parçalar yavaşça düşüp yerleşir, satır dolunca altın ışıkla silinir.
import { TYPES, cellsOf, getSprite } from './pieces.js';

const menu = document.getElementById('menu');
const cv = document.createElement('canvas');
cv.className = 'deco menu-yigin';
cv.setAttribute('aria-hidden', 'true');
menu.appendChild(cv);
const c = cv.getContext('2d');
const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;

let DPR = 1, sonu = 0, gor = 1, W = 0, H = 0, s = 24, cols = 12, rows = 7, grid = [], kalici = [], dusen = null, bekle = 0, isik = null, son = 0;

const bos = () => Array.from({ length: rows }, () => Array(cols).fill(false));
function carpar(cs, x, y) {
  return cs.some(([cx, cy]) => { const gx = x + cx, gy = y + cy; return gx < 0 || gx >= cols || gy >= rows || (gy >= 0 && grid[gy][gx]); });
}
function yerles(p) {
  for (const [cx, cy] of cellsOf(p.t, p.r)) if (p.y + cy >= 0) grid[p.y + cy][p.x + cx] = true;
  kalici.push(p);
}
// Rastgele parça, ama düzgün yerleşim: delik bırakmayan ve alçakta kalan konum seçilir
function yeniParca() {
  const t = TYPES[(Math.random() * TYPES.length) | 0];
  let en = null;
  for (let r = 0; r < 4; r++) {
    const cs = cellsOf(t, r), w = Math.max(...cs.map((q) => q[0])) + 1;
    for (let x = 0; x + w <= cols; x++) {
      let y = -4; while (!carpar(cs, x, y + 1)) y++;
      if (carpar(cs, x, y) || cs.some(([, cy]) => y + cy < 0)) continue;
      const dolu = new Set(cs.map(([cx, cy]) => (x + cx) + ',' + (y + cy)));
      let delik = 0;
      for (const [cx, cy] of cs) {
        const gx = x + cx; if (dolu.has(gx + ',' + (y + cy + 1))) continue;
        for (let gy = y + cy + 1; gy < rows && !grid[gy][gx]; gy++) delik++;
      }
      const ust = Math.min(...cs.map((q) => q[1])) + y;
      const puan = -delik * 5 + ust + Math.random() * 1.5;
      if (!en || puan > en.puan) en = { t, r, x, y, puan };
    }
  }
  return en && { t: en.t, r: en.r, x: en.x, hedef: en.y, fy: -4, g: Math.random() < 0.12 };
}
function satirSil() {
  // Dolu (ya da neredeyse dolu) satır varsa onu, yığın çok yükseldiyse en alt satırı sil
  let y = -1;
  for (let i = rows - 1; i >= 0; i--) if (grid[i].filter(Boolean).length >= cols - 1) { y = i; break; }
  if (y < 0) { if (yukseklik() >= 5 && !sonu) sonu = 1; return; }
  isik = { y, t: 0 };
  kaydir(y);
}
// Silinen satır: o satırdaki hücreler gizlenir, üstteki hücreler bir satır iner (parça başına hücre ofseti)
function kaydir(y) {
  grid.splice(y, 1); grid.unshift(Array(cols).fill(false));
  for (const p of kalici) {
    p.dy = p.dy || {};
    for (const [cx, cy] of cellsOf(p.t, p.r)) {
      const k = cx + ',' + cy, gy = p.y + cy + (p.dy[k] || 0);
      if (gy === y) p.dy[k] = 99; else if (gy < y && p.dy[k] !== 99) p.dy[k] = (p.dy[k] || 0) + 1;
    }
  }
  kalici = kalici.filter((p) => cellsOf(p.t, p.r).some(([cx, cy]) => p.dy[cx + ',' + cy] !== 99));
}
const yukseklik = () => { for (let y = 0; y < rows; y++) if (grid[y].some(Boolean)) return rows - y; return 0; };

function kur() {
  const r = menu.getBoundingClientRect();
  W = r.width; s = Math.round(Math.max(20, Math.min(30, W / 13)));
  cols = Math.ceil(W / s) + 1; rows = 7; H = rows * s + 7;
  const dpr = Math.min(3, devicePixelRatio || 1); DPR = dpr;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  doldur();
}
function doldur() {
  grid = bos(); kalici = []; dusen = null;
  // Başlangıç yığını: yaklaşık 2-3 satır
  for (let i = 0; i < 80 && grid.flat().filter(Boolean).length < cols * 2.4; i++) { const p = yeniParca(); if (p) { p.y = p.hedef; yerles(p); } }
}

function parcaCiz(p, y) {
  // Keskinlik: sprite ekranın gerçek piksel yoğunluğunda üretilir (oyun tahtasıyla aynı netlik)
  const S = Math.round(s * DPR), spr = getSprite(p.t, p.r, p.g, S);
  if (!p.dy || !Object.keys(p.dy).length) { c.drawImage(spr, p.x * s, y * s, spr.width / DPR, spr.height / DPR); return; }
  // satır silindiyse hücre hücre çiz
  for (const [cx, cy] of cellsOf(p.t, p.r)) {
    const d = p.dy[cx + ',' + cy] || 0; if (d === 99) continue;
    c.drawImage(spr, cx * S, cy * S, S, S, (p.x + cx) * s, (y + cy + d) * s, s, s);
  }
}

function kare(now) {
  requestAnimationFrame(kare);
  if (menu.hidden || document.hidden) { son = now; return; }
  const dt = Math.min(0.05, (now - son) / 1000 || 0); son = now;
  if (!azHareket) {
    if (sonu) { gor -= dt * 1.6; if (gor <= 0) { doldur(); sonu = 0; } }
    else if (gor < 1) gor = Math.min(1, gor + dt * 1.6);
    if (sonu) { /* söner */ } else if (!dusen) { bekle -= dt; if (bekle <= 0) dusen = yeniParca(); }
    else {
      dusen.fy += dt * 2.4;
      if (dusen.fy >= dusen.hedef) { dusen.y = dusen.hedef; yerles(dusen); dusen = null; bekle = 0.9; satirSil(); }
    }
  }
  c.clearRect(0, 0, W, H);
  c.save(); c.globalAlpha = Math.max(0, gor);
  for (const p of kalici) parcaCiz(p, p.y);
  if (dusen) { c.globalAlpha = Math.max(0, gor) * Math.min(1, Math.max(0, (dusen.fy + 4) / 3)); parcaCiz(dusen, dusen.fy); }
  c.restore();
  // mermer kaide + altın çizgi (yığın havada durmasın)
  const ky = rows * s, kg = c.createLinearGradient(0, ky, 0, ky + 7);
  kg.addColorStop(0, '#E8E4DA'); kg.addColorStop(1, '#9E978A');
  c.fillStyle = kg; c.fillRect(0, ky, W, 7);
  c.fillStyle = '#C9A227'; c.fillRect(0, ky, W, 1.5);
  if (isik) {
    isik.t += dt; const a = Math.max(0, 1 - isik.t / 0.6);
    const yy = isik.y * s, gr = c.createLinearGradient(0, yy - s, 0, yy + 2 * s);
    gr.addColorStop(0, 'rgba(255,214,120,0)'); gr.addColorStop(0.5, `rgba(255,224,150,${0.75 * a})`); gr.addColorStop(1, 'rgba(255,214,120,0)');
    c.fillStyle = gr; c.fillRect(0, yy - s, W, 3 * s);
    if (a <= 0) isik = null;
  }
}

kur();
addEventListener('resize', () => { clearTimeout(kur.t); kur.t = setTimeout(kur, 150); });
requestAnimationFrame(kare);
