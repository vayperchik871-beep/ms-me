package com.ms.messenger.ui.main

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ms.messenger.R
import com.kyant.backdrop.backdrops.layerBackdrop
import com.kyant.backdrop.backdrops.rememberLayerBackdrop
import com.kyant.backdrop.drawBackdrop
import com.kyant.backdrop.effects.blur
import com.kyant.backdrop.effects.lens
import com.kyant.backdrop.effects.vibrancy
import com.ms.messenger.backdrop.LocalBackdrop
import com.ms.messenger.backdrop.LocalLiteMode
import com.ms.messenger.backdrop.components.LiquidBottomTab
import com.ms.messenger.backdrop.components.LiquidBottomTabs
import com.ms.messenger.theme.AppColors
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.ui.chats.ChatSearchScreen
import com.ms.messenger.ui.chats.ChatsListScreen
import com.ms.messenger.ui.settings.SettingsScreen
import kotlinx.coroutines.launch

enum class MainTab(val title: String, val iconRes: Int) {
    Chats("Чаты", R.drawable.ic_nav_chats),
    Profile("Профиль", R.drawable.ic_nav_profile),
    Settings("Настройки", R.drawable.ic_nav_settings),
}

@Composable
fun MainTabsScreen(
    onOpenChat: (String) -> Unit,
    onOpenProfile: (String?) -> Unit,
    onLogout: () -> Unit,
) {
    val colors = AppColors.current()
    val navChats = PrefsHolder.session.navChats
    val navProfile = PrefsHolder.session.navContacts
    val navSettings = PrefsHolder.session.navSettings
    val navVersion = PrefsHolder.session.navVersion.intValue

    val visibleTabs = remember(navChats, navProfile, navSettings, navVersion) {
        buildList {
            if (navChats) add(MainTab.Chats)
            if (navProfile) add(MainTab.Profile)
            if (navSettings) add(MainTab.Settings)
        }.ifEmpty { listOf(MainTab.Chats) }
    }

    var selected by remember { mutableStateOf(MainTab.Chats) }
    LaunchedEffect(visibleTabs) {
        if (selected !in visibleTabs) {
            selected = visibleTabs.first()
        }
    }

    val selectedIndex = remember(selected, visibleTabs) {
        visibleTabs.indexOf(selected).coerceAtLeast(0)
    }

    var searchActive by remember { mutableStateOf(false) }
    var createType by remember { mutableStateOf<String?>(null) }
    var verificationActive by remember { mutableStateOf(false) }
    val backdrop = rememberLayerBackdrop()
    val searchScale = remember { Animatable(1f) }
    val scope = rememberCoroutineScope()

    val isLiteMode = PrefsHolder.session.isLiteMode

    Box(Modifier.fillMaxSize().background(colors.bg)) {
        Box(
            Modifier
                .fillMaxSize()
                .layerBackdrop(backdrop)
        ) {
            Box(
                Modifier
                    .fillMaxSize()
                    .drawBehind {
                        val top = if (colors.isDark) Color(0xFF3A3A3E) else Color(0xFFE5E5EA)
                        val bottom = colors.bg
                        drawRect(
                            brush = Brush.linearGradient(
                                0f to top.copy(alpha = 0.4f),
                                0.5f to bottom.copy(alpha = 0f),
                                1f to top.copy(alpha = 0.2f)
                            )
                        )
                    }
            )
        }
        CompositionLocalProvider(LocalBackdrop provides backdrop, LocalLiteMode provides isLiteMode) {
            AnimatedVisibility(
                visible = !searchActive,
                enter = fadeIn(),
                exit = fadeOut(),
                modifier = Modifier.fillMaxSize()
            ) {
                AnimatedContent(
                    targetState = selected,
                    transitionSpec = {
                        val index = MainTab.entries.indexOf(targetState)
                        val prevIndex = MainTab.entries.indexOf(initialState)
                        if (index > prevIndex) {
                            slideInHorizontally(tween(300)) { it / 3 } + fadeIn(tween(200)) togetherWith
                                slideOutHorizontally(tween(300)) { -it / 3 } + fadeOut(tween(150))
                        } else {
                            slideInHorizontally(tween(300)) { -it / 3 } + fadeIn(tween(200)) togetherWith
                                slideOutHorizontally(tween(300)) { it / 3 } + fadeOut(tween(150))
                        }
                    },
                    label = "tab_content"
                ) { tab ->
                    when (tab) {
                    MainTab.Chats -> ChatsListScreen(onOpenChat = onOpenChat, onCreateTypeChanged = { createType = it })
                    MainTab.Profile -> com.ms.messenger.ui.profile.ProfileScreen(
                        onBack = {},
                        onSettings = { selected = MainTab.Settings }
                    )
                    MainTab.Settings -> SettingsScreen(
                        onLogout = onLogout,
                        onOpenProfile = onOpenProfile,
                        onVerificationActive = { verificationActive = it }
                    )
                }
                }
            }

            AnimatedVisibility(
                visible = searchActive,
                enter = fadeIn(),
                exit = fadeOut(),
                modifier = Modifier.fillMaxSize()
            ) {
                ChatSearchScreen(
                    onBack = { searchActive = false },
                    onOpenChat = { chatId ->
                        searchActive = false
                        selected = MainTab.Chats
                        onOpenChat(chatId)
                    }
                )
            }
        }

        if (createType == null && !searchActive && !verificationActive) {
            Box(
                Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(bottom = 20.dp)
                    .fillMaxWidth()
            ) {
            val tabsWidth by animateDpAsState(
                targetValue = (80 * visibleTabs.size).dp,
                animationSpec = spring(0.6f, 350f),
                label = "tabs_width"
            )

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(end = 78.dp),
                contentAlignment = Alignment.Center
            ) {
                key(visibleTabs.map { it.name }) {
                    LiquidBottomTabs(
                        selectedTabIndex = { selectedIndex },
                        onTabSelected = { idx ->
                            if (idx in visibleTabs.indices) {
                                searchActive = false
                                selected = visibleTabs[idx]
                            }
                        },
                        backdrop = backdrop,
                        tabsCount = visibleTabs.size,
                        accentColor = Color.Transparent,
                        containerColor = Color.Transparent,
                        modifier = Modifier
                            .width(tabsWidth)
                            .height(64.dp)
                    ) {
                        visibleTabs.forEach { tab ->
                            LiquidBottomTab(onClick = {
                                searchActive = false
                                selected = tab
                            }) {
                                val isSelected = selected == tab
                                Icon(
                                    painterResource(tab.iconRes),
                                    tab.title,
                                    Modifier.size(24.dp),
                                    tint = if (colors.isDark) Color.White else Color.Black
                                )
                                Text(
                                    tab.title,
                                    fontSize = 10.sp,
                                    color = if (colors.isDark) Color.White else Color.Black
                                )
                            }
                        }
                    }
                }
            }

            Box(
                Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 14.dp)
                    .size(64.dp)
                    .graphicsLayer {
                        scaleX = searchScale.value
                        scaleY = searchScale.value
                    }
                    .pointerInput(Unit) {
                        awaitEachGesture {
                            awaitFirstDown(requireUnconsumed = false)
                            scope.launch {
                                searchScale.animateTo(0.85f, spring(0.5f, 300f))
                            }
                            val up = waitForUpOrCancellation()
                            scope.launch {
                                searchScale.animateTo(1f, spring(0.5f, 300f))
                            }
                            if (up != null) {
                                searchActive = true
                            }
                        }
                    }
                    .then(
                        if (isLiteMode) Modifier
                            .clip(com.kyant.shapes.Capsule())
                            .background(colors.card)
                        else Modifier.drawBackdrop(
                            backdrop = backdrop,
                            shape = { com.kyant.shapes.Capsule() },
                            effects = {
                                vibrancy()
                                blur(12f.dp.toPx())
                                lens(32f.dp.toPx(), 32f.dp.toPx())
                            },
                            onDrawSurface = {
                                drawRect(Color.Transparent)
                            }
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painterResource(R.drawable.ic_nav_search),
                    contentDescription = "Поиск",
                    Modifier.size(24.dp),
                    tint = if (colors.isDark) Color.White else Color.Black
                )
            }
        }
        }
    }
}
