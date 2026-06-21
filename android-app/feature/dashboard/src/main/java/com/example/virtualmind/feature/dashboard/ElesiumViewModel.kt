package com.example.virtualmind.feature.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.virtualmind.core.data.local.dao.ContentItemDao
import com.virtualmind.core.data.local.dao.ProcessTaskDao
import com.virtualmind.core.data.local.entity.ContentItemEntity
import com.virtualmind.core.data.local.entity.ProcessTaskEntity
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

import com.virtualmind.core.network.FitnessApi
import com.virtualmind.core.network.ProtocolCountRequest

@HiltViewModel
class ElesiumViewModel @Inject constructor(
    private val contentDao: ContentItemDao,
    private val processDao: ProcessTaskDao,
    private val fitnessApi: FitnessApi
) : ViewModel() {

    // Tab State: 0 = Content, 1 = Processes
    private val _selectedTab = MutableStateFlow(0)
    val selectedTab: StateFlow<Int> = _selectedTab.asStateFlow()

    // Data Flows from Room
    val contentItems: StateFlow<List<ContentItemEntity>> = contentDao.getAllContentItems()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val processTasks: StateFlow<List<ProcessTaskEntity>> = processDao.getAllProcessTasks()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Timer Job
    private var activeTimerJob: Job? = null
    
    // UI Events (like showing the Pushup Dialog)
    private val _showPushupDialog = MutableStateFlow<ProcessTaskEntity?>(null)
    val showPushupDialog: StateFlow<ProcessTaskEntity?> = _showPushupDialog.asStateFlow()

    fun selectTab(index: Int) {
        _selectedTab.value = index
    }

    // --- Content Engine ---
    fun addContentItem(title: String, platform: String) {
        viewModelScope.launch {
            contentDao.insertContentItem(
                ContentItemEntity(
                    title = title,
                    platform = platform,
                    status = "Draft",
                    scheduledDateMillis = System.currentTimeMillis() + 86400000 // default tomorrow
                )
            )
        }
    }

    fun updateContentStatus(item: ContentItemEntity, newStatus: String) {
        viewModelScope.launch {
            contentDao.updateContentItem(item.copy(status = newStatus))
        }
    }

    // --- Processes Engine ---
    fun addProcessTask(questionnaire: String, minutes: Int) {
        viewModelScope.launch {
            processDao.insertProcessTask(
                ProcessTaskEntity(
                    questionnaireAnswers = questionnaire,
                    assignedMinutes = minutes,
                    status = "Pending",
                    remainingSeconds = minutes * 60
                )
            )
        }
    }

    fun startProcessTask(task: ProcessTaskEntity) {
        viewModelScope.launch {
            // Stop any existing timer
            activeTimerJob?.cancel()
            
            val updatedTask = task.copy(status = "Active")
            processDao.updateProcessTask(updatedTask)
            
            activeTimerJob = launch {
                var currentSeconds = updatedTask.remainingSeconds
                while (currentSeconds > 0) {
                    delay(1000)
                    currentSeconds--
                    processDao.updateProcessTask(updatedTask.copy(remainingSeconds = currentSeconds))
                }
                // Complete
                processDao.updateProcessTask(updatedTask.copy(status = "Completed", remainingSeconds = 0))
            }
        }
    }

    fun pauseProcessTask(task: ProcessTaskEntity) {
        activeTimerJob?.cancel()
        viewModelScope.launch {
            processDao.updateProcessTask(task.copy(status = "Paused"))
            // Trigger Fitness Interdependency
            _showPushupDialog.value = task
        }
    }

    fun submitPushupsAndResume(task: ProcessTaskEntity, pushups: Int) {
        _showPushupDialog.value = null
        viewModelScope.launch {
            try {
                if (pushups > 0) {
                    // POST directly to the remote cloud database
                    fitnessApi.incrementProtocol(ProtocolCountRequest(id = "pushups", amount = pushups))
                }
            } catch (e: Exception) {
                // If it fails, we still want to resume the timer, but we log the error
                e.printStackTrace()
            }
            
            // Resume the task
            startProcessTask(task)
        }
    }
    
    fun dismissPushupDialog() {
        _showPushupDialog.value = null
    }
}
