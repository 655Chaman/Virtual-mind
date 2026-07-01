package com.virtualmind.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "workout_session")
data class WorkoutSessionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val splitId: Long,
    val dateTimestamp: Long,
    val isSynced: Boolean = false
)
