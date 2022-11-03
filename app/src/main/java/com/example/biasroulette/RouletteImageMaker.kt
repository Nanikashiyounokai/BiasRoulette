package com.example.biasroulette

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.os.Build
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import androidx.annotation.RequiresApi
import io.realm.Realm
import io.realm.kotlin.where
import java.io.ByteArrayOutputStream
import kotlin.properties.Delegates

class RouletteImageMaker : AppCompatActivity() {
    private lateinit var realm: Realm
    @RequiresApi(Build.VERSION_CODES.O)
    @SuppressLint("WrongThread")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        //===ここから浦部作業部分(20221103)
        // 1) xmlとの紐付け
        setContentView(R.layout.activity_edit_roulette)

        // 2) rouletteNameを遷移前「RouletteList」から引っ張ってくる。
        val In_rouletteName = intent.getStringExtra("ROULETTO_NAME")

        // 3) ルーレット名が「In_rouletteName」である項目を検索
        val comp_name_list = arrayListOf<String>() //項目名が格納されるlist
        val comp_num1_list = arrayListOf<Int>() //表比率が格納されるlist
        val comp_num2_list = arrayListOf<Int>() //裏比率が格納されるlist
        val roulettes = realm.where<Roulette>().equalTo("name", In_rouletteName).findAll()
        for (roulette in roulettes){
            val comp_name  = roulette.comp_name
            val comp_num1  = roulette.comp_num1
            val comp_num2  = roulette.comp_num2
            comp_name_list.add(comp_name)
            comp_num1_list.add(comp_num1)
            comp_num2_list.add(comp_num2)
        }

        //===

        val r1 = intent.getStringExtra("ratio1")
        val r2 = intent.getStringExtra("ratio2")
        val r3 = intent.getStringExtra("ratio3")
        val r4 = intent.getStringExtra("ratio4")
        val r5 = intent.getStringExtra("ratio5")
        val r6 = intent.getStringExtra("ratio6")
        val r7 = intent.getStringExtra("ratio7")
        val r8 = intent.getStringExtra("ratio8")
        val r9 = intent.getStringExtra("ratio9")
        val r10 = intent.getStringExtra("ratio10")


        val myView : View = MyView(this, r1!!, r2, r3, r4, r5, r6, r7, r8, r9, r10)
        setContentView(myView)

        myView.post {
            val capture : Bitmap? = getBitmapFromView(myView)

            val stream = ByteArrayOutputStream()
            capture?.compress(Bitmap.CompressFormat.PNG, 100, stream)
            val byteArray: ByteArray = stream.toByteArray()

            //Intentのインスタンスを作成
            val intent = Intent(this, PlayScreen::class.java)
            //intent変数をつなげる(第一引数はキー，第二引数は渡したい変数)
            intent.putExtra("capture",byteArray)
            //画面遷移を開始
            startActivity(intent)
        }
    }

    private fun getBitmapFromView(view: View): Bitmap? {
        val bitmap = Bitmap.createBitmap(view.width,view.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        view.draw(canvas)
        return bitmap
    }


    // Viewを継承したクラス
    internal inner class MyView(context: Context, r1: String, r2:String?, r3:String?, r4:String?, r5:String?, r6:String?, r7:String?, r8:String?, r9:String?, r10:String?) : View(context) {

        private var paint: Paint = Paint()
        private val paint1 = Paint()
        private val paint2 = Paint()
        private val paint3 = Paint()
        private val paint4 = Paint()
        private val paint5 = Paint()
        private val paint6 = Paint()
        private val paint7 = Paint()
        private val paint8 = Paint()
        private val paint9 = Paint()
        private val paint10 = Paint()
        private var sum by Delegates.notNull<Float>()

        private val rr1 = r1.toFloat()
        private val rr2 = r2?.toFloat()
        private val rr3 = r3?.toFloat()
        private val rr4 = r4?.toFloat()
        private val rr5 = r5?.toFloat()
        private val rr6 = r6?.toFloat()
        private val rr7 = r7?.toFloat()
        private val rr8 = r8?.toFloat()
        private val rr9 = r9?.toFloat()
        private val rr10 = r10?.toFloat()

        @SuppressLint("DrawAllocation")
        override fun onDraw(canvas: Canvas){
            // 背景、半透明
            canvas.drawColor(Color.argb(0, 0, 0, 0))

            // 円
            paint.color = Color.argb(255, 0, 0, 0)
            paint.strokeWidth = 5f
            paint.isAntiAlias = true
            paint.style = Paint.Style.STROKE

            // 分岐
            if (height >= width) {
                // 円
                // (x1,y1,r,paint) 中心x1座標, 中心y1座標, r半径
                canvas.drawCircle((width / 2).toFloat(), (height / 2).toFloat(), (width / 2.5).toFloat(), paint)
                // 各項目
                val rect = RectF((width / 10).toFloat(), (height / 2 - 2 * width / 5).toFloat(), (9 * width / 10).toFloat(), (height / 2 + 2 * width / 5).toFloat())
                itemRation(canvas,rect, rr1,rr2,rr3,rr4,rr5,rr6,rr7,rr8,rr9,rr10)

            } else {
                // 円
                canvas.drawCircle((width / 2).toFloat(), (height / 2).toFloat(), (height / 2.5).toFloat(), paint)
                //　各項目
                val rect = RectF((width / 2 - 2 * height / 5).toFloat(), (height / 10).toFloat(), (width / 2 + 2 * height / 5).toFloat(), (9 * height / 10).toFloat())
                itemRation(canvas,rect, rr1,rr2,rr3,rr4,rr5,rr6,rr7,rr8,rr9,rr10)
            }

        }

        private fun itemRation(canvas: Canvas, rect: RectF, a:Float, b:Float?, c:Float?, d:Float?, e:Float?, f:Float?, g:Float?, h:Float?, i:Float?, j:Float?){
            if (b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null && j != null) {
                sum = a + b + c + d + e + f + g + h + i + j
            } else if(b != null && c != null && d != null && e != null && f != null && g != null && h != null && i != null){
                sum = a + b + c + d + e + f + g + h + i
            } else if(b != null && c != null && d != null && e != null && f != null && g != null && h != null){
                sum = a + b + c + d + e + f + g + h
            } else if(b != null && c != null && d != null && e != null && f != null && g != null){
                sum = a + b + c + d + e + f + g
            } else if(b != null && c != null && d != null && e != null && f != null){
                sum = a + b + c + d + e + f
            } else if(b != null && c != null && d != null && e != null){
                sum = a + b + c + d + e
            } else if(b != null && c != null && d != null){
                sum = a + b + c + d
            } else if(b != null && c != null){
                sum = a + b + c
            } else if(b != null){
                sum = a + b
            } else{
                sum = a
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

            paint1.color = Color.argb(195, 233, 58, 36)
            canvas.drawArc(rect, -90F, a0*360, true, paint1)
            paint2.color = Color.argb(195, 234, 97, 25)
            if (b0 != null) {
                canvas.drawArc(rect, -90F+a0*360, b0*360, true, paint2)
            }
            paint3.color = Color.argb(195, 252, 202, 0)
            if (c0 != null) {
                canvas.drawArc(rect, -90F+(a0+ b0!!)*360, c0*360, true, paint3)
            }
            paint4.color = Color.argb(195, 184, 198, 1)
            if (d0 != null) {
                canvas.drawArc(rect, -90F+(a0+ b0!!+ c0!!)*360, d0*360, true, paint4)
            }
            paint5.color = Color.argb(195, 58, 149, 42)
            if (e0 != null) {
                canvas.drawArc(rect, -90F+(a0+ b0!!+ c0!!+ d0!!)*360, e0*360, true, paint5)
            }
            paint6.color = Color.argb(195, 10, 151, 114)
            if (f0 != null) {
                canvas.drawArc(rect, -90F+(a0+ b0!!+ c0!!+ d0!!+ e0!!)*360, f0*360, true, paint6)
            }
            paint7.color = Color.argb(195, 24, 158, 151)
            if (g0 != null) {
                canvas.drawArc(rect, -90F+(a0+ b0!!+ c0!!+ d0!!+ e0!!+ f0!!)*360, g0*360, true, paint7)
            }
            paint8.color = Color.argb(195, 89, 113, 157)
            if (h0 != null) {
                canvas.drawArc(rect, -90F+(a0+ b0!!+ c0!!+ d0!!+ e0!!+ f0!!+ g0!!)*360, h0*360, true, paint8)
            }
            paint9.color = Color.argb(195, 104, 68, 126)
            if (i0 != null) {
                canvas.drawArc(rect, -90F+(a0+ b0!!+ c0!!+ d0!!+ e0!!+ f0!!+ g0!!+ h0!!)*360, i0*360, true, paint9)
            }
            paint10.color = Color.argb(195, 224, 61, 114)
            if (j0 != null) {
                canvas.drawArc(rect, -90F+(a0+ b0!!+ c0!!+ d0!!+ e0!!+ f0!!+ g0!!+ h0!!+ i0!!)*360, j0*360, true, paint10)
            }
        }


    }
}