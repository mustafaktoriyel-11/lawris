# Lawris

**▶ Oyna: https://mustafaktoriyel-11.github.io/lawris/**

Lawris, hukuk temalı, düşen bloklu bir bulmaca oyunudur. Tahta 11 sütun x 18 satırdır ve parçalar 5-6 hücreli hukuk nesneleridir: Tokmak, Terazi, Sütun, Kanun cildi, Paragraf ve Mühür. Düz HTML, CSS ve JavaScript (Canvas 2D) ile yazılmıştır; paket veya ağ bağımlılığı yoktur.

## Nasıl oynanır

- Parçaları sola/sağa kaydırın, döndürün, hızlı indirin veya düşürün.
- Tamamen dolan satırlar silinir ve "Hüküm!" yazısı çıkar.
- Her 8 satırda mahkeme yükselir: Sulh, Asliye, İstinaf, Yargıtay (Yargıtay'da hız artmaya devam eder).
- Puan etiketi "İçtihat puanı"dır; bir sonraki parça "Sıradaki dava" kutusunda görünür.
- Yaklaşık %8 ihtimalle gelen **altın** parçalar yerleştiğinde özel etki yapar:
  - Tokmak: dokunduğu en alt satırı siler.
  - Sütun: altındaki boş hücreleri mermerle doldurur.
  - Terazi: bonus puan verir, 10 sn yerçekimini yavaşlatır.
  - Kanun cildi: sonraki 3 satır silmede puan iki katı.
  - Paragraf: yığının en üst satırını kaldırır (itiraz).
  - Mühür: önizlemeye bir kez dokunarak sıradaki parçayı değiştirebilirsiniz.

## Kontroller

- Klavye: ← → hareket, ↑ veya X döndür, ↓ yavaş in, Boşluk düşür, P duraklat.
- Dokunmatik: tahtanın altındaki düğmeler; tahtada sürükleme (hareket), dokunma (döndür), hızlı aşağı fiske (düşür).

## GitHub Pages ile yayınlama

1. Depoyu GitHub'a gönderin.
2. Settings → Pages → Build and deployment → Source: **Deploy from a branch**.
3. Branch: `main`, klasör: `/ (root)` seçip kaydedin.
4. Birkaç dakika sonra oyun `https://<kullanici>.github.io/<depo>/` adresinde açılır.

Tüm yollar göreceli olduğundan alt dizinde de çalışır. `.nojekyll` dosyası ve `manifest.webmanifest` ileride PWA/Capacitor paketlemesi için hazırdır.

## Yerelde çalıştırma

ES modülleri kullanıldığı için bir yerel sunucu gerekir: `python3 -m http.server` ve ardından `http://localhost:8000`.
