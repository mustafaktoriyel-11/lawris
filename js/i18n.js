// Lex Stack - çok dillilik (tr / en). Yeni dil eklemek için DICT'e bir sözlük ve LANGS'a kod eklemek yeter.
const KEY = 'lawris.dil';
export const LANGS = ['tr', 'en'];

const tr = {
  'doc.title': 'Lex Stack',
  'meta.desc': 'Lex Stack: hukuk temalı düşen blok bulmaca oyunu.',
  'menu.bubble': 'Duruşma açılıyor! Kürsü seni bekliyor.',
  'menu.tag': 'Davaları istifle, satırlara hüküm ver.',
  'menu.best': 'En iyi',
  'menu.play': 'Oyna',
  'menu.kursu': 'Şeref kürsüsü',
  'menu.rehber': 'Nasıl oynanır',
  'menu.privacy': 'Gizlilik',
  'privacy.href': 'privacy.html',
  'kbd.menu': 'Klavye: ← → hareket, ↑/X döndür, ↓ yavaş in, Boşluk düşür, C talik, P duraklat',
  'kbd.title': 'Klavye',
  'kbd.help': '← → hareket · ↑/X döndür · ↓ in · Boşluk düşür · C talik · P duraklat',
  'lang.label': 'Dil',
  'hud.score': 'İçtihat puanı',
  'hud.best': 'En iyi: ',
  'hud.court': 'Mekân',
  'hud.hold': 'Talik',
  'hud.holdAria': 'Talik: parçayı beklet',
  'hud.next': 'Sıradaki',
  'hud.slow': 'yavaş {n}sn',
  'court.0.short': 'Forum', 'court.0.full': 'Forum Romanum',
  'court.1.short': 'Bazilika', 'court.1.full': 'Bazilika',
  'court.2.short': 'Senato', 'court.2.full': 'Curia (Senato)',
  'court.3.short': 'Pantheon', 'court.3.full': 'Pantheon',
  'aria.pause': 'Duraklat',
  'aria.musicOff': 'Müziği kapat', 'aria.musicOn': 'Müziği aç',
  'aria.sfxOff': 'Efektleri kapat', 'aria.sfxOn': 'Efektleri aç',
  'aria.left': 'Sol', 'aria.down': 'Aşağı', 'aria.right': 'Sağ',
  'aria.hold': 'Talik', 'aria.drop': 'Düşür', 'aria.rotate': 'Döndür',
  'aria.close': 'Kapat',
  'lion.2': 'Hüküm!', 'lion.3': 'Oybirliğiyle!', 'lion.4': 'Emsal karar!',
  'lion.lvl.1': 'Dosya Bazilika\'ya taşındı',
  'lion.lvl.2': 'Curia kapıları açıldı',
  'lion.lvl.3': 'Pantheon\'un kubbesi altındasın',
  'flash.verdict': 'Hüküm!',
  'pause.title': 'Duraklatıldı',
  'pause.resume': 'Devam',
  'pause.menu': 'Ana menü',
  'over.title': 'Dava düştü',
  'over.score': 'İçtihat puanı: ',
  'over.best': 'En iyi: ',
  'over.time': 'Duruşma süresi: ',
  'over.consol.0': 'Bir dahakine Senato\'ya taşırız!',
  'over.consol.1': 'Her büyük hukukçu dava kaybetmiştir.',
  'over.consol.2': 'Biraz mola, sonra yeniden duruşma!',
  'over.consol.3': 'Dosya kapanmadı, temyiz yolu açık!',
  'over.again': 'Tekrar oyna',
  'over.lex': 'Hukuk çalışmaya devam et → Lex Odak',
  'kayit.label': 'Şeref kürsüsüne adını yaz',
  'kayit.ph': 'Takma ad',
  'kayit.save': 'Kaydet',
  'kayit.saved': 'Kürsüde {n}. sıradasın!',
  'kayit.defaultName': 'İsimsiz Avukat',
  'kursu.title': 'Şeref Kürsüsü',
  'kursu.empty': 'Henüz hüküm yok. İlk davayı sen aç!',
  'kursu.close': 'Kapat',
  'kursu.clear': 'Listeyi temizle',
  'kursu.confirm': 'Emin misin? Tekrar dokun',
  'rh.title': 'Nasıl oynanır',
  'rh.l0': 'Önce kontrolleri öğren, sonra kürsü senin!',
  'rh.l1': 'Yedi parça, yedi hukuk sembolü.',
  'rh.l2': 'Altın parça görürsen sevin!',
  'rh.l3': 'Pantheon\'a kadar çıkabilir misin?',
  'rh.c0.title': 'Kontroller',
  'rh.move': 'Hareket', 'rh.rotate': 'Döndür', 'rh.soft': 'Yavaş in', 'rh.drop': 'Düşür',
  'rh.holdKey': 'Talik: parçayı beklet',
  'rh.c0.touch': 'Tahtada parmağını kaydır: sağa/sola sürükle taşır, aşağı sürükle yavaş indirir, dokun döndürür, hızlıca aşağı çek düşürür.',
  'rh.c0.kbd': 'Klavye: ← → hareket, ↑/X döndür, ↓ yavaş in, Boşluk düşür, C/Shift talik, P duraklat.',
  'rh.c0.note': 'Talik: her parçada bir kez, Talik kutusuna dokun. Yere değince yarım saniye daha kaydırabilirsin.',
  'rh.c1.title': 'Parçalar',
  'rh.c1.text': 'Her parça bir hukuk sembolü; dolu satırlar silinir, buna hüküm denir. Sıradaki 3 dava hep görünür.',
  'piece.sutun': 'Sütun', 'piece.tokmak': 'Tokmak', 'piece.kanun': 'Kanun', 'piece.terazi': 'Terazi',
  'piece.paragraf': 'Paragraf', 'piece.kilic': 'Kılıç', 'piece.kalem': 'Kalem',
  'rh.c2.title': 'Altın parçalar',
  'rh.c2.text': 'Yalnızca Sütun ve Kanun altın olabilir; yaklaşık her 7 parçada bir altın gelir. Parıldayarak gelir, etkisini gösterince söner.',
  'gold.sutun': 'Altındaki boşlukları mermerle doldurur.',
  'gold.kanun': 'Kanun hükmü: en alttaki 2 dolu satırı siler, +100 puan.',
  'rh.c3.title': 'Roma mekânları',
  'rh.c3.p1': 'Her 8 satırda bir sonraki mekâna geçersin.',
  'rh.c3.p2': 'Yükseldikçe her satır daha çok puan: Pantheon\'da 4 katı.',
  'rh.c3.p3': 'Aynı anda birden çok satır sil, aslan hükmünü okusun!',
  'rh.c3.note': 'Duruşma süresi sayılır; en iyilerin Şeref kürsüsüne yazılır.',
  'rh.back': 'Geri', 'rh.next': 'İleri', 'rh.start': 'Başla',
  'toast.sutun': 'Altın Sütun: altındaki boşluklar mermerle dolduruldu.',
  'toast.kanun': 'Altın Kanun: hüküm verildi, en alttaki 2 satır silindi.',
};

const en = {
  'doc.title': 'Lex Stack',
  'meta.desc': 'Lex Stack: a legal-themed falling-block puzzle game.',
  'menu.bubble': 'Court is in session! The bench awaits.',
  'menu.tag': 'Stack the cases. Rule the rows.',
  'menu.best': 'Best',
  'menu.play': 'Play',
  'menu.kursu': 'Hall of Fame',
  'menu.rehber': 'How to play',
  'menu.privacy': 'Privacy',
  'privacy.href': 'privacy-en.html',
  'kbd.menu': 'Keys: ← → move, ↑/X rotate, ↓ soft drop, Space drop, C hold, P pause',
  'kbd.title': 'Keys',
  'kbd.help': '← → move · ↑/X rotate · ↓ soft drop · Space drop · C hold · P pause',
  'lang.label': 'Language',
  'hud.score': 'Precedent',
  'hud.best': 'Best: ',
  'hud.court': 'Place',
  'hud.hold': 'Hold',
  'hud.holdAria': 'Hold: set the piece aside',
  'hud.next': 'Next',
  'hud.slow': 'slow {n}s',
  'court.0.short': 'Forum', 'court.0.full': 'Forum Romanum',
  'court.1.short': 'Basilica', 'court.1.full': 'Basilica',
  'court.2.short': 'Senate', 'court.2.full': 'Curia (Senate)',
  'court.3.short': 'Pantheon', 'court.3.full': 'Pantheon',
  'aria.pause': 'Pause',
  'aria.musicOff': 'Turn music off', 'aria.musicOn': 'Turn music on',
  'aria.sfxOff': 'Turn sound effects off', 'aria.sfxOn': 'Turn sound effects on',
  'aria.left': 'Left', 'aria.down': 'Down', 'aria.right': 'Right',
  'aria.hold': 'Hold', 'aria.drop': 'Drop', 'aria.rotate': 'Rotate',
  'aria.close': 'Close',
  'lion.2': 'Verdict!', 'lion.3': 'Unanimous!', 'lion.4': 'Landmark ruling!',
  'lion.lvl.1': 'The case moves to the Basilica',
  'lion.lvl.2': 'The Curia doors open',
  'lion.lvl.3': 'You stand beneath the Pantheon dome',
  'flash.verdict': 'Verdict!',
  'pause.title': 'Paused',
  'pause.resume': 'Resume',
  'pause.menu': 'Main menu',
  'over.title': 'Case dismissed',
  'over.score': 'Precedent: ',
  'over.best': 'Best: ',
  'over.time': 'Hearing time: ',
  'over.consol.0': 'We\'ll take it to the Senate next time!',
  'over.consol.1': 'Every great lawyer has lost a case.',
  'over.consol.2': 'A short recess, then back in session!',
  'over.consol.3': 'The file isn\'t closed: appeal is still open!',
  'over.again': 'Play again',
  'over.lex': '',
  'kayit.label': 'Enter your name for the Hall of Fame',
  'kayit.ph': 'Nickname',
  'kayit.save': 'Save',
  'kayit.saved': 'You\'re #{n} in the Hall of Fame!',
  'kayit.defaultName': 'Anonymous Counsel',
  'kursu.title': 'Hall of Fame',
  'kursu.empty': 'No verdicts yet. Open the first case!',
  'kursu.close': 'Close',
  'kursu.clear': 'Clear list',
  'kursu.confirm': 'Sure? Tap again',
  'rh.title': 'How to play',
  'rh.l0': 'Learn the controls first, then the bench is yours!',
  'rh.l1': 'Seven pieces, seven legal symbols.',
  'rh.l2': 'Spot a golden piece? Rejoice!',
  'rh.l3': 'Can you make it to the Pantheon?',
  'rh.c0.title': 'Controls',
  'rh.move': 'Move', 'rh.rotate': 'Rotate', 'rh.soft': 'Soft drop', 'rh.drop': 'Drop',
  'rh.holdKey': 'Adjourn a case: hold a piece for later',
  'rh.c0.touch': 'Swipe on the board: drag sideways to move, drag down to soft drop, tap to rotate, flick down to drop.',
  'rh.c0.kbd': 'Keyboard: ← → move, ↑/X rotate, ↓ soft drop, Space drop, C/Shift hold, P pause.',
  'rh.c0.note': 'Hold: once per piece, tap the Hold box. After landing you can slide for another half second.',
  'rh.c1.title': 'Pieces',
  'rh.c1.text': 'Each piece is a legal symbol; full rows are cleared, which is called a verdict. The next 3 cases are always visible.',
  'piece.sutun': 'Column', 'piece.tokmak': 'Gavel', 'piece.kanun': 'Law book', 'piece.terazi': 'Scales',
  'piece.paragraf': 'Section §', 'piece.kilic': 'Sword', 'piece.kalem': 'Pen',
  'rh.c2.title': 'Golden pieces',
  'rh.c2.text': 'Only the Column and the Law tablet can turn golden, roughly once every 7 pieces. They arrive shimmering and fade once their effect fires.',
  'gold.sutun': 'Fills the gaps beneath it with marble.',
  'gold.kanun': 'Law decree: clears the 2 bottom rows, +100 points.',
  'rh.c3.title': 'Roman places',
  'rh.c3.p1': 'Every 8 rows you move on to the next place.',
  'rh.c3.p2': 'Later places pay more per row: 4x in the Pantheon.',
  'rh.c3.p3': 'Clear several rows at once and the lion reads the verdict!',
  'rh.c3.note': 'Hearing time is tracked; the best runs are written into the Hall of Fame.',
  'rh.back': 'Back', 'rh.next': 'Next', 'rh.start': 'Start',
  'toast.sutun': 'Golden Column: gaps below filled with marble.',
  'toast.kanun': 'Golden Law Book: decree issued, the 2 bottom rows cleared.',
};

export const DICT = { tr, en };
export const EVENT = 'lawris:lang';

function detect() {
  try { const s = localStorage.getItem(KEY); if (s && DICT[s]) return s; } catch (_) { /* yoksay */ }
  const nav = (typeof navigator !== 'undefined' && (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language])) || [];
  const first = String(nav[0] || '').toLowerCase();
  return first.startsWith('tr') ? 'tr' : 'en';
}

let lang = detect();
export const getLang = () => lang;

export function t(key, vars) {
  let s = DICT[lang][key];
  if (s === undefined) s = DICT.en[key];
  if (s === undefined) s = DICT.tr[key];
  if (s === undefined) return key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}

// Statik metinler: data-i18n (textContent), data-i18n-attr="nitelik:anahtar;..." ve data-lang-only="tr"
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const i = pair.indexOf(':');
      if (i > 0) el.setAttribute(pair.slice(0, i).trim(), t(pair.slice(i + 1).trim()));
    });
  });
  root.querySelectorAll('[data-lang-only]').forEach((el) => { el.hidden = el.dataset.langOnly !== lang; });
  root.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  document.documentElement.lang = lang;
  document.title = t('doc.title');
}

export function setLang(l) {
  if (!DICT[l]) return;
  lang = l;
  try { localStorage.setItem(KEY, l); } catch (_) { /* yoksay */ }
  applyStatic();
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { lang } }));
}

// Dil değişince dinamik metinleri yenilemek için
export const onLang = (fn) => window.addEventListener(EVENT, fn);

// Varsayılan ad hangi dilde kaydedilmiş olursa olsun geçerli dilde gösterilir
export const isDefaultName = (s) => Object.values(DICT).some((d) => d['kayit.defaultName'] === s);

// Kürsü tarihi: tr 24.11.2026, diğerleri Intl ile
export function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  if (lang === 'tr') {
    const p = (n) => String(n).padStart(2, '0');
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear();
  }
  try { return new Intl.DateTimeFormat(lang).format(d); } catch (_) { return d.toLocaleDateString(); }
}

// Kürsüde saklanan mahkeme: yeni kayıtlar 'c0'..'c3', eski kayıtlar Türkçe ad ('Sulh' ...)
export function courtLabel(stored) {
  const m = /^c([0-3])$/.exec(stored || '');
  let i = m ? +m[1] : -1;
  if (i < 0) { const L = { Sulh: 0, Asliye: 1, 'İstinaf': 2, 'Yargıtay': 3, 'Magistr.': 0, District: 1, Appeal: 2, Supreme: 3 }[stored]; if (L !== undefined) i = L; }
  if (i < 0) for (let k = 0; k < 4; k++) if (DICT.tr['court.' + k + '.short'] === stored) i = k;
  return i < 0 ? String(stored || '') : t('court.' + i + '.full');
}

applyStatic();
