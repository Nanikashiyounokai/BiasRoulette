package com.example.biasroulette

import android.annotation.SuppressLint
import android.content.Context
import android.content.DialogInterface
import android.content.Intent
import android.graphics.Color
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.core.view.marginLeft
import androidx.core.view.marginStart
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds
import io.realm.Realm
import io.realm.kotlin.createObject
import io.realm.kotlin.where

class NewRoulette : AppCompatActivity() {
    //追加リストと、RcyclerViewと、アダプターを用意
    private var addList = ArrayList<CompData>() //空のリストを用意<型はデータクラス>
    private var addList2 = ArrayList<CompData2_2>()
    private lateinit var recyclerView: RecyclerView

    private lateinit var realm: Realm

    @SuppressLint("WrongViewCast")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_new_roulette)

        realm = Realm.getDefaultInstance()

        val ad_comp_btn = findViewById<Button>(R.id.ad_comp_btn)
        val ura_btn = findViewById<Button>(R.id.ura_btn)
        val comp_rv = findViewById<RecyclerView>(R.id.comp_rv)
        val finish_btn = findViewById<Button>(R.id.finish_btn)
        val comp_name_et :EditText = findViewById(R.id.comp_name_et)
        val comp_num1_et :EditText = findViewById(R.id.comp_num1_et)
        val comp_num2_et :EditText = findViewById(R.id.comp_num2_et)
        val tv_ratio: TextView = findViewById(R.id.tv_ratio)
        val tv_ura_ratio: TextView = findViewById(R.id.tv_ura_ratio)

        // 「比率」「裏比率」textviewの初期位置を設定
        tv_ratio.layoutParams.width = 320
        tv_ura_ratio.visibility = View.GONE

        // 「項目入力」edit textの非表示(初期設定)
        comp_num2_et.visibility = View.GONE
        comp_num1_et.layoutParams.width = dpTopx(116).toInt()

        // viewの取得、アダプターにセット
        recyclerView = findViewById(R.id.comp_rv)
        var recyclerAdapter = CompDateAdapter2(addList2, addList)
        recyclerView.adapter = recyclerAdapter
        recyclerView.layoutManager = LinearLayoutManager(this)

        var n = 0 //「n=0」：表設定のみ表示、「n=1」:裏設定も表示
        //裏ボタンクリック時の処理
        ura_btn.setOnClickListener{
           if (n == 0) {
               n = 1
               var recyclerAdapter = CompDateAdapter(addList, addList2)
               recyclerView.adapter = recyclerAdapter
               recyclerView.layoutManager = LinearLayoutManager(this)
               recyclerAdapter.notifyItemInserted(addList.lastIndex)

               tv_ratio.layoutParams.width = 150
               tv_ura_ratio.visibility = View.VISIBLE

               comp_num2_et.visibility = View.VISIBLE
               comp_num1_et.layoutParams.width = dpTopx(50).toInt()

            } else {
                n = 0
               var recyclerAdapter = CompDateAdapter2(addList2, addList)
               recyclerView.adapter = recyclerAdapter
               recyclerView.layoutManager = LinearLayoutManager(this)
               recyclerAdapter.notifyItemInserted(addList2.lastIndex)

               tv_ratio.layoutParams.width = 320
               tv_ura_ratio.visibility = View.GONE

               comp_num2_et.visibility = View.GONE
               comp_num1_et.layoutParams.width = dpTopx(116).toInt()
            }
        }

        // 項目追加ボタンクリック時の処理
        ad_comp_btn.setOnClickListener{

            if(n==0){
                if (comp_name_et.text.toString() == "" ||
                    comp_num1_et.text.toString() == ""){
                    AlertDialog.Builder(this)
                        .setTitle("ERROR!!")
                        .setMessage("全ての項目を入力して下さい")
                        .setPositiveButton("OK",null)
                        .show()
                }else{
                    val data = CompData(comp_name_et.text.toString(),
                        comp_num1_et.text.toString(),
                        comp_num1_et.text.toString())
                    addList.add(data)

                    val data2 = CompData2_2(comp_name_et.text.toString(),
                        comp_num1_et.text.toString())
                    addList2.add(data2)

                    var recyclerAdapter = CompDateAdapter2(addList2, addList)
                    recyclerView.adapter = recyclerAdapter
                    recyclerView.layoutManager = LinearLayoutManager(this)
                    recyclerAdapter.notifyItemInserted(addList2.lastIndex) //表示を更新(リストの最後に挿入)
                }

            }else{
                if (comp_name_et.text.toString() == "" ||
                    comp_num1_et.text.toString() == "" ||
                    comp_num2_et.text.toString() == ""){
                    AlertDialog.Builder(this)
                        .setTitle("ERROR!!")
                        .setMessage("全ての項目を入力してください")
                        .setPositiveButton("OK",null)
                        .show()
                }else{
                    val data = CompData(comp_name_et.text.toString(),
                        comp_num1_et.text.toString(),
                        comp_num2_et.text.toString())
                    addList.add(data)

                    val data2 = CompData2_2(comp_name_et.text.toString(),
                        comp_num1_et.text.toString())

                    addList2.add(data2)

                    var recyclerAdapter = CompDateAdapter(addList, addList2)
                    recyclerView.adapter = recyclerAdapter
                    recyclerView.layoutManager = LinearLayoutManager(this)
                    recyclerAdapter.notifyItemInserted(addList.lastIndex) //表示を更新(リストの最後に挿入)
                }
            }

            comp_name_et.text = null
            comp_num1_et.text = null
            comp_num2_et.text = null

        }

        // 完成ボタンクリック時の処理
        finish_btn.setOnClickListener {
            val roulette_name_et = findViewById<EditText>(R.id.roulette_name_et)
            var comp_count = addList.size
            //ルーレットの名前被りをなくすために、DBから全てのルーレット名を検索
            val roulettes = realm.where<RouletteName>().findAll()
            var roulette_names = ArrayList<String>()
            for (roulette in roulettes){
                roulette_names.add(roulette.name)
            }

            if(roulette_name_et.text.toString() == ""){

                val alertDialog1 = AlertDialog.Builder(this)
                    .setTitle("ERROR!!")
                    .setMessage("ルーレット名を入力してください")
                    .setPositiveButton("OK",null)
                    .show()
                // OKボタンのインスタンスを取得する
                val positiveButton = alertDialog1.getButton(DialogInterface.BUTTON_POSITIVE)
                // OKボタンの色を変更する
                positiveButton.setTextColor(Color.BLACK)

            }else if(roulette_name_et.text.toString() in roulette_names) {

                AlertDialog.Builder(this)
                    .setTitle("ERROR!!")
                    .setMessage("そのルーレットの名前はすでに使われています")
                    .setPositiveButton("OK",null)
                    .show()

            }else if(comp_count == 0) {

               AlertDialog.Builder(this)
                    .setTitle("ERROR!!")
                    .setMessage("項目を最低1つ追加してください")
                    .setPositiveButton("OK", null)
                    .show()

            }else{
                //RouletteNameの保存
                realm.executeTransaction {
                    //                db: Realm ->
                    val maxId = realm.where<RouletteName>().max("id")
                    val nextId = (maxId?.toLong() ?: 0L) + 1L
                    val roulette_name = realm.createObject<RouletteName>(nextId)
                    roulette_name.name = roulette_name_et.text.toString()
                }

                //Rouletteの保存
                for (data in addList) {
                    realm.executeTransaction {
                        //                db: Realm ->
                        val maxId = realm.where<Roulette>().max("id")
                        val nextId = (maxId?.toLong() ?: 0L) + 1L
                        val roulette = realm.createObject<Roulette>(nextId)
                        roulette.name = roulette_name_et.text.toString()
                        roulette.comp_name = data.comp_name
                        roulette.comp_num1 = data.comp_num1.toInt()
                        roulette.comp_num2 = data.comp_num2.toInt()
                    }
                }

                //top画面に戻る
                AlertDialog.Builder(this)
                    .setTitle("ルーレット完成")
                    .setMessage("ルーレットが完成しました")
                    .setPositiveButton("ホームに戻る") { _, _ ->
                        val intent = Intent(this, MainActivity::class.java)
                        startActivity(intent)
                        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                        finish()
                    }
                    .show()
            }
        }

        //広告の表示
        MobileAds.initialize(this) {}
        val adView = findViewById<AdView>(R.id.adView)
        val adRequest = AdRequest.Builder().build()
        adView.loadAd(adRequest)
    }

    private fun dpTopx(dp: Int): Float {
        val metrics = getResources().getDisplayMetrics()
        return dp * metrics.density
    }


    override fun onDestroy() {
        super.onDestroy()
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}

