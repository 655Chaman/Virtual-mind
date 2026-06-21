package com.example.virtualmind.feature.dashboard

import android.content.Context
import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.virtualmind.core.network.LogsApi
import com.virtualmind.core.network.SaveLogRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject

data class TriggerItem(val key: String, val label: String, val desc: String)
data class BookItem(val id: String, var title: String, var page: Int)

@HiltViewModel
class SelfViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val logsApi: LogsApi
) : ViewModel() {

    private val prefs: SharedPreferences = context.getSharedPreferences("virtual_mind_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // Triggers
    private val defaultTriggers = listOf(
        TriggerItem("no_sugar", "No Sugar Today", "Maintain metabolic purity"),
        TriggerItem("sleep_on_floor", "Slept on Floor", "Comfort lock engaged"),
        TriggerItem("cold_shower", "Cold Shower", "Neuro reset protocol"),
        TriggerItem("combat_training", "Combat Training", "Physical aggression outlet"),
        TriggerItem("learned_concept", "Deep Study", "Absorbed new concept")
    )
    private val _customTriggers = MutableStateFlow<List<TriggerItem>>(emptyList())
    val customTriggers: StateFlow<List<TriggerItem>> = _customTriggers.asStateFlow()

    private val _securedTriggers = MutableStateFlow<Map<String, Boolean>>(emptyMap())
    val securedTriggers: StateFlow<Map<String, Boolean>> = _securedTriggers.asStateFlow()

    // Discipline
    private val _disciplineScore = MutableStateFlow(5)
    val disciplineScore: StateFlow<Int> = _disciplineScore.asStateFlow()
    
    private val _isScoreLocked = MutableStateFlow(false)
    val isScoreLocked: StateFlow<Boolean> = _isScoreLocked.asStateFlow()

    // Reading Tracker
    private val _books = MutableStateFlow<List<BookItem>>(emptyList())
    val books: StateFlow<List<BookItem>> = _books.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        val savedTriggersJson = prefs.getString("vm_custom_triggers", null)
        if (savedTriggersJson != null) {
            val type = object : TypeToken<List<TriggerItem>>() {}.type
            _customTriggers.value = gson.fromJson(savedTriggersJson, type)
        } else {
            _customTriggers.value = defaultTriggers
        }

        val savedBooksJson = prefs.getString("vm_reading_books", null)
        if (savedBooksJson != null) {
            val type = object : TypeToken<List<BookItem>>() {}.type
            _books.value = gson.fromJson(savedBooksJson, type)
        }
        
        // Let's assume score resets daily. We can check the date.
        val lastScoreDate = prefs.getString("vm_last_score_date", "")
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        if (lastScoreDate == today) {
            _isScoreLocked.value = true
            _disciplineScore.value = prefs.getInt("vm_discipline_score", 5)
        }
    }

    fun addTrigger(label: String, desc: String) {
        val newTrigger = TriggerItem("custom_${System.currentTimeMillis()}", label, desc)
        val updated = _customTriggers.value + newTrigger
        _customTriggers.value = updated
        prefs.edit().putString("vm_custom_triggers", gson.toJson(updated)).apply()
    }

    fun removeTrigger(key: String) {
        val updated = _customTriggers.value.filter { it.key != key }
        _customTriggers.value = updated
        prefs.edit().putString("vm_custom_triggers", gson.toJson(updated)).apply()
    }

    fun toggleTrigger(key: String, isSecured: Boolean) {
        val updated = _securedTriggers.value.toMutableMap()
        updated[key] = isSecured
        _securedTriggers.value = updated

        // Sync to cloud as a non-negotiable
        syncLogs(updated, "Trigger protocol updated")
    }

    fun setDisciplineScore(score: Int) {
        if (!_isScoreLocked.value) {
            _disciplineScore.value = score
        }
    }

    fun lockDisciplineScore() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                val score = _disciplineScore.value
                val textLog = "[DISCIPLINE ENGINE] Self-reported accountability score: $score/10 today. Status: Focused, zero alarm overrides."
                
                logsApi.saveLog(
                    SaveLogRequest(
                        date = today,
                        timestamp = Date().toString(),
                        text = textLog,
                        pillars = listOf("SELF"),
                        nonNegotiables = _securedTriggers.value
                    )
                )

                _isScoreLocked.value = true
                prefs.edit()
                    .putString("vm_last_score_date", today)
                    .putInt("vm_discipline_score", score)
                    .apply()

            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun addBook() {
        val newBook = BookItem("b_${System.currentTimeMillis()}", "", 1)
        val updated = _books.value + newBook
        _books.value = updated
        saveBooks(updated)
    }

    fun updateBook(id: String, title: String, page: Int) {
        val updated = _books.value.map { if (it.id == id) it.copy(title = title, page = page) else it }
        _books.value = updated
        saveBooks(updated)
    }

    fun removeBook(id: String) {
        val updated = _books.value.filter { it.id != id }
        _books.value = updated
        saveBooks(updated)
    }

    private fun saveBooks(books: List<BookItem>) {
        prefs.edit().putString("vm_reading_books", gson.toJson(books)).apply()
    }

    private fun syncLogs(nns: Map<String, Boolean>, reason: String) {
        viewModelScope.launch {
            try {
                val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                logsApi.saveLog(
                    SaveLogRequest(
                        date = today,
                        timestamp = Date().toString(),
                        text = reason,
                        pillars = listOf("SELF"),
                        nonNegotiables = nns
                    )
                )
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
