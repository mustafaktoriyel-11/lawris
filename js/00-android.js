/* Android uygulaması (Capacitor) köprüsü. Web'de (tarayıcı/PWA) window.Capacitor yoktur: hiçbir şey yapmaz.
   - Sistem açılış ekranı, web sayfasının ilk karesi çizilince kapanır.
   - Donanım/hareket geri tuşu: açık kart varsa kapatır, oyundaysa duraklatır, duraklatmadaysa ana menüye döner;
     ana menüdeyken uygulamadan çıkar. (Oyunun kendi düğmelerine tıklayarak çalışır; main.js'e dokunmaz.) */
(function(){
  var CAP=window.Capacitor;if(!CAP)return;
  var P=CAP.Plugins||{},APP=P.App,SS=P.SplashScreen;
  try{document.documentElement.classList.add('ls-uygulama');}catch(e){}
  if(SS)try{requestAnimationFrame(function(){requestAnimationFrame(function(){SS.hide({fadeOutDuration:180});});});}catch(e){}

  function acik(id){var e=document.getElementById(id);return !!e&&!e.hidden;}
  function tikla(id){var e=document.getElementById(id);if(e)e.click();}
  if(APP&&APP.addListener)try{
    APP.addListener('backButton',function(){
      if(acik('rehber'))tikla('rehberX');
      else if(acik('kursu'))tikla('kursuKapat');
      else if(acik('pause'))tikla('pauseMenu');
      else if(acik('over'))tikla('overMenu');
      else if(acik('menu'))APP.exitApp();
      else tikla('pauseBtn');   // oyun sürüyor: duraklat
    });
  }catch(e){}
})();
