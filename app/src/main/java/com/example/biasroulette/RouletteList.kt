package com.example.biasroulette

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds
import io.realm.Realm
import io.realm.kotlin.where
import org.bson.types.ObjectId

class RouletteList : AppCompatActivity() {

    private lateinit var realm: Realm

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        realm = Realm.getDefaultInstance()
        setContentView(R.layout.activity_roulette_list)

        val roulette_rv: RecyclerView = findViewById(R.id.roulette_rv)

        //RecyclerViewにアダプターとレイアウトマネージャーを設定する
        roulette_rv.layoutManager = LinearLayoutManager(this)
        val roulettes = realm.where<RouletteName>().findAll()
        val adapter = RouletteNameAdapter(roulettes)
        roulette_rv.adapter = adapter


        //広告の表示
        MobileAds.initialize(this) {}
        val adView = findViewById<AdView>(R.id.adView)
        val adRequest = AdRequest.Builder().build()
        adView.loadAd(adRequest)
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}