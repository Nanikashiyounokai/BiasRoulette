package com.example.biasroulette

import android.content.DialogInterface
import android.content.Intent
import android.graphics.Color
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds
import io.realm.Realm
import io.realm.kotlin.createObject
import io.realm.kotlin.where

class EditRouletteActivity : AppCompatActivity() {

    private lateinit var realm: Realm

    private var addList = ArrayList<CompData>() //空のリストを用意<型はデータクラス>
    private var addList2 = ArrayList<CompData2_2>()
    private lateinit var recyclerView: RecyclerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        realm = Realm.getDefaultInstance()
        setContentView(R.layout.activity_edit_roulette)

        val roulette_name = intent.getStringExtra("ROULETTE_NAME")
        val EDroulette_name_et: EditText = findViewById(R.id.EDroulette_name_et)
        val EDcomp_name_et :EditText = findViewById(R.id.EDcomp_name_et)
        val EDcomp_num1_et :EditText = findViewById(R.id.EDcomp_num1_et)
        val EDcomp_num2_et :EditText = findViewById(R.id.EDcomp_num2_et)
        val EDad_comp_btn: Button = findViewById(R.id.EDad_comp_btn)
        val EDupdate_btn: Button = findViewById(R.id.EDupdate_btn)
        val EDura_btn: ImageButton = findViewById(R.id.EDura_btn)
        val EDtv_ratio: TextView = findViewById(R.id.EDtv_ratio)
        val EDtv_ura_ratio: TextView = findViewById(R.id.EDtv_ura_ratio)

        // 「比率」「裏比率」textviewの初期位置を設定
        EDtv_ratio.layoutParams.width = 320
        EDtv_ura_ratio.visibility = View.GONE

        // 「項目入力」edit textの非表示(初期設定)
        EDcomp_num2_et.visibility = View.GONE
        EDcomp_num1_et.layoutParams.width = dpTopx(116).toInt()

        EDroulette_name_et.setText(roulette_name)

        //RecyclerViewにアダプターとレイアウトマネージャーを設定する
        recyclerView = findViewById(R.id.EDcomp_rv)
        var recyclerAdapter = CompDateAdapter2(addList2, addList)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = recyclerAdapter

        val roulettes = realm.where<Roulette>().equalTo("name", roulette_name).findAll()
        for (roulette in roulettes){
            val comp_name  = roulette.comp_name
            val comp_num1  = roulette.comp_num1
            val comp_num2  = roulette.comp_num2
            val data = CompData(comp_name, comp_num1.toString(), comp_num2.toString())
            val data2 = CompData2_2(comp_name, comp_num1.toString())
            addList.add(data)
            addList2.add(data2)
            recyclerAdapter.notifyItemInserted(addList2.lastIndex) //表示を更新(リストの最後に挿入)
        }

        var n = 0 //「n=0」：表設定のみ表示、「n=1」:裏設定も表示
        //裏ボタンクリック時の処理
        EDura_btn.setOnClickListener{
            if (n == 0) {
                n = 1
                var recyclerAdapter = CompDateAdapter(addList, addList2)
                recyclerView.adapter = recyclerAdapter
                recyclerView.layoutManager = LinearLayoutManager(this)
                recyclerAdapter.notifyItemInserted(addList.lastIndex)

                EDtv_ratio.layoutParams.width = 150
                EDtv_ura_ratio.visibility = View.VISIBLE

                EDcomp_num2_et.visibility = View.VISIBLE
                EDcomp_num1_et.layoutParams.width = dpTopx(50).toInt()

                EDura_btn.setBackgroundResource(R.drawable.key_open)

            } else {
                n = 0
                var recyclerAdapter = CompDateAdapter2(addList2, addList)
                recyclerView.adapter = recyclerAdapter
                recyclerView.layoutManager = LinearLayoutManager(this)
                recyclerAdapter.notifyItemInserted(addList2.lastIndex)

                EDtv_ratio.layoutParams.width = 320
                EDtv_ura_ratio.visibility = View.GONE

                EDcomp_num2_et.visibility = View.GONE
                EDcomp_num1_et.layoutParams.width = dpTopx(116).toInt()

                EDura_btn.setBackgroundResource(R.drawable.key_close)
            }
        }

        //追加ボタンを押したときの処理
        EDad_comp_btn.setOnClickListener{

            if(n==0){
                if (EDcomp_name_et.text.toString() == "" ||
                    EDcomp_num1_et.text.toString() == ""){
                    AlertDialog.Builder(this)
                        .setTitle("ERROR!!")
                        .setMessage("全ての項目を入力して下さい")
                        .setPositiveButton("OK",null)
                        .show()
                }else if (EDcomp_num1_et.text.toString().toInt() == 0 ||
                EDcomp_num1_et.text.toString().toInt() > 100) {
                AlertDialog.Builder(this)
                    .setTitle("ERROR!!")
                    .setMessage("比率は1から100の整数で入力してください")
                    .setPositiveButton("OK",null)
                    .show()
                }else{
                    val data = CompData(EDcomp_name_et.text.toString(),
                        EDcomp_num1_et.text.toString(),
                        EDcomp_num1_et.text.toString())
                    addList.add(data)

                    val data2 = CompData2_2(EDcomp_name_et.text.toString(),
                        EDcomp_num1_et.text.toString())
                    addList2.add(data2)

                    var recyclerAdapter = CompDateAdapter2(addList2, addList)
                    recyclerView.adapter = recyclerAdapter
                    recyclerView.layoutManager = LinearLayoutManager(this)
                    recyclerAdapter.notifyItemInserted(addList2.lastIndex) //表示を更新(リストの最後に挿入)
                }

            }else{
                if (EDcomp_name_et.text.toString() == "" ||
                    EDcomp_num1_et.text.toString() == "" ||
                    EDcomp_num2_et.text.toString() == ""){
                    AlertDialog.Builder(this)
                        .setTitle("ERROR!!")
                        .setMessage("全ての項目を入力してください")
                        .setPositiveButton("OK",null)
                        .show()
                } else if (EDcomp_num1_et.text.toString().toInt() == 0 ||
                        EDcomp_num1_et.text.toString().toInt() > 100 ||
                        EDcomp_num2_et.text.toString().toInt() == 0 ||
                        EDcomp_num2_et.text.toString().toInt() > 100
                ) {
                AlertDialog.Builder(this)
                    .setTitle("ERROR!!")
                    .setMessage("比率は1から100の整数で入力してください")
                    .setPositiveButton("OK",null)
                    .show()
                } else {
                    val data = CompData(EDcomp_name_et.text.toString(),
                        EDcomp_num1_et.text.toString(),
                        EDcomp_num2_et.text.toString())
                    addList.add(data)

                    val data2 = CompData2_2(EDcomp_name_et.text.toString(),
                        EDcomp_num1_et.text.toString())

                    addList2.add(data2)

                    var recyclerAdapter = CompDateAdapter(addList, addList2)
                    recyclerView.adapter = recyclerAdapter
                    recyclerView.layoutManager = LinearLayoutManager(this)
                    recyclerAdapter.notifyItemInserted(addList.lastIndex) //表示を更新(リストの最後に挿入)
                }
            }

            EDcomp_name_et.text = null
            EDcomp_num1_et.text = null
            EDcomp_num2_et.text = null

        }

        // 更新ボタンクリック時の処理
        EDupdate_btn.setOnClickListener {
            val EDroulette_name_et = findViewById<EditText>(R.id.EDroulette_name_et)

            //Roulette(更新前)を破棄
            for (roulette in roulettes){
                realm.executeTransaction{
                    roulette?.deleteFromRealm()
                }
            }

            //Roulette_name(更新前)を破棄
            val roulette_name_d = realm.where<RouletteName>().equalTo("name", roulette_name).findFirst()
            realm.executeTransaction{
                roulette_name_d?.deleteFromRealm()
            }

            //Roulette(更新後)の保存
            var comp_count = addList.size
            //ルーレットの名前被りをなくすために、DBから全てのルーレット名を検索
            val roulette_names = realm.where<RouletteName>().findAll()
            var roulette_names_list = ArrayList<String>()
            for (roulette in roulettes){
                roulette_names_list.add(roulette.name)
            }

            if(EDroulette_name_et.text.toString() == ""){

                val alertDialog1 = AlertDialog.Builder(this)
                    .setTitle("ERROR!!")
                    .setMessage("ルーレット名を入力してください")
                    .setPositiveButton("OK",null)
                    .show()
                // OKボタンのインスタンスを取得する
                val positiveButton = alertDialog1.getButton(DialogInterface.BUTTON_POSITIVE)
                // OKボタンの色を変更する
                positiveButton.setTextColor(Color.BLACK)

            }else if(EDroulette_name_et.text.toString() in roulette_names_list) {

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

            }else {
                //RouletteNameの保存
                realm.executeTransaction {
                    //                db: Realm ->
                    val maxId = realm.where<RouletteName>().max("id")
                    val nextId = (maxId?.toLong() ?: 0L) + 1L
                    val roulette_name = realm.createObject<RouletteName>(nextId)
                    roulette_name.name = EDroulette_name_et.text.toString()
                }

                //Rouletteの保存
                for (data in addList) {
                    realm.executeTransaction {
                        //                db: Realm ->
                        val maxId = realm.where<Roulette>().max("id")
                        val nextId = (maxId?.toLong() ?: 0L) + 1L
                        val roulette = realm.createObject<Roulette>(nextId)
                        roulette.name = EDroulette_name_et.text.toString()
                        roulette.comp_name = data.comp_name
                        roulette.comp_num1 = data.comp_num1.toInt()
                        roulette.comp_num2 = data.comp_num2.toInt()
                    }
                }

                //top画面に戻る
                AlertDialog.Builder(this)
                    .setTitle("ルーレット更新")
                    .setMessage("ルーレットを更新しました")
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