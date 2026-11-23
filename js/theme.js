// Lawris - renk temaları (?tema=a / ?tema=b ile denenebilir)
const q = (() => { try { return new URLSearchParams(location.search).get('tema'); } catch (_) { return null; } })();
const THEMES = {
  lacivert: { name: 'lacivert', bg: '#1B2340', grid: '#253058', panel: '#253058', f: '#E8E4DA', fD: '#A9A397', band: null, kanun: null },
  a: { name: 'a', bg: '#5A1520', grid: '#6B2230', panel: '#6B2230', f: '#C9A227', fD: '#8C6F12', band: null, kanun: null },
  b: { name: 'b', bg: '#2A0E14', grid: '#3B1820', panel: '#3B1820', f: '#E8E4DA', fD: '#A9A397', band: '#C9A227', kanun: { main: '#26305A', dark: '#151B33' } },
};
export const THEME = THEMES[q] || THEMES.b;
document.documentElement.style.setProperty('--bg', THEME.bg);
document.documentElement.style.setProperty('--panel', THEME.panel);
