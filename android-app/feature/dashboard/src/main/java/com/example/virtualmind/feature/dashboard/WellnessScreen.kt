package com.example.virtualmind.feature.dashboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.virtualmind.core.designsystem.theme.PillarWellness
import com.example.virtualmind.core.designsystem.theme.ShareTechMono
import com.example.virtualmind.core.designsystem.theme.neonCircleGlow
import com.example.virtualmind.core.designsystem.theme.neonGlow
import com.valentinilk.shimmer.shimmer
import kotlin.math.min

// ─── Background & Surface Colors ─────────────────────────────────────────────
private val BG = Color(0xFF020813)
private val SURFACE = Color(0xFF050C18)
private val SURFACE2 = Color(0xFF0A1422)
private val SLEEP_COLOR = Color(0xFF818CF8)   // Starlight Indigo for sleep
private val DANGER = Color(0xFFC94C4C)

@Composable
fun WellnessScreen(
    viewModel: WellnessViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val isLoading by viewModel.isLoading.collectAsState()
    val isSleeping by viewModel.isSleeping.collectAsState()
    val sleepDurationHours by viewModel.sleepDurationHours.collectAsState()
    val sleepScore by viewModel.sleepScore.collectAsState()
    val sleepLabel by viewModel.sleepLabel.collectAsState()
    val readinessLogged by viewModel.readinessLogged.collectAsState()
    val readinessEnergy by viewModel.readinessEnergy.collectAsState()
    val readinessClarity by viewModel.readinessClarity.collectAsState()
    val readinessMood by viewModel.readinessMood.collectAsState()
    val isFastingActive by viewModel.isFastingActive.collectAsState()
    val fastingProgress by viewModel.fastingProgress.collectAsState()
    val fastingPhase by viewModel.fastingPhase.collectAsState()
    val fastingElapsed by viewModel.fastingElapsedMinutes.collectAsState()
    val hydrationGlasses by viewModel.hydrationGlasses.collectAsState()
    val hydrationGoal by viewModel.hydrationGoalGlasses.collectAsState()

    if (isLoading) {
        WellnessShimmerLoader()
        return
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BG)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // ── Header ──────────────────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "[ BACK ]",
                    color = PillarWellness,
                    fontFamily = ShareTechMono,
                    fontSize = 12.sp,
                    letterSpacing = 2.sp,
                    modifier = Modifier.clickable {
                        HapticEngine.tick(context)
                        onNavigateBack()
                    }
                )
                Text(
                    text = "RECOVERY_PROTOCOL",
                    color = PillarWellness,
                    fontFamily = ShareTechMono,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    letterSpacing = 4.sp
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ── Sleep Toggle ────────────────────────────────────────────────
            SectionLabel(text = "SLEEP CONTROL")
            Spacer(modifier = Modifier.height(12.dp))
            SleepToggleCard(
                isSleeping = isSleeping,
                sleepDurationHours = sleepDurationHours,
                sleepScore = sleepScore,
                sleepLabel = sleepLabel,
                onClick = {
                    HapticEngine.thud(context)
                    viewModel.toggleSleep()
                }
            )

            Spacer(modifier = Modifier.height(40.dp))

            // ── Fasting Ring ────────────────────────────────────────────────
            SectionLabel(text = "FASTING PROTOCOL")
            Spacer(modifier = Modifier.height(16.dp))
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                FastingArcRing(
                    isActive = isFastingActive,
                    progress = fastingProgress,
                    phase = fastingPhase,
                    elapsedMinutes = fastingElapsed,
                    onClick = {
                        HapticEngine.thud(context)
                        viewModel.toggleFasting()
                    }
                )
            }

            Spacer(modifier = Modifier.height(48.dp))

            // ── Hydration Tracker ───────────────────────────────────────────
            SectionLabel(text = "HYDRATION METRICS")
            Spacer(modifier = Modifier.height(12.dp))
            Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                HydrationCard(
                    glasses = hydrationGlasses,
                    goalGlasses = hydrationGoal,
                    onAdd = {
                        HapticEngine.tick(context)
                        viewModel.addGlass()
                    },
                    onRemove = {
                        HapticEngine.tick(context)
                        viewModel.removeGlass()
                    }
                )
            }

            Spacer(modifier = Modifier.height(48.dp))

            // ── Morning Readiness ───────────────────────────────────────────
            SectionLabel(text = "MORNING READINESS")
            Spacer(modifier = Modifier.height(12.dp))
            Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                if (readinessLogged) {
                    ReadinessLockedCard(
                        score = sleepScore,
                        label = sleepLabel,
                        energy = readinessEnergy,
                        clarity = readinessClarity,
                        mood = readinessMood
                    )
                } else {
                    ReadinessInputCard(
                        energy = readinessEnergy,
                        clarity = readinessClarity,
                        mood = readinessMood,
                        onEnergyChange = { viewModel.setReadinessEnergy(it) },
                        onClarityChange = { viewModel.setReadinessClarity(it) },
                        onMoodChange = { viewModel.setReadinessMood(it) },
                        onLock = {
                            HapticEngine.success(context)
                            viewModel.lockReadiness()
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(64.dp))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        color = Color.Gray,
        fontFamily = ShareTechMono,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 2.sp,
        modifier = Modifier.padding(horizontal = 24.dp)
    )
}

// ── Sleep Toggle Card ──────────────────────────────────────────────────────────

@Composable
fun SleepToggleCard(
    isSleeping: Boolean,
    sleepDurationHours: Float,
    sleepScore: Int,
    sleepLabel: String,
    onClick: () -> Unit
) {
    val accentColor = if (isSleeping) SLEEP_COLOR else PillarWellness
    val statusColor = when {
        sleepDurationHours > 0f && sleepDurationHours < 6f -> DANGER
        sleepDurationHours >= 7f -> PillarWellness
        sleepDurationHours > 0f  -> Color.White
        else -> Color.Gray
    }

    val infiniteTransition = rememberInfiniteTransition(label = "sleepPulse")
    val sleepAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = if (isSleeping) 1f else 0.4f,
        animationSpec = infiniteRepeatable(tween(2000, easing = EaseInOut), RepeatMode.Reverse),
        label = "sleepAlpha"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp)
            .neonGlow(accentColor, radius = 16.dp, alpha = 0.25f * sleepAlpha)
            .background(SURFACE2, RoundedCornerShape(16.dp))
            .border(1.dp, accentColor.copy(alpha = sleepAlpha * 0.6f), RoundedCornerShape(16.dp))
            .padding(24.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = if (isSleeping) "REST PROTOCOL ACTIVE" else "SYSTEM AWAKE",
                        color = accentColor,
                        fontFamily = ShareTechMono,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        letterSpacing = 2.sp
                    )
                    if (!isSleeping && sleepDurationHours > 0f) {
                        Spacer(modifier = Modifier.height(4.dp))
                        val durText = "LAST SLEEP: ${String.format("%.1f", sleepDurationHours)}H"
                        Text(
                            text = durText,
                            color = statusColor,
                            fontFamily = ShareTechMono,
                            fontSize = 10.sp,
                            letterSpacing = 1.sp
                        )
                        if (sleepLabel.isNotEmpty()) {
                            Text(
                                text = sleepLabel,
                                color = statusColor.copy(alpha = 0.7f),
                                fontFamily = ShareTechMono,
                                fontSize = 9.sp,
                                letterSpacing = 1.sp
                            )
                        }
                    }
                    if (isSleeping) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "PHONE LOCKED — SLEEP ENFORCER ACTIVE",
                            color = SLEEP_COLOR.copy(alpha = 0.7f),
                            fontFamily = ShareTechMono,
                            fontSize = 9.sp,
                            letterSpacing = 1.sp
                        )
                    }
                }

                Text(
                    text = if (isSleeping) "[ WAKE UP ]" else "[ SLEEP NOW ]",
                    color = accentColor,
                    fontFamily = ShareTechMono,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier
                        .background(accentColor.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                        .border(1.dp, accentColor.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                        .clickable { onClick() }
                )
            }

            // Sleep quality bar (only if we have data)
            if (!isSleeping && sleepDurationHours > 0f) {
                Spacer(modifier = Modifier.height(16.dp))
                val barProgress = (sleepDurationHours / 9f).coerceIn(0f, 1f)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .background(Color.White.copy(alpha = 0.08f), RoundedCornerShape(2.dp))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(barProgress)
                            .height(4.dp)
                            .background(
                                Brush.horizontalGradient(
                                    listOf(SLEEP_COLOR.copy(alpha = 0.4f), statusColor)
                                ),
                                RoundedCornerShape(2.dp)
                            )
                    )
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("0H", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 8.sp)
                    Text("9H TARGET", color = Color.Gray, fontFamily = ShareTechMono, fontSize = 8.sp)
                }
            }
        }
    }
}

// ── Fasting Arc Ring ──────────────────────────────────────────────────────────

@Composable
fun FastingArcRing(
    isActive: Boolean,
    progress: Float,
    phase: String,
    elapsedMinutes: Float,
    onClick: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "fastPulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.55f,
        targetValue = if (isActive) 1f else 0.55f,
        animationSpec = infiniteRepeatable(tween(1800, easing = EaseInOut), RepeatMode.Reverse),
        label = "alpha"
    )
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(800, easing = FastOutSlowInEasing),
        label = "progress"
    )

    val ringColor = if (isActive) PillarWellness else Color(0xFF334155)
    val elapsedH = elapsedMinutes / 60f
    val elapsedStr = if (elapsedH >= 1f) {
        "${elapsedH.toInt()}H ${((elapsedMinutes % 60f).toInt())}M"
    } else {
        "${elapsedMinutes.toInt()}M"
    }

    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(280.dp)) {
        // Outer glow halo
        Box(
            modifier = Modifier
                .size(280.dp)
                .clip(CircleShape)
                .background(ringColor.copy(alpha = 0.05f * pulseAlpha))
                .neonCircleGlow(ringColor, radius = 28.dp, alpha = 0.3f * pulseAlpha)
        )

        // Canvas arc progress
        Canvas(modifier = Modifier.size(240.dp)) {
            val stroke = 10.dp.toPx()
            val radius = (size.minDimension - stroke) / 2f
            val topLeft = Offset(stroke / 2f, stroke / 2f)
            val arcSize = Size(radius * 2f, radius * 2f)

            // Track (background arc)
            drawArc(
                color = Color.White.copy(alpha = 0.06f),
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(width = stroke, cap = StrokeCap.Round)
            )

            // Progress arc
            if (animatedProgress > 0f) {
                drawArc(
                    brush = Brush.sweepGradient(
                        colors = listOf(
                            PillarWellness.copy(alpha = 0.5f),
                            PillarWellness,
                            Color(0xFF7DD3FC),
                            PillarWellness.copy(alpha = 0.5f)
                        )
                    ),
                    startAngle = -90f,
                    sweepAngle = 360f * animatedProgress,
                    useCenter = false,
                    topLeft = topLeft,
                    size = arcSize,
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
            }
        }

        // Inner circle (clickable)
        Box(
            modifier = Modifier
                .size(200.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(ringColor.copy(alpha = 0.15f), BG),
                        radius = 280f
                    )
                )
                .border(1.dp, ringColor.copy(alpha = pulseAlpha * 0.5f), CircleShape)
                .clickable { onClick() },
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp)) {
                Text(
                    text = if (isActive) elapsedStr else "IDLE",
                    color = Color.White,
                    fontFamily = ShareTechMono,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 3.sp,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = phase,
                    color = ringColor,
                    fontFamily = ShareTechMono,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.5.sp,
                    textAlign = TextAlign.Center
                )
                if (isActive) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "${(progress * 100f).toInt()}% OF 16H",
                        color = Color.Gray,
                        fontFamily = ShareTechMono,
                        fontSize = 9.sp
                    )
                } else {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "[ TAP TO BEGIN ]",
                        color = Color.Gray,
                        fontFamily = ShareTechMono,
                        fontSize = 9.sp
                    )
                }
            }
        }
    }
}

// ── Hydration Card ─────────────────────────────────────────────────────────────

@Composable
fun HydrationCard(
    glasses: Int,
    goalGlasses: Int,
    onAdd: () -> Unit,
    onRemove: () -> Unit
) {
    val progress = (glasses.toFloat() / goalGlasses.toFloat()).coerceIn(0f, 1f)
    val activeGlow = if (glasses > 0) PillarWellness else Color.Transparent
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(600, easing = FastOutSlowInEasing),
        label = "hydrationProg"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .neonGlow(activeGlow, radius = 12.dp, alpha = 0.25f)
            .background(if (glasses > 0) SURFACE2 else SURFACE, RoundedCornerShape(16.dp))
            .border(
                1.dp,
                if (glasses > 0) PillarWellness.copy(alpha = 0.4f) else Color.White.copy(alpha = 0.07f),
                RoundedCornerShape(16.dp)
            )
            .padding(24.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Decrement
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(Color.White.copy(alpha = 0.05f), CircleShape)
                        .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
                        .clickable { onRemove() },
                    contentAlignment = Alignment.Center
                ) {
                    Text("−", color = Color.Gray, fontSize = 24.sp, fontFamily = ShareTechMono)
                }

                // Center display
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    val animatedCount by animateIntAsState(
                        targetValue = glasses,
                        animationSpec = spring(stiffness = Spring.StiffnessLow),
                        label = "glassCount"
                    )
                    Text(
                        text = "$animatedCount / $goalGlasses",
                        color = if (glasses > 0) Color.White else Color.Gray,
                        fontFamily = ShareTechMono,
                        fontWeight = FontWeight.Black,
                        fontSize = 28.sp
                    )
                    Text(
                        text = "GLASSES — ${glasses * 250}ML",
                        color = PillarWellness.copy(alpha = if (glasses > 0) 0.9f else 0.4f),
                        fontFamily = ShareTechMono,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp
                    )
                }

                // Increment
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(
                            if (glasses < goalGlasses) PillarWellness.copy(alpha = 0.12f) else Color.White.copy(alpha = 0.03f),
                            CircleShape
                        )
                        .border(
                            1.dp,
                            if (glasses < goalGlasses) PillarWellness.copy(alpha = 0.4f) else Color.White.copy(alpha = 0.05f),
                            CircleShape
                        )
                        .clickable { onAdd() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "+",
                        color = if (glasses < goalGlasses) PillarWellness else Color.Gray,
                        fontSize = 24.sp,
                        fontFamily = ShareTechMono
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Progress bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .background(Color.White.copy(alpha = 0.07f), RoundedCornerShape(2.dp))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(animatedProgress)
                        .height(4.dp)
                        .background(
                            Brush.horizontalGradient(
                                listOf(PillarWellness.copy(alpha = 0.5f), PillarWellness)
                            ),
                            RoundedCornerShape(2.dp)
                        )
                )
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = if (glasses >= goalGlasses) "HYDRATION GOAL ACHIEVED" else "${goalGlasses - glasses} GLASSES REMAINING",
                color = if (glasses >= goalGlasses) PillarWellness else Color.Gray,
                fontFamily = ShareTechMono,
                fontSize = 8.sp,
                letterSpacing = 1.sp,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.End
            )
        }
    }
}

// ── Readiness Input Card ───────────────────────────────────────────────────────

@Composable
fun ReadinessInputCard(
    energy: Int,
    clarity: Int,
    mood: Int,
    onEnergyChange: (Int) -> Unit,
    onClarityChange: (Int) -> Unit,
    onMoodChange: (Int) -> Unit,
    onLock: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(SURFACE, RoundedCornerShape(16.dp))
            .border(1.dp, PillarWellness.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
            .padding(24.dp)
    ) {
        Column {
            Text(
                "LOG MORNING READINESS",
                color = PillarWellness,
                fontFamily = ShareTechMono,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                letterSpacing = 2.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "Rate each dimension 1–5 before locking in.",
                color = Color.Gray,
                fontFamily = ShareTechMono,
                fontSize = 9.sp
            )
            Spacer(modifier = Modifier.height(20.dp))

            ReadinessSlider("ENERGY", energy, onEnergyChange)
            Spacer(modifier = Modifier.height(12.dp))
            ReadinessSlider("MENTAL CLARITY", clarity, onClarityChange)
            Spacer(modifier = Modifier.height(12.dp))
            ReadinessSlider("EMOTIONAL STATE", mood, onMoodChange)

            Spacer(modifier = Modifier.height(24.dp))

            val totalScore = energy + clarity + mood
            val maxScore = 15
            val label = when {
                totalScore >= 13 -> "PEAK STATE"
                totalScore >= 10 -> "OPERATIONAL"
                totalScore >= 7  -> "SUBOPTIMAL"
                else             -> "RECOVERY NEEDED"
            }
            val labelColor = when {
                totalScore >= 13 -> PillarWellness
                totalScore >= 10 -> Color.White
                totalScore >= 7  -> Color(0xFFF59E0B)
                else             -> DANGER
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "$totalScore / $maxScore",
                        color = labelColor,
                        fontFamily = ShareTechMono,
                        fontWeight = FontWeight.Bold,
                        fontSize = 24.sp
                    )
                    Text(
                        label,
                        color = labelColor.copy(alpha = 0.7f),
                        fontFamily = ShareTechMono,
                        fontSize = 9.sp,
                        letterSpacing = 1.sp
                    )
                }
                Text(
                    "[ LOCK IN ]",
                    color = PillarWellness,
                    fontFamily = ShareTechMono,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier
                        .background(PillarWellness.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                        .border(1.dp, PillarWellness.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 16.dp, vertical = 10.dp)
                        .clickable { onLock() }
                )
            }
        }
    }
}

@Composable
private fun ReadinessSlider(label: String, value: Int, onChange: (Int) -> Unit) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, color = Color.Gray, fontFamily = ShareTechMono, fontSize = 9.sp, letterSpacing = 1.sp)
            Text("$value / 5", color = PillarWellness, fontFamily = ShareTechMono, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        }
        Slider(
            value = value.toFloat(),
            onValueChange = { onChange(it.toInt()) },
            valueRange = 1f..5f,
            steps = 3,
            colors = SliderDefaults.colors(
                thumbColor = PillarWellness,
                activeTrackColor = PillarWellness,
                inactiveTrackColor = Color.White.copy(alpha = 0.1f),
                activeTickColor = PillarWellness.copy(alpha = 0.5f),
                inactiveTickColor = Color.White.copy(alpha = 0.1f)
            )
        )
    }
}

@Composable
fun ReadinessLockedCard(
    score: Int,
    label: String,
    energy: Int,
    clarity: Int,
    mood: Int
) {
    val scoreColor = when {
        score >= 13 -> PillarWellness
        score >= 10 -> Color.White
        score >= 7  -> Color(0xFFF59E0B)
        else        -> DANGER
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .neonGlow(scoreColor, radius = 16.dp, alpha = 0.2f)
            .background(SURFACE, RoundedCornerShape(16.dp))
            .border(1.dp, scoreColor.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
            .padding(24.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "$score / 15",
                        color = scoreColor,
                        fontFamily = ShareTechMono,
                        fontWeight = FontWeight.Bold,
                        fontSize = 32.sp
                    )
                    Text(
                        label,
                        color = scoreColor.copy(alpha = 0.8f),
                        fontFamily = ShareTechMono,
                        fontSize = 10.sp,
                        letterSpacing = 2.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    "[ LOCKED ]",
                    color = Color.Gray,
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    modifier = Modifier
                        .background(Color.White.copy(alpha = 0.04f), RoundedCornerShape(8.dp))
                        .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
            Spacer(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(Color.White.copy(alpha = 0.06f))
            )
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                ReadinessDimension("ENERGY", energy)
                ReadinessDimension("CLARITY", clarity)
                ReadinessDimension("MOOD", mood)
            }
        }
    }
}

@Composable
private fun ReadinessDimension(label: String, value: Int) {
    val color = when {
        value >= 4 -> PillarWellness
        value >= 3 -> Color.White
        value >= 2 -> Color(0xFFF59E0B)
        else       -> DANGER
    }
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("$value", color = color, fontFamily = ShareTechMono, fontWeight = FontWeight.Bold, fontSize = 20.sp)
        Text(label, color = Color.Gray, fontFamily = ShareTechMono, fontSize = 8.sp, letterSpacing = 1.sp)
    }
}

// ── Shimmer Loader ─────────────────────────────────────────────────────────────

@Composable
fun WellnessShimmerLoader() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BG),
        contentAlignment = Alignment.TopStart
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
                .shimmer(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(72.dp))
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(100.dp)
                    .background(SURFACE2, RoundedCornerShape(16.dp))
            )
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                Modifier
                    .size(240.dp)
                    .clip(CircleShape)
                    .background(SURFACE2)
                    .align(Alignment.CenterHorizontally)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(100.dp)
                    .background(SURFACE2, RoundedCornerShape(16.dp))
            )
        }
    }
}
