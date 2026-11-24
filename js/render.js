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
const PERSIST = 0.55;       // renkli sürümün kalıcı opaklığı (açığa çıkan bölgede)
const FEATHER = 1.2;       // kalıcı bölgenin üst kenar yumuşatması (hücre)
const SWEEP_MS = 1150, SHIM_MS = 700, BAND_FEATHER = 1.5;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
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
    this.prog = {}; this.progT = {}; this.flashes = []; this.lastT = 0;   // Roma'yı yeniden inşa: seviye başına gösterilen/hedef ilerleme (0..8 satır)
  }

  // Seviye içi ilerleme (0..8 satır): renkli sürüm aşağıdan yukarı açılır
  setProgress(lv, n, instant) {
    this.progT[lv] = Math.max(0, Math.min(8, n));
    if (instant || REDUCED.matches || this.prog[lv] === undefined) this.prog[lv] = this.progT[lv];
  }
  // Satır silme: temizlenen satır bandında altın ışık süpürmesi (row0..row1 dahil, tahta satır indeksi)
  flashRows(row0, row1) {
    if (REDUCED.matches) return;
    // Kullanıcı isteği: ışık bütün tahtadan geçer, yapı tümüyle renkli görünür (silinen satır sayısı kadar biraz daha uzun)
    const n = Math.abs(row1 - row0) + 1;
    this.flashes.push({ lv: levelFade().b, y0: 0, y1: ROWS - 1, fe: 0, dur: SWEEP_MS + 120 * Math.min(3, n - 1), t0: performance.now(), amp: 1.0 });
    if (this.flashes.length > 6) this.flashes.shift();
  }
  // Seviye tamamlanınca kısa tüm-sahne parıltısı
  shimmer() {
    if (REDUCED.matches) return;
    this.flashes.push({ lv: levelFade().b, y0: 0, y1: ROWS - 1, fe: 0, dur: SHIM_MS, t0: performance.now(), amp: 0.8, shim: true });
  }
  resetReveal() { this.prog = {}; this.progT = {}; this.flashes.length = 0; }

  _canvases(bw, bh) {
    if (!this.mask || this.mask.width !== bw || this.mask.height !== bh) {
      const mk = () => { const cv = document.createElement('canvas'); cv.width = bw; cv.height = bh; return cv; };
      this.mask = mk(); this.band = mk(); this.mctx = this.mask.getContext('2d'); this.bctx = this.band.getContext('2d'); this.comp = {};
    }
  }
  // Bir seviyenin arka planı: sönük sürüm + aşağıdan yukarı açılan / ışık süpürmesiyle açılan renkli sürüm
  paintLevel(c, lv, alpha, now) {
    const s = this.s, bw = COLS * s, bh = ROWS * s;
    const mut = this.bdrop[lv] || (this.bdrop[lv] = makeBackdrop(lv, bw, bh, false));
    c.globalAlpha = alpha; c.drawImage(mut, this.bx, this.by); c.globalAlpha = 1;
    const p = (this.prog[lv] || 0) / 8, fl = this.flashes.filter((f) => f.lv === lv);
    if (p <= 0.002 && !fl.length) return;
    this._canvases(bw, bh);
    const key = bw + 'x' + bh + '|' + p.toFixed(4);
    let ent = this.comp[lv];
    if (!ent) ent = this.comp[lv] = { cv: Object.assign(document.createElement('canvas'), { width: bw, height: bh }), key: '' };
    const streaks = [];
    if (fl.length || ent.key !== key) {
      const col = this.bdrop[lv + 'c'] || (this.bdrop[lv + 'c'] = makeBackdrop(lv, bw, bh, true));
      const m = this.mctx; m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.clearRect(0, 0, bw, bh);
      if (p > 0.002) {   // kalıcı bölge: alt p kadarı, yumuşak üst kenar
        const yTop = bh * (1 - p), fh = FEATHER * s, g = m.createLinearGradient(0, yTop - fh / 2, 0, yTop + fh / 2);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + PERSIST + ')');
        m.fillStyle = g; m.fillRect(0, Math.max(0, yTop - fh / 2), bw, bh);
      }
      m.globalCompositeOperation = 'lighter';
      const t = this.bctx;
      for (const f of fl) {
        const k = (now - f.t0) / f.dur; if (k < 0 || k >= 1) continue;
        const fe = f.fe * s, y0 = f.y0 * s - fe, y1 = (f.y1 + 1) * s + fe, hf = 1.6 * s; const tt = now - f.t0, sweepK = f.shim ? k : Math.min(1, tt / 520), front = easeOut(sweepK) * (bw + hf * 1.5);
        // tam renk: ~120ms yumuşak giriş, ~350ms tam opak bekleme, sonra yumuşak çıkış
        const env = f.shim ? (k < 0.45 ? 1 : 1 - smooth((k - 0.45) / 0.55)) : Math.min(smooth(tt / 120), 1 - smooth((tt - 470) / Math.max(1, f.dur - 470)));
        const shape = () => {   // dikey bant (yumuşak üst/alt)
          t.globalCompositeOperation = 'source-over'; t.globalAlpha = 1; t.clearRect(0, 0, bw, bh);
          if (fe > 0) { const g = t.createLinearGradient(0, y0, 0, y1), q = fe / (y1 - y0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(q, '#000'); g.addColorStop(1 - q, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); t.fillStyle = g; } else t.fillStyle = '#000';
          t.fillRect(0, y0, bw, y1 - y0);
          t.globalCompositeOperation = 'destination-in';
        };
        shape();   // 0..front arası açığa çıkar (ön kenar yumuşak)
        { const g = t.createLinearGradient(front - hf, 0, front, 0); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); t.fillStyle = g; t.fillRect(0, 0, bw, bh); }
        m.globalAlpha = f.amp * env; m.drawImage(this.band, 0, 0);
        streaks.push([f, k, front, hf, shape]);
      }
      m.globalAlpha = 1; m.globalCompositeOperation = 'source-over';
      const cc = ent.cv.getContext('2d');
      cc.globalCompositeOperation = 'source-over'; cc.clearRect(0, 0, bw, bh); cc.drawImage(col, 0, 0);
      cc.globalCompositeOperation = 'destination-in'; cc.drawImage(this.mask, 0, 0); cc.globalCompositeOperation = 'source-over';
      ent.key = fl.length ? '' : key;
    }
    c.globalAlpha = alpha; c.drawImage(ent.cv, this.bx, this.by);
    // altın ışık şeridi (ön kenarda) ve seviye parıltısında hafif altın örtü
    if (streaks.length) {
      const t = this.bctx;
      for (const [f, k, front, hf, shape] of streaks) {
        shape();
        const g = t.createLinearGradient(front - 0.7 * s, 0, front + 0.25 * s, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.8, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); t.fillStyle = g; t.fillRect(0, 0, bw, bh);
        t.globalCompositeOperation = 'source-in'; t.fillStyle = 'rgb(255,214,108)'; t.fillRect(0, 0, bw, bh);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * 0.4; c.drawImage(this.band, this.bx, this.by); c.globalCompositeOperation = 'source-over';
        if (f.shim) { c.globalAlpha = alpha * 0.14 * Math.sin(Math.PI * k); c.fillStyle = '#FFE6A0'; c.fillRect(this.bx, this.by, bw, bh); }
      }
    }
    c.globalAlpha = 1;
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
    this.bdrop = {}; this.comp = {}; this.mask = null;   // arka plan önbelleği (seviye başına), boyut değişince yeniden kurulur
  }
  get cellCss() { return this.s / this.dpr; }

  draw(g) {
    const c = this.ctx, s = this.s, W = this.cv.width, H = this.cv.height;
    c.fillStyle = TH.bg; c.fillRect(0, 0, W, H);
    const nowT = performance.now(), sx = g.bursts && g.bursts.length ? shakeX(g.bursts, nowT, s) : 0;
    c.save(); if (sx) c.translate(sx, 0);
    this.drawFrame(c, s, W, H);
    // Roma mekân arka planı (ızgaranın arkasında; seviye geçişinde çapraz solma; renkli sürüm ilerlemeye göre açılır)
    {
      const f = levelFade(), bw = COLS * s, bh = ROWS * s, dt = this.lastT ? Math.min(100, nowT - this.lastT) : 0; this.lastT = nowT;
      for (const k in this.progT) {   // gösterilen ilerleme hedefe yumuşakça yaklaşır
        const d = this.progT[k] - (this.prog[k] || 0);
        this.prog[k] = Math.abs(d) < 0.004 ? this.progT[k] : (this.prog[k] || 0) + d * (1 - Math.exp(-dt / 260));
      }
      for (let i = this.flashes.length - 1; i >= 0; i--) if (nowT - this.flashes[i].t0 >= this.flashes[i].dur) this.flashes.splice(i, 1);
      c.save(); c.beginPath(); c.rect(this.bx, this.by, bw, bh); c.clip();
      if (f.e < 1 && f.a !== f.b) this.paintLevel(c, f.a, 1 - f.e, nowT);
      this.paintLevel(c, f.b, f.a !== f.b ? f.e : 1, nowT);
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
