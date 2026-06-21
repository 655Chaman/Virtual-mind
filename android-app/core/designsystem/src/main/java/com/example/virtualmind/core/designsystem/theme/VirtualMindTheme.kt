package com.example.virtualmind.core.designsystem.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    background = VmObsidian,
    surface = VmSurface,
    surfaceVariant = VmSurface2,
    onBackground = VmForeground,
    onSurface = VmForeground,
    primary = VmParrotGreen,
    error = SystemError
)

private val LightColorScheme = lightColorScheme(
    background = androidx.compose.ui.graphics.Color(0xFFFDFDFD),
    surface = androidx.compose.ui.graphics.Color(0xFFF3F4F6),
    surfaceVariant = androidx.compose.ui.graphics.Color(0xFFE5E7EB),
    onBackground = androidx.compose.ui.graphics.Color(0xFF111111),
    onSurface = androidx.compose.ui.graphics.Color(0xFF111111),
    primary = VmParrotGreen,
    error = SystemError
)

@Composable
fun VirtualMindTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // For VirtualMind, we heavily lean into Dark Theme based on globals.css
    // But we provide LightTheme fallback just in case
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        // We will wire up custom material typography if needed,
        // but typically we'll use VirtualMindTypography objects directly for total control
        content = content
    )
}
