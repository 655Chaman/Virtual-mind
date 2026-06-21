package com.virtualmind.core.data.repository

import com.virtualmind.core.model.LogEntry
import kotlinx.coroutines.flow.Flow

interface LogRepository {
    fun getLogEntriesForPillar(pillarId: String): Flow<List<LogEntry>>
    suspend fun insertLogEntry(logEntry: LogEntry)
    suspend fun deleteLogEntry(id: String)
}
