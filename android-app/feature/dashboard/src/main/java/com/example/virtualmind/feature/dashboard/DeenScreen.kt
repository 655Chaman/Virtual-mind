package com.example.virtualmind.feature.dashboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.virtualmind.core.designsystem.theme.PillarDeen
import com.example.virtualmind.core.designsystem.theme.ShareTechMono
import com.example.virtualmind.core.designsystem.theme.neonCircleGlow
import com.example.virtualmind.core.designsystem.theme.neonGlow
import com.valentinilk.shimmer.shimmer

@Composable
fun DeenScreen(
    viewModel: DeenViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val isLoading by viewModel.isLoading.collectAsState()
    val prayers by viewModel.prayers.collectAsState()
    val habits by viewModel.habits.collectAsState()
    val tasbihPhase by viewModel.tasbihPhase.collectAsState()
    val tasbihCount by viewModel.tasbihCount.collectAsState()
    val tasbihTotal by viewModel.tasbihTotal.collectAsState()

    if (isLoading) {
        DeenShimmerLoader()
        return
    }

    Box(
        modifier = Modifier.fillMaxSize().background(Color(0xFF020813))
    ) {
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "[ BACK ]",
                    color = PillarDeen,
                    fontFamily = ShareTechMono,
                    fontSize = 12.sp,
                    letterSpacing = 2.sp,
                    modifier = Modifier.clickable {
                        HapticEngine.tick(context)
                        onNavigateBack()
                    }
                )
                Text(
                    text = "SPIRITUAL_FOUNDATION",
                    color = PillarDeen,
                    fontFamily = ShareTechMono,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    letterSpacing = 4.sp
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Prayer Compliance
            Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                Text(
                    text = "DAILY PRAYER COMPLIANCE",
                    color = Color.Gray,
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                val orderedPrayers = listOf("fajr", "dhuhr", "asr", "maghrib", "isha")
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    orderedPrayers.forEach { prayer ->
                        val isComplete = prayers[prayer] == true
                        AnimatedPrayerTile(
                            label = prayer.take(1).uppercase(),
                            isComplete = isComplete,
                            onClick = {
                                if (isComplete) HapticEngine.tick(context) else HapticEngine.click(context)
                                viewModel.togglePrayer(prayer, !isComplete)
                            },
                            modifier = Modifier.weight(1f).padding(4.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(40.dp))

            // Spiritual Habits
            Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                Text(
                    text = "SPIRITUAL HABITS",
                    color = Color.Gray,
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                val habitList = listOf(
                    "fajr_without_alarm" to "FAJR ON TIME",
                    "adhkar" to "ADHKAR",
                    "quran_30min" to "QURAN 30M",
                    "memorization_session" to "MEMORIZE"
                )
                Column {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        AnimatedHabitCard(
                            key = habitList[0].first, label = habitList[0].second,
                            isComplete = habits[habitList[0].first] == true,
                            onToggle = { HapticEngine.click(context); viewModel.toggleHabit(habitList[0].first, it) },
                            modifier = Modifier.weight(1f)
                        )
                        AnimatedHabitCard(
                            key = habitList[1].first, label = habitList[1].second,
                            isComplete = habits[habitList[1].first] == true,
                            onToggle = { HapticEngine.click(context); viewModel.toggleHabit(habitList[1].first, it) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        AnimatedHabitCard(
                            key = habitList[2].first, label = habitList[2].second,
                            isComplete = habits[habitList[2].first] == true,
                            onToggle = { HapticEngine.click(context); viewModel.toggleHabit(habitList[2].first, it) },
                            modifier = Modifier.weight(1f)
                        )
                        AnimatedHabitCard(
                            key = habitList[3].first, label = habitList[3].second,
                            isComplete = habits[habitList[3].first] == true,
                            onToggle = { HapticEngine.click(context); viewModel.toggleHabit(habitList[3].first, it) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(48.dp))

            // Tasbih Engine
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp).padding(bottom = 60.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "NATIVE TASBIH ENGINE",
                    color = PillarDeen.copy(alpha = 0.7f),
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 3.sp,
                    modifier = Modifier.padding(bottom = 24.dp)
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "<",
                        color = PillarDeen.copy(alpha = 0.5f),
                        fontSize = 24.sp,
                        modifier = Modifier.clickable {
                            HapticEngine.success(context)
                            viewModel.cycleTasbihPhase(false)
                        }.padding(8.dp)
                    )
                    Text(
                        text = tasbihPhase.uppercase(),
                        color = PillarDeen,
                        fontFamily = ShareTechMono,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 4.sp
                    )
                    Text(
                        text = ">",
                        color = PillarDeen.copy(alpha = 0.5f),
                        fontSize = 24.sp,
                        modifier = Modifier.clickable {
                            HapticEngine.success(context)
                            viewModel.cycleTasbihPhase(true)
                        }.padding(8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))

                // Animated Tasbih Circle
                TasbihCircle(
                    count = tasbihCount,
                    color = PillarDeen,
                    onClick = {
                        HapticEngine.tick(context)
                        viewModel.handleTasbihTap()
                    }
                )

                Spacer(modifier = Modifier.height(24.dp))
                Text(
                    text = "SESSION TOTAL: $tasbihTotal",
                    color = PillarDeen,
                    fontFamily = ShareTechMono,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )
            }
        }
    }
}

@Composable
fun AnimatedPrayerTile(label: String, isComplete: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val bgAlpha by animateFloatAsState(
        targetValue = if (isComplete) 0.2f else 0f,
        animationSpec = tween(300),
        label = "bgAlpha"
    )
    val borderAlpha by animateFloatAsState(
        targetValue = if (isComplete) 1f else 0.1f,
        animationSpec = tween(300),
        label = "borderAlpha"
    )

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .neonGlow(PillarDeen, radius = if (isComplete) 12.dp else 0.dp, alpha = 0.4f)
            .background(PillarDeen.copy(alpha = bgAlpha), RoundedCornerShape(8.dp))
            .border(1.dp, PillarDeen.copy(alpha = borderAlpha), RoundedCornerShape(8.dp))
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = if (isComplete) PillarDeen else Color.Gray,
            fontFamily = ShareTechMono,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun AnimatedHabitCard(key: String, label: String, isComplete: Boolean, onToggle: (Boolean) -> Unit, modifier: Modifier = Modifier) {
    val cardScale by animateFloatAsState(
        targetValue = if (isComplete) 1f else 0.98f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "cardScale"
    )
    Box(
        modifier = modifier
            .height(80.dp)
            .scale(cardScale)
            .neonGlow(PillarDeen, radius = if (isComplete) 10.dp else 0.dp, alpha = 0.35f)
            .background(if (isComplete) PillarDeen.copy(alpha = 0.15f) else Color(0xFF050C18), RoundedCornerShape(12.dp))
            .border(1.dp, if (isComplete) PillarDeen else Color.White.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
            .clickable { onToggle(!isComplete) },
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = label, color = if (isComplete) PillarDeen else Color.Gray, fontFamily = ShareTechMono, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = if (isComplete) "SECURED" else "PENDING", color = if (isComplete) PillarDeen else Color.Gray.copy(alpha = 0.4f), fontFamily = ShareTechMono, fontSize = 9.sp, letterSpacing = 2.sp)
        }
    }
}

@Composable
fun TasbihCircle(count: Int, color: Color, onClick: () -> Unit) {
    var tapped by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (tapped) 0.93f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioHighBouncy, stiffness = Spring.StiffnessMediumLow),
        label = "tasbihScale",
        finishedListener = { tapped = false }
    )
    val animatedCount by animateIntAsState(targetValue = count, animationSpec = tween(100), label = "count")

    Box(contentAlignment = Alignment.Center) {
        // Outer ambient ring
        Box(
            modifier = Modifier
                .size(256.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(color.copy(alpha = 0.08f), Color.Transparent),
                        radius = 400f
                    )
                )
                .neonCircleGlow(color, radius = 24.dp, alpha = 0.25f)
        )
        // Tap circle
        Box(
            modifier = Modifier
                .size(220.dp)
                .scale(scale)
                .clip(CircleShape)
                .background(Color(0xFF060606))
                .border(1.dp, color.copy(alpha = 0.3f), CircleShape)
                .neonCircleGlow(color, radius = 16.dp, alpha = 0.4f)
                .pointerInput(Unit) {
                    detectTapGestures(onTap = {
                        tapped = true
                        onClick()
                    })
                },
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = animatedCount.toString(), color = color, fontFamily = ShareTechMono, fontSize = 72.sp, fontWeight = FontWeight.Black)
                Text(text = "TAP TO COUNT", color = color, fontFamily = ShareTechMono, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 4.sp)
            }
        }
    }
}

@Composable
fun DeenShimmerLoader() {
    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF020813))) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp).shimmer(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(80.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                repeat(5) {
                    Box(modifier = Modifier.weight(1f).aspectRatio(1f).background(Color(0xFF0D0D1A), RoundedCornerShape(8.dp)))
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                repeat(2) { Box(modifier = Modifier.weight(1f).height(80.dp).background(Color(0xFF0D0D1A), RoundedCornerShape(12.dp))) }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                repeat(2) { Box(modifier = Modifier.weight(1f).height(80.dp).background(Color(0xFF0D0D1A), RoundedCornerShape(12.dp))) }
            }
        }
    }
}
