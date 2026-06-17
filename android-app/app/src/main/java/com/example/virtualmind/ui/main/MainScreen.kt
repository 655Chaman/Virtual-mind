package com.example.virtualmind.ui.main

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.SportsGymnastics
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavKey
import com.example.virtualmind.DeenPage
import com.example.virtualmind.ElesiumPage
import com.example.virtualmind.PhysicalityHubPage
import com.example.virtualmind.SelfPage
import com.example.virtualmind.data.DefaultDataRepository
import com.example.virtualmind.theme.AccentGold
import com.example.virtualmind.theme.NeonGreen
import com.example.virtualmind.theme.RecoveryAccentPurple
import com.example.virtualmind.theme.RecoveryDeepPurple
import com.example.virtualmind.theme.SelfCyberCyan
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

// ── Data model for each pillar card ──────────────────────────────────────────
data class PillarCard(
    val id: Int,
    val pillCode: String,
    val name: String,
    val tagline: String,
    val subtext: String,
    val navKey: NavKey,
    val backgroundColors: List<Color>,
    val accentColor: Color,
)

val pillarCards = listOf(
    PillarCard(
        id = 0,
        pillCode = "01",
        name = "DEEN",
        tagline = "The Foundation",
        subtext = "Salah · Quran · Adhkar",
        navKey = DeenPage,
        backgroundColors = listOf(Color(0xFF0A0800), Color(0xFF1A1200), Color(0xFF0A0800)),
        accentColor = AccentGold,
    ),
    PillarCard(
        id = 1,
        pillCode = "02",
        name = "ELESIUM",
        tagline = "The Empire",
        subtext = "Sales · Meetings · Revenue",
        navKey = ElesiumPage,
        backgroundColors = listOf(Color(0xFF00060A), Color(0xFF001828), Color(0xFF00060A)),
        accentColor = Color(0xFF00A8FF),
    ),
    PillarCard(
        id = 2,
        pillCode = "03",
        name = "PHYSICALITY",
        tagline = "The Body",
        subtext = "Workout · Recovery · Performance",
        navKey = PhysicalityHubPage,
        backgroundColors = listOf(Color(0xFF030A00), Color(0xFF0A2000), Color(0xFF030A00)),
        accentColor = NeonGreen,
    ),
    PillarCard(
        id = 3,
        pillCode = "04",
        name = "SELF",
        tagline = "The Inner Oracle",
        subtext = "Learning · Milestones · AI Tracker",
        navKey = SelfPage,
        backgroundColors = listOf(Color(0xFF000A0A), Color(0xFF001A1A), Color(0xFF000A0A)),
        accentColor = SelfCyberCyan,
    ),
)

// ── Main Entry Point ──────────────────────────────────────────────────────────
@Composable
fun MainScreen(
    onItemClick: (NavKey) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: MainScreenViewModel = viewModel { MainScreenViewModel(DefaultDataRepository()) },
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    PillarCardDeck(onItemClick = onItemClick)
}

// ── Swipeable Card Deck ────────────────────────────────────────────────────────
@Composable
fun PillarCardDeck(onItemClick: (NavKey) -> Unit) {
    val pagerState = rememberPagerState(pageCount = { pillarCards.size })

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize(),
        ) { page ->
            PillarCardPage(
                card = pillarCards[page],
                onExploreClick = { onItemClick(pillarCards[page].navKey) }
            )
        }

        // Page indicators at the bottom
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 48.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            repeat(pillarCards.size) { index ->
                val isSelected = pagerState.currentPage == index
                val card = pillarCards[index]
                Box(
                    modifier = Modifier
                        .width(if (isSelected) 32.dp else 8.dp)
                        .height(8.dp)
                        .clip(CircleShape)
                        .background(
                            if (isSelected) card.accentColor
                            else Color(0x44FFFFFF)
                        )
                )
            }
        }
    }
}

// ── Individual Full-Screen Pillar Card ─────────────────────────────────────────
@Composable
fun PillarCardPage(card: PillarCard, onExploreClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = card.backgroundColors,
                    radius = 1200f
                )
            )
    ) {
        // Top-left pill code
        Text(
            text = "PILLAR ${card.pillCode}",
            style = MaterialTheme.typography.labelSmall,
            color = card.accentColor.copy(alpha = 0.6f),
            fontFamily = FontFamily.Monospace,
            letterSpacing = 3.sp,
            modifier = Modifier.align(Alignment.TopStart).padding(32.dp).padding(top = 24.dp)
        )

        // Centre: 3D Visual
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(340.dp)
                .align(Alignment.Center)
                .offset(y = (-40).dp),
            contentAlignment = Alignment.Center
        ) {
            when (card.id) {
                0 -> DeenOrbVisual(accentColor = card.accentColor)
                1 -> ElesiumWaveVisual(accentColor = card.accentColor)
                2 -> PhysicalityRingVisual(accentColor = card.accentColor)
                3 -> SelfTerminalVisual(accentColor = card.accentColor)
            }
        }

        // Bottom content
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(horizontal = 32.dp)
                .padding(bottom = 100.dp)
        ) {
            Text(
                text = card.name,
                style = MaterialTheme.typography.displaySmall,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = card.tagline,
                style = MaterialTheme.typography.titleMedium,
                color = card.accentColor,
                fontWeight = FontWeight.Normal
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = card.subtext,
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0x99FFFFFF),
                lineHeight = 24.sp
            )
            Spacer(modifier = Modifier.height(32.dp))

            // Explore button row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Explore",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                )
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .background(card.accentColor, CircleShape)
                        .clickable { onExploreClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.ArrowForward,
                        contentDescription = "Enter ${card.name}",
                        tint = Color.Black,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }
    }
}

// ── Custom 3D-Style Visuals per Pillar ────────────────────────────────────────

/** Deen: A slowly rotating golden geometric star / sacred geometry orb */
@Composable
fun DeenOrbVisual(accentColor: Color) {
    val infiniteTransition = rememberInfiniteTransition()
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(24000, easing = LinearEasing))
    )
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(tween(2000, easing = FastOutSlowInEasing), RepeatMode.Reverse)
    )

    Canvas(modifier = Modifier.size(280.dp)) {
        val cx = size.width / 2f
        val cy = size.height / 2f
        val r = size.minDimension / 2f * pulse

        // Outer glow rings
        for (i in 3 downTo 1) {
            drawCircle(
                color = accentColor.copy(alpha = 0.05f * i),
                radius = r + 20f * i,
                center = Offset(cx, cy),
                style = Stroke(width = 2f)
            )
        }

        // Main circle outline
        drawCircle(
            color = accentColor.copy(alpha = 0.3f),
            radius = r,
            center = Offset(cx, cy),
            style = Stroke(width = 1.5f)
        )

        // Sacred geometry: 6-pointed star (Star of David / hexagram)
        val numPoints = 12
        for (layer in 0..1) {
            val layerR = r * (if (layer == 0) 0.7f else 0.4f)
            val path = Path()
            for (i in 0 until numPoints) {
                val angle = Math.toRadians((rotation + i * (360.0 / numPoints) + layer * 30).toDouble())
                val px = cx + layerR * cos(angle).toFloat()
                val py = cy + layerR * sin(angle).toFloat()
                if (i == 0) path.moveTo(px, py) else path.lineTo(px, py)
            }
            path.close()
            drawPath(path, color = accentColor.copy(alpha = 0.6f - layer * 0.2f), style = Stroke(width = 1.5f, cap = StrokeCap.Round))
        }

        // Inner core
        drawCircle(color = accentColor.copy(alpha = 0.12f), radius = r * 0.25f, center = Offset(cx, cy))
        drawCircle(color = accentColor, radius = 6f, center = Offset(cx, cy))
    }
}

/** Elesium: A flowing financial waveform / upward chart */
@Composable
fun ElesiumWaveVisual(accentColor: Color) {
    val infiniteTransition = rememberInfiniteTransition()
    val waveOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * PI.toFloat(),
        animationSpec = infiniteRepeatable(tween(3000, easing = LinearEasing))
    )

    Canvas(modifier = Modifier.size(280.dp)) {
        val w = size.width
        val h = size.height
        val midY = h / 2f

        // Draw multiple wave lines with phase offset
        for (line in 0..3) {
            val path = Path()
            val alpha = 0.8f - line * 0.15f
            val amplitude = h * 0.18f - line * 12f
            val freq = 1.5f + line * 0.3f
            val phase = waveOffset + line * (PI.toFloat() / 4f)

            for (x in 0..w.toInt()) {
                val y = midY + amplitude * sin(freq * (x / w) * 2f * PI.toFloat() + phase)
                if (x == 0) path.moveTo(x.toFloat(), y) else path.lineTo(x.toFloat(), y)
            }
            drawPath(
                path,
                color = accentColor.copy(alpha = alpha * 0.6f),
                style = Stroke(width = 2f - line * 0.3f, cap = StrokeCap.Round)
            )
        }

        // Upward arrow / trending indicator
        val arrowX = w * 0.75f
        val arrowY = midY - h * 0.25f
        drawCircle(color = accentColor.copy(alpha = 0.15f), radius = 36f, center = Offset(arrowX, arrowY))
        drawCircle(color = accentColor, radius = 8f, center = Offset(arrowX, arrowY))
    }
}

/** Physicality: A neon pulse / heartbeat circle ring */
@Composable
fun PhysicalityRingVisual(accentColor: Color) {
    val infiniteTransition = rememberInfiniteTransition()
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1200, easing = FastOutSlowInEasing), RepeatMode.Reverse)
    )
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(8000, easing = LinearEasing))
    )

    Canvas(modifier = Modifier.size(280.dp)) {
        val cx = size.width / 2f
        val cy = size.height / 2f
        val r = size.minDimension / 2f * 0.72f

        // Outer rotating dashed arc
        for (i in 0 until 24) {
            val angle = Math.toRadians((rotation + i * 15.0))
            val startX = cx + (r + 20f) * cos(angle).toFloat()
            val startY = cy + (r + 20f) * sin(angle).toFloat()
            val endX = cx + (r + 30f) * cos(angle).toFloat()
            val endY = cy + (r + 30f) * sin(angle).toFloat()
            drawLine(accentColor.copy(alpha = 0.4f), Offset(startX, startY), Offset(endX, endY), strokeWidth = 2f)
        }

        // Main ring with glow
        drawCircle(color = accentColor.copy(alpha = 0.08f + pulse * 0.08f), radius = r + 10f, center = Offset(cx, cy), style = Stroke(width = 20f))
        drawCircle(color = accentColor.copy(alpha = 0.6f), radius = r, center = Offset(cx, cy), style = Stroke(width = 3f))

        // EKG-style pulse inside
        val path = Path()
        val startX = cx - r * 0.7f
        val endX = cx + r * 0.7f
        path.moveTo(startX, cy)
        path.lineTo(cx - r * 0.25f, cy)
        path.lineTo(cx - r * 0.12f, cy - r * 0.4f)
        path.lineTo(cx, cy + r * 0.2f)
        path.lineTo(cx + r * 0.12f, cy - r * 0.25f)
        path.lineTo(cx + r * 0.25f, cy)
        path.lineTo(endX, cy)
        drawPath(path, color = accentColor, style = Stroke(width = 2.5f, cap = StrokeCap.Round))

        // Center dot
        drawCircle(color = accentColor, radius = 5f, center = Offset(cx, cy))
    }
}

/** Self: A streaming terminal / AI dot matrix grid */
@Composable
fun SelfTerminalVisual(accentColor: Color) {
    val infiniteTransition = rememberInfiniteTransition()
    val scanLine by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(2500, easing = LinearEasing))
    )
    val blink by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            keyframes { durationMillis = 1000; 1f at 500; 0f at 1000 }
        )
    )

    Canvas(modifier = Modifier.size(280.dp)) {
        val dotRows = 14
        val dotCols = 18
        val dotSpacingX = size.width / dotCols
        val dotSpacingY = size.height / dotRows

        // Dot matrix grid
        for (row in 0 until dotRows) {
            for (col in 0 until dotCols) {
                val x = col * dotSpacingX + dotSpacingX / 2
                val y = row * dotSpacingY + dotSpacingY / 2

                val scanProgress = scanLine * size.height
                val distFromScan = Math.abs(y - scanProgress)
                val alpha = when {
                    distFromScan < 24f -> 0.9f
                    distFromScan < 60f -> 0.4f
                    else -> 0.08f
                }

                drawCircle(
                    color = accentColor.copy(alpha = alpha),
                    radius = 2.2f,
                    center = Offset(x, y)
                )
            }
        }

        // Cursor blink at scan centre
        val cursorY = scanLine * size.height
        drawRect(
            color = accentColor.copy(alpha = blink),
            topLeft = Offset(size.width / 2 - 6f, cursorY - 8f),
            size = androidx.compose.ui.geometry.Size(12f, 16f)
        )
    }
}
