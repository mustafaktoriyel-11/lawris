// Lawris - prosedürel arka plan müziği ve "Hüküm" sesi (Web Audio, dosyasız)
// "Mahkeme kütüphanesi" havası: klavsen/pizzicato arpejler + yumuşak pad, Re majör / la minör renkleri.
const LS_KEY = 'lawris.music';
const BASE_BPM = 90;
const LOOKAHEAD = 0.1;   // sn
const TICK_MS = 25;

// Akorlar (MIDI, alttan üste 4 ses)
const C = {
  D: [50, 57, 62, 66], A: [52, 57, 61, 64], Bm: [50, 54, 59, 62], Fsm: [49, 54, 57, 61],
  G: [50, 55, 59, 62], Em: [52, 55, 59, 64], Am: [52, 57, 60, 64], Dm: [50, 57, 62, 65],
  C: [52, 55, 60, 64], A7: [52, 55, 61, 64],
};
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
const TOTAL_BARS = SECTIONS.length * 8;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (a) => (Math.random() * 2 - 1) * a;

let ctx = null, fade = null, bus = null, master = null;
let timer = null, nextT = 0, step = 0, bar = 0, level = 0;
let muted = false, running = false, paused = false;
try { muted = localStorage.getItem(LS_KEY) === 'off'; } catch (_) { muted = false; }

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.12;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800; lp.Q.value = 0.4;
  lp.connect(master); master.connect(ctx.destination);
  fade = ctx.createGain(); fade.gain.value = 1;
  bus = ctx.createGain();
  fade.connect(bus); bus.connect(lp);
  // basit geri beslemeli gecikme = oda yankısı
  const dly = ctx.createDelay(1); dly.delayTime.value = 0.29;
  const fb = ctx.createGain(); fb.gain.value = 0.3;
  const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 1800;
  const send = ctx.createGain(); send.gain.value = 0.35;
  bus.connect(send); send.connect(dly); dly.connect(dlp); dlp.connect(fb); fb.connect(dly); dlp.connect(lp);
  return true;
}

function pluck(t, midi, vel) {
  const f = hz(midi), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(4200, f * 5), t); lp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 1.3), t + 0.5);
  const peak = 0.34 * vel, dec = 0.8 + Math.random() * 0.4;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  const o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = f;
  const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f; o2.detune.value = 4;
  const g2 = ctx.createGain(); g2.gain.value = 0.12;
  o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(fade);
  o1.start(t); o2.start(t); o1.stop(t + dec + 0.05); o2.stop(t + dec + 0.05);
}

function pad(t, midi, dur) {
  const g = ctx.createGain(), f = hz(midi);
  const a = 1.1, peak = 0.05;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + dur - 0.2); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.2);
  [-6, 6].forEach((d, i) => {
    const o = ctx.createOscillator(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = d;
    o.connect(g); o.start(t); o.stop(t + dur + 1.3);
  });
  g.connect(fade);
}

function scheduleStep(t, s, b) {
  const sec = SECTIONS[Math.floor(b / 8)], bi = b % 8;
  const chord = C[sec.chords[bi]], beat = 60 / (BASE_BPM * tempoK()) / 2;
  const accent = s % 4 === 0 ? 1 : s % 2 === 0 ? 0.85 : 0.7;
  const idx = sec.pattern[s];
  pluck(t + rnd(0.008), chord[idx], accent * (0.85 + Math.random() * 0.3));
  if (s === 0) {
    const barDur = beat * 8;
    pad(t, chord[1], barDur); pad(t, chord[2], barDur); pad(t, chord[0] - 12, barDur);
    const notes = sec.melody[bi];
    if (notes && Math.random() > 0.15) {
      for (const [pos, m, len] of notes) {
        const mt = t + pos * beat + rnd(0.012);
        pluck(mt, m, 0.9 + Math.random() * 0.2);
        if (len >= 4) pluck(mt + beat * 0.02, m + 12, 0.18);
      }
    }
  }
}

const tempoK = () => 1 + Math.min(3, level) * (0.1 / 3);

function tick() {
  if (!ctx || !running) return;
  while (nextT < ctx.currentTime + LOOKAHEAD) {
    scheduleStep(Math.max(nextT, ctx.currentTime), step, bar);
    nextT += 60 / (BASE_BPM * tempoK()) / 2;
    if (++step >= 8) { step = 0; bar = (bar + 1) % TOTAL_BARS; }
  }
}

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
      level = 0; step = 0; bar = 0;
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
    } catch (_) { /* yoksay */ }
  },
  setLevel(i) { level = Math.max(0, i | 0); },
  isMuted() { return muted; },
  setMuted(m) {
    muted = !!m;
    try { localStorage.setItem(LS_KEY, muted ? 'off' : 'on'); } catch (_) { /* yoksay */ }
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.12, ctx.currentTime, 0.05);
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
};
