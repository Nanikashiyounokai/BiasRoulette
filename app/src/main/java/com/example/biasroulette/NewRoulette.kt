package com.example.biasroulette

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds

class NewRoulette : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_new_roulette)

        //広告の表示
        MobileAds.initialize(this) {}
        val adView = findViewById<AdView>(R.id.newRouletteAdView)
        val adRequest = AdRequest.Builder().build()
        adView.loadAd(adRequest)

        //変数宣言
        val etNewRoulette = findViewById<EditText>(R.id.etNewRoulette)
        val tvItem = findViewById<TextView>(R.id.tvItem)
        val tvInternalRatio = findViewById<TextView>(R.id.tvInternalRatio)
        val tvExternalRatio = findViewById<TextView>(R.id.tvExternalRatio)
        val rvNewRoulette = findViewById<RecyclerView>(R.id.rvNewRoulette)
        val btnNewItem = findViewById<Button>(R.id.btnNewItem)
        val btnAllDeletion = findViewById<Button>(R.id.btnAllDeletion)
        val btnCompleted = findViewById<Button>(R.id.btnCompleted)
        val btnRateChange = findViewById<Button>(R.id.btnRateChange)

        //クリック処理
        btnNewItem.setOnClickListener {

        }

        btnAllDeletion.setOnClickListener {

        }

        btnCompleted.setOnClickListener {
            intent = Intent(this, PlayScreen::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        btnRateChange.setOnClickListener {

        }


    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}