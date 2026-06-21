package com.virtualmind.core.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.virtualmind.core.data.local.entity.ContentItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ContentItemDao {
    @Query("SELECT * FROM content_items ORDER BY scheduledDateMillis DESC")
    fun getAllContentItems(): Flow<List<ContentItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertContentItem(item: ContentItemEntity)

    @Update
    suspend fun updateContentItem(item: ContentItemEntity)

    @Delete
    suspend fun deleteContentItem(item: ContentItemEntity)
}
