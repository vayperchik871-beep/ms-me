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
import com.ms.messenger.backdrop.components.LiquidBottomTab
import com.ms.messenger.backdrop.components.LiquidBottomTabs
import com.ms.messenger.theme.AppColors
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.ui.chats.ChatSearchScreen
import com.ms.messenger.ui.chats.ChatsListScreen
import com.ms.messenger.ui.contacts.ContactsScreen
import com.ms.messenger.ui.settings.SettingsScreen
import kotlinx.coroutines.launch

enum class MainTab(val title: String, val iconRes: Int) {
    Contacts("Контакты", R.drawable.ic_nav_contacts),
    Chats("Чаты", R.drawable.ic_nav_chats),
    Settings("Настройки", R.drawable.ic_nav_settings),
}

@Composable
fun MainTabsScreen(
    onOpenChat: (String) -> Unit,
    onLogout: () -> Unit,
) {
    val colors = AppColors.current()
    val navChats = PrefsHolder.session.navChats
    val navContacts = PrefsHolder.session.navContacts
    val navSettings = PrefsHolder.session.navSettings
    val navVersion = PrefsHolder.session.navVersion.intValue

    val visibleTabs = remember(navChats, navContacts, navSettings, navVersion) {
        buildList {
            if (navContacts) add(MainTab.Contacts)
            if (navChats) add(MainTab.Chats)
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
    val backdrop = rememberLayerBackdrop()
    val searchScale = remember { Animatable(1f) }
    val scope = rememberCoroutineScope()

    Box(Modifier.fillMaxSize().background(colors.bg)) {
        AnimatedVisibility(
            visible = !searchActive,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.fillMaxSize()
        ) {
            Box(
                Modifier
                    .fillMaxSize()
                    .layerBackdrop(backdrop)
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
                        MainTab.Contacts -> ContactsScreen()
                        MainTab.Settings -> SettingsScreen(onLogout = onLogout)
                    }
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

        if (createType == null && !searchActive) {
            Box(
                Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(bottom = 10.dp)
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
                            val tab = MainTab.entries[idx]
                            if (tab in visibleTabs) {
                                searchActive = false
                                selected = tab
                            }
                        },
                        backdrop = backdrop,
                        tabsCount = visibleTabs.size,
                        accentColor = if (colors.isDark) Color.White else Color(0xFFAEAEB2),
                        containerColor = if (colors.isDark) Color(0xFF121212).copy(alpha = 0.55f)
                        else Color(0xFFFAFAFA).copy(alpha = 0.55f),
                        modifier = Modifier
                            .width(tabsWidth)
                            .height(64.dp)
                    ) {
                        visibleTabs.forEach { tab ->
                            LiquidBottomTab(onClick = {
                                searchActive = false
                                selected = tab
                            }) {
                                Icon(
                                    painterResource(tab.iconRes),
                                    tab.title,
                                    Modifier.size(24.dp),
                                    tint = if (colors.isDark) Color.White.copy(alpha = 0.9f)
                                    else Color.Black.copy(alpha = 0.75f)
                                )
                                Text(
                                    tab.title,
                                    fontSize = 10.sp,
                                    color = if (colors.isDark) Color.White.copy(alpha = 0.8f)
                                    else Color.Black.copy(alpha = 0.7f)
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
                    .drawBackdrop(
                        backdrop = backdrop,
                        shape = { com.kyant.shapes.Capsule() },
                        effects = {
                            blur(2f.dp.toPx())
                            lens(12f.dp.toPx(), 24f.dp.toPx())
                        },
                        onDrawSurface = {
                            val c = if (colors.isDark) Color(0xFF121212) else Color(0xFFFAFAFA)
                            drawRect(c.copy(alpha = 0.55f))
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painterResource(R.drawable.ic_nav_search),
                    contentDescription = "Поиск",
                    Modifier.size(24.dp),
                    tint = if (colors.isDark) Color.White.copy(alpha = 0.9f)
                    else Color.Black.copy(alpha = 0.75f)
                )
            }
        }
        }
    }
}
