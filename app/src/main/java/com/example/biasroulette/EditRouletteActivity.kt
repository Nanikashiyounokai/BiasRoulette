package com.example.biasroulette

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import io.realm.Realm
import io.realm.kotlin.createObject
import io.realm.kotlin.where

class EditRouletteActivity : AppCompatActivity() {

    private lateinit var realm: Realm

    private var addList = ArrayList<CompData>() //空のリストを用意<型はデータクラス>
    private var addList2 = ArrayList<CompData2_2>()
    private var recyclerAdapter = CompDateAdapter(addList, addList2)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        realm = Realm.getDefaultInstance()
        setContentView(R.layout.activity_edit_roulette)

        val roulette_name = intent.getStringExtra("ROULETTO_NAME")
        val EDroulette_name_et: EditText = findViewById(R.id.EDroulette_name_et)
        val EDcomp_rv: RecyclerView = findViewById(R.id.EDcomp_rv)
        val EDad_comp_btn: Button = findViewById(R.id.EDad_comp_btn)
        val EDupdate_btn: Button = findViewById(R.id.EDupdate_btn)


        EDroulette_name_et.setText(roulette_name)

        //RecyclerViewにアダプターとレイアウトマネージャーを設定する
        EDcomp_rv.layoutManager = LinearLayoutManager(this)
        EDcomp_rv.adapter = recyclerAdapter

        val roulettes = realm.where<Roulette>().equalTo("name", roulette_name).findAll()
        for (roulette in roulettes){
            val comp_name  = roulette.comp_name
            val comp_num1  = roulette.comp_num1
            val comp_num2  = roulette.comp_num2
            val data = CompData(comp_name, comp_num1.toString(), comp_num2.toString())
            addList.add(data)
            recyclerAdapter.notifyItemInserted(addList.lastIndex) //表示を更新(リストの最後に挿入)
        }

        //追加ボタンを押したときの処理
        EDad_comp_btn.setOnClickListener{
            val EDcomp_name_et :EditText = findViewById(R.id.EDcomp_name_et)
            val EDcomp_num1_et :EditText = findViewById(R.id.EDcomp_num1_et)
            val EDcomp_num2_et :EditText = findViewById(R.id.EDcomp_num2_et)
            val data = CompData(EDcomp_name_et.text.toString(),
                EDcomp_num1_et.text.toString(),
                EDcomp_num2_et.text.toString())
            addList.add(data)
            recyclerAdapter.notifyItemInserted(addList.lastIndex) //表示を更新(リストの最後に挿入)

            EDcomp_name_et.text = null
            EDcomp_num1_et.text = null
            EDcomp_num2_et.text = null
        }

        // 更新ボタンクリック時の処理
        EDupdate_btn.setOnClickListener {
            val EDroulette_name_et = findViewById<EditText>(R.id.EDroulette_name_et)
            var comp_count = addList.size

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

            //Roulette_name(更新後)の保存
            realm.executeTransaction {
                //                db: Realm ->
                val maxId = realm.where<RouletteName>().max("id")
                val nextId = (maxId?.toLong() ?: 0L) + 1L
                val roulette_name = realm.createObject<RouletteName>(nextId)
                roulette_name.name = EDroulette_name_et.text.toString()
            }

        }


    }
}