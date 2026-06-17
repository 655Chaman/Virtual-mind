package com.example.virtualmind.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// ─────────────────────────────────────────────────────────────────────────────
// Dark Color Scheme  (Parrot Green on deep-black backgrounds)
// ─────────────────────────────────────────────────────────────────────────────
private val DarkColorScheme = darkColorScheme(
    // ── Primary ──────────────────────────────────────────────────────────────
    primary              = ParrotGreenLight,   // buttons, FAB, active indicators
    onPrimary            = GreenSurfaceDark,   // text/icons ON primary color
    primaryContainer     = ParrotGreenDark,    // filled chips, tonal containers
    onPrimaryContainer   = TextOnGreen,        // text inside primary containers

    // ── Secondary ────────────────────────────────────────────────────────────
    secondary            = SecondaryGreenLight,
    onSecondary          = Color(0xFF0E1F1C),
    secondaryContainer   = Color(0xFF1E3D35),
    onSecondaryContainer = SecondaryGreenLight,

    // ── Tertiary ─────────────────────────────────────────────────────────────
    tertiary             = TertiaryMint,
    onTertiary           = GreenSurfaceDark,
    tertiaryContainer    = Color(0xFF1A4030),
    onTertiaryContainer  = TertiaryMint,

    // ── Error ─────────────────────────────────────────────────────────────────
    error                = StatusError,
    onError              = Color.White,
    errorContainer       = Color(0xFF7F1D1D),
    onErrorContainer     = Color(0xFFFFCDD2),

    // ── Background / Surface ─────────────────────────────────────────────────
    background           = GreenSurfaceDark,
    onBackground         = TextOnGreen,
    surface              = BackgroundCard,     // cards, bottom sheets, dialogs
    onSurface            = TextPrimary,
    surfaceVariant       = BackgroundElevated, // chip fills, text-field bg
    onSurfaceVariant     = TextSecondary,

    // ── Outline ───────────────────────────────────────────────────────────────
    outline              = BackgroundElevated, // default borders
    outlineVariant       = Color(0xFF3A3A3A),  // subtle/unfocused borders

    // ── Inverse (snack bars, tooltips) ────────────────────────────────────────
    inverseSurface       = TextPrimary,
    inverseOnSurface     = BackgroundPrimary,
    inversePrimary       = ParrotGreenDark,

    // ── Scrim ─────────────────────────────────────────────────────────────────
    scrim                = OverlayScrim,
)

// ─────────────────────────────────────────────────────────────────────────────
// Light Color Scheme  (Parrot Green on crisp off-white backgrounds)
// ─────────────────────────────────────────────────────────────────────────────
private val LightColorScheme = lightColorScheme(
    // ── Primary ──────────────────────────────────────────────────────────────
    primary              = ParrotGreen,
    onPrimary            = Color.White,
    primaryContainer     = GreenSurfaceCard,
    onPrimaryContainer   = ParrotGreenDark,

    // ── Secondary ────────────────────────────────────────────────────────────
    secondary            = SecondaryGreen,
    onSecondary          = Color.White,
    secondaryContainer   = Color(0xFFCFE8E2),
    onSecondaryContainer = Color(0xFF0F2D27),

    // ── Tertiary ─────────────────────────────────────────────────────────────
    tertiary             = TertiaryForest,
    onTertiary           = Color.White,
    tertiaryContainer    = Color(0xFFB7E4C7),
    onTertiaryContainer  = Color(0xFF0B2415),

    // ── Error ─────────────────────────────────────────────────────────────────
    error                = Color(0xFFB91C1C),
    onError              = Color.White,
    errorContainer       = Color(0xFFFEE2E2),
    onErrorContainer     = Color(0xFF7F1D1D),

    // ── Background / Surface ─────────────────────────────────────────────────
    background           = GreenSurfaceLight,
    onBackground         = TextOnLight,
    surface              = GreenSurfaceCard,
    onSurface            = TextOnLight,
    surfaceVariant       = Color(0xFFD9EDE6),
    onSurfaceVariant     = Color(0xFF3D5A52),

    // ── Outline ───────────────────────────────────────────────────────────────
    outline              = SecondaryGreen,
    outlineVariant       = Color(0xFFBDD5CE),

    // ── Inverse ───────────────────────────────────────────────────────────────
    inverseSurface       = Color(0xFF1C3028),
    inverseOnSurface     = GreenSurfaceLight,
    inversePrimary       = ParrotGreenLight,

    // ── Scrim ─────────────────────────────────────────────────────────────────
    scrim                = Color(0xCC000000),
)

// ─────────────────────────────────────────────────────────────────────────────
// VirtualMindTheme  — always uses the custom palette (no dynamic wallpaper color)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun VirtualMindTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography  = Typography,
        content     = content,
    )
}
