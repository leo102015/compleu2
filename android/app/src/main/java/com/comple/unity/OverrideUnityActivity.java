package com.comple.unity;

import android.os.Bundle;
import com.unity3d.player.UnityPlayerGameActivity;

public class OverrideUnityActivity extends UnityPlayerGameActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onUnityPlayerUnloaded() {
        // Cuando Unity se descarga, en lugar de matar el proceso, cerramos esta actividad
        // para volver a React Native suavemente.
        finish();
    }
}