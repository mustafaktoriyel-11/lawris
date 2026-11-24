// Lex Stack - dil seçici: tek düğme ("TR ▾") + küçük açılır liste; her [data-lang-menu] kabuğu için kurulur
import { LANGS, LANG_NAMES, getLang, setLang, onLang, t } from './i18n.js';

const roots = [];
let uid = 0;

function closeAll(except, focusBack) {
  roots.forEach((r) => {
    if (r === except || r.pop.hidden) return;
    r.pop.hidden = true; r.btn.setAttribute('aria-expanded', 'false');
    if (focusBack) r.btn.focus();
  });
}

function build(el) {
  const id = 'langPop' + (++uid);
  el.classList.add('lang-sw');
  el.innerHTML = '<button type="button" class="lang-cur" aria-haspopup="menu" aria-expanded="false" aria-controls="' + id + '"><span class="lc"></span><svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg></button>' +
    '<div class="lang-pop" id="' + id + '" role="menu" hidden>' + LANGS.map((c) => '<button type="button" role="menuitemradio" data-lang="' + c + '" lang="' + (c === 'pt' ? 'pt-BR' : c) + '"><b>' + c.toUpperCase() + '</b><span>' + LANG_NAMES[c] + '</span></button>').join('') + '</div>';
  const r = { el, btn: el.querySelector('.lang-cur'), pop: el.querySelector('.lang-pop') };
  roots.push(r);
  const items = () => [...r.pop.querySelectorAll('[data-lang]')];
  const open = () => {
    closeAll(r);
    r.pop.hidden = false; r.btn.setAttribute('aria-expanded', 'true');
    const cur = items().find((b) => b.dataset.lang === getLang()) || items()[0];
    cur.focus();
  };
  r.btn.addEventListener('click', () => { if (r.pop.hidden) open(); else closeAll(null, true); });
  r.btn.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); } });
  r.pop.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]'); if (!b) return;
    setLang(b.dataset.lang); closeAll(null, true);
  });
  r.pop.addEventListener('keydown', (e) => {
    const it = items(), i = it.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); it[(i + 1) % it.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); it[(i - 1 + it.length) % it.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); it[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); it[it.length - 1].focus(); }
    else if (e.key === 'Tab') closeAll();
  });
  return r;
}

function sync() {
  const l = getLang();
  roots.forEach((r) => {
    r.btn.querySelector('.lc').textContent = l.toUpperCase();
    r.btn.setAttribute('aria-label', t('lang.label') + ': ' + LANG_NAMES[l]);
    r.el.setAttribute('role', 'group'); r.el.setAttribute('aria-label', t('lang.label'));
    r.pop.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.lang === l)));
  });
}

export function initLangSw() {
  document.querySelectorAll('[data-lang-menu]').forEach(build);
  sync();
  onLang(sync);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && roots.some((r) => !r.pop.hidden)) { e.stopPropagation(); e.preventDefault(); closeAll(null, true); }
  }, true);
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.lang-sw')) closeAll(); }, true);
  // başka bir ekrana geçilince (ör. duraklatma kapanınca) açık liste kalmasın
  new MutationObserver(() => roots.forEach((r) => { if (r.el.offsetParent === null && !r.pop.hidden) closeAll(); }))
    .observe(document.body, { attributes: true, subtree: true, attributeFilter: ['hidden', 'class'] });
}
