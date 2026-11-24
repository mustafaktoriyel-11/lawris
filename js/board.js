// Lex Stack - tahta modeli
import { cellsOf } from './pieces.js';

export const COLS = 11;
export const ROWS = 18;
let uid = 1;
export const nextId = () => uid++;

export class Board {
  constructor() { this.reset(); }
  reset() { this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }

  collides(p, x = p.x, y = p.y, rot = p.rot) {
    for (const [cx, cy] of cellsOf(p.type, rot)) {
      const bx = x + cx, by = y + cy;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && this.grid[by][bx]) return true;
    }
    return false;
  }

  // parçayı kilitler; yerleştirilen hücrelerin [x,y] listesini döndürür
  lock(p) {
    const placed = [];
    for (const [cx, cy] of cellsOf(p.type, p.rot)) {
      const x = p.x + cx, y = p.y + cy;
      this.grid[y][x] = { type: p.type, golden: p.golden, rot: p.rot, lx: cx, ly: cy, id: p.id };
      placed.push([x, y]);
    }
    return placed;
  }

  fullRows() {
    const r = [];
    for (let y = 0; y < ROWS; y++) if (this.grid[y].every(Boolean)) r.push(y);
    return r;
  }

  removeRows(list) {
    if (!list.length) return 0;
    const set = new Set(list);
    const kept = this.grid.filter((_, y) => !set.has(y));
    while (kept.length < ROWS) kept.unshift(Array(COLS).fill(null));
    this.grid = kept;
    return list.length;
  }

  // x sütunundaki tüm hücreleri boşaltır
  clearColumn(x) {
    for (let y = 0; y < ROWS; y++) this.grid[y][x] = null;
  }

  topRow() {
    for (let y = 0; y < ROWS; y++) if (this.grid[y].some(Boolean)) return y;
    return -1;
  }

  // x sütununda fromY'den aşağıdaki boş hücreleri düz mermerle doldurur
  fillPlain(x, fromY) {
    const id = nextId();
    for (let y = fromY; y < ROWS; y++) {
      if (!this.grid[y][x]) this.grid[y][x] = { type: 'plain', golden: false, rot: 0, lx: 0, ly: 0, id };
    }
  }

  // y satırındaki boş hücreleri düz mermerle doldurur
  fillRowPlain(y) {
    const id = nextId();
    for (let x = 0; x < COLS; x++) {
      if (!this.grid[y][x]) this.grid[y][x] = { type: 'plain', golden: false, rot: 0, lx: 0, ly: 0, id };
    }
  }

  // en dolu satır (eşitlikte en alttaki); boş tahtada -1
  fullestRow() {
    let best = -1, bc = 0;
    for (let y = 0; y < ROWS; y++) {
      const n = this.grid[y].filter(Boolean).length;
      if (n > 0 && n >= bc) { bc = n; best = y; }
    }
    return best;
  }
}
