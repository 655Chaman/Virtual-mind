package com.virtualmind.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "process_tasks")
data class ProcessTaskEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val questionnaireAnswers: String, // JSON or serialized string of answers
    val assignedMinutes: Int,
    val status: String, // "Pending", "Active", "Paused", "Completed"
    val remainingSeconds: Int,
    val createdAtMillis: Long = System.currentTimeMillis()
)
