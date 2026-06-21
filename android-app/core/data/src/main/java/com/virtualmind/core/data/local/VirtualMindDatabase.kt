package com.virtualmind.core.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.virtualmind.core.data.local.dao.LogEntryDao
import com.virtualmind.core.data.local.entity.LogEntryEntity
import com.virtualmind.core.data.local.dao.ContentItemDao
import com.virtualmind.core.data.local.dao.ProcessTaskDao
import com.virtualmind.core.data.local.entity.ContentItemEntity
import com.virtualmind.core.data.local.entity.ProcessTaskEntity

@Database(
    entities = [
        LogEntryEntity::class,
        ContentItemEntity::class,
        ProcessTaskEntity::class
    ],
    version = 2,
    exportSchema = false
)
abstract class VirtualMindDatabase : RoomDatabase() {
    abstract fun logEntryDao(): LogEntryDao
    abstract fun contentItemDao(): ContentItemDao
    abstract fun processTaskDao(): ProcessTaskDao
}
