package com.example.virtualmind.feature.dashboard

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.virtualmind.core.designsystem.theme.PillarOracle
import com.example.virtualmind.core.designsystem.theme.ShareTechMono

@Composable
fun OracleScreen(
    viewModel: OracleViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val syncResult by viewModel.syncResult.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    var answersText by remember { mutableStateOf("") }
    val scrollState = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Background Matrix Grid
        // (A simple visual effect could be added here later)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
                .verticalScroll(scrollState)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "[ ABORT SYNC ]",
                    color = PillarOracle,
                    fontFamily = ShareTechMono,
                    fontSize = 12.sp,
                    letterSpacing = 2.sp,
                    modifier = Modifier.clickable { onNavigateBack() }
                )
                Text(
                    text = "THE ORACLE",
                    color = PillarOracle.copy(alpha = 0.5f),
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    letterSpacing = 3.sp
                )
            }

            Spacer(modifier = Modifier.height(48.dp))

            when (uiState) {
                OracleState.LOADING -> {
                    Text(
                        text = "> INITIATING NIGHTLY SYNC",
                        color = PillarOracle,
                        fontFamily = ShareTechMono,
                        fontWeight = FontWeight.Bold,
                        fontSize = 24.sp,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Text(
                        text = "Analyzing neural patterns. Identifying schedule deviations. Prioritizing consistency algorithms...",
                        color = PillarOracle.copy(alpha = 0.6f),
                        fontFamily = ShareTechMono,
                        fontSize = 12.sp,
                        lineHeight = 18.sp
                    )
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    val infiniteTransition = rememberInfiniteTransition()
                    val pulseAlpha by infiniteTransition.animateFloat(
                        initialValue = 0.3f,
                        targetValue = 1f,
                        animationSpec = infiniteRepeatable(tween(1000), RepeatMode.Reverse)
                    )
                    Text(
                        text = "> Loading Oracle matrix...",
                        color = PillarOracle.copy(alpha = pulseAlpha),
                        fontFamily = ShareTechMono,
                        fontSize = 14.sp
                    )
                }

                OracleState.AWAITING_INPUT, OracleState.PROCESSING -> {
                    Text(
                        text = "> INITIATING NIGHTLY SYNC",
                        color = PillarOracle,
                        fontFamily = ShareTechMono,
                        fontWeight = FontWeight.Bold,
                        fontSize = 24.sp,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    val questions = listOf(
                        "How did your energy levels feel today?",
                        "Do you have any major schedule disruptions tomorrow (e.g. travel, Ramadan)?",
                        "What is the ONE simple thing you must do tomorrow to maintain consistency?"
                    )

                    questions.forEachIndexed { index, q ->
                        Row(modifier = Modifier.padding(bottom = 16.dp)) {
                            Text(
                                text = "0${index + 1}.",
                                color = PillarOracle.copy(alpha = 0.5f),
                                fontFamily = ShareTechMono,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = q,
                                color = PillarOracle,
                                fontFamily = ShareTechMono,
                                fontSize = 14.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(150.dp)
                            .background(Color(0xFF062310).copy(alpha = 0.5f), RoundedCornerShape(4.dp))
                            .border(1.dp, PillarOracle.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                            .padding(16.dp)
                    ) {
                        BasicTextField(
                            value = answersText,
                            onValueChange = { answersText = it },
                            modifier = Modifier.fillMaxSize(),
                            textStyle = TextStyle(color = PillarOracle, fontFamily = ShareTechMono, fontSize = 14.sp),
                            cursorBrush = SolidColor(PillarOracle),
                            enabled = uiState == OracleState.AWAITING_INPUT,
                            decorationBox = { innerTextField ->
                                if (answersText.isEmpty()) {
                                    Text("Provide your context for tomorrow...", color = PillarOracle.copy(alpha = 0.4f), fontFamily = ShareTechMono, fontSize = 14.sp)
                                }
                                innerTextField()
                            }
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    val isProcessing = uiState == OracleState.PROCESSING
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(if (isProcessing) PillarOracle.copy(alpha = 0.5f) else PillarOracle)
                            .clickable(enabled = !isProcessing && answersText.isNotBlank()) {
                                viewModel.executeSync(answersText)
                            }
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (isProcessing) "REPROGRAMMING TOMORROW..." else "EXECUTE SYNC",
                            color = Color.Black,
                            fontFamily = ShareTechMono,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            letterSpacing = 2.sp
                        )
                    }
                }

                OracleState.COMPLETE -> {
                    syncResult?.let { result ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFF062310), RoundedCornerShape(4.dp))
                                .border(1.dp, PillarOracle.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                                .padding(24.dp)
                        ) {
                            Column {
                                Text(
                                    text = "SYSTEM ADJUSTMENT",
                                    color = PillarOracle.copy(alpha = 0.6f),
                                    fontFamily = ShareTechMono,
                                    fontSize = 12.sp,
                                    letterSpacing = 2.sp,
                                    modifier = Modifier.padding(bottom = 8.dp)
                                )
                                Text(
                                    text = "> ${result.leniencyAdjustments}",
                                    color = PillarOracle,
                                    fontFamily = ShareTechMono,
                                    fontSize = 14.sp,
                                    lineHeight = 20.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(32.dp))

                        Text(
                            text = result.tomorrowTheme,
                            color = PillarOracle,
                            fontFamily = ShareTechMono,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )

                        result.adjustedTasks.forEach { task ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 12.dp)
                            ) {
                                Box(modifier = Modifier.width(2.dp).height(40.dp).background(PillarOracle))
                                Spacer(modifier = Modifier.width(16.dp))
                                Column {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = task.taskName,
                                            color = Color.White,
                                            fontFamily = ShareTechMono,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = task.reason,
                                        color = Color.White.copy(alpha = 0.5f),
                                        fontFamily = ShareTechMono,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(48.dp))

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, PillarOracle)
                                .clickable { onNavigateBack() }
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "LOCK SYSTEM & SLEEP",
                                color = PillarOracle,
                                fontFamily = ShareTechMono,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                letterSpacing = 2.sp
                            )
                        }
                    }
                }

                OracleState.ERROR -> {
                    Text(
                        text = "> FATAL SYNC ERROR",
                        color = Color.Red,
                        fontFamily = ShareTechMono,
                        fontWeight = FontWeight.Bold,
                        fontSize = 24.sp,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Text(
                        text = errorMessage,
                        color = Color.Red.copy(alpha = 0.8f),
                        fontFamily = ShareTechMono,
                        fontSize = 14.sp
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, PillarOracle)
                            .clickable { viewModel.retry() }
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "RETRY SYNC",
                            color = PillarOracle,
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
}
