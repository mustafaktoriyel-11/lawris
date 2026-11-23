// Lawris - çizim
import { COLS, ROWS } from './board.js';
import { THEME as TH } from './theme.js';
import { getSprite, hasCell, sizeOf, COLORS as C } from './pieces.js';

const TOP = 1.7;     // alınlık yüksekliği (hücre)
const BOTTOM = 0.5;  // kaide
const COLW = 1;      // sütun genişliği (hücre)
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export class Renderer {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.s = 20; this.dpr = 1;
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
  }
  get cellCss() { return this.s / this.dpr; }

  draw(g) {
    const c = this.ctx, s = this.s, W = this.cv.width, H = this.cv.height;
    c.fillStyle = TH.bg; c.fillRect(0, 0, W, H);
    this.drawFrame(c, s, W, H);
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
      c.drawImage(getSprite(p.type, p.rot, p.golden, s), this.bx + p.x * s, this.by + p.y * s);
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
    c.fillStyle = C.gold; c.font = 'bold ' + Math.round(s * 0.62) + 'px Georgia, serif';
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText('L A W R I S', W / 2, 1.08 * s);
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
    const s = Math.floor(Math.min(cv.width, cv.height) / 5.4);
    const sz = sizeOf(piece.type, 0), img = getSprite(piece.type, 0, piece.golden, s);
    c.drawImage(img, Math.round((cv.width - sz.w * s) / 2), Math.round((cv.height - sz.h * s) / 2));
  }
}
