package com.virtualmind.core.model

import java.util.UUID

/**
 * A universal domain model representing a log entry.
 * Can be used for Terminal chats, daily reflections, or general notes.
 */
data class LogEntry(
    val id: String = UUID.randomUUID().toString(),
    val pillarId: String,       // e.g., "terminal", "self", "deen"
    val content: String,        // The actual text/content
    val timestamp: Long = System.currentTimeMillis(),
    val isSystemGenerated: Boolean = false
)
