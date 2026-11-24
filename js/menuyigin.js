// Lex Stack - ana menü "attract mode": oyunun gerçek parçaları gökten süzülür, dönüp hedef sütuna yönelir,
// plazadaki yığına oturur; dolan satır altın ışıkla silinir. Yığın önbellekte (statik tuval), düşen parça
// ayrı bir tuvalde kirli-dikdörtgenle çizilir; hareket yokken hiç çizim yapılmaz.
import { TYPES, cellsOf, sizeOf, hasCell, getSprite, getMarbleSprite, MERMER } from './pieces.js';

const menu = document.getElementById('menu');
const mk = (cls) => { const e = document.createElement('canvas'); e.className = 'deco menu-yigin ' + cls; e.setAttribute('aria-hidden', 'true'); menu.appendChild(e); return e; };
const stCv = mk('menu-yigin-st'), fxCv = mk('menu-yigin-fx');
const stc = stCv.getContext('2d'), c = fxCv.getContext('2d');
const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLS = 9, ROWS = 5, SURE_ROT = 0.12;

let W = 0, H = 0, s = 28, DPR = 1, bx = 0, bw = 0, by = 0, zt = 0, sx0 = 0, sy0 = 0, sw0 = 0, sh0 = 0, ledge = 7;
let grid = [], kirli = true, filtre = null, fly = null, clr = null, fade = null, bekle = 0.4, son = 0, gizliydi = false;
let lock = null, pid = 0;
let ui = [], uiT = 0, parts = [], dirty = [], up = null, tIdle = 0, hazir = false;

const bosSatir = () => Array(COLS).fill(null);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => t * t * (3 - 2 * t);
const rnd = (a, b) => a + Math.random() * (b - a);

// ---------- Izgara mantığı ----------
function dolu(gy, gx) { return grid[gy][gx]; }
function carpar(cs, x, y) {
  return cs.some(([cx, cy]) => { const gx = x + cx, gy = y + cy; return gx < 0 || gx >= COLS || gy >= ROWS || (gy >= 0 && dolu(gy, gx)); });
}
const yukseklik = () => { for (let y = 0; y < ROWS; y++) if (grid[y].some(Boolean)) return ROWS - y; return 0; };
function koy(t, r, g, x, y) {
  const id = ++pid;
  cellsOf(t, r).forEach(([cx, cy]) => { if (y + cy >= 0) grid[y + cy][x + cx] = { t, r, g, cx, cy, id }; });
}
// Aday konumların puanı: satır tamamlama +, delik/yükseklik -
function enIyi(types) {
  let en = null;
  for (const t of types) for (let r = 0; r < 4; r++) {
    const cs = cellsOf(t, r), { w } = sizeOf(t, r);
    for (let x = 0; x + w <= COLS; x++) {
      let y = -6; while (!carpar(cs, x, y + 1)) y++;
      if (carpar(cs, x, y) || cs.some(([, cy]) => y + cy < 0)) continue;
      const set = new Set(cs.map(([cx, cy]) => (x + cx) + ',' + (y + cy)));
      let delik = 0;
      for (const [cx, cy] of cs) {
        const gx = x + cx; if (set.has(gx + ',' + (y + cy + 1))) continue;
        for (let gy = y + cy + 1; gy < ROWS && !grid[gy][gx]; gy++) delik++;
      }
      let satir = 0;
      for (const gy of new Set(cs.map(([, cy]) => y + cy))) {
        let n = 0; for (let gx = 0; gx < COLS; gx++) if (grid[gy][gx] || set.has(gx + ',' + gy)) n++;
        if (n === COLS) satir++;
      }
      const ust = Math.min(...cs.map(([, cy]) => y + cy));
      const puan = satir * 22 - delik * 9 + ust * 0.9 + Math.random() * 1.6;
      if (!en || puan > en.puan) en = { t, r, x, y, puan };
    }
  }
  return en;
}
function tohum() {
  grid = Array.from({ length: ROWS }, bosSatir);
  for (let i = 0; i < 60; i++) {
    const n = grid.flat().filter(Boolean).length; if (n >= COLS * 3) break;
    const t = TYPES[(Math.random() * TYPES.length) | 0], p = enIyi([t]);
    if (p && p.y >= ROWS - 3) koy(p.t, p.r, false, p.x, p.y);
  }
  // başlangıçta tam satır kalmasın
  for (let y = 0; y < ROWS; y++) if (grid[y].every(Boolean)) grid[y][(Math.random() * COLS) | 0] = null;
  kirli = true;
}

// ---------- Yerleşim ----------
function kur() {
  const r = menu.getBoundingClientRect();
  W = r.width; H = r.height;
  if (!W || !H) return false;
  DPR = Math.min(2, devicePixelRatio || 1);
  const s0 = clamp(Math.min(W / 13, H / 20), 22, 56);
  s = Math.round(s0 * DPR) / DPR;
  const probe = document.createElement('div'); probe.style.cssText = 'position:absolute;visibility:hidden;padding-bottom:env(safe-area-inset-bottom)';
  menu.appendChild(probe); const safe = parseFloat(getComputedStyle(probe).paddingBottom) || 0; probe.remove();
  bw = COLS * s; bx = Math.round(((W - bw) / 2) * DPR) / DPR;
  ledge = Math.round(s * 0.24);
  by = Math.round((H - 40 - safe - ledge) * DPR) / DPR; zt = by - ROWS * s;
  const pw = Math.round(s * 0.42), pad = pw + 4;
  sx0 = bx - pad; sw0 = bw + pad * 2; sy0 = zt - Math.round(s * 0.9); sh0 = by + ledge - sy0 + 1;
  stCv.width = Math.round(sw0 * DPR); stCv.height = Math.round(sh0 * DPR);
  stCv.style.left = sx0 + 'px'; stCv.style.top = sy0 + 'px'; stCv.style.width = sw0 + 'px'; stCv.style.height = sh0 + 'px';
  fxCv.width = Math.round(W * DPR); fxCv.height = Math.round(H * DPR); fxCv.style.width = W + 'px'; fxCv.style.height = H + 'px';
  stc.setTransform(DPR, 0, 0, DPR, -sx0 * DPR, -sy0 * DPR);
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  fly = null; lock = null; clr = null; up = null; dirty = []; parts = [];
  stCv.style.opacity = 1; fade = null;
  measureUI(); kirli = true; hazir = true;
  return true;
}
function measureUI() {
  const r = menu.getBoundingClientRect();
  ui = [...menu.querySelectorAll('h1, .menu-hero, #play, .menu-links, .menu-best, .tag, .menu-snd')].map((e) => e.getBoundingClientRect())
    .filter((q) => q.width > 0 && q.height > 0).map((q) => [q.left - r.left - 8, q.top - r.top - 8, q.right - r.left + 8, q.bottom - r.top + 8]);
  uiT = 0;
}
const uiKesisir = (x, y, R) => ui.some(([a, b, cc, d]) => x + R > a && x - R < cc && y + R > b && y - R < d);

// ---------- Statik yığın (önbellek) ----------
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function kesik(ctx, X, Y, d) {
  // kısmen silinmiş parçanın düz kesik kenarı (oyundaki cutEdge ile aynı)
  const t = Math.max(1, s * 0.055);
  const strip = (o, th) => {
    if (d === 0) ctx.fillRect(X, Y + o, s, th); else if (d === 2) ctx.fillRect(X, Y + s - o - th, s, th);
    else if (d === 3) ctx.fillRect(X + o, Y, th, s); else ctx.fillRect(X + s - o - th, Y, th, s);
  };
  ctx.save(); ctx.beginPath(); ctx.rect(X, Y, s, s); ctx.clip();
  ctx.fillStyle = 'rgba(250,247,238,0.5)'; strip(t, 1.2); ctx.fillStyle = '#7A7263'; strip(0, t);
  ctx.restore();
}
function hucre(ctx, q, gx, gy) {
  const S = Math.round(s * DPR), X = bx + gx * s, Y = zt + gy * s;
  const spr = MERMER ? getMarbleSprite(q.t, q.r, S) : getSprite(q.t, q.r, q.g, S);
  ctx.drawImage(spr, q.cx * S, q.cy * S, S, S, X, Y, s, s);
  if (!MERMER) return;
  for (let d = 0; d < 4; d++) {
    const [dx, dy] = DIRS[d];
    if (!hasCell(q.t, q.r, q.cx + dx, q.cy + dy)) continue;
    const n = grid[gy + dy] && grid[gy + dy][gx + dx];
    if (n && n.id === q.id) continue;
    kesik(ctx, X, Y, d);
  }
}
function hucreler(ctx, f) {
  for (let y = 0; y < ROWS; y++) if (!f || f(y)) for (let x = 0; x < COLS; x++) if (grid[y][x]) hucre(ctx, grid[y][x], x, y);
}
function cerceve(x) {
  // izgara tahtası: hafif zemin + ince çizgiler (yalnızca yığın bölgesinde)
  const g = x.createLinearGradient(0, zt, 0, by);
  g.addColorStop(0, 'rgba(255,248,228,0)'); g.addColorStop(1, 'rgba(255,244,218,0.26)');
  x.fillStyle = g; x.fillRect(bx, zt, bw, ROWS * s);
  x.lineWidth = 1;
  for (let i = 1; i < COLS; i++) { const X = Math.round((bx + i * s) * DPR) / DPR; x.strokeStyle = 'rgba(70,40,25,0.16)'; x.beginPath(); x.moveTo(X, zt); x.lineTo(X, by); x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.moveTo(X + 1, zt); x.lineTo(X + 1, by); x.stroke(); }
  for (let j = 1; j < ROWS; j++) { const Y = Math.round((zt + j * s) * DPR) / DPR; x.strokeStyle = 'rgba(70,40,25,0.16)'; x.beginPath(); x.moveTo(bx, Y); x.lineTo(bx + bw, Y); x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.28)'; x.beginPath(); x.moveTo(bx, Y + 1); x.lineTo(bx + bw, Y + 1); x.stroke(); }
  // ince mermer sütun kenarları
  const pw = Math.round(s * 0.42), ph = ROWS * s + Math.round(s * 0.55), top = by - ph;
  for (const px of [bx - pw, bx + bw]) {
    const mg = x.createLinearGradient(px, 0, px + pw, 0);
    mg.addColorStop(0, '#BDB4A0'); mg.addColorStop(0.45, '#F6F1E4'); mg.addColorStop(1, '#B3AA96');
    x.fillStyle = mg; x.fillRect(px, top, pw, ph);
    x.strokeStyle = 'rgba(120,110,95,0.55)'; x.lineWidth = 1;
    for (const f of [0.34, 0.66]) { x.beginPath(); x.moveTo(px + pw * f, top + s * 0.3); x.lineTo(px + pw * f, by - s * 0.2); x.stroke(); }
    x.fillStyle = '#E4DDCB'; x.fillRect(px - 2, top, pw + 4, Math.round(s * 0.22)); x.fillRect(px - 2, by - Math.round(s * 0.16), pw + 4, Math.round(s * 0.16));
    x.strokeStyle = '#2E2A33'; x.lineWidth = 1.6; x.strokeRect(px, top, pw, ph);
    x.strokeRect(px - 2, top, pw + 4, Math.round(s * 0.22));
  }
  // mermer kaide + altın çizgi
  const kg = x.createLinearGradient(0, by, 0, by + ledge);
  kg.addColorStop(0, '#E8E4DA'); kg.addColorStop(1, '#9E978A');
  x.fillStyle = kg; x.fillRect(bx - pw - 3, by, bw + pw * 2 + 6, ledge);
  x.fillStyle = '#C9A227'; x.fillRect(bx - pw - 3, by, bw + pw * 2 + 6, 1.5);
}
function statikCiz() {
  stc.clearRect(sx0, sy0, sw0, sh0);
  cerceve(stc); hucreler(stc, filtre);
  kirli = false;
}

// ---------- Parça uçuşu ----------
function uret() {
  const altin = Math.random() < 1 / 6;
  let types;
  if (altin) types = [Math.random() < 0.5 ? 'sutun' : 'kanun'];
  else { types = []; while (types.length < 6) { const t = TYPES[(Math.random() * TYPES.length) | 0]; if (!types.includes(t)) types.push(t); } }
  const p = enIyi(types);
  if (!p) { basla_fade(); return; }
  const { w, h } = sizeOf(p.t, p.r);
  const nrot = p.t === 'kanun' ? 0 : [0, 1, 1, 1, 2, 2][(Math.random() * 6) | 0];
  const xs = clamp(p.x + Math.round(rnd(-3, 3)), 0, COLS - w);
  const hm = Math.max(w, h) * s, cy0 = -hm / 2 - 8, cyT = zt + (p.y + h / 2) * s, total = cyT - cy0;
  const cyEnd = zt - 6 - hm / 2, fEnd = clamp((cyEnd - cy0) / total, 0.3, 0.95);
  const S = Math.round(s * DPR); for (let k = 0; k < 4; k++) getSprite(p.t, k, altin, S);
  if (MERMER) getMarbleSprite(p.t, p.r, S);
  fly = { t: p.t, g: altin, r: p.r, x: p.x, y: p.y, w, h, nrot, r0: (p.r - nrot) & 3, rotK: 0, rotT: -1, cx0: bx + (xs + w / 2) * s, cxT: bx + (p.x + w / 2) * s,
    cy0, cyT, total, u: 0, fEnd, hm, alpha: 1, ph: Math.random() * 6, v: Math.max(240, H / 2.7), cx: 0, cy: cy0 };
}
function adim(dt) {
  const f = fly; f.u += f.v * dt;
  if (f.u >= f.total) { indi(f); return; }
  const fr = f.u / f.total;
  if (f.rotT < 0 && f.rotK < f.nrot && fr >= f.fEnd * (0.16 + 0.3 * f.rotK)) f.rotT = 0;
  if (f.rotT >= 0) { f.rotT += dt; if (f.rotT >= SURE_ROT) { f.rotK++; f.rotT = -1; } }
  const ge = ease(clamp((fr - 0.1 * f.fEnd) / (0.72 * f.fEnd), 0, 1));
  f.cx = f.cx0 + (f.cxT - f.cx0) * ge; f.cy = f.cy0 + f.u;
  const hedef = uiKesisir(f.cx, f.cy, f.hm / 2) ? 0.35 : 1;
  f.alpha += (hedef - f.alpha) * Math.min(1, dt * 9);
}
function indi(f) {
  koy(f.t, f.r, f.g, f.x, f.y); kirli = true; fly = null; bekle = 0.35;
  if (MERMER && !azHareket) lock = { t: f.t, r: f.r, g: f.g, x: f.x, y: f.y, w: f.w, h: f.h, a: 0 };
  if (f.g) for (let i = 0; i < 14; i++) parts.push({ x: bx + (f.x + rnd(0, f.w)) * s, y: zt + (f.y + rnd(0, f.h)) * s, vx: rnd(-60, 60), vy: rnd(-110, -20), t: 0, L: rnd(0.45, 0.8) });
  dirty.push([sx0 - 4, sy0 - 4, sw0 + 8, sh0 + 8]);
  sonraki();
}
function sonraki() {
  let y = -1;
  const th = yukseklik();
  for (let i = ROWS - 1; i >= 0; i--) { const n = grid[i].filter(Boolean).length; if (n === COLS || (th >= 4 && n >= COLS - 1) || (th >= 5 && n >= COLS - 2)) { y = i; break; } }
  if (y >= 0) { clr = { y, t: 0, k: 0 }; return; }
  if (th >= ROWS) basla_fade();
}
function basla_fade() { fade = { t: 0 }; stCv.style.opacity = 0; }

// ---------- Çizim ----------
function parcaCiz(f, now) {
  const S = Math.round(s * DPR), kr = (f.r0 + f.rotK) & 3, spr = getSprite(f.t, kr, f.g, S), sw = spr.width / DPR, sh = spr.height / DPR;
  const ang = f.rotT >= 0 ? ease(f.rotT / SURE_ROT) * Math.PI / 2 : 0;
  c.save(); c.translate(f.cx, f.cy);
  if (f.g) { // altın hale
    const R = f.hm * 0.75, hg = c.createRadialGradient(0, 0, 0, 0, 0, R);
    const a = (0.3 + 0.12 * Math.sin(now / 160 + f.ph)) * f.alpha;
    hg.addColorStop(0, `rgba(255,226,130,${a})`); hg.addColorStop(1, 'rgba(255,226,130,0)');
    c.fillStyle = hg; c.fillRect(-R, -R, 2 * R, 2 * R);
  }
  c.globalAlpha = f.alpha;
  if (ang) c.rotate(ang);
  c.drawImage(spr, -sw / 2, -sh / 2, sw, sh);
  if (f.g) { // parıltı bandı hücrelerin üzerinden süzülür
    c.beginPath(); for (const [qx, qy] of cellsOf(f.t, kr)) c.rect(-sw / 2 + qx * s, -sh / 2 + qy * s, s, s);
    c.clip();
    const ph = ((now / 900 + f.ph) % 1.6) - 0.3, X = -sw / 2 + ph * (sw + sh), gr = c.createLinearGradient(X - s * 0.5, -sh / 2, X + s * 0.5, sh / 2);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,245,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.fillRect(-sw / 2, -sh / 2, sw, sh);
  }
  c.restore();
  if (f.g) for (let i = 0; i < 3; i++) { // pırıltılar
    const tt = (now / 700 + i * 0.37 + f.ph) % 1, a = Math.sin(tt * Math.PI) * f.alpha, px = f.cx + Math.cos(i * 2.1 + f.ph) * f.hm * 0.45, py = f.cy + Math.sin(i * 2.7 + f.ph * 2) * f.hm * 0.45, r = s * 0.26 * a;
    c.fillStyle = `rgba(255,246,200,${a})`; c.beginPath(); c.moveTo(px, py - r); c.lineTo(px + r * 0.25, py - r * 0.25); c.lineTo(px + r, py); c.lineTo(px + r * 0.25, py + r * 0.25);
    c.lineTo(px, py + r); c.lineTo(px - r * 0.25, py + r * 0.25); c.lineTo(px - r, py); c.lineTo(px - r * 0.25, py - r * 0.25); c.closePath(); c.fill();
  }
  const R = f.hm * 0.75 + 6; dirty.push([f.cx - R, f.cy - R, 2 * R, 2 * R]);
}
function hayalet(f, now) {
  // iniş hayaleti: hedef şeklin soluk dış hatları
  const a = clamp((f.u / f.total - f.fEnd * 0.3) / (f.fEnd * 0.25), 0, 1) * (0.55 + 0.2 * Math.sin(now / 260)) * (f.alpha > 0.5 ? 1 : 0.6);
  const cs = cellsOf(f.t, f.r), set = new Set(cs.map((q) => q[0] + ',' + q[1])), ox = bx + f.x * s, oy = zt + f.y * s;
  c.save(); c.globalAlpha = a;
  c.fillStyle = 'rgba(255,244,214,0.3)'; for (const [qx, qy] of cs) c.fillRect(ox + qx * s, oy + qy * s, s, s);
  c.beginPath();
  for (const [qx, qy] of cs) {
    const X = ox + qx * s, Y = oy + qy * s;
    if (!set.has(qx + ',' + (qy - 1))) { c.moveTo(X, Y); c.lineTo(X + s, Y); }
    if (!set.has(qx + ',' + (qy + 1))) { c.moveTo(X, Y + s); c.lineTo(X + s, Y + s); }
    if (!set.has((qx - 1) + ',' + qy)) { c.moveTo(X, Y); c.lineTo(X, Y + s); }
    if (!set.has((qx + 1) + ',' + qy)) { c.moveTo(X + s, Y); c.lineTo(X + s, Y + s); }
  }
  c.lineJoin = 'round'; c.strokeStyle = 'rgba(70,35,20,0.5)'; c.lineWidth = 3.2; c.stroke();
  c.strokeStyle = 'rgba(255,250,232,0.95)'; c.lineWidth = 1.8; c.stroke();
  c.restore();
  dirty.push([ox - 4, oy - 4, f.w * s + 8, f.h * s + 8]);
}
function satirEfekt(dt) {
  const k = clr; k.t += dt;
  const y = zt + k.y * s, T = k.t;
  if (T >= 0.2 && k.k === 0) { // satırı gizle, üstünü ayrı tuvale al
    k.k = 1; lock = null; grid[k.y] = bosSatir();
    up = document.createElement('canvas'); up.width = stCv.width; up.height = stCv.height;
    const u = up.getContext('2d'); u.setTransform(DPR, 0, 0, DPR, -sx0 * DPR, -sy0 * DPR);
    hucreler(u, (r) => r < k.y); filtre = (r) => r > k.y; kirli = true;
  }
  if (T >= 0.5) { // bitti: gerçek kaydırma
    grid.splice(k.y, 1); grid.unshift(bosSatir()); filtre = null; up = null; kirli = true; clr = null; bekle = 0.3;
    dirty.push([sx0 - 4, sy0 - 4, sw0 + 8, sh0 + 8]); sonraki(); return;
  }
  // altın süpürme + renk parlaması
  const sp = clamp(T / 0.42, 0, 1), X = bx - s * 2 + (bw + s * 4) * sp, fl = Math.max(0, 1 - T / 0.4);
  c.save(); c.beginPath(); c.rect(bx, y - 2, bw, s + 4); c.clip();
  c.fillStyle = `rgba(255,236,160,${0.6 * fl})`; c.fillRect(bx, y, bw, s);
  const g = c.createLinearGradient(X - s * 2, 0, X + s * 2, 0);
  g.addColorStop(0, 'rgba(255,214,120,0)'); g.addColorStop(0.5, 'rgba(255,246,200,0.95)'); g.addColorStop(1, 'rgba(255,214,120,0)');
  c.fillStyle = g; c.fillRect(X - s * 2, y - 2, s * 4, s + 4);
  c.restore();
  if (T >= 0.2 && T < 0.5) { const o = ease(clamp((T - 0.26) / 0.22, 0, 1)) * s; c.drawImage(up, 0, 0, up.width, up.height, sx0, sy0 + o, sw0, sh0); }
  dirty.push([sx0 - 4, sy0 - 4, sw0 + 8, sh0 + 8]);
}
function kareCiz(dt, now) {
  for (const d of dirty) c.clearRect(d[0], d[1], d[2], d[3]);
  dirty.length = 0;
  if (fly) { hayalet(fly, now); parcaCiz(fly, now); }
  if (lock) {
    const L = lock; L.a += dt; const k = Math.min(1, L.a / 0.25);
    if (k >= 1) { lock = null; dirty.push([bx + L.x * s - 4, zt + L.y * s - 4, L.w * s + 8, L.h * s + 8]); }
    else {
      const S = Math.round(s * DPR), spr = getSprite(L.t, L.r, L.g, S), cs = cellsOf(L.t, L.r);
      c.save(); c.globalAlpha = 1 - ease(k);
      for (const [qx, qy] of cs) c.drawImage(spr, qx * S, qy * S, S, S, bx + (L.x + qx) * s, zt + (L.y + qy) * s, s, s);
      c.restore();
      dirty.push([bx + L.x * s - 4, zt + L.y * s - 4, L.w * s + 8, L.h * s + 8]);
    }
  }
  if (clr) satirEfekt(dt);
  if (parts.length) {
    parts = parts.filter((p) => (p.t += dt) < p.L);
    for (const p of parts) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; const a = 1 - p.t / p.L;
      c.fillStyle = `rgba(255,226,120,${a})`; c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); dirty.push([p.x - 4, p.y - 4, 8, 8]);
    }
  }
}

function kare(now) {
  requestAnimationFrame(kare);
  if (menu.hidden || document.hidden) { son = 0; gizliydi = true; return; }
  if (gizliydi) { gizliydi = false; if (!hazir || Math.abs(menu.clientWidth - W) > 1 || Math.abs(menu.clientHeight - H) > 1) kur(); else measureUI(); }
  if (!hazir) return;
  const dt = son ? Math.min(0.05, (now - son) / 1000) : 0; son = now;
  if (azHareket) { if (kirli) statikCiz(); return; }
  uiT += dt;
  if (uiT > 0.5 && (Math.abs(menu.clientWidth - W) > 1 || Math.abs(menu.clientHeight - H) > 1)) { kur(); statikCiz(); return; }
  if (uiT > 2 && fly) measureUI();
  if (fade) { fade.t += dt; if (fade.t >= 0.65) { tohum(); stCv.style.opacity = 1; fade = null; bekle = 0.5; } }
  else if (!clr && !fly) { bekle -= dt; if (bekle <= 0) uret(); }
  if (fly) adim(dt);
  const aktif = fly || clr || lock || parts.length || dirty.length;
  if (kirli) statikCiz();
  if (aktif) kareCiz(dt, now);
}

function basla() {
  if (!kur()) return requestAnimationFrame(basla);
  tohum(); statikCiz();
  // sprite'ları boşta ısıt (ilk düşüşte takılma olmasın)
  const S = Math.round(s * DPR), isit = []; for (const t of TYPES) for (let k = 0; k < 4; k++) isit.push([t, k, false]);
  isit.push(['sutun', 0, true], ['sutun', 1, true], ['kanun', 0, true]);
  if (MERMER) for (const t of TYPES) for (let k = 0; k < 4; k++) isit.push([t, k, 'm']);
  const adimIsit = () => { const q = isit.shift(); if (q) { if (q[2] === 'm') getMarbleSprite(q[0], q[1], S); else getSprite(q[0], q[1], q[2], S); setTimeout(adimIsit, 16); } };
  setTimeout(adimIsit, 200);
  requestAnimationFrame(kare);
}
addEventListener('resize', () => { clearTimeout(kur.t); kur.t = setTimeout(() => { if (kur()) { statikCiz(); } }, 150); });
basla();
