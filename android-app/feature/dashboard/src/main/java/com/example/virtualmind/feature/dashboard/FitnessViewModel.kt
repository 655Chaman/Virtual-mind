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
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class FitnessViewModel @Inject constructor(
    private val fitnessApi: FitnessApi
) : ViewModel() {

    private fun getLocalDateString(): String {
        return LocalDate.now().toString()
    }

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

    private val _protocolOrder = MutableStateFlow<List<String>>(emptyList())
    val protocolOrder: StateFlow<List<String>> = _protocolOrder.asStateFlow()

    // Fatigue Tracking (Phase 4) - Activation vs Armor
    private val _fatigueLevels = MutableStateFlow<Map<String, Pair<Float, Float>>>(emptyMap()) // Muscle -> (Activation, Armor)
    val fatigueLevels: StateFlow<Map<String, Pair<Float, Float>>> = _fatigueLevels.asStateFlow()

    // History for CNS Analysis
    private val _history = MutableStateFlow<List<HistoryWorkoutResponse>>(emptyList())
    val history: StateFlow<List<HistoryWorkoutResponse>> = _history.asStateFlow()

    // Graph Data
    private val _graphData = MutableStateFlow<com.virtualmind.core.network.GraphDataResponse?>(null)
    val graphData: StateFlow<com.virtualmind.core.network.GraphDataResponse?> = _graphData.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        // IMMEDIATE: Set defaults so the UI appears instantly
        val initialProtocols = listOf("pushups", "pullups", "squats", "core")
        _protocolOrder.value = initialProtocols
        _homeCounters.value = initialProtocols.associateWith { 0 }
        _fatigueLevels.value = mapOf(
            "chest" to Pair(0f, 1f),
            "back" to Pair(0f, 1f),
            "legs" to Pair(0f, 1f),
            "core" to Pair(0f, 1f)
        )
        _isLoading.value = false

        // BACKGROUND: Sync from cloud without blocking UI
        viewModelScope.launch {
            try {
                val localDate = getLocalDateString()
                val todayResponse = fitnessApi.getTodayWorkout(localDate = localDate)
                _isLogged.value = todayResponse.logged
                _isRestDay.value = todayResponse.workout?.isRestDay ?: false

                val homeResponse = fitnessApi.getHomeProtocolsToday(localDate = localDate)
                val counters = mutableMapOf<String, Int>()
                homeResponse.forEach { (key, value) ->
                    if (key != "_id" && key != "_order" && key != "date") {
                        counters[key] = (value as? Double)?.toInt() ?: 0
                    }
                }
                if (counters.isNotEmpty()) {
                    _homeCounters.value = counters
                    _protocolOrder.value = counters.keys.toList()
                }

                _history.value = fitnessApi.getHistory(limit = 10, localDate = localDate)
                
                try {
                    _graphData.value = fitnessApi.getGraphData(days = 14, localDate = localDate)
                } catch (e: Exception) {
                    e.printStackTrace()
                }

                try {
                    val heatmapResponse = fitnessApi.getHeatmap(days = 7, localDate = localDate)
                    val newFatigue = mutableMapOf<String, Pair<Float, Float>>()
                    val muscles = listOf("chest", "back", "legs", "core")
                    for (muscle in muscles) {
                        val rawAct = (heatmapResponse.activation[muscle] as? Number)?.toFloat() ?: 0f
                        val rawArm = (heatmapResponse.armor[muscle] as? Number)?.toFloat() ?: 0f
                        newFatigue[muscle] = Pair(rawAct / 100f, rawArm / 100f)
                    }
                    _fatigueLevels.value = newFatigue
                } catch (e: Exception) {
                    e.printStackTrace()
                }

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
            updateFatigue(id, 1)

            try {
                fitnessApi.incrementProtocol(ProtocolCountRequest(id, 1))
            } catch (e: Exception) {
                e.printStackTrace()
                // Rollback on failure
                current[id] = (current[id] ?: 1) - 1
                _homeCounters.value = current
                updateFatigue(id, -1)
            }
        }
    }

    private fun updateFatigue(protocolId: String, delta: Int) {
        val muscle = when (protocolId) {
            "pushups" -> "chest"
            "pullups" -> "back"
            "squats" -> "legs"
            "core" -> "core"
            else -> "core"
        }
        val currentFatigue = _fatigueLevels.value.toMutableMap()
        val current = currentFatigue[muscle] ?: Pair(0f, 1f)
        // Activation increases, Armor decreases
        val newActivation = (current.first + (delta * 0.1f)).coerceIn(0f, 1f)
        val newArmor = (current.second - (delta * 0.05f)).coerceIn(0f, 1f)
        currentFatigue[muscle] = Pair(newActivation, newArmor)
        _fatigueLevels.value = currentFatigue
    }

    fun decrementProtocol(id: String) {
        viewModelScope.launch {
            val currentCount = _homeCounters.value[id] ?: 0
            if (currentCount > 0) {
                // Optimistic UI update
                val current = _homeCounters.value.toMutableMap()
                current[id] = currentCount - 1
                _homeCounters.value = current
                updateFatigue(id, -1)

                try {
                    fitnessApi.decrementProtocol(ProtocolCountRequest(id, 1))
                } catch (e: Exception) {
                    e.printStackTrace()
                    // Rollback
                    current[id] = currentCount
                    _homeCounters.value = current
                    updateFatigue(id, 1)
                }
            }
        }
    }

    fun removeProtocol(id: String) {
        val currentOrder = _protocolOrder.value.toMutableList()
        currentOrder.remove(id)
        _protocolOrder.value = currentOrder
        
        val currentCounters = _homeCounters.value.toMutableMap()
        currentCounters.remove(id)
        _homeCounters.value = currentCounters
    }

    fun reorderProtocols(fromIndex: Int, toIndex: Int) {
        val currentOrder = _protocolOrder.value.toMutableList()
        val item = currentOrder.removeAt(fromIndex)
        currentOrder.add(toIndex, item)
        _protocolOrder.value = currentOrder
    }

    fun startSession(onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                val response = fitnessApi.startSession(targetDate = getLocalDateString())
                // Always proceed to session natively for now (Offline Defense approach)
                onSuccess()
            } catch (e: Exception) {
                e.printStackTrace()
                // If it fails (maybe offline), still allow them to enter the session natively
                onSuccess()
            }
        }
    }
}
