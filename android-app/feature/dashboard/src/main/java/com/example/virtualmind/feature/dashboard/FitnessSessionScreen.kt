package com.example.virtualmind.feature.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.virtualmind.core.designsystem.theme.PillarFitness
import com.example.virtualmind.core.designsystem.theme.ShareTechMono
import com.example.virtualmind.core.designsystem.theme.neonGlow
import com.example.virtualmind.feature.dashboard.HapticEngine
import kotlinx.coroutines.delay

@Composable
fun FitnessSessionScreen(
    onNavigateBack: () -> Unit,
    onComplete: () -> Unit
) {
    val context = LocalContext.current
    var secondsElapsed by remember { mutableStateOf(0) }
    
    LaunchedEffect(Unit) {
        while(true) {
            delay(1000)
            secondsElapsed++
        }
    }

    val hours = secondsElapsed / 3600
    val minutes = (secondsElapsed % 3600) / 60
    val seconds = secondsElapsed % 60
    val timeString = String.format("%02d:%02d:%02d", hours, minutes, seconds)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020813))
    ) {
        Column(
            modifier = Modifier.fillMaxSize().systemBarsPadding()
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "[ ABORT ]",
                    color = Color.Red,
                    fontFamily = ShareTechMono,
                    fontSize = 12.sp,
                    letterSpacing = 2.sp,
                    modifier = Modifier.clickable {
                        HapticEngine.tick(context)
                        onNavigateBack()
                    }
                )
                Text(
                    text = "ACTIVE_SESSION",
                    color = PillarFitness,
                    fontFamily = ShareTechMono,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    letterSpacing = 4.sp
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            // Timer
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "ELAPSED TIME",
                    color = Color.Gray,
                    fontFamily = ShareTechMono,
                    fontSize = 12.sp,
                    letterSpacing = 4.sp
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = timeString,
                    color = Color.White,
                    fontFamily = ShareTechMono,
                    fontSize = 64.sp,
                    fontWeight = FontWeight.Black,
                    modifier = Modifier.neonGlow(PillarFitness, radius = 20.dp, alpha = 0.5f)
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            // Finish Button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .height(64.dp)
                    .neonGlow(PillarFitness, radius = 16.dp, alpha = 0.4f)
                    .background(Color(0xFF050C18), RoundedCornerShape(12.dp))
                    .border(2.dp, PillarFitness, RoundedCornerShape(12.dp))
                    .clickable {
                        HapticEngine.thud(context)
                        onComplete()
                    },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "FINISH SESSION",
                    color = PillarFitness,
                    fontFamily = ShareTechMono,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 4.sp
                )
            }
        }
    }
}
