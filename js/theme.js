// Lex Stack - renk temaları (?tema=a / ?tema=b ile denenebilir)
const q = (() => { try { return new URLSearchParams(location.search).get('tema'); } catch (_) { return null; } })();
const THEMES = {
  lacivert: { name: 'lacivert', bg: '#1B2340', grid: '#253058', panel: '#253058', f: '#E8E4DA', fD: '#A9A397', band: null, kanun: null },
  a: { name: 'a', bg: '#5A1520', grid: '#6B2230', panel: '#6B2230', f: '#C9A227', fD: '#8C6F12', band: null, kanun: null },
  b: { name: 'b', bg: '#190A0E', grid: '#2A1419', panel: '#2A1419', f: '#E8E4DA', fD: '#A9A397', band: '#C9A227', kanun: { main: '#4A72C4', dark: '#26407A' } },
};
export const THEME = THEMES[q] || THEMES.b;
document.documentElement.style.setProperty('--bg', THEME.bg);
document.documentElement.style.setProperty('--panel', THEME.panel);

// Mahkeme seviyesine göre zemin renkleri (yalnızca varsayılan temada)
const LEVEL_COLORS = [
  { bg: '#2C5E92', grid: '#3A6EA4' }, // Forum: sabah
  { bg: '#1C6B7C', grid: '#277E90' }, // Bazilika: öğle
  { bg: '#8A3C27', grid: '#9D4B33' }, // Senato (Curia): gün batımı
  { bg: '#1E2659', grid: '#2B346E' }, // Pantheon: gece
];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
let from = null, to = null, t = 1, fromLv = 0, toLv = 0;
// Arka plan geçişi için: önceki/sonraki seviye ve 0..1 yumuşatılmış ilerleme
export function levelFade() { return { a: fromLv, b: toLv, e: t * t * (3 - 2 * t) }; }
export function setLevelColors(level, instant) {
  if (THEME.name !== 'b') return;
  const target = LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
  fromLv = toLv; toLv = Math.min(level, LEVEL_COLORS.length - 1); if (instant) fromLv = toLv;
  from = { bg: THEME.bg, grid: THEME.grid }; to = target; t = instant ? 1 : 0;
  if (instant) apply(target.bg, target.grid);
}
function apply(bg, grid) {
  THEME.bg = bg; THEME.grid = grid; THEME.panel = grid;
  document.documentElement.style.setProperty('--bg', bg);
  document.documentElement.style.setProperty('--panel', grid);
}
// her karede çağrılır; geçiş ~1,5 sn sürer
export function tickColors(dt) {
  if (!to || t >= 1) return;
  t = Math.min(1, t + dt / 1500);
  const e = t * t * (3 - 2 * t);
  apply(mix(from.bg, to.bg, e), mix(from.grid, to.grid, e));
}
