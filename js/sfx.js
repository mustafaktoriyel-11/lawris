// Lex Stack - efekt kitaplığı (prosedürel, dosyasız). Ortak ses çekirdeği music.js'den gelir:
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

// Çan/lir tınısı: sinüs temel + üçgen + 2. ve çalgı-dışı (inharmonik) üst ses, hızlı atak, pan'lı
function bell(A, o, t, midi, v, dec = 0.45, pan = 0) {
  const c = A.ctx, f = A.hz(midi);
  let out = o;
  if (pan && c.createStereoPanner) { out = c.createStereoPanner(); out.pan.value = Math.max(-1, Math.min(1, pan)); out.connect(o); setTimeout(() => { try { out.disconnect(); } catch (_) { /* yoksay */ } }, (dec + 0.4) * 1000 + (t - c.currentTime) * 1000); }
  A.tone(out, t, 'sine', f, f, 0.003, dec, v);
  A.tone(out, t, 'triangle', f * 2, f * 2, 0.002, dec * 0.5, v * 0.3);
  A.tone(out, t, 'sine', f * 2.76, f * 2.76, 0.002, dec * 0.25, v * 0.12);
  A.tone(out, t, 'sine', f * 4.1, f * 4.1, 0.002, dec * 0.12, v * 0.05);
}
// Parmak zili/krotal: yüksek, kısa, inharmonik sinüsler
function crotale(A, o, t, midi, v, pan = 0) {
  const c = A.ctx, f = A.hz(midi);
  let out = o;
  if (pan && c.createStereoPanner) { out = c.createStereoPanner(); out.pan.value = pan; out.connect(o); setTimeout(() => { try { out.disconnect(); } catch (_) { /* yoksay */ } }, 900 + (t - c.currentTime) * 1000); }
  A.tone(out, t, 'sine', f, f, 0.001, 0.4, v);
  A.tone(out, t, 'sine', f * 2.4, f * 2.4, 0.001, 0.22, v * 0.5);
  A.tone(out, t, 'sine', f * 3.9, f * 3.9, 0.001, 0.12, v * 0.25);
}
// Işıltı süpürmesi: yüksek geçiren gürültü (hf Hz üstü)
function sparkle(A, o, t, dur, hf, v) { A.noiseTo(o, t, 'highpass', hf, hf * 2.4, 0.7, Math.min(0.05, dur * 0.3), dur, v); }
// Altta küçük tok vuruş (>=120 Hz, baskın değil)
function thump(A, o, t, v) { A.tone(o, t, 'sine', 190, 135, 0.003, 0.11, v); }

// Parçaya göre yerleşme: [gövde Hz üst, alt, gövde türü, gövde süresi, tak bandı Hz, tak Q, tık Hz, tık seviyesi, genel seviye]
// Telefon hoparlörü için asıl enerji 800 Hz-3 kHz tak/tık geçicisinde; gövde 200-400 Hz + 2.5x harmonik.
const LOCK = {
  default:  [310, 200, 'triangle', 0.075, 1300, 1.3, 2800, 0.6, 1.0],
  kanun:    [240, 150, 'sine',     0.11,  1000, 0.9, 2300, 0.5, 1.25],   // kalın taş tablet: ağır
  sutun:    [380, 260, 'sine',     0.08,  1700, 2.0, 3200, 0.75, 1.05],  // mermer: sert taş tak
  kalem:    [520, 360, 'triangle', 0.05,  2200, 1.4, 4000, 0.7, 0.85],   // hafif
  kilic:    [330, 220, 'triangle', 0.08,  1500, 1.2, 3400, 0.7, 1.0],    // + metalik kenar
  tokmak:   [330, 270, 'triangle', 0.09,  950,  5.0, 2600, 0.5, 1.05],   // ahşap tıkırtı
  terazi:   [310, 230, 'triangle', 0.075, 1200, 1.6, 3000, 0.55, 1.0],
  paragraf: [450, 300, 'triangle', 0.06,  1900, 1.3, 3600, 0.6, 0.9],
};
function thud(A, o, t, type, heavy) {
  const [f0, f1, bt, dur, mf, mq, cf, cv, lv0] = LOCK[type] || LOCK.default;
  const k = jit(0.04), lv = lv0 * (heavy ? 1.35 : 1), dm = heavy ? 1.5 : 1;
  A.tone(o, t, bt, f0 * k, f1 * k, 0.002, dur * dm, 0.62 * lv);                         // pitchli gövde
  A.tone(o, t, 'sine', f0 * 2.5 * k, f1 * 2.3 * k, 0.001, dur * 0.7, 0.3 * lv);        // 2.5x harmonik (küçük hoparlörde duyulur)
  A.noiseTo(o, t, 'bandpass', mf * 1.2, mf * 0.8, mq, 0.001, 0.055 * dm, 0.95 * lv);     // tak geçicisi (800 Hz-3 kHz)
  A.noiseTo(o, t, 'bandpass', cf, cf * 0.85, 0.9, 0.0006, 0.014, cv * (heavy ? 1.2 : 1)); // parlak tık
  A.tone(o, t, 'sine', heavy ? 125 : 150, heavy ? 85 : 110, 0.003, heavy ? 0.16 : 0.09, heavy ? 0.45 : 0.22);   // alt ağırlık (varsa)
  if (heavy) A.noiseTo(o, t, 'bandpass', 700, 450, 0.8, 0.002, 0.12, 0.45);
  if (type === 'kilic') { A.tone(o, t, 'sine', 2100, 2060, 0.002, 0.16, 0.12); A.tone(o, t, 'sine', 3140, 3100, 0.002, 0.1, 0.07); }
  if (type === 'tokmak') A.tone(o, t, 'triangle', 340, 300, 0.003, 0.14, 0.22);
  if (type === 'kanun') A.noiseTo(o, t, 'lowpass', 500, 220, 0.7, 0.003, 0.14, 0.4);
  if (type === 'sutun') { A.tone(o, t, 'sine', 1050 * k, 1000 * k, 0.001, 0.09, 0.14); A.tone(o, t, 'sine', 2900, 2850, 0.001, 0.05, 0.08); }
  if (type === 'terazi') A.tone(o, t, 'sine', 1760, 1740, 0.001, 0.12, 0.07);
}
// Parlak "shing" geçicisi (3-6 kHz, kısa) + metalik tıngırtı
function shing(A, o, t, v) {
  A.noiseTo(o, t, 'bandpass', 3200, 5800, 1.3, 0.002, 0.11, v);
  A.noiseTo(o, t, 'highpass', 3500, 5500, 0.7, 0.002, 0.07, v * 0.45);
  A.tone(o, t, 'sine', 4300, 4300, 0.001, 0.12, v * 0.22);
  A.tone(o, t, 'sine', 5600, 5600, 0.001, 0.07, v * 0.14);
}
// Kısa yankı kuyruğu: aynı notanın sönen 2 tekrarı
function tail(A, o, t, midi, v, pan = 0) {
  bell(A, o, t + 0.11, midi, v * 0.32, 0.5, pan * 0.6); bell(A, o, t + 0.22, midi, v * 0.16, 0.45, -pan * 0.6);
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
    play('move', 0.05, (A, o, t) => {
      const k = jit(0.05);
      A.noiseTo(o, t, 'bandpass', 2000 * k, 1700, 3, 0.001, 0.016, 0.16);
      A.tone(o, t, 'sine', 900 * k, 700, 0.001, 0.018, 0.07);
    }, { gap: 35 });
  },
  // Alçalma adımı: çok hafif tık (main.js bağlamak isterse)
  softDrop() {
    play('soft', 0.04, (A, o, t) => {
      A.noiseTo(o, t, 'bandpass', 1500, 1200, 3, 0.001, 0.012, 0.08);
      A.tone(o, t, 'sine', 600, 500, 0.001, 0.014, 0.04);
    }, { gap: 45 });
  },
  // Dönüş: kısa hışırtı (1.2-3 kHz süpürme) + ~1.5 kHz perdeli tık
  rotate() {
    play('rotate', 0.1, (A, o, t) => {
      const k = jit(0.07);
      A.noiseTo(o, t, 'bandpass', 1200 * k, 3000 * k, 1.6, 0.004, 0.045, 0.85);   // swish
      A.tone(o, t + 0.022, 'sine', 1500 * k, 1250 * k, 0.001, 0.035, 0.5);         // perdeli tık
      A.tone(o, t + 0.022, 'triangle', 750 * k, 640 * k, 0.001, 0.03, 0.18);
      A.noiseTo(o, t + 0.022, 'bandpass', 3000, 2600, 1.2, 0.0006, 0.01, 0.38);    // tık geçicisi
    }, { gap: 45 });
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
    const d = Math.max(0.1, Math.min(0.17, 0.07 + n * 0.006));
    play('hard', 0.5, (A, o, t) => {
      A.noiseTo(o, t, 'bandpass', 2800, 300, 1.2, 0.01, d, 0.8);             // aşağı süpürmeli whoosh
      A.tone(o, t, 'sine', 1400, 250, 0.008, d, 0.14);
      thud(A, o, t + d * 0.92, type, true);
    }, { prio: true });
  },
  // Satır silme: sayıya göre kademeli (1: ışıltılı çınlama, 2: daha yüksek+ikinci ses, 3: arp+akor çiçeği, 4+: fanfar); seviye ile hafifçe yükselir
  lineClear(n, lvl = 0) {
    const sh = Math.max(0, Math.min(3, lvl)), r = 62 + sh;     // Re + mahkeme başına yarım perde
    const br = 1 + sh * 0.12;
    play('clear', 1.8, (A, o, t) => {
      if (n === 1) {
        thump(A, o, t, 0.28);
        shing(A, o, t, 0.55);
        [0, 4, 7].forEach((x, i) => { bell(A, o, t + i * 0.05, r + 12 + x, 0.55, 0.55, (i - 1) * 0.25); });
        tail(A, o, t + 0.1, r + 19, 0.55, 0.3);
        sparkle(A, o, t, 0.25, 3000, 0.22);
      } else if (n === 2) {
        thump(A, o, t, 0.28);
        shing(A, o, t, 0.6);
        tail(A, o, t + 0.2, r + 24, 0.5, 0.3);
        [0, 4, 7, 12].forEach((x, i) => {
          bell(A, o, t + i * 0.055, r + 12 + x, 0.5, 0.6, (i - 1.5) * 0.25);
          bell(A, o, t + i * 0.055 + 0.012, r + 19 + x, 0.22, 0.5, (1.5 - i) * 0.2);   // beşli üstü ikinci ses
        });
        sparkle(A, o, t, 0.34, 3000, 0.3);
        crotale(A, o, t + 0.17, r + 36, 0.07, 0.3);
      } else if (n === 3) {
        thump(A, o, t, 0.28);
        shing(A, o, t, 0.65);
        [0, 4, 7, 12].forEach((x, i) => bell(A, o, t + i * 0.06, r + 12 + x, 0.4, 0.65, (i - 1.5) * 0.4));
        const tb = t + 0.24;                                       // akor çiçeği
        [12, 19, 24, 28].forEach((x, i) => {
          bell(A, o, tb, r + x, 0.24, 1.0, (i - 1.5) * 0.45);
          A.tone(o, tb, 'triangle', A.hz(r + x), A.hz(r + x), 0.03, 0.8, 0.06);
        });
        sparkle(A, o, t, 0.5, 3200, 0.3);
        crotale(A, o, t + 0.18, r + 31, 0.08, -0.4); crotale(A, o, t + 0.26, r + 36, 0.08, 0.4); crotale(A, o, tb + 0.06, r + 40, 0.07, 0);
        sparkle(A, o, tb, 0.6, 5500, 0.16); shing(A, o, tb, 0.4); tail(A, o, tb, r + 31, 0.4, 0.4);
      } else {
        thump(A, o, t, 0.32);
        shing(A, o, t, 0.7);
        // cornu tarzı kısa pirinç: iki kısa vuruş + uzun akor (hızlı kabarma)
        brass(A, o, t, r, 0.16, 0.17, br); brass(A, o, t, r + 7, 0.16, 0.13, br);
        brass(A, o, t + 0.17, r + 4, 0.16, 0.17, br); brass(A, o, t + 0.17, r + 12, 0.16, 0.13, br);
        [0, 7, 12, 16].forEach((x) => brass(A, o, t + 0.34, r + x, 0.75, 0.16, br));
        // parlak yükselen arp üstte
        [0, 4, 7, 12, 16, 19].forEach((x, i) => bell(A, o, t + 0.02 + i * 0.055, r + 12 + x, 0.36, 0.6, (i - 2.5) * 0.3));
        const tb = t + 0.36;
        [12, 19, 24, 28, 31].forEach((x, i) => bell(A, o, tb, r + x, 0.2, 1.1, (i - 2) * 0.4));
        shing(A, o, tb, 0.5); tail(A, o, tb, r + 31, 0.45, 0.4);
        crotale(A, o, t + 0.34, r + 36, 0.09, -0.4); crotale(A, o, t + 0.42, r + 40, 0.09, 0.4); crotale(A, o, t + 0.5, r + 43, 0.08, 0);
        sparkle(A, o, t, 0.4, 3200, 0.28);
        sparkle(A, o, tb, 0.8, 5000, 0.24);                        // zil ışıltısı
        thump(A, o, tb, 0.2);
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
