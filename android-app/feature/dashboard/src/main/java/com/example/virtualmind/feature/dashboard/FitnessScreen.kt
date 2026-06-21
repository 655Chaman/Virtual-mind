package com.example.virtualmind.feature.dashboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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

@Composable
fun FitnessScreen(
    viewModel: FitnessViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val isLoading by viewModel.isLoading.collectAsState()
    val isLogged by viewModel.isLogged.collectAsState()
    val isRestDay by viewModel.isRestDay.collectAsState()
    val homeCounters by viewModel.homeCounters.collectAsState()
    val history by viewModel.history.collectAsState()

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
                    onClick = { HapticEngine.thud(context) }
                )
            }

            Spacer(modifier = Modifier.height(56.dp))

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
                homeCounters.forEach { (id, count) ->
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
                        }
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }

            Spacer(modifier = Modifier.height(48.dp))

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

@Composable
fun AnimatedProtocolCard(id: String, count: Int, onIncrement: () -> Unit, onDecrement: () -> Unit) {
    var pressed by remember { mutableStateOf(false) }
    val cardScale by animateFloatAsState(
        targetValue = if (pressed) 0.97f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "cardScale"
    )
    val activeGlow = if (count > 0) PillarFitness else Color.Transparent

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
                        fontSize = 28.sp
                    )
                    Text(
                        text = id.uppercase(),
                        color = PillarFitness.copy(alpha = if (count > 0) 1f else 0.5f),
                        fontFamily = ShareTechMono,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp
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
