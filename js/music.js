// Lawris - prosedürel arka plan müziği ve "Hüküm" sesi (Web Audio, dosyasız)
// "Mahkeme kütüphanesi" havası: klavsen/pizzicato arpejler + yumuşak pad, Re majör / la minör renkleri.
const LS_KEY = 'lawris.music';
const BASE_BPM = 90;
const LOOKAHEAD = 0.3;   // sn (tablette ana iş parçacığı yoğunken kesinti olmasın diye geniş)
const TICK_MS = 50;

// Akorlar (MIDI, alttan üste 4 ses)
const C = {
  D: [50, 57, 62, 66], A: [52, 57, 61, 64], Bm: [50, 54, 59, 62], Fsm: [49, 54, 57, 61],
  G: [50, 55, 59, 62], Em: [52, 55, 59, 64], Am: [52, 57, 60, 64], Dm: [50, 57, 62, 65],
  C: [52, 55, 60, 64], A7: [52, 55, 61, 64], Fs7: [54, 58, 61, 64],
};
// Akor kökleri (pitch class) - bas hattı için
const ROOT = { D: 2, A: 9, Bm: 11, Fsm: 6, G: 7, Em: 4, Am: 9, Dm: 2, C: 0, A7: 9, Fs7: 6 };
const bassMidi = (name) => 38 + ((ROOT[name] - 2) % 12 + 12) % 12;
// 3 bölüm x 8 ölçü = 24 ölçülük döngü (A / B / A')
const SECTIONS = [
  { // A: Pachelbel benzeri
    chords: ['D', 'A', 'Bm', 'Fsm', 'G', 'D', 'G', 'A'],
    pattern: [0, 1, 2, 3, 2, 1, 2, 1],
    melody: { 0: [[0, 78, 3], [4, 76, 2], [6, 74, 2]], 2: [[0, 74, 2], [2, 73, 2], [4, 71, 4]], 4: [[0, 71, 3], [4, 74, 2], [6, 78, 2]], 6: [[0, 79, 2], [2, 78, 2], [4, 76, 4]] },
  },
  { // B: la minör renkli, daha hareketli
    chords: ['Bm', 'G', 'D', 'A', 'Bm', 'Em', 'Am', 'A7'],
    pattern: [0, 2, 1, 3, 1, 2, 3, 2],
    melody: { 1: [[0, 79, 2], [2, 78, 2], [4, 74, 4]], 3: [[0, 76, 3], [4, 73, 2], [6, 76, 2]], 5: [[0, 79, 3], [4, 76, 2], [6, 71, 2]], 7: [[0, 76, 2], [2, 73, 2], [4, 69, 4]] },
  },
  { // A': dönüş, farklı arpej ve kapanış
    chords: ['D', 'A', 'Bm', 'Fsm', 'G', 'D', 'Em', 'A'],
    pattern: [0, 2, 3, 2, 1, 2, 3, 1],
    melody: { 0: [[0, 81, 3], [4, 78, 2], [6, 76, 2]], 1: [[0, 76, 4], [4, 73, 4]], 3: [[0, 78, 2], [2, 76, 2], [4, 73, 4]], 4: [[0, 74, 3], [4, 71, 2], [6, 74, 2]], 6: [[0, 76, 3], [4, 79, 2], [6, 78, 2]], 7: [[0, 73, 3], [4, 74, 4]] },
  },
];
// İstinaf: akraba minör (Si minör) renkli sürüm - aynı melodi ailesi, aynı gam notaları
const MINOR = [
  { chords: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'Fs7'], pattern: [0, 2, 1, 3, 2, 3, 1, 2],
    melody: { 0: SECTIONS[0].melody[0], 2: SECTIONS[0].melody[2], 4: SECTIONS[0].melody[4], 6: SECTIONS[0].melody[6] } },
  { chords: ['Em', 'Bm', 'G', 'D', 'Em', 'G', 'A', 'Fs7'], pattern: [0, 3, 1, 2, 1, 3, 2, 3],
    melody: { 1: SECTIONS[1].melody[1], 3: SECTIONS[1].melody[3], 5: SECTIONS[1].melody[5] } },
  { chords: ['Bm', 'G', 'D', 'A', 'Em', 'G', 'Em', 'Fs7'], pattern: [0, 2, 3, 1, 2, 3, 2, 1],
    melody: { 0: SECTIONS[2].melody[0], 3: SECTIONS[2].melody[3], 4: SECTIONS[2].melody[4], 6: SECTIONS[2].melody[6] } },
];
const TOTAL_BARS = SECTIONS.length * 8;
const XF = 2.4;          // seviye geçişi çapraz solma süresi (sn); en kısa ölçüden (~2.42 sn) kısa
const MAX_LEVEL = 3;
const MAX_OSC = 40;      // aynı anda canlı kısa ömürlü osilatör sınırı (mobil CPU)
// Mahkeme derecesine göre katman hedefleri
const LV = [
  { bass: 0, bassx: 0, str: 0,    org: 0, pad: 1,   plk: 1,   mel: 1,   send: 0.35, fb: 0.30, dlf: 1800, tempo: 1 },
  { bass: 1, bassx: 0, str: 1,    org: 0, pad: 1,   plk: 1,   mel: 1,   send: 0.37, fb: 0.30, dlf: 1800, tempo: 1 },
  { bass: 1, bassx: 0, str: 1,    org: 0, pad: 1,   plk: 1,   mel: 1,   send: 0.38, fb: 0.31, dlf: 1800, tempo: 1.05 },
  { bass: 1, bassx: 1, str: 0.55, org: 1, pad: 0.5, plk: 0.4, mel: 0.8, send: 0.5,  fb: 0.42, dlf: 1500, tempo: 1.1 },
];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (a) => (Math.random() * 2 - 1) * a;

let ctx = null, fade = null, bus = null, master = null;
let timer = null, nextT = 0, step = 0, bar = 0;
let level = 0;       // istenen (bekleyen) seviye - setLevel yazar
let curLevel = 0;    // çalan seviye - yalnızca ölçü başında güncellenir
let live = 0;        // canlı kısa ömürlü osilatör sayısı
let pendingFade = null;
let bassBus = null, sendG = null, fbG = null, dlyLp = null;
const R = {};        // katman rampaları: ad -> {v0, v1, t0, t1}
const layers = { str: null, org: null };   // kalıcı osilatör katmanları (tembel oluşur)
let muted = false, running = false, paused = false;
try { muted = localStorage.getItem(LS_KEY) === 'off'; } catch (_) { muted = false; }

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try { ctx = new AC({ latencyHint: 'playback' }); } catch (_) { ctx = new AC(); }   // büyük tampon: cızırtıya karşı
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.12;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800; lp.Q.value = 0.4;
  // sınırlayıcı: müzik + efekt üst üste binince kırpılma (cızırtı) olmasın
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -6; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2;
  lp.connect(master); master.connect(lim); lim.connect(ctx.destination);
  fade = ctx.createGain(); fade.gain.value = 1;
  bus = ctx.createGain();
  fade.connect(bus); bus.connect(lp);
  // basit geri beslemeli gecikme = oda yankısı
  const dly = ctx.createDelay(1); dly.delayTime.value = 0.29;
  const fb = ctx.createGain(); fb.gain.value = 0.3;
  const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 1800;
  const dhp = ctx.createBiquadFilter(); dhp.type = 'highpass'; dhp.frequency.value = 180; // geri beslemede çamurlaşmayı önler
  const send = ctx.createGain(); send.gain.value = 0.35;
  bus.connect(send); send.connect(dly); dly.connect(dlp); dlp.connect(dhp); dhp.connect(fb); fb.connect(dly); dlp.connect(lp);
  sendG = send; fbG = fb; dlyLp = dlp;
  // bas yolu: yumuşak alçak geçiren
  bassBus = ctx.createGain(); bassBus.gain.value = 1;
  const blp = ctx.createBiquadFilter(); blp.type = 'lowpass'; blp.frequency.value = 380; blp.Q.value = 0.5;
  bassBus.connect(blp); blp.connect(fade);
  return true;
}

// Kısa ömürlü osilatör: sayaçlı, bitince düğümleri serbest bırakır
function osc(type, f, t0, t1, dest) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
  o.connect(dest); live++;
  o.onended = () => { live--; try { o.disconnect(); } catch (_) { /* yoksay */ } };
  o.start(t0); o.stop(t1);
  return o;
}

function pluck(t, midi, vel) {
  if (live > MAX_OSC - 2) return;
  const f = hz(midi), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(4200, f * 5), t); lp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 1.3), t + 0.5);
  const peak = 0.34 * vel, dec = 0.8 + Math.random() * 0.4;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  const g2 = ctx.createGain(); g2.gain.value = 0.12;
  const o1 = osc('triangle', f, t, t + dec + 0.05, lp);
  const o2 = osc('sawtooth', f, t, t + dec + 0.05, g2); o2.detune.value = 4;
  g2.connect(lp); lp.connect(g); g.connect(fade);
  o2.addEventListener('ended', () => { try { g.disconnect(); lp.disconnect(); g2.disconnect(); } catch (_) { /* yoksay */ } });
}

function pad(t, midi, dur, k) {
  if (k < 0.02 || live > MAX_OSC - 4) return;
  const g = ctx.createGain(), f = hz(midi);
  const a = 1.1, peak = 0.05 * k;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + dur - 0.2); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.2);
  [-6, 6].forEach((d, i) => {
    const o = osc(i ? 'sine' : 'triangle', f, t, t + dur + 1.3, g); o.detune.value = d;
    if (i) o.addEventListener('ended', () => { try { g.disconnect(); } catch (_) { /* yoksay */ } });
  });
  g.connect(fade);
}

// Bas: sinüs + üçgen, çok alçak seviye (bassBus alçak geçiren)
function bassNote(t, midi, dur, vol) {
  if (vol < 0.02 || live > MAX_OSC - 2) return;
  const f = hz(midi), g = ctx.createGain();
  const peak = 0.15 * vol;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.03);
  g.gain.setValueAtTime(peak * 0.8, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const g3 = ctx.createGain(); g3.gain.value = 0.35;
  osc('sine', f, t, t + dur + 0.05, g);
  const o2 = osc('triangle', f, t, t + dur + 0.05, g3);
  g3.connect(g); g.connect(bassBus);
  o2.addEventListener('ended', () => { try { g.disconnect(); g3.disconnect(); } catch (_) { /* yoksay */ } });
}

// ---- Katman rampaları (ölçü sınırında çapraz solma) ----
function val(name, t) {
  const r = R[name]; if (!r) return 0;
  if (t >= r.t1) return r.v1;
  if (t <= r.t0) return r.v0;
  return r.v0 + (r.v1 - r.v0) * (t - r.t0) / (r.t1 - r.t0);
}
function paramOf(name) {
  if (name === 'send') return sendG && sendG.gain;
  if (name === 'fb') return fbG && fbG.gain;
  if (name === 'dlf') return dlyLp && dlyLp.frequency;
  if (name === 'str' || name === 'org') return layers[name] && layers[name].out.gain;
  return null;
}
function ramp(name, to, t, dur) {
  const from = val(name, t);
  R[name] = { v0: from, v1: to, t0: t, t1: t + dur };
  const p = paramOf(name);
  if (p) { p.cancelScheduledValues(t); p.setValueAtTime(Math.max(from, 0.0001), t); p.linearRampToValueAtTime(Math.max(to, 0.0001), t + dur); }
}
function resetRamps(lv) {
  for (const k of ['bass', 'bassx', 'str', 'org', 'pad', 'plk', 'mel', 'send', 'fb', 'dlf']) R[k] = { v0: LV[lv][k], v1: LV[lv][k], t0: 0, t1: 0 };
}

// ---- Kalıcı katmanlar: yaylı (testere dalgaları) ve org (toplamsal sinüsler) ----
function makeLayer(kind, t, chord) {
  const out = ctx.createGain(); out.gain.value = 0.0001;
  const oscs = [];   // {o, off}
  if (kind === 'str') {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.3;
    lp.connect(out);
    [1, 2, 3].forEach((ci) => [-7, 7].forEach((d) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.detune.value = d;
      const vg = ctx.createGain(); vg.gain.value = 0.018;
      o.connect(vg); vg.connect(lp); oscs.push({ o, ci, mul: 1 });
    }));
  } else {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 0.3;
    lp.connect(out);
    [1, 2, 3].forEach((ci) => [1, 2, 3, 4].forEach((h) => {
      const o = ctx.createOscillator(); o.type = 'sine';
      const vg = ctx.createGain(); vg.gain.value = 0.02 / (h === 1 ? 1 : h * 0.55);
      o.connect(vg); vg.connect(lp); oscs.push({ o, ci, mul: h });
    }));
  }
  out.connect(fade);
  const L = {
    out, oscs, tc: kind === 'str' ? 0.12 : 0.04,
    set(tt, ch, first) {
      for (const v of oscs) {
        const f = hz(ch[v.ci]) * v.mul;
        if (first) v.o.frequency.setValueAtTime(f, tt); else v.o.frequency.setTargetAtTime(f, tt, L.tc);
      }
    },
    stop() {
      for (const v of oscs) { try { v.o.stop(); v.o.disconnect(); } catch (_) { /* yoksay */ } }
      try { out.disconnect(); } catch (_) { /* yoksay */ }
    },
  };
  L.set(t, chord, true);
  for (const v of oscs) v.o.start(t);
  return L;
}
function killLayers() {
  for (const k of ['str', 'org']) if (layers[k]) { layers[k].stop(); layers[k] = null; }
}
function scheduleCleanup(name) {
  const chk = () => {
    const r = R[name], L = layers[name];
    if (!L || !r || r.v1 !== 0) return;                       // yeniden yükseltildi / zaten yok
    if (!ctx || ctx.currentTime < r.t1 + 0.1) { setTimeout(chk, 600); return; }   // duraklatılmış olabilir
    L.stop(); layers[name] = null;
  };
  setTimeout(chk, (XF + 0.5) * 1000);
}

// Ölçü başında: bekleyen seviyeyi uygula (armoni takımı + çapraz solma)
function applyLevel(t) {
  if (curLevel === level) return;
  curLevel = level;
  const T = LV[curLevel], chordNow = null; void chordNow;
  for (const k of ['bass', 'bassx', 'pad', 'plk', 'mel', 'send', 'fb', 'dlf']) ramp(k, T[k], t, XF);
  pendingFade = T;
}


function scheduleStep(t, s, b) {
  if (s === 0) applyLevel(t);
  const sets = curLevel === 2 ? MINOR : SECTIONS;
  const sec = sets[Math.floor(b / 8)], bi = b % 8;
  const chordName = sec.chords[bi], chord = C[chordName], beat = 60 / (BASE_BPM * tempoK()) / 2;
  if (s === 0) {
    // kalıcı katmanlar: oluştur / akor değiştir / hedefe ramp
    const T = LV[curLevel];
    for (const k of ['str', 'org']) {
      if (T[k] > 0 && !layers[k]) layers[k] = makeLayer(k, t, chord);
      else if (layers[k]) layers[k].set(t, chord, false);
      if (layers[k] && pendingFade) {
        ramp(k, T[k], t, XF);
        if (T[k] === 0) scheduleCleanup(k);
      }
    }
    pendingFade = null;
  }
  const plk = val('plk', t), mel = val('mel', t);
  const accent = s % 4 === 0 ? 1 : s % 2 === 0 ? 0.85 : 0.7;
  const idx = sec.pattern[s];
  // Pizzicato/klavsen: seyrekleştirme (Yargıtay'da birkaç nota) - ana vuruşlar hep çalar
  if (s % 4 === 0 || Math.random() < plk * 0.8) pluck(t + rnd(0.008), chord[idx], accent * (0.85 + Math.random() * 0.3) * (0.55 + 0.45 * plk));
  // İstinaf: daha hareketli arpej (ara 16'lık notalar)
  if (curLevel === 2 && s % 2 === 1 && Math.random() < 0.5) pluck(t + beat * 0.5 + rnd(0.006), chord[sec.pattern[(s + 3) % 8]], 0.4);
  // Bas: 1. ve 3. vuruşta kök; Yargıtay'da oktav + beşli katlanır
  const bv = val('bass', t);
  if (bv > 0.02 && (s === 0 || s === 4)) {
    const root = bassMidi(chordName), bx = val('bassx', t);
    bassNote(t, root, beat * 4, bv);
    if (bx > 0.02) bassNote(t, s === 0 ? root + 12 : root + 7, beat * 4, bx * 0.7);
  }
  if (s === 0) {
    const barDur = beat * 8, pk = val('pad', t);
    pad(t, chord[1], barDur, pk); pad(t, chord[2], barDur, pk); pad(t, chord[0] - 12, barDur, pk);
    const notes = sec.melody[bi];
    if (notes && Math.random() > 0.15) {
      for (const [pos, m, len] of notes) {
        const mt = t + pos * beat + rnd(0.012);
        pluck(mt, m, (0.9 + Math.random() * 0.2) * mel);
        if (len >= 4) pluck(mt + beat * 0.02, m + 12, 0.18 * mel);
      }
    }
  }
}

const tempoK = () => LV[Math.min(MAX_LEVEL, curLevel)].tempo;

function tick() {
  if (!ctx || !running) return;
  while (nextT < ctx.currentTime + LOOKAHEAD) {
    scheduleStep(Math.max(nextT, ctx.currentTime + 0.03), step, bar);   // geç kalan nota hemen değil, kısa payla başlasın (tık sesi olmasın)
    nextT += 60 / (BASE_BPM * tempoK()) / 2;
    if (++step >= 8) { step = 0; bar = (bar + 1) % TOTAL_BARS; }
  }
}


// ---- Altın etki sesleri (kısa, yumuşak; sessizde / ses kapalıyken hiçbir şey yapmaz) ----
let noiseBuf = null, sfxLive = 0;
function noiseBuffer() {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const len = Math.floor(ctx.sampleRate * 1.0);
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
// filtreli gürültü: f0 -> f1 süpürme, a: [atak, ömür], v: seviye
function sfxNoise(out, t, type, f0, f1, q, atk, dur, v) {
  const n = ctx.createBufferSource(); n.buffer = noiseBuffer();
  const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f); f.connect(g); g.connect(out);
  n.start(t, Math.random() * 0.5); n.stop(t + dur + 0.03);
}
function sfxTone(out, t, type, f0, f1, atk, dur, v, vib) {
  const o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out);
  if (vib) {
    const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = vib[0]; lg.gain.value = vib[1];
    l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05);
  }
  o.start(t); o.stop(t + dur + 0.05);
}
const SFX = {
  tokmak(o, t) {
    [[0, 1], [0.15, 0.65]].forEach(([d, v]) => {
      sfxTone(o, t + d, 'sine', 125, 100, 0.004, 0.2, 0.75 * v);
      sfxNoise(o, t + d, 'bandpass', 1500, 1100, 1.4, 0.002, 0.05, 0.9 * v);
    });
    sfxTone(o, t + 0.15, 'triangle', 320, 290, 0.004, 0.3, 0.1);   // ahşap tınısı
    sfxNoise(o, t + 0.15, 'bandpass', 620, 560, 7, 0.004, 0.32, 0.25);
  },
  kilic(o, t) {
    sfxNoise(o, t, 'bandpass', 1200, 7000, 1.1, 0.12, 0.27, 0.5);
    sfxNoise(o, t + 0.05, 'highpass', 3000, 6500, 0.7, 0.1, 0.22, 0.18);
    [[1240, 0.2, 0.5], [1870, 0.12, 0.38], [2630, 0.08, 0.28]].forEach(([f, v, d]) => sfxTone(o, t + 0.25, 'sine', f, f, 0.004, d, v));
  },
  kalem(o, t) {
    let d = 0;
    const n = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const f = 3000 + Math.random() * 2000;
      sfxNoise(o, t + d, 'bandpass', f, f * (0.85 + Math.random() * 0.3), 2.5, 0.006, 0.035 + Math.random() * 0.03, 0.5);
      d += 0.045 + Math.random() * 0.05;
    }
    sfxNoise(o, t + d + 0.03, 'bandpass', 900, 700, 1.5, 0.002, 0.04, 0.45);
    sfxTone(o, t + d + 0.03, 'sine', 220, 160, 0.002, 0.07, 0.2);
  },
  paragraf(o, t) {
    sfxNoise(o, t, 'bandpass', 3200, 1100, 0.9, 0.015, 0.3, 0.5);
    sfxTone(o, t + 0.2, 'sine', 1760, 1760, 0.006, 0.5, 0.16);
    sfxTone(o, t + 0.2, 'sine', 3520, 3520, 0.006, 0.3, 0.04);
  },
  sutun(o, t) {
    sfxNoise(o, t, 'lowpass', 160, 380, 0.7, 0.35, 0.5, 0.8);
    sfxTone(o, t, 'sine', 62, 90, 0.4, 0.55, 0.45);
    [[196, 0.22], [293.7, 0.12]].forEach(([f, v]) => sfxTone(o, t + 0.45, 'sine', f, f, 0.02, 0.35, v));
  },
  kanun(o, t) {
    sfxTone(o, t, 'sine', 95, 50, 0.004, 0.3, 0.85);
    sfxNoise(o, t, 'lowpass', 700, 300, 0.8, 0.003, 0.14, 0.7);
    [[1318.5, 0.3], [1975.5, 0.36]].forEach(([f, d], i) => {
      sfxTone(o, t + 0.26 + i * 0.1, 'triangle', f, f, 0.004, 0.32, 0.22);
      sfxTone(o, t + 0.26 + i * 0.1, 'sine', f * 2, f * 2, 0.004, 0.18, 0.06);
    });
  },
  terazi(o, t) {
    sfxTone(o, t, 'sine', 880, 440, 0.18, 0.7, 0.3, [5.5, 9]);
    sfxTone(o, t, 'sine', 1320, 660, 0.2, 0.6, 0.06, [5.5, 12]);
    sfxNoise(o, t + 0.5, 'bandpass', 2400, 2200, 6, 0.002, 0.04, 0.3);
    sfxTone(o, t + 0.5, 'sine', 1500, 1400, 0.002, 0.06, 0.08);
  },
};

function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

export const music = {
  // Kullanıcı hareketi içinde çağrılmalı (Oyna / Tekrar oyna)
  init() {
    try {
      if (!ctx && !build()) return;
      if (ctx.state === 'suspended' && !paused) ctx.resume();
    } catch (_) { /* yoksay */ }
  },
  start() {
    try {
      if (!ctx) this.init();
      if (!ctx) return;
      stopTimer();
      paused = false; running = true;
      level = 0; curLevel = 0; step = 0; bar = 0; pendingFade = null;
      killLayers(); resetRamps(0);
      const now = ctx.currentTime;
      for (const [n, p] of [['send', sendG.gain], ['fb', fbG.gain], ['dlf', dlyLp.frequency]]) { p.cancelScheduledValues(now); p.setValueAtTime(LV[0][n], now); }
      ctx.resume();
      fade.gain.cancelScheduledValues(ctx.currentTime);
      fade.gain.setValueAtTime(0.0001, ctx.currentTime);
      fade.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
      nextT = ctx.currentTime + 0.15;
      timer = setInterval(tick, TICK_MS);
    } catch (_) { /* yoksay */ }
  },
  pause() {
    paused = true;
    try { if (ctx && running) ctx.suspend(); } catch (_) { /* yoksay */ }
  },
  resume() {
    paused = false;
    try { if (ctx && running) ctx.resume(); } catch (_) { /* yoksay */ }
  },
  fadeOut() {
    if (!ctx || !running) return;
    running = false; stopTimer();
    try {
      const t = ctx.currentTime;
      fade.gain.cancelScheduledValues(t);
      fade.gain.setValueAtTime(fade.gain.value, t);
      fade.gain.linearRampToValueAtTime(0.0001, t + 2);
      setTimeout(() => { if (!running) killLayers(); }, 2300);
    } catch (_) { /* yoksay */ }
  },
  // Bekleyen seviye; bir sonraki ölçü başında çapraz solmayla uygulanır (start öncesi/duraklatılmışken de güvenli)
  setLevel(i) { const n = Number(i); level = Number.isFinite(n) ? Math.max(0, Math.min(MAX_LEVEL, Math.floor(n))) : 0; },
  isMuted() { return muted; },
  setMuted(m) {
    muted = !!m;
    try { localStorage.setItem(LS_KEY, muted ? 'off' : 'on'); } catch (_) { /* yoksay */ }
    if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.12, ctx.currentTime, 0.05);
  },
  // Altın parça duyurusu: yumuşak, parlak iki parçalı çınlama
  chime() {
    if (muted || !ctx || ctx.state !== 'running') return;
    try {
      const t = ctx.currentTime + 0.01;
      for (const [f, v, d, off, type] of [[1318.5, 0.5, 0.65, 0, 'sine'], [1976, 0.32, 0.6, 0.06, 'triangle'], [2637, 0.12, 0.4, 0.06, 'sine']]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + off);
        g.gain.linearRampToValueAtTime(v, t + off + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + off + d);
        o.connect(g); g.connect(master);
        o.start(t + off); o.stop(t + off + d + 0.05);
      }
    } catch (_) { /* yoksay */ }
  },
  // Satır silme: yumuşak tahta tokmak darbesi
  knock() {
    if (muted || !ctx || ctx.state !== 'running') return;
    try {
      const t = ctx.currentTime + 0.01;
      const len = Math.floor(ctx.sampleRate * 0.08);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const n = ctx.createBufferSource(); n.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1.2;
      const ng = ctx.createGain(); ng.gain.value = 0.9;
      n.connect(bp); bp.connect(ng); ng.connect(master);
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(65, t + 0.12);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(0.7, t + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(og); og.connect(master);
      n.start(t); o.start(t); o.stop(t + 0.25);
    } catch (_) { /* yoksay */ }
  },
  // Altın etki sesi (kind: tokmak|kilic|kalem|paragraf|sutun|kanun|terazi); vol 0..1
  sfx(kind, vol = 1) {
    if (muted || !ctx || ctx.state !== 'running' || !SFX[kind] || sfxLive >= 3) return;
    try {
      const out = ctx.createGain(); out.gain.value = Math.max(0, Math.min(1, vol)) * 0.9;
      out.connect(master); sfxLive++;
      SFX[kind](out, ctx.currentTime + 0.01);
      setTimeout(() => { sfxLive = Math.max(0, sfxLive - 1); try { out.disconnect(); } catch (_) { /* yoksay */ } }, 1100);
    } catch (_) { /* yoksay */ }
  },
  // Rehber demosu için: yalnızca ses zaten çalışıyorsa ve kapalı değilse (asla sesi başlatmaz)
  isLive() { return !muted && !!ctx && ctx.state === 'running'; },
};
