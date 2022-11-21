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
        val adView1 = findViewById<AdView>(R.id.adView1play)
        val adRequest1 = AdRequest.Builder().build()
        adView1.loadAd(adRequest1)
        val adView2 = findViewById<AdView>(R.id.adView2play)
        val adRequest2 = AdRequest.Builder().build()
        adView2.loadAd(adRequest2)

//        止まるボタンの無効化
        btnStop.isEnabled = false
        resultText.text = ""

//        回すボタン
        btnRotate.setOnClickListener {
            resultText.text = "抽選中"

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

            val result = valueDrawing(num2!![0],num2[1],num2[2],num2[3],num2[4],num2[5],num2[6],num2[7],num2[8],num2[9],num2[10],num2[11],num2[12],num2[13],num2[14],num2[15],num2[16],num2[17],num2[18],num2[19])
            val pos = stopPosition(result, num1!![0],num1[1],num1[2],num1[3],num1[4],num1[5],num1[6],num1[7],num1[8],num1[9],num2[10],num2[11],num2[12],num2[13],num2[14],num2[15],num2[16],num2[17],num2[18],num2[19])
            //        停止回転系
            val animSet1 = AnimationSet(true)
            animSet1.interpolator = DecelerateInterpolator()
            animSet1.fillAfter = true
            animSet1.isFillEnabled = true
            val animRotate1 = RotateAnimation(
                0.0f, -7200.0f-pos,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f
            )
            animRotate1.duration = 5000
            animRotate1.fillAfter = true
            animSet1.addAnimation(animRotate1)

            imageView2.startAnimation(animSet1)
            Handler().postDelayed( {
                resultText.text = name!![result].toString()
                btnRotate.isEnabled = true
            }, 5000)
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
    private fun valueDrawing(a:Int, b:Int?, c:Int?, d:Int?, e:Int?, f:Int?, g:Int?, h:Int?, i:Int?, j:Int?, k:Int?, l:Int?, m:Int?, n:Int?, o:Int?, p:Int?, q:Int?, r:Int?, s:Int?, t:Int?):Int{
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
        if (k != null) { for (kk in 0 until k) box.add(10) }
        if (l != null) { for (ll in 0 until l) box.add(11) }
        if (m != null) { for (mm in 0 until m) box.add(12) }
        if (n != null) { for (nn in 0 until n) box.add(13) }
        if (o != null) { for (oo in 0 until o) box.add(14) }
        if (p != null) { for (pp in 0 until p) box.add(15) }
        if (q != null) { for (qq in 0 until q) box.add(16) }
        if (r != null) { for (rr in 0 until r) box.add(17) }
        if (s != null) { for (ss in 0 until s) box.add(18) }
        if (t != null) { for (tt in 0 until t) box.add(19) }

        return box.shuffled()[0]
    }

    //    停止位置の決定（抽選結果と表比率を使用）
    private fun stopPosition(result:Int, a:Int, b:Int?, c:Int?, d:Int?, e:Int?, f:Int?, g:Int?, h:Int?, i:Int?, j:Int?, k:Int?, l:Int?, m:Int?, n:Int?, o:Int?, p:Int?, q:Int?, r:Int?, s:Int?, t:Int?):Float{
        var sum by Delegates.notNull<Float>()
        if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null && k != null && l != null && m != null && n != null && o != null && p != null && q != null && r != null && s != null && t != null) {
            sum = (a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r + s + t).toFloat()
        } else if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null && k != null && l != null && m != null && n != null && o != null && p != null && q != null && r != null && s != null) {
            sum = (a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r + s).toFloat()
        } else if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null && k != null && l != null && m != null && n != null && o != null && p != null && q != null && r != null) {
            sum = (a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r).toFloat()
        } else if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null && k != null && l != null && m != null && n != null && o != null && p != null && q != null) {
            sum = (a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q).toFloat()
        } else if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null && k != null && l != null && m != null && n != null && o != null && p != null) {
            sum = (a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p).toFloat()
        } else if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null && k != null && l != null && m != null && n != null && o != null) {
            sum = (a + b + c + d + e + f + g + h + i + j + k + l + m + n + o).toFloat()
        } else if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null && k != null && l != null && m != null && n != null) {
            sum = (a + b + c + d + e + f + g + h + i + j + k + l + m + n).toFloat()
        } else if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null && k != null && l != null && m != null) {
            sum = (a + b + c + d + e + f + g + h + i + j + k + l + m).toFloat()
        } else if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null && k != null && l != null) {
            sum = (a + b + c + d + e + f + g + h + i + j + k + l).toFloat()
        } else if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null && k != null) {
            sum = (a + b + c + d + e + f + g + h + i + j + k).toFloat()
        } else if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null) {
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
        val k0 : Float? = k?.div(sum)
        val l0 : Float? = l?.div(sum)
        val m0 : Float? = m?.div(sum)
        val n0 : Float? = n?.div(sum)
        val o0 : Float? = o?.div(sum)
        val p0 : Float? = p?.div(sum)
        val q0 : Float? = q?.div(sum)
        val r0 : Float? = r?.div(sum)
        val s0 : Float? = s?.div(sum)
        val t0 : Float? = t?.div(sum)

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
        if(k0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0!!+j0!!+k0)*360)}
        if(l0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0!!+j0!!+k0!!+l0)*360)}
        if(m0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0!!+j0!!+k0!!+l0!!+m0)*360)}
        if(n0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0!!+j0!!+k0!!+l0!!+m0!!+n0)*360)}
        if(o0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0!!+j0!!+k0!!+l0!!+m0!!+n0!!+o0)*360)}
        if(p0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0!!+j0!!+k0!!+l0!!+m0!!+n0!!+o0!!+p0)*360)}
        if(q0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0!!+j0!!+k0!!+l0!!+m0!!+n0!!+o0!!+p0!!+q0)*360)}
        if(r0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0!!+j0!!+k0!!+l0!!+m0!!+n0!!+o0!!+p0!!+q0!!+r0)*360)}
        if(s0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0!!+j0!!+k0!!+l0!!+m0!!+n0!!+o0!!+p0!!+q0!!+r0!!+s0)*360)}
        if(t0 != null){ degreeList.add((a0+b0!!+c0!!+d0!!+e0!!+f0!!+g0!!+h0!!+i0!!+j0!!+k0!!+l0!!+m0!!+n0!!+o0!!+p0!!+q0!!+r0!!+s0!!+t0)*360)}

        val resultDegreeList : MutableList<Float> = mutableListOf()
        val beginningDeg : Float = degreeList[result]
        val endDeg : Float = degreeList[result + 1]
        val angleTypesNumber = ((endDeg - beginningDeg)).toInt()

        for ( tt in 1 until angleTypesNumber){
            resultDegreeList.add(beginningDeg + tt)
        }

        return resultDegreeList.shuffled()[0]
    }


}