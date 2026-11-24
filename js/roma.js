// Lex Stack - Roma mekân arka planları (seviye başına bir kez, ofscreen tuvale çizilir; render.js önbelleğe alır)
// Her mekân şeffaf bir katmandır: seviye zemin rengi üstünde düşük kontrastlı ton olarak görünür.
const TINT = ['#F0A272', '#F0DDAE', '#BCCADC', '#C792E8'];   // Forum, Bazilika, Curia, Pantheon

function mk(w, h) {
  const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w)); cv.height = Math.max(1, Math.round(h));
  return cv;
}
// Opak ton ile çizilen katmanı verilen şeffaflıkla hedefe ekler (kesmeler destination-out ile yapılabilir)
function layer(out, w, h, tint, alpha, fn) {
  const cv = mk(w, h), c = cv.getContext('2d');
  c.fillStyle = tint; c.strokeStyle = tint;
  fn(c);
  out.globalAlpha = alpha; out.drawImage(cv, 0, 0); out.globalAlpha = 1;
}
function archPath(c, x, y, w, h) {   // x,y = sol-alt; yarım daire tepeli kemer
  const r = w / 2;
  c.moveTo(x, y); c.lineTo(x, y - h + r); c.arc(x + r, y - h + r, r, Math.PI, 0); c.lineTo(x + w, y); c.closePath();
}
function flute(c, x, y, w, h, u, n) {   // sütun gövdesi ve kanallar
  c.fillRect(x, y, w, h);
  c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 0.45; c.lineWidth = Math.max(1, u * 0.04);
  for (let i = 1; i < n; i++) { const fx = x + (w * i) / n; c.beginPath(); c.moveTo(fx, y + h * 0.04); c.lineTo(fx, y + h); c.stroke(); }
  c.restore();
}

function forum(out, w, h, u) {
  const tint = TINT[0], gy = 15.4 * u;
  // ufukta alacakaranlık ışıması
  const g = out.createRadialGradient(w * 0.5, 12 * u, 0, w * 0.5, 12 * u, 8 * u);
  g.addColorStop(0, 'rgba(240,162,114,0.16)'); g.addColorStop(1, 'rgba(240,162,114,0)');
  out.fillStyle = g; out.fillRect(0, 5 * u, w, 13 * u);
  // uzak kemer (Septimius Severus tipi): üç açıklıklı, ortada büyük
  layer(out, w, h, tint, 0.09, (c) => {
    const x = 3.2 * u, y = gy, W = 6.2 * u, H = 6.4 * u;
    c.fillRect(x, y - H, W, H);
    c.fillRect(x - 0.25 * u, y - H - 0.5 * u, W + 0.5 * u, 0.5 * u);          // korniş
    c.fillRect(x + 0.3 * u, y - H - 1.3 * u, W - 0.6 * u, 0.8 * u);           // attik
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); archPath(c, x + 2.0 * u, y, 2.2 * u, 4.2 * u); c.fill();   // orta kemer
    c.beginPath(); archPath(c, x + 0.45 * u, y, 1.0 * u, 2.5 * u); c.fill();  // yan kemerler
    c.beginPath(); archPath(c, x + W - 1.45 * u, y, 1.0 * u, 2.5 * u); c.fill();
  });
  // harap sütun dizisi: farklı yüksekliklerde kırık sütunlar
  const cols = [[0.9, 5.2], [2.2, 3.4], [8.3, 4.6], [9.6, 2.6]];
  layer(out, w, h, tint, 0.15, (c) => {
    for (const [cx, hh] of cols) {
      const cw = 0.8 * u, x = cx * u, top = gy - hh * u;
      flute(c, x, top, cw, hh * u, u, 4);
      c.fillRect(x - 0.12 * u, gy - 0.35 * u, cw + 0.24 * u, 0.35 * u);       // kaide
      if (hh > 4) { c.fillRect(x - 0.18 * u, top - 0.3 * u, cw + 0.36 * u, 0.3 * u); c.fillRect(x - 0.3 * u, top - 0.6 * u, cw + 0.6 * u, 0.3 * u); }
      else { c.beginPath(); c.moveTo(x, top); c.lineTo(x + cw * 0.4, top - 0.25 * u); c.lineTo(x + cw * 0.7, top + 0.1 * u); c.lineTo(x + cw, top - 0.15 * u); c.lineTo(x + cw, top + 0.4 * u); c.lineTo(x, top + 0.4 * u); c.fill(); }
    }
    // üstte yatan arşitrav parçası
    c.fillRect(0.7 * u, gy - 5.2 * u - 1.0 * u, 2.6 * u, 0.4 * u);
  });
  // zemin: traverten plakalar
  layer(out, w, h, tint, 0.10, (c) => { c.fillRect(0, gy, w, h - gy); });
  layer(out, w, h, tint, 0.07, (c) => { c.lineWidth = Math.max(1, u * 0.04); for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, gy + i * 0.45 * u); c.lineTo(w, gy + i * 0.45 * u); c.stroke(); } });
}

function basilika(out, w, h, u) {
  const tint = TINT[1], fy = 16.0 * u;
  // cephe: kemerli galeri, ara pilastrlar
  const n = 3, aw = (w - 0.6 * u) / n;
  layer(out, w, h, tint, 0.10, (c) => {
    c.fillRect(0, 8.4 * u, w, fy - 8.4 * u);
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < n; i++) { c.beginPath(); archPath(c, 0.3 * u + i * aw + 0.55 * u, fy, aw - 1.1 * u, 6.6 * u); c.fill(); }
  });
  // kemer açıklıklarında derinlik: ikinci sıra kemerler (daha silik)
  layer(out, w, h, tint, 0.05, (c) => {
    for (let i = 0; i < n; i++) { c.beginPath(); archPath(c, 0.3 * u + i * aw + 1.05 * u, fy, aw - 2.1 * u, 5.4 * u); c.fill(); }
  });
  // klerestori pencereleri
  layer(out, w, h, tint, 0.13, (c) => {
    c.fillRect(0, 5.6 * u, w, 2.8 * u);
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 4; i++) { const wx = (i + 0.5) * (w / 4) - 0.5 * u; c.beginPath(); archPath(c, wx, 8.0 * u, 1.0 * u, 2.1 * u); c.fill(); }
  });
  // ön plan sütunları (kenarlarda)
  layer(out, w, h, tint, 0.15, (c) => {
    for (const x of [0.15 * u, w - 1.05 * u]) { flute(c, x, 7.8 * u, 0.9 * u, fy - 7.8 * u, u, 4); c.fillRect(x - 0.15 * u, 7.5 * u, 1.2 * u, 0.4 * u); }
  });
  // ışık hüzmeleri
  out.save();
  for (let i = 0; i < 4; i++) {
    const wx = (i + 0.5) * (w / 4), g = out.createLinearGradient(wx, 8 * u, wx + 2.2 * u, fy);
    g.addColorStop(0, 'rgba(255,238,190,0.16)'); g.addColorStop(1, 'rgba(255,238,190,0)');
    out.fillStyle = g; out.beginPath();
    out.moveTo(wx - 0.45 * u, 8.2 * u); out.lineTo(wx + 0.45 * u, 8.2 * u); out.lineTo(wx + 3.2 * u, fy); out.lineTo(wx + 1.4 * u, fy); out.fill();
  }
  out.restore();
  // zemin
  layer(out, w, h, tint, 0.10, (c) => { c.fillRect(0, fy, w, h - fy); });
  layer(out, w, h, tint, 0.07, (c) => { c.lineWidth = Math.max(1, u * 0.04); for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(w / 2 + i * 0.5 * u, fy); c.lineTo(w / 2 + i * 1.4 * u, h); c.stroke(); } });
}

function curia(out, w, h, u) {
  const tint = TINT[2], fy = 16.2 * u;
  // arka duvar: mermer levha dikmeleri
  layer(out, w, h, tint, 0.07, (c) => { c.fillRect(0, 7.2 * u, w, fy - 7.2 * u); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 0.5; c.lineWidth = Math.max(1, u * 0.05);
    for (let i = 1; i < 11; i += 2) { c.beginPath(); c.moveTo(i * u, 7.6 * u); c.lineTo(i * u, fy); c.stroke(); } });
  // kapı: alınlıklı, iki pilastrlı
  const dx = w / 2 - 1.5 * u;
  layer(out, w, h, tint, 0.15, (c) => {
    c.fillRect(dx - 0.9 * u, 8.9 * u, 5.4 * u - 0.6 * u, fy - 8.9 * u);                 // çerçeve
    c.beginPath(); c.moveTo(dx - 1.25 * u, 8.9 * u); c.lineTo(w / 2, 7.1 * u); c.lineTo(dx + 4.25 * u, 8.9 * u); c.closePath(); c.fill();   // alınlık
    c.globalCompositeOperation = 'destination-out';
    c.fillRect(dx, 10.4 * u, 3 * u, fy - 10.4 * u);                                  // kapı boşluğu
    c.beginPath(); c.moveTo(dx - 0.55 * u, 8.6 * u); c.lineTo(w / 2, 7.6 * u); c.lineTo(dx + 3.55 * u, 8.6 * u); c.closePath(); c.fill(); // alınlık tympanum
    c.fillStyle = tint; c.globalCompositeOperation = 'source-over';
    c.fillRect(dx - 0.35 * u, 8.9 * u, 3.7 * u, 0.35 * u);                           // lento
  });
  // kapı içi hafif ışık
  const g = out.createLinearGradient(0, 10.4 * u, 0, fy); g.addColorStop(0, 'rgba(210,222,240,0.10)'); g.addColorStop(1, 'rgba(210,222,240,0.02)');
  out.fillStyle = g; out.fillRect(dx, 10.4 * u, 3 * u, fy - 10.4 * u);
  // yanlarda basamaklı sıralar (4 kademe)
  layer(out, w, h, tint, 0.13, (c) => {
    for (let k = 0; k < 4; k++) {
      const sw = (1.0 + k * 0.5) * u, y = fy - k * 1.0 * u;
      c.fillRect(0, y - 0.85 * u, sw + 1.2 * u, 0.85 * u); c.fillRect(w - sw - 1.2 * u, y - 0.85 * u, sw + 1.2 * u, 0.85 * u);
    }
  });
  layer(out, w, h, tint, 0.07, (c) => {   // basamak yüzleri: gölge çizgileri
    for (let k = 0; k < 4; k++) { const y = fy - k * u; c.fillRect(0, y - 0.1 * u, (2.2 + k * 0.5) * u, 0.1 * u); c.fillRect(w - (2.2 + k * 0.5) * u, y - 0.1 * u, (2.2 + k * 0.5) * u, 0.1 * u); }
  });
  // mermer zemin: opus sectile karolar
  layer(out, w, h, tint, 0.09, (c) => { c.fillRect(0, fy, w, h - fy); });
  layer(out, w, h, tint, 0.06, (c) => { const s = 0.9 * u; for (let y = fy; y < h; y += s) for (let x = ((((y - fy) / s) | 0) % 2) * s; x < w; x += 2 * s) c.fillRect(x, y, s, s); });
}

function pantheon(out, w, h, u) {
  const tint = TINT[3], cx = w / 2, cy = 7.6 * u, R = 7.2 * u, r0 = 1.5 * u;
  // kubbe: perspektifte kasetler (halkalar giderek genişler)
  const rings = [r0, 2.3 * u, 3.3 * u, 4.5 * u, 5.8 * u, 7.2 * u], N = 16;
  layer(out, w, h, tint, 0.15, (c) => {
    c.fillStyle = tint;
    for (let i = 0; i < rings.length - 1; i++) {
      const a = rings[i], b = rings[i + 1], pad = (b - a) * 0.16;
      for (let j = 0; j < N; j++) {
        const t0 = (j / N) * Math.PI * 2, t1 = ((j + 1) / N) * Math.PI * 2, dt = (t1 - t0) * 0.14;
        const ra = a + pad, rb = b - pad;
        c.beginPath(); c.arc(cx, cy, rb, t0 + dt * (b / rb) * 0.5, t1 - dt * 0.5); c.arc(cx, cy, ra, t1 - dt, t0 + dt, true); c.closePath(); c.fill();
      }
    }
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(cx, cy, r0 * 0.98, 0, Math.PI * 2); c.fill();
  });
  // kasetlerin içi: silik ikinci kademe (derinlik)
  layer(out, w, h, tint, 0.06, (c) => { c.beginPath(); c.arc(cx, cy, R + 0.3 * u, 0, Math.PI * 2); c.arc(cx, cy, R * 0.99, 0, Math.PI * 2, true); c.fill(); });
  // oculus ışıması
  const og = out.createRadialGradient(cx, cy, 0, cx, cy, r0 * 2.2);
  og.addColorStop(0, 'rgba(250,236,255,0.30)'); og.addColorStop(0.45, 'rgba(230,200,250,0.14)'); og.addColorStop(1, 'rgba(210,170,240,0)');
  out.fillStyle = og; out.fillRect(cx - 3.5 * u, cy - 3.5 * u, 7 * u, 7 * u);
  // ışık huzmesi: oculus'tan zemine genişleyen
  const bg = out.createLinearGradient(0, cy, 0, 16.5 * u);
  bg.addColorStop(0, 'rgba(240,222,255,0.17)'); bg.addColorStop(1, 'rgba(240,222,255,0.05)');
  out.fillStyle = bg; out.beginPath();
  out.moveTo(cx - r0 * 0.9, cy); out.lineTo(cx + r0 * 0.9, cy); out.lineTo(cx + 3.6 * u, 16.4 * u); out.lineTo(cx - 3.6 * u, 16.4 * u); out.closePath(); out.fill();
  // alt duvar: korniş ve niş kemerleri
  layer(out, w, h, tint, 0.09, (c) => {
    c.fillRect(0, 14.6 * u, w, h - 14.6 * u);
    c.globalCompositeOperation = 'destination-out';
    for (const x of [0.9, 4.2, 7.5]) { c.beginPath(); archPath(c, x * u, 16.4 * u, 2.6 * u, 2.6 * u); c.fill(); }
  });
  layer(out, w, h, tint, 0.07, (c) => { c.fillRect(0, 16.4 * u, w, h - 16.4 * u); });
}

const DRAW = [forum, basilika, curia, pantheon];
export function makeBackdrop(level, w, h) {
  const cv = mk(w, h), out = cv.getContext('2d'), u = cv.width / 11;
  const tmp = mk(w, h), tc = tmp.getContext('2d');
  DRAW[Math.max(0, Math.min(3, level))](tc, tmp.width, tmp.height, u);
  // üst kısmı sönükleştir: parçalar yukarıdan inerken zemine temiz okunur
  tc.globalCompositeOperation = 'destination-in';
  const m = tc.createLinearGradient(0, 0, 0, tmp.height);
  m.addColorStop(0, 'rgba(0,0,0,0.25)'); m.addColorStop(0.35, 'rgba(0,0,0,0.75)'); m.addColorStop(0.55, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,1)');
  tc.fillStyle = m; tc.fillRect(0, 0, tmp.width, tmp.height);
  out.globalAlpha = [1, 0.72, 0.85, 0.7][Math.max(0, Math.min(3, level))];   // seviye başına genel şiddet
  out.drawImage(tmp, 0, 0);
  return cv;
}
