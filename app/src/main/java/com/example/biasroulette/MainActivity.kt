package com.example.biasroulette

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        //広告の表示
        MobileAds.initialize(this) {}
        val adView1 = findViewById<AdView>(R.id.adView1)
        val adRequest1 = AdRequest.Builder().build()
        adView1.loadAd(adRequest1)
        val adView201 = findViewById<AdView>(R.id.adView201)
        val adRequest201 = AdRequest.Builder().build()
        adView201.loadAd(adRequest201)
        val adView202 = findViewById<AdView>(R.id.adView202)
        val adRequest202 = AdRequest.Builder().build()
        adView202.loadAd(adRequest202)


        //変数宣言
        val btnNewRoulette = findViewById<Button>(R.id.button)
        val btnRouletteList = findViewById<Button>(R.id.button2)
        val btnDetail = findViewById<Button>(R.id.button3)

        //クリック処理
        btnNewRoulette.setOnClickListener {
            intent = Intent(this, NewRoulette::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        btnRouletteList.setOnClickListener {
            intent = Intent(this, RouletteList::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        btnDetail.setOnClickListener {
            intent = Intent(this, Detail::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }


    }
}