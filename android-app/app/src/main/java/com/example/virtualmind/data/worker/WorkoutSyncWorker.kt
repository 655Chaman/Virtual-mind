package com.example.virtualmind.data.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import com.virtualmind.core.data.local.dao.WorkoutDao

@HiltWorker
class WorkoutSyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val workoutDao: WorkoutDao
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            val unsyncedSessions = workoutDao.getUnsyncedSessions()
            
            if (unsyncedSessions.isNotEmpty()) {
                // Here you would make a network call to sync the sessions
                // e.g., val success = api.syncWorkouts(unsyncedSessions)
                
                // Assuming successful sync, mark as synced:
                val ids = unsyncedSessions.map { it.id }
                workoutDao.markSessionsAsSynced(ids)
            }
            
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
    
    companion object {
        const val WORK_NAME = "WorkoutSyncWorker"
    }
}
