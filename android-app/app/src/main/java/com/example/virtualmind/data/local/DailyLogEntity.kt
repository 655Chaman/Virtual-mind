package com.example.virtualmind.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "daily_logs")
data class DailyLogEntity(
    @PrimaryKey val date: String, // e.g. "2026-06-21"
    val timestamp: String,
    val text: String,
    val pillarsJson: String, // JSON string of List<String>
    val nonNegotiablesJson: String, // JSON string of NonNegotiables
    val score: Int?,
    val isSynced: Boolean = false // Crucial for WorkManager
)
