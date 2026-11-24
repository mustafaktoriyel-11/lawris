// Lex Stack - prosedürel arka plan müziği ve "Hüküm" sesi (Web Audio, dosyasız)
// Modern, hoplayan, neşeli "casual puzzle" havası: ~120 BPM, Do majör / miksolidyen renkler,
// tıkırtılı bas, hafif davul (yumuşak kick, tık hat, alkış), kısa yaylanan klavsen/marimba tarzı lider ezgi.
// Her mahkeme derecesinde enerji artar (katman + tempo + ton yükselişi); gerginlikte 16'lık hat ve tempo itişi.
const LS_KEY = 'lawris.music';
const BASE_BPM = 120;
const LOOKAHEAD = 0.3;   // sn (tablette ana iş parçacığı yoğunken kesinti olmasın diye geniş)
const TICK_MS = 50;
const SPB = 16;          // ölçü başına adım sayısı (16'lık nota)

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (a) => (Math.random() * 2 - 1) * a;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const wrapTo = (m, lo) => lo + (((m - lo) % 12) + 12) % 12;   // m'nin perde sınıfını [lo, lo+12) aralığına al

// Akorlar: kök (Do'ya göre yarım ses) + tür
const CH = {
  C: { r: 0, q: 'M' }, G: { r: 7, q: 'M' }, Am: { r: 9, q: 'm' }, F: { r: 5, q: 'M' },
  Em: { r: 4, q: 'm' }, Dm: { r: 2, q: 'm' }, Bb: { r: 10, q: 'M' }, G7: { r: 7, q: '7' },
};
const TRI = { M: [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10] };

// ---- LEX STACK TEMASI (lider ezgi kancası) ----
// Biçim: ölçü başına [[adım(0-15), midi (Do majör), uzunluk(adım)], ...]
// A: 1-2. ölçü "soru" (Do, Sol), 3-4. ölçü "cevap" (La m, Fa); 5-8 yeniden, turnaround ile biter.
const HA = [
  [[0, 76, 1], [1, 79, 1], [3, 84, 2], [6, 79, 1], [8, 76, 1], [10, 79, 2], [13, 76, 1]],   // C
  [[0, 74, 1], [1, 79, 1], [3, 83, 2], [6, 79, 1], [8, 74, 2], [12, 71, 2]],                // G
  [[0, 81, 1], [2, 76, 1], [4, 81, 1], [6, 84, 2], [10, 81, 1], [12, 76, 2]],               // Am
  [[0, 81, 1], [2, 79, 1], [4, 77, 2], [8, 76, 1], [10, 74, 1], [12, 72, 3]],               // F
  [[0, 76, 1], [1, 79, 1], [3, 84, 2], [6, 79, 1], [8, 76, 1], [10, 79, 2], [13, 76, 1]],   // C
  [[0, 74, 1], [1, 79, 1], [3, 83, 2], [6, 79, 1], [8, 74, 2], [12, 71, 2]],                // G
  [[0, 77, 1], [2, 81, 1], [4, 84, 2], [8, 81, 1], [10, 79, 1], [12, 77, 2]],               // F
  [[0, 79, 1], [2, 83, 1], [4, 86, 2], [8, 83, 1], [10, 79, 1], [12, 74, 2]],               // G
];
// B: daha senkoplu, "cevap" havası; ara sıçramalar
const HB = [
  [[2, 77, 1], [3, 81, 1], [6, 84, 2], [10, 81, 1], [12, 77, 2]],                           // F
  [[2, 79, 1], [3, 83, 1], [6, 86, 2], [10, 83, 1], [12, 79, 2]],                           // G
  [[0, 76, 1], [2, 79, 1], [4, 83, 2], [8, 79, 1], [10, 76, 1], [12, 71, 2]],               // Em
  [[0, 81, 2], [4, 84, 1], [6, 81, 1], [8, 76, 2], [12, 81, 2]],                            // Am
  [[2, 77, 1], [3, 81, 1], [6, 86, 2], [10, 81, 1], [12, 77, 2]],                           // Dm
  [[2, 79, 1], [3, 83, 1], [6, 86, 2], [10, 83, 1], [12, 79, 2]],                           // G
  [[0, 84, 1], [2, 79, 1], [4, 76, 1], [6, 79, 1], [8, 84, 2], [12, 79, 2]],                // C
  [[0, 83, 1], [2, 79, 1], [4, 74, 1], [8, 79, 1], [10, 83, 2], [14, 86, 1]],               // G7: Do'ya ittirir
];
// A': A ile aynı, 6. ölçüde miksolidyen Si bemol rengi
const HA2 = HA.map((b, i) => (i === 5 ? [[0, 77, 1], [1, 82, 1], [3, 86, 2], [6, 82, 1], [8, 77, 2], [12, 74, 2]] : b));

// Bas kalıpları (adım, kökten aralık, uzunluk) - senkoplu, kısa; menüde sade
const BASS = [
  [[0, 0, 2], [3, 0, 1], [6, 12, 1], [8, 0, 2], [11, 0, 1], [14, 7, 1]],
  [[0, 0, 2], [2, 12, 1], [5, 0, 1], [8, 0, 2], [10, 7, 1], [12, 0, 1], [14, 12, 1]],
];
const BASS_MENU = [[0, 0, 6], [8, 0, 5]];

const mk = (...names) => names.map((n) => CH[n]);
const SECTIONS = [
  { chords: mk('C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'), lead: HA },
  { chords: mk('F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'G7'), lead: HB },
  { chords: mk('C', 'G', 'Am', 'F', 'C', 'Bb', 'F', 'G'), lead: HA2, dbl: true },
];
const SEC_START = [];
let TOTAL_BARS = 0;
for (const s of SECTIONS) { SEC_START.push(TOTAL_BARS); TOTAL_BARS += s.chords.length; }   // 24 ölçü = ~48 sn
const XF = 2.4;          // seviye geçişi çapraz solma süresi (sn)
const MAX_LEVEL = 3;
const MAX_OSC = 64;      // aynı anda canlı kısa ömürlü osilatör sınırı (mobil CPU)
// Mahkeme derecesine göre enerji: her derecede katman + tempo (+~4 BPM) ve ton yükselişi (key: yarım ses)
const LV = [
  { drum: 1, hat: 0.7, shk: 0,   stab: 0.6, arp: 0,   pad: 1, mel: 1, send: 0.2,  fb: 0.22, dlf: 2400, tempo: 1,     key: 0 },
  { drum: 1, hat: 1,   shk: 0,   stab: 1,   arp: 0.7, pad: 1, mel: 1, send: 0.22, fb: 0.24, dlf: 2600, tempo: 1.033, key: 0 },
  { drum: 1, hat: 1,   shk: 0.6, stab: 1,   arp: 1,   pad: 1, mel: 1, send: 0.24, fb: 0.26, dlf: 2800, tempo: 1.067, key: 2 },
  { drum: 1, hat: 1,   shk: 1,   stab: 1.1, arp: 1,   pad: 1, mel: 1, send: 0.26, fb: 0.28, dlf: 3000, tempo: 1.1,   key: 4 },
];
const RAMPED = ['drum', 'hat', 'shk', 'stab', 'arp', 'pad', 'mel', 'send', 'fb', 'dlf'];

let ctx = null, fade = null, bus = null, master = null;
let timer = null, nextT = 0, step = 0, bar = 0, loopN = 0;
let level = 0;       // istenen (bekleyen) seviye - setLevel yazar
let curLevel = 0;    // çalan seviye - yalnızca ölçü başında güncellenir
let live = 0;        // canlı kısa ömürlü osilatör sayısı
let bassBus = null, dfade = null, dryBus = null, sendG = null, fbG = null, dlyLp = null, mainLp = null, bassLp = null;
// Tehlike (0..1): hedef + yumuşatılmış değer (ctx.currentTime ile; duraklatılınca donar)
let tensTarget = 0, tens = 0, tensT = 0;
const T_UP = 0.65, T_DOWN = 1.3;   // zaman sabitleri (sn): ~1.5 sn'de yükselir, ~3 sn'de gevşer
const LP_LO = 4600, LP_HI = 7000;  // ana alçak geçiren: sakin -> gergin (parlaklık artar)
const TRIM = 0.08;                 // gergin müzikte genel seviye payı
const R = {};        // katman rampaları: ad -> {v0, v1, t0, t1}
let muted = false, running = false, paused = false;
let sfxMuted = false, hidden = false, mode = 'game';   // mode: 'menu' | 'game'
let duckG = null, holdG = null, sfxIn = null, sfxMaster = null, menuTm = null;
const LS_SFX = 'lawris.sfx';
const MUSIC_GAIN = 0.12;   // müzik veriyolu
const SFX_GAIN = 0.38;     // efekt veriyolu (müzikten belirgin yüksek; hepsi aynı sınırlayıcıdan geçer)
const MENU_VOL = 0.6;      // menü müziği: oyun müziğinden daha kısık
try { muted = localStorage.getItem(LS_KEY) === 'off'; } catch (_) { muted = false; }
try { sfxMuted = localStorage.getItem(LS_SFX) === 'off'; } catch (_) { sfxMuted = false; }

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try { ctx = new AC({ latencyHint: 'playback' }); } catch (_) { ctx = new AC(); }   // büyük tampon: cızırtıya karşı
  master = ctx.createGain(); master.gain.value = muted ? 0 : MUSIC_GAIN;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = LP_LO; lp.Q.value = 0.4; mainLp = lp;
  // sınırlayıcı: müzik + efekt üst üste binince kırpılma (cızırtı) olmasın
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -6; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2;
  duckG = ctx.createGain(); holdG = ctx.createGain();   // duckG: büyük efektlerde müziği kıs; holdG: duraklatma
  lp.connect(duckG); duckG.connect(holdG); holdG.connect(master); master.connect(lim); lim.connect(ctx.destination);
  buildSfxBus(lim);
  fade = null;
  bus = ctx.createGain();
  bus.connect(lp);
  dryBus = ctx.createGain(); dryBus.connect(lp);   // davul: yankı göndermeden
  // basit geri beslemeli gecikme = oda yankısı
  const dly = ctx.createDelay(1); dly.delayTime.value = 0.25;   // ~sekizlik nota (120 BPM)
  const fb = ctx.createGain(); fb.gain.value = 0.3;
  const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 1800;
  const dhp = ctx.createBiquadFilter(); dhp.type = 'highpass'; dhp.frequency.value = 350; // geri beslemede çamurlaşmayı önler
  const send = ctx.createGain(); send.gain.value = 0.35;
  bus.connect(send); send.connect(dly); dly.connect(dlp); dlp.connect(dhp); dhp.connect(fb); fb.connect(dly); dlp.connect(lp);
  sendG = send; fbG = fb; dlyLp = dlp;
  return true;
}

// Efekt veriyolu: yumuşak sınırlama (tanh) + kısa oda yankısı + kendi seviyesi
function buildSfxBus(lim) {
  sfxIn = ctx.createGain(); sfxIn.gain.value = 1;
  const sh = ctx.createWaveShaper(), n = 1024, k = 1.7, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
  sh.curve = c; sh.oversample = '2x';
  sfxMaster = ctx.createGain(); sfxMaster.gain.value = sfxMuted ? 0 : SFX_GAIN;
  sfxIn.connect(sh); sh.connect(sfxMaster); sfxMaster.connect(lim);
  // üretilmiş dürtü yanıtı: ~0.4 sn sönen gürültü (tek kanal, hafif karanlık)
  const len = Math.floor(ctx.sampleRate * 0.4), ir = ctx.createBuffer(1, len, ctx.sampleRate), d = ir.getChannelData(0);
  let lpv = 0;
  for (let i = 0; i < len; i++) { lpv += ((Math.random() * 2 - 1) - lpv) * 0.35; d[i] = lpv * Math.pow(1 - i / len, 2.6); }
  const cv = ctx.createConvolver(); cv.buffer = ir;
  const rs = ctx.createGain(); rs.gain.value = 0.2;
  const rlp = ctx.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 3800;
  sfxIn.connect(rs); rs.connect(cv); cv.connect(rlp); rlp.connect(sfxMaster);
}

// Oturum: her müzik başlangıcı (menü / oyun) kendi solma düğümlerini alır; eskisi ~1 sn'de söner (çapraz solma)
function newSession(target, inDur) {
  const t = ctx.currentTime;
  const old = { fade, dfade, bass: bassBus, blp: bassLp };
  for (const f of [old.fade, old.dfade]) if (f) {
    f.gain.cancelScheduledValues(t); f.gain.setValueAtTime(Math.max(f.gain.value, 0.0001), t);
    f.gain.linearRampToValueAtTime(0.0001, t + inDur);
  }
  fade = ctx.createGain(); fade.gain.setValueAtTime(0.0001, t); fade.gain.linearRampToValueAtTime(target, t + inDur);
  fade.connect(bus);                      // melodi + bas: yankı gönderimi var
  dfade = ctx.createGain(); dfade.gain.setValueAtTime(0.0001, t); dfade.gain.linearRampToValueAtTime(target, t + inDur);
  dfade.connect(dryBus);                  // davul: yankısız (kuru) yol
  bassBus = ctx.createGain(); bassBus.gain.value = 1;
  bassLp = ctx.createBiquadFilter(); bassLp.type = 'lowpass'; bassLp.frequency.value = 900; bassLp.Q.value = 0.5;
  bassBus.connect(bassLp); bassLp.connect(fade);
  setTimeout(() => {
    try { for (const n of [old.fade, old.dfade, old.bass, old.blp]) if (n) n.disconnect(); } catch (_) { /* yoksay */ }
  }, (inDur + 0.5) * 1000);
}

// Kısa ömürlü osilatör: sayaçlı, bitince düğümleri serbest bırakır
function osc(type, f, t0, t1, dest) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
  if (dest) o.connect(dest);
  live++;
  o.onended = () => { live--; try { o.disconnect(); } catch (_) { /* yoksay */ } };
  o.start(t0); o.stop(t1);
  return o;
}
// son osilatör bitince listedeki düğümleri bırak
const freeAfter = (o, nodes) => o.addEventListener('ended', () => { for (const n of nodes) { try { n.disconnect(); } catch (_) { /* yoksay */ } } });

// Lider: kısa, yaylanan klavsen/marimba (üçgen + hafif kare + üst oktav çınlaması), staccato
function lead(t, midi, dur, vel, dest) {
  if (vel < 0.02 || live > MAX_OSC - 6) return;
  const f = hz(midi), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 0.6;
  lp.frequency.setValueAtTime(Math.min(7000, f * 7), t); lp.frequency.exponentialRampToValueAtTime(Math.max(1100, f * 2.2), t + 0.22);
  const peak = 0.15 * vel, end = t + Math.max(0.16, dur) + 0.1;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.005);
  g.gain.exponentialRampToValueAtTime(peak * 0.38, t + 0.09);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  const g1 = ctx.createGain(), g2 = ctx.createGain(), g3 = ctx.createGain();
  g1.gain.value = 0.75; g2.gain.value = 0.11; g3.gain.value = 0.12;
  const o1 = osc('triangle', f, t, end + 0.03, g1), o2 = osc('square', f, t, end + 0.03, g2), o3 = osc('sine', f * 2, t, end + 0.03, g3);
  o2.detune.value = 6;
  g1.connect(lp); g2.connect(lp); g3.connect(lp); lp.connect(g); g.connect(dest || fade);
  freeAfter(o3, [g, lp, g1, g2, g3]); void o1;
}

// Arpej / tıkırtı: kısa pizzicato
function pluck(t, midi, vel) {
  if (vel < 0.02 || live > MAX_OSC - 6) return;
  const f = hz(midi), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(5000, f * 5), t); lp.frequency.exponentialRampToValueAtTime(Math.max(700, f * 1.4), t + 0.2);
  const peak = 0.17 * vel, dec = 0.28;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  const g2 = ctx.createGain(); g2.gain.value = 0.14;
  osc('triangle', f, t, t + dec + 0.03, lp);
  const o2 = osc('sine', f * 2, t, t + dec + 0.03, g2);
  g2.connect(lp); lp.connect(g); g.connect(fade);
  freeAfter(o2, [g, lp, g2]);
}

// Akor vuruşu: kısa, parlak, yumuşatılmış testere (senkoplu "stab")
function stab(t, notes, vel) {
  if (vel < 0.02 || live > MAX_OSC - 8) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 0.5;
  lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(800, t + 0.18);
  const peak = 0.06 * vel / Math.sqrt(notes.length / 3), dec = 0.2;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  let last = null;
  notes.forEach((m, i) => { last = osc(i % 2 ? 'triangle' : 'sawtooth', hz(m), t, t + dec + 0.03, lp); last.detune.value = (i - 1) * 4; });
  lp.connect(g); g.connect(fade);
  freeAfter(last, [g, lp]);
}

// Yumuşak ışıltılı zemin: kısa atak, çok alçak seviye
function pad(t, midi, dur, k) {
  if (k < 0.02 || live > MAX_OSC - 6) return;
  const g = ctx.createGain(), f = hz(midi);
  const peak = 0.028 * k;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.25);
  g.gain.setValueAtTime(peak, t + dur - 0.15); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.5);
  [-6, 6].forEach((d, i) => {
    const o = osc(i ? 'sine' : 'triangle', f, t, t + dur + 0.6, g); o.detune.value = d;
    if (i) freeAfter(o, [g]);
  });
  g.connect(fade);
}

// Bas: kısa, tıkırtılı (alçalan filtre), telefon hoparlörü için 80 Hz altına inmez
function bassNote(t, midi, dur, vol) {
  if (vol < 0.02 || live > MAX_OSC - 4) return;
  const f = hz(midi), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 1.1;
  lp.frequency.setValueAtTime(Math.min(1400, f * 9), t); lp.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.1);
  const peak = 0.2 * vol, d = Math.max(0.1, dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.006);
  g.gain.exponentialRampToValueAtTime(peak * 0.45, t + d * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.05);
  const g2 = ctx.createGain(); g2.gain.value = 0.3;
  osc('sine', f, t, t + d + 0.1, lp);
  const o2 = osc('sawtooth', f, t, t + d + 0.1, g2);
  g2.connect(lp); lp.connect(g); g.connect(bassBus);
  freeAfter(o2, [g, lp, g2]);
}

// ---- Davul: gürültü + osilatör, hepsi kısa ve yumuşak ----
function nz(t, type, f, q, dur, v, dest) {
  const n = ctx.createBufferSource(); n.buffer = noiseBuffer();
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(fl); fl.connect(g); g.connect(dest);
  n.onended = () => { try { n.disconnect(); fl.disconnect(); g.disconnect(); } catch (_) { /* yoksay */ } };
  n.start(t, Math.random() * 0.5); n.stop(t + dur + 0.03);
}
function kick(t, v) {
  if (live > MAX_OSC - 2) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  const o = osc('sine', 150, t, t + 0.24, g);
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(58, t + 0.1);
  g.connect(dfade);
  freeAfter(o, [g]);
  nz(t, 'bandpass', 2500, 1, 0.015, 0.05 * v, dfade);   // hafif vuruş tıkı (alçak frekans yok)
}
function clap(t, v) {
  [0, 0.011, 0.023].forEach((d, i) => nz(t + d, 'bandpass', 1700, 0.9, i === 2 ? 0.13 : 0.03, 0.15 * v, dfade));
}
function hat(t, v, open) { nz(t, 'highpass', open ? 6500 : 7500, 0.7, open ? 0.14 : 0.035, 0.07 * v, dfade); }
function shaker(t, v) { nz(t, 'bandpass', 6200, 1.2, 0.03, 0.05 * v, dfade); }

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
  return null;
}
function ramp(name, to, t, dur) {
  const from = val(name, t);
  R[name] = { v0: from, v1: to, t0: t, t1: t + dur };
  const p = paramOf(name);
  if (p) { p.cancelScheduledValues(t); p.setValueAtTime(Math.max(from, 0.0001), t); p.linearRampToValueAtTime(Math.max(to, 0.0001), t + dur); }
}
function resetRamps(lv) {
  for (const k of RAMPED) R[k] = { v0: LV[lv][k], v1: LV[lv][k], t0: 0, t1: 0 };
}

// Ölçü başında: bekleyen seviyeyi uygula (katman rampaları; ton ve tempo bu ölçüden itibaren)
function applyLevel(t) {
  if (curLevel === level) return;
  curLevel = level;
  for (const k of RAMPED) ramp(k, LV[curLevel][k], t, XF);
}

const tempoK = () => LV[Math.min(MAX_LEVEL, curLevel)].tempo * (1 + 0.06 * tens) * (mode === 'menu' ? 0.85 : 1);   // tehlike: +%0..6 tempo (yumuşak)
const stepDur = () => 60 / (BASE_BPM * tempoK()) / 4;

function scheduleStep(t, s, b) {
  if (s === 0) applyLevel(t);
  let si = SECTIONS.length - 1; while (SEC_START[si] > b) si--;
  const sec = SECTIONS[si], bi = b - SEC_START[si];
  const c = sec.chords[bi], tri = TRI[c.q], key = LV[curLevel].key, sd = stepDur(), menu = mode === 'menu';
  const hot = clamp01((tens - 0.3) / 0.7);
  const tt = t + (s % 2 ? sd * 0.1 : 0);   // hafif swing: tek 16'lıklar biraz geç (zıplama)
  const drum = val('drum', t), hatK = val('hat', t), shk = val('shk', t), stabK = val('stab', t), arpK = val('arp', t), mel = val('mel', t);

  // Davul (menüde yalnızca çok hafif hat/shaker)
  if (!menu && drum > 0.02) {
    if (s % 4 === 0) kick(t, (s === 0 ? 1 : 0.85) * drum);
    if (s === 10 && (curLevel >= 1 || Math.random() < hot)) kick(t, 0.6 * drum);
    if (s === 14 && hot > 0.3 && Math.random() < hot) kick(t, 0.5 * drum);
    if (s === 4 || s === 12) clap(t, drum);
    if (curLevel >= 2 && bi % 4 === 3 && s >= 13) clap(t, 0.3 * drum);   // dolgu: ölçü sonunda hafif roll
  }
  const hm = menu ? 0.35 : 1;
  if (s % 4 === 2) hat(tt, hm * 0.9 * Math.max(hatK, 0.5), curLevel >= 3 && s === 14);
  else if (s % 4 === 0) { const v = menu ? 0 : Math.max(0, hatK - 0.7) / 0.3; if (v > 0.02) hat(t, 0.55 * v); }
  else {
    const v = (menu ? 0 : shk) + hot * 0.9;   // tek 16'lıklar: shaker (üst seviyeler) / gerginlikte 16'lık hat
    if (v > 0.02) { if (shk > 0.02) shaker(tt, Math.min(1, v)); else hat(tt, Math.min(1, v) * 0.5); }
  }
  if (!menu && curLevel >= 2 && s === 0 && bi === 0 && b !== 0) nz(t, 'highpass', 5500, 0.6, 0.6, 0.05, dfade);   // bölüm başı "crash"

  // Bas
  const root = wrapTo(c.r + key, 40);
  for (const [bs, iv, len] of (menu ? BASS_MENU : BASS[bi % 2])) if (bs === s) bassNote(tt, root + iv, len * sd * 0.9, menu ? 0.6 : 1);

  // Akor vuruşları (senkoplu) ve yumuşak zemin
  const sr = wrapTo(c.r + key, 55), stabNotes = tri.map((i) => sr + i);
  const stabSteps = (curLevel === 0 || menu) ? [6, 14] : [3, 6, 10, 14];
  if (stabSteps.includes(s)) stab(tt, stabNotes, stabK * (menu ? 0.45 : 1) * (s === 6 || s === 14 ? 1 : 0.75));
  if (s === 0) { const pr = wrapTo(c.r + key, 48), k = val('pad', t) * (menu ? 1.8 : 1); tri.slice(0, 3).forEach((i) => pad(t, pr + i, sd * SPB, k)); }

  // Lider kanca (+ A' bölümünde her ikinci turda üst oktav parıltısı)
  const lead_ = sec.lead[bi];
  for (const [ls, m, len] of lead_) {
    if (ls !== s) continue;
    const v = mel * (menu ? 0.62 : 1);
    lead(tt, m + key, len * sd * 0.85, v);
    if (sec.dbl && loopN % 2 === 1 && curLevel >= 2) lead(tt + 0.004, m + key + 12, len * sd * 0.7, v * 0.28);
  }

  // Karşı melodi: akor arpeji (liderin sustuğu yerlerde); gerginlikte tek 16'lıklara da yayılır
  const arpEff = menu ? 0.6 : arpK;
  if (arpEff > 0.02) {
    const onGrid = menu ? s % 4 === 2 : (s % 2 === 0 || Math.random() < hot * 0.6);
    if (onGrid && !lead_.some(([ls]) => Math.abs(ls - s) <= 1) && Math.random() < 0.55 + 0.4 * arpEff) {
      const seq = [0, 1, 2, 1], note = sr + tri[seq[(s + bi) % 4] % tri.length];
      pluck(tt, note, 0.55 * arpEff * (s % 4 === 2 ? 1 : 0.75));
    }
  }
}

// Yumuşatılmış tehlike değerini now'a kadar ilerlet (üstel yaklaşım)
function tensStep(now) {
  const dt = Math.max(0, now - tensT); tensT = now;
  tens += (tensTarget - tens) * (1 - Math.exp(-dt / (tensTarget > tens ? T_UP : T_DOWN)));
}
// Ses parametrelerini hedefe yumuşakça yönlendir (atlama yok: mevcut değerden başlar)
function tensAudio(now) {
  if (!ctx || !mainLp) return;
  const tau = tensTarget > tens ? T_UP : T_DOWN;
  mainLp.frequency.cancelScheduledValues(now); mainLp.frequency.setValueAtTime(LP_LO + (LP_HI - LP_LO) * tens, now);
  mainLp.frequency.setTargetAtTime(LP_LO + (LP_HI - LP_LO) * tensTarget, now, tau);
  for (const bg of [bus.gain, dryBus.gain]) {
    bg.cancelScheduledValues(now); bg.setValueAtTime(1 - TRIM * tens, now);
    bg.setTargetAtTime(1 - TRIM * tensTarget, now, tau);
  }
}

function tick() {
  if (!ctx || !running) return;
  tensStep(ctx.currentTime);
  while (nextT < ctx.currentTime + LOOKAHEAD) {
    scheduleStep(Math.max(nextT, ctx.currentTime + 0.03), step, bar);   // geç kalan nota hemen değil, kısa payla başlasın (tık sesi olmasın)
    nextT += stepDur();
    if (++step >= SPB) { step = 0; bar = (bar + 1) % TOTAL_BARS; if (bar === 0) loopN++; }
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

function resetPlayback() {
  const now = ctx.currentTime;
  stopTimer();
  paused = false; running = true;
  level = 0; curLevel = 0; step = 0; bar = 0; loopN = 0;
  tensTarget = 0; tens = 0; tensT = now;
  mainLp.frequency.cancelScheduledValues(now); mainLp.frequency.setValueAtTime(LP_LO, now);
  for (const bg of [bus.gain, dryBus.gain]) { bg.cancelScheduledValues(now); bg.setValueAtTime(1, now); }
  holdG.gain.cancelScheduledValues(now); holdG.gain.setValueAtTime(1, now);
  resetRamps(0);
  for (const [n, p] of [['send', sendG.gain], ['fb', fbG.gain], ['dlf', dlyLp.frequency]]) { p.cancelScheduledValues(now); p.setValueAtTime(LV[0][n], now); }
  if (!hidden) ctx.resume();
  nextT = now + 0.15;
  timer = setInterval(tick, TICK_MS);
}
// Sesin hazır olup olmadığı (efekt açık, sayfa görünür); askıdaki bağlam ilk harekette açılır
const sfxReady = () => !!ctx && !sfxMuted && !hidden && ctx.state !== 'closed';

export const music = {
  // Kullanıcı hareketi içinde çağrılmalı (ilk dokunuş, Oyna / Tekrar oyna)
  init() {
    try {
      if (!ctx && !build()) return;
      if (ctx.state === 'suspended' && !hidden) ctx.resume();
    } catch (_) { /* yoksay */ }
  },
  // Oyun müziği: menüden (ya da sessizlikten) ~1 sn çapraz solmayla girer
  start() {
    try {
      if (!ctx) this.init();
      if (!ctx) return;
      clearTimeout(menuTm); menuTm = null;
      mode = 'game';
      newSession(1, 1.0);
      resetPlayback();
    } catch (_) { /* yoksay */ }
  },
  // Menü müziği: daha yavaş, kısık, gerilimsiz; zaten çalıyorsa dokunmaz. delayMs: oyun bitişi sesinden sonra girmek için
  startMenu(delayMs = 0) {
    clearTimeout(menuTm); menuTm = null;
    if (delayMs > 0) { menuTm = setTimeout(() => { menuTm = null; this.startMenu(0); }, delayMs); return; }
    try {
      if (!ctx) this.init();
      if (!ctx) return;
      if (running && mode === 'menu') return;
      mode = 'menu';
      newSession(MENU_VOL, running ? 1.0 : 1.6);
      resetPlayback();
    } catch (_) { /* yoksay */ }
  },
  cancelMenu() { clearTimeout(menuTm); menuTm = null; },
  get mode() { return running ? mode : 'off'; },
  // Duraklatma: bağlamı askıya almadan (arayüz tıkları çalsın diye) zamanlayıcıyı durdurup müziği kıs
  pause() {
    paused = true;
    try {
      if (!ctx || !running) return;
      stopTimer();
      const t = ctx.currentTime;
      holdG.gain.cancelScheduledValues(t); holdG.gain.setValueAtTime(holdG.gain.value, t); holdG.gain.linearRampToValueAtTime(0.0001, t + 0.25);
    } catch (_) { /* yoksay */ }
  },
  resume() {
    paused = false;
    try {
      if (!ctx || !running) return;
      const t = ctx.currentTime;
      holdG.gain.cancelScheduledValues(t); holdG.gain.setValueAtTime(Math.max(holdG.gain.value, 0.0001), t); holdG.gain.linearRampToValueAtTime(1, t + 0.3);
      stopTimer(); nextT = t + 0.1; timer = setInterval(tick, TICK_MS);
    } catch (_) { /* yoksay */ }
  },
  // Sayfa gizlenince bağlamı gerçekten askıya al (pil), görününce aç
  setHidden(h) {
    hidden = !!h;
    try { if (ctx) { if (hidden) ctx.suspend(); else ctx.resume(); } } catch (_) { /* yoksay */ }
  },
  fadeOut(dur = 1.2) {
    if (!ctx || !running) return;
    running = false; stopTimer();
    try {
      const t = ctx.currentTime;
      for (const f of [fade, dfade]) {
        f.gain.cancelScheduledValues(t);
        f.gain.setValueAtTime(Math.max(f.gain.value, 0.0001), t);
        f.gain.linearRampToValueAtTime(0.0001, t + dur);
      }
    } catch (_) { /* yoksay */ }
  },
  // Büyük efektlerde müziği kıs (varsayılan -6 dB, ~0.4 sn)
  duck(amount = 0.5, hold = 0.25) {
    if (!ctx || !duckG) return;
    try {
      const t = ctx.currentTime, g = duckG.gain;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(amount, t + 0.03);
      g.setValueAtTime(amount, t + 0.03 + hold); g.linearRampToValueAtTime(1, t + 0.03 + hold + 0.25);
    } catch (_) { /* yoksay */ }
  },
  // efekt kitaplığı (sfx.js) için ortak ses çekirdeği
  core() {
    return ctx && sfxIn ? { ctx, out: sfxIn, noise: noiseBuffer, tone: sfxTone, noiseTo: sfxNoise, hz } : null;
  },
  sfxReady,
  // Bekleyen seviye; bir sonraki ölçü başında çapraz solmayla uygulanır (start öncesi/duraklatılmışken de güvenli)
  setLevel(i) { const n = Number(i); level = Number.isFinite(n) ? Math.max(0, Math.min(MAX_LEVEL, Math.floor(n))) : 0; },
  // Tehlike 0..1 (yığın yüksekliği); atak ~1.5 sn, gevşeme ~3 sn. Çalmıyorken yalnızca hedefi saklar.
  setTension(x) {
    const n = Number(x);
    tensTarget = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
    try { if (ctx && running) { const now = ctx.currentTime; tensStep(now); tensAudio(now); } } catch (_) { /* yoksay */ }
  },
  isMuted() { return muted; },
  setMuted(m) {
    muted = !!m;
    try { localStorage.setItem(LS_KEY, muted ? 'off' : 'on'); } catch (_) { /* yoksay */ }
    if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : MUSIC_GAIN, ctx.currentTime, 0.05);
  },
  isSfxMuted() { return sfxMuted; },
  setSfxMuted(m) {
    sfxMuted = !!m;
    try { localStorage.setItem(LS_SFX, sfxMuted ? 'off' : 'on'); } catch (_) { /* yoksay */ }
    if (sfxMaster && ctx) sfxMaster.gain.setTargetAtTime(sfxMuted ? 0 : SFX_GAIN, ctx.currentTime, 0.03);
  },
  // Altın parça duyurusu: yumuşak, parlak iki parçalı çınlama
  chime() {
    if (!sfxReady() || !sfxIn) return;
    try {
      const t = ctx.currentTime + 0.01;
      for (const [f, v, d, off, type] of [[1318.5, 0.5, 0.75, 0, 'sine'], [1976, 0.32, 0.7, 0.06, 'triangle'], [2637, 0.14, 0.5, 0.06, 'sine'], [659.3, 0.22, 0.9, 0, 'sine'], [3951, 0.05, 0.35, 0.1, 'sine']]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + off);
        g.gain.linearRampToValueAtTime(v, t + off + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + off + d);
        o.connect(g); g.connect(sfxIn);
        o.start(t + off); o.stop(t + off + d + 0.05);
      }
    } catch (_) { /* yoksay */ }
  },
  // Satır silme: yumuşak tahta tokmak darbesi
  knock() {
    if (!sfxReady() || !sfxIn) return;
    try {
      const t = ctx.currentTime + 0.01;
      const len = Math.floor(ctx.sampleRate * 0.08);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const n = ctx.createBufferSource(); n.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1.2;
      const ng = ctx.createGain(); ng.gain.value = 0.9;
      n.connect(bp); bp.connect(ng); ng.connect(sfxIn);
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(65, t + 0.12);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(0.7, t + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(og); og.connect(sfxIn);
      n.start(t); o.start(t); o.stop(t + 0.25);
    } catch (_) { /* yoksay */ }
  },
  // Altın etki sesi (kind: tokmak|kilic|kalem|paragraf|sutun|kanun|terazi); vol 0..1
  sfx(kind, vol = 1) {
    if (!sfxReady() || !sfxIn || !SFX[kind] || sfxLive >= 3) return;
    try {
      const out = ctx.createGain(); out.gain.value = Math.max(0, Math.min(1, vol)) * 0.6;
      out.connect(sfxIn); sfxLive++;
      SFX[kind](out, ctx.currentTime + 0.01);
      setTimeout(() => { sfxLive = Math.max(0, sfxLive - 1); try { out.disconnect(); } catch (_) { /* yoksay */ } }, 1100);
    } catch (_) { /* yoksay */ }
  },
  // Rehber demosu için: yalnızca ses zaten çalışıyorsa ve kapalı değilse (asla sesi başlatmaz)
  isLive() { return sfxReady() && ctx.state === 'running'; },
};

