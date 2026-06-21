package com.example.virtualmind.feature.dashboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.virtualmind.core.designsystem.theme.PillarSelf
import com.example.virtualmind.core.designsystem.theme.ShareTechMono
import com.example.virtualmind.core.designsystem.theme.neonGlow
import com.valentinilk.shimmer.shimmer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SelfScreen(
    viewModel: SelfViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val isLoading by viewModel.isLoading.collectAsState()
    val triggers by viewModel.customTriggers.collectAsState()
    val securedTriggers by viewModel.securedTriggers.collectAsState()
    val disciplineScore by viewModel.disciplineScore.collectAsState()
    val isScoreLocked by viewModel.isScoreLocked.collectAsState()
    val books by viewModel.books.collectAsState()

    var isEditingTriggers by remember { mutableStateOf(false) }
    var newTriggerLabel by remember { mutableStateOf("") }
    var newTriggerDesc by remember { mutableStateOf("") }

    if (isLoading) {
        SelfShimmerLoader()
        return
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF020813))) {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "[ BACK ]",
                    color = PillarSelf,
                    fontFamily = ShareTechMono,
                    fontSize = 12.sp,
                    letterSpacing = 2.sp,
                    modifier = Modifier.clickable {
                        HapticEngine.tick(context)
                        onNavigateBack()
                    }
                )
                Text(
                    text = "INNER_CONSCIOUSNESS",
                    color = PillarSelf,
                    fontFamily = ShareTechMono,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    letterSpacing = 4.sp
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Trigger Avoidance Protocol
            Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "TRIGGER AVOIDANCE PROTOCOL", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                    Text(
                        text = if (isEditingTriggers) "DONE [X]" else "EDIT [+]",
                        color = PillarSelf,
                        fontFamily = ShareTechMono,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp,
                        modifier = Modifier.clickable { isEditingTriggers = !isEditingTriggers }
                    )
                }

                if (isEditingTriggers) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                            .background(Color(0xFF050C18), RoundedCornerShape(12.dp))
                            .border(1.dp, PillarSelf.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                            .padding(16.dp)
                    ) {
                        OutlinedTextField(
                            value = newTriggerLabel,
                            onValueChange = { newTriggerLabel = it },
                            placeholder = { Text("Trigger Label", color = Color.Gray, fontSize = 12.sp) },
                            textStyle = TextStyle(color = Color.White, fontFamily = ShareTechMono),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = PillarSelf,
                                unfocusedBorderColor = Color.Gray.copy(alpha = 0.3f)
                            ),
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                        )
                        OutlinedTextField(
                            value = newTriggerDesc,
                            onValueChange = { newTriggerDesc = it },
                            placeholder = { Text("Description", color = Color.Gray, fontSize = 12.sp) },
                            textStyle = TextStyle(color = Color.White, fontFamily = ShareTechMono),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = PillarSelf,
                                unfocusedBorderColor = Color.Gray.copy(alpha = 0.3f)
                            ),
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                        )
                        Text(
                            text = "ADD TRIGGER",
                            color = PillarSelf,
                            fontFamily = ShareTechMono,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clickable {
                                if (newTriggerLabel.isNotBlank()) {
                                    HapticEngine.click(context)
                                    viewModel.addTrigger(newTriggerLabel, newTriggerDesc)
                                    newTriggerLabel = ""
                                    newTriggerDesc = ""
                                }
                            }
                        )
                    }
                }

                triggers.forEach { trigger ->
                    val isSecured = securedTriggers[trigger.key] == true
                    val cardScale by animateFloatAsState(
                        targetValue = if (isSecured) 1f else 0.99f,
                        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
                        label = "triggerScale"
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .scale(cardScale)
                                .neonGlow(PillarSelf, radius = if (isSecured) 10.dp else 0.dp, alpha = 0.3f)
                                .background(if (isSecured) PillarSelf.copy(alpha = 0.15f) else Color(0xFF050C18), RoundedCornerShape(12.dp))
                                .border(1.dp, if (isSecured) PillarSelf else Color.White.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
                                .clickable {
                                    if (isSecured) HapticEngine.tick(context) else HapticEngine.click(context)
                                    viewModel.toggleTrigger(trigger.key, !isSecured)
                                }
                                .padding(16.dp)
                        ) {
                            Column {
                                Text(text = trigger.label.uppercase(), color = if (isSecured) PillarSelf else Color.White, fontFamily = ShareTechMono, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(text = trigger.desc.uppercase(), color = Color.Gray, fontFamily = ShareTechMono, fontSize = 8.sp, letterSpacing = 2.sp)
                                    Text(text = if (isSecured) "AVOIDED" else "UNSECURED", color = if (isSecured) PillarSelf else Color.Gray.copy(alpha = 0.5f), fontFamily = ShareTechMono, fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                                }
                            }
                        }
                        if (isEditingTriggers) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "[X]", color = Color.Red, fontFamily = ShareTechMono, modifier = Modifier.clickable { viewModel.removeTrigger(trigger.key) })
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(48.dp))

            // Accountability Score Widget
            Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                Text(text = "ACCOUNTABILITY SCORE", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp, modifier = Modifier.padding(bottom = 16.dp))
                Box(
                    modifier = Modifier.fillMaxWidth()
                        .neonGlow(PillarSelf, radius = if (isScoreLocked) 14.dp else 0.dp, alpha = 0.25f)
                        .background(Color(0xFF050C18), RoundedCornerShape(16.dp))
                        .border(1.dp, if (isScoreLocked) PillarSelf.copy(alpha = 0.6f) else Color.White.copy(alpha = 0.08f), RoundedCornerShape(16.dp))
                        .padding(24.dp)
                ) {
                    Column {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text(text = "DAILY RATING", color = Color.White, fontFamily = ShareTechMono, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                                if (isScoreLocked) Text(text = "LOCKED UNTIL MIDNIGHT", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 9.sp, letterSpacing = 2.sp)
                            }
                            // Animated score
                            val animatedScore by animateIntAsState(
                                targetValue = disciplineScore,
                                animationSpec = spring(stiffness = Spring.StiffnessLow),
                                label = "score"
                            )
                            Text(text = "$animatedScore/10", color = PillarSelf, fontFamily = ShareTechMono, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        }
                        if (!isScoreLocked) {
                            Spacer(modifier = Modifier.height(24.dp))
                            Slider(
                                value = disciplineScore.toFloat(),
                                onValueChange = { viewModel.setDisciplineScore(it.toInt()) },
                                valueRange = 1f..10f, steps = 8,
                                colors = SliderDefaults.colors(thumbColor = PillarSelf, activeTrackColor = PillarSelf, inactiveTrackColor = Color.DarkGray)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            val btnScale by animateFloatAsState(1f, spring(dampingRatio = Spring.DampingRatioHighBouncy), label = "btnScale")
                            Button(
                                onClick = {
                                    HapticEngine.thud(context)
                                    viewModel.lockDisciplineScore()
                                },
                                modifier = Modifier.fillMaxWidth().scale(btnScale),
                                colors = ButtonDefaults.buttonColors(containerColor = PillarSelf.copy(alpha = 0.1f)),
                                shape = RoundedCornerShape(8.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, PillarSelf.copy(alpha = 0.4f))
                            ) {
                                Text(text = "SECURE SCORE", color = PillarSelf, fontFamily = ShareTechMono, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(48.dp))

            // Reading Tracker
            Column(modifier = Modifier.padding(horizontal = 24.dp).padding(bottom = 60.dp)) {
                Row(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(text = "CURRENT READING", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                    Text(text = "ADD BOOK [+]", color = PillarSelf, fontFamily = ShareTechMono, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp,
                        modifier = Modifier.clickable { HapticEngine.click(context); viewModel.addBook() })
                }
                books.forEach { book ->
                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                        OutlinedTextField(
                            value = book.title,
                            onValueChange = { viewModel.updateBook(book.id, it, book.page) },
                            placeholder = { Text("Book Title", color = Color.Gray, fontSize = 12.sp) },
                            textStyle = TextStyle(color = Color.White, fontFamily = ShareTechMono, fontSize = 12.sp),
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PillarSelf, unfocusedBorderColor = Color.White.copy(alpha = 0.1f)),
                            modifier = Modifier.weight(1f).height(56.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        OutlinedTextField(
                            value = book.page.toString(),
                            onValueChange = { viewModel.updateBook(book.id, book.title, it.toIntOrNull() ?: 0) },
                            textStyle = TextStyle(color = PillarSelf, fontFamily = ShareTechMono, fontSize = 12.sp),
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PillarSelf, unfocusedBorderColor = Color.White.copy(alpha = 0.1f)),
                            modifier = Modifier.width(80.dp).height(56.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "[X]", color = Color.Red, fontFamily = ShareTechMono, modifier = Modifier.clickable { viewModel.removeBook(book.id) })
                    }
                }
            }
        }
    }
}

@Composable
fun SelfShimmerLoader() {
    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF020813))) {
        Column(modifier = Modifier.fillMaxSize().padding(24.dp).shimmer(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Spacer(modifier = Modifier.height(80.dp))
            repeat(4) { Box(modifier = Modifier.fillMaxWidth().height(72.dp).background(Color(0xFF0D0D1A), RoundedCornerShape(12.dp))) }
        }
    }
}
