package com.virtualmind.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "content_items")
data class ContentItemEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val platform: String, // e.g. "X", "LinkedIn", "YouTube"
    val status: String,   // e.g. "Draft", "Scheduled", "Uploaded"
    val scheduledDateMillis: Long,
    val createdAtMillis: Long = System.currentTimeMillis()
)
