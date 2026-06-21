package com.example.virtualmind.feature.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.virtualmind.core.network.DeenApi
import com.virtualmind.core.network.LogsApi
import com.virtualmind.core.network.PrayerHistoryResponse
import com.virtualmind.core.network.SaveLogRequest
import com.virtualmind.core.network.TasbihLogRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject

@HiltViewModel
class DeenViewModel @Inject constructor(
    private val deenApi: DeenApi,
    private val logsApi: LogsApi
) : ViewModel() {

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // Prayers
    private val _prayers = MutableStateFlow(mapOf(
        "fajr" to false,
        "dhuhr" to false,
        "asr" to false,
        "maghrib" to false,
        "isha" to false
    ))
    val prayers: StateFlow<Map<String, Boolean>> = _prayers.asStateFlow()

    // Habits (Non-negotiables)
    private val _habits = MutableStateFlow(mapOf(
        "fajr_without_alarm" to false,
        "adhkar" to false,
        "quran_30min" to false,
        "memorization_session" to false
    ))
    val habits: StateFlow<Map<String, Boolean>> = _habits.asStateFlow()

    // Tasbih Engine
    private val _tasbihPhase = MutableStateFlow("Subhan Allah")
    val tasbihPhase: StateFlow<String> = _tasbihPhase.asStateFlow()
    
    private val _tasbihCount = MutableStateFlow(0)
    val tasbihCount: StateFlow<Int> = _tasbihCount.asStateFlow()
    
    private val _tasbihTotal = MutableStateFlow(0)
    val tasbihTotal: StateFlow<Int> = _tasbihTotal.asStateFlow()

    private val phases = listOf("Subhan Allah", "Alhamdulillah", "Allahu Akbar", "Astaghfirullah")

    init {
        loadData()
    }

    private fun loadData() {
        // IMMEDIATE: Set isLoading false so screen appears instantly
        _isLoading.value = false

        // BACKGROUND: Sync cloud data silently
        viewModelScope.launch {
            try {
                val tasbihRes = deenApi.getTasbihHistory()
                if (tasbihRes != null) {
                    _tasbihTotal.value = tasbihRes.total
                }
                val prayerHistory = deenApi.getPrayerHistory(1)
                if (prayerHistory.isNotEmpty()) {
                    val today = prayerHistory.first()
                    _prayers.value = mapOf(
                        "fajr" to today.fajr,
                        "dhuhr" to today.dhuhr,
                        "asr" to today.asr,
                        "maghrib" to today.maghrib,
                        "isha" to today.isha
                    )
                }
            } catch (e: Exception) {
                // Server offline — defaults remain, user can still tap
                e.printStackTrace()
            }
        }
    }

    fun togglePrayer(prayer: String, isComplete: Boolean) {
        viewModelScope.launch {
            val updated = _prayers.value.toMutableMap()
            updated[prayer] = isComplete
            _prayers.value = updated

            try {
                deenApi.logPrayers(updated)
            } catch (e: Exception) {
                e.printStackTrace()
                // Rollback
                updated[prayer] = !isComplete
                _prayers.value = updated
            }
        }
    }

    fun toggleHabit(habitKey: String, isComplete: Boolean) {
        viewModelScope.launch {
            val updated = _habits.value.toMutableMap()
            updated[habitKey] = isComplete
            _habits.value = updated

            try {
                val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val todayStr = dateFormat.format(Date())
                
                logsApi.saveLog(
                    SaveLogRequest(
                        date = todayStr,
                        timestamp = Date().toString(),
                        text = "Updated spiritual habits from Native Deen terminal",
                        pillars = listOf("DEEN"),
                        nonNegotiables = updated
                    )
                )
            } catch (e: Exception) {
                e.printStackTrace()
                updated[habitKey] = !isComplete
                _habits.value = updated
            }
        }
    }

    fun handleTasbihTap() {
        viewModelScope.launch {
            val currentCount = _tasbihCount.value + 1
            _tasbihCount.value = currentCount
            
            val currentTotal = _tasbihTotal.value + 1
            _tasbihTotal.value = currentTotal

            // Phase cycling logic based on traditional 33-count limits
            if (currentCount >= 33 && _tasbihPhase.value != "Astaghfirullah") {
                _tasbihCount.value = 0
                val currentIndex = phases.indexOf(_tasbihPhase.value)
                if (currentIndex < phases.size - 1) {
                    _tasbihPhase.value = phases[currentIndex + 1]
                }
            }

            // Sync to backend
            try {
                deenApi.logTasbih(TasbihLogRequest(total = currentTotal))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun cycleTasbihPhase(forward: Boolean) {
        val currentIndex = phases.indexOf(_tasbihPhase.value)
        if (forward) {
            if (currentIndex < phases.size - 1) {
                _tasbihPhase.value = phases[currentIndex + 1]
                _tasbihCount.value = 0
            }
        } else {
            if (currentIndex > 0) {
                _tasbihPhase.value = phases[currentIndex - 1]
                _tasbihCount.value = 0
            }
        }
    }
}
