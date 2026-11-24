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

// =====================================================================================================
// TAM RENKLİ sürümler: doygun, opak freskler (sönük sürümle aynı geometri; ışık sağdan/üstten, gölge solda)
// =====================================================================================================
function hgrad(c, x0, x1, stops) { const g = c.createLinearGradient(x0, 0, x1, 0); for (const [o, col] of stops) g.addColorStop(o, col); return g; }
function cyl(c, x, y, w, h, st) { c.fillStyle = hgrad(c, x, x + w, st); c.fillRect(x, y, w, h); }   // silindirik gölgeli dikdörtgen
function rr(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function ell(c, x, y, rx, ry, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
function cloud(c, x, y, s, col, a) { c.save(); c.globalAlpha = a; c.fillStyle = col; for (const [dx, dy, r] of [[0, 0, 1], [0.9, 0.15, 0.8], [-0.9, 0.2, 0.7], [1.7, 0.3, 0.55], [-1.6, 0.35, 0.5]]) { c.beginPath(); c.ellipse(x + dx * s, y + dy * s, r * s * 1.3, r * s * 0.55, 0, 0, Math.PI * 2); c.fill(); } c.restore(); }
function sclip(c, fn) { c.save(); c.beginPath(); fn(); c.clip(); }

function forumC(c, w, h, u) {
  const gy = 15.4 * u, lw = Math.max(1, u * 0.05);
  c.fillStyle = vgrad(c, 0, gy, [[0, '#1260C8'], [0.35, '#2F8DE6'], [0.7, '#78BFF2'], [1, '#FFD88A']]); c.fillRect(0, 0, w, h);
  glow(c, w * 0.72, 11.2 * u, 8 * u, '255,226,140', 0.9); glow(c, w * 0.72, 11.2 * u, 2.2 * u, '255,250,220', 0.9);
  cloud(c, 1.8 * u, 2.2 * u, 0.9 * u, '#FFFFFF', 0.95); cloud(c, 8.6 * u, 3.6 * u, 0.8 * u, '#FFF2DC', 0.9); cloud(c, 5.0 * u, 1.0 * u, 0.6 * u, '#FFFFFF', 0.8);
  // uzak binalar
  for (const [x, ww, hh] of [[-0.2, 3.1, 1.9], [6.6, 2.6, 1.6], [8.4, 3.0, 2.2]]) {
    cyl(c, x * u, gy - hh * u, ww * u, hh * u, [[0, '#C98E45'], [0.5, '#F0BE6A'], [1, '#FFD88A']]);
    c.fillStyle = '#D2542B'; c.beginPath(); c.moveTo((x - 0.15) * u, gy - hh * u); c.lineTo((x + ww / 2) * u, gy - (hh + 0.8) * u); c.lineTo((x + ww + 0.15) * u, gy - hh * u); c.closePath(); c.fill();
    c.fillStyle = '#A53A1C'; c.beginPath(); c.moveTo((x - 0.15) * u, gy - hh * u); c.lineTo((x + ww / 2) * u, gy - (hh + 0.8) * u); c.lineTo((x + ww / 2) * u, gy - hh * u); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(120,50,20,0.55)'; c.lineWidth = lw; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo((x - 0.15 + k * 0.1) * u, gy - hh * u - k * 0.02 * u); c.lineTo((x + ww + 0.15 - k * 0.1) * u, gy - hh * u - k * 0.02 * u); c.stroke(); }
    for (let k = 0; k < Math.floor(ww / 0.9); k++) rr(c, (x + 0.45 + k * 0.9) * u, gy - (hh - 0.5) * u, 0.3 * u, 0.55 * u, '#5A2E1A');
  }
  // selvi ağaçları ve şemsiye çamları
  const cyp = (x, hh, ww) => { c.fillStyle = hgrad(c, x - ww, x + ww, [[0, '#0B3D1E'], [0.55, '#1B7A36'], [1, '#3FA04A']]); c.beginPath(); c.moveTo(x, gy - hh); c.bezierCurveTo(x + ww * 1.3, gy - hh * 0.6, x + ww * 1.1, gy - hh * 0.1, x, gy); c.bezierCurveTo(x - ww * 1.1, gy - hh * 0.1, x - ww * 1.3, gy - hh * 0.6, x, gy - hh); c.fill(); };
  cyp(3.0 * u, 4.9 * u, 0.4 * u); cyp(9.75 * u, 5.6 * u, 0.45 * u); cyp(10.45 * u, 3.8 * u, 0.35 * u);
  const pine = (x, hh) => { c.strokeStyle = '#6B3E1E'; c.lineWidth = 0.22 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, gy); c.quadraticCurveTo(x - 0.15 * u, gy - hh * 0.5 * u, x + 0.1 * u, gy - hh * u); c.stroke(); ell(c, x + 0.1 * u, gy - hh * u - 0.1 * u, 1.35 * u, 0.5 * u, '#14702F'); ell(c, x + 0.3 * u, gy - hh * u - 0.3 * u, 1.0 * u, 0.38 * u, '#2E9A44'); ell(c, x + 0.5 * u, gy - hh * u - 0.42 * u, 0.6 * u, 0.2 * u, '#58BC55'); };
  pine(0.35 * u, 4.6);
  // kemer (Septimius Severus)
  const ax = 3.2 * u, aW = 6.2 * u, aH = 6.4 * u;
  const op = [[2.0, 2.2, 4.2], [0.45, 1.0, 2.5], [aW / u - 1.45, 1.0, 2.5]];
  cyl(c, ax, gy - aH, aW, aH, [[0, '#C98A3A'], [0.45, '#F2BE62'], [1, '#FFE08E']]);                         // gövde
  cyl(c, ax - 0.25 * u, gy - aH - 0.5 * u, aW + 0.5 * u, 0.5 * u, [[0, '#E1A64F'], [1, '#FFE9A8']]);           // korniş
  rr(c, ax - 0.25 * u, gy - aH, aW + 0.5 * u, 0.22 * u, 'rgba(70,30,10,0.55)');                                // korniş altı gölge
  cyl(c, ax + 0.3 * u, gy - aH - 1.3 * u, aW - 0.6 * u, 0.8 * u, [[0, '#D69A45'], [1, '#FFDF8C']]);            // attik
  rr(c, ax + 0.7 * u, gy - aH - 1.0 * u, aW - 1.4 * u, 0.28 * u, '#B8860B');
  c.fillStyle = '#5C3A0E'; for (let k = 0; k < 20; k++) c.fillRect(ax + (0.9 + k * 0.255) * u * (aW / (6.2 * u)), gy - aH - 0.95 * u, 0.12 * u, 0.18 * u);
  rr(c, ax - 0.25 * u, gy - aH - 1.35 * u + 0.05 * u, aW + 0.5 * u, 0.0, '#000');
  for (const [dx, ww2, hh] of op) {
    const x = ax + dx * u, wo = ww2 * u, ho = hh * u;
    sclip(c, () => archPath(c, x, gy, wo, ho));
    if (dx === 2.0) { c.fillStyle = vgrad(c, gy - ho, gy, [[0, '#3A8CE0'], [0.6, '#9ED2F4'], [1, '#FFD890']]); c.fillRect(x, gy - ho, wo, ho); rr(c, x, gy - ho, wo * 0.22, ho, 'rgba(60,25,10,0.5)'); }
    else { c.fillStyle = vgrad(c, gy - ho, gy, [[0, '#2A1610'], [1, '#6B3A1E']]); c.fillRect(x, gy - ho, wo, ho); }
    c.restore();
    c.strokeStyle = '#FFF1BA'; c.lineWidth = u * 0.12; c.beginPath(); archPath(c, x - 0.07 * u, gy, wo + 0.14 * u, ho + 0.07 * u); c.stroke();   // arşivolt (aydınlık)
    c.strokeStyle = 'rgba(90,40,10,0.7)'; c.lineWidth = lw * 1.2; c.beginPath(); archPath(c, x, gy, wo, ho); c.stroke();
  }
  cyl(c, ax + 0.3 * u, gy - aH + 0.2 * u, 0.8 * u, aH - 0.2 * u, [[0, '#A8682A'], [1, '#E3A650']]);              // gölge pilastrları
  cyl(c, ax + aW - 1.1 * u, gy - aH + 0.2 * u, 0.8 * u, aH - 0.2 * u, [[0, '#B8782F'], [1, '#F2C46A']]);
  // quadriga (altın)
  { const qx = ax + aW / 2, qy = gy - aH - 1.3 * u; c.fillStyle = hgrad(c, qx - 0.9 * u, qx + 0.9 * u, [[0, '#9A6B0A'], [0.5, '#FFD54A'], [1, '#FFF0A0']]);
    c.fillRect(qx - 0.9 * u, qy - 0.35 * u, 1.8 * u, 0.35 * u);
    for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(qx - 0.75 * u + i * 0.5 * u, qy - 0.35 * u, 0.22 * u, Math.PI, 0); c.fill(); c.fillRect(qx - 0.97 * u + i * 0.5 * u, qy - 0.7 * u, 0.1 * u, 0.2 * u); }
    c.fillRect(qx - 0.07 * u, qy - 0.95 * u, 0.14 * u, 0.6 * u); c.beginPath(); c.arc(qx, qy - 1.02 * u, 0.1 * u, 0, 7); c.fill(); }
  // gölgeler ve harap sütunlar
  const cols = [[0.9, 5.2], [2.2, 3.4], [8.3, 4.6], [9.6, 2.6]];
  c.fillStyle = 'rgba(90,45,15,0.35)'; for (const [cx, hh] of cols) { c.beginPath(); c.moveTo((cx - 0.1) * u, gy); c.lineTo((cx + 0.9) * u, gy); c.lineTo((cx - 0.9) * u, gy + 0.55 * u); c.lineTo((cx - 2.1) * u, gy + 0.55 * u); c.closePath(); c.fill(); }
  for (const [cx, hh] of cols) {
    const cw = 0.8 * u, x = cx * u, top = gy - hh * u;
    cyl(c, x, top, cw, hh * u, [[0, '#B87F3C'], [0.3, '#EFC273'], [0.7, '#FFE9B0'], [1, '#F0CC80']]);
    c.strokeStyle = 'rgba(120,70,25,0.45)'; c.lineWidth = lw; for (let i = 1; i < 4; i++) { const fx = x + cw * i / 4; c.beginPath(); c.moveTo(fx, top + 0.1 * u); c.lineTo(fx, gy); c.stroke(); }
    cyl(c, x - 0.12 * u, gy - 0.35 * u, cw + 0.24 * u, 0.35 * u, [[0, '#B07838'], [1, '#FFDF9A']]);
    if (hh > 4) { cyl(c, x - 0.18 * u, top - 0.3 * u, cw + 0.36 * u, 0.3 * u, [[0, '#C08840'], [1, '#FFE6A8']]); cyl(c, x - 0.3 * u, top - 0.6 * u, cw + 0.6 * u, 0.3 * u, [[0, '#D09A4C'], [1, '#FFF0C0']]); }
    else { c.fillStyle = '#C48A42'; c.beginPath(); c.moveTo(x, top); c.lineTo(x + cw * 0.4, top - 0.25 * u); c.lineTo(x + cw * 0.7, top + 0.1 * u); c.lineTo(x + cw, top - 0.15 * u); c.lineTo(x + cw, top + 0.4 * u); c.lineTo(x, top + 0.4 * u); c.fill(); }
  }
  cyl(c, 0.7 * u, gy - 6.2 * u, 2.6 * u, 0.4 * u, [[0, '#C08840'], [0.6, '#F6D080'], [1, '#FFF0C0']]); rr(c, 0.7 * u, gy - 5.8 * u, 2.6 * u, 0.14 * u, 'rgba(90,45,15,0.5)');
  // zemin: sıcak traverten
  c.fillStyle = vgrad(c, gy, h, [[0, '#F0C070'], [0.5, '#D99A48'], [1, '#B8742E']]); c.fillRect(0, gy, w, h - gy);
  c.strokeStyle = 'rgba(110,60,20,0.5)'; c.lineWidth = lw * 1.2;
  for (let i = 1; i < 7; i++) { const y = gy + i * i * 0.1 * u + i * 0.25 * u; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  for (let i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(w / 2 + i * 0.9 * u, gy); c.lineTo(w / 2 + i * 2.0 * u, h); c.stroke(); }
  rr(c, 0, gy, w, 0.12 * u, 'rgba(255,240,190,0.7)');
}

function basilikaC(c, w, h, u) {
  const fy = 16.0 * u, n = 3, aw = (w - 0.6 * u) / n, lw = Math.max(1, u * 0.05);
  // altın kasetli tavan
  c.fillStyle = vgrad(c, 0, 5.6 * u, [[0, '#E8B830'], [1, '#B8860B']]); c.fillRect(0, 0, w, 5.8 * u);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
    const x = i * (w / 6) + 0.18 * u, y = 0.4 * u + r * 1.65 * u, cw = w / 6 - 0.36 * u;
    rr(c, x - 0.08 * u, y - 0.08 * u, cw + 0.16 * u, 1.56 * u, '#FFE27A');
    c.fillStyle = vgrad(c, y, y + 1.4 * u, [[0, '#6E0F1C'], [1, '#B3202E']]); c.fillRect(x, y, cw, 1.4 * u);
    rr(c, x, y, cw, 0.14 * u, 'rgba(0,0,0,0.35)'); rr(c, x, y + 1.3 * u, cw, 0.1 * u, 'rgba(255,200,120,0.5)');
    const rg = c.createRadialGradient(x + cw / 2 - 0.05 * u, y + 0.65 * u, 0, x + cw / 2, y + 0.7 * u, 0.32 * u); rg.addColorStop(0, '#FFF4A8'); rg.addColorStop(1, '#D9A010'); c.fillStyle = rg; c.beginPath(); c.arc(x + cw / 2, y + 0.7 * u, 0.3 * u, 0, 7); c.fill();
  }
  // klerestori: duvar + koyu mavi vitray pencereler, parlak gökyüzü
  c.fillStyle = vgrad(c, 5.6 * u, 8.4 * u, [[0, '#F4DDA4'], [1, '#D9B070']]); c.fillRect(0, 5.6 * u, w, 2.8 * u);
  rr(c, 0, 5.6 * u, w, 0.14 * u, '#FFF0B8');
  for (let i = 0; i < 4; i++) {
    const wx = (i + 0.5) * (w / 4) - 0.5 * u;
    sclip(c, () => archPath(c, wx, 8.0 * u, 1.0 * u, 2.1 * u));
    c.fillStyle = vgrad(c, 5.9 * u, 8.0 * u, [[0, '#0B3FAE'], [0.5, '#2F86F0'], [1, '#B8E4FF']]); c.fillRect(wx, 5.8 * u, 1.0 * u, 2.3 * u);
    rr(c, wx + 0.45 * u, 5.8 * u, 0.1 * u, 2.3 * u, 'rgba(255,230,160,0.9)'); rr(c, wx, 7.0 * u, 1.0 * u, 0.08 * u, 'rgba(255,230,160,0.9)');
    c.restore(); c.strokeStyle = '#8B5A1E'; c.lineWidth = u * 0.1; c.beginPath(); archPath(c, wx, 8.0 * u, 1.0 * u, 2.1 * u); c.stroke();
    c.strokeStyle = '#FFE8A0'; c.lineWidth = lw; c.beginPath(); archPath(c, wx + 0.06 * u, 8.0 * u, 0.88 * u, 2.0 * u); c.stroke();
  }
  // galeri cephesi: kalın mermer duvar, kemerli açıklıklar
  c.fillStyle = vgrad(c, 8.4 * u, fy, [[0, '#F7E0A8'], [1, '#D9A860']]); c.fillRect(0, 8.4 * u, w, fy - 8.4 * u);
  rr(c, 0, 8.4 * u, w, 0.3 * u, '#B07A2E'); rr(c, 0, 8.4 * u, w, 0.1 * u, '#FFF0B8'); rr(c, 0, 8.7 * u, w, 0.14 * u, 'rgba(90,40,10,0.45)');
  for (let i = 0; i < n; i++) {
    const x = 0.3 * u + i * aw + 0.55 * u, wo = aw - 1.1 * u;
    sclip(c, () => archPath(c, x, fy, wo, 6.6 * u));
    c.fillStyle = vgrad(c, 8.9 * u, fy, [[0, '#3A0F1C'], [0.5, '#7A2A28'], [1, '#C0653A']]); c.fillRect(x, 8.9 * u, wo, fy - 8.9 * u);
    c.restore();
    sclip(c, () => archPath(c, x + 0.5 * u, fy, wo - 1.0 * u, 5.4 * u));
    c.fillStyle = vgrad(c, 9.5 * u, fy, [[0, '#1E0A18'], [1, '#8A3A2A']]); c.fillRect(x + 0.5 * u, 9.5 * u, wo, fy - 9.5 * u); c.restore();
    c.strokeStyle = '#FFE7A0'; c.lineWidth = u * 0.12; c.beginPath(); archPath(c, x - 0.06 * u, fy, wo + 0.12 * u, 6.6 * u + 0.06 * u); c.stroke();
    c.strokeStyle = 'rgba(80,35,10,0.7)'; c.lineWidth = lw * 1.3; c.beginPath(); archPath(c, x, fy, wo, 6.6 * u); c.stroke();
  }
  // polikrom sütunlar: porfir (kırmızı) ve serpantin (yeşil)
  const shaft = (x, y, ww, hh, a, b, d) => {
    c.fillStyle = hgrad(c, x, x + ww, [[0, a], [0.35, b], [0.7, d], [1, a]]); c.fillRect(x, y, ww, hh);
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = lw; for (let k = 1; k < 5; k++) { const fx = x + ww * k / 5; c.beginPath(); c.moveTo(fx, y); c.lineTo(fx, y + hh); c.stroke(); }
    cyl(c, x - 0.18 * u, y - 0.32 * u, ww + 0.36 * u, 0.34 * u, [[0, '#B8860B'], [0.6, '#FFDC62'], [1, '#FFF4B0']]);
    cyl(c, x - 0.15 * u, y + hh - 0.3 * u, ww + 0.3 * u, 0.3 * u, [[0, '#B8860B'], [0.6, '#FFDC62'], [1, '#FFF4B0']]);
  };
  for (let i = 1; i < n; i++) shaft(0.3 * u + i * aw - 0.38 * u, 9.0 * u, 0.76 * u, fy - 9.3 * u, '#6E0C16', '#D8343C', '#9A1824');
  for (const x of [0.15 * u, w - 1.05 * u]) shaft(x, 7.8 * u, 0.9 * u, fy - 8.1 * u, '#0A3A24', '#2FAE6A', '#126B3D');
  // öğle ışık hüzmeleri (parlak, sıcak)
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const wx = (i + 0.5) * (w / 4), g = c.createLinearGradient(wx, 8 * u, wx + 2.2 * u, fy);
    g.addColorStop(0, 'rgba(255,236,150,0.55)'); g.addColorStop(1, 'rgba(255,220,120,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(wx - 0.45 * u, 8.2 * u); c.lineTo(wx + 0.45 * u, 8.2 * u); c.lineTo(wx + 3.2 * u, fy); c.lineTo(wx + 1.4 * u, fy); c.fill();
  }
  c.restore();
  // opus sectile zemin (perspektif; kırmızı / yeşil / krem)
  c.fillStyle = '#F0E2BE'; c.fillRect(0, fy, w, h - fy);
  const rows = 5, cols = 10, H2 = h - fy;
  for (let r = 0; r < rows; r++) {
    const t0 = r / rows, t1 = (r + 1) / rows, y0 = fy + H2 * t0 * t0 * 0.6 + H2 * t0 * 0.4, y1 = fy + H2 * t1 * t1 * 0.6 + H2 * t1 * 0.4;
    const sc0 = 0.55 + 1.6 * t0, sc1 = 0.55 + 1.6 * t1, cw0 = (w / (cols - 2)) * sc0 * 0.55, cw1 = (w / (cols - 2)) * sc1 * 0.55;
    for (let i = -cols; i < cols; i++) {
      const xa0 = w / 2 + i * cw0, xb0 = w / 2 + (i + 1) * cw0, xa1 = w / 2 + i * cw1, xb1 = w / 2 + (i + 1) * cw1;
      if (xb0 < 0 && xb1 < 0 || xa0 > w && xa1 > w) continue;
      const k = (((i + r) % 3) + 3) % 3, base = k === 0 ? '#B4281F' : k === 1 ? '#1F8A55' : '#F6E8C4';
      c.fillStyle = base; c.beginPath(); c.moveTo(xa0, y0); c.lineTo(xb0, y0); c.lineTo(xb1, y1); c.lineTo(xa1, y1); c.closePath(); c.fill();
      if (k === 2) { c.fillStyle = (i + r) % 2 ? '#C99A2E' : '#B4281F'; const mx = (xa0 + xb0 + xa1 + xb1) / 4, my = (y0 + y1) / 2; c.beginPath(); c.ellipse(mx, my, (cw0 + cw1) * 0.17, (y1 - y0) * 0.28, 0, 0, 7); c.fill(); }
      c.strokeStyle = 'rgba(255,230,160,0.9)'; c.lineWidth = lw * 1.2; c.stroke();
    }
  }
  const fg = c.createLinearGradient(0, fy, 0, fy + 1.0 * u); fg.addColorStop(0, 'rgba(70,25,10,0.45)'); fg.addColorStop(1, 'rgba(70,25,10,0)'); c.fillStyle = fg; c.fillRect(0, fy, w, 1.0 * u);
  c.save(); c.globalCompositeOperation = 'lighter'; glow(c, w / 2, fy + 1.4 * u, 5 * u, '255,225,140', 0.35); c.restore();
}

function curiaC(c, w, h, u) {
  const fy = 16.2 * u, cx = w / 2, lw = Math.max(1, u * 0.055), wallY = 7.4 * u;
  c.fillStyle = vgrad(c, 0, wallY + 2 * u, [[0, '#7A2E9A'], [0.3, '#E8456E'], [0.65, '#FF8A4A'], [1, '#FFC860']]); c.fillRect(0, 0, w, h);
  glow(c, cx, 7.2 * u, 6 * u, '255,226,140', 0.85);
  cloud(c, 2.2 * u, 2.4 * u, 1.0 * u, '#FFB0A0', 0.85); cloud(c, 8.8 * u, 3.8 * u, 0.9 * u, '#FF9A8A', 0.85); cloud(c, 5.4 * u, 5.4 * u, 0.8 * u, '#FFD890', 0.8); cloud(c, 7.6 * u, 1.0 * u, 0.6 * u, '#D060A0', 0.7);
  // arka duvar: zengin kırmızı mermer
  c.fillStyle = vgrad(c, wallY, fy, [[0, '#C23050'], [1, '#8E1F3C']]); c.fillRect(0, wallY, w, fy - wallY);
  // çerçeveli pembe paneller (altın çerçeve)
  for (const [x0, x1] of [[0.95, 3.05], [3.95, 4.9], [6.1, 7.05], [7.95, 10.05]]) {
    const px = x0 * u, pw = (x1 - x0) * u, py = wallY + 0.9 * u, ph = fy - wallY - 1.8 * u;
    rr(c, px - 0.07 * u, py - 0.07 * u, pw + 0.14 * u, ph + 0.14 * u, '#E3B83A');
    c.fillStyle = vgrad(c, py, py + ph, [[0, '#F58AA8'], [1, '#D2506E']]); c.fillRect(px, py, pw, ph);
    c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = lw; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(px + pw * (0.2 + k * 0.3), py); c.bezierCurveTo(px + pw * (0.5 + k * 0.1), py + ph * 0.3, px + pw * (0.1 + k * 0.3), py + ph * 0.6, px + pw * (0.4 + k * 0.2), py + ph); c.stroke(); }
  }
  // yeşil (verde antico) pilastrlar, altın başlık/kaide
  for (const x of [0.55, 3.5, 7.5, 10.45]) {
    const px = x * u - 0.16 * u;
    cyl(c, px, wallY + 0.5 * u, 0.32 * u, fy - wallY - 0.5 * u, [[0, '#0E5A34'], [0.5, '#2FB070'], [1, '#146B3E']]);
    cyl(c, px - 0.1 * u, wallY + 0.4 * u, 0.52 * u, 0.14 * u, [[0, '#B8860B'], [1, '#FFE070']]); cyl(c, px - 0.1 * u, fy - 0.2 * u, 0.52 * u, 0.2 * u, [[0, '#B8860B'], [1, '#FFE070']]);
  }
  cyl(c, 0, wallY, w, 0.18 * u, [[0, '#B8860B'], [0.5, '#FFE070'], [1, '#C9971C']]); rr(c, 0, wallY + 0.18 * u, w, 0.1 * u, 'rgba(60,10,20,0.6)');
  // kapı: bronz kanatlar, altın perçinler, sıcak iç ışık
  const dw = 2.6 * u, dx = cx - dw / 2, dTop = 10.0 * u;
  c.fillStyle = vgrad(c, dTop, fy, [[0, '#FFE8A0'], [1, '#FF9A50']]); c.fillRect(dx, dTop, dw, fy - dTop);
  for (const sx of [0, 0.56]) {
    c.fillStyle = hgrad(c, dx + dw * sx, dx + dw * (sx + 0.44), sx ? [[0, '#E8A850'], [0.5, '#A8662A'], [1, '#6A3A14']] : [[0, '#6A3A14'], [0.5, '#A8662A'], [1, '#E8A850']]); c.fillRect(dx + dw * sx, dTop, dw * 0.44, fy - dTop);
    c.strokeStyle = 'rgba(255,220,130,0.7)'; c.lineWidth = lw * 1.3; for (let k = 0; k < 4; k++) c.strokeRect(dx + dw * sx + dw * 0.05, dTop + 0.35 * u + k * 1.3 * u, dw * 0.34, 1.05 * u);
  }
  for (let k = 0; k < 4; k++) for (const sx of [0.22, 0.78]) { const rg = c.createRadialGradient(dx + dw * sx - 0.02 * u, dTop + 0.55 * u + k * 1.3 * u - 0.02 * u, 0, dx + dw * sx, dTop + 0.6 * u + k * 1.3 * u, 0.1 * u); rg.addColorStop(0, '#FFFBD0'); rg.addColorStop(1, '#D9A010'); c.fillStyle = rg; c.beginPath(); c.arc(dx + dw * sx, dTop + 0.6 * u + k * 1.3 * u, 0.09 * u, 0, 7); c.fill(); }
  // söveler, lento, alınlık (beyaz-pembe mermer, altın)
  cyl(c, dx - 0.28 * u, dTop - 0.2 * u, 0.28 * u, fy - dTop + 0.2 * u, [[0, '#E8C8C0'], [1, '#FFF4EC']]); cyl(c, dx + dw, dTop - 0.2 * u, 0.28 * u, fy - dTop + 0.2 * u, [[0, '#E8C8C0'], [1, '#FFF4EC']]);
  cyl(c, dx - 0.5 * u, dTop - 0.5 * u, dw + 1.0 * u, 0.3 * u, [[0, '#F8E8E0'], [1, '#FFFFFF']]);
  c.fillStyle = '#FFF2EA'; c.beginPath(); c.moveTo(dx - 0.7 * u, dTop - 0.5 * u); c.lineTo(cx, dTop - 2.0 * u); c.lineTo(dx + dw + 0.7 * u, dTop - 0.5 * u); c.closePath(); c.fill();
  c.fillStyle = '#B8284A'; c.beginPath(); c.moveTo(dx - 0.2 * u, dTop - 0.75 * u); c.lineTo(cx, dTop - 1.7 * u); c.lineTo(dx + dw + 0.2 * u, dTop - 0.75 * u); c.closePath(); c.fill();
  c.strokeStyle = '#E3B83A'; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(dx - 0.7 * u, dTop - 0.5 * u); c.lineTo(cx, dTop - 2.0 * u); c.lineTo(dx + dw + 0.7 * u, dTop - 0.5 * u); c.closePath(); c.stroke();
  { const rg = c.createRadialGradient(cx - 0.05 * u, dTop - 1.05 * u, 0, cx, dTop - 1.0 * u, 0.25 * u); rg.addColorStop(0, '#FFF6B0'); rg.addColorStop(1, '#D9A010'); c.fillStyle = rg; c.beginPath(); c.arc(cx, dTop - 1.0 * u, 0.22 * u, 0, 7); c.fill(); }
  // nişler: koyu iç, togalı mermer heykel (beyaz, mavi gölge)
  for (const nx of [2.1, 8.9]) {
    const x = nx * u - 0.55 * u, nw = 1.1 * u, base = 12.4 * u, nh = 3.4 * u, sx = nx * u;
    sclip(c, () => archPath(c, x, base, nw, nh)); c.fillStyle = vgrad(c, base - nh, base, [[0, '#2A0A1C'], [1, '#6A2038']]); c.fillRect(x, base - nh, nw, nh); c.restore();
    c.strokeStyle = '#E3B83A'; c.lineWidth = lw * 2.2; c.beginPath(); archPath(c, x - 0.1 * u, base + 0.1 * u, nw + 0.2 * u, nh + 0.2 * u); c.stroke();
    cyl(c, x - 0.15 * u, base + 0.1 * u, nw + 0.3 * u, 0.2 * u, [[0, '#E8C8C0'], [1, '#FFFFFF']]);
    cyl(c, sx - 0.4 * u, base - 0.15 * u, 0.8 * u, 0.25 * u, [[0, '#9AB0E0'], [0.5, '#F4F6FF'], [1, '#FFFFFF']]);
    const body = () => { c.beginPath(); c.moveTo(sx - 0.16 * u, base - 1.9 * u); c.lineTo(sx + 0.16 * u, base - 1.9 * u); c.lineTo(sx + 0.36 * u, base - 0.15 * u); c.lineTo(sx - 0.36 * u, base - 0.15 * u); c.closePath(); };
    c.fillStyle = hgrad(c, sx - 0.36 * u, sx + 0.36 * u, [[0, '#7F96D8'], [0.45, '#DCE6FA'], [1, '#FFFFFF']]); body(); c.fill();
    c.fillStyle = hgrad(c, sx - 0.2 * u, sx + 0.2 * u, [[0, '#B4C4EC'], [1, '#FFFFFF']]); c.beginPath(); c.arc(sx, base - 2.15 * u, 0.2 * u, 0, 7); c.fill();
    c.strokeStyle = 'rgba(70,90,170,0.75)'; c.lineWidth = lw * 1.3; for (const o of [-0.16, 0.0, 0.14]) { c.beginPath(); c.moveTo(sx + o * u, base - 1.8 * u); c.lineTo(sx + o * 1.8 * u, base - 0.2 * u); c.stroke(); }
  }
  // kavisli sıralar: sıcak ahşap ve mermer dönüşümlü
  for (const side of [0, 1]) {
    c.save(); if (side) { c.translate(w, 0); c.scale(-1, 1); }
    for (let k = 3; k >= 0; k--) {
      const rx = (1.2 + 0.62 * k) * u, ry = (1.0 + 0.78 * k) * u;
      c.beginPath(); c.moveTo(0, fy); c.ellipse(0, fy, rx, ry, 0, 0, -Math.PI / 2, true); c.closePath();
      c.fillStyle = vgrad(c, fy - ry, fy, k % 2 ? [[0, '#F6D8C8'], [1, '#D8A890']] : [[0, '#D88A44'], [1, '#8A4A20']]); c.fill();
      c.strokeStyle = '#4A1C10'; c.globalAlpha = 0.8; c.lineWidth = lw * 1.5; c.stroke(); c.globalAlpha = 1;
      c.save(); c.clip(); c.strokeStyle = 'rgba(255,230,170,0.5)'; c.lineWidth = lw; c.beginPath(); c.ellipse(0, fy, rx - 0.06 * u, ry - 0.06 * u, 0, 0, -Math.PI / 2, true); c.stroke(); c.restore();
    }
    c.restore();
  }
  // mermer zemin: pembe/krem/yeşil karolar + gün batımı yansıması
  c.fillStyle = '#F0C0A8'; c.fillRect(0, fy, w, h - fy);
  const s = 0.9 * u; let ri = 0;
  for (let y = fy; y < h; y += s, ri++) for (let x = 0, ci = 0; x < w + s; x += s, ci++) { const k = (ri + ci) % 2; c.fillStyle = k ? '#F8E4CC' : (ci % 4 === 0 ? '#2F9A62' : '#D8607A'); c.fillRect(x, y, s, s); }
  c.strokeStyle = 'rgba(120,50,40,0.55)'; c.lineWidth = lw; for (let y = fy; y < h; y += s) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } for (let x = 0; x < w; x += s) { c.beginPath(); c.moveTo(x, fy); c.lineTo(x, h); c.stroke(); }
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = vgrad(c, fy, h, [[0, 'rgba(255,170,90,0.5)'], [1, 'rgba(255,170,90,0)']]); c.fillRect(0, fy, w, h - fy); c.restore();
  rr(c, 0, fy - 0.06 * u, w, 0.14 * u, '#E3B83A');
}

function pantheonC(c, w, h, u) {
  const cx = w / 2, cy = 7.6 * u, R = 7.2 * u, r0 = 1.5 * u, lw = Math.max(1, u * 0.05);
  const rings = [r0, 2.3 * u, 3.3 * u, 4.5 * u, 5.8 * u, 7.2 * u], N = 16;
  c.fillStyle = vgrad(c, 0, h, [[0, '#0E1458'], [0.6, '#1C2A8E'], [1, '#27369E']]); c.fillRect(0, 0, w, h);
  for (const [sx, sy, sr] of [[0.7, 1.0, 0.07], [1.9, 2.5, 0.05], [9.8, 1.5, 0.06], [10.3, 3.3, 0.045], [8.9, 0.7, 0.05], [0.5, 4.2, 0.045], [10.5, 5.2, 0.05]]) { c.fillStyle = '#FFFFFF'; star(c, sx * u, sy * u, sr * u); }
  // kubbe: altın kenar, lapis kasetler
  c.fillStyle = '#E8C050'; c.beginPath(); c.arc(cx, cy, R + 0.3 * u, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#0F1A78'; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i], b = rings[i + 1], pad = (b - a) * 0.16, ra = a + pad, rb = b - pad;
    for (let j = 0; j < N; j++) {
      const t0 = (j / N) * Math.PI * 2, t1 = ((j + 1) / N) * Math.PI * 2, dt = (t1 - t0) * 0.14;
      const path = () => { c.beginPath(); c.arc(cx, cy, rb, t0 + dt * (b / rb) * 0.5, t1 - dt * 0.5); c.arc(cx, cy, ra, t1 - dt, t0 + dt, true); c.closePath(); };
      const tm = (t0 + t1) / 2, lx = cx + Math.cos(tm) * (ra + rb) / 2, ly = cy + Math.sin(tm) * (ra + rb) / 2;
      const lit = 0.5 + 0.5 * Math.cos(tm + Math.PI / 4);   // sağ-üstten ışık
      path(); c.fillStyle = `rgb(${(26 + 24 * lit) | 0},${(50 + 64 * lit) | 0},${(150 + 90 * lit) | 0})`; c.fill();
      path(); c.strokeStyle = '#F2CC5C'; c.lineWidth = lw * 1.4; c.stroke();
      c.fillStyle = '#FFE27A'; star(c, lx, ly, (b - a) * 0.11);
      c.fillStyle = '#9A6A08'; star(c, lx + 0.02 * u, ly + 0.02 * u, (b - a) * 0.05);
    }
  }
  // oculus: gece gökyüzü, ay
  c.save(); c.beginPath(); c.arc(cx, cy, r0, 0, Math.PI * 2); c.clip();
  c.fillStyle = vgrad(c, cy - r0, cy + r0, [[0, '#0A1050'], [1, '#4A68D0']]); c.fillRect(cx - r0, cy - r0, 2 * r0, 2 * r0);
  c.fillStyle = '#FFFFFF'; for (const [sx, sy, sr] of [[-0.8, -0.6, 0.05], [0.5, -0.9, 0.04], [-0.2, 0.6, 0.045], [0.9, 0.3, 0.04], [-0.9, 0.2, 0.035]]) star(c, cx + sx * u, cy + sy * u, sr * u);
  glow(c, cx + 0.35 * u, cy + 0.15 * u, 0.8 * u, '230,238,255', 0.8); c.fillStyle = '#FFFBE0'; star(c, cx + 0.35 * u, cy + 0.15 * u, 0.28 * u);
  c.restore(); c.strokeStyle = '#F2CC5C'; c.lineWidth = lw * 3; c.beginPath(); c.arc(cx, cy, r0, 0, Math.PI * 2); c.stroke();
  // dolgu: kubbe kenarda koyulaşır
  { const rg = c.createRadialGradient(cx, cy, r0, cx, cy, R + 0.3 * u); rg.addColorStop(0, 'rgba(180,205,255,0.35)'); rg.addColorStop(0.5, 'rgba(120,150,255,0)'); rg.addColorStop(1, 'rgba(0,0,40,0.45)'); c.fillStyle = rg; c.beginPath(); c.arc(cx, cy, R + 0.3 * u, 0, Math.PI * 2); c.arc(cx, cy, r0 * 1.02, 0, Math.PI * 2, true); c.fill('evenodd'); }
  // ay ışığı: gümüş-beyaz huzme
  c.save(); c.globalCompositeOperation = 'lighter';
  const bm = c.createLinearGradient(0, cy, 0, 14.4 * u); bm.addColorStop(0, 'rgba(235,242,255,0.34)'); bm.addColorStop(0.6, 'rgba(210,225,255,0.14)'); bm.addColorStop(1, 'rgba(200,220,255,0.06)');
  c.fillStyle = bm; c.beginPath(); c.moveTo(cx - r0 * 0.95, cy); c.lineTo(cx + r0 * 0.95, cy); c.lineTo(cx + 3.6 * u, 14.4 * u); c.lineTo(cx - 3.6 * u, 14.4 * u); c.closePath(); c.fill();
  glow(c, cx, cy, r0 * 2.2, '215,228,255', 0.3); c.restore();
  // alt duvar (ekzedra): renkli mermer, nişler ve meşale ışığı
  c.fillStyle = vgrad(c, 14.4 * u, 16.4 * u, [[0, '#6A2C7E'], [1, '#3A1860']]); c.fillRect(0, 14.4 * u, w, 2.0 * u);
  cyl(c, 0, 14.4 * u, w, 0.18 * u, [[0, '#B8860B'], [0.5, '#FFE27A'], [1, '#C9971C']]); rr(c, 0, 14.58 * u, w, 0.08 * u, 'rgba(10,0,40,0.55)');
  for (let i = 0; i < 5; i++) {
    const nx = (i + 0.5) * w / 5, nw = 1.1 * u, nh = 1.7 * u, x = nx - nw / 2, by = 16.4 * u;
    sclip(c, () => archPath(c, x, by, nw, nh)); c.fillStyle = vgrad(c, by - nh, by, [[0, '#2A0C10'], [1, '#6A2A14']]); c.fillRect(x, by - nh, nw, nh);
    c.globalCompositeOperation = 'lighter'; glow(c, nx, by - 0.5 * u, 1.1 * u, '255,150,50', 0.8); c.globalCompositeOperation = 'source-over'; c.restore();
    c.strokeStyle = '#F2CC5C'; c.lineWidth = lw * 1.6; c.beginPath(); archPath(c, x, by, nw, nh); c.stroke();
    // mum/meşale alevi
    rr(c, nx - 0.04 * u, by - 0.7 * u, 0.08 * u, 0.35 * u, '#E8D8B0');
    c.fillStyle = '#FF7A1A'; c.beginPath(); c.ellipse(nx, by - 0.86 * u, 0.1 * u, 0.2 * u, 0, 0, 7); c.fill(); c.fillStyle = '#FFE070'; c.beginPath(); c.ellipse(nx, by - 0.82 * u, 0.05 * u, 0.12 * u, 0, 0, 7); c.fill();
  }
  c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) glow(c, (i + 0.5) * w / 5, 16.0 * u, 1.8 * u, '255,140,50', 0.35); c.restore();
  // renkli mermer zemin
  c.fillStyle = '#7A2335'; c.fillRect(0, 16.4 * u, w, h - 16.4 * u);
  const s = 0.9 * u; let ri = 0;
  for (let y = 16.4 * u; y < h; y += s, ri++) for (let x = 0, ci = 0; x < w + s; x += s, ci++) { const k = (ri + ci) % 2; c.fillStyle = k ? '#E6D4A0' : (ci % 3 === 0 ? '#2A7A56' : '#8E2A3E'); c.fillRect(x, y, s, s); }
  c.strokeStyle = 'rgba(40,10,30,0.6)'; c.lineWidth = lw; for (let y = 16.4 * u; y < h; y += s) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } for (let x = 0; x < w; x += s) { c.beginPath(); c.moveTo(x, 16.4 * u); c.lineTo(x, h); c.stroke(); }
  c.save(); c.globalCompositeOperation = 'lighter'; const pg = c.createRadialGradient(cx, 16.9 * u, 0, cx, 16.9 * u, 4.2 * u); pg.addColorStop(0, 'rgba(210,225,255,0.55)'); pg.addColorStop(1, 'rgba(210,225,255,0)'); c.setTransform(1, 0, 0, 0.38, 0, 16.9 * u * 0.62); c.fillStyle = pg; c.fillRect(0, 12 * u, w, 10 * u); c.restore();
  rr(c, 0, 16.4 * u - 0.05 * u, w, 0.12 * u, '#F2CC5C');
}

const DRAW = [forum, basilika, curia, pantheon];
const DRAWC = [forumC, basilikaC, curiaC, pantheonC];
const STRENGTH = [1, 0.8, 0.9, 0.8];   // sönük sürümde seviye başına genel şiddet
export function makeBackdrop(level, w, h, col) {
  const lv = Math.max(0, Math.min(3, level));
  const cv = mk(w, h), out = cv.getContext('2d'), u = cv.width / 11;
  const tmp = mk(w, h), tc = tmp.getContext('2d');
  if (col) DRAWC[lv](tc, tmp.width, tmp.height, u); else DRAW[lv](tc, tmp.width, tmp.height, u, false);
  // üst kısmı sönükleştir: parçalar yukarıdan inerken zemine temiz okunur
  if (col) { out.drawImage(tmp, 0, 0); return cv; }   // renkli sürüm: tam opak fresk
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
