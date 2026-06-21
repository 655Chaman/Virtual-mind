package com.virtualmind.core.data.repository

import com.virtualmind.core.data.local.dao.LogEntryDao
import com.virtualmind.core.data.local.entity.toDomainModel
import com.virtualmind.core.data.local.entity.toEntity
import com.virtualmind.core.model.LogEntry
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class OfflineFirstLogRepository @Inject constructor(
    private val logEntryDao: LogEntryDao
) : LogRepository {

    override fun getLogEntriesForPillar(pillarId: String): Flow<List<LogEntry>> {
        return logEntryDao.getLogEntriesForPillar(pillarId).map { entities ->
            entities.map { it.toDomainModel() }
        }
    }

    override suspend fun insertLogEntry(logEntry: LogEntry) {
        logEntryDao.insertLogEntry(logEntry.toEntity())
    }

    override suspend fun deleteLogEntry(id: String) {
        logEntryDao.deleteLogEntry(id)
    }
}
