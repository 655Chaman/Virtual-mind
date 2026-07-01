package com.example.virtualmind.feature.dashboard

import android.content.Context
import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.virtualmind.core.network.HydrationInput
import com.virtualmind.core.network.ReadinessInput
import com.virtualmind.core.network.WellnessApi
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

// ─── Hydration Goal (glasses) ──────────────────────────────────────────────────
private const val HYDRATION_GOAL_GLASSES = 16  // ~4L (250ml/glass)
private const val ML_PER_GLASS = 250

// ─── Fasting Goal (minutes) ───────────────────────────────────────────────────
private const val FAST_GOAL_MINUTES = 960f // 16 hours

@HiltViewModel
class WellnessViewModel @Inject constructor(
    private val wellnessApi: WellnessApi,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("virtual_mind_prefs", Context.MODE_PRIVATE)

    // ── Loading ────────────────────────────────────────────────────────────────
    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // ── Sleep ──────────────────────────────────────────────────────────────────
    private val _isSleeping = MutableStateFlow(false)
    val isSleeping: StateFlow<Boolean> = _isSleeping.asStateFlow()

    private val _sleepDurationHours = MutableStateFlow(0f)
    val sleepDurationHours: StateFlow<Float> = _sleepDurationHours.asStateFlow()

    private val _sleepScore = MutableStateFlow(0)
    val sleepScore: StateFlow<Int> = _sleepScore.asStateFlow()

    private val _sleepLabel = MutableStateFlow("")
    val sleepLabel: StateFlow<String> = _sleepLabel.asStateFlow()

    // ── Readiness ──────────────────────────────────────────────────────────────
    private val _readinessLogged = MutableStateFlow(false)
    val readinessLogged: StateFlow<Boolean> = _readinessLogged.asStateFlow()

    private val _readinessEnergy = MutableStateFlow(3)
    val readinessEnergy: StateFlow<Int> = _readinessEnergy.asStateFlow()

    private val _readinessClarity = MutableStateFlow(3)
    val readinessClarity: StateFlow<Int> = _readinessClarity.asStateFlow()

    private val _readinessMood = MutableStateFlow(3)
    val readinessMood: StateFlow<Int> = _readinessMood.asStateFlow()

    // ── Fasting ────────────────────────────────────────────────────────────────
    private val _isFastingActive = MutableStateFlow(false)
    val isFastingActive: StateFlow<Boolean> = _isFastingActive.asStateFlow()

    private val _fastingElapsedMinutes = MutableStateFlow(0f)
    val fastingElapsedMinutes: StateFlow<Float> = _fastingElapsedMinutes.asStateFlow()

    private val _fastingProgress = MutableStateFlow(0f)
    val fastingProgress: StateFlow<Float> = _fastingProgress.asStateFlow()

    private val _fastingPhase = MutableStateFlow("INITIATE PROTOCOL")
    val fastingPhase: StateFlow<String> = _fastingPhase.asStateFlow()

    private var fastingTickerJob: Job? = null

    // ── Hydration ──────────────────────────────────────────────────────────────
    /** Glasses count (derived from totalMl / ML_PER_GLASS) */
    private val _hydrationGlasses = MutableStateFlow(0)
    val hydrationGlasses: StateFlow<Int> = _hydrationGlasses.asStateFlow()

    private val _hydrationGoalGlasses = MutableStateFlow(HYDRATION_GOAL_GLASSES)
    val hydrationGoalGlasses: StateFlow<Int> = _hydrationGoalGlasses.asStateFlow()

    init {
        loadAll()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT / LOAD
    // ─────────────────────────────────────────────────────────────────────────

    private fun loadAll() {
        viewModelScope.launch {
            // Show UI instantly with sensible defaults
            _isLoading.value = false

            // Parallel cloud sync
            launch { loadSleep() }
            launch { loadFasting() }
            launch { loadHydration() }
            launch { loadReadiness() }
        }
    }

    private suspend fun loadSleep() {
        try {
            val status = wellnessApi.getSleepToday()
            _isSleeping.value = status.isSleeping
            _sleepDurationHours.value = status.lastSleepHours?.toFloat() ?: 0f

            // Sync sleep lock to SleepEnforcerService if currently sleeping
            if (status.isSleeping && status.sleepStartTime != null) {
                // When sleeping, SleepEnforcerService reads sleep_unlock_time from prefs.
                // We set unlock time = wake_hour from sleep protocol (default 5 AM).
                val wakeHour = prefs.getInt("sleep_wake_hour", 5)
                val now = System.currentTimeMillis()
                val cal = java.util.Calendar.getInstance()
                cal.set(java.util.Calendar.HOUR_OF_DAY, wakeHour)
                cal.set(java.util.Calendar.MINUTE, 0)
                cal.set(java.util.Calendar.SECOND, 0)
                // If wake time is earlier than now (same day), push to tomorrow
                if (cal.timeInMillis < now) cal.add(java.util.Calendar.DAY_OF_YEAR, 1)
                prefs.edit().putLong("sleep_unlock_time", cal.timeInMillis).apply()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private suspend fun loadFasting() {
        try {
            val status = wellnessApi.getFastToday()
            _isFastingActive.value = status.isFasting
            if (status.isFasting) {
                val elapsed = status.elapsedMinutes?.toFloat() ?: 0f
                _fastingElapsedMinutes.value = elapsed
                _fastingProgress.value = (elapsed / FAST_GOAL_MINUTES).coerceIn(0f, 1f)
                _fastingPhase.value = status.fastPhase ?: computeLocalPhase(elapsed)
                startFastingTicker()
            } else {
                _fastingPhase.value = "INITIATE PROTOCOL"
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private suspend fun loadHydration() {
        try {
            val status = wellnessApi.getHydrationToday()
            val totalMl = status.totalMl ?: 0
            _hydrationGlasses.value = totalMl / ML_PER_GLASS
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private suspend fun loadReadiness() {
        try {
            val status = wellnessApi.getReadinessToday()
            if (status.logged) {
                _readinessLogged.value = true
                _sleepScore.value = status.score ?: 0
                _sleepLabel.value = status.label ?: ""
                _readinessEnergy.value = status.energy ?: 3
                _readinessClarity.value = status.clarity ?: 3
                _readinessMood.value = status.mood ?: 3
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SLEEP ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    fun toggleSleep() {
        viewModelScope.launch {
            val currentlySleeping = _isSleeping.value
            // Optimistic UI
            _isSleeping.value = !currentlySleeping
            try {
                if (!currentlySleeping) {
                    // Starting sleep
                    wellnessApi.startSleep()
                    // Lock phone via SleepEnforcerService
                    val wakeHour = prefs.getInt("sleep_wake_hour", 5)
                    val cal = java.util.Calendar.getInstance()
                    cal.set(java.util.Calendar.HOUR_OF_DAY, wakeHour)
                    cal.set(java.util.Calendar.MINUTE, 0)
                    cal.set(java.util.Calendar.SECOND, 0)
                    if (cal.timeInMillis < System.currentTimeMillis()) {
                        cal.add(java.util.Calendar.DAY_OF_YEAR, 1)
                    }
                    prefs.edit().putLong("sleep_unlock_time", cal.timeInMillis).apply()
                } else {
                    // Waking up
                    val resp = wellnessApi.stopSleep()
                    _sleepDurationHours.value = resp.durationHours?.toFloat() ?: 0f
                    // Clear sleep lock
                    prefs.edit().putLong("sleep_unlock_time", 0L).apply()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                // Rollback
                _isSleeping.value = currentlySleeping
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READINESS ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    fun setReadinessEnergy(v: Int) { _readinessEnergy.value = v.coerceIn(1, 5) }
    fun setReadinessClarity(v: Int) { _readinessClarity.value = v.coerceIn(1, 5) }
    fun setReadinessMood(v: Int) { _readinessMood.value = v.coerceIn(1, 5) }

    fun lockReadiness() {
        viewModelScope.launch {
            try {
                val resp = wellnessApi.logReadiness(
                    ReadinessInput(
                        energy = _readinessEnergy.value,
                        clarity = _readinessClarity.value,
                        mood = _readinessMood.value
                    )
                )
                _sleepScore.value = resp.score
                _readinessLogged.value = true
                // Map score to label locally
                _sleepLabel.value = when {
                    resp.score >= 13 -> "PEAK STATE"
                    resp.score >= 10 -> "OPERATIONAL"
                    resp.score >= 7  -> "SUBOPTIMAL"
                    else             -> "RECOVERY NEEDED"
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FASTING ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    fun toggleFasting() {
        viewModelScope.launch {
            val wasActive = _isFastingActive.value
            // Optimistic UI
            _isFastingActive.value = !wasActive
            try {
                if (!wasActive) {
                    wellnessApi.startFast()
                    _fastingElapsedMinutes.value = 0f
                    _fastingProgress.value = 0f
                    _fastingPhase.value = "GLYCOGEN BURNING"
                    startFastingTicker()
                } else {
                    stopFastingTicker()
                    wellnessApi.stopFast()
                    _fastingElapsedMinutes.value = 0f
                    _fastingProgress.value = 0f
                    _fastingPhase.value = "INITIATE PROTOCOL"
                }
            } catch (e: Exception) {
                e.printStackTrace()
                // Rollback
                _isFastingActive.value = wasActive
                if (wasActive) startFastingTicker() else stopFastingTicker()
            }
        }
    }

    /**
     * Real-time ticker that increments elapsed fast time every 30 seconds
     * and re-calculates progress + phase without a server round-trip.
     */
    private fun startFastingTicker() {
        stopFastingTicker()
        fastingTickerJob = viewModelScope.launch {
            while (isActive) {
                delay(30_000L) // 30-second resolution
                val elapsed = _fastingElapsedMinutes.value + 0.5f // +30 sec
                _fastingElapsedMinutes.value = elapsed
                _fastingProgress.value = (elapsed / FAST_GOAL_MINUTES).coerceIn(0f, 1f)
                _fastingPhase.value = computeLocalPhase(elapsed)
            }
        }
    }

    private fun stopFastingTicker() {
        fastingTickerJob?.cancel()
        fastingTickerJob = null
    }

    private fun computeLocalPhase(elapsedMinutes: Float): String {
        val h = elapsedMinutes / 60f
        return when {
            h < 12f  -> "GLYCOGEN BURNING"
            h < 14f  -> "FAT BURNING INITIATED"
            h < 16f  -> "KETOSIS APPROACHING"
            h < 18f  -> "AUTOPHAGY ACTIVE"
            else     -> "DEEP AUTOPHAGY — CELLULAR REPAIR"
        }
    }

    override fun onCleared() {
        super.onCleared()
        stopFastingTicker()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HYDRATION ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    fun addGlass() {
        if (_hydrationGlasses.value >= HYDRATION_GOAL_GLASSES) return
        viewModelScope.launch {
            // Optimistic
            _hydrationGlasses.value += 1
            try {
                wellnessApi.addHydration(HydrationInput(amountMl = ML_PER_GLASS))
            } catch (e: Exception) {
                e.printStackTrace()
                // Rollback
                _hydrationGlasses.value -= 1
            }
        }
    }

    fun removeGlass() {
        if (_hydrationGlasses.value <= 0) return
        // Note: Backend has no "remove" endpoint, so we only update local state.
        // If user made a mistake, they can undo locally; next app open syncs true DB value.
        _hydrationGlasses.value -= 1
    }
}
