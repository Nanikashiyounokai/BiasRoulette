package com.example.biasroulette

import android.annotation.SuppressLint
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import io.realm.OrderedRealmCollection
import io.realm.Realm
import io.realm.RealmRecyclerViewAdapter
import io.realm.kotlin.where
import android.content.Intent

class RouletteNameAdapter (data: OrderedRealmCollection<RouletteName>, ) :
    RealmRecyclerViewAdapter<RouletteName, RouletteNameAdapter.ViewHolder>(data, true) {

    private lateinit var realm: Realm //db関係

    init {
        setHasStableIds(true)
    }

    class ViewHolder(cell: View) : RecyclerView.ViewHolder(cell) {
        val name: TextView = cell.findViewById(R.id.name_tv)
        val roulette_delete_btn: Button = cell.findViewById(R.id.roulette_delete_btn)
        val roulette_edit_btn: Button = cell.findViewById(R.id.roulette_edit_btn)

    }


    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RouletteNameAdapter.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        val view = inflater.inflate(R.layout.roulette_list_layout, parent, false)
        return RouletteNameAdapter.ViewHolder(view)
    }

    @SuppressLint("SetTextI18n", "NotifyDataSetChanged")
    override fun onBindViewHolder(holder: RouletteNameAdapter.ViewHolder, @SuppressLint("RecyclerView") position: Int) {
        realm = Realm.getDefaultInstance()
        val roulette_name: RouletteName? = getItem(position)
        holder.name.text = roulette_name?.name

        //消去ボタンが押されたときの処理
        holder.roulette_delete_btn.setOnClickListener {

            //val roulette_name = realm.where<RouletteName>().equalTo("id", roulette_name?.id).findFirst()

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
        }

        //編集ボタンが押されたときの処理
        holder.roulette_edit_btn.setOnClickListener {
            val context = holder.itemView.context
            context.startActivity(Intent(context, EditRouletteActivity::class.java)
                .putExtra("ROULETTO_NAME", roulette_name?.name.toString()))
        }
    }
}