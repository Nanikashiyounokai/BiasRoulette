package com.example.biasroulette;

import android.app.Application;
import com.beardedhen.androidbootstrap.TypefaceProvider;

// Applicationを継承
public class TestBootstrap extends Application {
    @Override public void onCreate() {
        super.onCreate();
        TypefaceProvider.registerDefaultIconSets();
    }
}