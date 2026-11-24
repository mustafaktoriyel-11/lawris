# Lawris

**▶ Oyna: https://mustafaktoriyel-11.github.io/lawris/**

Lawris, hukuk temalı, düşen bloklu bir bulmaca oyunudur. Tahta 11 sütun x 18 satırdır ve parçalar 3-6 hücreli evrensel hukuk sembolleridir: Sütun, Tokmak, Kanun, Terazi, Paragraf, Kılıç ve Kalem (Kılıç diğerlerinin yarı olasılığıyla gelir). Düz HTML, CSS ve JavaScript (Canvas 2D) ile yazılmıştır; paket veya ağ bağımlılığı yoktur.

## Nasıl oynanır

- Parçaları sola/sağa kaydırın, döndürün, hızlı indirin veya düşürün.
- Tamamen dolan satırlar silinir ve "Hüküm!" yazısı çıkar.
- Her 8 satırda mahkeme yükselir: Sulh, Asliye, İstinaf, Yargıtay (Yargıtay'da hız artmaya devam eder).
- Puan etiketi "İçtihat puanı"dır; sıradaki 3 parça "Sıradaki" kutusunda görünür (ilki büyük). Hız eğrisi yumuşaktır: her 3 satırda yerçekimi %5 hızlanır, en hızlı 110 ms.
- **Talik**: her parçada bir kez, geçerli parçayı beklemeye alır (boşsa sıradaki gelir, doluysa yer değiştirirler; altın parça altın kalır). Klavyede C veya Shift, dokunmatikte HUD'daki Talik kutusu ya da ⇄ düğmesi.
- Yaklaşık %8 ihtimalle gelen **altın** parçalar yerleştiğinde özel etki yapar:
  - Tokmak: değdiği 3 satırın tamamını siler, +150 puan.
  - Sütun: altındaki boş hücreleri mermerle doldurur.
  - Terazi: bonus puan verir, 10 sn yerçekimini yavaşlatır.
  - Kanun: sonraki 3 satır silmede puan iki katı.
  - Paragraf: yığının en üst satırını kaldırır (itiraz).
  - Kalem: "karar imzalanır": en dolu satırın boşlukları mermerle dolar, satır silinir, +100 puan.
  - Kılıç: bıçağın kestiği satırları (dikeyse 2, yataysa 1) ve bıçağın hemen altındaki satırı siler, +150 puan.

## Kontroller

- Klavye: ← → hareket, ↑ veya X döndür, ↓ yavaş in, Boşluk düşür, C veya Shift talik, P duraklat.
- Dokunmatik: tahtanın altındaki düğmeler (⇄ = Talik); tahtada sürükleme (hareket), dokunma (döndür), hızlı aşağı fiske (düşür).

## GitHub Pages ile yayınlama

1. Depoyu GitHub'a gönderin.
2. Settings → Pages → Build and deployment → Source: **Deploy from a branch**.
3. Branch: `main`, klasör: `/ (root)` seçip kaydedin.
4. Birkaç dakika sonra oyun `https://<kullanici>.github.io/<depo>/` adresinde açılır.

Tüm yollar göreceli olduğundan alt dizinde de çalışır. `.nojekyll` dosyası ve `manifest.webmanifest` ileride PWA/Capacitor paketlemesi için hazırdır.

## Yerelde çalıştırma

ES modülleri kullanıldığı için bir yerel sunucu gerekir: `python3 -m http.server` ve ardından `http://localhost:8000`.
