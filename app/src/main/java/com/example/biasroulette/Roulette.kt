package com.example.biasroulette

import io.realm.RealmObject
import io.realm.annotations.PrimaryKey

@Suppress("PropertyName")
open class Roulette : RealmObject() {
    @PrimaryKey
    var id: Long = 0
    var name: String = ""
    var comp_name: String = ""
    var comp_num1: Int = 0
    var comp_num2: Int = 0
}