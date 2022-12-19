package com.example.biasroulette

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.core.widget.doAfterTextChanged
import androidx.core.widget.doBeforeTextChanged
import androidx.recyclerview.widget.RecyclerView
import io.realm.Realm
import io.realm.kotlin.where

class CompDateAdapter(private val compDateList: ArrayList<CompData>, private val compDateList2: ArrayList<CompData2_2>) :RecyclerView.Adapter<CompDateAdapter.ViewHolderItem>() {

    //ViewHolder(インナークラス)
    inner class ViewHolderItem(v:View, rAdapter: CompDateAdapter) :RecyclerView.ViewHolder(v) {
        val comp_name_holder : EditText = v.findViewById(R.id.comp_name)
        val comp_num1_holder : EditText = v.findViewById(R.id.comp_num1)
        val comp_num2_holder : EditText = v.findViewById(R.id.comp_num2)
        val delete_btn : Button = v.findViewById(R.id.delete_btn)

        init {
            //デリートボタンが押されたら
            delete_btn.setOnClickListener {
                val position:Int = adapterPosition
                val listPosition = compDateList[position]
                compDateList.removeAt(position)
                compDateList2.removeAt(position)
                rAdapter.notifyItemRemoved(position)
            }

            //Edit Textが更新されたら、position番目の要素をデリートし、position番目に更新済み要素を追加する
            //==項目名==
            comp_name_holder.doAfterTextChanged {
                val position:Int = adapterPosition
                compDateList2.removeAt(position)
                compDateList.removeAt(position)
                val data = CompData(comp_name_holder.text.toString(),
                    comp_num1_holder.text.toString(),
                    comp_num2_holder.text.toString())
                compDateList.add(position, data)

                val data2 = CompData2_2(comp_name_holder.text.toString(),
                    comp_num1_holder.text.toString())
                compDateList2.add(position, data2)
            }
            //=======

            //==表比率==
            comp_num1_holder.doAfterTextChanged {
                val position:Int = adapterPosition
                compDateList2.removeAt(position)
                compDateList.removeAt(position)
                val data = CompData(comp_name_holder.text.toString(),
                    comp_num1_holder.text.toString(),
                    comp_num2_holder.text.toString())
                compDateList.add(position, data)

                val data2 = CompData2_2(comp_name_holder.text.toString(),
                    comp_num1_holder.text.toString())
                compDateList2.add(position, data2)
            }
            //========

            //==裏比率==
            comp_num2_holder.doAfterTextChanged {
                val position:Int = adapterPosition
                compDateList2.removeAt(position)
                compDateList.removeAt(position)
                val data = CompData(comp_name_holder.text.toString(),
                    comp_num1_holder.text.toString(),
                    comp_num2_holder.text.toString())
                compDateList.add(position, data)

                val data2 = CompData2_2(comp_name_holder.text.toString(),
                    comp_num1_holder.text.toString())
                compDateList2.add(position, data2)
            }
            //========

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
        holder.comp_name_holder.setText(currentItem.comp_name)
        holder.comp_num1_holder.setText(currentItem.comp_num1)
        holder.comp_num2_holder.setText(currentItem.comp_num2)

    }

    //リストのサイズ
    override fun getItemCount(): Int {
        return compDateList.size
    }
}