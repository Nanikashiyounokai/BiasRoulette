package com.example.biasroulette

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Bundle
import android.os.Handler
import android.util.Log
import android.view.animation.*
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds
import kotlin.properties.Delegates

class PlayScreen : AppCompatActivity() {

    @SuppressLint("ResourceType")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_play_screen)

//        変数宣言
        val btnRotate = findViewById<Button>(R.id.btnRotate)
        val btnStop = findViewById<Button>(R.id.btnStop)
        val btnRouletteList = findViewById<Button>(R.id.button4)
        val rouletteName = findViewById<TextView>(R.id.playRouletteName)
        val resultText = findViewById<TextView>(R.id.resultText)
        val imageView2 = findViewById<ImageView>(R.id.image_view_2)

//        Intent関係
        //rouletteNameを遷移前「RouletteList」から引っ張ってくる。
        val In_rouletteName = intent.getStringExtra("ROULETTE_NAME")

        //定義したIn_rouletteNameをplay画面のrouletteNameという変数に代入。
        rouletteName.setText(In_rouletteName)

        val name = intent.getStringArrayListExtra("name")
        val num1 = intent.getIntegerArrayListExtra("num1")
        val num2 = intent.getIntegerArrayListExtra("num2")

//        intentされたBitmapを取得&imageViewにセット
        val byteArray = intent.getByteArrayExtra("capture")
        val bmp = BitmapFactory.decodeByteArray(byteArray, 0, byteArray!!.size)
        imageView2.setImageBitmap(bmp)

//        animationをセット
        val animation: Animation = AnimationUtils.loadAnimation(this, R.anim.animation)
        imageView2.startAnimation(animation)

//        広告の表示
        MobileAds.initialize(this) {}
        val adView = findViewById<AdView>(R.id.adView)
        val adRequest = AdRequest.Builder().build()
        adView.loadAd(adRequest)

//        止まるボタンの無効化
        btnStop.isEnabled = false

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

            imageView2.startAnimation(animSet0)
            btnRotate.isEnabled = false
            btnStop.isEnabled = true
            Handler().postDelayed( {
                if(btnStop.isEnabled){
                    btnStop.performClick()
                }
            }, 5000)
        }

//        止めるボタン
        btnStop.setOnClickListener {
            btnRotate.isEnabled = false
            btnStop.isEnabled = false

            Log.d("ここをよめ！！！！", num2.toString())

            val result = valueDrawing(num2!![0],num2[1],num2[2],num2[3],num2[4],num2[5],num2[6],num2[7],num2[8],num2[9])
            val pos = stopPosition(result, num1!![0],num1[1],num1[2],num1[3],num1[4],num1[5],num1[6],num1[7],num1[8],num1[9])
            //        停止回転系
            val animSet1 = AnimationSet(true)
            animSet1.interpolator = DecelerateInterpolator()
            animSet1.fillAfter = true
            animSet1.isFillEnabled = true
            val animRotate1 = RotateAnimation(
                0.0f, -3600.0f-pos,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f
            )
            animRotate1.duration = 2500
            animRotate1.fillAfter = true
            animSet1.addAnimation(animRotate1)

            imageView2.startAnimation(animSet1)
            Handler().postDelayed( {
                resultText.text = name!![result].toString()
                btnRotate.isEnabled = true
            }, 2500)
        }

//        戻るボタン
        btnRouletteList.setOnClickListener {
            intent = Intent(this, RouletteList::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }

    }

    //    抽選機構（裏比率を使用）
    private fun valueDrawing(a:Int, b:Int?, c:Int?, d:Int?, e:Int?, f:Int?, g:Int?, h:Int?, i:Int?, j:Int?):Int{
        val box : MutableList<Int> = mutableListOf()

        for (aa in 0 until a) box.add(0)
        if (b != null) { for (bb in 0 until b) box.add(1) }
        if (c != null) { for (cc in 0 until c) box.add(2) }
        if (d != null) { for (dd in 0 until d) box.add(3) }
        if (e != null) { for (ee in 0 until e) box.add(4) }
        if (f != null) { for (ff in 0 until f) box.add(5) }
        if (g != null) { for (gg in 0 until g) box.add(6) }
        if (h != null) { for (hh in 0 until h) box.add(7) }
        if (i != null) { for (ii in 0 until i) box.add(8) }
        if (j != null) { for (jj in 0 until j) box.add(9) }

        return box.shuffled()[0]
    }

    //    停止位置の決定（抽選結果と表比率を使用）
    private fun stopPosition(result:Int, a:Int, b:Int?, c:Int?, d:Int?, e:Int?, f:Int?, g:Int?, h:Int?, i:Int?, j:Int?):Float{
        var sum by Delegates.notNull<Float>()
        if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null) {
            sum = (a + b + c + d + e + f + g + h + i + j).toFloat()
        } else if(b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null){
            sum = (a + b + c + d + e + f + g + h + i).toFloat()
        } else if(b != null && c != null && d != null && e != null && f != null && g != null && h != null){
            sum = (a + b + c + d + e + f + g + h).toFloat()
        } else if(b != null && c != null && d != null && e != null && f != null && g != null){
            sum = (a + b + c + d + e + f + g).toFloat()
        } else if(b != null && c != null && d != null && e != null && f != null){
            sum = (a + b + c + d + e + f).toFloat()
        } else if(b != null && c != null && d != null && e != null){
            sum = (a + b + c + d + e).toFloat()
        } else if(b != null && c != null && d != null){
            sum = (a + b + c + d).toFloat()
        } else if(b != null && c != null){
            sum = (a + b + c).toFloat()
        } else if(b != null){
            sum = (a + b).toFloat()
        } else{
            sum = a.toFloat()
        }

        val a0 : Float = a/sum
        val b0 : Float? = b?.div(sum)
        val c0 : Float? = c?.div(sum)
        val d0 : Float? = d?.div(sum)
        val e0 : Float? = e?.div(sum)
        val f0 : Float? = f?.div(sum)
        val g0 : Float? = g?.div(sum)
        val h0 : Float? = h?.div(sum)
        val i0 : Float? = i?.div(sum)
        val j0 : Float? = j?.div(sum)

        val degreeList : MutableList<Float> = mutableListOf()

        degreeList.addAll(listOf(0F, a0*360))
        if(b0 != null){ degreeList.add((a0+b0)*360)}
        if(c0 != null){ degreeList.add((a0+b0!!+c0)*360)}
        if(d0 != null){ degreeList.add((a0+b0!!+c0!!+d0)*360)}
        if(e0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0)*360)}
        if(f0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0)*360)}
        if(g0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0)*360)}
        if(h0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0)*360)}
        if(i0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0)*360)}
        if(j0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0!!+j0)*360)}

        val resultDegreeList : MutableList<Float> = mutableListOf()
        val beginningDeg : Float = degreeList[result]
        val endDeg : Float = degreeList[result + 1]
        val angleTypesNumber = ((endDeg - beginningDeg)).toInt()

        for ( t in 1 until angleTypesNumber){
            resultDegreeList.add(beginningDeg + t)
        }

        return resultDegreeList.shuffled()[0]
    }

}