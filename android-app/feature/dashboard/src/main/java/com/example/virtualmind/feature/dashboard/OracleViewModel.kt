package com.example.virtualmind.feature.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.virtualmind.core.network.OracleApi
import com.virtualmind.core.network.OracleSyncRequest
import com.virtualmind.core.network.OracleSyncResponse
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class OracleState {
    LOADING,
    AWAITING_INPUT,
    PROCESSING,
    COMPLETE,
    ERROR
}

@HiltViewModel
class OracleViewModel @Inject constructor(
    private val oracleApi: OracleApi
) : ViewModel() {

    private val _uiState = MutableStateFlow(OracleState.LOADING)
    val uiState: StateFlow<OracleState> = _uiState.asStateFlow()

    private val _syncResult = MutableStateFlow<OracleSyncResponse?>(null)
    val syncResult: StateFlow<OracleSyncResponse?> = _syncResult.asStateFlow()

    private val _errorMessage = MutableStateFlow("")
    val errorMessage: StateFlow<String> = _errorMessage.asStateFlow()

    init {
        viewModelScope.launch {
            // Simulate the loading of the oracle matrix context (just for dramatic effect)
            delay(1500)
            _uiState.value = OracleState.AWAITING_INPUT
        }
    }

    fun executeSync(answers: String) {
        if (answers.isBlank()) return

        viewModelScope.launch {
            _uiState.value = OracleState.PROCESSING
            try {
                val response = oracleApi.processSync(OracleSyncRequest(answers = answers))
                _syncResult.value = response
                _uiState.value = OracleState.COMPLETE
            } catch (e: Exception) {
                _errorMessage.value = e.message ?: "UNKNOWN NEURAL FAILURE"
                _uiState.value = OracleState.ERROR
            }
        }
    }

    fun retry() {
        _uiState.value = OracleState.AWAITING_INPUT
        _errorMessage.value = ""
    }
}
