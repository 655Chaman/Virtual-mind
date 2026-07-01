package com.virtualmind.core.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.virtualmind.core.data.local.dao.LogEntryDao
import com.virtualmind.core.data.local.entity.LogEntryEntity
import com.virtualmind.core.data.local.dao.ContentItemDao
import com.virtualmind.core.data.local.dao.ProcessTaskDao
import com.virtualmind.core.data.local.entity.ContentItemEntity
import com.virtualmind.core.data.local.entity.ProcessTaskEntity
import com.virtualmind.core.data.local.dao.WorkoutDao
import com.virtualmind.core.data.local.entity.WorkoutSplitEntity
import com.virtualmind.core.data.local.entity.WorkoutExerciseEntity
import com.virtualmind.core.data.local.entity.WorkoutSessionEntity
import com.virtualmind.core.data.local.entity.WorkoutSetEntity

@Database(
    entities = [
        LogEntryEntity::class,
        ContentItemEntity::class,
        ProcessTaskEntity::class,
        WorkoutSplitEntity::class,
        WorkoutExerciseEntity::class,
        WorkoutSessionEntity::class,
        WorkoutSetEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class VirtualMindDatabase : RoomDatabase() {
    abstract fun logEntryDao(): LogEntryDao
    abstract fun contentItemDao(): ContentItemDao
    abstract fun processTaskDao(): ProcessTaskDao
    abstract fun workoutDao(): WorkoutDao
}
