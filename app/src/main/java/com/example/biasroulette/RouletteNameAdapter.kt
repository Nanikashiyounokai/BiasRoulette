package com.example.biasroulette

import android.annotation.SuppressLint
import android.content.Intent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.recyclerview.widget.RecyclerView
import io.realm.OrderedRealmCollection
import io.realm.Realm
import io.realm.RealmRecyclerViewAdapter
import io.realm.kotlin.where

@Suppress("PropertyName", "LocalVariableName")
class RouletteNameAdapter(data: OrderedRealmCollection<RouletteName>) :
    RealmRecyclerViewAdapter<RouletteName, RouletteNameAdapter.ViewHolder>(data, true) {

    private lateinit var realm: Realm //db関係

    init {
        setHasStableIds(true)
    }

    class ViewHolder(cell: View) : RecyclerView.ViewHolder(cell) {
        val name: TextView = cell.findViewById(R.id.name_tv)
        val roulette_play_btn: Button = cell.findViewById(R.id.roulette_play_btn)
        val roulette_delete_btn: Button = cell.findViewById(R.id.roulette_delete_btn)
        val roulette_edit_btn: Button = cell.findViewById(R.id.roulette_edit_btn)

    }


    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        val view = inflater.inflate(R.layout.roulette_list_layout, parent, false)
        return ViewHolder(view)
    }

    @SuppressLint("SetTextI18n", "NotifyDataSetChanged")
    override fun onBindViewHolder(holder: ViewHolder, @SuppressLint("RecyclerView") position: Int) {
        realm = Realm.getDefaultInstance()
        val roulette_name: RouletteName? = getItem(position)
        holder.name.text = roulette_name?.name

        //消去ボタンが押されたときの処理
        holder.roulette_delete_btn.setOnClickListener {
            val context = holder.itemView.context

            //val roulette_name = realm.where<RouletteName>().equalTo("id", roulette_name?.id).findFirst()

//            ここにアラートダイアログを入れます
            AlertDialog.Builder(context)
                .setMessage("本当に削除しても良いですか？")
                .setPositiveButton("Yes") { dialog, _ ->
                    //roulette(項目一つ一つ)の消去
                    val roulettes = realm.where<Roulette>().equalTo("name", roulette_name?.name.toString()).findAll()
                    for (roulette in roulettes) {
                        realm.executeTransaction{
                            roulette?.deleteFromRealm()
                        }
                    }
                    //roulette_nameの消去
                    realm.executeTransaction{
                        roulette_name?.deleteFromRealm()
                    }
                    dialog.dismiss()
                }
                .setNegativeButton("No") { dialog, _ ->
                    dialog.dismiss()
                }
                .show()
        }

        //編集ボタンが押されたときの処理
        holder.roulette_edit_btn.setOnClickListener {
            val context = holder.itemView.context
            context.startActivity(Intent(context, EditRouletteActivity::class.java)
                .putExtra("ROULETTE_NAME", roulette_name?.name.toString()))
        }

        //Playボタンが押されたときの処理
        holder.roulette_play_btn.setOnClickListener {
            val context = holder.itemView.context
            context.startActivity(Intent(context, RouletteImageMaker::class.java)
                .putExtra("ROULETTE_NAME", roulette_name?.name.toString()))
        }
    }
}