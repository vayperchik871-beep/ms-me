package com.ms.messenger.ui.chats

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.kyant.backdrop.backdrops.rememberLayerBackdrop
import com.ms.messenger.R
import com.ms.messenger.backdrop.components.LiquidBackButton
import com.ms.messenger.data.ApiClient
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.data.WebSocketService
import com.ms.messenger.data.WsEvent
import com.ms.messenger.models.Chat
import com.ms.messenger.models.User
import com.ms.messenger.theme.AppColors
import com.ms.messenger.ui.Avatar
import com.ms.messenger.ui.Avatar48
import kotlinx.coroutines.launch

@Composable
fun ChatsListScreen(
    onOpenChat: (String) -> Unit,
    onCreateTypeChanged: (String?) -> Unit = {},
) {
    val colors = AppColors.current()
    val scope = rememberCoroutineScope()
    var chats by remember { mutableStateOf<List<Chat>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    var showNewChat by remember { mutableStateOf(false) }
    var createType by remember { mutableStateOf<String?>(null) }

    fun refresh() {
        scope.launch {
            loading = chats.isEmpty()
            error = null
            try {
                val resp = ApiClient.getChats()
                chats = resp.chats
            } catch (e: Exception) {
                error = e.message
            }
            loading = false
        }
    }
    DisposableEffect(Unit) {
        refresh()
        val listener: (WsEvent) -> Unit = { event ->
            when (event) {
                is WsEvent.NewMessage -> {
                    scope.launch {
                        try {
                            val resp = ApiClient.getChats()
                            chats = resp.chats
                        } catch (e: Exception) { }
                    }
                }
                else -> { }
            }
        }
        WebSocketService.addListener(listener)
        val token = PrefsHolder.session.token
        if (token != null && !WebSocketService.isConnected) {
            WebSocketService.connect(token)
        }
        onDispose { WebSocketService.removeListener(listener) }
    }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) refresh()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val filteredChats = if (searchQuery.isBlank()) chats
    else chats.filter {
        it.name.contains(searchQuery, ignoreCase = true) ||
        it.lastMessage.contains(searchQuery, ignoreCase = true)
    }

    Box(Modifier.fillMaxSize().background(colors.bg)) {
        Column(Modifier.fillMaxSize()) {
            Spacer(Modifier.statusBarsPadding())
            Spacer(Modifier.height(4.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Чаты", fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                Box(
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(if (colors.isDark) Color(0xFF2A2A2A) else Color(0xFFE0E0E0))
                        .clickable { showNewChat = true },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Filled.Edit,
                        contentDescription = "Составить",
                        tint = if (colors.isDark) Color.White.copy(alpha = 0.8f) else Color.Black.copy(alpha = 0.6f),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .height(50.dp)
                    .clip(RoundedCornerShape(25.dp))
                    .background(if (colors.isDark) Color(0xFF2A2A2A) else Color(0xFFE0E0E0)),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        Icons.Filled.Search,
                        contentDescription = null,
                        tint = if (colors.isDark) Color.White.copy(alpha = 0.45f)
                        else Color.Black.copy(alpha = 0.4f),
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "Поиск",
                        color = if (colors.isDark) Color.White.copy(alpha = 0.45f)
                        else Color.Black.copy(alpha = 0.4f),
                        fontSize = 16.sp
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            when {
                loading -> Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                    androidx.compose.material3.CircularProgressIndicator(color = colors.accent)
                }
                filteredChats.isEmpty() && !loading -> Box(
                    Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Filled.Message,
                            contentDescription = null,
                            tint = colors.textSecondary.copy(alpha = 0.5f),
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(Modifier.height(12.dp))
                        Text("Нет чатов", fontSize = 17.sp, fontWeight = FontWeight.Medium, color = colors.textSecondary)
                    }
                }
                else -> LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    itemsIndexed(filteredChats, key = { _, chat -> chat.id }) { index, chat ->
                        ChatRow(chat, colors, onClick = { onOpenChat(chat.id) })
                        if (index < filteredChats.lastIndex) {
                            HorizontalDivider(
                                modifier = Modifier.padding(horizontal = 16.dp),
                                color = colors.textSecondary.copy(alpha = 0.1f),
                                thickness = 0.5.dp
                            )
                        }
                    }
                }
            }

            error?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = colors.error, fontSize = 13.sp, modifier = Modifier.padding(horizontal = 20.dp))
            }
        }

        AnimatedVisibility(
            visible = showNewChat,
            enter = slideInHorizontally(tween(300)) { it } + fadeIn(tween(250)),
            exit = slideOutHorizontally(tween(300)) { it } + fadeOut(tween(200)),
            modifier = Modifier.fillMaxSize()
        ) {
            NewChatScreen(
                onBack = { showNewChat = false },
                onInvite = { showNewChat = false },
                onNewGroup = { showNewChat = false; createType = "group"; onCreateTypeChanged("group") },
                onNewChannel = { showNewChat = false; createType = "channel"; onCreateTypeChanged("channel") },
                onSelectContact = { user ->
                    showNewChat = false
                    onOpenChat(user.id)
                }
            )
        }

        createType?.let { type ->
            val createBackdrop = rememberLayerBackdrop()
            CreateChatScreen(
                type = type,
                onBack = { createType = null; onCreateTypeChanged(null) },
                onCreated = { chatId ->
                    createType = null
                    onCreateTypeChanged(null)
                    refresh()
                    onOpenChat(chatId)
                },
                backdrop = createBackdrop
            )
        }
    }
}

@Composable
fun NewChatScreen(
    onBack: () -> Unit,
    onInvite: () -> Unit,
    onNewGroup: () -> Unit,
    onNewChannel: () -> Unit,
    onSelectContact: (User) -> Unit,
) {
    val colors = AppColors.current()
    val scope = rememberCoroutineScope()
    val backdrop = rememberLayerBackdrop()
    var contacts by remember { mutableStateOf<List<User>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        scope.launch {
            try { contacts = ApiClient.getContacts().users } catch (_: Exception) { }
            loading = false
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Spacer(Modifier.width(8.dp))
            LiquidBackButton(
                onClick = onBack,
                backdrop = backdrop,
                tint = colors.textPrimary,
                isDark = colors.isDark
            )
            Spacer(Modifier.weight(1f))
            Text(
                "Новый чат",
                fontSize = 17.sp,
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary
            )
            Spacer(Modifier.weight(1f))
            Box(Modifier.size(44.dp))
        }

        Spacer(Modifier.height(8.dp))

        Column(
            modifier = Modifier
                .padding(horizontal = 16.dp)
                .clip(RoundedCornerShape(if (colors.isDark) 24.dp else 16.dp))
                .background(colors.card)
        ) {
            NewChatMenuItem(
                iconRes = R.drawable.ic_new_channel,
                title = "Создать канал",
                iconBg = Color(0xFFFFF3E0),
                iconTint = Color(0xFFFF9800),
                colors = colors,
                onClick = onNewChannel
            )
            HorizontalDivider(color = colors.divider, modifier = Modifier.padding(horizontal = 16.dp))
            NewChatMenuItem(
                iconRes = R.drawable.ic_new_group,
                title = "Создать группу",
                iconBg = Color(0xFFE3F2FD),
                iconTint = Color(0xFF2196F3),
                colors = colors,
                onClick = onNewGroup
            )
            HorizontalDivider(color = colors.divider, modifier = Modifier.padding(horizontal = 16.dp))
            NewChatMenuItem(
                iconRes = R.drawable.ic_new_person,
                title = "Пригласить друга",
                subtitle = "Код на одного человека",
                iconBg = Color(0xFFE8F5E9),
                iconTint = Color(0xFF4CAF50),
                colors = colors,
                onClick = onInvite
            )
        }

        Spacer(Modifier.height(24.dp))

        Text(
            "КОНТАКТЫ",
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = colors.textSecondary,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Spacer(Modifier.height(4.dp))

        when {
            loading -> Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                androidx.compose.material3.CircularProgressIndicator(color = colors.accent, modifier = Modifier.size(24.dp))
            }
            contacts.isEmpty() -> Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                Text("Нет контактов", fontSize = 15.sp, color = colors.textSecondary)
            }
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
            ) {
                itemsIndexed(contacts, key = { _, user -> user.id }) { _, user ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp, horizontal = 4.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { onSelectContact(user) }
                            .padding(vertical = 8.dp, horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Avatar48(user.name, user.avatar, user.profileColor)
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(user.name, fontSize = 16.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
                            Text("@${user.userId}", fontSize = 14.sp, color = colors.textSecondary)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NewChatMenuItem(
    iconRes: Int,
    title: String,
    subtitle: String? = null,
    iconBg: Color,
    iconTint: Color,
    colors: com.ms.messenger.theme.AppThemeColors,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .clip(CircleShape)
                .background(iconBg),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                painterResource(iconRes),
                contentDescription = null,
                tint = iconTint,
                modifier = Modifier.size(22.dp)
            )
        }
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(title, fontSize = 16.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
            if (subtitle != null) {
                Spacer(Modifier.height(2.dp))
                Text(subtitle, fontSize = 13.sp, color = colors.textSecondary)
            }
        }
    }
}

@Composable
fun ChatRow(
    chat: Chat,
    colors: com.ms.messenger.theme.AppThemeColors,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp, horizontal = 4.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable { onClick() }
            .padding(vertical = 10.dp, horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Avatar(
            size = 52,
            name = chat.name,
            avatarUrl = chat.peer?.avatar,
            profileColor = chat.peer?.profileColor,
        )
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(
                chat.name,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(Modifier.height(3.dp))
            Text(
                chat.lastMessage.ifBlank { "Нет сообщений" },
                fontSize = 14.sp,
                color = colors.textSecondary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        Spacer(Modifier.width(8.dp))
        Column(horizontalAlignment = Alignment.End) {
            Text(chat.lastTime, fontSize = 12.sp, color = colors.textSecondary)
            if (chat.unread > 0) {
                Spacer(Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .clip(CircleShape)
                        .background(colors.textSecondary.copy(alpha = 0.3f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        chat.unread.toString(),
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
