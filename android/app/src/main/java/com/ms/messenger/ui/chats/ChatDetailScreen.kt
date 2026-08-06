package com.ms.messenger.ui.chats

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.SentimentSatisfied
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kyant.backdrop.backdrops.rememberLayerBackdrop
import com.kyant.backdrop.drawBackdrop
import com.kyant.backdrop.effects.blur
import com.kyant.backdrop.effects.lens
import com.kyant.backdrop.effects.vibrancy
import com.ms.messenger.R
import com.ms.messenger.data.ApiClient
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.data.WebSocketService
import com.ms.messenger.data.WsEvent
import com.ms.messenger.models.Message
import com.ms.messenger.theme.AppColors
import com.ms.messenger.ui.Avatar
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ChatDetailScreen(
    chatId: String,
    onBack: () -> Unit,
) {
    val colors = AppColors.current()
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()
    var messages by remember { mutableStateOf<List<Message>>(emptyList()) }
    var input by remember { mutableStateOf("") }
    var replyTo by remember { mutableStateOf<Message?>(null) }
    var peerName by remember { mutableStateOf("Чат") }
    var peerOnline by remember { mutableStateOf(false) }
    var peerAvatar by remember { mutableStateOf<String?>(null) }
    var peerUnread by remember { mutableStateOf(0) }
    var loading by remember { mutableStateOf(true) }
    val myUserId = PrefsHolder.session.myUserId

    fun load() {
        scope.launch {
            loading = true
            try {
                val resp = ApiClient.getMessages(chatId)
                messages = resp.messages
                ApiClient.readChat(chatId)
                listState.scrollToItem(messages.size.coerceAtLeast(0) - 1)
            } catch (e: Exception) { }
            loading = false
        }
    }

    DisposableEffect(Unit) {
        scope.launch {
            try {
                val chats = ApiClient.getChats().chats
                val chat = chats.find { it.id == chatId }
                if (chat != null) {
                    peerName = chat.name
                    peerOnline = chat.peer?.online ?: false
                    peerAvatar = chat.peer?.avatar
                    peerUnread = chat.unread
                }
            } catch (e: Exception) { }
        }
        load()
        val listener: (WsEvent) -> Unit = { event ->
            when (event) {
                is WsEvent.NewMessage -> if (event.chatId == chatId) {
                    scope.launch {
                        if (!messages.any { it.id == event.message.id }) {
                            messages = messages + event.message
                            ApiClient.readChat(chatId)
                            listState.animateScrollToItem(messages.size - 1)
                        }
                    }
                }
                is WsEvent.Typing -> if (event.chatId == chatId) { }
                else -> { }
            }
        }
        WebSocketService.addListener(listener)
        onDispose { WebSocketService.removeListener(listener) }
    }

    val entrance = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        entrance.animateTo(1f, animationSpec = tween(durationMillis = 320, easing = FastOutSlowInEasing))
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(if (colors.isDark) Color(0xFF111111) else colors.chatBg)
            .graphicsLayer {
                val p = entrance.value
                alpha = p
                scaleX = 0.96f + 0.04f * p
                scaleY = 0.96f + 0.04f * p
            }
    ) {

    Column(Modifier.fillMaxSize().imePadding().navigationBarsPadding()) {
        // Header - glass capsule style
        val headerBackdrop = rememberLayerBackdrop()
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Back button
            Box(
                modifier = Modifier
                    .height(48.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .drawBackdrop(
                        backdrop = headerBackdrop,
                        shape = { RoundedCornerShape(24.dp) },
                        effects = {
                            blur(2f.dp.toPx())
                            lens(4f.dp.toPx(), 8f.dp.toPx())
                        },
                        onDrawSurface = {
                            val c = if (colors.isDark) Color(0xFF1E1E1E) else Color(0xFFE8E8E8)
                            drawRect(c.copy(alpha = 0.85f))
                        }
                    )
                    .clickable { onBack() }
                    .padding(horizontal = 14.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Назад",
                        tint = if (colors.isDark) Color.White.copy(alpha = 0.9f) else Color.Black.copy(alpha = 0.75f),
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        if (peerUnread > 0) peerUnread.toString() else "0",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium,
                        color = if (colors.isDark) Color.White.copy(alpha = 0.9f) else Color.Black.copy(alpha = 0.75f)
                    )
                }
            }

            Spacer(Modifier.weight(1f))

            // Center: name + status
            Box(
                modifier = Modifier
                    .height(48.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .drawBackdrop(
                        backdrop = headerBackdrop,
                        shape = { RoundedCornerShape(24.dp) },
                        effects = {
                            blur(2f.dp.toPx())
                            lens(4f.dp.toPx(), 8f.dp.toPx())
                        },
                        onDrawSurface = {
                            val c = if (colors.isDark) Color(0xFF1E1E1E) else Color(0xFFE8E8E8)
                            drawRect(c.copy(alpha = 0.85f))
                        }
                    )
                    .padding(horizontal = 20.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        peerName,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (colors.isDark) Color.White.copy(alpha = 0.9f) else Color.Black.copy(alpha = 0.75f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(
                                    if (peerOnline) com.ms.messenger.theme.OnlineGreen
                                    else if (colors.isDark) Color.White.copy(alpha = 0.35f)
                                    else Color.Black.copy(alpha = 0.25f)
                                )
                        )
                        Spacer(Modifier.width(5.dp))
                        Text(
                            if (peerOnline) "в сети" else "не в сети",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (peerOnline) com.ms.messenger.theme.OnlineGreen
                            else if (colors.isDark) Color.White.copy(alpha = 0.5f) else Color.Black.copy(alpha = 0.4f)
                        )
                    }
                }
            }

            Spacer(Modifier.weight(1f))

            // Avatar
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .drawBackdrop(
                        backdrop = headerBackdrop,
                        shape = { CircleShape },
                        effects = {
                            blur(2f.dp.toPx())
                            lens(4f.dp.toPx(), 8f.dp.toPx())
                        },
                        onDrawSurface = {
                            val c = if (colors.isDark) Color(0xFF1E1E1E) else Color(0xFFE8E8E8)
                            drawRect(c.copy(alpha = 0.85f))
                        }
                    )
                    .clip(CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Avatar(42, peerName, peerAvatar, fontSize = 16)
            }
        }

        // Messages
        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            state = listState,
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
        ) {
            items(messages, key = { it.id }) { msg ->
                MessageBubble(
                    msg = msg,
                    isOwn = msg.senderId == myUserId,
                    colors = colors,
                    onReply = { replyTo = msg },
                    onLongClick = { }
                )
            }
        }

        // Reply bar
        replyTo?.let { replyMsg ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.surface)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(Modifier.weight(1f)) {
                    Text(
                        "Ответ ${replyMsg.senderName ?: ""}",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.accent
                    )
                    Text(
                        replyMsg.text,
                        fontSize = 13.sp,
                        color = colors.textSecondary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Text(
                    "✕",
                    color = colors.textSecondary,
                    fontSize = 16.sp,
                    modifier = Modifier
                        .clip(CircleShape)
                        .clickable { replyTo = null }
                )
            }
        }

        // Input bar
        InputBar(
            value = input,
            onValueChange = { input = it },
            onSend = {
                val text = input.trim()
                if (text.isEmpty()) return@InputBar
                input = ""
                val replyId = replyTo?.id
                replyTo = null
                scope.launch {
                    try {
                        val msg = ApiClient.sendMessage(chatId, text, replyId)
                        messages = messages + msg
                        listState.animateScrollToItem(messages.size - 1)
                    } catch (e: Exception) { }
                }
            },
            colors = colors,
        )
    }
    }
}

@Composable
fun MessageBubble(
    msg: Message,
    isOwn: Boolean,
    colors: com.ms.messenger.theme.AppThemeColors,
    onReply: () -> Unit,
    onLongClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp)
            .clickable(onClick = onReply),
        horizontalAlignment = if (isOwn) Alignment.End else Alignment.Start
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 320.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(if (isOwn) colors.bubbleOwn else colors.bubbleOther)
                .padding(horizontal = 14.dp, vertical = 10.dp)
        ) {
            Column {
                msg.reply?.let { reply ->
                    Text(
                        "${reply.senderName ?: ""}: ${reply.text ?: ""}",
                        fontSize = 13.sp,
                        color = if (isOwn) colors.bubbleOwnText.copy(alpha = 0.7f) else colors.textSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(2.dp))
                }
                Text(
                    msg.text,
                    fontSize = 16.sp,
                    color = if (isOwn) colors.bubbleOwnText else colors.textPrimary
                )
            }
        }
        Text(
            msg.time,
            fontSize = 11.sp,
            color = colors.textSecondary,
            modifier = Modifier.padding(top = 2.dp, end = 4.dp)
        )
    }
}

@Composable
fun InputBar(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    colors: com.ms.messenger.theme.AppThemeColors,
) {
    val hasText = value.isNotBlank()

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.Transparent)
            .padding(horizontal = 10.dp, vertical = 10.dp)
            .animateContentSize(animationSpec = tween(250)),
        verticalAlignment = Alignment.Bottom
    ) {
        // Plus button
        Box(
            modifier = Modifier
                .size(50.dp)
                .clip(CircleShape)
                .background(Color(0xFF2E2E2E).copy(alpha = 0.85f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                Icons.Filled.Add,
                contentDescription = "Прикрепить",
                tint = Color.White.copy(alpha = 0.8f),
                modifier = Modifier.size(26.dp)
            )
        }
        Spacer(Modifier.width(8.dp))
        // Input field
        Box(
            modifier = Modifier
                .weight(1f)
                .height(if (hasText) 56.dp else 50.dp)
                .clip(RoundedCornerShape(25.dp))
                .background(Color(0xFF2E2E2E).copy(alpha = 0.85f))
                .padding(horizontal = 18.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            if (value.isEmpty()) {
                Text(
                    "Сообщение",
                    color = Color.White.copy(alpha = 0.35f),
                    fontSize = 16.sp
                )
            }
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                singleLine = false,
                maxLines = 4,
                textStyle = androidx.compose.ui.text.TextStyle(
                    color = Color.White,
                    fontSize = 16.sp,
                ),
                cursorBrush = SolidColor(colors.accent),
                modifier = Modifier.fillMaxWidth()
            )
        }
        Spacer(Modifier.width(6.dp))
        // Sticker + Mic (when empty), animated
        AnimatedVisibility(
            visible = !hasText,
            enter = fadeIn(animationSpec = tween(200)) + scaleIn(initialScale = 0.5f, animationSpec = tween(200)),
            exit = fadeOut(animationSpec = tween(150)) + scaleOut(targetScale = 0.5f, animationSpec = tween(150))
        ) {
            Row(verticalAlignment = Alignment.Bottom) {
                Box(
                    modifier = Modifier
                        .size(50.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF2E2E2E).copy(alpha = 0.85f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Filled.SentimentSatisfied,
                        contentDescription = "Стикер",
                        tint = Color.White.copy(alpha = 0.8f),
                        modifier = Modifier.size(26.dp)
                    )
                }
                Spacer(Modifier.width(6.dp))
                Box(
                    modifier = Modifier
                        .size(50.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF2E2E2E).copy(alpha = 0.85f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Filled.Mic,
                        contentDescription = "Голос",
                        tint = Color.White.copy(alpha = 0.8f),
                        modifier = Modifier.size(26.dp)
                    )
                }
            }
        }
        // Send button (when text), animated
        AnimatedVisibility(
            visible = hasText,
            enter = fadeIn(animationSpec = tween(200)) + scaleIn(initialScale = 0.5f, animationSpec = tween(200)),
            exit = fadeOut(animationSpec = tween(150)) + scaleOut(targetScale = 0.5f, animationSpec = tween(150))
        ) {
            Box(
                modifier = Modifier
                    .size(50.dp)
                    .clip(CircleShape)
                    .background(colors.accent)
                    .clickable { onSend() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.Send,
                    contentDescription = "Отправить",
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}