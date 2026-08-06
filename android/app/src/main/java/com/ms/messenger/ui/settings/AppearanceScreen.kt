package com.ms.messenger.ui.settings

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.lerp
import androidx.compose.ui.unit.sp
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
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(colors.inputBg)
                        .clickable { onBack() },
                    contentAlignment = Alignment.Center
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
    var showContacts by remember { mutableStateOf(PrefsHolder.session.navContacts) }
    var showSettings by remember { mutableStateOf(PrefsHolder.session.navSettings) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(colors.card)
            .padding(horizontal = 16.dp)
    ) {
        IOSToggleRow("Чаты", showChats) {
            showChats = it
            PrefsHolder.session.navChats = it
        }
        NavDivider(colors)
        IOSToggleRow("Контакты", showContacts) {
            showContacts = it
            PrefsHolder.session.navContacts = it
        }
        NavDivider(colors)
        IOSToggleRow("Настройки", showSettings) {
            showSettings = it
            PrefsHolder.session.navSettings = it
        }
    }
}

@Composable
private fun IOSToggleRow(label: String, checked: Boolean, onToggle: (Boolean) -> Unit) {
    val colors = AppColors.current()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 16.sp, color = colors.textPrimary, modifier = Modifier.weight(1f))
        IOSSwitch(checked = checked, onCheckedChange = { onToggle(!checked) })
    }
}

@Composable
private fun IOSSwitch(checked: Boolean, onCheckedChange: () -> Unit) {
    val colors = AppColors.current()
    var isPressed by remember { mutableStateOf(false) }
    var wasDragged by remember { mutableStateOf(false) }
    var dragOffset by remember { mutableFloatStateOf(0f) }

    val density = LocalDensity.current
    val trackWidthPx = with(density) { 68.dp.toPx() }
    val thumbWidthPx = with(density) { 40.dp.toPx() }
    val maxDrag = trackWidthPx - thumbWidthPx - with(density) { 8.dp.toPx() }

    val minOffset = 2.dp
    val maxOffset = 26.dp

    val rawProgress = if (checked) 1f else 0f
    val animProgress = if (wasDragged) (dragOffset / maxDrag).coerceIn(0f, 1f) else rawProgress

    val progress by animateFloatAsState(
        targetValue = animProgress,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        )
    )

    val greenOn = if (colors.isDark) Color(0xFF8E8E93) else Color(0xFF34C759)
    val grayOff = if (colors.isDark) Color(0xFF39393D) else Color(0xFFE9E9EA)

    val trackColor by animateColorAsState(
        targetValue = if (progress > 0.5f) greenOn else grayOff,
        animationSpec = tween(250)
    )

    val lensScale by animateFloatAsState(
        targetValue = if (isPressed) 1.1f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        )
    )

    Box(
        modifier = Modifier
            .width(68.dp)
            .height(36.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(trackColor)
            .pointerInput(checked) {
                detectHorizontalDragGestures(
                    onDragStart = {
                        isPressed = true
                        wasDragged = false
                        dragOffset = if (checked) maxDrag else 0f
                    },
                    onDragEnd = {
                        isPressed = false
                        val finalProgress = (dragOffset / maxDrag).coerceIn(0f, 1f)
                        if (wasDragged && finalProgress > 0.3f && !checked) onCheckedChange()
                        else if (wasDragged && finalProgress < 0.7f && checked) onCheckedChange()
                        else if (!wasDragged) onCheckedChange()
                        wasDragged = false
                    },
                    onDragCancel = {
                        isPressed = false
                        wasDragged = false
                    },
                    onHorizontalDrag = { change, dragAmount ->
                        wasDragged = true
                        dragOffset = (dragOffset + dragAmount).coerceIn(0f, maxDrag)
                    }
                )
            },
        contentAlignment = Alignment.CenterStart
    ) {
        Box(
            modifier = Modifier
                .offset(x = lerp(minOffset, maxOffset, progress))
                .size(40.dp, 32.dp)
                .graphicsLayer {
                    scaleX = lensScale
                    scaleY = lensScale
                }
                .shadow(3.dp, RoundedCornerShape(16.dp), ambientColor = Color.Black.copy(0.1f))
                .clip(RoundedCornerShape(16.dp))
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.95f),
                            Color.White.copy(alpha = 0.8f)
                        )
                    )
                )
                .border(1.5.dp, Color.White.copy(alpha = 0.6f), RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center
        ) {
            if (isPressed) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    Color.White.copy(alpha = 0.4f),
                                    Color.White.copy(alpha = 0f)
                                )
                            )
                        )
                )
            }
            Box(
                modifier = Modifier
                    .padding(3.dp)
                    .fillMaxSize()
                    .clip(RoundedCornerShape(13.dp))
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                greenOn.copy(alpha = 0.15f * progress),
                                greenOn.copy(alpha = 0.05f * progress)
                            )
                        )
                    )
            )
        }
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
    var currentMode by remember { mutableStateOf(ThemeManager.themeMode) }

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
