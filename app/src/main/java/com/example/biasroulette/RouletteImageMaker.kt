package com.example.biasroulette

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import io.realm.Realm
import io.realm.kotlin.where
import java.io.ByteArrayOutputStream
import java.lang.Math.PI
import kotlin.properties.Delegates


class RouletteImageMaker : AppCompatActivity() {
    private lateinit var realm: Realm
    @RequiresApi(Build.VERSION_CODES.O)
    @SuppressLint("WrongThread")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        //===ここから浦部作業部分(20221103)
        // 2) rouletteNameを遷移前「RouletteList」から引っ張ってくる。
        val In_rouletteName = intent.getStringExtra("ROULETTE_NAME")

        // 3) ルーレット名が「In_rouletteName」である項目を検索
        realm = Realm.getDefaultInstance()
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

        val size = comp_num1_list.size
        if(size != 20){
           for (i in 0..20-size){
               comp_name_list.add("null")
               comp_num1_list.add(0)
               comp_num2_list.add(0)
           }
        }

        val myView : View = MyView(this, comp_num1_list, comp_name_list,size)
        setContentView(myView)

        myView.post {
            val capture : Bitmap = getBitmapFromView(myView)

            val stream = ByteArrayOutputStream()
            capture.compress(Bitmap.CompressFormat.PNG, 100, stream)
            val byteArray: ByteArray = stream.toByteArray()

            //Intentのインスタンスを作成
            val intent = Intent(this, PlayScreen::class.java)
            //intent変数をつなげる(第一引数はキー，第二引数は渡したい変数)
            intent.putExtra("capture",byteArray)
            intent.putExtra("ROULETTE_NAME", In_rouletteName)
            intent.putExtra("name",comp_name_list)
            intent.putExtra("num1",comp_num1_list)
            intent.putExtra("num2",comp_num2_list)

            //画面遷移を開始
            startActivity(intent)
            finish()
        }
    }

    private fun getBitmapFromView(view: View): Bitmap {
        val bitmap1 = Bitmap.createBitmap(view.width,view.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap1)
        view.draw(canvas)
        return bitmap1
    }

    // Viewを継承したクラス
    internal inner class MyView(context: Context,
                                private val num1List: ArrayList<Int>,
                                private val nameList:ArrayList<String>,
                                private val size:Int) : View(context) {

        private var paint = Paint()
        private val paint1 = Paint()
        private val paint2 = Paint()

        private var sum by Delegates.notNull<Float>()


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
                // 各項目のグラフ
                val rect = RectF((width / 10).toFloat(), (height / 2 - 2 * width / 5).toFloat(), (9 * width / 10).toFloat(), (height / 2 + 2 * width / 5).toFloat())
                itemRation(canvas,rect, num1List)
                enterItemName(canvas, num1List, nameList,size)
            } else {
                // 円
                canvas.drawCircle((width / 2).toFloat(), (height / 2).toFloat(), (height / 2.5).toFloat(), paint)
                //　各項目のグラフ
                val rect = RectF((width / 2 - 2 * height / 5).toFloat(), (height / 10).toFloat(), (width / 2 + 2 * height / 5).toFloat(), (9 * height / 10).toFloat())
                itemRation(canvas,rect, num1List)
                enterItemName(canvas, num1List, nameList,size)
            }
        }

        private fun itemRation(canvas: Canvas, rect: RectF, num1List: ArrayList<Int>){
            sum = num1List.sum().toFloat()
            val a0 : Float = num1List[0].toFloat()/sum
            val b0 : Float = num1List[1].toFloat()/sum
            val c0 : Float = num1List[2].toFloat()/sum
            val d0 : Float = num1List[3].toFloat()/sum
            val e0 : Float = num1List[4].toFloat()/sum
            val f0 : Float = num1List[5].toFloat()/sum
            val g0 : Float = num1List[6].toFloat()/sum
            val h0 : Float = num1List[7].toFloat()/sum
            val i0 : Float = num1List[8].toFloat()/sum
            val j0 : Float = num1List[9].toFloat()/sum
            val k0 : Float = num1List[10].toFloat()/sum
            val l0 : Float = num1List[11].toFloat()/sum
            val m0 : Float = num1List[12].toFloat()/sum
            val n0 : Float = num1List[13].toFloat()/sum
            val o0 : Float = num1List[14].toFloat()/sum
            val p0 : Float = num1List[15].toFloat()/sum
            val q0 : Float = num1List[16].toFloat()/sum
            val r0 : Float = num1List[17].toFloat()/sum
            val s0 : Float = num1List[18].toFloat()/sum
            val t0 : Float = num1List[19].toFloat()/sum


            paint1.color = Color.argb(195, 233, 58, 36)
            canvas.drawArc(rect, -90F, a0*360, true, paint1)
            paint1.color = Color.argb(195, 234, 97, 25)
            canvas.drawArc(rect, -90F+a0*360, b0*360, true, paint1)
            paint1.color = Color.argb(195, 252, 202, 0)
            canvas.drawArc(rect, -90F+(a0+ b0)*360, c0*360, true, paint1)
            paint1.color = Color.argb(195, 184, 198, 1)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0)*360, d0*360, true, paint1)
            paint1.color = Color.argb(195, 58, 149, 42)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0)*360, e0*360, true, paint1)
            paint1.color = Color.argb(195, 10, 151, 114)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0)*360, f0*360, true, paint1)
            paint1.color = Color.argb(195, 24, 158, 151)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0)*360, g0*360, true, paint1)
            paint1.color = Color.argb(195, 89, 113, 157)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0)*360, h0*360, true, paint1)
            paint1.color = Color.argb(195, 104, 68, 126)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0)*360, i0*360, true, paint1)
            paint1.color = Color.argb(195, 224, 61, 114)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0+ i0)*360, j0*360, true, paint1)
            paint1.color = Color.argb(195, 233, 58, 36)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0+ i0 + j0)*360, k0*360, true, paint1)
            paint1.color = Color.argb(195, 234, 97, 25)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0+ i0 + j0 + k0)*360, l0*360, true, paint1)
            paint1.color = Color.argb(195, 252, 202, 0)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0+ i0 + j0 + k0 + l0)*360, m0*360, true, paint1)
            paint1.color = Color.argb(195, 184, 198, 1)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0+ i0 + j0 + k0 + l0 + m0)*360, n0*360, true, paint1)
            paint1.color = Color.argb(195, 58, 149, 42)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0+ i0 + j0 + k0 + l0 + m0 + n0)*360, o0*360, true, paint1)
            paint1.color = Color.argb(195, 10, 151, 114)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0+ i0 + j0 + k0 + l0 + m0 + n0 + o0)*360, p0*360, true, paint1)
            paint1.color = Color.argb(195, 24, 158, 151)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0+ i0 + j0 + k0 + l0 + m0 + n0 + o0 + p0)*360, q0*360, true, paint1)
            paint1.color = Color.argb(195, 89, 113, 157)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0+ i0 + j0 + k0 + l0 + m0 + n0 + o0 + p0 + q0)*360, r0*360, true, paint1)
            paint1.color = Color.argb(195, 104, 68, 126)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0+ i0 + j0 + k0 + l0 + m0 + n0 + o0 + p0 + q0 + r0)*360, s0*360, true, paint1)
            paint1.color = Color.argb(195, 224, 61, 114)
            canvas.drawArc(rect, -90F+(a0+ b0+ c0+ d0+ e0+ f0+ g0+ h0+ i0 + j0 + k0 + l0 + m0 + n0 + o0 + p0 + q0 + r0 + s0)*360, t0*360, true, paint1)

        }

        private fun enterItemName(canvas: Canvas, num1List: ArrayList<Int>, nameList: ArrayList<String>,size: Int){
            sum = num1List.sum().toFloat()
            val a0 : Float = 360 * num1List[0].toFloat()/sum
            val b0 : Float = 360 * num1List[1].toFloat()/sum + a0
            val c0 : Float = 360 * num1List[2].toFloat()/sum + b0
            val d0 : Float = 360 * num1List[3].toFloat()/sum + c0
            val e0 : Float = 360 * num1List[4].toFloat()/sum + d0
            val f0 : Float = 360 * num1List[5].toFloat()/sum + e0
            val g0 : Float = 360 * num1List[6].toFloat()/sum + f0
            val h0 : Float = 360 * num1List[7].toFloat()/sum + g0
            val i0 : Float = 360 * num1List[8].toFloat()/sum + h0
            val j0 : Float = 360 * num1List[9].toFloat()/sum + i0
            val k0 : Float = 360 * num1List[10].toFloat()/sum + j0
            val l0 : Float = 360 * num1List[11].toFloat()/sum + k0
            val m0 : Float = 360 * num1List[12].toFloat()/sum + l0
            val n0 : Float = 360 * num1List[13].toFloat()/sum + m0
            val o0 : Float = 360 * num1List[14].toFloat()/sum + n0
            val p0 : Float = 360 * num1List[15].toFloat()/sum + o0
            val q0 : Float = 360 * num1List[16].toFloat()/sum + p0
            val r0 : Float = 360 * num1List[17].toFloat()/sum + q0
            val s0 : Float = 360 * num1List[18].toFloat()/sum + r0
            val t0 : Float = 360 * num1List[19].toFloat()/sum + s0

            val degreeList = arrayListOf<Float>()
            degreeList.addAll(listOf(0F,a0,b0,c0,d0,e0,f0,g0,h0,i0,j0,k0,l0,m0,n0,o0,p0,q0,r0,s0,t0))

            paint2.style = Paint.Style.FILL_AND_STROKE
            paint2.strokeWidth = 2F
            paint2.textSize = 50F
            paint2.color = Color.argb(255, 0, 0, 0)

            for (i in 0 until size){
                val character = nameList[i]
                val metrics: Paint.FontMetrics = paint2.fontMetrics //FontMetricsを取得
                val textWidth = paint2.measureText(character)
                val degree = -180-(degreeList[i] + degreeList[i+1])/2
                if (degree <= 360){
                    canvas.drawText(character,
                        (width/2).toFloat() - (textWidth / 2) + 200f * kotlin.math.sin(PI * degree / 180).toFloat(),
                        (height/2).toFloat() - (metrics.ascent + metrics.descent) / 2 + 200f * kotlin.math.cos(PI * degree/ 180).toFloat(),
                        paint2)
                }
            }

        }


    }
}