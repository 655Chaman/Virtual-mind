package com.example.virtualmind.feature.dashboard

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.virtualmind.core.designsystem.theme.PillarDeen
import com.example.virtualmind.core.designsystem.theme.PillarWellness
import com.example.virtualmind.core.designsystem.theme.PillarElesium
import com.example.virtualmind.core.designsystem.theme.PillarFitness
import com.example.virtualmind.core.designsystem.theme.PillarSelf
import com.example.virtualmind.core.designsystem.theme.PillarQadr
import com.example.virtualmind.core.designsystem.theme.VirtualMindTypography
import java.util.Calendar

data class PillarConfig(
    val id: String,
    val label: String,
    val subtitle: String,
    val color: Color,
    val tag: String,
    val route: String
)

val AllPillars = listOf(
    PillarConfig("deen", "DEEN", "Salah · Quran · Adhkar", PillarDeen, "FOUNDATION", "deen_route"),
    PillarConfig("fitness", "FITNESS", "Workout · Training · Progress", PillarFitness, "BODY", "fitness_route"),
    PillarConfig("wellness", "RECOVERY", "Sleep · Fasting · Hydration", PillarWellness, "WELLNESS", "wellness_route"),
    PillarConfig("elesium", "ELESIUM", "Sales · Meetings · Revenue", PillarElesium, "EMPIRE", "elesium_route"),
    PillarConfig("self", "SELF", "Reflection · Patterns · Flaws", PillarSelf, "INNER", "self_route"),
    PillarConfig("oracle", "SYNC", "Nightly Algorithm Update", PillarQadr, "THE ORACLE", "oracle_route")
)

@androidx.compose.foundation.ExperimentalFoundationApi
@Composable
fun DashboardSwipeScreen(
    onNavigateToPillar: (String) -> Unit
) {
    var sortedPillars by remember { mutableStateOf(AllPillars) }

    // Dynamic Time-Based Sorting
    LaunchedEffect(Unit) {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val sorted = AllPillars.toMutableList()

        if (hour in 4..8) {
            sorted.sortBy { listOf("fitness", "deen").indexOf(it.id).let { idx -> if (idx == -1) 99 else idx } }
        } else if (hour in 9..17) {
            sorted.sortBy { listOf("elesium", "deen").indexOf(it.id).let { idx -> if (idx == -1) 99 else idx } }
        } else if (hour in 18..21) {
            sorted.sortBy { listOf("wellness", "elesium", "deen").indexOf(it.id).let { idx -> if (idx == -1) 99 else idx } }
        } else {
            sorted.sortBy { listOf("wellness", "oracle", "self").indexOf(it.id).let { idx -> if (idx == -1) 99 else idx } }
        }
        sortedPillars = sorted
    }

    val pagerState = rememberPagerState(pageCount = { sortedPillars.size })

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { page ->
            val isSelected = pagerState.currentPage == page
            val pillar = sortedPillars[page]

            // Match Framer Motion transitions
            val scale by animateFloatAsState(if (isSelected) 1f else 0.92f, tween(500), label = "scale")
            val alpha by animateFloatAsState(if (isSelected) 1f else 0.2f, tween(500), label = "alpha")
            val blur by animateFloatAsState(if (isSelected) 0f else 4f, tween(500), label = "blur")
            val offsetX by animateFloatAsState(if (isSelected) 0f else 20f, tween(600), label = "offset")

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp)
                    .scale(scale)
                    .alpha(alpha)
                    .blur(blur.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 120.dp), // Space for bottom buttons
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = pillar.tag,
                        style = VirtualMindTypography.body.copy(
                            color = pillar.color.copy(alpha = 0.8f),
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 4.sp,
                            fontSize = 12.sp
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = pillar.label,
                        style = VirtualMindTypography.h1.copy(
                            color = Color.White,
                            letterSpacing = 6.sp,
                            fontSize = 42.sp
                        )
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Box(
                        modifier = Modifier
                            .height(4.dp)
                            .width(80.dp)
                            .background(pillar.color, RoundedCornerShape(50))
                    )
                    Spacer(modifier = Modifier.height(32.dp))
                    Text(
                        text = pillar.subtitle,
                        style = VirtualMindTypography.body.copy(
                            color = Color.LightGray.copy(alpha = 0.9f),
                            letterSpacing = 1.sp,
                            fontSize = 14.sp
                        )
                    )
                }

                // Interactive Buttons
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 64.dp)
                        .fillMaxWidth()
                ) {
                    // Enter Pillar Button
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(64.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .clickable { onNavigateToPillar(pillar.route) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "ENTER ${pillar.label}",
                            style = VirtualMindTypography.body.copy(
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp,
                                fontSize = 12.sp
                            )
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Global Command Button
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(64.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.Black.copy(alpha = 0.6f))
                            .clickable { onNavigateToPillar("global_command") },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "GLOBAL COMMAND",
                            style = VirtualMindTypography.body.copy(
                                color = Color.Gray,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp,
                                fontSize = 10.sp
                            )
                        )
                    }
                }
            }
        }

        // Pagination Line Indicators
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            sortedPillars.forEachIndexed { index, pillar ->
                val isSelected = pagerState.currentPage == index
                val width by animateFloatAsState(if (isSelected) 32f else 8f, tween(300), label = "lineWidth")
                val indicatorColor = if (isSelected) pillar.color else Color.White.copy(alpha = 0.2f)
                
                Box(
                    modifier = Modifier
                        .height(4.dp)
                        .width(width.dp)
                        .background(indicatorColor, RoundedCornerShape(50))
                )
            }
        }
    }
}
