// Lawris - girdi (klavye, ekran düğmeleri, kaydırma)
const REPEAT = { left: [170, 55], right: [170, 55], down: [150, 45] };

export function initInput(a, canvas, getCell) {
  const fire = (n) => { if (a[n]) a[n](); };

  // Klavye
  const KEYS = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rotate',
    x: 'rotate', X: 'rotate', ' ': 'drop', p: 'pause', P: 'pause',
  };
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (t && t.closest && t.closest('#rehber:not([hidden])')) return;
    if (document.querySelector('#rehber:not([hidden])')) return;
    const n = KEYS[e.key];
    if (!n) return;
    e.preventDefault();
    if (e.repeat && !REPEAT[n]) return;
    fire(n);
  });

  // Ekran düğmeleri
  document.querySelectorAll('[data-act]').forEach((el) => {
    const n = el.dataset.act; let t1 = null, t2 = null;
    const stop = () => { clearTimeout(t1); clearInterval(t2); t1 = t2 = null; };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* yoksay */ }
      fire(n);
      const r = REPEAT[n];
      if (r) { stop(); t1 = setTimeout(() => { t2 = setInterval(() => fire(n), r[1]); }, r[0]); }
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => el.addEventListener(ev, stop));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // Kaydırma: yatay sürükle = taşı, aşağı sürükle = hızlı in, hızlı aşağı fiske = düşür, dokun = döndür
  let st = null;
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* yoksay */ }
    st = { x: e.clientX, y: e.clientY, t: performance.now(), ax: e.clientX, ay: e.clientY, moved: false };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!st) return;
    const cell = getCell() * 1.1;
    while (e.clientX - st.ax > cell) { st.ax += cell; st.moved = true; fire('right'); }
    while (st.ax - e.clientX > cell) { st.ax -= cell; st.moved = true; fire('left'); }
    while (e.clientY - st.ay > cell) { st.ay += cell; st.moved = true; fire('down'); }
  });
  const end = (e) => {
    if (!st) return;
    const dt = performance.now() - st.t, dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.moved && Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 350) fire('rotate');
    else if (dy > getCell() * 3 && dt < 280 && Math.abs(dx) < dy) fire('drop');
    st = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => { st = null; });
}
