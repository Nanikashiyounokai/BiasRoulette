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
        val adView = findViewById<AdView>(R.id.mainAdView)
        val adRequest = AdRequest.Builder().build()
        adView.loadAd(adRequest)

        //変数宣言
        val btnNewRoulette = findViewById<Button>(R.id.btnNewRoulette)
        val btnRouletteList1 = findViewById<Button>(R.id.btnRouletteList1)
        val btnDetail = findViewById<Button>(R.id.btnDetail)

        //クリック処理
        btnNewRoulette.setOnClickListener {
            intent = Intent(this, NewRoulette::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        btnRouletteList1.setOnClickListener {
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