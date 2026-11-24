// Lawris - altın etkilerin parçaya özgü imzaları (render.js ve rehber demosu ortak kullanır)
// g = { bx, by, cols, rows, s }: tahta sol-üst köşesi, sütun/satır sayısı, hücre boyutu (px)
const REDUCED = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
export const BURST_MS = 800;      // en uzun etki ömrü (kalem imzası); ışık şeridi STRIP_MS sürer
const STRIP_MS = 650;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const outQ = (p) => 1 - Math.pow(1 - p, 2.2);
const outQ2 = (p) => p * (1.15 - 0.15 * p);   // kalem: hafif yavaşlayan, neredeyse doğrusal

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

// Kılıç: tahtanın tüm genişliğini boydan boya kesen kalın, sivri uçlu çapraz bıçak izi
const KILIC_REVEAL = 120, KILIC_HOLD = 220, KILIC_END = 520;
const KILIC_SPARKS = [[0.22, 0.9, 0.6], [0.4, -1.1, 0.8], [0.58, 1.2, 1], [0.74, -0.8, 0.7], [0.88, 1, 0.9]];
function sigKilic(c, b, g, age) {
  if (!b.rows.length || age >= KILIC_END) return;
  const s = g.s, W = g.cols * s, y0 = g.by + Math.min(...b.rows) * s, y1 = g.by + (Math.max(...b.rows) + 1) * s;
  const ax = g.bx - 0.5 * s, ay = y0 - 0.55 * s, bx2 = g.bx + W + 0.5 * s, by2 = y1 + 0.55 * s;
  const dx = bx2 - ax, dy = by2 - ay, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const head = outQ(clamp01(age / KILIC_REVEAL));
  const q = age > KILIC_HOLD ? clamp01((age - KILIC_HOLD) / (KILIC_END - KILIC_HOLD)) : 0, al = 1 - q * q;
  const halfW = (u) => 0.175 * s * Math.pow(Math.sin(Math.PI * Math.min(1, u)), 0.7);
  const blade = (u0, u1, off) => {
    const N = 28, top = [], bot = [], ox = nx * off, oy = ny * off;
    for (let i = 0; i <= N; i++) {
      const u = u0 + (u1 - u0) * (i / N), w = halfW(u), px = ax + dx * u + ox, py = ay + dy * u + oy;
      top.push([px + nx * w, py + ny * w]); bot.push([px - nx * w, py - ny * w]);
    }
    c.beginPath(); c.moveTo(top[0][0], top[0][1]);
    for (let i = 1; i <= N; i++) c.lineTo(top[i][0], top[i][1]);
    for (let i = N; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]);
    c.closePath();
  };
  c.save(); clipBoard(c, g); c.lineJoin = 'round';
  const parts = q > 0 ? [[0, 0.5, -0.15 * s * q], [0.5, 1, 0.15 * s * q]] : [[0, 1, 0]];
  for (const [u0, u1, off] of parts) {
    const e = Math.min(u1, head); if (e <= u0) continue;
    c.globalAlpha = al;
    c.shadowColor = 'rgba(255,230,160,0.9)'; c.shadowBlur = s * 0.6;
    blade(u0, e, off); c.fillStyle = '#fffdf4'; c.fill();
    c.shadowBlur = 0; blade(u0, e, off); c.strokeStyle = 'rgba(255,190,60,0.95)'; c.lineWidth = Math.max(1, s * 0.05); c.stroke();
    // sıcak altın çekirdek: merkez çizgisi
    c.beginPath();
    for (let i = 0; i <= 20; i++) {
      const u = u0 + (e - u0) * (i / 20), px = ax + dx * u + nx * off, py = ay + dy * u + ny * off;
      if (i) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.strokeStyle = 'rgba(255,214,110,0.55)'; c.lineWidth = Math.max(1, s * 0.07); c.lineCap = 'round'; c.stroke();
  }
  // kıvılcımlar
  c.shadowColor = 'rgba(255,230,160,0.9)'; c.shadowBlur = s * 0.3;
  for (const [u, dir, v] of KILIC_SPARKS) {
    const t0 = u * KILIC_REVEAL; if (age < t0) continue;
    const k = clamp01((age - t0) / 380), d = outQ(k) * s * (0.8 + 0.7 * v);
    const px = ax + dx * u + nx * dir * d * 0.9 + ux * d * 0.5, py = ay + dy * u + ny * dir * d * 0.9 + uy * d * 0.5;
    c.globalAlpha = 1 - k; c.fillStyle = k < 0.4 ? '#ffffff' : '#ffd878';
    c.beginPath(); c.arc(px, py, Math.max(1, s * 0.06 * (1 - 0.5 * k)), 0, 6.2832); c.fill();
  }
  c.restore();
}

// Kalem: elle atılmış gibi akıcı el yazısı imza (el çizimi kübik Bézier parçaları, uzunluğa göre kademeli çizilir)
// Tasarım uzayı: x 0..8, y 0..1 (aşağı); "L" başharfi halkalı, bağlı küçük halkalar, geri dönen uzun alt çizgi
const SIG_SEGS = [
  [[0.12, 0.76], [0.40, 0.70], [0.52, 0.30], [0.80, 0.04]],
  [[0.80, 0.04], [1.02, 0.00], [1.02, 0.34], [0.72, 0.52]],
  [[0.72, 0.52], [0.46, 0.68], [0.38, 0.84], [0.62, 0.78]],
  [[0.62, 0.78], [0.95, 0.72], [1.10, 0.62], [1.42, 0.62]],
  [[1.42, 0.62], [1.58, 0.50], [1.62, 0.34], [1.86, 0.34]],
  [[1.86, 0.34], [2.14, 0.34], [2.06, 0.70], [1.78, 0.66]],
  [[1.78, 0.66], [1.96, 0.72], [2.12, 0.58], [2.32, 0.58]],
  [[2.32, 0.58], [2.64, 0.60], [2.56, 0.04], [2.96, 0.10]],
  [[2.96, 0.10], [3.30, 0.18], [3.08, 0.60], [2.84, 0.68]],
  [[2.84, 0.68], [3.10, 0.84], [3.34, 0.52], [3.62, 0.54]],
  [[3.62, 0.54], [3.70, 0.26], [4.06, 0.26], [4.14, 0.56]],
  [[4.14, 0.56], [4.22, 0.30], [4.56, 0.24], [4.64, 0.58]],
  [[4.64, 0.58], [4.74, 0.80], [4.96, 0.58], [5.20, 0.50]],
  [[5.20, 0.50], [5.42, 0.42], [5.52, 0.36], [5.58, 0.50]],
  [[5.58, 0.50], [5.66, 0.82], [5.40, 0.98], [5.16, 0.88]],
  [[5.16, 0.88], [5.00, 0.80], [5.30, 0.62], [5.84, 0.58]],
  [[5.84, 0.58], [6.50, 0.50], [7.70, 0.22], [7.80, 0.48]],
  [[7.80, 0.48], [7.88, 0.82], [4.60, 0.96], [1.60, 0.90]],
  [[1.60, 0.90], [1.30, 0.89], [1.10, 0.84], [0.96, 0.74]],
];
const SIG_W = 8;
let sigPts = null;   // [{x,y,l}] tasarım uzayında örneklenmiş çizgi (l: yay uzunluğu, x'e göre ölçekli sayılmaz)
function sigPoly() {
  if (sigPts) return sigPts;
  sigPts = [{ x: SIG_SEGS[0][0][0], y: SIG_SEGS[0][0][1], seg: 0 }];
  SIG_SEGS.forEach(([p0, p1, p2, p3], si) => {
    for (let i = 1; i <= 18; i++) {
      const t = i / 18, m = 1 - t, a = m * m * m, b2 = 3 * m * m * t, c2 = 3 * m * t * t, d = t * t * t;
      sigPts.push({ x: a * p0[0] + b2 * p1[0] + c2 * p2[0] + d * p3[0], y: a * p0[1] + b2 * p1[1] + c2 * p2[1] + d * p3[1], seg: si });
    }
  });
  return sigPts;
}
const KALEM_REVEAL = 500, KALEM_FADE = 250;
function sigKalem(c, b, g, age) {
  if (!b.rows.length) return;
  const s = g.s, y = b.rows[0], cy = g.by + (y + 0.5) * s, W = g.cols * s;
  const reveal = outQ2(clamp01(age / KALEM_REVEAL)), al = age < KALEM_REVEAL + 100 ? 1 : clamp01(1 - (age - KALEM_REVEAL - 100) / KALEM_FADE);
  if (al <= 0) return;
  const sx = (W * 0.78) / SIG_W, sy = s * 0.9, ox = g.bx + W * 0.11, oy = cy - sy / 2;
  const P = sigPoly().map((p) => [ox + p.x * sx, oy + p.y * sy]);
  const cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const total = cum[cum.length - 1], target = total * reveal;
  let n = 1; while (n < P.length && cum[n] <= target) n++;
  const pts = P.slice(0, n);
  if (n < P.length) { const f = (target - cum[n - 1]) / (cum[n] - cum[n - 1] || 1); pts.push([P[n - 1][0] + (P[n][0] - P[n - 1][0]) * f, P[n - 1][1] + (P[n][1] - P[n - 1][1]) * f]); }
  c.save(); clipBoard(c, g);
  // parşömen şerit (okunurluk)
  c.fillStyle = `rgba(250,236,200,${(0.5 * al).toFixed(3)})`; c.fillRect(g.bx, g.by + y * s + s * 0.04, W, s * 0.92);
  c.globalAlpha = al; c.lineCap = 'round'; c.lineJoin = 'round';
  const base = Math.max(1.4, s * 0.052);
  const stroke = (col, wMul, dx, dy, press) => {
    c.strokeStyle = col;
    for (let i = 1; i < pts.length; i++) {
      const ddx = pts[i][0] - pts[i - 1][0], ddy = pts[i][1] - pts[i - 1][1], dl = Math.hypot(ddx, ddy) || 1;
      // aşağı inen vuruşlar kalın (kalem basıncı), yukarı/yatay ince
      const w = base * wMul * (press ? 0.4 + 1.25 * Math.max(0, ddy / dl) + 0.25 * Math.abs(ddx / dl) : 1);
      c.lineWidth = w;
      c.beginPath(); c.moveTo(pts[i - 1][0] + dx, pts[i - 1][1] + dy); c.lineTo(pts[i][0] + dx, pts[i][1] + dy); c.stroke();
    }
  };
  stroke('rgba(217,178,74,0.7)', 0.9, -base * 0.3, -base * 0.3, true);   // altın parıltı kenarı
  stroke('#1b1410', 1.0, 0, 0, true);                                      // ana mürekkep
  stroke('#1b1410', 0.4, base * 0.45, base * 0.25, true);                    // ince, kaydırılmış ikinci vuruş
  // başlangıç mürekkep damlası
  c.fillStyle = '#1b1410'; c.beginPath(); c.arc(P[0][0], P[0][1], base * 1.15, 0, 6.2832); c.fill();
  // uç: yazarken kalem ucu parıltısı, bitince hafif kalkış
  const e = pts[pts.length - 1];
  if (reveal < 1) { c.fillStyle = 'rgba(255,226,140,0.9)'; c.shadowColor = 'rgba(255,214,110,0.9)'; c.shadowBlur = s * 0.3; c.beginPath(); c.arc(e[0], e[1], base * 0.8, 0, 6.2832); c.fill(); }
  else {
    const k = clamp01((age - KALEM_REVEAL) / 140), l = pts[pts.length - 1], r = P[Math.max(0, P.length - 6)];
    const vx = l[0] - r[0], vy = l[1] - r[1], vl = Math.hypot(vx, vy) || 1;
    c.strokeStyle = '#1b1410'; c.lineWidth = base * 0.5 * (1 - k * 0.7);
    c.beginPath(); c.moveTo(l[0], l[1]); c.quadraticCurveTo(l[0] + (vx / vl) * s * 0.18 * k, l[1] + (vy / vl) * s * 0.18 * k - s * 0.04, l[0] + (vx / vl) * s * 0.3 * k, l[1] + (vy / vl) * s * 0.3 * k - s * 0.2 * k); c.stroke();
  }
  c.restore();
}

// Paragraf: satırın üstünde yükselip sönen büyük "§"
function sigParagraf(c, b, g, age) {
  if (!b.rows.length) return;
  const s = g.s, p = clamp01(age / STRIP_MS), cx = g.bx + g.cols * s / 2, cy = g.by + (b.rows[0] + 0.5) * s - p * s;
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
  const s = g.s, a = clamp01(age / STRIP_MS), k = 1 - a, col = b.gold ? '255,214,110' : '255,244,214';
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
