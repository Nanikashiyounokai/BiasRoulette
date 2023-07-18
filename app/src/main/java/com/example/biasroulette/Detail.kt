package com.example.biasroulette

import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import androidx.annotation.RequiresApi
import androidx.core.content.ContextCompat
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds

class Detail : AppCompatActivity() {
    @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_detail)

        val adView1 = findViewById<AdView>(R.id.adView1detail)
        val adView2 = findViewById<AdView>(R.id.adView2detail)
        val imageView = findViewById<ImageView>(R.id.imageView)
        val url = "https://skart-inc.jimdofree.com/"
        val button1 = findViewById<Button>(R.id.button1)
        val button2 = findViewById<Button>(R.id.button2)
        val imageView3 = findViewById<ImageView>(R.id.imageView3)

        //広告の表示
        MobileAds.initialize(this) {}
        val adRequest1 = AdRequest.Builder().build()
        adView1.loadAd(adRequest1)
        val adRequest2 = AdRequest.Builder().build()
        adView2.loadAd(adRequest2)

        button1.setOnClickListener {
            button1.backgroundTintList = ContextCompat.getColorStateList(this, R.color.orange)
            button2.backgroundTintList = ContextCompat.getColorStateList(this, R.color.gray)
            button1.setBackgroundResource(R.drawable.frame_style)
            button2.setBackgroundResource(R.drawable.frame_style)
            imageView3.setImageResource(R.drawable.experiment2)
        }

        button2.setOnClickListener {
            button1.backgroundTintList = ContextCompat.getColorStateList(this, R.color.gray)
            button2.backgroundTintList = ContextCompat.getColorStateList(this, R.color.orange)
            button1.setBackgroundResource(R.drawable.frame_style)
            button2.setBackgroundResource(R.drawable.frame_style)
            imageView3.setImageResource(R.drawable.experiment3)
        }

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