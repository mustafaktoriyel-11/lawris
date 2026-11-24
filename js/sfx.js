// Juristack - efekt kitaplığı (prosedürel, dosyasız). Ortak ses çekirdeği music.js'den gelir:
// hepsi tek efekt veriyolundan geçer (tanh yumuşak sınırlama + kısa oda yankısı + sınırlayıcı).
import { music } from './music.js';

const MAX_LIVE = 8;          // aynı anda canlı efekt sınırı (hafif CPU)
let live = 0;
const lastAt = {};

// Bir efekti çalıştır: kapı denetimi, hız sınırı, eşzamanlılık sınırı; fn(A, o, t) ses grafiğini kurar
function play(name, life, fn, { gap = 0, vol = 1, prio = false } = {}) {
  if (!music.sfxReady()) return;
  const A = music.core(); if (!A) return;
  const now = performance.now();
  if (gap && now - (lastAt[name] || 0) < gap) return;
  if (live >= (prio ? MAX_LIVE + 4 : MAX_LIVE)) return;
  lastAt[name] = now;
  try {
    const o = A.ctx.createGain(); o.gain.value = vol; o.connect(A.out);
    live++;
    fn(A, o, A.ctx.currentTime + 0.006);
    setTimeout(() => { live = Math.max(0, live - 1); try { o.disconnect(); } catch (_) { /* yoksay */ } }, life * 1000 + 150);
  } catch (_) { /* yoksay */ }
}
const jit = (a) => 1 + (Math.random() * 2 - 1) * a;

// Testere yığını (pirinç havası): detune'lu testereler -> alçak geçiren (süpürmeli) -> zarf
function brass(A, o, t, midi, dur, v, bright = 1) {
  const c = A.ctx, f = A.hz(midi), g = c.createGain(), lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 0.8;
  lp.frequency.setValueAtTime(f * 1.5, t); lp.frequency.exponentialRampToValueAtTime(Math.min(5200, f * 5 * bright), t + 0.09);
  lp.frequency.exponentialRampToValueAtTime(f * 2.2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.03);
  g.gain.setValueAtTime(v * 0.8, t + Math.max(0.05, dur - 0.12)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
  [-9, 0, 9].forEach((d) => {
    const s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f; s.detune.value = d;
    const sg = c.createGain(); sg.gain.value = 0.33;
    s.connect(sg); sg.connect(lp); s.start(t); s.stop(t + dur + 0.12);
  });
  lp.connect(g); g.connect(o);
}
// Davul gümbürtüsü (timpani havası): alçak sinüs + yumuşak vuruş
function timp(A, o, t, f, v, dur = 0.7) {
  A.tone(o, t, 'sine', f * 1.5, f, 0.004, dur, v);
  A.tone(o, t, 'triangle', f * 2.1, f * 1.4, 0.004, dur * 0.4, v * 0.25);
  A.noiseTo(o, t, 'lowpass', 500, 150, 0.7, 0.002, 0.12, v * 0.7);
}
// Koro benzeri pad: testere + iki formant süzgeci, yavaş atak, hafif vibrato
function choir(A, o, t, midis, dur, v) {
  const c = A.ctx, g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.28);
  g.gain.setValueAtTime(v, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter();
  f1.type = f2.type = 'bandpass'; f1.frequency.value = 720; f2.frequency.value = 1150; f1.Q.value = f2.Q.value = 3;
  const m1 = c.createGain(), m2 = c.createGain(); m1.gain.value = 1; m2.gain.value = 0.6;
  const src = c.createGain(); src.gain.value = 0.5;
  src.connect(f1); src.connect(f2); f1.connect(m1); f2.connect(m2); m1.connect(g); m2.connect(g);
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.2; lg.gain.value = 7; lfo.connect(lg);
  lfo.start(t); lfo.stop(t + dur + 0.1);
  for (const m of midis) [-8, 8].forEach((d) => {
    const s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = A.hz(m); s.detune.value = d;
    lg.connect(s.detune);
    const sg = c.createGain(); sg.gain.value = 0.25;
    s.connect(sg); sg.connect(src); s.start(t); s.stop(t + dur + 0.1);
  });
  g.connect(o);
}
// Akor darbesi: kısa, parlak, yumuşak (üçgen + testere, süzgeçli)
function stab(A, o, t, midis, v, dec = 0.4, bright = 1) {
  const c = A.ctx;
  for (const m of midis) {
    const f = A.hz(m), g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(6000, f * 7 * bright), t); lp.frequency.exponentialRampToValueAtTime(f * 1.6, t + dec);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    const a = c.createOscillator(); a.type = 'sawtooth'; a.frequency.value = f; a.detune.value = 5;
    const ag = c.createGain(); ag.gain.value = 0.4;
    const b = c.createOscillator(); b.type = 'triangle'; b.frequency.value = f;
    a.connect(ag); ag.connect(lp); b.connect(lp); lp.connect(g); g.connect(o);
    a.start(t); b.start(t); a.stop(t + dec + 0.05); b.stop(t + dec + 0.05);
  }
}
// Tokmak darbesi (satır silme ve final)
function gavel(A, o, t, v = 1) {
  A.tone(o, t, 'sine', 160, 62, 0.003, 0.2, 0.9 * v);
  A.noiseTo(o, t, 'bandpass', 950, 600, 1.1, 0.002, 0.07, 0.9 * v);
  A.noiseTo(o, t, 'bandpass', 3200, 2400, 0.8, 0.001, 0.015, 0.5 * v);
  A.tone(o, t + 0.01, 'triangle', 330, 290, 0.003, 0.16, 0.14 * v);
}
// Yükselen ışıltı: sıralı üst notalar + hava
function shimmer(A, o, t, midis, step, v) {
  midis.forEach((m, i) => {
    const f = A.hz(m);
    A.tone(o, t + i * step, 'triangle', f, f, 0.004, 0.32, v);
    A.tone(o, t + i * step, 'sine', f * 2, f * 2, 0.004, 0.2, v * 0.3);
  });
  A.noiseTo(o, t, 'highpass', 2500, 9000, 0.7, 0.08, midis.length * step + 0.22, v * 0.5);
}

// Parçaya göre yerleşme (tok) ayarı: [gövde Hz üst/alt, süre, gövde seviyesi, orta band Hz, orta Q, tık Hz, tık seviyesi]
const LOCK = {
  default:  [86, 46, 0.17, 0.9, 650, 1.0, 2800, 0.5],
  kanun:    [72, 38, 0.24, 1.0, 430, 0.9, 2200, 0.4],    // kalın cilt: derin kitap sesi
  sutun:    [80, 44, 0.2, 0.95, 820, 2.2, 3200, 0.6],    // taş
  kalem:    [118, 66, 0.1, 0.65, 950, 1.1, 4200, 0.5],   // hafif
  kilic:    [92, 50, 0.15, 0.85, 700, 1.0, 3400, 0.55],  // + metalik kenar
  tokmak:   [100, 56, 0.15, 0.9, 620, 4.5, 3000, 0.5],   // ahşap
  terazi:   [90, 48, 0.15, 0.85, 560, 1.4, 3000, 0.5],
  paragraf: [102, 56, 0.12, 0.75, 1000, 1.2, 3600, 0.45],
};
function thud(A, o, t, type, heavy) {
  const [f0, f1, dur, bv, mf, mq, cf, cv] = LOCK[type] || LOCK.default;
  const k = jit(0.04), hv = heavy ? 1.25 : 1;
  A.tone(o, t, 'sine', f0 * k * (heavy ? 1.1 : 1), f1 * k, 0.003, dur * (heavy ? 1.5 : 1), bv * hv);   // alçak gümbürtü
  A.tone(o, t, 'triangle', f0 * 2.4 * k, f1 * 1.6, 0.002, 0.06, 0.18 * hv);                          // vuruş gövdesi
  A.noiseTo(o, t, 'bandpass', mf * 1.25, mf * 0.7, mq, 0.002, 0.09 * (heavy ? 1.3 : 1), 0.62 * hv);   // orta gövde
  A.noiseTo(o, t, 'bandpass', cf, cf * 0.8, 0.8, 0.0008, 0.014, cv);                                 // net tık
  if (type === 'kilic') { A.tone(o, t, 'sine', 2100, 2060, 0.002, 0.14, 0.07); A.tone(o, t, 'sine', 3140, 3100, 0.002, 0.09, 0.04); }
  if (type === 'tokmak') A.tone(o, t, 'triangle', 330, 300, 0.003, 0.14, 0.16);
  if (type === 'kanun') A.noiseTo(o, t, 'lowpass', 380, 160, 0.7, 0.003, 0.16, 0.45);
  if (type === 'sutun') A.tone(o, t, 'sine', 240, 190, 0.003, 0.08, 0.14);
}

export const sfx = {
  // Arayüz tıkı: yumuşak ahşap/kâğıt, biraz gövdeli
  ui() {
    play('ui', 0.12, (A, o, t) => {
      const k = jit(0.05);
      A.tone(o, t, 'sine', 980 * k, 520 * k, 0.002, 0.04, 0.34);
      A.tone(o, t, 'sine', 240 * k, 150, 0.003, 0.07, 0.3);
      A.noiseTo(o, t, 'bandpass', 2200 * k, 1500, 2, 0.001, 0.02, 0.32);
    }, { gap: 25 });
  },
  move() {
    play('move', 0.06, (A, o, t) => {
      A.noiseTo(o, t, 'bandpass', 2300, 1700, 3, 0.001, 0.022, 0.2);
      A.tone(o, t, 'sine', 430, 300, 0.001, 0.03, 0.12);
    }, { gap: 30 });
  },
  rotate() {
    play('rotate', 0.15, (A, o, t) => {
      const k = jit(0.03);
      A.noiseTo(o, t, 'bandpass', 2000, 700, 1.2, 0.002, 0.05, 0.6);               // kamçı geçici sesi
      A.tone(o, t, 'triangle', 640 * k, 300 * k, 0.002, 0.1, 0.6);                  // düşen perdeli gövde
      A.tone(o, t, 'sine', 330 * k, 170, 0.002, 0.11, 0.38);
      A.noiseTo(o, t, 'bandpass', 4200, 3600, 1, 0.001, 0.012, 0.3);
    }, { gap: 40 });
  },
  hold() {
    play('hold', 0.3, (A, o, t) => {
      A.noiseTo(o, t, 'bandpass', 3600, 1200, 0.8, 0.04, 0.24, 0.42);               // kâğıt kayması
      A.noiseTo(o, t + 0.02, 'highpass', 5200, 2600, 0.6, 0.05, 0.2, 0.12);
      A.tone(o, t + 0.17, 'sine', 600, 420, 0.003, 0.05, 0.1);
    }, { gap: 60 });
  },
  // Her parça yerleşmesi: tok
  lock(type) { play('lock', 0.3, (A, o, t) => thud(A, o, t, type, false), { gap: 20, prio: true }); },
  // Hızlı düşürme: hızlı hışırtı, ardından ağır gümbürtü (mesafe n hücre)
  hardDrop(type, n = 8) {
    const d = Math.max(0.07, Math.min(0.15, 0.05 + n * 0.006));
    play('hard', 0.45, (A, o, t) => {
      A.noiseTo(o, t, 'bandpass', 3400, 450, 0.9, 0.012, d, 0.55);
      A.tone(o, t, 'sine', 900, 150, 0.01, d, 0.12);
      thud(A, o, t + d * 0.9, type, true);
    }, { prio: true });
  },
  // Satır silme: sayıya göre kademeli; seviye ile hafifçe yükselir
  lineClear(n, lvl = 0) {
    const sh = Math.max(0, Math.min(3, lvl)), r = 62 + sh;     // Re + mahkeme başına yarım perde
    const br = 1 + sh * 0.12;
    play('clear', 1.8, (A, o, t) => {
      const maj = (b, ex = []) => [b, b + 4, b + 7, ...ex];
      gavel(A, o, t, 1);
      if (n === 1) {
        stab(A, o, t, maj(r), 0.34, 0.45, br);
      } else if (n === 2) {
        stab(A, o, t, maj(r, [r + 12]), 0.34, 0.5, br);
        shimmer(A, o, t + 0.07, [r + 19, r + 24, r + 28, r + 31], 0.055, 0.26);
      } else if (n === 3) {
        stab(A, o, t, maj(r - 12, [r, r + 4, r + 7, r + 12]), 0.3, 0.7, br);
        shimmer(A, o, t + 0.07, [r + 19, r + 24, r + 28, r + 31, r + 36], 0.05, 0.26);
        choir(A, o, t + 0.04, [r, r + 7, r + 12, r + 16], 1.0, 0.2);
      } else {
        timp(A, o, t, 73, 0.95, 0.9);
        stab(A, o, t, maj(r - 12, [r, r + 4, r + 7, r + 12]), 0.3, 0.8, br);
        // pirinç mini fanfar: açılış - yükseliş - uzun akor
        brass(A, o, t, r, 0.2, 0.2, br); brass(A, o, t, r + 7, 0.2, 0.17, br);
        brass(A, o, t + 0.2, r + 4, 0.2, 0.2, br); brass(A, o, t + 0.2, r + 12, 0.2, 0.17, br);
        [0, 7, 12, 16, 19].forEach((x) => brass(A, o, t + 0.4, r + x, 1.0, 0.17, br));
        timp(A, o, t + 0.4, 87, 0.8, 0.9);
        choir(A, o, t + 0.1, [r, r + 7, r + 12, r + 16], 1.4, 0.24);
        shimmer(A, o, t + 0.42, [r + 24, r + 28, r + 31, r + 36], 0.06, 0.28);
      }
    }, { prio: true });
    if (n >= 3) music.duck(0.5, 0.3); else if (n === 2) music.duck(0.6, 0.15);
  },
  // Yeni mahkeme: dürüst kısa fanfar (4 nota) + davul
  levelUp(lvl = 1, delay = 0.3) {
    play('level', 1.8, (A, o, t0) => {
      const t = t0 + delay, r = 62 + [0, 2, 4, 7][Math.max(0, Math.min(3, lvl))] - 2;
      timp(A, o, t, 82, 0.8, 0.7);
      [[0, 0, 0.16], [4, 0.16, 0.16], [7, 0.32, 0.16]].forEach(([x, d, du]) => { brass(A, o, t + d, r + x, du + 0.04, 0.2); brass(A, o, t + d, r + x + 12, du + 0.04, 0.12); });
      [0, 4, 7, 12, 16].forEach((x) => brass(A, o, t + 0.48, r + x, 0.85, 0.18));
      timp(A, o, t + 0.48, 98, 0.9, 0.9);
      A.tone(o, t + 0.5, 'sine', A.hz(r + 24), A.hz(r + 24), 0.01, 0.6, 0.06);
    }, { prio: true });
    music.duck(0.55, 0.5 + delay);
  },
  // Dava düştü: inen minör cümle + son yumuşak tokmak
  gameOver() {
    play('over', 2.6, (A, o, t) => {
      const seq = [[69, 0], [65, 0.26], [62, 0.52], [57, 0.8]];
      seq.forEach(([m, d], i) => {
        const f = A.hz(m), last = i === seq.length - 1, dur = last ? 1.1 : 0.3;
        A.tone(o, t + d, 'triangle', f, f * 0.985, 0.012, dur, last ? 0.34 : 0.3);
        A.tone(o, t + d, 'sine', f * 0.5, f * 0.5, 0.012, dur, 0.22);
        A.noiseTo(o, t + d, 'lowpass', 1800, 600, 0.7, 0.005, 0.1, 0.1);
      });
      [50, 53, 57].forEach((m) => A.tone(o, t + 0.8, 'sine', A.hz(m), A.hz(m) * 0.99, 0.05, 1.3, 0.12));   // Re minör kapanış
      gavel(A, o, t + 1.25, 0.6);
    }, { prio: true });
    music.duck(0.6, 0.6);
  },
};
