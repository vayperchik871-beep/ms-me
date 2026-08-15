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
import androidx.compose.ui.text.font.FontFamily
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
    val bottomBarBg: Color,
    val bottomBarIcon: Color,
    val bottomBarLabel: Color,
)

object ThemeManager {
    var accentHex by mutableStateOf(ThemeManagerStore.accentHex)
    var themeMode by mutableStateOf(ThemeManagerStore.themeMode)
    var language by mutableStateOf("ru")

    fun applyAccent(hex: String) {
        accentHex = hex
        ThemeManagerStore.accentHex = hex
    }
    fun applyThemeMode(mode: String) {
        themeMode = mode
        ThemeManagerStore.themeMode = mode
    }
    fun applyLanguage(lang: String) {
        language = lang
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
            bottomBarBg = Color.White.copy(alpha = 0.25f),
            bottomBarIcon = Color.Black.copy(alpha = 0.8f),
            bottomBarLabel = Color.Black.copy(alpha = 0.65f),
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
            bottomBarBg = Color.Black.copy(alpha = 0.15f),
            bottomBarIcon = Color.Black.copy(alpha = 0.7f),
            bottomBarLabel = Color.Black.copy(alpha = 0.55f),
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

    val lang = ThemeManager.language
    val fontFamily = if (lang == "en") SfProTextFamily else InterFamily

    val localizedTypography = androidx.compose.material3.Typography(
        bodyLarge = Typography.bodyLarge.copy(fontFamily = fontFamily),
        bodyMedium = Typography.bodyMedium.copy(fontFamily = fontFamily),
        bodySmall = Typography.bodySmall.copy(fontFamily = fontFamily),
        titleLarge = Typography.titleLarge.copy(fontFamily = fontFamily),
        titleMedium = Typography.titleMedium.copy(fontFamily = fontFamily),
        titleSmall = Typography.titleSmall.copy(fontFamily = fontFamily),
        labelLarge = Typography.labelLarge.copy(fontFamily = fontFamily),
        labelMedium = Typography.labelMedium.copy(fontFamily = fontFamily),
        labelSmall = Typography.labelSmall.copy(fontFamily = fontFamily),
        headlineLarge = Typography.headlineLarge.copy(fontFamily = fontFamily),
        headlineMedium = Typography.headlineMedium.copy(fontFamily = fontFamily),
        headlineSmall = Typography.headlineSmall.copy(fontFamily = fontFamily),
        displayLarge = Typography.displayLarge.copy(fontFamily = fontFamily),
        displayMedium = Typography.displayMedium.copy(fontFamily = fontFamily),
        displaySmall = Typography.displaySmall.copy(fontFamily = fontFamily),
    )

    MaterialTheme(
        colorScheme = scheme,
        typography = localizedTypography,
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