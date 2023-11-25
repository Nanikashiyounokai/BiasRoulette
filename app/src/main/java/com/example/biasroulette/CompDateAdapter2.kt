package com.example.biasroulette
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import androidx.core.widget.doAfterTextChanged
import androidx.recyclerview.widget.RecyclerView


@Suppress("DEPRECATION", "PropertyName", "MemberVisibilityCanBePrivate", "LocalVariableName")
class CompDateAdapter2(private val compDateList2: ArrayList<CompData2_2>, private val compDateList: ArrayList<CompData>) :RecyclerView.Adapter<CompDateAdapter2.ViewHolderItem>() {

    //ViewHolder(インナークラス)
    inner class ViewHolderItem(v:View, rAdapter: CompDateAdapter2) :RecyclerView.ViewHolder(v) {
        val comp_name_holder : EditText = v.findViewById(R.id.comp0_name)
        val comp_num1_holder : EditText = v.findViewById(R.id.comp0_num1)
        val delete_btn : Button = v.findViewById(R.id.delete_btn0)

        init {
            //デリートボタンが押されたら
            delete_btn.setOnClickListener {
                val position:Int = adapterPosition
                compDateList2.removeAt(position)
                compDateList.removeAt(position)
                rAdapter.notifyItemRemoved(position)

            }

            //Edit Textが更新されたら、position番目の要素をデリートし、position番目に更新済み要素を追加する

            //==項目名==
            comp_name_holder.doAfterTextChanged {
                val position: Int = adapterPosition
                val comp_num2 = compDateList[position].comp_num2
                compDateList2.removeAt(position)
                compDateList.removeAt(position)
                val data = CompData(
                    comp_name_holder.text.toString(),
                    comp_num1_holder.text.toString(),
                    comp_num2
                )
                compDateList.add(position, data)

                val data2 = CompData2_2(
                    comp_name_holder.text.toString(),
                    comp_num1_holder.text.toString()
                )
                compDateList2.add(position, data2)
            }
            //=======

            //==表比率==
            comp_num1_holder.doAfterTextChanged {
                val position: Int = adapterPosition
                val comp_num2 = compDateList[position].comp_num2
                compDateList2.removeAt(position)
                compDateList.removeAt(position)
                val data = CompData(
                    comp_name_holder.text.toString(),
                    comp_num1_holder.text.toString(),
                    comp_num2
                )
                compDateList.add(position, data)

                val data2 = CompData2_2(
                    comp_name_holder.text.toString(),
                    comp_num1_holder.text.toString()
                )
                compDateList2.add(position, data2)
            }
            //========

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

        holder.comp_name_holder.setText(currentItem.comp_name_2)
        holder.comp_num1_holder.setText(currentItem.comp_num1_2)

    }

    //リストのサイズ
    override fun getItemCount(): Int {
        return compDateList2.size
    }
}