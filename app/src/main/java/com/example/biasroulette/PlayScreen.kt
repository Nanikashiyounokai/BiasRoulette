package com.example.biasroulette

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.BitmapFactory
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.os.Handler
import android.view.animation.*
import android.widget.Button
import android.widget.TextView
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds
import com.example.biasroulette.databinding.ActivityPlayScreenBinding

class PlayScreen : AppCompatActivity() {
    private lateinit var binding: ActivityPlayScreenBinding

    @SuppressLint("ResourceType")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPlayScreenBinding.inflate(layoutInflater)
        setContentView(binding.root)

//        変数宣言
        val btnRotate = findViewById<Button>(R.id.btnRotate)
        val btnStop = findViewById<Button>(R.id.btnStop)
        val btnRouletteList = findViewById<Button>(R.id.button4)
        val rouletteName = findViewById<TextView>(R.id.rouletteName)
        val resultText = findViewById<TextView>(R.id.resultText)

//        止まるボタンの無効化
        btnStop.isEnabled = false

//        intentされたBitmapを取得&imageViewにセット
        val byteArray = intent.getByteArrayExtra("capture")
        val bmp = BitmapFactory.decodeByteArray(byteArray, 0, byteArray!!.size)
        binding.imageView2.setImageBitmap(bmp)

//        animationをセット
        val animation: Animation = AnimationUtils.loadAnimation(this, R.anim.animation)
        binding.imageView2.startAnimation(animation)

//        intentされたルーレット名を所得&セット
        val etText1 = intent.getStringExtra("key1")
        rouletteName.text = etText1

        //広告の表示
        MobileAds.initialize(this) {}
        val adView = findViewById<AdView>(R.id.adView)
        val adRequest = AdRequest.Builder().build()
        adView.loadAd(adRequest)

//        回すボタン
        btnRotate.setOnClickListener {
            //        通常回転系の定義
            val animSet0 = AnimationSet(true)
            animSet0.interpolator = DecelerateInterpolator()
            animSet0.fillAfter = true
            animSet0.isFillEnabled = true
            val animRotate0 = RotateAnimation(
                0.0f, -600000.0f,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f
            )
            animRotate0.duration = 250000
            animRotate0.fillAfter = true
            animSet0.addAnimation(animRotate0)

            binding.imageView2.startAnimation(animSet0)
            btnRotate.isEnabled = false
            btnStop.isEnabled = true
            Handler().postDelayed( {
                if(btnStop.isEnabled){
                    btnStop.performClick()
                }
            }, 10000)
        }

//        止めるボタン
        btnStop.setOnClickListener {
            //        停止回転系
            val animSet1 = AnimationSet(true)
            animSet1.interpolator = DecelerateInterpolator()
            animSet1.fillAfter = true
            animSet1.isFillEnabled = true
            val animRotate1 = RotateAnimation(
                0.0f, -3600.0f,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f
            )
            animRotate1.duration = 2500
            animRotate1.fillAfter = true
            animSet1.addAnimation(animRotate1)

            binding.imageView2.startAnimation(animSet1)
            btnRotate.isEnabled = true
            btnStop.isEnabled = false
        }

//        戻るボタン
        btnRouletteList.setOnClickListener {
            intent = Intent(this, RouletteList::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }

    }

}