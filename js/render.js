// Lex Stack - çizim
import { COLS, ROWS } from './board.js';
import { THEME as TH, levelFade } from './theme.js';
import { getSprite, hasCell, sizeOf, cellsOf, COLORS as C } from './pieces.js';
import { makeBackdrop } from './roma.js';
import { drawBurst, BURST_MS, shakeX, drawCalm } from './fx.js';

const TOP = 1.7;     // alınlık yüksekliği (hücre)
const BOTTOM = 0.5;  // kaide
const COLW = 1;      // sütun genişliği (hücre)
const REDUCED = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const SWEEP_CYCLE = 1.8, SWEEP_DUR = 1.3, FLASH_MS = 400;
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

// Altın parça: sprite çevresinde nabızlı ışıltı + hücre maskesine kırpılmış çapraz parıltı süpürmesi
export function goldFx(c, sprite, ox, oy, cells, s, t, blur) {
  const reduced = REDUCED.matches;
  const pulse = reduced ? 0.85 : 0.8 + 0.2 * Math.sin((t * Math.PI * 2) / 1.2);
  c.save();
  c.shadowColor = 'rgba(255,215,110,' + (0.75 * pulse).toFixed(3) + ')';
  c.shadowBlur = blur * s;
  c.drawImage(sprite, ox, oy);
  c.restore();
  if (reduced) return;
  const ph = (t % SWEEP_CYCLE) / SWEEP_DUR;
  if (ph >= 1) return;
  const w = sprite.width, h = sprite.height, a = (38 * Math.PI) / 180;
  const dx = Math.cos(a), dy = Math.sin(a), bw = 0.6 * s;
  const ext = w * dx + h * dy, u = -ext / 2 - bw + ease(ph) * (ext + 2 * bw);
  const cx = ox + w / 2, cy = oy + h / 2;
  const g = c.createLinearGradient(cx + dx * (u - bw / 2), cy + dy * (u - bw / 2), cx + dx * (u + bw / 2), cy + dy * (u + bw / 2));
  g.addColorStop(0, 'rgba(255,244,200,0)'); g.addColorStop(0.5, 'rgba(255,247,215,0.55)'); g.addColorStop(1, 'rgba(255,244,200,0)');
  c.save();
  c.beginPath();
  for (const [x, y] of cells) c.rect(ox + x * s, oy + y * s, s, s);
  c.clip();
  c.fillStyle = g; c.fillRect(ox, oy, w, h);
  c.restore();
}
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export class Renderer {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.s = 20; this.dpr = 1; this.calm = 0; this.calmT = 0;
  }

  resize(wCss, hCss) {
    this.dpr = window.devicePixelRatio || 1;
    const aw = wCss * this.dpr, ah = hCss * this.dpr;
    this.s = Math.max(8, Math.floor(Math.min(aw / (COLS + 2 * COLW), ah / (ROWS + TOP + BOTTOM))));
    this.cv.width = Math.round(this.s * (COLS + 2 * COLW));
    this.cv.height = Math.round(this.s * (ROWS + TOP + BOTTOM));
    this.cv.style.width = this.cv.width / this.dpr + 'px';
    this.cv.style.height = this.cv.height / this.dpr + 'px';
    this.bx = this.s * COLW; this.by = this.s * TOP;
    this.bdrop = {};   // arka plan önbelleği (seviye başına), boyut değişince yeniden kurulur
  }
  get cellCss() { return this.s / this.dpr; }

  draw(g) {
    const c = this.ctx, s = this.s, W = this.cv.width, H = this.cv.height;
    c.fillStyle = TH.bg; c.fillRect(0, 0, W, H);
    const nowT = performance.now(), sx = g.bursts && g.bursts.length ? shakeX(g.bursts, nowT, s) : 0;
    c.save(); if (sx) c.translate(sx, 0);
    this.drawFrame(c, s, W, H);
    // Roma mekân arka planı (ızgaranın arkasında; seviye geçişinde çapraz solma)
    {
      const f = levelFade(), bw = COLS * s, bh = ROWS * s;
      const get = (lv) => (this.bdrop[lv] || (this.bdrop[lv] = makeBackdrop(lv, bw, bh)));
      c.save(); c.beginPath(); c.rect(this.bx, this.by, bw, bh); c.clip();
      if (f.e < 1 && f.a !== f.b) { c.globalAlpha = 1 - f.e; c.drawImage(get(f.a), this.bx, this.by); }
      c.globalAlpha = f.a !== f.b ? f.e : 1; c.drawImage(get(f.b), this.bx, this.by);
      c.restore();
    }
    // ızgara
    c.strokeStyle = TH.grid; c.lineWidth = 1; c.beginPath();
    for (let x = 0; x <= COLS; x++) { c.moveTo(this.bx + x * s + 0.5, this.by); c.lineTo(this.bx + x * s + 0.5, this.by + ROWS * s); }
    for (let y = 0; y <= ROWS; y++) { c.moveTo(this.bx, this.by + y * s + 0.5); c.lineTo(this.bx + COLS * s, this.by + y * s + 0.5); }
    c.stroke();
    // kilitli hücreler
    for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) {
      const cell = g.board.grid[r][q];
      if (cell) this.drawCell(c, g.board, cell, q, r);
    }
    // hayalet + aktif parça
    const p = g.piece;
    if (p) {
      const sz = sizeOf(p.type, p.rot);
      if (g.ghostY > p.y) {
        c.strokeStyle = 'rgba(243,235,211,0.28)'; c.lineWidth = Math.max(1, s * 0.06);
        c.strokeRect(this.bx + p.x * s + 1, this.by + g.ghostY * s + 1, sz.w * s - 2, sz.h * s - 2);
      }
      const sp = getSprite(p.type, p.rot, p.golden, s);
      if (p.golden) goldFx(c, sp, this.bx + p.x * s, this.by + p.y * s, cellsOf(p.type, p.rot), s, performance.now() / 1000, 0.35);
      else c.drawImage(sp, this.bx + p.x * s, this.by + p.y * s);
    }
    // altın parça etkisini gösterince: kilit hücrelerinde kısa altın sönme
    this.flashAge = g.flash ? performance.now() - g.flash.t0 : Infinity;
    this.flashId = g.flash ? g.flash.id : 0;
    if (g.bursts && g.bursts.length) this.drawBursts(c, g.bursts);
    // Terazi: yavaşlama süresince sakin ışıma; bitince 0.5 sn'de söner
    const dtc = this.calmT ? Math.min(100, nowT - this.calmT) : 0; this.calmT = nowT;
    this.calm = Math.max(0, Math.min(1, this.calm + (g.slow ? dtc : -dtc) / 500));
    drawCalm(c, { bx: this.bx, by: this.by, cols: COLS, rows: ROWS, s }, this.calm, nowT / 1000);
    c.restore();
  }

  // Satır silme / altın etki ışığı: ortak ışık şeridi + parçaya özgü imza (fx.js)
  drawBursts(c, list) {
    const now = performance.now(), geo = { bx: this.bx, by: this.by, cols: COLS, rows: ROWS, s: this.s };
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i], age = now - b.t0;
      if (age >= BURST_MS) { list.splice(i, 1); continue; }
      drawBurst(c, b, geo, age);
    }
  }

  drawCell(c, board, cell, q, r) {
    const s = this.s, x = this.bx + q * s, y = this.by + r * s;
    if (cell.type === 'plain') {
      c.fillStyle = C.marble; c.fillRect(x, y, s, s);
      c.strokeStyle = C.marbleD; c.lineWidth = Math.max(1, s * 0.06); c.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      c.beginPath(); c.moveTo(x + s * 0.2, y + s * 0.7); c.lineTo(x + s * 0.5, y + s * 0.45); c.lineTo(x + s * 0.8, y + s * 0.3); c.stroke();
      return;
    }
    c.drawImage(getSprite(cell.type, cell.rot, cell.golden, s), cell.lx * s, cell.ly * s, s, s, x, y, s, s);
    if (cell.id === this.flashId && this.flashAge < FLASH_MS) {
      c.fillStyle = 'rgba(255,214,102,' + (0.65 * (1 - this.flashAge / FLASH_MS)).toFixed(3) + ')'; c.fillRect(x, y, s, s);
    }
    // kopmuş kenarlar
    for (let d = 0; d < 4; d++) {
      const [dx, dy] = DIRS[d];
      if (!hasCell(cell.type, cell.rot, cell.lx + dx, cell.ly + dy)) continue;
      const nr = r + dy, nq = q + dx;
      const n = nr >= 0 && nr < ROWS && nq >= 0 && nq < COLS ? board.grid[nr][nq] : null;
      if (n && n.id === cell.id) continue;
      this.jag(c, x, y, s, d);
    }
  }

  jag(c, x, y, s, d) {
    const sides = [[0, 0, 1, 0, 0, 1], [1, 0, 0, 1, -1, 0], [0, 1, 1, 0, 0, -1], [0, 0, 0, 1, 1, 0]];
    const [sx, sy, ux, uy, nx, ny] = sides[d];
    c.strokeStyle = '#10162C'; c.lineWidth = Math.max(1.5, s * 0.08);
    c.beginPath();
    for (let i = 0; i <= 5; i++) {
      const t = (i / 5) * s, off = i % 2 ? s * 0.12 : 0;
      const px = x + sx * s + ux * t + nx * off, py = y + sy * s + uy * t + ny * off;
      if (i) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.stroke();
  }

  drawFrame(c, s, W, H) {
    const colH = H - this.by - BOTTOM * s;
    // alınlık
    c.fillStyle = TH.f;
    c.beginPath(); c.moveTo(0, 1.25 * s); c.lineTo(W / 2, 0.05 * s); c.lineTo(W, 1.25 * s); c.closePath(); c.fill();
    c.fillStyle = TH.bg;
    c.beginPath(); c.moveTo(0.9 * s, 1.15 * s); c.lineTo(W / 2, 0.38 * s); c.lineTo(W - 0.9 * s, 1.15 * s); c.closePath(); c.fill();
    c.fillStyle = TH.fD; c.fillRect(0, 1.25 * s, W, 0.45 * s);
    c.fillStyle = TH.f; c.fillRect(0, 1.25 * s, W, 0.14 * s);
    if (TH.band) { c.fillStyle = TH.band; c.fillRect(0, 1.62 * s, W, 0.06 * s); }
    c.fillStyle = C.gold; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    { // alınlık yazısı: üçgene sığacak şekilde boyutlanır
      const txt = 'L E X   S T A C K'; let fs = Math.round(s * 0.56);
      c.font = 'bold ' + fs + 'px Georgia, serif';
      const maxW = W * 0.46; const w = c.measureText(txt).width;
      if (w > maxW) { fs = Math.floor(fs * maxW / w); c.font = 'bold ' + fs + 'px Georgia, serif'; }
      c.fillText(txt, W / 2, 1.08 * s);
    }
    // sütunlar
    for (const cx of [0, W - COLW * s]) {
      c.fillStyle = TH.f; c.fillRect(cx + 0.15 * s, this.by, 0.7 * s, colH);
      c.strokeStyle = TH.fD; c.lineWidth = Math.max(1, s * 0.05);
      for (const f of [0.35, 0.5, 0.65]) { c.beginPath(); c.moveTo(cx + f * s, this.by + 0.3 * s); c.lineTo(cx + f * s, this.by + colH - 0.1 * s); c.stroke(); }
      c.fillStyle = TH.f; c.fillRect(cx + 0.03 * s, this.by, 0.94 * s, 0.25 * s);
      c.fillStyle = TH.fD; c.fillRect(cx + 0.03 * s, this.by + 0.22 * s, 0.94 * s, 0.05 * s);
      c.fillStyle = TH.f; c.fillRect(cx + 0.05 * s, this.by + colH - 0.2 * s, 0.9 * s, 0.2 * s);
      if (TH.band) { c.fillStyle = TH.band; c.fillRect(cx + 0.03 * s, this.by + 0.25 * s, 0.94 * s, 0.07 * s); c.fillRect(cx + 0.05 * s, this.by + colH - 0.27 * s, 0.9 * s, 0.07 * s); }
    }
    // kaide
    c.fillStyle = TH.fD; c.fillRect(0, this.by + colH, W, BOTTOM * s);
    c.fillStyle = TH.f; c.fillRect(0, this.by + colH, W, 0.14 * s);
    c.fillStyle = C.goldD; c.fillRect(this.bx, this.by - 0.05 * s, COLS * s, 0.05 * s);
  }

  drawPreview(cv, piece) {
    const c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    if (!piece) return;
    const sz = sizeOf(piece.type, 0);
    const s = Math.max(2, Math.floor(Math.min(cv.width / sz.w, cv.height / sz.h, cv.width / 3.4) * (piece.golden ? 0.8 : 0.94)));
    const img = getSprite(piece.type, 0, piece.golden, s);
    const ox = Math.round((cv.width - sz.w * s) / 2), oy = Math.round((cv.height - sz.h * s) / 2);
    if (piece.golden) goldFx(c, img, ox, oy, cellsOf(piece.type, 0), s, performance.now() / 1000, 0.3);
    else c.drawImage(img, ox, oy);
  }
}
