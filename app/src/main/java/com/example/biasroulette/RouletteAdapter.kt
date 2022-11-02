package com.example.biasroulette

import android.annotation.SuppressLint
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.RadioButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import io.realm.OrderedRealmCollection
import io.realm.Realm
import io.realm.RealmRecyclerViewAdapter
import io.realm.RealmResults

class RouletteAdapter(data: RealmResults<Roulette>) :
    RealmRecyclerViewAdapter<Roulette, RouletteAdapter.ViewHolder>(data, true){

    init {
        setHasStableIds(true)
    }

    class ViewHolder(cell: View) : RecyclerView.ViewHolder(cell) {
        val comp_name: TextView = cell.findViewById(R.id.comp_name)
        val comp_num1: RadioButton = cell.findViewById(R.id.comp_num1)
        val comp_num2: TextView = cell.findViewById(R.id.comp_num2)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        val view = inflater.inflate(R.layout.comp_layout2, parent, false)
        return ViewHolder(view)
    }

    @SuppressLint("SetTextI18n", "NotifyDataSetChanged")
    override fun onBindViewHolder(holder: RouletteAdapter.ViewHolder, @SuppressLint("RecyclerView") position: Int) {
        val roulette: Roulette? = getItem(position)
        holder.comp_name.text = roulette?.comp_name
        holder.comp_num1.text = roulette?.comp_num1.toString()
        holder.comp_num2.text = roulette?.comp_num2.toString()

    }

    override fun getItemId(position: Int): Long {
        return getItem(position)?.id ?: 0
    }
}