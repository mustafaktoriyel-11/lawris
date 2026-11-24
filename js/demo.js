// Lawris - rehber "Altın parçalar" kartındaki canlı mini gösterim (7x6 tahta, 7 altın parça döngüsü)
import { cellsOf, sizeOf, getSprite, COLORS as C } from './pieces.js';
import { THEME as TH } from './theme.js';
import { goldFx } from './render.js';
import { drawBurst, BURST_MS, shakeX, drawCalm } from './fx.js';

const COLS = 7, ROWS = 6, CELL = 18, SCENE_MS = 2700, DROP_MS = 520, FX_AT = 600;
const ORDER = ['sutun', 'tokmak', 'kanun', 'terazi', 'paragraf', 'kilic', 'kalem'];
const COL = { g: '#2F5D50', r: '#7A1F2B', w: '#7A4E2D', s: '#5F6B80' };
// rot: parça dönüşü; x,y: iniş konumu (sol-üst); st: önceden kurulmuş yığın
const SCENES = {
  sutun: { rot: 1, x: 1, y: 2, st: ['.......', '.......', '.......', '.s...s.', 'gs...sg', 'gs.r.sg'] },
  tokmak: { rot: 0, x: 2, y: 3, st: ['.......', '.......', 'ww.....', 'ss...ss', 'ggg.ggg', 'rrr.rrr'] },
  kanun: { rot: 0, x: 2, y: 3, st: ['.......', '.......', '.......', '.......', 'g.....w', 'ggrr.gg'] },
  terazi: { rot: 0, x: 2, y: 4, st: ['.......', '.......', '.......', '.......', 'g.....w', 'gg...gg'] },
  paragraf: { rot: 0, x: 2, y: 3, st: ['.......', '.......', 'ww.....', 'gg...gg', 'ggr.rgg', 'ggr..gg'] },
  kilic: { rot: 0, x: 2, y: 2, st: ['.......', '.......', '.......', 'ww...ww', 'ggg.ggg', 'rrr.rrr'] },
  kalem: { rot: 0, x: 2, y: 3, st: ['.......', '.......', '.......', '.......', 'g.....w', 'gg.g.gg'] },
};
const PCOL = { sutun: '#E8E4DA', tokmak: '#9A6433', kanun: '#7A1F2B', terazi: '#A9B0BA', paragraf: '#33805F', kilic: '#6C7A94', kalem: '#D9573A' };
const ease2 = (x) => x * x;

const buildGrid = (st) => st.map((row) => [...row].map((ch) => (COL[ch] ? { flat: COL[ch] } : null)));
const removeRows = (grid, rows) => {
  const set = new Set(rows), kept = grid.filter((_, y) => !set.has(y));
  while (kept.length < ROWS) kept.unshift(Array(COLS).fill(null));
  return kept;
};
const plain = () => ({ plain: true });

export function createDemo(canvas, nameEl, textEl) {
  const c = canvas.getContext('2d');
  let s = CELL, raf = 0, active = false, idx = 0, t0 = 0, scene = null, bursts = [], calmT0 = -1e9, popT0 = -1e9, popTxt = '', slowT = 0;
  const geo = () => ({ bx: 0, by: 0, cols: COLS, rows: ROWS, s });

  function size() {
    const d = Math.min(3, window.devicePixelRatio || 1);
    s = Math.max(6, Math.round(CELL * d));
    canvas.width = s * COLS; canvas.height = s * ROWS;
    canvas.style.width = CELL * COLS + 'px'; canvas.style.height = CELL * ROWS + 'px';
  }

  // sahneyi hazırlar; captionEl metinlerini düğmelerden okur
  function begin(i, now) {
    idx = ((i % ORDER.length) + ORDER.length) % ORDER.length;
    const type = ORDER[idx], sc = SCENES[type];
    scene = { type, sc, grid: buildGrid(sc.st), done: false, calm: 0, cells: cellsOf(type, sc.rot), sz: sizeOf(type, sc.rot), phase: 0 };
    bursts = []; calmT0 = popT0 = -1e9; t0 = now;
    const btn = document.querySelector('#rhGold [data-p="' + type + '"]');
    if (btn) {
      nameEl.textContent = btn.dataset.n || type;
      textEl.textContent = btn.dataset.d || '';
    }
    document.querySelectorAll('#rhGold [data-p]').forEach((b) => b.classList.toggle('on', b.dataset.p === type));
  }

  const burst = (o, now) => bursts.push({ ...o, t0: now, gold: true });

  // altın parça kilitlenir ve etkisi uygulanır (oyundaki kuralın sadeleştirilmiş hali)
  function apply(now) {
    const { type, sc, grid, cells } = scene;
    const abs = cells.map(([cx, cy]) => [sc.x + cx, sc.y + cy]);
    cells.forEach(([cx, cy], i) => { const [x, y] = abs[i]; if (y >= 0 && y < ROWS) grid[y][x] = { type, rot: sc.rot, lx: cx, ly: cy }; });
    switch (type) {
      case 'tokmak': {
        const rs = [...new Set(abs.map((a) => a[1]))].filter((y) => y >= 0 && y < ROWS);
        burst({ rows: rs, kind: 'tokmak' }, now); scene.grid = removeRows(grid, rs); break;
      }
      case 'sutun': {
        const cols = new Map();
        for (const [x, y] of abs) cols.set(x, Math.max(cols.get(x) ?? -1, y));
        for (const [x, y] of cols) for (let yy = y + 1; yy < ROWS; yy++) if (!grid[yy][x]) grid[yy][x] = plain();
        burst({ cols: [...cols.keys()], from: Math.min(...cols.values()) + 1, kind: 'sutun' }, now); break;
      }
      case 'kanun': popT0 = now; popTxt = '×2'; break;
      case 'terazi': calmT0 = now; popT0 = now; popTxt = '+250'; break;
      case 'paragraf': {
        const top = grid.findIndex((r) => r.some(Boolean));
        if (top >= 0) { burst({ rows: [top], kind: 'paragraf' }, now); scene.grid = removeRows(grid, [top]); }
        break;
      }
      case 'kilic': {
        const ys = abs.slice(4, 6).map((a) => a[1]), set = new Set(ys), below = Math.max(...ys) + 1;
        if (below < ROWS) set.add(below);
        const rs = [...set].filter((y) => y >= 0 && y < ROWS);
        burst({ rows: rs, kind: 'kilic' }, now); scene.grid = removeRows(grid, rs); break;
      }
      case 'kalem': {
        let best = -1, bc = 0;
        grid.forEach((r, y) => { const n = r.filter(Boolean).length; if (n > 0 && n >= bc) { bc = n; best = y; } });
        if (best >= 0) { for (let x = 0; x < COLS; x++) if (!grid[best][x]) grid[best][x] = plain(); burst({ rows: [best], kind: 'kalem' }, now); scene.inkRow = best; scene.clearAt = now + 520; }
        break;
      }
    }
  }

  function drawCell(cell, x, y) {
    const px = x * s, py = y * s;
    if (cell.plain) {
      c.fillStyle = C.marble; c.fillRect(px, py, s, s);
      c.strokeStyle = C.marbleD; c.lineWidth = Math.max(1, s * 0.06); c.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
      c.beginPath(); c.moveTo(px + s * 0.2, py + s * 0.7); c.lineTo(px + s * 0.5, py + s * 0.45); c.lineTo(px + s * 0.8, py + s * 0.3); c.stroke();
    } else if (cell.flat) {
      c.fillStyle = cell.flat; c.fillRect(px, py, s, s);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(px, py, s, Math.max(1, s * 0.12));
      c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = Math.max(1, s * 0.06); c.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
    } else {
      c.drawImage(getSprite(cell.type, cell.rot, false, s), cell.lx * s, cell.ly * s, s, s, px, py, s, s);
    }
  }

  function frame(t) {
    raf = 0;
    if (!active) return;
    if (!scene) begin(idx, t);
    let el = t - t0;
    if (el >= SCENE_MS) { begin(idx + 1, t); el = 0; }
    const sh = shakeX(bursts, t, s);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = TH.bg; c.fillRect(0, 0, canvas.width, canvas.height);
    c.save(); if (sh) c.translate(sh, 0);
    c.strokeStyle = TH.grid; c.lineWidth = 1; c.beginPath();
    for (let x = 0; x <= COLS; x++) { c.moveTo(x * s + 0.5, 0); c.lineTo(x * s + 0.5, ROWS * s); }
    for (let y = 0; y <= ROWS; y++) { c.moveTo(0, y * s + 0.5); c.lineTo(COLS * s, y * s + 0.5); }
    c.stroke();
    if (!scene.done && el >= FX_AT) { scene.done = true; apply(t); }
    if (scene.clearAt && t >= scene.clearAt) { scene.grid = removeRows(scene.grid, [scene.inkRow]); burst({ rows: [scene.inkRow] }, t); scene.clearAt = 0; bursts[bursts.length - 1].gold = false; }
    scene.grid.forEach((row, y) => row.forEach((cell, x) => { if (cell) drawCell(cell, x, y); }));
    // düşen altın parça
    if (!scene.done) {
      const { type, sc, sz, cells } = scene, p = Math.min(1, el / DROP_MS), top = -sz.h, y = top + (sc.y - top) * ease2(p);
      const sp = getSprite(type, sc.rot, true, s);
      goldFx(c, sp, sc.x * s, y * s, cells, s, t / 1000, 0.35);
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const age = t - bursts[i].t0;
      if (age >= BURST_MS) { bursts.splice(i, 1); continue; }
      drawBurst(c, bursts[i], geo(), age);
    }
    // terazi: sakin ışıma 1.6 sn, 0.5 sn sönme
    const ca = t - calmT0;
    if (ca >= 0 && ca < 2100) drawCalm(c, geo(), Math.min(1, ca / 200, (2100 - ca) / 500), t / 1000);
    // rozet: x2 / +250 pop
    const pa = t - popT0;
    if (pa >= 0 && pa < 1000) {
      const q = pa / 1000, sc2 = q < 0.25 ? 0.6 + 0.55 * (q / 0.25) : q < 0.45 ? 1.15 - 0.15 * ((q - 0.25) / 0.2) : 1;
      c.save(); c.globalAlpha = q < 0.55 ? 1 : 1 - (q - 0.55) / 0.45;
      c.translate(COLS * s / 2, ROWS * s * 0.36 - (scene.type === 'terazi' ? q * s : 0)); c.scale(sc2, sc2);
      c.font = 'bold ' + Math.round(s * 1.7) + 'px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = Math.max(2, s * 0.14); c.strokeStyle = 'rgba(30,12,4,0.85)'; c.strokeText(popTxt, 0, 0);
      c.fillStyle = '#F2C94C'; c.fillText(popTxt, 0, 0);
      c.restore();
    }
    c.restore();
    // sahne sonunda kısa sönme
    if (el > SCENE_MS - 250) { c.fillStyle = `rgba(20,8,12,${((el - (SCENE_MS - 250)) / 250 * 0.85).toFixed(3)})`; c.fillRect(0, 0, canvas.width, canvas.height); }
    raf = requestAnimationFrame(frame);
  }

  let want = false;
  function refresh() {
    const on = want && !document.hidden;
    if (on === active) return;
    active = on;
    if (on) { size(); scene = null; raf = requestAnimationFrame(frame); }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  const setActive = (on) => { want = !!on; refresh(); };
  document.addEventListener('visibilitychange', refresh);
  function goto(type) { const i = ORDER.indexOf(type); if (i < 0) return; idx = i; scene = null; }
  return { setActive, goto, resize() { if (active) size(); }, get active() { return active; } };
}
