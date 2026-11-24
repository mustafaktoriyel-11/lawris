// Lex Stack - Roma mekân arka planları (seviye başına bir kez, ofscreen tuvale çizilir; render.js önbelleğe alır)
// Her mekân iki sürümde çizilir (aynı geometri): sönük ton (zemin rengi üstünde düşük kontrast) ve TAM RENKLİ sürüm
// ("Roma'yı yeniden inşa et": satır sildikçe renkli sürüm aşağıdan yukarı açığa çıkar).
// Gün döngüsü: Forum sabah, Bazilika öğle, Curia gün batımı, Pantheon gece.
const TINT = ['#FFEFD2', '#FFF6D8', '#FFD3AC', '#B4C2FF'];

function mk(w, h) {
  const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w)); cv.height = Math.max(1, Math.round(h));
  return cv;
}
// spec = [renk, saydamlık]; fn ofscreen katmanda çizer (kesmeler destination-out ile), katman hedefe saydamlıkla eklenir
function layer(out, w, h, spec, fn) {
  const cv = mk(w, h), c = cv.getContext('2d');
  c.fillStyle = spec[0]; c.strokeStyle = spec[0];
  fn(c);
  out.globalAlpha = spec[1]; out.drawImage(cv, 0, 0); out.globalAlpha = 1;
}
function archPath(c, x, y, w, h) {   // x,y = sol-alt; yarım daire tepeli kemer
  const r = w / 2;
  c.moveTo(x, y); c.lineTo(x, y - h + r); c.arc(x + r, y - h + r, r, Math.PI, 0); c.lineTo(x + w, y); c.closePath();
}
// sütun gövdesi ve kanallar (renkli sürümde kanallar koyu çizgi, sönükte kesme)
function flute(c, x, y, w, h, u, n, dark) {
  c.fillRect(x, y, w, h);
  c.save(); c.lineWidth = Math.max(1, u * 0.04);
  if (dark) { c.strokeStyle = dark; } else { c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 0.45; }
  for (let i = 1; i < n; i++) { const fx = x + (w * i) / n; c.beginPath(); c.moveTo(fx, y + h * 0.04); c.lineTo(fx, y + h); c.stroke(); }
  c.restore();
}
function vgrad(out, y0, y1, stops) { const g = out.createLinearGradient(0, y0, 0, y1); for (const [o, col] of stops) g.addColorStop(o, col); return g; }
function glow(out, x, y, r, rgb, a) {
  const g = out.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  out.fillStyle = g; out.fillRect(x - r, y - r, 2 * r, 2 * r);
}
function star(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }

// ---------- 0. Forum Romanum: sabah ----------
function forum(out, w, h, u, COL) {
  const P = (m, c) => (COL ? c : m), tint = TINT[0], gy = 15.4 * u;
  if (COL) { out.fillStyle = vgrad(out, 0, gy, [[0, '#7DB3E4'], [0.55, '#BFDDF0'], [1, '#FBE4B4']]); out.fillRect(0, 0, w, h); }
  // sabah ışığı: ufukta yumuşak güneş ışıması
  glow(out, w * 0.72, 11.2 * u, 7.5 * u, COL ? '255,240,180' : '255,236,190', COL ? 0.7 : 0.2);
  // uzak bina dizisi: terracotta çatılı (Tabularium / tapınaklar)
  const bl = [[-0.2, 3.1, 1.9], [6.6, 2.6, 1.6], [8.4, 3.0, 2.2]];
  layer(out, w, h, P([tint, 0.06], ['#E2CFA8', 1]), (c) => { for (const [x, ww, hh] of bl) c.fillRect(x * u, gy - hh * u, ww * u, hh * u); });
  layer(out, w, h, P([tint, 0.09], ['#B9562F', 1]), (c) => {
    for (const [x, ww, hh] of bl) { c.beginPath(); c.moveTo((x - 0.15) * u, gy - hh * u); c.lineTo((x + ww / 2) * u, gy - (hh + 0.8) * u); c.lineTo((x + ww + 0.15) * u, gy - hh * u); c.closePath(); c.fill(); }
  });
  // uzak kemer (Septimius Severus tipi): üç açıklıklı, ortada büyük
  const ax = 3.2 * u, aW = 6.2 * u, aH = 6.4 * u;
  layer(out, w, h, P([tint, 0.12], ['#E9DBBA', 1]), (c) => {
    c.fillRect(ax, gy - aH, aW, aH);
    c.fillRect(ax - 0.25 * u, gy - aH - 0.5 * u, aW + 0.5 * u, 0.5 * u);          // korniş
    c.fillRect(ax + 0.3 * u, gy - aH - 1.3 * u, aW - 0.6 * u, 0.8 * u);           // attik
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); archPath(c, ax + 2.0 * u, gy, 2.2 * u, 4.2 * u); c.fill();     // orta kemer
    c.beginPath(); archPath(c, ax + 0.45 * u, gy, 1.0 * u, 2.5 * u); c.fill();    // yan kemerler
    c.beginPath(); archPath(c, ax + aW - 1.45 * u, gy, 1.0 * u, 2.5 * u); c.fill();
  });
  if (COL) {
    out.fillStyle = '#C9A227'; out.fillRect(ax + 0.7 * u, gy - aH - 1.15 * u, aW - 1.4 * u, 0.3 * u);   // altın yazıt
    out.fillStyle = '#C9B48A'; out.fillRect(ax + 0.3 * u, gy - aH + 0.2 * u, 0.8 * u, aH - 0.2 * u);   // gölge pilastrları
    out.fillRect(ax + aW - 1.1 * u, gy - aH + 0.2 * u, 0.8 * u, aH - 0.2 * u);
  }
  // attik üstünde quadriga silüeti (altın)
  layer(out, w, h, P([tint, 0.12], ['#D7AE2E', 1]), (c) => {
    const qx = ax + aW / 2, qy = gy - aH - 1.3 * u;
    c.fillRect(qx - 0.9 * u, qy - 0.35 * u, 1.8 * u, 0.35 * u);
    for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(qx - 0.75 * u + i * 0.5 * u, qy - 0.35 * u, 0.22 * u, Math.PI, 0); c.fill(); }
    c.fillRect(qx - 0.07 * u, qy - 0.95 * u, 0.14 * u, 0.6 * u);
  });
  // harap sütun dizisi
  const cols = [[0.9, 5.2], [2.2, 3.4], [8.3, 4.6], [9.6, 2.6]];
  layer(out, w, h, P([tint, 0.17], ['#F6F1E4', 1]), (c) => {
    for (const [cx, hh] of cols) {
      const cw = 0.8 * u, x = cx * u, top = gy - hh * u;
      flute(c, x, top, cw, hh * u, u, 4, COL ? 'rgba(130,110,80,0.4)' : null);
      c.fillRect(x - 0.12 * u, gy - 0.35 * u, cw + 0.24 * u, 0.35 * u);       // kaide
      if (hh > 4) { c.fillRect(x - 0.18 * u, top - 0.3 * u, cw + 0.36 * u, 0.3 * u); c.fillRect(x - 0.3 * u, top - 0.6 * u, cw + 0.6 * u, 0.3 * u); }
      else { c.beginPath(); c.moveTo(x, top); c.lineTo(x + cw * 0.4, top - 0.25 * u); c.lineTo(x + cw * 0.7, top + 0.1 * u); c.lineTo(x + cw, top - 0.15 * u); c.lineTo(x + cw, top + 0.4 * u); c.lineTo(x, top + 0.4 * u); c.fill(); }
    }
    c.fillRect(0.7 * u, gy - 5.2 * u - 1.0 * u, 2.6 * u, 0.4 * u);
  });
  // zemin: traverten plakalar
  layer(out, w, h, P([tint, 0.11], ['#D2BD94', 1]), (c) => { c.fillRect(0, gy, w, h - gy); });
  layer(out, w, h, P([tint, 0.08], ['#A8946C', 0.7]), (c) => { c.lineWidth = Math.max(1, u * 0.04); for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, gy + i * 0.45 * u); c.lineTo(w, gy + i * 0.45 * u); c.stroke(); } });
}

// ---------- 1. Basilica Ulpia / Aemilia: öğle ----------
function basilika(out, w, h, u, COL) {
  const P = (m, c) => (COL ? c : m), tint = TINT[1], fy = 16.0 * u;
  const n = 3, aw = (w - 0.6 * u) / n;
  if (COL) {
    out.fillStyle = vgrad(out, 0, fy, [[0, '#EBD7A6'], [0.4, '#E3C98E'], [1, '#C79F5C']]); out.fillRect(0, 0, w, h);
    // boyalı kasetli tavan
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
      const x = i * (w / 6) + 0.18 * u, y = 0.4 * u + r * 1.65 * u, cw = w / 6 - 0.36 * u;
      out.fillStyle = '#D7A06A'; out.fillRect(x, y, cw, 1.4 * u);
      out.fillStyle = '#F0D98A'; out.fillRect(x + 0.1 * u, y + 0.1 * u, cw - 0.2 * u, 0.1 * u);
      out.fillStyle = '#D9B64A'; out.beginPath(); out.arc(x + cw / 2, y + 0.7 * u, 0.2 * u, 0, Math.PI * 2); out.fill();
    }
    // kemerlerin arkasındaki iç mekan (sıcak, derin)
    out.fillStyle = vgrad(out, 8.4 * u, fy, [[0, '#7D5D3A'], [1, '#B58A52']]); out.fillRect(0, 8.4 * u, w, fy - 8.4 * u);
    // klerestori: gökyüzü
    out.fillStyle = vgrad(out, 5.6 * u, 8.4 * u, [[0, '#9FD0F0'], [1, '#D6EDF8']]); out.fillRect(0, 5.6 * u, w, 2.8 * u);
  }
  // cephe: kemerli galeri
  layer(out, w, h, P([tint, 0.12], ['#DDBF84', 1]), (c) => {
    c.fillRect(0, 8.4 * u, w, fy - 8.4 * u);
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < n; i++) { c.beginPath(); archPath(c, 0.3 * u + i * aw + 0.55 * u, fy, aw - 1.1 * u, 6.6 * u); c.fill(); }
  });
  // ikinci sıra kemerler (derinlik)
  layer(out, w, h, P([tint, 0.06], ['#9C7545', 0.8]), (c) => {
    for (let i = 0; i < n; i++) { c.beginPath(); archPath(c, 0.3 * u + i * aw + 1.05 * u, fy, aw - 2.1 * u, 5.4 * u); c.fill(); }
  });
  // klerestori duvarı ve pencereler
  layer(out, w, h, P([tint, 0.15], ['#E8D2A0', 1]), (c) => {
    c.fillRect(0, 5.6 * u, w, 2.8 * u);
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 4; i++) { const wx = (i + 0.5) * (w / 4) - 0.5 * u; c.beginPath(); archPath(c, wx, 8.0 * u, 1.0 * u, 2.1 * u); c.fill(); }
  });
  // kenar sütunları
  layer(out, w, h, P([tint, 0.17], ['#F4EBD6', 1]), (c) => {
    for (const x of [0.15 * u, w - 1.05 * u]) { flute(c, x, 7.8 * u, 0.9 * u, fy - 7.8 * u, u, 4, COL ? 'rgba(140,115,75,0.4)' : null); c.fillRect(x - 0.15 * u, 7.5 * u, 1.2 * u, 0.4 * u); }
  });
  // öğle ışık hüzmeleri
  out.save();
  for (let i = 0; i < 4; i++) {
    const wx = (i + 0.5) * (w / 4), g = out.createLinearGradient(wx, 8 * u, wx + 2.2 * u, fy);
    g.addColorStop(0, COL ? 'rgba(255,246,200,0.5)' : 'rgba(255,250,220,0.24)'); g.addColorStop(1, 'rgba(255,246,200,0)');
    out.fillStyle = g; out.beginPath();
    out.moveTo(wx - 0.45 * u, 8.2 * u); out.lineTo(wx + 0.45 * u, 8.2 * u); out.lineTo(wx + 3.2 * u, fy); out.lineTo(wx + 1.4 * u, fy); out.fill();
  }
  out.restore();
  // zemin: opus sectile
  layer(out, w, h, P([tint, 0.11], ['#CDA96C', 1]), (c) => { c.fillRect(0, fy, w, h - fy); });
  layer(out, w, h, P([tint, 0.08], ['#9E7C46', 0.7]), (c) => { c.lineWidth = Math.max(1, u * 0.04); for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(w / 2 + i * 0.5 * u, fy); c.lineTo(w / 2 + i * 1.4 * u, h); c.stroke(); } });
}

// ---------- 2. Curia Julia (Senato): gün batımı ----------
function curia(out, w, h, u, COL) {
  const P = (m, c) => (COL ? c : m), tint = TINT[2], fy = 16.2 * u, cx = w / 2;
  const lw = Math.max(1, u * 0.055);
  if (COL) { out.fillStyle = vgrad(out, 0, fy, [[0, '#B9725A'], [0.5, '#DE9C78'], [1, '#EDB98C']]); out.fillRect(0, 0, w, h); }
  glow(out, cx, 13.5 * u, 8 * u, COL ? '255,176,96' : '255,170,90', COL ? 0.5 : 0.2);
  const wallY = 7.4 * u;
  // arka duvar: ince pilastrlar ve çerçeveli mermer paneller
  layer(out, w, h, P([tint, 0.06], ['#E8BE9D', 1]), (c) => { c.fillRect(0, wallY, w, fy - wallY); });
  layer(out, w, h, P([tint, 0.15], ['#F3DDC7', 1]), (c) => {
    c.lineWidth = lw;
    for (const x of [0.55, 3.5, 7.5, 10.45]) {   // ince pilastrlar
      const px = x * u - 0.16 * u;
      c.fillRect(px, wallY + 0.5 * u, 0.32 * u, fy - wallY - 0.5 * u);
      c.fillRect(px - 0.1 * u, wallY + 0.4 * u, 0.52 * u, 0.12 * u); c.fillRect(px - 0.1 * u, fy - 0.2 * u, 0.52 * u, 0.2 * u);
    }
    c.fillRect(0, wallY, w, 0.16 * u); c.fillRect(0, wallY + 0.22 * u, w, 0.06 * u);   // korniş
  });
  // kapı: alınlıklı (ince çizgili), bronz kanatlı
  const dw = 2.6 * u, dx = cx - dw / 2, dTop = 10.0 * u;
  if (COL) {   // kapı açıklığı: iç ışık + bronz kanatlar
    out.fillStyle = vgrad(out, dTop, fy, [[0, '#FFD08A'], [1, '#E58C4C']]); out.fillRect(dx, dTop, dw, fy - dTop);
    out.fillStyle = '#7B5028'; out.fillRect(dx, dTop, dw * 0.44, fy - dTop); out.fillRect(dx + dw * 0.56, dTop, dw * 0.44, fy - dTop);
    out.fillStyle = '#C9A227'; for (let k = 0; k < 4; k++) for (const sx of [0.22, 0.78]) { out.fillRect(dx + dw * sx - 0.07 * u, dTop + 0.6 * u + k * 1.25 * u, 0.14 * u, 0.14 * u); }
  } else {
    const g = out.createLinearGradient(0, dTop, 0, fy); g.addColorStop(0, 'rgba(255,200,140,0.16)'); g.addColorStop(1, 'rgba(255,170,100,0.06)');
    out.fillStyle = g; out.fillRect(dx, dTop, dw, fy - dTop);
  }
  layer(out, w, h, P([tint, 0.2], ['#F6E5D2', 1]), (c) => {
    c.lineWidth = lw * 1.5; c.lineJoin = 'miter';
    c.fillRect(dx - 0.28 * u, dTop - 0.2 * u, 0.28 * u, fy - dTop + 0.2 * u); c.fillRect(dx + dw, dTop - 0.2 * u, 0.28 * u, fy - dTop + 0.2 * u);   // söveler
    c.fillRect(dx - 0.5 * u, dTop - 0.5 * u, dw + 1.0 * u, 0.3 * u);   // lento
    c.beginPath(); c.moveTo(dx - 0.7 * u, dTop - 0.55 * u); c.lineTo(cx, dTop - 2.0 * u); c.lineTo(dx + dw + 0.7 * u, dTop - 0.55 * u); c.stroke();   // alınlık (ince)
    c.beginPath(); c.moveTo(dx - 0.2 * u, dTop - 0.75 * u); c.lineTo(cx, dTop - 1.7 * u); c.lineTo(dx + dw + 0.2 * u, dTop - 0.75 * u); c.lineWidth = lw; c.stroke();
    c.beginPath(); c.arc(cx, dTop - 1.0 * u, 0.2 * u, 0, Math.PI * 2); c.fill();   // tympanum rozeti
  });
  // heykel nişleri (kemerli, içinde togalı heykel)
  for (const nx of [2.1, 8.9]) {
    const x = nx * u - 0.55 * u, nw = 1.1 * u, base = 12.4 * u, nh = 3.4 * u;
    layer(out, w, h, P([tint, 0.12], ['#6E3C2E', 0.85]), (c) => { c.beginPath(); archPath(c, x, base, nw, nh); c.fill(); });
    layer(out, w, h, P([tint, 0.18], ['#F3DDC7', 1]), (c) => {   // niş çerçevesi (ince)
      c.lineWidth = lw * 1.4; c.beginPath(); archPath(c, x - 0.1 * u, base + 0.1 * u, nw + 0.2 * u, nh + 0.2 * u); c.stroke();
      c.fillRect(x - 0.15 * u, base + 0.1 * u, nw + 0.3 * u, 0.16 * u);   // kaide
    });
    layer(out, w, h, P([tint, 0.2], ['#EFE0CC', 1]), (c) => {   // heykel
      const sx = nx * u;
      c.beginPath(); c.arc(sx, base - 2.15 * u, 0.2 * u, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(sx - 0.16 * u, base - 1.9 * u); c.lineTo(sx + 0.16 * u, base - 1.9 * u); c.lineTo(sx + 0.36 * u, base - 0.15 * u); c.lineTo(sx - 0.36 * u, base - 0.15 * u); c.closePath(); c.fill();
      c.fillRect(sx - 0.4 * u, base - 0.15 * u, 0.8 * u, 0.15 * u);
    });
  }
  // yanlarda kavisli kademeli sıralar (senatör sıraları)
  for (const side of [0, 1]) {
    layer(out, w, h, P([tint, 0.13], ['#EAD3BC', 1]), (c) => {
      c.save(); if (side) { c.translate(w, 0); c.scale(-1, 1); }
      for (let k = 3; k >= 0; k--) {
        const rx = (1.2 + 0.62 * k) * u, ry = (1.0 + 0.78 * k) * u;
        c.beginPath(); c.moveTo(0, fy); c.ellipse(0, fy, rx, ry, 0, 0, -Math.PI / 2, true); c.closePath();
        c.fillStyle = COL ? ['#F2E2CF', '#E7D2BB', '#DCC2A8', '#D0B297'][k] : '#fff'; c.fill();
        c.save(); c.globalCompositeOperation = COL ? 'source-over' : 'destination-out'; c.strokeStyle = COL ? '#9A6850' : '#000'; c.globalAlpha = COL ? 0.8 : 0.55; c.lineWidth = lw * 1.3; c.stroke(); c.restore();
      }
      c.restore();
    });
  }
  // mermaer zemin: opus sectile karolar + gün batımı yansıması
  layer(out, w, h, P([tint, 0.10], ['#C9987A', 1]), (c) => { c.fillRect(0, fy, w, h - fy); });
  layer(out, w, h, P([tint, 0.07], ['#EAD2B8', 0.9]), (c) => { const s = 0.9 * u; for (let y = fy; y < h; y += s) for (let x = ((((y - fy) / s) | 0) % 2) * s; x < w; x += 2 * s) c.fillRect(x, y, s, s); });
  out.fillStyle = vgrad(out, fy, h, [[0, COL ? 'rgba(255,190,110,0.35)' : 'rgba(255,175,100,0.10)'], [1, 'rgba(255,175,100,0)']]); out.fillRect(0, fy, w, h - fy);
}

// ---------- 3. Pantheon: gece ----------
function pantheon(out, w, h, u, COL) {
  const P = (m, c) => (COL ? c : m), tint = TINT[3], cx = w / 2, cy = 7.6 * u, R = 7.2 * u, r0 = 1.5 * u;
  const rings = [r0, 2.3 * u, 3.3 * u, 4.5 * u, 5.8 * u, 7.2 * u], N = 16;
  if (COL) {
    out.fillStyle = vgrad(out, 0, h, [[0, '#232B66'], [0.6, '#2B3475'], [1, '#3B4486']]); out.fillRect(0, 0, w, h);
    out.fillStyle = '#B7B8DC'; out.beginPath(); out.arc(cx, cy, R + 0.3 * u, 0, Math.PI * 2); out.fill();   // kubbe altın kemer araları
  }
  // oculus: gece gökyüzü, yıldızlar, ay
  out.save(); out.beginPath(); out.arc(cx, cy, r0, 0, Math.PI * 2); out.clip();
  out.fillStyle = COL ? vgrad(out, cy - r0, cy + r0, [[0, '#0A0F34'], [1, '#34479A']]) : 'rgba(205,220,255,0.30)'; out.fillRect(cx - r0, cy - r0, 2 * r0, 2 * r0);
  out.fillStyle = COL ? '#FFFFFF' : 'rgba(255,255,255,0.8)';
  for (const [sx, sy, sr] of [[-0.8, -0.6, 0.05], [0.5, -0.9, 0.04], [-0.2, 0.6, 0.045], [0.9, 0.3, 0.04], [-0.9, 0.2, 0.035]]) star(out, cx + sx * u, cy + sy * u, sr * u);
  out.fillStyle = COL ? '#F6F1D8' : 'rgba(255,252,235,0.85)'; star(out, cx + 0.35 * u, cy + 0.15 * u, 0.28 * u);   // ay
  out.restore();
  // kubbe kasetleri (kasetler boyalı)
  layer(out, w, h, P([tint, 0.13], ['#3C58B2', 1]), (c) => {
    for (let i = 0; i < rings.length - 1; i++) {
      const a = rings[i], b = rings[i + 1], pad = (b - a) * 0.16;
      for (let j = 0; j < N; j++) {
        const t0 = (j / N) * Math.PI * 2, t1 = ((j + 1) / N) * Math.PI * 2, dt = (t1 - t0) * 0.14;
        const ra = a + pad, rb = b - pad;
        c.beginPath(); c.arc(cx, cy, rb, t0 + dt * (b / rb) * 0.5, t1 - dt * 0.5); c.arc(cx, cy, ra, t1 - dt, t0 + dt, true); c.closePath(); c.fill();
      }
    }
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(cx, cy, r0 * 1.02, 0, Math.PI * 2); c.fill();
  });
  if (COL) {   // kaset içi altın rozetler
    out.fillStyle = '#D9B955';
    for (let i = 1; i < rings.length - 1; i++) { const rm = (rings[i] + rings[i + 1]) / 2; for (let j = 0; j < N; j++) { const t = ((j + 0.5) / N) * Math.PI * 2; star(out, cx + Math.cos(t) * rm, cy + Math.sin(t) * rm, (rings[i + 1] - rings[i]) * 0.1); } }
  }
  layer(out, w, h, P([tint, 0.05], ['#E4C877', 0.9]), (c) => { c.beginPath(); c.arc(cx, cy, R + 0.3 * u, 0, Math.PI * 2); c.arc(cx, cy, R * 0.99, 0, Math.PI * 2, true); c.fill(); });
  // oculus ışıması
  glow(out, cx, cy, r0 * 2.4, COL ? '215,228,255' : '220,230,255', COL ? 0.5 : 0.28);
  // ay ışığı huzmesi: oculus'tan aşağı genişler, alt yarıya inmeden söner (yığın sakin kalsın)
  const bm = out.createLinearGradient(0, cy, 0, 13.4 * u);
  bm.addColorStop(0, COL ? 'rgba(210,225,255,0.34)' : 'rgba(220,232,255,0.15)'); bm.addColorStop(1, 'rgba(210,225,255,0)');
  out.fillStyle = bm; out.beginPath();
  out.moveTo(cx - r0 * 0.9, cy); out.lineTo(cx + r0 * 0.9, cy); out.lineTo(cx + 3.4 * u, 13.4 * u); out.lineTo(cx - 3.4 * u, 13.4 * u); out.closePath(); out.fill();
  // köşelerde birkaç yıldız
  out.fillStyle = COL ? '#FFFFFF' : 'rgba(255,255,255,0.7)';
  for (const [sx, sy, sr] of [[0.7, 1.0, 0.07], [1.9, 2.5, 0.05], [9.8, 1.5, 0.06], [10.3, 3.3, 0.045], [8.9, 0.7, 0.05]]) star(out, sx * u, sy * u, sr * u);
  // alt duvar: sade, sakin; ince korniş ve zemin
  layer(out, w, h, P([tint, 0.05], ['#8C93C4', 0.75]), (c) => { c.fillRect(0, 14.4 * u, w, h - 14.4 * u); });
  layer(out, w, h, P([tint, 0.09], ['#C9CCE6', 0.9]), (c) => { c.fillRect(0, 14.4 * u, w, 0.14 * u); c.fillRect(0, 14.62 * u, w, 0.05 * u); });
  layer(out, w, h, P([tint, 0.05], ['#565D94', 1]), (c) => { c.fillRect(0, 16.4 * u, w, h - 16.4 * u); });
}

const DRAW = [forum, basilika, curia, pantheon];
const STRENGTH = [1, 0.8, 0.9, 0.8];   // sönük sürümde seviye başına genel şiddet
export function makeBackdrop(level, w, h, col) {
  const lv = Math.max(0, Math.min(3, level));
  const cv = mk(w, h), out = cv.getContext('2d'), u = cv.width / 11;
  const tmp = mk(w, h), tc = tmp.getContext('2d');
  DRAW[lv](tc, tmp.width, tmp.height, u, !!col);
  // üst kısmı sönükleştir: parçalar yukarıdan inerken zemine temiz okunur
  tc.globalCompositeOperation = 'destination-in';
  const m = tc.createLinearGradient(0, 0, 0, tmp.height);
  if (col) { m.addColorStop(0, 'rgba(0,0,0,0.5)'); m.addColorStop(0.3, 'rgba(0,0,0,0.85)'); m.addColorStop(0.5, 'rgba(0,0,0,1)'); }
  else { m.addColorStop(0, 'rgba(0,0,0,0.25)'); m.addColorStop(0.35, 'rgba(0,0,0,0.75)'); m.addColorStop(0.55, 'rgba(0,0,0,1)'); }
  m.addColorStop(1, 'rgba(0,0,0,1)');
  tc.fillStyle = m; tc.fillRect(0, 0, tmp.width, tmp.height);
  if (!col) out.globalAlpha = STRENGTH[lv];
  out.drawImage(tmp, 0, 0);
  return cv;
}
