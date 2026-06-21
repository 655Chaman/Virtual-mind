package com.example.virtualmind.feature.dashboard

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.virtualmind.core.designsystem.theme.PillarTerminal
import com.example.virtualmind.core.designsystem.theme.ShareTechMono
import com.example.virtualmind.core.designsystem.theme.VmObsidian
import com.example.virtualmind.core.designsystem.theme.VmSurface
import com.example.virtualmind.core.designsystem.theme.VmSurface2

@Composable
fun TerminalScreen(
    viewModel: TerminalViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val chatHistory by viewModel.chatHistory.collectAsState()
    val isStreaming by viewModel.isStreaming.collectAsState()
    val streamingResponse by viewModel.currentStreamingResponse.collectAsState()

    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val focusRequester = remember { FocusRequester() }

    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(chatHistory.size, streamingResponse) {
        if (chatHistory.isNotEmpty() || streamingResponse.isNotEmpty()) {
            val target = if (streamingResponse.isNotEmpty()) chatHistory.size else chatHistory.size - 1
            listState.animateScrollToItem(target)
        }
    }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(VmObsidian)
    ) {
        // HEADER
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .border(width = 1.dp, color = VmSurface2)
                .background(VmObsidian.copy(alpha = 0.95f))
                .padding(horizontal = 24.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onNavigateBack, modifier = Modifier.size(24.dp)) {
                    Text("<", color = Color.Gray, fontFamily = ShareTechMono)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "VIRTUAL MIND TERMINAL",
                    color = PillarTerminal,
                    fontFamily = ShareTechMono,
                    letterSpacing = 2.sp,
                    fontSize = 16.sp
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                val infiniteTransition = rememberInfiniteTransition()
                val pulseAlpha by infiniteTransition.animateFloat(
                    initialValue = 0.3f,
                    targetValue = 1f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(1000, easing = LinearEasing),
                        repeatMode = RepeatMode.Reverse
                    )
                )
                
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .background(
                            color = if (isStreaming) Color(0xFFFFD700) else PillarTerminal,
                            shape = CircleShape
                        )
                        .alpha(if (isStreaming) pulseAlpha else 1f)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = if (isStreaming) "PROCESSING" else "READY",
                    color = if (isStreaming) Color(0xFFFFD700) else PillarTerminal,
                    fontFamily = ShareTechMono,
                    fontSize = 10.sp,
                    letterSpacing = 2.sp
                )
            }
        }

        // CHAT LOGS
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 24.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Reverse so oldest is top, but chatHistory from DAO comes sorted DESC? Wait DAO is ordered DESC, we should order ASC.
            // Let's assume chatHistory is chronological. If it's DESC, we need to reversed() it here.
            items(chatHistory.reversed()) { msg ->
                if (msg.isSystemGenerated) {
                    if (msg.content.startsWith(">")) {
                        Text(
                            text = msg.content,
                            color = Color.Gray.copy(alpha = 0.6f),
                            fontFamily = ShareTechMono,
                            fontSize = 10.sp,
                            letterSpacing = 2.sp
                        )
                    } else {
                        // VM Response
                        Row {
                            Box(modifier = Modifier.width(2.dp).height(24.dp).background(PillarTerminal.copy(alpha = 0.3f)))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = msg.content,
                                color = Color.LightGray,
                                fontFamily = ShareTechMono,
                                fontSize = 14.sp
                            )
                        }
                    }
                } else {
                    // User Message
                    Row {
                        Text(">", color = PillarTerminal.copy(alpha = 0.4f), fontFamily = ShareTechMono)
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = msg.content,
                            color = Color.Gray,
                            fontFamily = ShareTechMono,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            // Current Streaming Item
            if (isStreaming) {
                item {
                    Row {
                        Box(modifier = Modifier.width(2.dp).height(24.dp).background(PillarTerminal.copy(alpha = 0.6f)))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = if (streamingResponse.isEmpty()) "..." else streamingResponse,
                            color = Color.LightGray,
                            fontFamily = ShareTechMono,
                            fontSize = 14.sp
                        )
                        // Cursor
                        val infiniteTransition = rememberInfiniteTransition()
                        val cursorAlpha by infiniteTransition.animateFloat(
                            initialValue = 0f,
                            targetValue = 1f,
                            animationSpec = infiniteRepeatable(tween(500), RepeatMode.Reverse)
                        )
                        Box(modifier = Modifier.padding(top = 4.dp, start = 4.dp).width(6.dp).height(14.dp).background(PillarTerminal.copy(alpha = cursorAlpha)))
                    }
                }
            }
        }

        // INPUT FIELD
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .border(width = 1.dp, color = VmSurface2)
                .background(VmObsidian.copy(alpha = 0.95f))
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(VmSurface)
                    .border(1.dp, VmSurface2)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(">", color = PillarTerminal, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.width(8.dp))
                BasicTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    modifier = Modifier.weight(1f).focusRequester(focusRequester),
                    textStyle = TextStyle(color = Color.White, fontFamily = ShareTechMono, fontSize = 14.sp),
                    cursorBrush = SolidColor(PillarTerminal),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(onSend = {
                        viewModel.sendMessage(inputText)
                        inputText = ""
                    }),
                    decorationBox = { innerTextField ->
                        if (inputText.isEmpty()) {
                            Text(if (isStreaming) "PROCESSING..." else "ENTER COMMAND...", color = Color.Gray.copy(alpha = 0.4f), fontFamily = ShareTechMono, fontSize = 14.sp)
                        }
                        innerTextField()
                    }
                )
                IconButton(
                    onClick = { 
                        viewModel.sendMessage(inputText)
                        inputText = ""
                    },
                    enabled = !isStreaming && inputText.isNotBlank(),
                    modifier = Modifier.size(24.dp)
                ) {
                    Text(">>", color = if (!isStreaming && inputText.isNotBlank()) PillarTerminal else Color.Gray.copy(alpha=0.3f), fontFamily = ShareTechMono)
                }
            }
            Text(
                text = "NAFS FILTER ACTIVE — DRIFT WILL BE CALLED OUT",
                color = Color.Gray.copy(alpha = 0.3f),
                fontFamily = ShareTechMono,
                fontSize = 9.sp,
                letterSpacing = 2.sp,
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(top = 8.dp)
            )
        }
    }
}
