// Lex Stack maskotları: aslan (hâkim) ve kedi (stajyer). Semboller index.html içindeki gizli SVG'de.
import { t } from './i18n.js';
const $ = (id) => document.getElementById(id);
const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let overIdx = -1;

const queue = [];
let busy = false, timer = 0, cur = null;

function build(who, text, cls) {
  const el = document.createElement('div');
  el.className = 'pop ' + cls;
  el.innerHTML = '<div class="mascot-badge"><svg viewBox="0 0 120 120"><use href="#' + (who === 'aslan' ? 'mf-aslan' : 'mf-kedi') + '"/></svg></div><div class="bubble"></div>';
  el.querySelector('.bubble').textContent = text;
  return el;
}

function enqueue(item) {
  // Birikme olursa eski çoklu-satır pop-in'lerini at; altın/seviye olaylarını koru.
  if (item.kind === 'hukum') {
    for (let i = queue.length - 1; i >= 0; i--) if (queue[i].kind === 'hukum') queue.splice(i, 1);
    if (queue.length >= 2) return;
  }
  queue.push(item);
  if (queue.length > 4) {
    const i = queue.findIndex((q) => q.kind === 'hukum');
    queue.splice(i >= 0 ? i : 0, 1);
  }
  if (!busy) next();
}

function next() {
  const item = queue.shift();
  const layer = $('mascotLayer');
  if (!item || !layer) { busy = false; return; }
  busy = true;
  const el = build(item.who, item.text, item.cls);
  el.style.setProperty('--dur', item.ms + 'ms');
  if (reduce()) el.classList.add('rm');
  layer.appendChild(el);
  cur = el;
  timer = setTimeout(() => { el.remove(); cur = null; next(); }, item.ms);
}

export function aslanHukum(n) {
  const text = t('lion.' + Math.min(Math.max(n, 2), 4));
  enqueue({ kind: 'hukum', who: 'aslan', text, cls: 'aslan-side', ms: 1500 });
}
export function aslanSeviye(level) {
  const text = t('lion.lvl.' + level);
  enqueue({ kind: 'seviye', who: 'aslan', text, cls: 'aslan-big', ms: 1800 });
}
export function kediSoyle(text, ms = 2200) {
  enqueue({ kind: 'kedi', who: 'kedi', text, cls: 'kedi-corner', ms: Math.min(ms, 2200) });
}
export function kediMenu() {
  const b = $('menuBubble');
  if (b) b.textContent = t('menu.bubble');
}
// keep: dil değişiminde aynı teselli cümlesini çevirir
export function kediOver(keep) {
  const b = $('overBubble');
  if (!keep || overIdx < 0) overIdx = Math.floor(Math.random() * 4);
  if (b) b.textContent = t('over.consol.' + overIdx);
}
export function maskotReset() {
  queue.length = 0; clearTimeout(timer); busy = false;
  if (cur) { cur.remove(); cur = null; }
}
