package com.example.biasroulette

import android.content.Intent
import android.net.Uri
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds

class Detail : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_detail)

        //広告の表示
        MobileAds.initialize(this) {}
        val adView1 = findViewById<AdView>(R.id.adView1detail)
        val adRequest1 = AdRequest.Builder().build()
        adView1.loadAd(adRequest1)
        val adView2 = findViewById<AdView>(R.id.adView2detail)
        val adRequest2 = AdRequest.Builder().build()
        adView2.loadAd(adRequest2)

        val imageView = findViewById<ImageView>(R.id.imageView)
        val url = "https://skart-inc.jimdofree.com/"

        imageView.setOnClickListener {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
        }
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}