package com.virtualmind.core.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.virtualmind.core.data.local.entity.WorkoutSessionEntity
import com.virtualmind.core.data.local.entity.WorkoutSetEntity

@Dao
interface WorkoutDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: WorkoutSessionEntity): Long
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSet(set: WorkoutSetEntity)
    
    @Query("SELECT * FROM workout_session WHERE isSynced = 0")
    suspend fun getUnsyncedSessions(): List<WorkoutSessionEntity>
    
    @Query("UPDATE workout_session SET isSynced = 1 WHERE id IN (:ids)")
    suspend fun markSessionsAsSynced(ids: List<Long>)
}
