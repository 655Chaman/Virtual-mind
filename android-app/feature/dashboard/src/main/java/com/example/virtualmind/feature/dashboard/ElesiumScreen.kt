package com.example.virtualmind.feature.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.virtualmind.core.designsystem.theme.PillarElesium
import com.example.virtualmind.core.designsystem.theme.ShareTechMono
import com.virtualmind.core.data.local.entity.ContentItemEntity
import com.virtualmind.core.data.local.entity.ProcessTaskEntity
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ElesiumScreen(
    viewModel: ElesiumViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val selectedTab by viewModel.selectedTab.collectAsState()
    val showPushupDialog by viewModel.showPushupDialog.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020813)) // Deep cyber background
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "[ BACK ]",
                    color = PillarElesium,
                    fontFamily = ShareTechMono,
                    fontSize = 12.sp,
                    letterSpacing = 2.sp,
                    modifier = Modifier.clickable { onNavigateBack() }
                )
                Text(
                    text = "ELESIUM",
                    color = PillarElesium,
                    fontFamily = ShareTechMono,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    letterSpacing = 4.sp
                )
            }

            // Tabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .border(1.dp, PillarElesium.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
            ) {
                TabButton(
                    text = "CONTENT",
                    isSelected = selectedTab == 0,
                    modifier = Modifier.weight(1f)
                ) { viewModel.selectTab(0) }
                
                Box(modifier = Modifier.width(1.dp).height(40.dp).background(PillarElesium.copy(alpha = 0.3f)))
                
                TabButton(
                    text = "PROCESSES",
                    isSelected = selectedTab == 1,
                    modifier = Modifier.weight(1f)
                ) { viewModel.selectTab(1) }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Tab Content
            Box(modifier = Modifier.weight(1f).padding(horizontal = 24.dp)) {
                if (selectedTab == 0) {
                    ContentTab(viewModel)
                } else {
                    ProcessesTab(viewModel)
                }
            }
        }

        // Pushup Dialog Interdependency
        if (showPushupDialog != null) {
            PushupPenaltyDialog(
                task = showPushupDialog!!,
                onSubmit = { pushups -> viewModel.submitPushupsAndResume(showPushupDialog!!, pushups) },
                onDismiss = { viewModel.dismissPushupDialog() }
            )
        }
    }
}

@Composable
fun TabButton(text: String, isSelected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Box(
        modifier = modifier
            .background(if (isSelected) PillarElesium.copy(alpha = 0.2f) else Color.Transparent)
            .clickable { onClick() }
            .padding(vertical = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (isSelected) PillarElesium else PillarElesium.copy(alpha = 0.5f),
            fontFamily = ShareTechMono,
            fontSize = 14.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            letterSpacing = 2.sp
        )
    }
}

@Composable
fun ContentTab(viewModel: ElesiumViewModel) {
    val contentItems by viewModel.contentItems.collectAsState()
    var newTitle by remember { mutableStateOf("") }
    var newPlatform by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        // Add Content Form
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF050C18), RoundedCornerShape(4.dp))
                .border(1.dp, PillarElesium.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                .padding(16.dp)
        ) {
            Column {
                Text(
                    text = "SCHEDULE NEW CONTENT",
                    color = PillarElesium.copy(alpha = 0.7f),
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
                BasicTextField(
                    value = newTitle,
                    onValueChange = { newTitle = it },
                    textStyle = TextStyle(color = Color.White, fontFamily = ShareTechMono, fontSize = 14.sp),
                    cursorBrush = SolidColor(PillarElesium),
                    decorationBox = { inner ->
                        if (newTitle.isEmpty()) Text("Title (e.g. Thread on Focus)", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 14.sp)
                        inner()
                    },
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                )
                BasicTextField(
                    value = newPlatform,
                    onValueChange = { newPlatform = it },
                    textStyle = TextStyle(color = Color.White, fontFamily = ShareTechMono, fontSize = 14.sp),
                    cursorBrush = SolidColor(PillarElesium),
                    decorationBox = { inner ->
                        if (newPlatform.isEmpty()) Text("Platform (e.g. X, LinkedIn)", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 14.sp)
                        inner()
                    },
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                )
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(PillarElesium.copy(alpha = 0.2f))
                        .border(1.dp, PillarElesium)
                        .clickable {
                            if (newTitle.isNotBlank() && newPlatform.isNotBlank()) {
                                viewModel.addContentItem(newTitle, newPlatform)
                                newTitle = ""
                                newPlatform = ""
                            }
                        }
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("ADD TO CALENDAR", color = PillarElesium, fontFamily = ShareTechMono, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Calendar List
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(contentItems) { item ->
                ContentCard(item, onStatusChange = { newStatus -> viewModel.updateContentStatus(item, newStatus) })
            }
        }
    }
}

@Composable
fun ContentCard(item: ContentItemEntity, onStatusChange: (String) -> Unit) {
    val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF050C18), RoundedCornerShape(4.dp))
            .border(1.dp, PillarElesium.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = item.platform.uppercase(), color = PillarElesium.copy(alpha = 0.8f), fontFamily = ShareTechMono, fontSize = 10.sp, letterSpacing = 1.sp)
                Text(text = dateFormat.format(Date(item.scheduledDateMillis)), color = Color.Gray, fontFamily = ShareTechMono, fontSize = 10.sp)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = item.title, color = Color.White, fontFamily = ShareTechMono, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Spacer(modifier = Modifier.height(16.dp))
            
            // Status Toggles
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("Draft", "Scheduled", "Uploaded").forEach { status ->
                    val isSelected = item.status == status
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(if (isSelected) PillarElesium.copy(alpha = 0.2f) else Color.Transparent)
                            .border(1.dp, if (isSelected) PillarElesium else PillarElesium.copy(alpha = 0.2f), RoundedCornerShape(2.dp))
                            .clickable { onStatusChange(status) }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = status.uppercase(), color = if (isSelected) PillarElesium else Color.Gray, fontFamily = ShareTechMono, fontSize = 10.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal)
                    }
                }
            }
        }
    }
}

@Composable
fun ProcessesTab(viewModel: ElesiumViewModel) {
    val tasks by viewModel.processTasks.collectAsState()
    var newQuestionnaire by remember { mutableStateOf("") }
    var newMinutes by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        // Add Task Form
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF050C18), RoundedCornerShape(4.dp))
                .border(1.dp, PillarElesium.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                .padding(16.dp)
        ) {
            Column {
                Text(
                    text = "INITIALIZE NEW PROCESS",
                    color = PillarElesium.copy(alpha = 0.7f),
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
                BasicTextField(
                    value = newQuestionnaire,
                    onValueChange = { newQuestionnaire = it },
                    textStyle = TextStyle(color = Color.White, fontFamily = ShareTechMono, fontSize = 14.sp),
                    cursorBrush = SolidColor(PillarElesium),
                    decorationBox = { inner ->
                        if (newQuestionnaire.isEmpty()) Text("Task Description / Questionnaire...", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 14.sp)
                        inner()
                    },
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                )
                BasicTextField(
                    value = newMinutes,
                    onValueChange = { newMinutes = it },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    textStyle = TextStyle(color = Color.White, fontFamily = ShareTechMono, fontSize = 14.sp),
                    cursorBrush = SolidColor(PillarElesium),
                    decorationBox = { inner ->
                        if (newMinutes.isEmpty()) Text("Assigned Minutes (e.g. 60)", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 14.sp)
                        inner()
                    },
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                )
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(PillarElesium.copy(alpha = 0.2f))
                        .border(1.dp, PillarElesium)
                        .clickable {
                            val mins = newMinutes.toIntOrNull()
                            if (newQuestionnaire.isNotBlank() && mins != null && mins > 0) {
                                viewModel.addProcessTask(newQuestionnaire, mins)
                                newQuestionnaire = ""
                                newMinutes = ""
                            }
                        }
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("CREATE PROCESS", color = PillarElesium, fontFamily = ShareTechMono, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Tasks List
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(tasks) { task ->
                ProcessCard(
                    task = task,
                    onStart = { viewModel.startProcessTask(task) },
                    onPause = { viewModel.pauseProcessTask(task) }
                )
            }
        }
    }
}

@Composable
fun ProcessCard(task: ProcessTaskEntity, onStart: () -> Unit, onPause: () -> Unit) {
    val isRunning = task.status == "Active"
    val isCompleted = task.status == "Completed"
    
    val minutesLeft = task.remainingSeconds / 60
    val secondsLeft = task.remainingSeconds % 60
    val timeString = String.format("%02d:%02d", minutesLeft, secondsLeft)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF050C18), RoundedCornerShape(4.dp))
            .border(1.dp, if (isRunning) PillarElesium else PillarElesium.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(text = task.status.uppercase(), color = if (isRunning) PillarElesium else Color.Gray, fontFamily = ShareTechMono, fontSize = 10.sp, letterSpacing = 2.sp)
                Text(text = timeString, color = if (isRunning) PillarElesium else Color.White, fontFamily = ShareTechMono, fontWeight = FontWeight.Bold, fontSize = 24.sp)
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = task.questionnaireAnswers, color = Color.White.copy(alpha = 0.9f), fontFamily = ShareTechMono, fontSize = 14.sp)
            
            if (!isCompleted) {
                Spacer(modifier = Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (isRunning) Color(0xFF1E1E1E) else PillarElesium.copy(alpha = 0.2f))
                        .border(1.dp, if (isRunning) Color.Gray else PillarElesium)
                        .clickable { if (isRunning) onPause() else onStart() }
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (isRunning) "PAUSE WORK" else "START WORK", 
                        color = if (isRunning) Color.White else PillarElesium, 
                        fontFamily = ShareTechMono, 
                        fontWeight = FontWeight.Bold, 
                        fontSize = 12.sp,
                        letterSpacing = 2.sp
                    )
                }
            }
        }
    }
}

@Composable
fun PushupPenaltyDialog(task: ProcessTaskEntity, onSubmit: (Int) -> Unit, onDismiss: () -> Unit) {
    var pushups by remember { mutableStateOf("") }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.9f))
            .clickable { onDismiss() },
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .width(300.dp)
                .background(Color(0xFF050C18), RoundedCornerShape(8.dp))
                .border(2.dp, PillarElesium, RoundedCornerShape(8.dp))
                .clickable(enabled = false) {} // block click
                .padding(24.dp)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "PROCESS PAUSED",
                    color = Color.Red,
                    fontFamily = ShareTechMono,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                Text(
                    text = "Will you do push-ups?",
                    color = Color.White,
                    fontFamily = ShareTechMono,
                    fontSize = 16.sp,
                    modifier = Modifier.padding(bottom = 24.dp)
                )
                BasicTextField(
                    value = pushups,
                    onValueChange = { pushups = it },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    textStyle = TextStyle(color = PillarElesium, fontFamily = ShareTechMono, fontSize = 24.sp, fontWeight = FontWeight.Bold),
                    cursorBrush = SolidColor(PillarElesium),
                    decorationBox = { inner ->
                        if (pushups.isEmpty()) Text("0", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        inner()
                    },
                    modifier = Modifier.padding(bottom = 32.dp)
                )
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, Color.Gray)
                            .clickable { onDismiss() }
                            .padding(12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("CANCEL", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 12.sp)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(PillarElesium)
                            .clickable {
                                val p = pushups.toIntOrNull() ?: 0
                                onSubmit(p)
                            }
                            .padding(12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("LOG & RESUME", color = Color.Black, fontFamily = ShareTechMono, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
