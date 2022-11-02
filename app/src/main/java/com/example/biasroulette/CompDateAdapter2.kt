package com.example.biasroulette
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class CompDateAdapter2(private val compDateList2: ArrayList<CompData2_2>, private val compDateList: ArrayList<CompData>) :RecyclerView.Adapter<CompDateAdapter2.ViewHolderItem>() {

    //ViewHolder(インナークラス)
    inner class ViewHolderItem(v:View, rAdapter: CompDateAdapter2) :RecyclerView.ViewHolder(v) {
        val comp_name_holder : TextView = v.findViewById(R.id.comp0_name)
        val comp_num1_holder : TextView = v.findViewById(R.id.comp0_num1)
        val delete_btn : Button = v.findViewById(R.id.delete_btn0)

        init {
            //デリートボタンが押されたら
            delete_btn.setOnClickListener {
                val position:Int = adapterPosition
                val listPosition = compDateList2[position]
                compDateList2.removeAt(position)
                compDateList.removeAt(position)
                rAdapter.notifyItemRemoved(position)

            }
        }

    }

    //一行だけのViewを生成
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolderItem {
        val inflater = LayoutInflater.from(parent.context)
        val view = inflater.inflate(R.layout.comp_layout, parent, false)
        return ViewHolderItem(view, this)
    }

    //position番目のデータをレイアウト(xml)に表示するようにセット
    override fun onBindViewHolder(holder: ViewHolderItem, position: Int) {

        val currentItem = compDateList2[position] //何番目のリスト(アイテム)ですか

        holder.comp_name_holder.text = currentItem.comp_name_2
        holder.comp_num1_holder.text = currentItem.comp_num1_2
    }

    //リストのサイズ
    override fun getItemCount(): Int {
        return compDateList2.size
    }
}