# Lex Stack

*Türkçe (varsayılan) · [English version below](#english)*

**▶ Oyna: https://mustafaktoriyel-11.github.io/lawris/**

Lex Stack, hukuk temalı, düşen bloklu bir bulmaca oyunudur. Tahta 9 sütun x 18 satırdır ve parçalar 3-6 hücreli evrensel hukuk sembolleridir: Sütun, Tokmak, Kanun, Terazi, Paragraf, Kılıç ve Kalem (Kalem iki kat, Kılıç üç torbada bir gelir). Düz HTML, CSS ve JavaScript (Canvas 2D) ile yazılmıştır; paket veya ağ bağımlılığı yoktur.

## Nasıl oynanır

- Parçaları sola/sağa kaydırın, döndürün, hızlı indirin veya düşürün.
- Tamamen dolan satırlar silinir ve "Hüküm!" yazısı çıkar.
- Her 8 satırda yeni bir Roma mekânına geçersiniz: Forum, Bazilika Iulia, Rostra, Tabularium, Curia Iulia (Senato), Capitolium, Palatium, Pantheon; ardından sonsuz mod (İmparatorluk) başlar: sahneler yeniden döner, hız artmaya devam eder. Her mekân 3 aşamadır (I, II, III; satır 0-2, 3-5, 6-7) ve her aşamada yerçekimi bir kademe hızlanır.
- Puan etiketi "İçtihat puanı"dır; sıradaki 3 parça "Sıradaki" kutusunda görünür (ilki büyük). Hız tablosu aşama başınadır: 1000 ms/satırdan başlar, 8. mekânın son aşamasında 180 ms'dir; sonsuzda her aşamada x0,96, en hızlı 110 ms.
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

## Dil / Language

Oyun tarayıcı diline göre Türkçe ya da İngilizce açılır (`tr` ile başlayan diller Türkçe, diğerleri İngilizce). Açılış ekranı ve duraklatma kartındaki TR | EN düğmesiyle anında değiştirilir; seçim `localStorage` (`lawris.dil`) içinde saklanır. Yeni dil eklemek için `js/i18n.js` içindeki sözlüklere yeni bir dil eklemek yeterlidir.

## English

**Play: https://mustafaktoriyel-11.github.io/lawris/**

Lex Stack is a legal-themed falling-block puzzle. The board is 9 columns x 18 rows and the pieces are 3-6 cell legal symbols: Column, Gavel, Law book, Scales, Section (§), Sword and Pen (the Pen appears twice per bag, the Sword every third bag). It is plain HTML, CSS and JavaScript (Canvas 2D) with no packages or network dependencies.

### How to play

- Slide, rotate, soft-drop or hard-drop the pieces.
- Completed rows are cleared and "Verdict!" flashes.
- Every 8 rows you move to a new Roman place: Forum, Basilica Iulia, Rostra, Tabularium, Curia Iulia (Senate), Capitolium, Palatine Palace, Pantheon; then Endless Imperium begins (scenes cycle, speed keeps rising). Each place has 3 stages (I, II, III; rows 0-2, 3-5, 6-7) and gravity steps up at every stage.
- The score label is "Precedent"; the next 3 pieces show in the "Next" box (the first is large). Gravity follows a per-stage table: 1000 ms/row at the start, 180 ms in the last stage of the 8th place, then x0.96 per stage in endless down to 110 ms.
- **Hold** (once per piece): set the current piece aside (the next one comes if the slot is empty, otherwise they swap; a golden piece stays golden). Use C or Shift on a keyboard, the Hold box in the HUD or the ⇄ button on touch screens.
- About 8% of pieces are **golden** and trigger a special effect when they land:
  - Gavel: clears all 3 rows it touches, +150 points.
  - Column: fills the empty cells beneath it with marble.
  - Scales: bonus points and 10 s of slower gravity.
  - Law book: the next 3 line clears score double.
  - Section: removes the top row of the stack (objection).
  - Pen: "signs the ruling": fills the gaps of the fullest row, clears it, +100 points.
  - Sword: clears the rows the blade cuts (2 if vertical, 1 if horizontal) and the row right below it, +150 points.

### Controls

- Keyboard: ← → move, ↑ or X rotate, ↓ soft drop, Space drop, C or Shift hold, P pause.
- Touch: buttons under the board (⇄ = Hold); drag on the board to move, tap to rotate, flick down to drop.

### Language

The game opens in Turkish or English depending on the browser language (anything starting with `tr` is Turkish, everything else English). Use the TR | EN switch on the start screen or the pause card to change it live; the choice is stored in `localStorage` (`lawris.dil`). To add a language, add a dictionary to `js/i18n.js`. The privacy policy is available as `privacy.html` (Turkish) and `privacy-en.html` (English).

## Müzik ve kaynaklar / Music credits

Arka plan müziği, `audio/` klasöründeki gerçek çalgı kayıtlarını (folk harp, konser harbi, blok flüt, psaltery, çerçeve davulu, darbuka, tef, shaker, parmak zilleri) uyarlamalı bir diziciyle çalar; örnekler yüklenene kadar eski prosedürel sesler devrede kalır. Örnekler [Versilian Community Sample Library](https://github.com/sgossner/VCSL) kütüphanesinden alınmıştır (CC0 1.0, kamu malı; atıf zorunlu değildir, teşekkürle belirtilir). Ayrıntı: `audio/LICENSE.txt`.

Background music is played by an adaptive sequencer using the real instrument recordings in `audio/` (folk harp, concert harp, recorders, psaltery, frame drum, darbuka, tambourine, shaker, finger cymbals); the old synthesized voices stay as a fallback until the samples are decoded. Samples come from the [Versilian Community Sample Library](https://github.com/sgossner/VCSL) (CC0 1.0 public domain; attribution not required, credited with thanks). See `audio/LICENSE.txt`.

## Android derleme

Android uygulaması Capacitor ile paketlenir; derleme GitHub Actions'ta yapılır (`.github/workflows/android.yml`). Yerelde bir şey kurmanız gerekmez.

- **Test APK'sı:** commit mesajına `[apk]` yazın (ör. `git commit -m "yeni ses [apk]"`) ya da Actions sekmesinden "Android APK" iş akışını elle başlatın (her gece de otomatik derlenir). Bitince **Releases › Android test sürümü** (`android-test`) altında `lex-stack-test.apk` çıkar; telefona indirip kurun. Sabit test imzası kullanıldığı için yeni sürüm eskisinin üzerine kurulur.
- **Play Store (AAB):** bir kez yükleme anahtarı üretin: `keytool -genkeypair -v -keystore lexstack-upload.jks -alias lexstack -keyalg RSA -keysize 2048 -validity 10000`. Ardından Settings › Secrets and variables › Actions bölümüne şu 4 gizli değeri ekleyin: `LS_UPLOAD_KEYSTORE_B64` (`base64 -w0 lexstack-upload.jks` çıktısı), `LS_UPLOAD_STORE_PASSWORD`, `LS_UPLOAD_KEY_ALIAS`, `LS_UPLOAD_KEY_PASSWORD`. Her derlemede imzalı `lex-stack.aab` iş akışı çıktısında (Artifacts › `lex-stack-aab-play`) saklanır; Play Console'a bu dosyayı yükleyin. Gizli değerler yoksa AAB geçici anahtarla imzalanır (`lex-stack-aab-deneme`) ve Play'e yüklenemez.
- **Sürüm:** `versionName` kök dizindeki `VERSION` dosyasından, `versionCode` iş akışı çalışma numarasından gelir.
- Gerekli depo ayarı: Settings › Actions › General › Workflow permissions › **Read and write permissions**.
