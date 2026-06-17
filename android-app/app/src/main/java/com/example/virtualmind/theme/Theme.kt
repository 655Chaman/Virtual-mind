package com.example.virtualmind.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// ─────────────────────────────────────────────────────────────────────────────
// Dark Color Scheme  (Cinematic HUD)
// ─────────────────────────────────────────────────────────────────────────────
private val CinematicColorScheme = darkColorScheme(
    primary              = VioletAccent,
    onPrimary            = Color.White,
    primaryContainer     = VioletAccentDark,
    onPrimaryContainer   = Color.White,

    secondary            = VioletAccentLight,
    onSecondary          = BackgroundDeep,
    secondaryContainer   = BackgroundElevated,
    onSecondaryContainer = VioletAccentLight,

    tertiary             = Color.White,
    onTertiary           = BackgroundDeep,
    tertiaryContainer    = BackgroundCard,
    onTertiaryContainer  = Color.White,

    error                = StatusError,
    onError              = Color.White,
    errorContainer       = Color(0xFF7F1D1D),
    onErrorContainer     = Color(0xFFFFCDD2),

    background           = BackgroundDeep,
    onBackground         = TextPrimary,
    surface              = BackgroundDeep,     // Pure black cards
    onSurface            = TextPrimary,
    surfaceVariant       = BackgroundCard,
    onSurfaceVariant     = TextSecondary,

    outline              = BackgroundElevated,
    outlineVariant       = Color(0xFF3A3A3A),

    inverseSurface       = TextPrimary,
    inverseOnSurface     = BackgroundPrimary,
    inversePrimary       = VioletAccentDark,

    scrim                = OverlayScrim,
)

// ─────────────────────────────────────────────────────────────────────────────
// VirtualMindTheme  — forces the cinematic dark palette
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun VirtualMindTheme(
    darkTheme: Boolean = true, // Force dark theme for aesthetic
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = CinematicColorScheme,
        typography  = Typography,
        content     = content,
    )
}
