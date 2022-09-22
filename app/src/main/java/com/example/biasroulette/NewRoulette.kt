package com.example.biasroulette

import android.annotation.SuppressLint
import android.graphics.Color
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import androidx.core.view.get
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
    private lateinit var recyclerView: RecyclerView
    private var recyclerAdapter = CompDateAdapter(addList)

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

        // viewの取得、アダプターにセット
        recyclerView = findViewById(R.id.comp_rv)
        recyclerView.adapter = recyclerAdapter
        recyclerView.layoutManager = LinearLayoutManager(this)


        // 項目追加ボタンクリック時の処理
        ad_comp_btn.setOnClickListener{
            val comp_name_et :EditText = findViewById(R.id.comp_name_et)
            val comp_num1_et :EditText = findViewById(R.id.comp_num1_et)
            val comp_num2_et :EditText = findViewById(R.id.comp_num2_et)
            val data = CompData(comp_name_et.text.toString(),
                                comp_num1_et.text.toString(),
                                comp_num2_et.text.toString())
            addList.add(data)
            recyclerAdapter.notifyItemInserted(addList.lastIndex) //表示を更新(リストの最後に挿入)

            comp_name_et.text = null
            comp_num1_et.text = null
            comp_num2_et.text = null
        }

        // 完成ボタンクリック時の処理
        finish_btn.setOnClickListener {
            val roulette_name_et = findViewById<EditText>(R.id.roulette_name_et)
            var comp_count = addList.size
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
        }

        //裏ボタンクリック時の処理
//        ura_btn.setOnClickListener{
//            if (comp_rv.getChildItemId().) {
//                ura_btn.setTextColor(Color.parseColor("#F4A460"))
//            }
//            else{
//                ura_btn.setTextColor(Color.parseColor("#000000"))
//            }
//        }

        //広告の表示
        MobileAds.initialize(this) {}
        val adView = findViewById<AdView>(R.id.adView)
        val adRequest = AdRequest.Builder().build()
        adView.loadAd(adRequest)
    }


    override fun onDestroy() {
        super.onDestroy()
        realm.close()
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}

