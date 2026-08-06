package com.ms.messenger.theme

import androidx.compose.ui.graphics.Color

// iOS-style palette
val BgDark = Color(0xFF0D0D0D)
val BgLight = Color(0xFFF2F2F7)
val SurfaceDark = Color(0xFF1C1C1E)
val SurfaceLight = Color(0xFFFFFFFF)
val CardDark = Color(0xFF2C2C2E)
val CardLight = Color(0xFFFFFFFF)

val TextPrimaryDark = Color(0xFFFFFFFF)
val TextPrimaryLight = Color(0xFF000000)
val TextSecondaryDark = Color(0xFF8E8E93)
val TextSecondaryLight = Color(0xFF636366)
val DividerDark = Color(0xFF38383A)
val DividerLight = Color(0xFFD1D1D6)

val BubbleOtherDark = Color(0x1AFFFFFF) // white 10%
val BubbleOtherLight = Color(0xFFE9E9EB)
val InputBgDark = Color(0x1AFFFFFF)
val InputBgLight = Color(0xFFE9E9EB)

val ErrorRed = Color(0xFFFF453A)
val OnlineGreen = Color(0xFF34C759)

// Accent choices (AppearanceSettingsView)
val AccentWhite = Color(0xFF8E8E93)
val AccentBlack = Color(0xFF000000)
val AccentPurple = Color(0xFF6C63FF)
val AccentBlue = Color(0xFF007AFF)
val AccentGreen = Color(0xFF34C759)
val AccentRed = Color(0xFFFF3B30)
val AccentOrange = Color(0xFFFF9500)
val AccentPink = Color(0xFFFF2D55)

// Rarity colors (Gifts)
val RarityCommon = Color(0xFF8E8E93)
val RarityRare = Color(0xFF5AC8FA)
val RarityEpic = Color(0xFFAF52DE)
val RarityLegendary = Color(0xFFFF9500)
val RarityMythic = Color(0xFFFF3B30)

val profileColors = listOf(
    "#FF6C63FF", "#FF007AFF", "#FF34C759", "#FFFF3B30",
    "#FFFF9500", "#FFFF2D55", "#FF5AC8FA", "#FFAF52DE"
)

fun parseHex(hex: String?): Color? {
    if (hex.isNullOrBlank()) return null
    return try {
        val clean = hex.removePrefix("#")
        when (clean.length) {
            6 -> Color(("FF" + clean).toLong(16))
            8 -> Color(clean.toLong(16))
            else -> null
        }
    } catch (e: Exception) { null }
}

fun isLightColor(color: Color): Boolean {
    val luminance = 0.299 * color.red + 0.587 * color.green + 0.114 * color.blue
    return luminance > 0.5
}