package com.ms.messenger.ui.settings

import android.app.Activity
import android.os.Build
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.lerp
import androidx.compose.ui.unit.sp
import com.ms.messenger.backdrop.components.LiquidCircleButton
import com.ms.messenger.backdrop.components.LiquidToggle
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.theme.AppColors
import com.ms.messenger.theme.ThemeManager

@Composable
fun AppearanceScreen(onBack: () -> Unit) {
    val colors = AppColors.current()
    var selectedTab by remember { mutableIntStateOf(0) }

    Box(
        Modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        Column(Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                LiquidCircleButton(
                    onClick = onBack,
                    size = 44.dp,
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                        contentDescription = "Назад",
                        tint = colors.textPrimary,
                        modifier = Modifier.size(24.dp)
                    )
                }
                Spacer(Modifier.weight(1f))
                Text(
                    "Оформление",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary
                )
                Spacer(Modifier.weight(1f))
                Box(Modifier.size(44.dp))
            }

            Spacer(Modifier.height(16.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .clip(RoundedCornerShape(25.dp))
                    .background(colors.card)
                    .padding(4.dp)
            ) {
                val labels = listOf("Навигация", "Тема")
                labels.forEachIndexed { index, label ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(40.dp)
                            .clip(RoundedCornerShape(22.dp))
                            .background(
                                animateColorAsState(
                                    if (selectedTab == index) colors.divider else Color.Transparent,
                                    tween(250)
                                ).value
                            )
                            .clickable { selectedTab = index },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            label,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium,
                            color = animateColorAsState(
                                if (selectedTab == index) colors.textPrimary else colors.textSecondary,
                                tween(250)
                            ).value
                        )
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            AnimatedContent(
                targetState = selectedTab,
                transitionSpec = {
                    if (targetState > initialState) {
                        (fadeIn(tween(350, easing = EaseOutCubic)) +
                            scaleIn(tween(400, easing = EaseOutCubic), initialScale = 0.92f)) togetherWith
                        (fadeOut(tween(250, easing = EaseOutCubic)) +
                            scaleOut(tween(300, easing = EaseOutCubic), targetScale = 1.08f))
                    } else {
                        (fadeIn(tween(350, easing = EaseOutCubic)) +
                            scaleIn(tween(400, easing = EaseOutCubic), initialScale = 1.08f)) togetherWith
                        (fadeOut(tween(250, easing = EaseOutCubic)) +
                            scaleOut(tween(300, easing = EaseOutCubic), targetScale = 0.92f))
                    }
                },
                label = "tab_content"
            ) { tab ->
                when (tab) {
                    0 -> NavigationTab()
                    1 -> ThemeTab()
                }
            }
        }
    }
}

@Composable
private fun NavigationTab() {
    val colors = AppColors.current()
    var showChats by remember { mutableStateOf(PrefsHolder.session.navChats) }
    var showProfile by remember { mutableStateOf(PrefsHolder.session.navContacts) }
    var showSettings by remember { mutableStateOf(PrefsHolder.session.navSettings) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(colors.card)
            .padding(horizontal = 16.dp)
    ) {
        LiquidToggleRow("Чаты", showChats) {
            showChats = it
            PrefsHolder.session.navChats = it
        }
        NavDivider(colors)
        LiquidToggleRow("Профиль", showProfile) {
            showProfile = it
            PrefsHolder.session.navContacts = it
        }
        NavDivider(colors)
        LiquidToggleRow("Настройки", showSettings) {
            showSettings = it
            PrefsHolder.session.navSettings = it
        }
    }
}

@Composable
private fun LiquidToggleRow(label: String, checked: Boolean, onToggle: (Boolean) -> Unit) {
    val colors = AppColors.current()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 16.sp, color = colors.textPrimary, modifier = Modifier.weight(1f))
        LiquidToggle(
            selected = { checked },
            onSelect = onToggle,
        )
    }
}

@Composable
private fun NavDivider(colors: com.ms.messenger.theme.AppThemeColors) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(0.5.dp)
            .background(colors.divider)
    )
}

@Composable
private fun ThemeTab() {
    val colors = AppColors.current()
    val context = LocalContext.current
    var currentMode by remember { mutableStateOf(ThemeManager.themeMode) }
    var is60fps by remember { mutableStateOf(PrefsHolder.session.is60fps) }
    var isLiteMode by remember { mutableStateOf(PrefsHolder.session.isLiteMode) }

    fun applyFps(enabled: Boolean) {
        is60fps = enabled
        PrefsHolder.session.is60fps = enabled
        val activity = context as? Activity ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val display = activity.display ?: return
            val modes = display.supportedModes
            if (enabled) {
                val mode60 = modes.firstOrNull { it.refreshRate == 60f }
                if (mode60 != null) {
                    activity.window.attributes.preferredDisplayModeId = mode60.modeId
                    activity.window.attributes = activity.window.attributes
                }
            } else {
                val maxMode = modes.maxByOrNull { it.refreshRate }
                if (maxMode != null) {
                    activity.window.attributes.preferredDisplayModeId = maxMode.modeId
                    activity.window.attributes = activity.window.attributes
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
    ) {
        Text(
            "Режим",
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = colors.accent,
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
        )
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(colors.card)
                .padding(horizontal = 16.dp)
        ) {
            ThemeOption("Системная", "⚙", currentMode == "system") {
                currentMode = "system"
                ThemeManager.applyThemeMode("system")
                PrefsHolder.session.themeMode = "system"
            }
            ThemeDivider(colors)
            ThemeOption("Тёмная", "🌙", currentMode == "dark") {
                currentMode = "dark"
                ThemeManager.applyThemeMode("dark")
                PrefsHolder.session.themeMode = "dark"
            }
            ThemeDivider(colors)
            ThemeOption("Светлая", "☀", currentMode == "light") {
                currentMode = "light"
                ThemeManager.applyThemeMode("light")
                PrefsHolder.session.themeMode = "light"
            }
        }

        Spacer(Modifier.height(16.dp))

        Text(
            "Производительность",
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = colors.accent,
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
        )
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(colors.card)
                .padding(horizontal = 16.dp)
        ) {
            LiquidToggleRow("60 FPS", is60fps) { applyFps(it) }
            LiquidToggleRow("Лёгкий режим", isLiteMode) {
                isLiteMode = it
                PrefsHolder.session.isLiteMode = it
            }
        }
    }
}

@Composable
private fun ThemeOption(label: String, icon: String, selected: Boolean, onClick: () -> Unit) {
    val colors = AppColors.current()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clickable { onClick() },
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(icon, fontSize = 20.sp)
        Spacer(Modifier.width(12.dp))
        Text(label, fontSize = 16.sp, color = colors.textPrimary, modifier = Modifier.weight(1f))
        if (selected) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .background(colors.accent),
                contentAlignment = Alignment.Center
            ) {
                Text("✓", fontSize = 14.sp, color = colors.accentText, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun ThemeDivider(colors: com.ms.messenger.theme.AppThemeColors) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(0.5.dp)
            .background(colors.divider)
    )
}

private val EaseOutCubic = CubicBezierEasing(0.33f, 1f, 0.68f, 1f)
