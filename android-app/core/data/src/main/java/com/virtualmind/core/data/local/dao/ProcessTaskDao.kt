package com.virtualmind.core.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.virtualmind.core.data.local.entity.ProcessTaskEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ProcessTaskDao {
    @Query("SELECT * FROM process_tasks ORDER BY createdAtMillis DESC")
    fun getAllProcessTasks(): Flow<List<ProcessTaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProcessTask(task: ProcessTaskEntity)

    @Update
    suspend fun updateProcessTask(task: ProcessTaskEntity)

    @Delete
    suspend fun deleteProcessTask(task: ProcessTaskEntity)
}
