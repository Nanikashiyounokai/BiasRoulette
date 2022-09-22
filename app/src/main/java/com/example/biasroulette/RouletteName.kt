package com.example.biasroulette

import io.realm.RealmObject
import io.realm.annotations.PrimaryKey

open class RouletteName: RealmObject() {
    @PrimaryKey
    var id: Long = 0
    var name: String = ""
}