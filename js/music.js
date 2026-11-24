// Lex Stack - prosedürel arka plan müziği ve "Hüküm" sesi (Web Audio, dosyasız)
// Antik Roma / Akdeniz havasında neşeli, dans ettiren "casual oyun" müziği (~124 BPM):
// Dorian / Miksolidyen ezgi, Frig-dominant (bII-I, yükseltilmiş 3.) renkler; telli lir/kithara (Karplus-Strong),
// aulos (çift kamışlı, formantlı lider), tef/tympanon davulu, parmak zilleri, kristal çınlama (crotale), alkış
// ve section başlarında / seviye geçişlerinde kısa cornu (buccina) fanfarı.
// Kanca (aulos soru -> lir cevap) oyunun kimliğidir. A / B / A' / C = 32 ölçü (~1 dk) döngü.
// Her mahkeme derecesinde enerji artar (katman + tempo + ton yükselişi); gerginlikte 16'lık tef roll'ları ve tempo itişi.
const LS_KEY = 'lawris.music';
const BASE_BPM = 124;
const LOOKAHEAD = 0.3;   // sn (tablette ana iş parçacığı yoğunken kesinti olmasın diye geniş)
const TICK_MS = 50;
const SPB = 16;          // ölçü başına adım sayısı (16'lık nota)

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (a) => (Math.random() * 2 - 1) * a;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const wrapTo = (m, lo) => lo + (((m - lo) % 12) + 12) % 12;   // m'nin perde sınıfını [lo, lo+12) aralığına al

// Akorlar: kök (Do'ya göre yarım ses; ana ton Re) + tür
const CH = {
  Dm: { r: 2, q: 'm' }, D: { r: 2, q: 'M' }, C: { r: 0, q: 'M' }, G: { r: 7, q: 'M' },
  A: { r: 9, q: 'M' }, Eb: { r: 3, q: 'M' }, Bb: { r: 10, q: 'M' },
};
const TRI = { M: [0, 4, 7], m: [0, 3, 7] };

// ---- LEX STACK TEMASI ----
// Biçim: ölçü başına [[adım(0-15), midi (Re modu), uzunluk(adım)], ...]
// A (Re Dorian): 1-2. ölçü aulos "soru" kancası (Re Re Fa La / Sol Fa Mi Re ve bir basamak aşağısı), 3-4. ölçü lir "cevap"
const HA = [
  [[0, 74, 1], [2, 74, 1], [3, 77, 1], [4, 81, 2], [8, 79, 1], [10, 77, 1], [11, 76, 1], [12, 74, 3]],   // Dm
  [[0, 72, 1], [2, 72, 1], [3, 76, 1], [4, 79, 2], [8, 77, 1], [10, 76, 1], [11, 74, 1], [12, 72, 3]],   // C
  [[0, 83, 1], [1, 81, 1], [2, 79, 1], [4, 81, 1], [6, 79, 1], [8, 74, 2], [12, 71, 2]],                 // G (cevap)
  [[0, 69, 1], [2, 74, 1], [4, 77, 1], [6, 81, 2], [10, 77, 1], [12, 74, 3]],                            // Dm (cevap)
  [[0, 74, 1], [2, 74, 1], [3, 77, 1], [4, 81, 2], [8, 84, 1], [10, 81, 1], [11, 77, 1], [12, 74, 3]],   // Dm (kanca, farklı son)
  [[0, 72, 1], [2, 72, 1], [3, 76, 1], [4, 79, 2], [8, 84, 2], [12, 79, 2]],                             // C
  [[0, 72, 1], [2, 76, 1], [4, 79, 1], [6, 84, 2], [10, 79, 1], [12, 76, 2]],                            // C
  [[0, 73, 1], [2, 76, 1], [4, 81, 2], [8, 79, 1], [10, 76, 1], [12, 73, 1], [14, 70, 1]],               // A: yükseltilmiş 3. (Do#) + Sib (b9) -> Re
];
// A': ilk iki ölçü lirde, cevap aulosta; 7. ölçüde Sib (bVI) rengi
const HA2 = HA.map((b, i) => (i === 6 ? [[0, 74, 1], [2, 77, 1], [4, 82, 2], [8, 77, 1], [10, 74, 1], [12, 70, 2]] : b));
// B: Frig-dominant renk (Re Mib Fa# Sol La Sib Do), bII -> I; daha senkoplu
const HB = [
  [[0, 74, 1], [2, 78, 1], [3, 81, 1], [6, 86, 2], [10, 81, 1], [12, 78, 2]],                // D
  [[0, 75, 1], [2, 79, 1], [3, 82, 1], [6, 87, 2], [10, 82, 1], [12, 79, 2]],                // Eb
  [[0, 86, 1], [2, 81, 1], [3, 78, 1], [4, 81, 1], [6, 78, 1], [8, 74, 2], [12, 78, 2]],     // D
  [[0, 84, 1], [2, 79, 1], [4, 76, 1], [6, 79, 1], [8, 84, 2], [12, 79, 2]],                 // C
  [[0, 79, 1], [2, 83, 1], [4, 86, 2], [8, 83, 1], [10, 79, 1], [12, 74, 2]],                // G (lir)
  [[0, 82, 1], [2, 86, 1], [4, 89, 2], [8, 86, 1], [10, 82, 1], [12, 77, 2]],                // Bb (lir)
  [[0, 81, 1], [2, 85, 1], [4, 88, 2], [8, 85, 1], [10, 81, 1], [12, 76, 2]],                // A
  [[0, 73, 1], [2, 76, 1], [4, 81, 2], [8, 82, 1], [10, 81, 1], [12, 76, 1], [14, 73, 1]],   // A
];
// C: köprü - uzun aulos nağmeleri, lirde 16'lık arpej koşusu, sonda tef roll'u
const HC = [
  [[0, 81, 4], [6, 77, 2], [8, 74, 4]],                                          // Dm
  [[0, 79, 4], [6, 76, 2], [8, 72, 4]],                                          // C
  [[0, 79, 3], [4, 83, 1], [6, 86, 2], [10, 83, 2], [13, 79, 2]],                // G
  [[0, 81, 2], [2, 77, 1], [4, 74, 2], [8, 77, 1], [10, 81, 1], [12, 86, 3]],    // Dm
  [[0, 87, 2], [3, 82, 1], [4, 79, 2], [8, 75, 2], [12, 79, 2]],                 // Eb
  [[0, 86, 2], [3, 81, 1], [4, 78, 2], [8, 74, 2], [12, 78, 2]],                 // D
  [[0, 81, 1], [2, 85, 1], [4, 88, 2], [8, 85, 1], [10, 88, 1], [12, 81, 2]],    // A
  [[0, 81, 1], [1, 82, 1], [2, 81, 1], [4, 76, 1], [6, 73, 1], [8, 70, 2], [12, 73, 1], [14, 76, 1]],   // A: kromatik iniş
];

// Bas kalıpları (adım, kökten aralık, uzunluk) - sekmeli "oom-pah", kısa; menüde sade
const BASS = [
  [[0, 0, 2], [3, 0, 1], [6, 7, 1], [8, 0, 2], [11, 0, 1], [14, 7, 1]],
  [[0, 0, 2], [4, 12, 1], [6, 0, 1], [8, 7, 2], [10, 0, 1], [12, 12, 1], [14, 0, 1]],
];
const BASS_MENU = [[0, 0, 6], [8, 0, 5]];
// Cornu / buccina fanfarı: (adım, tondan aralık, uzunluk) - boş beşli/oktav, hem majör hem minör akorla uyumlu
const FAN = [[0, 0, 2], [3, 0, 1], [4, 7, 2], [6, 12, 2]];

const mk = (...names) => names.map((n) => CH[n]);
const SECTIONS = [
  { chords: mk('Dm', 'C', 'G', 'Dm', 'Dm', 'C', 'C', 'A'), lead: HA, who: 'aallaaaa' },
  { chords: mk('D', 'Eb', 'D', 'C', 'G', 'Bb', 'A', 'A'), lead: HB, who: 'aaaallaa' },
  { chords: mk('Dm', 'C', 'G', 'Dm', 'Dm', 'C', 'Bb', 'A'), lead: HA2, who: 'llaallaa', dbl: true, march: true },
  { chords: mk('Dm', 'C', 'G', 'Dm', 'Eb', 'D', 'A', 'A'), lead: HC, who: 'aaaaaaaa', run: true, march: true },
];
const SEC_START = [];
let TOTAL_BARS = 0;
for (const s of SECTIONS) { SEC_START.push(TOTAL_BARS); TOTAL_BARS += s.chords.length; }   // 32 ölçü = ~1 dk
const MENU_BARS = 16;    // menü yalnızca A + B bölümünü döndürür
const XF = 2.4;          // seviye geçişi çapraz solma süresi (sn)
const MAX_LEVEL = 3;
const MAX_OSC = 64;      // aynı anda canlı kısa ömürlü osilatör sınırı (mobil CPU)
// Mahkeme derecesi: Forum (sabah) hafif, lir ağırlıklı / Bazilika alkışlı, dolgun / Senato cornu vurgulu, yürüyüş / Pantheon en büyük, kristal ışıltılı
// Her derecede tempo (+~3.5 BPM) ve ton yükselişi (key: yarım ses)
const LV = [
  { thud: 0.7, slap: 0.5, clap: 0,   fcym: 0.5, crot: 0,   lyre: 1,   aul: 0.8, brs: 0,   pad: 1,   send: 0.3,  fb: 0.26, dlf: 2400, tempo: 1,     key: 0 },
  { thud: 1,   slap: 0.8, clap: 1,   fcym: 0.7, crot: 0,   lyre: 1,   aul: 1,   brs: 0.3, pad: 1,   send: 0.24, fb: 0.24, dlf: 2600, tempo: 1.028, key: 0 },
  { thud: 1,   slap: 1,   clap: 1,   fcym: 0.8, crot: 0.5, lyre: 0.9, aul: 1,   brs: 1,   pad: 0.9, send: 0.24, fb: 0.26, dlf: 2800, tempo: 1.056, key: 2 },
  { thud: 1,   slap: 1,   clap: 1,   fcym: 1,   crot: 1,   lyre: 1,   aul: 1,   brs: 1.1, pad: 1,   send: 0.26, fb: 0.28, dlf: 3000, tempo: 1.085, key: 3 },
];
const RAMPED = ['thud', 'slap', 'clap', 'fcym', 'crot', 'lyre', 'aul', 'brs', 'pad', 'send', 'fb', 'dlf'];

let ctx = null, fade = null, bus = null, master = null;
let timer = null, nextT = 0, step = 0, bar = 0, loopN = 0;
let level = 0;       // istenen (bekleyen) seviye - setLevel yazar
let curLevel = 0;    // çalan seviye - yalnızca ölçü başında güncellenir
let live = 0;        // canlı kısa ömürlü osilatör / kaynak sayısı
let fanOn = false, fanV = 0;   // bu ölçüde cornu fanfarı var mı (ilk yarıda ezgi susar)
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
  const dly = ctx.createDelay(1); dly.delayTime.value = 0.24;   // ~sekizlik nota (124 BPM)
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

// ---- LİR / KITHARA: Karplus-Strong ile önceden üretilmiş telli çalgı tamponları (N örnek uzunluğuna göre önbellek) ----
const KS = new Map();
function ksBuf(N) {
  const key = N + '@' + ctx.sampleRate;
  let b = KS.get(key); if (b) return b;
  const sr = ctx.sampleRate, len = Math.floor(sr * 1.1), ring = new Float32Array(N);
  b = ctx.createBuffer(1, len, sr);
  const d = b.getChannelData(0), decay = Math.pow(0.001, (N + 0.5) / (sr * 1.3));   // ~1.3 sn'de -60 dB (üst sesler daha hızlı söner)
  let pv = 0, mx = 0;
  for (let i = 0; i < N; i++) { pv += (Math.random() * 2 - 1 - pv) * 0.6; ring[i] = pv; }   // yumuşatılmış mızrap vuruşu
  for (let n = 0, i = 0; n < len; n++) {
    const a = ring[i], c = ring[(i + 1) % N];
    d[n] = a; ring[i] = decay * 0.5 * (a + c); i = (i + 1) % N;
    const v = Math.abs(a); if (v > mx) mx = v;
  }
  const k = mx > 0 ? 1 / mx : 1;
  for (let n = 0; n < len; n++) d[n] *= k;
  KS.set(key, b);
  return b;
}
function lyre(t, midi, vel) {
  if (vel < 0.02 || live > MAX_OSC - 4) return;
  const f = hz(midi), sr = ctx.sampleRate, N = Math.max(2, Math.round(sr / f - 0.5));
  const src = ctx.createBufferSource(); src.buffer = ksBuf(N);
  src.playbackRate.value = f / (sr / (N + 0.5));   // ince ayar (tamsayı gecikme hatasını telafi)
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(5200, f * 9); lp.Q.value = 0.3;
  const g = ctx.createGain(), peak = 0.17 * vel;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.002);
  g.gain.exponentialRampToValueAtTime(peak * 0.35, t + 0.22); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
  src.connect(lp); lp.connect(g); g.connect(fade);
  live++;
  src.onended = () => { live--; try { src.disconnect(); lp.disconnect(); g.disconnect(); } catch (_) { /* yoksay */ } };
  src.start(t); src.stop(t + 1.05);
}

// ---- AULOS: çift kamışlı, genizsel (testere + kare, ~1.1 / 1.6 kHz formant), hafif vibrato, kısa staccato ----
function aulos(t, midi, dur, vel) {
  if (vel < 0.02 || live > MAX_OSC - 8) return;
  const f = hz(midi), end = t + Math.max(0.12, dur);
  const g = ctx.createGain(), mix = ctx.createGain(), lp = ctx.createBiquadFilter();
  const b1 = ctx.createBiquadFilter(), b2 = ctx.createBiquadFilter(), gb2 = ctx.createGain(), gd = ctx.createGain();
  b1.type = 'bandpass'; b1.frequency.value = 1150; b1.Q.value = 2;
  b2.type = 'bandpass'; b2.frequency.value = 1650; b2.Q.value = 2.4; gb2.gain.value = 0.7;
  lp.type = 'lowpass'; lp.frequency.value = 3000; lp.Q.value = 0.3; gd.gain.value = 0.3;
  mix.connect(b1); b1.connect(g);
  mix.connect(b2); b2.connect(gb2); gb2.connect(g);
  mix.connect(lp); lp.connect(gd); gd.connect(g);
  const peak = 0.3 * vel;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(peak * 0.7, t + 0.09);
  g.gain.setValueAtTime(peak * 0.7, end); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.06);
  const ga = ctx.createGain(), gc = ctx.createGain(); ga.gain.value = 0.6; gc.gain.value = 0.45;
  const o1 = osc('sawtooth', f, t, end + 0.09, ga), o2 = osc('square', f, t, end + 0.09, gc);
  o2.detune.value = 8;
  ga.connect(mix); gc.connect(mix);
  const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(11, t + 0.2);   // vibrato (sent) gecikmeli girer
  const l = osc('sine', 5.3, t, end + 0.08, lg);
  lg.connect(o1.detune); lg.connect(o2.detune);
  g.connect(fade);
  nz(t, 'bandpass', 2600, 3, 0.05, 0.012 * vel, fade);   // nefes "çıt"ı
  freeAfter(o2, [g, mix, lp, b1, b2, gb2, gd, ga, gc, lg]); void l;
}

// ---- CORNU / BUCCINA: iki hafif akortsuz testere + alçak geçiren "şişme" ----
function brass(t, midi, dur, vel) {
  if (vel < 0.02 || live > MAX_OSC - 8) return;
  const f = hz(midi), end = t + Math.max(0.1, dur);
  const g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 0.7;
  lp.frequency.setValueAtTime(f * 1.3, t); lp.frequency.exponentialRampToValueAtTime(Math.min(3000, f * 5), t + 0.09);
  const peak = 0.075 * vel;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.035);
  g.gain.setValueAtTime(peak * 0.9, end); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.1);
  const g3 = ctx.createGain(); g3.gain.value = 0.6;
  const a = osc('sawtooth', f, t, end + 0.13, lp), c = osc('sawtooth', f, t, end + 0.13, lp), d = osc('triangle', f, t, end + 0.13, g3);
  a.detune.value = -6; c.detune.value = 6;
  g3.connect(lp); lp.connect(g); g.connect(fade);
  freeAfter(d, [g, lp, g3]); void a; void c;
}

// Yumuşak ışıltılı zemin: aulos "ison" (boş beşli) gibi, çok alçak seviye
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

// ---- Perküsyon: gürültü + osilatör, hepsi kısa ve yumuşak ----
function nz(t, type, f, q, dur, v, dest) {
  const n = ctx.createBufferSource(); n.buffer = noiseBuffer();
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(fl); fl.connect(g); g.connect(dest);
  n.onended = () => { try { n.disconnect(); fl.disconnect(); g.disconnect(); } catch (_) { /* yoksay */ } };
  n.start(t, Math.random() * 0.5); n.stop(t + dur + 0.03);
}
// tef / tympanon: alçak "dum" (derin vuruş) ve deri "tak" (kenar vuruşu)
function thud(t, v) {
  if (live > MAX_OSC - 2) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.42 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  const o = osc('sine', 155, t, t + 0.24, g);
  o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(86, t + 0.1);
  g.connect(dfade);
  freeAfter(o, [g]);
  nz(t, 'lowpass', 900, 0.7, 0.04, 0.05 * v, dfade);   // deri tıkı
}
function slap(t, v) {
  nz(t, 'bandpass', 2000, 1.1, 0.07, 0.15 * v, dfade);
  nz(t + 0.002, 'bandpass', 1000, 1.5, 0.1, 0.06 * v, dfade);
}
function clap(t, v) {
  [0, 0.011, 0.023].forEach((d, i) => nz(t + d, 'bandpass', 1700, 0.9, i === 2 ? 0.13 : 0.03, 0.15 * v, dfade));
}
// parmak zilleri: iki yüksek sinüs + kısa gürültü çıtası (kulak yormaz)
function fcym(t, v) {
  if (v < 0.02 || live > MAX_OSC - 4) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.02 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  osc('sine', 5300, t, t + 0.44, g);
  const o2 = osc('sine', 7350, t, t + 0.44, g);
  g.connect(dfade); freeAfter(o2, [g]);
  nz(t, 'highpass', 7000, 0.7, 0.03, 0.025 * v, dfade);
}
// crotale (kristal çınlama): temel + yarı uyumsuz üst ton
function crotale(t, midi, v) {
  if (v < 0.02 || live > MAX_OSC - 6) return;
  const f = hz(midi), g = ctx.createGain(), g2 = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  g2.gain.setValueAtTime(0.0001, t); g2.gain.linearRampToValueAtTime(0.025 * v, t + 0.002); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  osc('sine', f, t, t + 0.85, g);
  const o2 = osc('sine', f * 2.76, t, t + 0.35, g2);
  g.connect(fade); g2.connect(fade); freeAfter(o2, [g2]);
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

// Ölçü başında: bekleyen seviyeyi uygula (katman rampaları; ton ve tempo bu ölçüden itibaren). Değiştiyse true
function applyLevel(t) {
  if (curLevel === level) return false;
  curLevel = level;
  for (const k of RAMPED) ramp(k, LV[curLevel][k], t, XF);
  return true;
}

const tempoK = () => LV[Math.min(MAX_LEVEL, curLevel)].tempo * (1 + 0.06 * tens) * (mode === 'menu' ? 0.85 : 1);   // tehlike: +%0..6 tempo (yumuşak)
const stepDur = () => 60 / (BASE_BPM * tempoK()) / 4;

function scheduleStep(t, s, b) {
  let lvUp = false;
  if (s === 0) lvUp = applyLevel(t);
  let si = SECTIONS.length - 1; while (SEC_START[si] > b) si--;
  const sec = SECTIONS[si], bi = b - SEC_START[si];
  const c = sec.chords[bi], tri = TRI[c.q], key = LV[curLevel].key, sd = stepDur(), menu = mode === 'menu';
  const hot = clamp01((tens - 0.3) / 0.7);
  const tt = t + (s % 2 ? sd * 0.1 : 0);   // hafif swing: tek 16'lıklar biraz geç (zıplama)
  const thudK = val('thud', t), slapK = val('slap', t), clapK = val('clap', t), fcK = val('fcym', t), crK = val('crot', t);
  const lyK = val('lyre', t), auK = val('aul', t), brK = val('brs', t);

  // Cornu fanfarı: B ve C bölümü başında, döngü başında (Senato+), her seviye geçişinde; ilk yarı ölçüde ezgi susar
  if (s === 0) {
    fanOn = !menu && ((lvUp && curLevel >= 1) || (bi === 0 && (((si === 1 || si === 3) && brK > 0.25) || (b === 0 && loopN > 0 && curLevel >= 2))));
    fanV = lvUp ? 0.7 : Math.min(1.1, Math.max(0.5, brK));
  }
  if (fanOn) for (const [fs, iv, len] of FAN) if (fs === s) {
    const m = 62 + key + iv;
    brass(t, m, len * sd * 0.92, fanV);
    if (curLevel >= 3) brass(t, m + 12, len * sd * 0.92, fanV * 0.4);
  }
  // Yürüyüş vurguları (Senato / Pantheon): cornu boş beşli darbeleri
  if (!menu && sec.march && brK > 0.3 && !(fanOn && s < 8) && (s === 0 || s === 10) && (s === 0 ? bi % 2 === 0 : bi % 2 === 1)) {
    const hb = wrapTo(c.r + key, 50);
    brass(t, hb, sd * 1.6, 0.55 * Math.min(1, brK)); brass(t, hb + 7, sd * 1.6, 0.4 * Math.min(1, brK));
  }

  // Tef / tympanon (menüde yalnızca çok hafif)
  if (menu) {
    if (s === 0 || s === 8) thud(t, 0.38);
    if (s === 10) fcym(tt, 0.3);
  } else {
    if (thudK > 0.02) {
      if (s === 0) thud(t, 1 * thudK);
      else if (s === 6) thud(t, 0.6 * thudK);
      else if (s === 10) thud(t, 0.75 * thudK);
      else if (s === 14 && (curLevel >= 2 || hot > 0.3)) thud(t, 0.5 * thudK);
    }
    if (s === 4 || s === 12) { if (slapK > 0.02) slap(t, slapK); if (clapK > 0.02) clap(t, clapK); }
    if (slapK > 0.02 && bi % 4 === 3 && s >= 13) slap(t, (0.35 + 0.1 * (s - 13)) * slapK);   // ölçü sonu dolgusu
    if (sec.run && bi === 7 && s >= 8 && slapK > 0.02) slap(t, (0.2 + 0.08 * (s - 8)) * slapK);   // köprü sonu roll
    if (hot > 0.05 && s % 4 !== 0) { if (s % 2) slap(tt, 0.5 * hot); else thud(t, 0.4 * hot); }   // gerginlik: 16'lık tef roll'u
    // Parmak zilleri ve kristal ışıltı
    if (fcK > 0.02) {
      if (s === 2 || s === 10) fcym(t, fcK * 0.7);
      else if ((s === 6 || s === 14) && curLevel >= 1) fcym(t, fcK * 0.4);
      if (s === 0 && bi % 4 === 0) fcym(t, fcK);
    }
    if (crK > 0.02 && (s === 14 || s === 6 || (s === 0 && bi === 0)) && Math.random() < 0.55 + 0.45 * crK) {
      const base = wrapTo(c.r + key, 79);
      crotale(tt, base + tri[(bi + s) % tri.length], crK * (s === 0 ? 1 : 0.75));
    }
  }

  // Bas
  const root = wrapTo(c.r + key, 40);
  for (const [bs, iv, len] of (menu ? BASS_MENU : BASS[bi % 2])) if (bs === s) bassNote(tt, root + iv, len * sd * 0.9, menu ? 0.6 : 1);

  // Zemin (boş beşli drone)
  if (s === 0) { const pr = wrapTo(c.r + key, 50), k = val('pad', t) * (menu ? 1.8 : 1); [0, 7, 12].forEach((i) => pad(t, pr + i, sd * SPB, k)); }

  // Lider kanca: aulos soru <-> lir cevap (menüde tümü lirde); aulos notaları lirle ikilenir
  const lead_ = sec.lead[bi], who = sec.who[bi];
  for (const [ls, m, len] of lead_) {
    if (ls !== s) continue;
    if (menu) { lyre(tt, m + key, 0.72); continue; }
    if (fanOn && s < 8) continue;
    if (who === 'a') {
      aulos(tt, m + key, len * sd * 0.9, auK);
      lyre(tt + 0.003, m + key, curLevel === 0 ? 0.45 : 0.28);
      if (sec.dbl && loopN % 2 === 1 && curLevel >= 2) lyre(tt + 0.006, m + key + 12, 0.3);
    } else {
      lyre(tt, m + key, 0.9 * Math.max(lyK, 0.7));
    }
  }

  // Lir eşliği: akor arpeji (liderin sustuğu yerlerde); köprüde 16'lık koşu
  if (menu ? s % 4 === 2 : lyK > 0.02) {
    const base = wrapTo(c.r + key, 57), up = (i) => base + (i < tri.length ? tri[i] : tri[i - tri.length] + 12);
    if (!menu && sec.run) {
      lyre(tt, up([0, 1, 2, 3, 2, 1][(s + bi) % 6]) + 12 * (s % 8 > 3 ? 1 : 0), 0.4 * lyK * (s % 4 === 0 ? 1 : 0.7));
    } else if (menu || s % 2 === 0 || Math.random() < hot * 0.5) {
      const near = lead_.some(([ls]) => Math.abs(ls - s) <= 1) && !(fanOn && s < 8);
      if (!near) lyre(tt, up([0, 1, 2, 3, 2, 1][((s >> 1) + bi) % 6]), (menu ? 0.4 : 0.52) * (menu ? 1 : lyK) * (s % 4 === 2 ? 1 : 0.72));
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
    if (++step >= SPB) { step = 0; bar = (bar + 1) % (mode === 'menu' ? MENU_BARS : TOTAL_BARS); if (bar === 0) loopN++; }
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
  level = 0; curLevel = 0; step = 0; bar = 0; loopN = 0; fanOn = false;
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

