package com.example.virtualmind.theme

import androidx.compose.ui.graphics.Color

// ─────────────────────────────────────────────────────────────────────────────
// VIRTUAL MIND — Complete Color Design System (Cinematic HUD)
// ─────────────────────────────────────────────────────────────────────────────

// ── Core Brand ───────────────────────────────────────────────────────────────
val VioletAccent       = Color(0xFF807BFF)   // Primary: Violet/Periwinkle
val VioletAccentLight  = Color(0xFFA09BFF)
val VioletAccentDark   = Color(0xFF5A55B3)
val VioletAccentSubtle = Color(0x26807BFF)   // 15% alpha
val AccentGold         = Color(0xFFD4AF37)   // Classic Gold for editorial pages
val DeepNavyBackground = Color(0xFF02040A)   // Deepest navy blue for Deen page

// ── Fitness Theme ────────────────────────────────────────────────────────────
val NeonGreen          = Color(0xFFA3FF00)   // Musefit style neon green
val NeonGreenSubtle    = Color(0x33A3FF00)
val FitnessBackground  = Color(0xFF0D0D0D)   // Dark matte finish

// ── Recovery Theme ───────────────────────────────────────────────────────────
val RecoveryDeepPurple   = Color(0xFF130922)
val RecoveryAccentPurple = Color(0xFF8B5CF6)
val RecoveryCardSurface  = Color(0xFF1C122C)
val RecoveryGlowTop      = Color(0xFF3B1E63)

// ── Self / AI Accountability Theme ───────────────────────────────────────────
val SelfCyberCyan        = Color(0xFF00F0FF)
val SelfCyberCyanSubtle  = Color(0x3300F0FF)
val SelfBackgroundMatte  = Color(0xFF050505)
val SelfTerminalCard     = Color(0xFF0A0A0A)
val SelfTerminalBorder   = Color(0xFF1A1A1A)

// ── Backgrounds ──────────────────────────────────────────────────────────────
val BackgroundDeep     = Color(0xFF000000)   // Pure black background
val BackgroundPrimary  = Color(0xFF000000)   // App background
val BackgroundCard     = Color(0xFF080808)   // Very dark card surface
val BackgroundElevated = Color(0xFF111111)   // Elevated surface

// ── Text ─────────────────────────────────────────────────────────────────────
val TextPrimary        = Color(0xFFFFFFFF)   // Pure white
val TextSecondary      = Color(0xFFB0B0B0)
val TextDim            = Color(0xFF666666)
val TextOnViolet       = Color(0xFFFFFFFF)
val TextMonospace      = Color(0xFFD4D4D4)

// ── Status / Semantic ─────────────────────────────────────────────────────────
val StatusError        = Color(0xFFFF4B4B)
val StatusWarning      = Color(0xFFF59E0B)
val StatusSuccess      = Color(0xFF22C55E)
val StatusInfo         = VioletAccent

// ── Interactive Elements ──────────────────────────────────────────────────────
val ButtonPrimary      = VioletAccent
val ButtonPrimaryText  = Color(0xFFFFFFFF)
val ButtonSecondary    = BackgroundElevated
val ButtonSecondaryText= Color(0xFFFFFFFF)

// ── Input Fields ─────────────────────────────────────────────────────────────
val InputBackground    = BackgroundPrimary
val InputBorderDefault = BackgroundElevated
val InputBorderFocused = VioletAccent
val InputText          = TextPrimary
val InputLabel         = TextDim

// ── Navigation / Tab bar ─────────────────────────────────────────────────────
val NavBackground      = BackgroundCard
val NavItemActive      = VioletAccent
val NavItemInactive    = TextDim
val NavIndicator       = VioletAccentSubtle

// ── Loading / Progress ───────────────────────────────────────────────────────
val LoadingSpinner     = VioletAccent
val LoadingText        = TextDim
val LoadingBackground  = BackgroundPrimary

// ── Settings / Error Overlay ─────────────────────────────────────────────────
val OverlayScrim       = Color(0xF2000000)
val OverlayCard        = BackgroundCard
val OverlayBorder      = BackgroundElevated
val OverlayTitle       = VioletAccent
val OverlaySubtitle    = TextPrimary
val OverlayHelpText    = TextDim
val OverlayError       = StatusError

// ── Dividers / Separators ────────────────────────────────────────────────────
val DividerColor       = BackgroundElevated

// ── Badges ───────────────────────────────────────────────────────────────────
val BadgeGeneral       = VioletAccent
