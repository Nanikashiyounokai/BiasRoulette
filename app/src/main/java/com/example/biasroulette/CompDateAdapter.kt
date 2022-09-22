package com.example.biasroulette

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class CompDateAdapter(private val compDateList: ArrayList<CompData>) :RecyclerView.Adapter<CompDateAdapter.ViewHolderItem>() {

    //ViewHolder(インナークラス)
    inner class ViewHolderItem(v:View, rAdapter: CompDateAdapter) :RecyclerView.ViewHolder(v) {
        val comp_name_holder : TextView = v.findViewById(R.id.comp_name)
        val comp_num1_holder : TextView = v.findViewById(R.id.comp_num1)
        val comp_num2_holder : TextView = v.findViewById(R.id.comp_num2)
        val delete_btn : Button = v.findViewById(R.id.delete_btn)

        //デリートボタンが押されたら
        init {
            delete_btn.setOnClickListener {
                val position:Int = adapterPosition
                val listPosition = compDateList[position]
                compDateList.removeAt(position)
                rAdapter.notifyItemRemoved(position)

            }
        }

    }

    //一行だけのViewを生成
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolderItem {
        val inflater = LayoutInflater.from(parent.context)
        val view = inflater.inflate(R.layout.comp_layout2, parent, false)
        return ViewHolderItem(view, this)
    }

    //position番目のデータをレイアウト(xml)に表示するようにセット
    override fun onBindViewHolder(holder: ViewHolderItem, position: Int) {
        val currentItem = compDateList[position] //何番目のリスト(アイテム)ですか
        holder.comp_name_holder.text = currentItem.comp_name
        holder.comp_num1_holder.text = currentItem.comp_num1
        holder.comp_num2_holder.text = currentItem.comp_num2
    }

    //リストのサイズ
    override fun getItemCount(): Int {
        return compDateList.size
    }
}