package com.virtualmind.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.virtualmind.core.model.LogEntry

@Entity(tableName = "log_entries")
data class LogEntryEntity(
    @PrimaryKey
    val id: String,
    val pillarId: String,
    val content: String,
    val timestamp: Long,
    val isSystemGenerated: Boolean
)

// Extension function to map Entity to Domain Model
fun LogEntryEntity.toDomainModel(): LogEntry {
    return LogEntry(
        id = id,
        pillarId = pillarId,
        content = content,
        timestamp = timestamp,
        isSystemGenerated = isSystemGenerated
    )
}

// Extension function to map Domain Model to Entity
fun LogEntry.toEntity(): LogEntryEntity {
    return LogEntryEntity(
        id = id,
        pillarId = pillarId,
        content = content,
        timestamp = timestamp,
        isSystemGenerated = isSystemGenerated
    )
}
