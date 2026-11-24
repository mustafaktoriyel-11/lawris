// Lawris - girdi (klavye, ekran düğmeleri, kaydırma)
const REPEAT = { left: [170, 55], right: [170, 55], down: [150, 45] };

export function initInput(a, canvas, getCell) {
  const fire = (n) => { if (a[n]) a[n](); };

  // Klavye
  const KEYS = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rotate',
    x: 'rotate', X: 'rotate', c: 'hold', C: 'hold', Shift: 'hold', ' ': 'drop', p: 'pause', P: 'pause',
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

  // Kaydırma: yön kilidi ile
  //  - parmak önce hangi yöne belirgin giderse o eksene kilitlenir (yatay ya da dikey), parmak kalkana kadar diğer eksen yok sayılır
  //  - yatay sürükle = taşı, yavaş aşağı sürükle = hızlı in, hızlı aşağı fiske = düşür, yukarı fiske = talik, dokun = döndür
  let st = null;
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (e.pointerType === 'mouse') return;   // masaüstünde fare tıklaması oyunu etkilemez (klavye kullanılır)
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* yoksay */ }
    st = { x: e.clientX, y: e.clientY, t: performance.now(), ax: e.clientX, ay: e.clientY, moved: false, axis: null, done: false };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!st || st.done) return;
    const c = getCell(), dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.axis) {
      const lock = c * 0.55;
      if (Math.abs(dx) < lock && Math.abs(dy) < lock) return;
      st.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
      st.ax = st.x; st.ay = st.y;
    }
    if (st.axis === 'x') {
      const cell = c * 1.1;
      while (e.clientX - st.ax > cell) { st.ax += cell; st.moved = true; fire('right'); }
      while (st.ax - e.clientX > cell) { st.ax -= cell; st.moved = true; fire('left'); }
    } else {
      const dt = performance.now() - st.t;
      // hızlı aşağı fiske: hemen düşür (parmak kalkmayı beklemeden)
      if (dy > c * 2.2 && dt < 220) { st.done = true; st.moved = true; fire('drop'); return; }
      const cell = c * 1.1;
      while (e.clientY - st.ay > cell) { st.ay += cell; st.moved = true; fire('down'); }
    }
  });
  const end = (e) => {
    if (!st) return;
    const dt = performance.now() - st.t, dx = e.clientX - st.x, dy = e.clientY - st.y, c = getCell();
    if (!st.done) {
      if (!st.axis && Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 350) fire('rotate');
      else if (st.axis === 'y' && dy > c * 3 && dt < 320) fire('drop');
      else if (st.axis === 'y' && -dy > c * 2.2 && dt < 320) fire('hold');
    }
    st = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => { st = null; });
}
