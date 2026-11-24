// Lawris - cihazda saklanan isimli skor listesi (localStorage; hiçbir yere gönderilmez)
const KEY = 'lawris.skorlar', BEST = 'lawris.best', AD = 'lawris.ad';
export const MAX = 10;
export const VARSAYILAN_AD = 'İsimsiz Avukat';

const oku = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const yaz = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* yoksay */ } };
const sil = (k) => { try { localStorage.removeItem(k); } catch (_) { /* yoksay */ } };

export function liste() {
  let a = [];
  try { a = JSON.parse(oku(KEY) || '[]'); } catch (_) { a = []; }
  if (!Array.isArray(a)) return [];
  a = a.filter((e) => e && typeof e === 'object' && Number.isFinite(+e.puan))
    .map((e) => ({ ad: String(e.ad ?? VARSAYILAN_AD).slice(0, 16), puan: Math.floor(+e.puan), mahkeme: String(e.mahkeme ?? ''), satir: Math.floor(+e.satir || 0), tarih: String(e.tarih ?? '') }));
  a.sort((x, y) => y.puan - x.puan); // kararlı sıralama: eşitlikte önce kaydedilen önde
  return a.slice(0, MAX);
}

export function enIyi() {
  const eski = parseInt(oku(BEST) || '0', 10) || 0;
  const l = liste();
  return Math.max(eski, l.length ? l[0].puan : 0);
}

export function sigarMi(puan) {
  if (!(puan > 0)) return false;
  const l = liste();
  return l.length < MAX || puan > l[l.length - 1].puan;
}

export function sonAd() { return oku(AD) || ''; }

export function temizAd(s) {
  let t = String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16).trim();
  return t || VARSAYILAN_AD;
}

// Kaydeder; kürsüdeki sırayı (1..10) döndürür, giremediyse 0.
export function ekle(ad, puan, mahkeme, satir) {
  const e = { ad: temizAd(ad), puan: Math.floor(puan), mahkeme, satir, tarih: new Date().toISOString() };
  const l = liste();
  l.push(e);
  l.sort((x, y) => y.puan - x.puan);
  const kes = l.slice(0, MAX);
  yaz(KEY, JSON.stringify(kes));
  yaz(AD, e.ad);
  yaz(BEST, String(Math.max(parseInt(oku(BEST) || '0', 10) || 0, kes[0].puan)));
  return kes.indexOf(e) + 1;
}

export function temizle() { sil(KEY); }

export function kisaTarih(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear();
}
