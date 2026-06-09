package com.example.virtualmind.theme

import androidx.compose.ui.graphics.Color

// ─────────────────────────────────────────────────────────────────────────────
// VIRTUAL MIND — Complete Color Design System
// Every UI surface, element, and state has an explicit, named color token.
// ─────────────────────────────────────────────────────────────────────────────

// ── Core Brand ───────────────────────────────────────────────────────────────
val ParrotGreen        = Color(0xFF00A86B)   // Primary: Parrot Green  (buttons, CTAs, nav active)
val ParrotGreenLight   = Color(0xFF5DDBAA)   // Light green  (dark-theme primary)
val ParrotGreenDark    = Color(0xFF007A4D)   // Deep green   (pressed states, containers)
val ParrotGreenSubtle  = Color(0xFF00A86B26) // 15 % alpha   (selected row tint, soft highlights)

// ── Backgrounds ──────────────────────────────────────────────────────────────
val BackgroundDeep     = Color(0xFF060606)   // Deepest black (WebView backdrop, boot screen)
val BackgroundPrimary  = Color(0xFF0A0A0A)   // App background (Obsidian)
val BackgroundCard     = Color(0xFF141414)   // Card / sheet surface
val BackgroundElevated = Color(0xFF222222)   // Elevated chip / divider surface

// ── Dark-theme green tinted backgrounds ──────────────────────────────────────
val GreenSurfaceDark   = Color(0xFF00201A)   // Dark screen surface (green tinted)
val GreenSurfaceMid    = Color(0xFF003326)   // Slightly lighter dark surface

// ── Light-theme green tinted backgrounds ─────────────────────────────────────
val GreenSurfaceLight  = Color(0xFFF0FBF5)   // Screen background (light mode)
val GreenSurfaceCard   = Color(0xFFE6F9F2)   // Card background (light mode)

// ── Text ─────────────────────────────────────────────────────────────────────
val TextPrimary        = Color(0xFFFFFFFF)   // Main body text on dark bg
val TextSecondary      = Color(0xFFB0B0B0)   // Secondary / caption text
val TextDim            = Color(0xFF888888)   // Dimmed / hint text
val TextOnGreen        = Color(0xFFCCFFEB)   // Text drawn on dark-green surfaces
val TextOnLight        = Color(0xFF0D1F18)   // Text on light-mode background
val TextMonospace      = Color(0xFFD4D4D4)   // Mono/code text (settings panel)

// ── Status / Semantic ─────────────────────────────────────────────────────────
val StatusError        = Color(0xFFEF4444)   // Errors, failed connection
val StatusWarning      = Color(0xFFF59E0B)   // Warnings, caution states
val StatusSuccess      = Color(0xFF22C55E)   // Confirmations, completed actions
val StatusInfo         = Color(0xFF3B82F6)   // Informational badges

// ── Accent: Gold (settings panel, title branding) ────────────────────────────
val AccentGold         = Color(0xFFC9A84C)   // Gold accent (headings, highlight)
val AccentGoldDim      = Color(0xFF8C7435)   // Dimmed gold (labels, borders)
val AccentGoldBright   = Color(0xFFFFDF7D)   // Bright gold (hover/active gold)

// ── Interactive Elements ──────────────────────────────────────────────────────
val ButtonPrimary      = ParrotGreen         // Primary action button fill
val ButtonPrimaryText  = Color(0xFFFFFFFF)   // Text on primary button
val ButtonSecondary    = BackgroundElevated  // Secondary action button fill
val ButtonSecondaryText= Color(0xFFFFFFFF)   // Text on secondary button
val ButtonDestructive  = Color(0xFF7F1D1D)   // Destructive / danger button fill
val ButtonDestructiveText = Color(0xFFFFFFFF)// Text on destructive button

// ── Input Fields ─────────────────────────────────────────────────────────────
val InputBackground    = BackgroundPrimary   // Text-field container fill
val InputBorderDefault = BackgroundElevated  // Unfocused border
val InputBorderFocused = ParrotGreen         // Focused border
val InputText          = TextPrimary         // Typed text
val InputLabel         = AccentGoldDim       // Floating label

// ── Navigation / Tab bar ─────────────────────────────────────────────────────
val NavBackground      = BackgroundCard      // Bottom nav bar background
val NavItemActive      = ParrotGreen         // Active tab icon + label
val NavItemInactive    = TextDim             // Inactive tab icon + label
val NavIndicator       = ParrotGreenSubtle   // Active-item background pill

// ── Loading / Progress ───────────────────────────────────────────────────────
val LoadingSpinner     = AccentGold          // Circular progress indicator
val LoadingText        = AccentGoldDim       // "CONNECTING…" label below spinner
val LoadingBackground  = BackgroundPrimary   // Full-screen loading backdrop

// ── Settings / Error Overlay ─────────────────────────────────────────────────
val OverlayScrim       = Color(0xF20A0A0A)   // 95 % black scrim behind modals
val OverlayCard        = BackgroundCard      // Settings card background
val OverlayBorder      = BackgroundElevated  // Settings card border
val OverlayTitle       = AccentGold          // "VIRTUAL MIND 2.0" heading
val OverlaySubtitle    = AccentGold          // "OPERATOR CONTROL PANEL" subheading
val OverlayError       = StatusError         // "CONNECTION FAILURE" label
val OverlayHelpText    = Color(0xFFD1D5DB)   // Helper instruction text

// ── Dividers / Separators ────────────────────────────────────────────────────
val DividerColor       = BackgroundElevated  // Horizontal rules inside cards

// ── Secondary / Tertiary brand shades (for Compose MaterialTheme slots) ──────
val SecondaryGreen     = Color(0xFF52796F)   // Muted green — secondary Material slot
val SecondaryGreenLight= Color(0xFFB2D8D0)   // Light secondary (dark-theme)
val TertiaryForest     = Color(0xFF2D6A4F)   // Deep forest green — tertiary slot
val TertiaryMint       = Color(0xFF95D5B2)   // Mint — tertiary on dark theme

// ── Notification / Badge ─────────────────────────────────────────────────────
val BadgePrayer        = Color(0xFF10B981)   // Salah / prayer notification badge
val BadgeAlarm         = Color(0xFFF97316)   // Rest-timer alarm badge
val BadgeGeneral       = ParrotGreen         // General alert badge
