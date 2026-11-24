// Lex Stack - Roma mekân arka planları (seviye başına bir kez, ofscreen tuvale çizilir; render.js önbelleğe alır)
// Her mekân iki sürümde çizilir (aynı geometri): sönük ton (zemin rengi üstünde düşük kontrast) ve TAM RENKLİ sürüm
// ("Roma'yı yeniden inşa et": satır sildikçe renkli sürüm aşağıdan yukarı açığa çıkar).
// Gün döngüsü (8 mekân): Forum şafak, Bazilika kuşluk, Rostra öğle, Tabularium öğleden sonra, Curia gün batımı, Capitolium altın saat, Palatium alacakaranlık, Pantheon gece.
const TINT = ['#FFEFD2', '#FFF6D8', '#FFF0D0', '#F2E2B8', '#FFD3AC', '#FFE2A0', '#D4C0F8', '#B4C2FF'];

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
  const P = (m, c) => (COL ? c : m), tint = TINT[4], fy = 16.2 * u, cx = w / 2;
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
  const P = (m, c) => (COL ? c : m), tint = TINT[7], cx = w / 2, cy = 7.6 * u, R = 7.2 * u, r0 = 1.5 * u;
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

// =====================================================================================================
// YENİ MEKÂNLAR (2 Rostra, 3 Tabularium, 5 Capitolium, 6 Palatium): tek fresk çizimi; sönük sürüm bu çizimden türetilir
// (gökyüzü hariç yapı, parlaklığa göre düşük saydamlıkta tek tonla boyanır: mevcut sönük mekânlarla aynı dil).
// =====================================================================================================
function mutedFrom(fn, tint, amp, extra) {
  const t3 = [1, 3, 5].map((i) => parseInt(tint.slice(i, i + 2), 16));
  return (out, w, h, u) => {
    if (extra) extra(out, w, h, u, 0);
    const cv = mk(w, h), c = cv.getContext('2d'); fn(c, w, h, u, false);
    const id = c.getImageData(0, 0, cv.width, cv.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]; if (!a) continue;
      const L = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255, k = Math.max(0, Math.min(1, (L - 0.1) / 0.55)), s = k * k * (3 - 2 * k);
      d[i] = t3[0]; d[i + 1] = t3[1]; d[i + 2] = t3[2]; d[i + 3] = a * amp * (0.2 + 0.8 * s);
    }
    c.putImageData(id, 0, 0); out.drawImage(cv, 0, 0);
    if (extra) extra(out, w, h, u, 1);
  };
}
// sıra sıra yontma taş (blok dizileri); ch = sıra yüksekliği
function ashlar(c, x, y, w, h, ch, cA, cB, joint, lw) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = vgrad(c, y, y + h, [[0, cA], [1, cB]]); c.fillRect(x, y, w, h);
  c.strokeStyle = joint; c.lineWidth = lw; let r = 0;
  for (let yy = y; yy < y + h; yy += ch, r++) {
    c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke();
    const bw = ch * 2.2; c.beginPath(); for (let xx = x + (r % 2) * bw * 0.5; xx < x + w; xx += bw) { c.moveTo(xx, yy); c.lineTo(xx, yy + ch); } c.stroke();
  }
  c.restore();
}
function toga(c, sx, base, u, s, bodyCols) {   // togalı mermer heykel (ayak = base)
  c.fillStyle = hgrad(c, sx - 0.36 * u * s, sx + 0.36 * u * s, bodyCols);
  c.beginPath(); c.moveTo(sx - 0.16 * u * s, base - 1.9 * u * s); c.lineTo(sx + 0.16 * u * s, base - 1.9 * u * s); c.lineTo(sx + 0.38 * u * s, base - 0.15 * u * s); c.lineTo(sx - 0.38 * u * s, base - 0.15 * u * s); c.closePath(); c.fill();
  c.fillStyle = bodyCols[1]; c.beginPath(); c.arc(sx, base - 2.15 * u * s, 0.2 * u * s, 0, 7); c.fill();
}
function pine2(c, x, gy, hh, u) {
  c.strokeStyle = '#5A3418'; c.lineWidth = 0.18 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, gy); c.quadraticCurveTo(x - 0.1 * u, gy - hh * 0.5, x + 0.08 * u, gy - hh); c.stroke();
  ell(c, x + 0.08 * u, gy - hh - 0.08 * u, 1.1 * u, 0.42 * u, '#1C6A33'); ell(c, x + 0.25 * u, gy - hh - 0.25 * u, 0.8 * u, 0.3 * u, '#33973F'); ell(c, x + 0.4 * u, gy - hh - 0.36 * u, 0.5 * u, 0.16 * u, '#5BB653');
}
function cypress2(c, x, gy, hh, ww, cols) {
  c.fillStyle = hgrad(c, x - ww, x + ww, cols); c.beginPath(); c.moveTo(x, gy - hh); c.bezierCurveTo(x + ww * 1.3, gy - hh * 0.6, x + ww * 1.1, gy - hh * 0.1, x, gy); c.bezierCurveTo(x - ww * 1.1, gy - hh * 0.1, x - ww * 1.3, gy - hh * 0.6, x, gy - hh); c.fill();
}

// ---------- 2. Rostra: öğle ----------
function rostraC(c, w, h, u, sky) {
  const gy = 15.4 * u, cx = w / 2, lw = Math.max(1, u * 0.05);
  if (sky) {
    c.fillStyle = vgrad(c, 0, gy, [[0, '#1672DA'], [0.5, '#4FAEF0'], [1, '#C4E8FC']]); c.fillRect(0, 0, w, h);
    glow(c, w * 0.8, 2.6 * u, 6 * u, '255,250,228', 0.85); glow(c, w * 0.8, 2.6 * u, 1.5 * u, '255,255,248', 0.95);
    cloud(c, 1.6 * u, 2.0 * u, 0.9 * u, '#FFFFFF', 0.95); cloud(c, 6.2 * u, 4.4 * u, 0.7 * u, '#FFFFFF', 0.85); cloud(c, 3.6 * u, 0.9 * u, 0.55 * u, '#FFFFFF', 0.8);
  }
  // arka plan: Satürn tapınağı (altı İyon sütunu, alınlık), öğle ışığında krem taş
  const tx0 = 1.7 * u, tx1 = 7.3 * u, cw = 0.5 * u, ctop = 7.3 * u, cb = 11.8 * u;
  cyl(c, tx0 - 0.1 * u, ctop, tx1 - tx0 + 0.2 * u + cw, cb - ctop, [[0, '#3A2616'], [1, '#7A5632']]);   // cella gölgesi
  for (let i = 0; i < 6; i++) {
    const x = tx0 + i * ((tx1 - tx0) / 5);
    cyl(c, x, ctop, cw, cb - ctop, [[0, '#C8A66A'], [0.35, '#F6E6B8'], [0.75, '#FFF6D8'], [1, '#E6CC90']]);
    c.strokeStyle = 'rgba(120,85,40,0.35)'; c.lineWidth = lw; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x + cw * k / 4, ctop + 0.1 * u); c.lineTo(x + cw * k / 4, cb); c.stroke(); }
    cyl(c, x - 0.1 * u, ctop - 0.2 * u, cw + 0.2 * u, 0.22 * u, [[0, '#D6B676'], [1, '#FFF3CC']]);
    ell(c, x + 0.04 * u, ctop - 0.12 * u, 0.1 * u, 0.1 * u, '#B8924E'); ell(c, x + cw - 0.04 * u, ctop - 0.12 * u, 0.1 * u, 0.1 * u, '#E8CE8C');
  }
  cyl(c, tx0 - 0.5 * u, ctop - 0.95 * u, tx1 - tx0 + cw + 1.0 * u, 0.75 * u, [[0, '#D6B676'], [0.5, '#FFF0C4'], [1, '#EBD296']]);   // arşitrav + friz
  rr(c, tx0 - 0.5 * u, ctop - 0.38 * u, tx1 - tx0 + cw + 1.0 * u, 0.1 * u, 'rgba(90,55,20,0.45)');
  rr(c, tx0 - 0.65 * u, ctop - 1.18 * u, tx1 - tx0 + cw + 1.3 * u, 0.24 * u, '#FFF6D6');
  c.fillStyle = '#E4C888'; c.beginPath(); c.moveTo(tx0 - 0.65 * u, ctop - 1.18 * u); c.lineTo(cx + 0.25 * u, ctop - 2.95 * u); c.lineTo(tx1 + cw + 0.65 * u, ctop - 1.18 * u); c.closePath(); c.fill();   // tympanum
  c.strokeStyle = '#FFF6D6'; c.lineWidth = u * 0.16; c.lineJoin = 'miter'; c.beginPath(); c.moveTo(tx0 - 0.65 * u, ctop - 1.18 * u); c.lineTo(cx + 0.25 * u, ctop - 2.95 * u); c.lineTo(tx1 + cw + 0.65 * u, ctop - 1.18 * u); c.stroke();
  ell(c, cx + 0.25 * u, ctop - 1.75 * u, 0.28 * u, 0.28 * u, '#C9A227');
  // onur sütunları: üstünde yaldızlı heykel
  for (const hx of [0.5 * u, 8.5 * u]) {
    const y0 = 3.9 * u;
    cyl(c, hx - 0.26 * u, y0, 0.52 * u, cb - y0, [[0, '#B9B4A6'], [0.4, '#F2EEE2'], [1, '#FFFFFF']]);
    for (let k = 0; k < 5; k++) rr(c, hx - 0.28 * u, y0 + 0.8 * u + k * 1.4 * u, 0.56 * u, 0.1 * u, 'rgba(120,110,90,0.5)');
    cyl(c, hx - 0.4 * u, y0 - 0.25 * u, 0.8 * u, 0.28 * u, [[0, '#C9C2B0'], [1, '#FFFFFF']]);
    cyl(c, hx - 0.3 * u, y0 - 0.45 * u, 0.6 * u, 0.22 * u, [[0, '#B8860B'], [1, '#FFE070']]);
    toga(c, hx, y0 - 0.45 * u, u, 0.85, [[0, '#8A5C00'], [0.5, '#FFD54A'], [1, '#FFF0A0']]);
    c.fillStyle = '#FFD54A'; c.fillRect(hx + 0.14 * u, y0 - 2.15 * u, 0.08 * u, 0.7 * u);   // kalkık kol
  }
  // kürsü (Rostra): kavisli, traverten, bronz gemi başları
  const edge = (c2) => { c2.moveTo(-0.3 * u, 11.55 * u); c2.quadraticCurveTo(cx, 12.45 * u, w + 0.3 * u, 11.55 * u); };
  c.beginPath(); c.moveTo(-0.3 * u, 11.3 * u); c.lineTo(w + 0.3 * u, 11.3 * u); c.lineTo(w + 0.3 * u, 11.55 * u); c.quadraticCurveTo(cx, 12.45 * u, -0.3 * u, 11.55 * u); c.closePath();
  c.fillStyle = vgrad(c, 11.3 * u, 12.2 * u, [[0, '#F8E6B6'], [1, '#FFF8DE']]); c.fill();   // üst yüzey (aydınlık)
  for (const sx of [2.0 * u, 7.0 * u]) { c.save(); toga(c, sx, 11.75 * u, u, 0.95, [[0, '#B9B4A6'], [0.5, '#F4F0E4'], [1, '#FFFFFF']]); c.restore(); }
  c.save(); c.beginPath(); c.moveTo(-0.3 * u, 11.55 * u); c.quadraticCurveTo(cx, 12.45 * u, w + 0.3 * u, 11.55 * u); c.lineTo(w + 0.3 * u, gy); c.lineTo(-0.3 * u, gy); c.closePath(); c.clip();
  ashlar(c, -0.3 * u, 11.3 * u, w + 0.6 * u, gy - 11.3 * u, 0.62 * u, '#EBCF98', '#C79E58', 'rgba(110,70,25,0.55)', lw * 1.2);
  rr(c, -0.3 * u, 14.9 * u, w + 0.6 * u, 0.5 * u, 'rgba(90,50,20,0.28)');   // alt gölge
  c.restore();
  c.strokeStyle = '#FFF4D2'; c.lineWidth = 0.2 * u; c.beginPath(); edge(c); c.stroke();
  c.strokeStyle = 'rgba(100,60,20,0.55)'; c.lineWidth = 0.08 * u; c.beginPath(); c.moveTo(-0.3 * u, 11.72 * u); c.quadraticCurveTo(cx, 12.62 * u, w + 0.3 * u, 11.72 * u); c.stroke();
  for (let i = 0; i < 5; i++) {   // bronz rostra: gemi başı levhası + üç kanatlı mahmuz
    const x = (0.9 + i * 1.8) * u, y = 12.45 * u + Math.sin((i / 4) * Math.PI) * 0.42 * u;
    c.fillStyle = 'rgba(60,30,10,0.4)'; c.beginPath(); c.ellipse(x + 0.12 * u, y + 0.5 * u, 0.5 * u, 0.42 * u, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - 0.25 * u, y + 0.7 * u); c.lineTo(x + 0.4 * u, y + 0.7 * u); c.lineTo(x + 0.2 * u, y + 2.0 * u); c.closePath(); c.fill();
    // mahmuz: üç üst üste kanat, aşağı ve öne
    for (let k = 0; k < 3; k++) {
      const yy = y + 0.55 * u + k * 0.32 * u, ww = (0.55 - k * 0.08) * u, ln = (1.0 - k * 0.2) * u;
      c.fillStyle = hgrad(c, x - ww, x + ww, [[0, '#6B4310'], [0.4, '#E0A040'], [0.7, '#FFE08A'], [1, '#9A6420']]);
      c.beginPath(); c.moveTo(x - ww, yy); c.lineTo(x + ww, yy); c.lineTo(x + ww * 0.25, yy + ln * 0.5); c.lineTo(x, yy + ln * 0.62); c.lineTo(x - ww * 0.25, yy + ln * 0.5); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(70,35,5,0.85)'; c.lineWidth = lw * 1.3; c.stroke();
    }
    // levha: yuvarlak köşeli bronz plaka + perçin
    c.fillStyle = hgrad(c, x - 0.45 * u, x + 0.45 * u, [[0, '#6B4310'], [0.35, '#D9983A'], [0.65, '#FFD36A'], [1, '#9A6420']]);
    c.beginPath(); c.moveTo(x - 0.46 * u, y + 0.1 * u); c.quadraticCurveTo(x, y - 0.1 * u, x + 0.46 * u, y + 0.1 * u); c.lineTo(x + 0.4 * u, y + 0.55 * u); c.lineTo(x - 0.4 * u, y + 0.55 * u); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(70,35,5,0.85)'; c.lineWidth = lw * 1.5; c.stroke();
    c.fillStyle = '#FFF0B0'; for (const dx of [-0.28, 0, 0.28]) { c.beginPath(); c.arc(x + dx * u, y + 0.25 * u, 0.05 * u, 0, 7); c.fill(); }
  }
  // zemin: forum traverteni, uzun gölgeler
  c.fillStyle = vgrad(c, gy, h, [[0, '#F0D8A0'], [0.5, '#D9B570'], [1, '#B8884A']]); c.fillRect(0, gy, w, h - gy);
  c.strokeStyle = 'rgba(110,70,25,0.45)'; c.lineWidth = lw * 1.2;
  for (let i = 1; i < 6; i++) { const y = gy + i * i * 0.1 * u + i * 0.25 * u; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  for (let i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(cx + i * 0.8 * u, gy); c.lineTo(cx + i * 1.9 * u, h); c.stroke(); }
  rr(c, 0, gy, w, 0.12 * u, 'rgba(255,245,200,0.8)');
}

// ---------- 3. Tabularium: öğleden sonra ----------
function tabulariumC(c, w, h, u, sky) {
  const gy = 15.6 * u, lw = Math.max(1, u * 0.05), cx = w / 2;
  if (sky) {
    c.fillStyle = vgrad(c, 0, 6 * u, [[0, '#5AA2E0'], [0.6, '#A8D0EE'], [1, '#F6E6B4']]); c.fillRect(0, 0, w, h);
    glow(c, w * 0.85, 1.2 * u, 5.5 * u, '255,236,170', 0.8);
    cloud(c, 2.0 * u, 1.6 * u, 0.8 * u, '#FFFFFF', 0.9); cloud(c, 6.6 * u, 3.0 * u, 0.6 * u, '#FFF6DC', 0.8);
  }
  // Capitolium yamacı: yeşil tepe, çam ve küçük terracotta çatılar
  c.fillStyle = vgrad(c, 2.4 * u, 6 * u, [[0, '#6C9A42'], [1, '#3F6B2B']]);
  c.beginPath(); c.moveTo(0, 5.8 * u); c.bezierCurveTo(2 * u, 4.2 * u, 5 * u, 3.4 * u, w, 2.6 * u); c.lineTo(w, 6 * u); c.lineTo(0, 6 * u); c.closePath(); c.fill();
  for (const [rx, ry, rw] of [[1.0, 4.5, 1.6], [6.3, 3.4, 1.7]]) {
    cyl(c, rx * u, ry * u, rw * u, 1.0 * u, [[0, '#C9A06A'], [1, '#F4DCA4']]);
    c.fillStyle = '#C65A30'; c.beginPath(); c.moveTo((rx - 0.15) * u, ry * u); c.lineTo((rx + rw / 2) * u, (ry - 0.7) * u); c.lineTo((rx + rw + 0.15) * u, ry * u); c.closePath(); c.fill();
    c.fillStyle = '#9A3E1E'; c.beginPath(); c.moveTo((rx - 0.15) * u, ry * u); c.lineTo((rx + rw / 2) * u, (ry - 0.7) * u); c.lineTo((rx + rw / 2) * u, ry * u); c.closePath(); c.fill();
  }
  pine2(c, 0.4 * u, 5.6 * u, 1.4 * u, u); pine2(c, 8.6 * u, 4.2 * u, 1.6 * u, u); pine2(c, 4.9 * u, 4.6 * u, 1.0 * u, u);
  // üst kat: tüf bloklar, küçük kemerli pencereler
  const top = 5.4 * u, mid = 8.1 * u;
  ashlar(c, 0, top, w, mid - top, 0.5 * u, '#CDB083', '#A98E62', 'rgba(70,45,20,0.5)', lw * 1.2);
  rr(c, 0, top - 0.25 * u, w, 0.3 * u, '#EBD6A6'); rr(c, 0, top - 0.25 * u, w, 0.08 * u, '#FFF3CC'); rr(c, 0, top + 0.05 * u, w, 0.14 * u, 'rgba(60,35,10,0.4)');
  for (let i = 0; i < 5; i++) {
    const wx = (0.55 + i * 1.8) * u, ww = 0.9 * u, wy = 7.6 * u;
    sclip(c, () => archPath(c, wx, wy, ww, 1.7 * u)); c.fillStyle = vgrad(c, wy - 1.7 * u, wy, [[0, '#2A1608'], [1, '#8A5A2A']]); c.fillRect(wx, wy - 1.7 * u, ww, 1.7 * u);
    c.fillStyle = 'rgba(255,214,130,0.55)'; for (let k = 0; k < 3; k++) c.fillRect(wx + 0.12 * u, wy - 1.0 * u + k * 0.42 * u, ww - 0.24 * u, 0.1 * u);
    c.restore(); c.strokeStyle = '#F2DCA8'; c.lineWidth = lw * 2; c.beginPath(); archPath(c, wx, wy, ww, 1.7 * u); c.stroke();
  }
  // triglif-metop frizi
  cyl(c, 0, mid, w, 0.72 * u, [[0, '#C9AC7C'], [0.5, '#EBD6A6'], [1, '#D7BC8C']]);
  for (let x = 0.15 * u; x < w; x += 0.62 * u) { rr(c, x, mid + 0.1 * u, 0.2 * u, 0.5 * u, '#6B4A26'); rr(c, x + 0.06 * u, mid + 0.1 * u, 0.025 * u, 0.5 * u, '#E8D2A0'); rr(c, x + 0.12 * u, mid + 0.1 * u, 0.025 * u, 0.5 * u, '#E8D2A0'); }
  rr(c, 0, mid + 0.72 * u, w, 0.2 * u, '#FFF1C8'); rr(c, 0, mid + 0.92 * u, w, 0.14 * u, 'rgba(60,35,10,0.45)');
  // ana kemer sırası
  const aT = mid + 1.0 * u, pw = 0.75 * u, aw = 2.0 * u, aH = 5.5 * u;
  ashlar(c, 0, aT, w, gy - aT, 0.55 * u, '#C2A476', '#9C8058', 'rgba(60,38,16,0.55)', lw * 1.3);
  for (let i = 0; i < 3; i++) {
    const x = pw + i * (aw + pw);
    sclip(c, () => archPath(c, x, gy, aw, aH));
    c.fillStyle = vgrad(c, gy - aH, gy, [[0, '#1E1008'], [0.5, '#4A2A14'], [1, '#9A6430']]); c.fillRect(x, gy - aH, aw, aH);
    // arşiv rafları: tomar nişleri, bronz tabletler
    for (let r = 0; r < 6; r++) {
      const sy = gy - 0.35 * u - r * 0.82 * u;
      rr(c, x, sy, aw, 0.1 * u, '#8A5A26'); rr(c, x, sy + 0.1 * u, aw, 0.05 * u, 'rgba(0,0,0,0.5)');
      for (let k = 0; k < 5; k++) {
        const nx = x + 0.1 * u + k * 0.38 * u, ny = sy - 0.5 * u, ty = (r + k) % 3;
        rr(c, nx, ny, 0.32 * u, 0.5 * u, 'rgba(10,4,0,0.55)');
        if (ty === 0) { ell(c, nx + 0.16 * u, ny + 0.32 * u, 0.12 * u, 0.12 * u, '#F2E2B4'); rr(c, nx + 0.04 * u, ny + 0.3 * u, 0.24 * u, 0.04 * u, '#8A6A3A'); ell(c, nx + 0.1 * u, ny + 0.17 * u, 0.07 * u, 0.07 * u, '#E6D29A'); }
        else if (ty === 1) { rr(c, nx + 0.03 * u, ny + 0.06 * u, 0.26 * u, 0.4 * u, '#C99A2A'); rr(c, nx + 0.06 * u, ny + 0.12 * u, 0.2 * u, 0.04 * u, '#7A5410'); rr(c, nx + 0.06 * u, ny + 0.22 * u, 0.2 * u, 0.04 * u, '#7A5410'); rr(c, nx + 0.06 * u, ny + 0.32 * u, 0.2 * u, 0.04 * u, '#7A5410'); }
        else { for (const dx of [0.04, 0.17]) { rr(c, nx + dx * u, ny + 0.16 * u, 0.1 * u, 0.3 * u, '#EFD9A2'); ell(c, nx + (dx + 0.05) * u, ny + 0.16 * u, 0.05 * u, 0.03 * u, '#8A6A3A'); } }
      }
    }
    const lg = c.createLinearGradient(0, gy - aH, 0, gy); lg.addColorStop(0, 'rgba(255,200,120,0)'); lg.addColorStop(1, 'rgba(255,214,140,0.35)'); c.fillStyle = lg; c.fillRect(x, gy - aH, aw, aH);
    c.restore();
    c.strokeStyle = '#F2DCA8'; c.lineWidth = u * 0.14; c.beginPath(); archPath(c, x - 0.07 * u, gy, aw + 0.14 * u, aH + 0.07 * u); c.stroke();
    c.strokeStyle = 'rgba(70,40,15,0.75)'; c.lineWidth = lw * 1.4; c.beginPath(); archPath(c, x, gy, aw, aH); c.stroke();
    // kilit taşı
    c.fillStyle = '#EAD3A0'; c.beginPath(); c.moveTo(x + aw / 2 - 0.16 * u, gy - aH - 0.15 * u); c.lineTo(x + aw / 2 + 0.16 * u, gy - aH - 0.15 * u); c.lineTo(x + aw / 2 + 0.11 * u, gy - aH + 0.28 * u); c.lineTo(x + aw / 2 - 0.11 * u, gy - aH + 0.28 * u); c.closePath(); c.fill();
  }
  // payeler üzerinde yarım Dor sütunları
  for (let i = 0; i < 4; i++) {
    const px = i * (aw + pw) + pw / 2, cw2 = 0.5 * u, x = px - cw2 / 2, cT = gy - aH - 0.2 * u;
    cyl(c, x, cT, cw2, gy - cT, [[0, '#A98A5C'], [0.4, '#E6CE9C'], [0.8, '#FFF0C8'], [1, '#D8BE8C']]);
    c.strokeStyle = 'rgba(90,60,25,0.35)'; c.lineWidth = lw; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x + cw2 * k / 4, cT + 0.1 * u); c.lineTo(x + cw2 * k / 4, gy); c.stroke(); }
    cyl(c, x - 0.1 * u, cT - 0.12 * u, cw2 + 0.2 * u, 0.14 * u, [[0, '#C9AC7C'], [1, '#FFF3CC']]); cyl(c, x - 0.14 * u, cT - 0.26 * u, cw2 + 0.28 * u, 0.14 * u, [[0, '#D7BC8C'], [1, '#FFF8DC']]);
    cyl(c, x - 0.1 * u, gy - 0.16 * u, cw2 + 0.2 * u, 0.16 * u, [[0, '#A98A5C'], [1, '#EAD3A0']]);
  }
  // öğleden sonra ışığı: yüzeye sıcak vurgu
  c.save(); c.globalCompositeOperation = 'lighter'; glow(c, w * 0.9, 6 * u, 6 * u, '255,226,150', 0.22); c.restore();
  // zemin: aşınmış basamak + kaldırım
  rr(c, 0, gy, w, 0.28 * u, '#E8D2A0'); rr(c, 0, gy + 0.28 * u, w, 0.12 * u, 'rgba(60,35,10,0.45)');
  c.fillStyle = vgrad(c, gy + 0.4 * u, h, [[0, '#D6BC88'], [1, '#A98A55']]); c.fillRect(0, gy + 0.4 * u, w, h - gy);
  c.strokeStyle = 'rgba(90,60,25,0.45)'; c.lineWidth = lw * 1.2;
  for (let i = 1; i < 5; i++) { const y = gy + 0.4 * u + i * i * 0.1 * u + i * 0.2 * u; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  for (let i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(cx + i * 0.8 * u, gy + 0.4 * u); c.lineTo(cx + i * 1.8 * u, h); c.stroke(); }
}

// ---------- 5. Capitolium: altın saat ----------
function capitoliumC(c, w, h, u, sky) {
  const gy = 15.6 * u, cx = w / 2, lw = Math.max(1, u * 0.05);
  if (sky) {
    c.fillStyle = vgrad(c, 0, gy, [[0, '#E08A32'], [0.45, '#FFC060'], [0.8, '#FFE49A'], [1, '#FFF3CC']]); c.fillRect(0, 0, w, h);
    glow(c, cx, 6.5 * u, 8 * u, '255,236,170', 0.85); glow(c, cx, 6.5 * u, 2.4 * u, '255,252,225', 0.95);
    cloud(c, 1.2 * u, 2.0 * u, 0.9 * u, '#FFD9A0', 0.9); cloud(c, 7.8 * u, 3.0 * u, 0.8 * u, '#FFC888', 0.9); cloud(c, 4.2 * u, 0.9 * u, 0.6 * u, '#FFE2B0', 0.8);
    // güneş ışınları
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.95 + i * (Math.PI * 0.9 / 6), L = 11 * u; const g = c.createLinearGradient(cx, 6.5 * u, cx + Math.cos(a) * L, 6.5 * u + Math.sin(a) * L); g.addColorStop(0, 'rgba(255,240,180,0.28)'); g.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(cx, 6.5 * u); c.lineTo(cx + Math.cos(a - 0.05) * L, 6.5 * u + Math.sin(a - 0.05) * L); c.lineTo(cx + Math.cos(a + 0.05) * L, 6.5 * u + Math.sin(a + 0.05) * L); c.fill(); } c.restore();
  }
  // yanlarda yamaç selvileri (koyu)
  const cyc = [[0, '#0B3A1C'], [0.55, '#1B6E30'], [1, '#3E9A44']];
  cypress2(c, 0.35 * u, gy, 6.6 * u, 0.42 * u, cyc); cypress2(c, 8.65 * u, gy, 7.4 * u, 0.46 * u, cyc); cypress2(c, 1.0 * u, gy, 4.2 * u, 0.34 * u, cyc); cypress2(c, 8.0 * u, gy, 4.8 * u, 0.36 * u, cyc);
  // Jüpiter tapınağı: yüksek podyum, kırmızı-altın çatı, altın quadriga
  const px0 = 0.6 * u, px1 = 8.4 * u, py = 12.2 * u, colB = py, colT = 7.9 * u;
  // pediment
  const pdY0 = 7.1 * u, pdY1 = 5.0 * u;
  c.fillStyle = vgrad(c, pdY1, pdY0, [[0, '#B87832'], [1, '#E8B060']]); c.beginPath(); c.moveTo(px0 - 0.25 * u, pdY0); c.lineTo(cx, pdY1); c.lineTo(px1 + 0.25 * u, pdY0); c.closePath(); c.fill();   // tympanum (terracotta-altın)
  c.fillStyle = '#7A3A1A'; for (const [fx, fy, fs] of [[cx, 6.2, 0.5], [cx - 1.4, 6.7, 0.32], [cx + 1.4, 6.7, 0.32]]) { c.beginPath(); c.arc(fx * u, fy * u - fs * u * 0.6, fs * u * 0.4, 0, 7); c.fill(); c.fillRect(fx * u - fs * u * 0.45, fy * u - fs * u * 0.3, fs * u * 0.9, fs * u * 0.7); }   // tympanum figürleri
  c.strokeStyle = '#FFE070'; c.lineWidth = u * 0.28; c.lineJoin = 'miter'; c.beginPath(); c.moveTo(px0 - 0.25 * u, pdY0); c.lineTo(cx, pdY1); c.lineTo(px1 + 0.25 * u, pdY0); c.stroke();   // yaldızlı çatı kenarı
  c.strokeStyle = '#B8860B'; c.lineWidth = u * 0.08; c.beginPath(); c.moveTo(px0 - 0.25 * u, pdY0 + 0.14 * u); c.lineTo(cx, pdY1 + 0.14 * u); c.lineTo(px1 + 0.25 * u, pdY0 + 0.14 * u); c.stroke();
  c.fillStyle = '#FFE070'; for (let i = 0; i <= 12; i++) { const t = i / 12, ax = px0 - 0.25 * u + t * (cx - px0 + 0.25 * u), ay = pdY0 + t * (pdY1 - pdY0); for (const sx of [ax, 2 * cx - ax]) { c.beginPath(); c.arc(sx, ay - 0.3 * u, 0.1 * u, 0, 7); c.fill(); } }   // antefikslar
  // yaldızlı çatı arkası (kiremit)
  // entablatür
  cyl(c, px0 - 0.25 * u, pdY0, px1 - px0 + 0.5 * u, 0.75 * u, [[0, '#D9A64E'], [0.5, '#FFE49A'], [1, '#E8BE6A']]);
  rr(c, px0 - 0.25 * u, pdY0 + 0.75 * u, px1 - px0 + 0.5 * u, 0.12 * u, 'rgba(90,45,10,0.5)');
  c.fillStyle = '#B8860B'; for (let x = px0; x < px1; x += 0.5 * u) c.fillRect(x, pdY0 + 0.25 * u, 0.14 * u, 0.3 * u);
  // quadriga (zirvede, altın): araba solda, dört at sağa doğru şaha kalkmış
  { const qx = cx, qy = pdY1 - 0.1 * u, gcol = [[0, '#6E4300'], [0.45, '#D79A10'], [0.75, '#FFD54A'], [1, '#FFF2A8']];
    c.fillStyle = hgrad(c, qx - 1.4 * u, qx + 1.4 * u, gcol);
    c.fillRect(qx - 1.3 * u, qy - 0.22 * u, 2.6 * u, 0.22 * u);                                         // kaide
    c.beginPath(); c.moveTo(qx - 1.3 * u, qy - 0.22 * u); c.lineTo(qx - 1.3 * u, qy - 0.95 * u); c.lineTo(qx - 0.45 * u, qy - 0.95 * u); c.lineTo(qx - 0.25 * u, qy - 0.22 * u); c.closePath(); c.fill();   // araba gövdesi
    c.beginPath(); c.arc(qx - 0.8 * u, qy - 0.5 * u, 0.3 * u, 0, 7); c.fill();                           // tekerlek
    c.strokeStyle = 'rgba(90,50,0,0.85)'; c.lineWidth = lw * 1.3; c.beginPath(); c.arc(qx - 0.8 * u, qy - 0.5 * u, 0.2 * u, 0, 7); c.moveTo(qx - 1.0 * u, qy - 0.5 * u); c.lineTo(qx - 0.6 * u, qy - 0.5 * u); c.moveTo(qx - 0.8 * u, qy - 0.7 * u); c.lineTo(qx - 0.8 * u, qy - 0.3 * u); c.stroke();
    c.fillStyle = hgrad(c, qx - 1.4 * u, qx + 1.4 * u, gcol);
    c.fillRect(qx - 0.95 * u, qy - 1.75 * u, 0.22 * u, 0.85 * u); c.beginPath(); c.arc(qx - 0.84 * u, qy - 1.88 * u, 0.15 * u, 0, 7); c.fill(); c.fillRect(qx - 0.72 * u, qy - 2.2 * u, 0.07 * u, 0.55 * u);   // Jüpiter / Victoria figürü
    for (let i = 0; i < 4; i++) {   // atlar
      const hx = qx - 0.15 * u + i * 0.4 * u, hy = qy - 0.22 * u;
      c.beginPath(); c.ellipse(hx + 0.22 * u, hy - 0.5 * u, 0.3 * u, 0.2 * u, -0.3, 0, 7); c.fill();                         // gövde
      c.beginPath(); c.moveTo(hx + 0.35 * u, hy - 0.58 * u); c.lineTo(hx + 0.56 * u, hy - 1.15 * u); c.lineTo(hx + 0.8 * u, hy - 1.2 * u); c.lineTo(hx + 0.72 * u, hy - 1.02 * u); c.lineTo(hx + 0.58 * u, hy - 0.45 * u); c.closePath(); c.fill();   // boyun + baş
      c.beginPath(); c.moveTo(hx + 0.4 * u, hy - 0.4 * u); c.lineTo(hx + 0.78 * u, hy - 0.62 * u); c.lineTo(hx + 0.8 * u, hy - 0.5 * u); c.lineTo(hx + 0.48 * u, hy - 0.3 * u); c.closePath(); c.fill();   // kalkık ön ayak
      c.fillRect(hx + 0.06 * u, hy - 0.45 * u, 0.1 * u, 0.45 * u);
    }
    c.strokeStyle = 'rgba(90,50,0,0.5)'; c.lineWidth = lw; c.strokeRect(qx - 1.3 * u, qy - 0.22 * u, 2.6 * u, 0.22 * u); }
  // cella gölgesi ve altı Korint sütunu
  cyl(c, px0, colT, px1 - px0, colB - colT, [[0, '#6A3E22'], [1, '#B07C48']]);
  for (let i = 0; i < 6; i++) {
    const cw = 0.78 * u, x = px0 + 0.1 * u + i * ((px1 - px0 - 0.98 * u) / 5);
    cyl(c, x, colT, cw, colB - colT, [[0, '#C8944A'], [0.3, '#F8DDA0'], [0.7, '#FFF6D8'], [1, '#EDCB86']]);
    c.strokeStyle = 'rgba(120,70,25,0.4)'; c.lineWidth = lw; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(x + cw * k / 5, colT + 0.2 * u); c.lineTo(x + cw * k / 5, colB - 0.1 * u); c.stroke(); }
    cyl(c, x - 0.1 * u, colT - 0.05 * u, cw + 0.2 * u, 0.4 * u, [[0, '#C99A3C'], [0.5, '#FFE27A'], [1, '#E8BC52']]);   // yaldızlı başlık
    cyl(c, x - 0.08 * u, colB - 0.3 * u, cw + 0.16 * u, 0.3 * u, [[0, '#C89A5A'], [1, '#FFF0C8']]);
  }
  // podyum + merdiven
  ashlar(c, px0 - 0.3 * u, py, px1 - px0 + 0.6 * u, gy - py, 0.62 * u, '#F2D79A', '#D2A460', 'rgba(110,65,20,0.5)', lw * 1.2);
  cyl(c, px0 - 0.45 * u, py - 0.3 * u, px1 - px0 + 0.9 * u, 0.34 * u, [[0, '#E0B466'], [0.5, '#FFF0C0'], [1, '#EDCB86']]);
  rr(c, px0 - 0.45 * u, py + 0.04 * u, px1 - px0 + 0.9 * u, 0.12 * u, 'rgba(90,50,15,0.5)');
  const sw = 2.6 * u, sx = cx - sw / 2, steps = 6, sh = (gy - py) / steps;
  for (let k = 0; k < steps; k++) { const yy = py + k * sh, inset = (steps - 1 - k) * 0.0; rr(c, sx - 0.15 * u * k * 0.3, yy, sw + 0.3 * u * k * 0.3, sh, k % 2 ? '#F6E3B0' : '#EBD08A'); rr(c, sx - 0.15 * u * k * 0.3, yy, sw + 0.3 * u * k * 0.3, 0.08 * u, 'rgba(255,248,215,0.9)'); rr(c, sx - 0.15 * u * k * 0.3, yy + sh - 0.1 * u, sw + 0.3 * u * k * 0.3, 0.1 * u, 'rgba(90,50,15,0.4)'); }
  // yan akroter (altın meşale/tripod) ve zemin
  c.fillStyle = vgrad(c, gy, h, [[0, '#F2D494'], [0.5, '#D9A850'], [1, '#B27A34']]); c.fillRect(0, gy, w, h - gy);
  c.strokeStyle = 'rgba(110,65,20,0.45)'; c.lineWidth = lw * 1.2;
  for (let i = 1; i < 5; i++) { const y = gy + i * i * 0.1 * u + i * 0.22 * u; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  for (let i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(cx + i * 0.8 * u, gy); c.lineTo(cx + i * 1.9 * u, h); c.stroke(); }
  rr(c, 0, gy, w, 0.12 * u, 'rgba(255,248,200,0.8)');
  c.save(); c.globalCompositeOperation = 'lighter'; glow(c, cx, py + 1.5 * u, 6 * u, '255,220,140', 0.22); c.restore();
}

// ---------- 6. Palatium: alacakaranlık ----------
function palatiumC(c, w, h, u, sky) {
  const gy = 15.6 * u, cx = w / 2, lw = Math.max(1, u * 0.05);
  if (sky) {
    c.fillStyle = vgrad(c, 0, gy, [[0, '#14145A'], [0.35, '#3E2C8C'], [0.7, '#9A4E9A'], [1, '#F29A86']]); c.fillRect(0, 0, w, h);
    glow(c, w * 0.3, 11.5 * u, 7 * u, '255,170,130', 0.55);
    c.fillStyle = '#FFFFFF'; for (const [sx, sy, sr] of [[0.8, 0.7, 0.07], [2.2, 1.9, 0.05], [3.6, 0.6, 0.06], [5.0, 1.5, 0.05], [6.6, 0.8, 0.07], [8.0, 2.0, 0.05], [7.2, 3.1, 0.045], [1.4, 3.4, 0.045], [4.4, 2.7, 0.04]]) star(c, sx * u, sy * u, sr * u);
    c.fillStyle = '#FFF6D8'; c.beginPath(); c.arc(7.5 * u, 1.5 * u, 0.55 * u, 0, 7); c.fill(); c.fillStyle = '#3A2C8C'; c.beginPath(); c.arc(7.75 * u, 1.35 * u, 0.5 * u, 0, 7); c.fill();   // hilal
    cloud(c, 2.4 * u, 6.4 * u, 0.9 * u, '#D0709A', 0.7); cloud(c, 7.6 * u, 8.0 * u, 0.8 * u, '#E08AA0', 0.7);
  }
  const wall = [[0, '#B8628A'], [0.5, '#E8A0A0'], [1, '#F6C8B0']], dark = [[0, '#1A0E30'], [1, '#5A2A48']];
  // üç kat kemerli sıra (basamaklı teraslar)
  const tier = (x0, x1, yT, yB, n, ah, roof) => {
    const W = x1 - x0, pw = W / (n * 3.2 + n + 1) * 1.0, aw = (W - pw * (n + 1)) / n;
    cyl(c, x0, yT, W, yB - yT, [[0, '#9A5080'], [0.5, '#E8A8A8'], [1, '#F8D2BC']]);
    rr(c, x0 - 0.12 * u, yT - 0.2 * u, W + 0.24 * u, 0.22 * u, '#FBE4D0'); rr(c, x0 - 0.12 * u, yT + 0.02 * u, W + 0.24 * u, 0.1 * u, 'rgba(70,20,50,0.4)');
    for (let i = 0; i < n; i++) {
      const x = x0 + pw + i * (aw + pw);
      sclip(c, () => archPath(c, x, yB, aw, ah));
      c.fillStyle = vgrad(c, yB - ah, yB, [[0, '#2A1244'], [0.5, '#8A4A3A'], [1, '#FFB060']]); c.fillRect(x, yB - ah, aw, ah);
      c.globalCompositeOperation = 'lighter'; glow(c, x + aw / 2, yB - 0.7 * u, aw * 0.95, '255,170,70', 0.6); c.globalCompositeOperation = 'source-over';
      c.restore();
      c.strokeStyle = '#FFE0C8'; c.lineWidth = u * 0.1; c.beginPath(); archPath(c, x - 0.05 * u, yB, aw + 0.1 * u, ah + 0.05 * u); c.stroke();
      c.strokeStyle = 'rgba(80,25,50,0.7)'; c.lineWidth = lw * 1.2; c.beginPath(); archPath(c, x, yB, aw, ah); c.stroke();
      // lamba alevi
      const lx = x + aw / 2, ly = yB - 0.55 * u; rr(c, lx - 0.03 * u, ly, 0.06 * u, 0.3 * u, '#EBD7B0');
      c.fillStyle = '#FF8A20'; c.beginPath(); c.ellipse(lx, ly - 0.12 * u, 0.09 * u, 0.18 * u, 0, 0, 7); c.fill(); c.fillStyle = '#FFE680'; c.beginPath(); c.ellipse(lx, ly - 0.08 * u, 0.045 * u, 0.1 * u, 0, 0, 7); c.fill();
    }
    for (let i = 0; i <= n; i++) { const px = x0 + i * (aw + pw); cyl(c, px, yT + 0.1 * u, pw, yB - yT - 0.1 * u, [[0, 'rgba(90,40,70,0.55)'], [1, 'rgba(255,230,210,0.25)']]); }
    if (roof) {   // kiremit çatı
      c.fillStyle = vgrad(c, yT - 1.0 * u, yT - 0.2 * u, [[0, '#E0603A'], [1, '#A83C28']]); c.beginPath(); c.moveTo(x0 - 0.3 * u, yT - 0.2 * u); c.lineTo(x0 + 0.5 * u, yT - 1.0 * u); c.lineTo(x1 - 0.5 * u, yT - 1.0 * u); c.lineTo(x1 + 0.3 * u, yT - 0.2 * u); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(70,20,10,0.55)'; c.lineWidth = lw; for (let k = 1; k < 4; k++) { const yy = yT - 0.2 * u - k * 0.2 * u; c.beginPath(); c.moveTo(x0 - 0.3 * u + k * 0.2 * u, yy); c.lineTo(x1 + 0.3 * u - k * 0.2 * u, yy); c.stroke(); }
    }
  };
  tier(2.0 * u, 7.0 * u, 3.9 * u, 6.9 * u, 3, 2.1 * u, true);
  tier(0.85 * u, 8.15 * u, 7.4 * u, 11.1 * u, 3, 2.9 * u, false);
  tier(0, w, 11.6 * u, gy - 0.1 * u, 4, 3.0 * u, false);
  // teras korkulukları ve çalılar
  for (const yy of [7.4 * u, 11.1 * u]) { c.fillStyle = vgrad(c, yy - 0.5 * u, yy, [[0, '#1E6A3A'], [1, '#0E4226']]); for (let x = 0; x < w; x += 0.7 * u) { c.beginPath(); c.ellipse(x + 0.35 * u, yy - 0.12 * u, 0.4 * u, 0.3 * u, 0, 0, 7); c.fill(); } }
  // selviler
  cypress2(c, 0.45 * u, gy, 6.2 * u, 0.4 * u, [[0, '#08240F'], [0.55, '#14522A'], [1, '#2C7A3C']]); cypress2(c, 8.55 * u, gy, 5.6 * u, 0.38 * u, [[0, '#08240F'], [0.55, '#14522A'], [1, '#2C7A3C']]);
  cypress2(c, 1.25 * u, gy, 3.6 * u, 0.3 * u, [[0, '#08240F'], [0.55, '#14522A'], [1, '#2C7A3C']]); cypress2(c, 7.7 * u, gy, 3.2 * u, 0.3 * u, [[0, '#08240F'], [0.55, '#14522A'], [1, '#2C7A3C']]);
  // bahçe: yol, çalı kenarları, lambalar
  c.fillStyle = vgrad(c, gy, h, [[0, '#4A2C58'], [1, '#2A1840']]); c.fillRect(0, gy, w, h - gy);
  c.fillStyle = '#7A4A6A'; c.beginPath(); c.moveTo(cx - 0.9 * u, gy); c.lineTo(cx + 0.9 * u, gy); c.lineTo(cx + 3.2 * u, h); c.lineTo(cx - 3.2 * u, h); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(30,10,40,0.5)'; c.lineWidth = lw * 1.2; for (let i = 1; i < 5; i++) { const y = gy + i * i * 0.1 * u + i * 0.22 * u; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  for (const hx of [0.4 * u, 8.6 * u, 2.6 * u, 6.4 * u]) {
    rr(c, hx - 0.03 * u, gy - 0.1 * u, 0.06 * u, 0.9 * u, '#7A5A38'); c.fillStyle = '#FF8A20'; c.beginPath(); c.ellipse(hx, gy - 0.25 * u, 0.1 * u, 0.2 * u, 0, 0, 7); c.fill(); c.fillStyle = '#FFE680'; c.beginPath(); c.ellipse(hx, gy - 0.2 * u, 0.05 * u, 0.11 * u, 0, 0, 7); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, hx, gy - 0.25 * u, 1.5 * u, '255,150,60', 0.5); c.restore();
  }
  rr(c, 0, gy - 0.05 * u, w, 0.1 * u, '#FFB078');
}

const mkMuted = (fn, tint, amp, extra) => mutedFrom(fn, tint, amp, extra);
const rostra = mkMuted(rostraC, '#FFF0D0', 0.24, (o, w, h, u, ph) => { if (!ph) glow(o, w * 0.8, 2.6 * u, 6 * u, '255,250,225', 0.18); });
const tabularium = mkMuted(tabulariumC, '#F2E2B8', 0.26, (o, w, h, u, ph) => { if (!ph) glow(o, w * 0.85, 1.2 * u, 5.5 * u, '255,236,170', 0.16); });
const capitolium = mkMuted(capitoliumC, '#FFE2A0', 0.26, (o, w, h, u, ph) => { if (!ph) glow(o, w / 2, 6.5 * u, 8 * u, '255,226,150', 0.2); });
const palatium = mkMuted(palatiumC, '#D4C0F8', 0.28, (o, w, h, u, ph) => { if (!ph) glow(o, w * 0.3, 11.5 * u, 7 * u, '255,170,130', 0.14); });

const DRAW = [forum, basilika, rostra, tabularium, curia, capitolium, palatium, pantheon];
const DRAWC = [forumC, basilikaC, (c, w, h, u) => rostraC(c, w, h, u, true), (c, w, h, u) => tabulariumC(c, w, h, u, true), curiaC, (c, w, h, u) => capitoliumC(c, w, h, u, true), (c, w, h, u) => palatiumC(c, w, h, u, true), pantheonC];
const STRENGTH = [1, 0.8, 0.9, 0.9, 0.9, 0.9, 0.85, 0.8];   // sönük sürümde seviye başına genel şiddet
export function makeBackdrop(level, w, h, col) {
  const lv = ((Math.floor(level) % 8) + 8) % 8;
  const cv = mk(w, h), out = cv.getContext('2d'), u = cv.height / 18;   // dikey düzen 18 satıra göre; yatay yerleşim w oranlarıyla
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
