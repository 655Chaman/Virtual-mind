package com.example.virtualmind.feature.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.virtualmind.core.data.repository.LogRepository
import com.virtualmind.core.model.LogEntry
import com.virtualmind.core.network.NetworkTerminalDataSource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class TerminalViewModel @Inject constructor(
    private val logRepository: LogRepository,
    private val networkTerminalDataSource: NetworkTerminalDataSource
) : ViewModel() {

    // Automatically streams the log history from the local Room DB natively
    val chatHistory: StateFlow<List<LogEntry>> = logRepository.getLogEntriesForPillar("terminal")
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    private val _isStreaming = MutableStateFlow(false)
    val isStreaming: StateFlow<Boolean> = _isStreaming.asStateFlow()

    private val _currentStreamingResponse = MutableStateFlow("")
    val currentStreamingResponse: StateFlow<String> = _currentStreamingResponse.asStateFlow()

    init {
        // Seed initial system messages if database is empty
        viewModelScope.launch {
            // Give the flow a tiny moment to collect
            kotlinx.coroutines.delay(500)
            if (chatHistory.value.isEmpty()) {
                logRepository.insertLogEntry(LogEntry(pillarId = "terminal", content = "> VIRTUAL MIND 2.0 TERMINAL INITIALIZED.", isSystemGenerated = true))
                logRepository.insertLogEntry(LogEntry(pillarId = "terminal", content = "> NAFS FILTER ACTIVE. GEMINI BRAIN CONNECTED.", isSystemGenerated = true))
                logRepository.insertLogEntry(LogEntry(pillarId = "terminal", content = "> AWAITING OPERATOR INPUT.", isSystemGenerated = true))
            }
        }
    }

    fun sendMessage(message: String) {
        if (message.isBlank() || _isStreaming.value) return

        viewModelScope.launch {
            // 1. Save user message to local DB instantly
            logRepository.insertLogEntry(LogEntry(pillarId = "terminal", content = message, isSystemGenerated = false))
            
            // 2. Begin streaming state
            _isStreaming.value = true
            _currentStreamingResponse.value = ""

            // 3. Connect to backend via SSE
            networkTerminalDataSource.streamTerminalChat(message).collect { chunk ->
                _currentStreamingResponse.update { it + chunk }
            }

            // 4. Save final response to local DB
            logRepository.insertLogEntry(LogEntry(pillarId = "terminal", content = _currentStreamingResponse.value, isSystemGenerated = true))
            
            // 5. Reset streaming state
            _isStreaming.value = false
            _currentStreamingResponse.value = ""
        }
    }
}
