// Lawris - altın etkilerin parçaya özgü imzaları (render.js ve rehber demosu ortak kullanır)
// g = { bx, by, cols, rows, s }: tahta sol-üst köşesi, sütun/satır sayısı, hücre boyutu (px)
const REDUCED = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
export const BURST_MS = 650;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const outQ = (p) => 1 - Math.pow(1 - p, 2.2);

function clipBoard(c, g) { c.beginPath(); c.rect(g.bx, g.by, g.cols * g.s, g.rows * g.s); c.clip(); }

// Tokmak: satır ortasından iki yana yayılan altın yaylar
function sigTokmak(c, b, g, age) {
  const s = g.s, W = g.cols * s, cx = g.bx + W / 2, p = clamp01(age / 480), e = outQ(p), fade = 1 - p;
  c.save(); clipBoard(c, g);
  c.lineCap = 'round'; c.shadowColor = 'rgba(255,214,110,0.9)'; c.shadowBlur = s * 0.5;
  for (const y of b.rows) {
    const cy = g.by + (y + 0.5) * s;
    for (const [m, al] of [[1, 1], [0.7, 0.55]]) {
      const r = Math.max(0.5, e * W * 0.5 * m);
      c.strokeStyle = `rgba(255,238,175,${(al * fade).toFixed(3)})`;
      c.lineWidth = Math.max(1.5, s * 0.16 * fade + 1);
      c.beginPath(); c.ellipse(cx, cy, r, s * 0.62, 0, -1.1, 1.1); c.stroke();
      c.beginPath(); c.ellipse(cx, cy, r, s * 0.62, 0, Math.PI - 1.1, Math.PI + 1.1); c.stroke();
    }
  }
  c.restore();
}

// Kılıç: sol-üstten sağ-alta keskin çapraz iz
function sigKilic(c, b, g, age) {
  if (!b.rows.length) return;
  const s = g.s, W = g.cols * s, y0 = g.by + Math.min(...b.rows) * s, y1 = g.by + (Math.max(...b.rows) + 1) * s;
  const ax = g.bx - 0.3 * s, ay = y0 - 0.4 * s, dx = W + 0.6 * s, dy = y1 - y0 + 0.8 * s;
  const head = outQ(clamp01(age / 250)), tail = outQ(clamp01((age - 80) / 270));
  const al = age < 250 ? 1 : clamp01(1 - (age - 250) / 200);
  if (head <= tail || al <= 0) return;
  const x1 = ax + dx * tail, y1t = ay + dy * tail, x2 = ax + dx * head, y2 = ay + dy * head;
  c.save(); clipBoard(c, g); c.lineCap = 'round';
  const gr = c.createLinearGradient(x1, y1t, x2, y2);
  gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(1, `rgba(255,246,214,${al.toFixed(3)})`);
  c.strokeStyle = gr; c.lineWidth = s * 0.34; c.globalAlpha = 0.35;
  c.beginPath(); c.moveTo(x1, y1t); c.lineTo(x2, y2); c.stroke();
  c.globalAlpha = 1; c.shadowColor = `rgba(255,222,130,${al.toFixed(3)})`; c.shadowBlur = s * 0.6;
  c.lineWidth = Math.max(1.5, s * 0.09);
  c.beginPath(); c.moveTo(x1, y1t); c.lineTo(x2, y2); c.stroke();
  c.restore();
}

// Kalem: satır boyunca soldan sağa çizilen mürekkep imza
function sigKalem(c, b, g, age) {
  if (!b.rows.length) return;
  const s = g.s, y = b.rows[0], cy = g.by + (y + 0.5) * s, L = (g.cols - 0.8) * s, x0 = g.bx + 0.4 * s;
  const reveal = clamp01(age / 450), al = age < 450 ? 1 : clamp01(1 - (age - 450) / 200);
  if (al <= 0) return;
  const loops = Math.max(3, Math.round(g.cols * 0.55)), ax = (L * 1.15) / (2 * Math.PI * loops);
  const pts = [], N = 120, M = Math.max(2, Math.floor(N * reveal));
  for (let i = 0; i <= M; i++) {
    const u = i / N, ph = 2 * Math.PI * loops * u, ay = s * 0.3 * (0.75 + 0.25 * Math.sin(u * 9));
    pts.push([x0 + u * L + ax * Math.sin(ph), cy - ay * Math.cos(ph) + s * 0.05 * Math.sin(u * 5)]);
  }
  c.save(); clipBoard(c, g);
  c.fillStyle = `rgba(250,236,200,${(0.42 * al).toFixed(3)})`; c.fillRect(g.bx, g.by + y * s + s * 0.1, g.cols * s, s * 0.8);
  c.globalAlpha = al; c.lineCap = 'round'; c.lineJoin = 'round';
  const path = () => {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    const q = pts[pts.length - 1]; c.lineTo(q[0], q[1]); c.stroke();
  };
  c.strokeStyle = '#d9b24a'; c.lineWidth = Math.max(2.5, s * 0.2); path();
  c.strokeStyle = '#1b1410'; c.lineWidth = Math.max(1.4, s * 0.1); path();
  c.restore();
}

// Paragraf: satırın üstünde yükselip sönen büyük "§"
function sigParagraf(c, b, g, age) {
  if (!b.rows.length) return;
  const s = g.s, p = clamp01(age / BURST_MS), cx = g.bx + g.cols * s / 2, cy = g.by + (b.rows[0] + 0.5) * s - p * s;
  c.save();
  c.globalAlpha = 0.6 * (1 - p); c.fillStyle = '#E3B93C'; c.shadowColor = 'rgba(255,214,110,0.8)'; c.shadowBlur = s * 0.4;
  c.font = 'bold ' + Math.round(s * 2.2) + 'px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('§', cx, cy);
  c.restore();
}

// Sütun: alttan yukarı yükselen mermer ışığı
function sigSutun(c, b, g, age) {
  const s = g.s, y0 = g.by + (b.from || 0) * s, y1 = g.by + g.rows * s;
  const e = outQ(clamp01(age / 500)), al = age < 400 ? 1 : clamp01(1 - (age - 400) / 250);
  if (al <= 0 || y1 <= y0) return;
  const yc = y1 - e * (y1 - y0), hh = s * 1.5;
  const gr = c.createLinearGradient(0, yc - hh, 0, yc + hh);
  gr.addColorStop(0, 'rgba(255,236,170,0)'); gr.addColorStop(0.5, `rgba(255,248,226,${(0.9 * al).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,224,140,0)');
  c.save();
  for (const x of b.cols) {
    const xx = g.bx + x * s;
    c.beginPath(); c.rect(xx, y0, s, y1 - y0); c.clip();
    c.fillStyle = `rgba(255,226,150,${(0.16 * al).toFixed(3)})`; c.fillRect(xx, yc, s, y1 - yc);
    c.fillStyle = gr; c.fillRect(xx, yc - hh, s, 2 * hh);
    c.restore(); c.save();
  }
  c.restore();
}

const SIG = { tokmak: sigTokmak, kilic: sigKilic, kalem: sigKalem, paragraf: sigParagraf, sutun: sigSutun };

// Ortak ışık şeridi + (hareket azaltılmamışsa) parçaya özgü imza
export function drawBurst(c, b, g, age) {
  const s = g.s, a = age / BURST_MS, k = 1 - a, col = b.gold ? '255,214,110' : '255,244,214';
  const red = REDUCED.matches, sig = b.kind && SIG[b.kind];
  c.save();
  if (b.rows) for (const y of b.rows) {
    const yy = g.by + y * s, gr = c.createLinearGradient(0, yy, 0, yy + s);
    gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.5, `rgba(${col},${0.85 * k})`); gr.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = gr; c.fillRect(g.bx, yy - s * 0.3 * a, g.cols * s, s * (1 + 0.6 * a));
  }
  if (b.cols && (red || b.kind !== 'sutun')) for (const x of b.cols) {
    const xx = g.bx + x * s, y0 = g.by + (b.from || 0) * s, gr = c.createLinearGradient(xx, 0, xx + s, 0);
    gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.5, `rgba(${col},${0.75 * k})`); gr.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = gr; c.fillRect(xx, y0, s, g.by + g.rows * s - y0);
  }
  c.restore();
  if (!red && sig) { c.save(); sig(c, b, g, age); c.restore(); }
}

// Tokmak çarpma sarsıntısı: yatay ofset (px)
export function shakeX(list, now, s) {
  if (REDUCED.matches) return 0;
  let x = 0;
  for (const b of list) {
    if (b.kind !== 'tokmak') continue;
    const age = now - b.t0;
    if (age >= 0 && age < 250) x += Math.sin((age / 250) * Math.PI * 2 * 3.5) * 0.06 * s * (1 - age / 250);
  }
  return x;
}

// Terazi: yavaşlama sürerken tahta kenarlarında sakin serin-altın ışıma (amt 0..1)
export function drawCalm(c, g, amt, tSec) {
  if (amt <= 0.003 || REDUCED.matches) return;
  const s = g.s, W = g.cols * s, H = g.rows * s, d = s * 1.2;
  const a = (0.12 * amt * (0.8 + 0.2 * Math.sin((tSec * Math.PI * 2) / 3.6))).toFixed(4);
  const edge = (x0, y0, x1, y1, rx, ry, rw, rh) => {
    const gr = c.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, `rgba(238,214,140,${a})`); gr.addColorStop(1, 'rgba(238,214,140,0)');
    c.fillStyle = gr; c.fillRect(rx, ry, rw, rh);
  };
  c.save(); clipBoard(c, g);
  edge(g.bx, 0, g.bx + d, 0, g.bx, g.by, d, H);
  edge(g.bx + W, 0, g.bx + W - d, 0, g.bx + W - d, g.by, d, H);
  edge(0, g.by, 0, g.by + d, g.bx, g.by, W, d);
  edge(0, g.by + H, 0, g.by + H - d, g.bx, g.by + H - d, W, d);
  c.restore();
}
