package com.example.virtualmind.feature.dashboard

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.style.TextAlign
import com.example.virtualmind.core.designsystem.theme.PillarDeen
import com.example.virtualmind.core.designsystem.theme.VirtualMindTypography
import kotlinx.coroutines.delay

@Composable
fun WelcomeScreen(
    onNavigateToDashboard: () -> Unit
) {
    var isTransitioning by remember { mutableStateOf(false) }

    // This animates the opacity from 1f to 0f when transitioning
    val alpha by animateFloatAsState(
        targetValue = if (isTransitioning) 0f else 1f,
        animationSpec = tween(durationMillis = 700),
        label = "fade_out"
    )

    LaunchedEffect(isTransitioning) {
        if (isTransitioning) {
            delay(600) // Wait for fade out
            onNavigateToDashboard()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .graphicsLayer(alpha = alpha)
            .clickable { isTransitioning = true },
        contentAlignment = Alignment.Center
    ) {
        // Radial gradient background
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(Color(0xFF18181B).copy(alpha = 0.4f), Color.Black, Color.Black),
                        radius = 1000f
                    )
                )
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "SYSTEM ONLINE",
                style = VirtualMindTypography.body.copy(
                    color = PillarDeen.copy(alpha = 0.7f),
                    fontSize = 12.sp,
                    letterSpacing = 5.sp,
                    fontWeight = FontWeight.Light
                )
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = buildAnnotatedString {
                    append("WELCOME BACK\n")
                    withStyle(style = SpanStyle(color = PillarDeen)) {
                        append("CHAMAN")
                    }
                },
                style = VirtualMindTypography.h1.copy(
                    color = Color.White,
                    letterSpacing = 8.sp
                ),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Thin divider line
            Box(
                modifier = Modifier
                    .height(2.dp)
                    .width(96.dp)
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(Color.Transparent, PillarDeen.copy(alpha = 0.5f), Color.Transparent)
                        )
                    )
            )

            Spacer(modifier = Modifier.height(64.dp))

            // Pulse text
            Text(
                text = "TAP TO BEGIN",
                style = VirtualMindTypography.body.copy(
                    color = Color.Gray,
                    fontSize = 12.sp,
                    letterSpacing = 3.sp,
                    fontWeight = FontWeight.Bold
                )
            )
        }
    }
}
