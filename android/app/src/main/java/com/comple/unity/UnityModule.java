package com.comple.unity;

import android.content.Intent;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class UnityModule extends ReactContextBaseJavaModule {
    public UnityModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "UnityModule";
    }

    @ReactMethod
    public void openUnity() {
        android.app.Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) return;

        Intent intent = new Intent(currentActivity, OverrideUnityActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        currentActivity.startActivity(intent);
    }
}