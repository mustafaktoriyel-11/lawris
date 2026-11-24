// Lex Stack - Günlük Dava: UTC gününe bağlı tohum, belirlenimci rastgelelik, yerel kayıt (seri, en iyi, ilk deneme)
const KEY = 'lawris.gunluk';
export const EPOCH = Date.UTC(2026, 10, 24);   // 24 Kasım 2026 = Dava #1
export const DURATION_MS = 120000;
export const SHARE_URL = 'https://mustafaktoriyel-11.github.io/lawris/';
const DAY = 86400000;

// mulberry32: küçük, hızlı, tohumlu PRNG (yalnız günlük modda kullanılır)
export function mulberry32(a) {
  a >>>= 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n) => String(n).padStart(2, '0');
const utcOf = (key) => Date.UTC(Math.floor(key / 10000), Math.floor(key / 100) % 100 - 1, key % 100);
const keyOf = (ms) => { const d = new Date(ms); return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate(); };
function validKey(v) {
  const s = String(v == null ? '' : v);
  if (!/^\d{8}$/.test(s)) return 0;
  const k = +s;
  return keyOf(utcOf(k)) === k ? k : 0;   // 20261345 gibi geçersiz tarihleri reddeder
}

// Test için tarih geçersiz kılma: ?gun=YYYYMMDD ya da setOverride()
let override = 0;
try { override = validKey(new URLSearchParams(location.search).get('gun')); } catch (_) { /* yoksay */ }
export function setOverride(v) { override = v ? validKey(v) : 0; return dayKey(); }
export const dayKey = () => override || keyOf(Date.now());
export const caseNo = (key = dayKey()) => Math.round((utcOf(key) - EPOCH) / DAY) + 1;
export const seedOf = (key = dayKey()) => key >>> 0;
export const prevKey = (key) => keyOf(utcOf(key) - DAY);

function read() {
  let o = null;
  try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { o = null; }
  if (!o || typeof o !== 'object') o = {};
  if (!o.days || typeof o.days !== 'object') o.days = {};
  o.streak = Math.max(0, Math.floor(+o.streak) || 0);
  o.bestStreak = Math.max(o.streak, Math.floor(+o.bestStreak) || 0);
  o.last = validKey(o.last);
  return o;
}
function write(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (_) { /* yoksay */ } }

// Günün durumu: { played, best, first, streak, bestStreak }
export function info(key = dayKey()) {
  const o = read(), d = o.days[key];
  return { played: !!d, best: d ? d.best : 0, first: d ? d.first : 0, runs: d ? d.runs : 0, streak: o.streak, bestStreak: o.bestStreak };
}

// Bir deneme bittiğinde çağrılır. İlk deneme ayrı saklanır; en iyi puan her denemeden güncellenir.
export function record(score, key = dayKey()) {
  score = Math.max(0, Math.floor(score) || 0);
  const o = read();
  const d = o.days[key] || (o.days[key] = { first: score, best: 0, runs: 0 });
  d.runs = (d.runs || 0) + 1;
  d.best = Math.max(d.best || 0, score);
  if (!o.last) o.streak = 1;
  else {
    const diff = Math.round((utcOf(key) - utcOf(o.last)) / DAY);
    if (diff === 1) o.streak += 1;
    else if (diff > 1) o.streak = 1;
    else if (diff === 0 && !o.streak) o.streak = 1;
    // diff < 0 (geçmiş gün): seri değişmez
  }
  if (!o.last || key > o.last) o.last = key;
  o.bestStreak = Math.max(o.bestStreak, o.streak);
  const keys = Object.keys(o.days).sort();   // yalnız son 30 gün tutulur
  while (keys.length > 30) delete o.days[keys.shift()];
  write(o);
  return { first: d.first, best: d.best, runs: d.runs, isFirst: d.runs === 1, streak: o.streak, bestStreak: o.bestStreak };
}

// Son n gün (bugün dahil) içinde oynanmış günler, yeniden eskiye
export function recent(n = 7, key = dayKey()) {
  const o = read(), out = [];
  let k = key;
  for (let i = 0; i < n; i++, k = prevKey(k)) if (o.days[k]) out.push({ key: k, no: caseNo(k), best: o.days[k].best });
  return out;
}

export function fmtNum(n, lang) {
  try { return Math.floor(n).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US'); } catch (_) { return String(n); }
}

// Panoya kopyala (clipboard API, olmazsa eski yöntem)
export async function copyText(text) {
  try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; } } catch (_) { /* yedeğe geç */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    ta.remove();
    return !!ok;
  } catch (_) { return false; }
}
// 'shared' | 'copied' | 'cancel' | 'fail'
export async function share(text) {
  if (typeof navigator.share === 'function') {
    try { await navigator.share({ text }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
  }
  return (await copyText(text)) ? 'copied' : 'fail';
}
