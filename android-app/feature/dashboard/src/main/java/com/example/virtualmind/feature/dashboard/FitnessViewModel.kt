package com.example.virtualmind.feature.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.virtualmind.core.network.FitnessApi
import com.virtualmind.core.network.HistoryWorkoutResponse
import com.virtualmind.core.network.ProtocolCountRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FitnessViewModel @Inject constructor(
    private val fitnessApi: FitnessApi
) : ViewModel() {

    // Network State
    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // Dashboard State
    private val _isRestDay = MutableStateFlow(false)
    val isRestDay: StateFlow<Boolean> = _isRestDay.asStateFlow()
    
    private val _isLogged = MutableStateFlow(false)
    val isLogged: StateFlow<Boolean> = _isLogged.asStateFlow()

    // Home Protocols
    private val _homeCounters = MutableStateFlow<Map<String, Int>>(emptyMap())
    val homeCounters: StateFlow<Map<String, Int>> = _homeCounters.asStateFlow()

    // History for CNS Analysis
    private val _history = MutableStateFlow<List<HistoryWorkoutResponse>>(emptyList())
    val history: StateFlow<List<HistoryWorkoutResponse>> = _history.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        // IMMEDIATE: Set defaults so the UI appears instantly
        _homeCounters.value = mapOf(
            "pushups" to 0,
            "pullups" to 0,
            "squats" to 0,
            "core" to 0
        )
        _isLoading.value = false

        // BACKGROUND: Sync from cloud without blocking UI
        viewModelScope.launch {
            try {
                val todayResponse = fitnessApi.getTodayWorkout()
                _isLogged.value = todayResponse.logged
                _isRestDay.value = todayResponse.workout?.isRestDay ?: false

                val homeResponse = fitnessApi.getHomeProtocolsToday()
                val counters = mutableMapOf<String, Int>()
                homeResponse.forEach { (key, value) ->
                    if (key != "_id" && key != "_order" && key != "date") {
                        counters[key] = (value as? Double)?.toInt() ?: 0
                    }
                }
                if (counters.isNotEmpty()) {
                    _homeCounters.value = counters
                }

                _history.value = fitnessApi.getHistory(10)

            } catch (e: Exception) {
                // Server cold start or offline — silently fail, defaults remain visible
                e.printStackTrace()
            }
        }
    }

    fun incrementProtocol(id: String) {
        viewModelScope.launch {
            // Optimistic UI update
            val current = _homeCounters.value.toMutableMap()
            current[id] = (current[id] ?: 0) + 1
            _homeCounters.value = current

            try {
                fitnessApi.incrementProtocol(ProtocolCountRequest(id, 1))
            } catch (e: Exception) {
                e.printStackTrace()
                // Rollback on failure
                current[id] = (current[id] ?: 1) - 1
                _homeCounters.value = current
            }
        }
    }

    fun decrementProtocol(id: String) {
        viewModelScope.launch {
            val currentCount = _homeCounters.value[id] ?: 0
            if (currentCount > 0) {
                // Optimistic UI update
                val current = _homeCounters.value.toMutableMap()
                current[id] = currentCount - 1
                _homeCounters.value = current

                try {
                    fitnessApi.decrementProtocol(ProtocolCountRequest(id, 1))
                } catch (e: Exception) {
                    e.printStackTrace()
                    // Rollback
                    current[id] = currentCount
                    _homeCounters.value = current
                }
            }
        }
    }
}
