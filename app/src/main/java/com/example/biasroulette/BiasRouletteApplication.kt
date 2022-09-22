package com.example.biasroulette

import android.app.Application
import io.realm.Realm
import io.realm.RealmConfiguration

class BiasRouletteApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Realm.init(this)
        val config = RealmConfiguration.Builder()
            .allowQueriesOnUiThread(true)
            .allowWritesOnUiThread(true)
            .build()
        Realm.setDefaultConfiguration(config)
    }
}