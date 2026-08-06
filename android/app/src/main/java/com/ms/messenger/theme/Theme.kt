package com.ms.messenger.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import com.ms.messenger.data.ThemeManagerStore

data class AppThemeColors(
    val isDark: Boolean,
    val bg: Color,
    val chatBg: Color,
    val surface: Color,
    val card: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val divider: Color,
    val accent: Color,
    val accentText: Color,
    val bubbleOwn: Color,
    val bubbleOwnText: Color,
    val bubbleOther: Color,
    val bubbleOtherText: Color,
    val inputBg: Color,
    val error: Color,
)

object ThemeManager {
    var accentHex by mutableStateOf(ThemeManagerStore.accentHex)
    var themeMode by mutableStateOf(ThemeManagerStore.themeMode)

    fun applyAccent(hex: String) {
        accentHex = hex
        ThemeManagerStore.accentHex = hex
    }
    fun applyThemeMode(mode: String) {
        themeMode = mode
        ThemeManagerStore.themeMode = mode
    }
}

fun defaultAccent(isDark: Boolean): Color = if (isDark) AccentWhite else AccentBlack

fun resolvedAccent(isDark: Boolean): Color {
    val custom = parseHex(ThemeManager.accentHex)
    return custom ?: defaultAccent(isDark)
}

@Composable
fun AppTheme(
    darkTheme: Boolean = when (ThemeManager.themeMode) {
        "light" -> false
        "dark" -> true
        else -> isSystemInDarkTheme()
    },
    content: @Composable () -> Unit
) {
    val accent = resolvedAccent(darkTheme)
    val accentText = if (isLightColor(accent)) Color.Black else Color.White

    val colors = remember(darkTheme, accent) {
        if (darkTheme) AppThemeColors(
            isDark = true,
            bg = BgDark,
            chatBg = BgDark,
            surface = SurfaceDark,
            card = CardDark,
            textPrimary = TextPrimaryDark,
            textSecondary = TextSecondaryDark,
            divider = DividerDark,
            accent = accent,
            accentText = accentText,
            bubbleOwn = accent,
            bubbleOwnText = accentText,
            bubbleOther = BubbleOtherDark,
            bubbleOtherText = TextPrimaryDark,
            inputBg = InputBgDark,
            error = ErrorRed,
        ) else AppThemeColors(
            isDark = false,
            bg = BgLight,
            chatBg = SurfaceLight,
            surface = SurfaceLight,
            card = CardLight,
            textPrimary = TextPrimaryLight,
            textSecondary = TextSecondaryLight,
            divider = DividerLight,
            accent = accent,
            accentText = accentText,
            bubbleOwn = accent,
            bubbleOwnText = accentText,
            bubbleOther = BubbleOtherLight,
            bubbleOtherText = TextPrimaryLight,
            inputBg = InputBgLight,
            error = ErrorRed,
        )
    }

    val scheme = if (darkTheme) darkColorScheme(
        primary = accent,
        background = BgDark,
        surface = SurfaceDark,
        onBackground = TextPrimaryDark,
        onSurface = TextPrimaryDark,
    ) else lightColorScheme(
        primary = accent,
        background = BgLight,
        surface = SurfaceLight,
        onBackground = TextPrimaryLight,
        onSurface = TextPrimaryLight,
    )

    MaterialTheme(
        colorScheme = scheme,
        typography = Typography,
        content = {
            CompositionLocalProvider(LocalAppColors provides colors, content = content)
        },
    )
}

object AppColors {
    @Composable
    fun current(): AppThemeColors = LocalAppColors.current
}

val LocalAppColors = androidx.compose.runtime.staticCompositionLocalOf<AppThemeColors> {
    error("No AppThemeColors provided")
}