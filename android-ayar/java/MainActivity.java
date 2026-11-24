package com.mustafaktoriyel.lexstack;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

// Web görünümü durum çubuğu ve görev çubuğunun arasında kalır; müzik/ses kullanıcı dokunuşu beklemeden çalabilir
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView web = getBridge().getWebView();
        WebSettings ayar = web.getSettings();
        ayar.setMediaPlaybackRequiresUserGesture(false);   // ses/müzik otomatik başlayabilsin
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);   // oyun sırasında ekran kapanmasın
        View kap = (View) web.getParent();
        kap.setBackgroundColor(Color.parseColor("#190A0E"));
        ViewCompat.setOnApplyWindowInsetsListener(kap, (v, ins) -> {
            Insets i = ins.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
                    | WindowInsetsCompat.Type.ime());
            v.setPadding(i.left, i.top, i.right, i.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(kap);
    }
}
