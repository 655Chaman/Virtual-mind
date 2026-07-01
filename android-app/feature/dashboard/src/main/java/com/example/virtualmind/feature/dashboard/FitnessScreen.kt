package com.example.virtualmind.feature.dashboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.material3.Icon
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.geometry.Offset
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.ui.input.pointer.pointerInput

import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.virtualmind.core.designsystem.theme.PillarFitness
import com.example.virtualmind.core.designsystem.theme.ShareTechMono
import com.example.virtualmind.core.designsystem.theme.neonCircleGlow
import com.example.virtualmind.core.designsystem.theme.neonGlow
import com.valentinilk.shimmer.shimmer

import co.yml.charts.ui.bubblechart.BubbleChart
import co.yml.charts.ui.bubblechart.model.BubbleChartData
import co.yml.charts.ui.bubblechart.model.Bubble
import co.yml.charts.common.model.Point
import co.yml.charts.axis.AxisData
import co.yml.charts.common.extensions.formatToSinglePrecision

@Composable
fun FitnessScreen(
    viewModel: FitnessViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit,
    onNavigateToSession: () -> Unit
) {
    val context = LocalContext.current
    val isLoading by viewModel.isLoading.collectAsState()
    val isLogged by viewModel.isLogged.collectAsState()
    val isRestDay by viewModel.isRestDay.collectAsState()
    val homeCounters by viewModel.homeCounters.collectAsState()
    val protocolOrder by viewModel.protocolOrder.collectAsState()
    val fatigueLevels by viewModel.fatigueLevels.collectAsState()
    val history by viewModel.history.collectAsState()
    val graphData by viewModel.graphData.collectAsState()

    if (isLoading) {
        FitnessShimmerLoader()
        return
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020813))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .verticalScroll(rememberScrollState())
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "[ BACK ]",
                    color = PillarFitness,
                    fontFamily = ShareTechMono,
                    fontSize = 12.sp,
                    letterSpacing = 2.sp,
                    modifier = Modifier.clickable {
                        HapticEngine.tick(context)
                        onNavigateBack()
                    }
                )
                Text(
                    text = "PHYSICAL_TRAINING",
                    color = PillarFitness,
                    fontFamily = ShareTechMono,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    letterSpacing = 4.sp
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Pulsing Main Initiation Ring
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                PulsingFitnessRing(
                    isLogged = isLogged,
                    isRestDay = isRestDay,
                    onClick = {
                        HapticEngine.thud(context)
                        viewModel.startSession {
                            onNavigateToSession()
                        }
                    }
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Body Heatmap
            Column(modifier = Modifier.padding(horizontal = 24.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "SYSTEM FATIGUE MAP",
                    color = Color.Gray,
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                BodyHeatmap(fatigueLevels = fatigueLevels)
            }

            Spacer(modifier = Modifier.height(48.dp))

            // Home Protocols
            Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                Text(
                    text = "HOME PROTOCOLS",
                    color = Color.Gray,
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                protocolOrder.forEachIndexed { index, id ->
                    val count = homeCounters[id] ?: 0
                    AnimatedProtocolCard(
                        id = id,
                        count = count,
                        onIncrement = {
                            HapticEngine.tick(context)
                            viewModel.incrementProtocol(id)
                        },
                        onDecrement = {
                            HapticEngine.tick(context)
                            viewModel.decrementProtocol(id)
                        },
                        onRemove = {
                            HapticEngine.thud(context)
                            viewModel.removeProtocol(id)
                        },
                        onMoveUp = {
                            if (index > 0) viewModel.reorderProtocols(index, index - 1)
                        },
                        onMoveDown = {
                            if (index < protocolOrder.size - 1) viewModel.reorderProtocols(index, index + 1)
                        }
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
            
            Spacer(modifier = Modifier.height(48.dp))
            
            // Intensity Bubble Graph (YCharts)
            if (graphData != null && graphData!!.volumes.isNotEmpty()) {
                Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                    Text(
                        text = "14-DAY INTENSITY MATRIX",
                        color = Color.Gray,
                        fontFamily = ShareTechMono,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                    
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                            .background(Color(0xFF050C18), RoundedCornerShape(12.dp))
                            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                            .padding(16.dp)
                    ) {
                        val maxVol = graphData!!.volumes.maxOrNull()?.coerceAtLeast(1) ?: 1
                        val bubbles = graphData!!.volumes.mapIndexed { index, vol ->
                            Bubble(
                                center = Point(index.toFloat(), vol.toFloat()),
                                density = (vol.toFloat() / maxVol.toFloat()) * 40f + 10f // Map volume to radius
                            )
                        }
                        
                        val xAxisData = AxisData.Builder()
                            .axisStepSize(30.dp)
                            .steps(bubbles.size - 1)
                            .labelData { i -> graphData!!.dates.getOrNull(i)?.takeLast(2) ?: "" }
                            .axisLineColor(Color.Gray.copy(alpha = 0.5f))
                            .axisLabelColor(Color.Gray)
                            .build()
                            
                        val yAxisData = AxisData.Builder()
                            .steps(5)
                            .labelData { i -> (i * (maxVol / 5)).toString() }
                            .axisLineColor(Color.Gray.copy(alpha = 0.5f))
                            .axisLabelColor(Color.Gray)
                            .build()
                            
                        val bubbleChartData = BubbleChartData(
                            bubbles = bubbles,
                            xAxisData = xAxisData,
                            yAxisData = yAxisData,
                            maximumBubbleRadius = 50f
                        )
                        
                        BubbleChart(
                            modifier = Modifier.fillMaxSize(),
                            bubbleChartData = bubbleChartData
                        )
                    }
                }
                Spacer(modifier = Modifier.height(48.dp))
            }

            // CNS Telemetry
            Column(modifier = Modifier.padding(horizontal = 24.dp).padding(bottom = 48.dp)) {
                Text(
                    text = "SYSTEM TELEMETRY",
                    color = Color.Gray,
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                val totalWorkouts = history.size
                val totalDuration = history.sumOf { it.durationMinutes ?: 0 }
                val avgDuration = if (totalWorkouts > 0) totalDuration / totalWorkouts else 0
                val statusColor = when {
                    avgDuration > 90 -> Color.Red
                    totalWorkouts >= 4 -> PillarFitness
                    else -> Color.White
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .neonGlow(statusColor, radius = 16.dp, alpha = 0.3f)
                        .background(Color(0xFF050C18), RoundedCornerShape(12.dp))
                        .border(1.dp, statusColor.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                        .padding(24.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        if (avgDuration > 90) {
                            Text("CNS FATIGUE WARNING", color = Color.Red, fontFamily = ShareTechMono, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                            Text("AVG DURATION: ${avgDuration}M. PRIORITIZE SLEEP.", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 10.sp, modifier = Modifier.padding(top = 8.dp))
                        } else if (totalWorkouts >= 4) {
                            Text("CONSISTENCY OPTIMAL", color = PillarFitness, fontFamily = ShareTechMono, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                            Text("$totalWorkouts RECENT SESSIONS. SYNTHESIS MAXIMIZED.", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 10.sp, modifier = Modifier.padding(top = 8.dp))
                        } else {
                            Text("MODERATE LOAD", color = Color.White, fontFamily = ShareTechMono, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                            Text("SYSTEM READY FOR OVERLOAD.", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 10.sp, modifier = Modifier.padding(top = 8.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PulsingFitnessRing(isLogged: Boolean, isRestDay: Boolean, onClick: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isLogged) 1f else 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )
    val ringAlpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = if (isLogged) 0.5f else 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    val ringColor = if (isLogged) Color(0xFF10B981) else PillarFitness

    Box(contentAlignment = Alignment.Center) {
        // Outer glow halo
        Box(
            modifier = Modifier
                .size(260.dp)
                .scale(pulseScale)
                .clip(CircleShape)
                .background(ringColor.copy(alpha = 0.06f * ringAlpha))
                .neonCircleGlow(ringColor, radius = 32.dp, alpha = 0.35f * ringAlpha)
        )
        // Main ring
        Box(
            modifier = Modifier
                .size(220.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(ringColor.copy(alpha = 0.18f), Color(0xFF020813)),
                        radius = 320f
                    )
                )
                .border(2.dp, ringColor.copy(alpha = ringAlpha), CircleShape)
                .neonCircleGlow(ringColor, radius = 20.dp, alpha = 0.4f)
                .clickable { onClick() },
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = if (isLogged) "LOGGED" else if (isRestDay) "OVERRIDE" else "INITIATE",
                    color = Color.White,
                    fontFamily = ShareTechMono,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 4.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (isLogged) "SESSION COMPLETE" else if (isRestDay) "REST DAY" else "SESSION REQUIRED",
                    color = ringColor,
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun AnimatedProtocolCard(
    id: String,
    count: Int,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    onRemove: () -> Unit,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit
) {
    var pressed by remember { mutableStateOf(false) }
    val cardScale by animateFloatAsState(
        targetValue = if (pressed) 0.97f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "cardScale"
    )
    val activeGlow = if (count > 0) PillarFitness else Color.Transparent

    val volumeMultiplier = when(id) {
        "pushups" -> 0.64f
        "pullups" -> 1.0f
        "squats" -> 0.89f
        "core" -> 0.2f
        else -> 0.5f
    }
    val volumeKg = (count * 75 * volumeMultiplier).toInt()

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .scale(cardScale)
            .height(80.dp)
            .neonGlow(activeGlow, radius = 12.dp, alpha = 0.3f)
            .background(
                if (count > 0) Color(0xFF1A0A0D) else Color(0xFF050C18),
                RoundedCornerShape(12.dp)
            )
            .border(
                1.dp,
                if (count > 0) PillarFitness.copy(alpha = 0.5f) else Color.White.copy(alpha = 0.08f),
                RoundedCornerShape(12.dp)
            )
            .combinedClickable(
                onClick = {},
                onLongClick = onRemove
            )
    ) {
        Row(modifier = Modifier.fillMaxSize()) {
            Box(
                modifier = Modifier.weight(0.2f).fillMaxHeight().clickable {
                    pressed = true
                    onDecrement()
                    pressed = false
                },
                contentAlignment = Alignment.Center
            ) {
                Text("−", color = Color.Gray, fontSize = 28.sp, fontFamily = ShareTechMono)
            }
            Box(
                modifier = Modifier.weight(0.6f).fillMaxHeight(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    // Animated count
                    val animatedCount by animateIntAsState(
                        targetValue = count,
                        animationSpec = spring(stiffness = Spring.StiffnessLow),
                        label = "count"
                    )
                    Text(
                        text = animatedCount.toString(),
                        color = if (count > 0) Color.White else Color.Gray,
                        fontFamily = ShareTechMono,
                        fontWeight = FontWeight.Black,
                        fontSize = 24.sp
                    )
                    Text(
                        text = "${id.uppercase()} | ${volumeKg}kg VOL",
                        color = PillarFitness.copy(alpha = if (count > 0) 1f else 0.5f),
                        fontFamily = ShareTechMono,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }
            Box(
                modifier = Modifier.weight(0.2f).fillMaxHeight().clickable {
                    pressed = true
                    onIncrement()
                    pressed = false
                },
                contentAlignment = Alignment.Center
            ) {
                Text("+", color = if (count > 0) PillarFitness else Color.Gray, fontSize = 28.sp, fontFamily = ShareTechMono)
            }
            Column(
                modifier = Modifier.weight(0.1f).fillMaxHeight(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(Icons.Filled.KeyboardArrowUp, "Move Up", modifier = Modifier.clickable { onMoveUp() }, tint = Color.Gray)
                Icon(Icons.Filled.KeyboardArrowDown, "Move Down", modifier = Modifier.clickable { onMoveDown() }, tint = Color.Gray)
            }
        }
    }
}

@Composable
fun BodyHeatmap(fatigueLevels: Map<String, Pair<Float, Float>>) {
    val infiniteTransition = rememberInfiniteTransition()
    val breathPulse by infiniteTransition.animateFloat(
        initialValue = 0.6f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    Box(
        modifier = Modifier
            .size(240.dp, 360.dp)
            .background(Color(0xFF020813)),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2, size.height / 2)
            
            fun drawCyberPlate(path: Path, state: Pair<Float, Float>?, plateCenter: Offset) {
                val activation = state?.first ?: 0f
                val armor = state?.second ?: 0f
                
                // 1. Base Wireframe (Subtle Grid Blue)
                drawPath(
                    path = path,
                    color = Color(0xFF1E3A8A).copy(alpha = 0.3f * breathPulse),
                    style = Stroke(width = 2f)
                )

                // 2. Activation Glow (Red Core Heat)
                if (activation > 0f) {
                    drawPath(
                        path = path,
                        brush = Brush.radialGradient(
                            colors = listOf(Color.Red.copy(alpha = activation), Color.Transparent),
                            center = plateCenter,
                            radius = 60f
                        )
                    )
                }

                // 3. Armor Outline (Cyan Neon Edge)
                if (armor > 0f) {
                    drawPath(
                        path = path,
                        color = Color.Cyan.copy(alpha = armor * 0.8f),
                        style = Stroke(width = 3f + (armor * 3f))
                    )
                }
            }

            // Chest Plates (Angular Hex)
            val chestPath = Path().apply {
                moveTo(center.x - 45f, 80f)
                lineTo(center.x + 45f, 80f)
                lineTo(center.x + 65f, 120f)
                lineTo(center.x + 10f, 140f)
                lineTo(center.x - 10f, 140f)
                lineTo(center.x - 65f, 120f)
                close()
            }
            drawCyberPlate(chestPath, fatigueLevels["chest"], Offset(center.x, 110f))

            // Back / Lats (Outer Wings)
            val backPath = Path().apply {
                moveTo(center.x - 70f, 115f)
                lineTo(center.x - 95f, 100f)
                lineTo(center.x - 85f, 150f)
                lineTo(center.x - 45f, 170f)
                
                moveTo(center.x + 70f, 115f)
                lineTo(center.x + 95f, 100f)
                lineTo(center.x + 85f, 150f)
                lineTo(center.x + 45f, 170f)
            }
            drawCyberPlate(backPath, fatigueLevels["back"], Offset(center.x, 135f))

            // Core / Abs (Segmented Column)
            val corePath = Path().apply {
                moveTo(center.x - 30f, 145f)
                lineTo(center.x + 30f, 145f)
                lineTo(center.x + 20f, 210f)
                lineTo(center.x - 20f, 210f)
                close()
            }
            drawCyberPlate(corePath, fatigueLevels["core"], Offset(center.x, 177f))

            // Legs (Angular Thighs)
            val legsPath = Path().apply {
                // Left Leg
                moveTo(center.x - 25f, 215f)
                lineTo(center.x - 55f, 215f)
                lineTo(center.x - 45f, 330f)
                lineTo(center.x - 15f, 330f)
                close()
                
                // Right Leg
                moveTo(center.x + 25f, 215f)
                lineTo(center.x + 55f, 215f)
                lineTo(center.x + 45f, 330f)
                lineTo(center.x + 15f, 330f)
                close()
            }
            drawCyberPlate(legsPath, fatigueLevels["legs"], Offset(center.x, 270f))
            
            // Central Power Core (Spinal Connector)
            drawCircle(
                color = Color.Cyan.copy(alpha = 0.5f * breathPulse),
                radius = 8f,
                center = Offset(center.x, 142f),
                style = Stroke(width = 2f)
            )
        }
    }
}

@Composable
fun FitnessShimmerLoader() {
    Box(
        modifier = Modifier.fillMaxSize().background(Color(0xFF020813)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp).shimmer(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(80.dp))
            Box(modifier = Modifier.size(220.dp).clip(CircleShape).background(Color(0xFF1A1A2E)).align(Alignment.CenterHorizontally))
            Spacer(modifier = Modifier.height(40.dp))
            repeat(3) {
                Box(modifier = Modifier.fillMaxWidth().height(80.dp).background(Color(0xFF0D0D1A), RoundedCornerShape(12.dp)))
            }
        }
    }
}
