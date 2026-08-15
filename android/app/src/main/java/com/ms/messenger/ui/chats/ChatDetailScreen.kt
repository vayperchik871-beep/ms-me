package com.ms.messenger.ui.chats

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.layout.ContentScale
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Report
import androidx.compose.material.icons.filled.Reply
import androidx.compose.material.icons.automirrored.filled.Forward
import androidx.compose.material.icons.filled.SentimentSatisfied
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.BottomSheetDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.ms.messenger.backdrop.components.LiquidButton
import com.ms.messenger.backdrop.components.LiquidCircleButton
import com.ms.messenger.data.ApiClient
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.data.WebSocketService
import com.ms.messenger.data.WsEvent
import com.ms.messenger.models.ChannelPostComment
import com.ms.messenger.models.Message
import com.ms.messenger.theme.AppColors
import com.ms.messenger.ui.Avatar
import com.ms.messenger.ui.emoji.EmojiPicker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun ChatDetailScreen(
    chatId: String,
    onBack: () -> Unit,
    onOpenProfile: (String) -> Unit = {},
) {
    val colors = AppColors.current()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()
    var messages by remember { mutableStateOf<List<Message>>(emptyList()) }
    var input by remember { mutableStateOf("") }
    var replyTo by remember { mutableStateOf<Message?>(null) }
    var menuMsg by remember { mutableStateOf<Message?>(null) }
    var menuMsgY by remember { mutableFloatStateOf(0f) }
    var menuMsgH by remember { mutableFloatStateOf(0f) }
    var selectionMode by remember { mutableStateOf(false) }
    val selectedIds = remember { mutableStateListOf<String>() }
    var forwardMsg by remember { mutableStateOf<Message?>(null) }
    var forwardChats by remember { mutableStateOf<List<com.ms.messenger.models.Chat>>(emptyList()) }
    var showForwardPicker by remember { mutableStateOf(false) }

    val cachedPeer = remember(chatId) { com.ms.messenger.data.ChatCache.get(chatId) }

    var peerName by remember { mutableStateOf(cachedPeer?.name ?: "Чат") }
    var peerOnline by remember { mutableStateOf(cachedPeer?.online ?: false) }
    var peerAvatar by remember { mutableStateOf(cachedPeer?.avatar) }
    var peerUnread by remember { mutableIntStateOf(0) }
    var peerUserId by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var chatType by remember { mutableStateOf("direct") }
    var commentCounts by remember { mutableStateOf<Map<String, Int>>(emptyMap()) }
    var isCreator by remember { mutableStateOf(false) }

    var commentingPost by remember { mutableStateOf<Message?>(null) }
    var postComments by remember { mutableStateOf<List<ChannelPostComment>>(emptyList()) }
    var commentsLoading by remember { mutableStateOf(false) }

    var showGiftSheet by remember { mutableStateOf(false) }
    var giftToSend by remember { mutableStateOf<com.ms.messenger.ui.settings.GiftItem?>(null) }
    var showGiftBurst by remember { mutableStateOf(false) }
    var burstGiftResId by remember { mutableStateOf(0) }

    val myUserId = PrefsHolder.session.myUserId

    val trackedGiftIndex = remember(messages) { messages.indexOfLast { it.attachment?.type == "gift" } }
    val singleGift = remember(messages) {
        trackedGiftIndex >= 0 && messages.count { it.attachment?.type == "gift" } == 1
    }
    val rootTopY = remember { mutableFloatStateOf(0f) }
    val rootHeight = remember { mutableFloatStateOf(0f) }
    val giftCardY = remember { mutableFloatStateOf(-1f) }

    fun loadCommentCounts() {
        scope.launch {
            try {
                commentCounts = ApiClient.getChannelCommentCounts(chatId)
                messages = messages.map { msg ->
                    if (commentCounts.containsKey(msg.id)) {
                        msg.copy(commentCount = commentCounts[msg.id] ?: 0)
                    } else msg
                }
            } catch (_: Exception) {}
        }
    }

    fun load() {
        scope.launch {
            loading = true
            try {
                val resp = ApiClient.getMessages(chatId)
                messages = resp.messages
                ApiClient.readChat(chatId)
                listState.scrollToItem(messages.size.coerceAtLeast(0) - 1)
            } catch (_: Exception) { }
            loading = false
            if (chatType == "channel") loadCommentCounts()
        }
    }

    DisposableEffect(chatId) {
        messages = emptyList()
        loading = true
        peerName = "Чат"
        peerOnline = false
        peerAvatar = null
        scope.launch {
            try {
                val chats = ApiClient.getChats().chats
                val chat = chats.find { it.id == chatId }
                if (chat != null) {
                    peerName = chat.name
                    peerOnline = chat.peer?.online ?: false
                    peerAvatar = chat.peer?.avatar
                    peerUnread = chat.unread
                    chatType = chat.type
                    peerUserId = chat.peer?.userId
                    isCreator = chat.peer?.userId == myUserId || chat.type == "channel"
                }
            } catch (_: Exception) { }
        }
        load()
        val listener: (WsEvent) -> Unit = { event ->
            when (event) {
                is WsEvent.NewMessage -> if (event.chatId == chatId) {
                    scope.launch {
                        if (!messages.any { it.id == event.message.id }) {
                            messages = messages.filterNot { it.id.startsWith("local_") } + event.message
                            ApiClient.readChat(chatId)
                            listState.animateScrollToItem(messages.size - 1)
                            if (chatType == "channel") loadCommentCounts()
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

    LaunchedEffect(chatId) {
        while (true) {
            delay(5000)
            if (!WebSocketService.isConnected) {
                runCatching {
                    val resp = ApiClient.getMessages(chatId)
                    val known = messages.map { it.id }.toSet()
                    val fresh = resp.messages.filter { it.id !in known }
                    if (fresh.isNotEmpty()) {
                        messages = messages + fresh
                        ApiClient.readChat(chatId)
                        listState.animateScrollToItem(messages.size - 1)
                        if (chatType == "channel") loadCommentCounts()
                    }
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(if (colors.isDark) Color(0xFF111111) else colors.chatBg)
            .onGloballyPositioned {
                rootTopY.floatValue = it.positionInWindow().y
                rootHeight.floatValue = it.size.height.toFloat()
            }
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .drawBehind {
                    drawRect(
                        brush = Brush.linearGradient(
                            0f to if (colors.isDark) Color(0xFF111111) else colors.chatBg,
                            1f to if (colors.isDark) Color(0xFF1B1B1E) else colors.chatBg
                        )
                    )
                }
        )
        Column(Modifier.fillMaxSize().imePadding().navigationBarsPadding()) {
            if (selectionMode) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    LiquidButton(
                        onClick = { selectionMode = false; selectedIds.clear() },
                        backdrop = null,
                        surfaceColor = if (colors.isDark) Color(0xFF2A2A2E).copy(alpha = 0.85f) else Color.Unspecified,
                        modifier = Modifier.height(48.dp),
                    ) {
                        Icon(
                            Icons.Filled.Close,
                            contentDescription = "Отмена",
                            tint = if (colors.isDark) Color.White else Color.Black,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Text(
                        "Выбрано: ${selectedIds.size}",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (colors.isDark) Color.White else Color.Black,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.weight(1f))
                }
            } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .align(Alignment.CenterStart)
                        .size(48.dp)
                        .clip(CircleShape)
                        .clickable(onClick = onBack),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Назад",
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Box(
                    modifier = Modifier.align(Alignment.Center),
                    contentAlignment = Alignment.TopCenter
                ) {
                    Box(
                        modifier = Modifier
                            .offset(y = 52.dp)
                            .clip(RoundedCornerShape(50))
                            .background(
                                if (colors.isDark) Color.White.copy(alpha = 0.12f)
                                else Color.White.copy(alpha = 0.35f)
                            )
                            .shadow(4.dp, RoundedCornerShape(50), ambientColor = Color.Black.copy(alpha = 0.12f))
                            .clickable { peerUserId?.let { onOpenProfile(it) } }
                            .padding(horizontal = 12.dp, vertical = 5.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                peerName,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (colors.isDark) Color.White.copy(alpha = 0.9f) else Color.Black.copy(alpha = 0.85f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(Modifier.width(2.dp))
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = null,
                                tint = if (colors.isDark) Color.White.copy(alpha = 0.5f) else Color.Black.copy(alpha = 0.4f),
                                modifier = Modifier
                                    .size(8.dp)
                                    .graphicsLayer { rotationZ = 180f }
                            )
                        }
                    }
                    Avatar(64, peerName, peerAvatar, fontSize = 24)
                }

                Box(
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .size(48.dp)
                        .clip(CircleShape)
                        .clickable { },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Filled.Phone,
                        contentDescription = "Звонок",
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
            }

            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                state = listState,
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
            ) {
                itemsIndexed(messages, key = { _, it -> it.id }) { i, msg ->
                    if (chatType == "channel") {
                        ChannelPostCard(
                            msg = msg,
                            colors = colors,
                            onComments = { post ->
                                commentingPost = post
                                commentsLoading = true
                                scope.launch {
                                    try {
                                        postComments = ApiClient.getChannelPostComments(chatId, post.id)
                                    } catch (_: Exception) { postComments = emptyList() }
                                    commentsLoading = false
                                }
                            },
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .onGloballyPositioned {
                                    if (menuMsg?.id == msg.id) {
                                        menuMsgY = it.positionInWindow().y
                                        menuMsgH = it.size.height.toFloat()
                                    }
                                }
                                .then(
                                    if (selectionMode) Modifier.clickable {
                                        if (msg.id in selectedIds) selectedIds.remove(msg.id) else selectedIds.add(msg.id)
                                    } else Modifier
                                )
                        ) {
                            MessageBubble(
                                msg = msg,
                                isOwn = msg.senderId == myUserId,
                                colors = colors,
                                onReply = { replyTo = msg },
                                onLongClick = {
                                    if (selectionMode) {
                                        selectionMode = false
                                        selectedIds.clear()
                                    } else {
                                        menuMsg = msg
                                        menuMsgY = 0f
                                    }
                                },
                                tracked = i == trackedGiftIndex,
                                onTrackedY = { giftCardY.floatValue = it },
                                compact = singleGift
                            )
                            if (selectionMode) {
                                val sel = msg.id in selectedIds
                                Icon(
                                    if (sel) Icons.Filled.CheckCircle
                                    else Icons.Filled.RadioButtonUnchecked,
                                    contentDescription = null,
                                    tint = if (sel) Color(0xFF0A84FF) else Color.White.copy(alpha = 0.6f),
                                    modifier = Modifier
                                        .align(if (msg.senderId == myUserId) Alignment.CenterEnd else Alignment.CenterStart)
                                        .padding(horizontal = 4.dp)
                                        .size(22.dp)
                                )
                            }
                        }
                    }
                }
            }

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

            if (chatType != "channel" || isCreator) {
                InputBar(
                    value = input,
                    onValueChange = { input = it },
                    onSend = {
                        val text = input.trim()
                        if (text.isEmpty()) return@InputBar
                        input = ""
                        val replyId = replyTo?.id
                        replyTo = null
                        val tmpId = "local_${System.currentTimeMillis()}"
                        messages = messages + Message(
                            id = tmpId,
                            chatId = chatId,
                            senderId = myUserId ?: "",
                            text = text,
                            time = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(java.util.Date()),
                            createdAt = System.currentTimeMillis()
                        )
                        scope.launch {
                            listState.animateScrollToItem(messages.size - 1)
                            try {
                                val msg = ApiClient.sendMessage(chatId, text, replyId)
                                messages = messages.map { if (it.id == tmpId) msg else it }
                            } catch (_: Exception) {
                                messages = messages.filterNot { it.id == tmpId }
                            }
                        }
                    },
                    onVoiceSend = { bytes, mimeType ->
                        scope.launch {
                            try {
                                val att = ApiClient.uploadAttachment(bytes, mimeType)
                                val msg = ApiClient.sendMessage(chatId, "", attachment = att)
                                messages = messages + msg
                                listState.animateScrollToItem(messages.size - 1)
                            } catch (_: Exception) { }
                        }
                    },
                    onMediaSend = { bytes, mimeType ->
                        scope.launch {
                            try {
                                val att = ApiClient.uploadAttachment(bytes, mimeType)
                                val text = if (mimeType.startsWith("image")) "📷" else if (mimeType.startsWith("video")) "🎬" else "📎"
                                val msg = ApiClient.sendMessage(chatId, text, attachment = att)
                                messages = messages + msg
                                listState.animateScrollToItem(messages.size - 1)
                            } catch (_: Exception) { }
                        }
                    },
                    onGift = if (chatType == "direct" && peerUserId != null) {
                        { showGiftSheet = true }
                    } else null,
                    colors = colors,
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(colors.surface)
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    contentAlignment = Alignment.Center
                ) {
Text(
                        "Комментировать",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium,
                        color = colors.accent
                    )
                }
            }
        }

        if (commentingPost != null) {
            ModalBottomSheet(
                onDismissRequest = { commentingPost = null },
                sheetState = rememberModalBottomSheetState(),
                containerColor = if (colors.isDark) Color(0xFF1E1E1E) else Color.White,
                contentColor = colors.textPrimary,
                dragHandle = { BottomSheetDefaults.DragHandle() }
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(bottom = 16.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Комментарии",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textPrimary
                        )
                        Spacer(Modifier.weight(1f))
                        val cnt = commentCounts[commentingPost!!.id] ?: 0
                        if (cnt > 0) {
                            Text(
                                "$cnt",
                                fontSize = 15.sp,
                                color = colors.textSecondary
                            )
                        }
                    }

                    HorizontalDivider(color = colors.divider)

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(colors.card)
                            .padding(14.dp)
                    ) {
                        Column {
                            Text(
                                commentingPost!!.senderName ?: "",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = colors.accent
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                commentingPost!!.text,
                                fontSize = 15.sp,
                                color = colors.textPrimary
                            )
                        }
                    }

                    if (commentsLoading) {
                        Box(
                            modifier = Modifier.fillMaxWidth().padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Загрузка...", color = colors.textSecondary, fontSize = 14.sp)
                        }
                    } else if (postComments.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxWidth().padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Пока нет комментариев", color = colors.textSecondary, fontSize = 14.sp)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 400.dp)
                                .padding(horizontal = 16.dp)
                        ) {
                            items(postComments, key = { it.id }) { comment ->
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 6.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(colors.card)
                                        .padding(12.dp)
                                ) {
                                    Text(
                                        comment.senderName ?: "",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = colors.accent
                                    )
                                    Spacer(Modifier.height(2.dp))
                                    Text(
                                        comment.text,
                                        fontSize = 15.sp,
                                        color = colors.textPrimary
                                    )
                                    Text(
                                        comment.time,
                                        fontSize = 11.sp,
                                        color = colors.textSecondary,
                                        modifier = Modifier.padding(top = 4.dp)
                                    )
                                }
                            }
                        }
                    }

                    var commentInput by remember { mutableStateOf("") }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(44.dp)
                                .clip(RoundedCornerShape(22.dp))
                                .background(Color(0xFF2E2E2E).copy(alpha = 0.85f))
                                .padding(horizontal = 16.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            if (commentInput.isEmpty()) {
                                Text("Комментарий", color = Color.White.copy(alpha = 0.35f), fontSize = 15.sp)
                            }
                            BasicTextField(
                                value = commentInput,
                                onValueChange = { commentInput = it },
                                singleLine = true,
                                textStyle = androidx.compose.ui.text.TextStyle(color = Color.White, fontSize = 15.sp),
                                cursorBrush = SolidColor(colors.accent),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        LiquidButton(
                            onClick = {
                                val txt = commentInput.trim()
                                if (txt.isEmpty() || commentingPost == null) return@LiquidButton
                                commentInput = ""
                                scope.launch {
                                    try {
                                        val fwdMsg = messages.find { it.channelPostId == commentingPost!!.id }
                                        val replyId = fwdMsg?.id
                                        ApiClient.sendMessage(chatId, txt, replyId)
                                        postComments = ApiClient.getChannelPostComments(chatId, commentingPost!!.id)
                                        commentCounts = ApiClient.getChannelCommentCounts(chatId)
                                        messages = messages.map { m ->
                                            if (m.id == commentingPost!!.id) m.copy(commentCount = commentCounts[m.id] ?: 0) else m
                                        }
                                    } catch (_: Exception) {}
                                }
                            },
                            surfaceColor = if (commentInput.isNotBlank()) colors.accent.copy(alpha = 0.7f) else Color(0xFF2E2E2E).copy(alpha = 0.85f),
                            modifier = Modifier.height(44.dp),
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.Send,
                                contentDescription = "Отправить",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }
        }

        if (showGiftSheet) {
            ModalBottomSheet(
                onDismissRequest = { showGiftSheet = false },
                sheetState = rememberModalBottomSheetState(),
                containerColor = if (colors.isDark) Color(0xFF1E1E1E) else Color.White,
                contentColor = colors.textPrimary,
                dragHandle = { BottomSheetDefaults.DragHandle() }
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(bottom = 16.dp)
                ) {
                    Text(
                        "Выберите подарок",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.textPrimary,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 380.dp)
                            .padding(horizontal = 12.dp)
                    ) {
                        items(com.ms.messenger.ui.settings.giftItems, key = { it.id }) { gift ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .clickable {
                                        showGiftSheet = false
                                        giftToSend = gift
                                    }
                                    .padding(horizontal = 8.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Image(
                                    painter = androidx.compose.ui.res.painterResource(gift.resId),
                                    contentDescription = gift.name,
                                    modifier = Modifier.size(44.dp),
                                    contentScale = ContentScale.Fit
                                )
                                Spacer(Modifier.width(12.dp))
                                Text(
                                    gift.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = colors.textPrimary,
                                    modifier = Modifier.weight(1f)
                                )
                                Image(
                                    painter = androidx.compose.ui.res.painterResource(com.ms.messenger.R.drawable.coin),
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp),
                                    contentScale = ContentScale.Crop
                                )
                                Spacer(Modifier.width(4.dp))
                                Text(
                                    "${gift.price}",
                                    fontSize = 14.sp,
                                    color = colors.textSecondary
                                )
                    }
                }
            }
        }
    }
}

        if (trackedGiftIndex >= 0 && giftCardY.floatValue > 0f) {
            val dy = giftCardY.floatValue - rootTopY.floatValue
            val overlayH = if (singleGift) 210f else 260f
            if (dy in 0f..(rootHeight.floatValue - overlayH)) {
                val g = messages[trackedGiftIndex]
                GiftSquareOverlay(
                    msg = g,
                    giftAtt = g.attachment!!,
                    colors = colors,
                    compact = singleGift,
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .offset { IntOffset(0, dy.toInt()) }
                )
            }
        }

        giftToSend?.let { gift ->
            com.ms.messenger.ui.settings.GiftPreviewDialog(
                gift = gift,
                backdrop = null,
                onDismiss = { giftToSend = null },
                onSent = { msg, chatMsg ->
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                    if (chatMsg != null) {
                        messages = messages + chatMsg
                        scope.launch { listState.animateScrollToItem(messages.size - 1) }
                        if (chatMsg.attachment?.type == "gift") {
                            burstGiftResId = gift.resId
                            showGiftBurst = true
                            scope.launch {
                                delay(2200)
                                showGiftBurst = false
                            }
                        }
                    }
                },
                fixedRecipient = peerUserId?.let { it to peerName }
            )
        }

        if (showGiftBurst) {
            GiftBurstOverlay(giftResId = burstGiftResId)
        }

        AnimatedVisibility(
            visible = menuMsg != null,
            enter = fadeIn(tween(200)) + scaleIn(initialScale = 0.92f, animationSpec = tween(200)),
            exit = fadeOut(tween(150)) + scaleOut(targetScale = 0.95f, animationSpec = tween(150))
        ) {
            menuMsg?.let { m ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clickable(
                            indication = null,
                            interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                        ) { menuMsg = null }
                ) {
                Column(
                    modifier = Modifier
                        .offset { IntOffset(0, (menuMsgY + menuMsgH - 20).toInt()) }
                        .padding(horizontal = 12.dp)
                        .widthIn(max = 180.dp)
                        .clip(RoundedCornerShape(30.dp))
                        .shadow(12.dp, RoundedCornerShape(30.dp), ambientColor = Color.Black.copy(alpha = 0.3f))
                        .background(
                            if (colors.isDark) Color(0xFF2C2C2E).copy(alpha = 0.88f)
                            else Color.White.copy(alpha = 0.92f)
                        )
                        .clickable(
                            indication = null,
                            interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                        ) {}
                        .padding(vertical = 4.dp)
                ) {
                    MsgMenuItem(Icons.Filled.Reply, "Ответить", colors.isDark) {
                        replyTo = m
                        menuMsg = null
                    }
                    MsgMenuItem(Icons.Filled.ContentCopy, "Скопировать", colors.isDark) {
                        val cm = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                        val text = m.text?.takeIf { it.isNotBlank() }
                            ?: m.attachment?.url
                            ?: m.attachment?.type
                            ?: ""
                        cm.setPrimaryClip(android.content.ClipData.newPlainText("ms-message", text))
                        Toast.makeText(context, "Скопировано", Toast.LENGTH_SHORT).show()
                        menuMsg = null
                    }
                    MsgMenuItem(Icons.AutoMirrored.Filled.Forward, "Переслать", colors.isDark) {
                        scope.launch {
                            runCatching {
                                forwardChats = ApiClient.getChats().chats
                                showForwardPicker = true
                            }.onFailure {
                                Toast.makeText(context, "Не удалось загрузить чаты", Toast.LENGTH_SHORT).show()
                            }
                        }
                        forwardMsg = m
                        menuMsg = null
                    }
                    MsgMenuItem(Icons.Filled.Report, "Пожаловаться", colors.isDark) {
                        scope.launch {
                            runCatching { ApiClient.reportMessage(m.id) }
                                .onSuccess { Toast.makeText(context, "Жалоба отправлена", Toast.LENGTH_SHORT).show() }
                                .onFailure { Toast.makeText(context, "Не удалось отправить жалобу", Toast.LENGTH_SHORT).show() }
                        }
                        menuMsg = null
                    }
                    MsgMenuItem(Icons.Filled.CheckCircle, "Выбрать", colors.isDark) {
                        selectionMode = true
                        if (m.id !in selectedIds) selectedIds.add(m.id)
                        menuMsg = null
                    }
                }
            }
        }
        }

        AnimatedVisibility(
            visible = showForwardPicker,
            enter = fadeIn(tween(200)) + scaleIn(initialScale = 0.92f, animationSpec = tween(200)),
            exit = fadeOut(tween(150)) + scaleOut(targetScale = 0.95f, animationSpec = tween(150))
        ) {
            val fMsg = forwardMsg
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable(
                        indication = null,
                        interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                    ) { showForwardPicker = false }
            ) {
                Column(
                    modifier = Modifier
                        .align(Alignment.Center)
                        .widthIn(max = 220.dp)
                        .clip(RoundedCornerShape(30.dp))
                        .shadow(12.dp, RoundedCornerShape(30.dp), ambientColor = Color.Black.copy(alpha = 0.3f))
                        .background(
                            if (colors.isDark) Color(0xFF2C2C2E).copy(alpha = 0.88f)
                            else Color.White.copy(alpha = 0.92f)
                        )
                        .clickable(
                            indication = null,
                            interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                        ) {}
                        .padding(vertical = 4.dp)
                ) {
                    Text(
                        "Переслать в…",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (colors.isDark) Color(0xFF0A84FF) else Color(0xFF007AFF),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                    forwardChats.filter { it.id != chatId }.forEach { c ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    if (fMsg != null) {
                                        scope.launch {
                                            runCatching {
                                                ApiClient.sendMessage(
                                                    c.id,
                                                    fMsg.text ?: "",
                                                    attachment = fMsg.attachment?.let {
                                                        mapOf("type" to (it.type ?: ""), "url" to (it.url ?: ""))
                                                    }
                                                )
                                            }.onSuccess {
                                                Toast.makeText(context, "Переслано в ${c.peer?.name ?: c.name}", Toast.LENGTH_SHORT).show()
                                            }.onFailure {
                                                Toast.makeText(context, "Не удалось переслать", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    }
                                    showForwardPicker = false
                                }
                                .padding(horizontal = 12.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Avatar(28, c.peer?.name ?: c.name, c.peer?.avatar, fontSize = 11)
                            Spacer(Modifier.width(10.dp))
                            Text(
                                c.peer?.name ?: c.name,
                                fontSize = 13.sp,
                                color = if (colors.isDark) Color.White.copy(alpha = 0.85f) else Color.Black.copy(alpha = 0.85f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MsgMenuItem(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, isDark: Boolean, onClick: () -> Unit) {
    val interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val bgColor by animateColorAsState(
        if (isPressed) {
            if (isDark) Color.White.copy(alpha = 0.1f) else Color.Black.copy(alpha = 0.06f)
        } else Color.Transparent,
        label = "bg"
    )
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp, vertical = 1.dp)
            .clip(RoundedCornerShape(50))
            .background(bgColor)
            .clickable(interactionSource = interactionSource, indication = null, onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = if (isDark) Color.White.copy(alpha = 0.6f) else Color.Black.copy(alpha = 0.5f),
            modifier = Modifier.size(17.dp)
        )
        Spacer(Modifier.width(10.dp))
        Text(
            label,
            fontSize = 13.sp,
            color = if (isDark) Color.White.copy(alpha = 0.9f) else Color.Black.copy(alpha = 0.85f)
        )
    }
}

@Composable
fun ChannelPostCard(
    msg: Message,
    colors: com.ms.messenger.theme.AppThemeColors,
    onComments: (Message) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(colors.card)
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        msg.senderName ?: "Канал",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.accent
                    )
                    if (msg.pinned) {
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "\uD83D\uDCCC",
                            fontSize = 12.sp
                        )
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    msg.text,
                    fontSize = 16.sp,
                    color = colors.textPrimary
                )
            }
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 8.dp, top = 2.dp, end = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                msg.time,
                fontSize = 11.sp,
                color = colors.textSecondary
            )
            Spacer(Modifier.weight(1f))
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onComments(msg) }
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "\uD83D\uDCAC",
                    fontSize = 13.sp
                )
                Spacer(Modifier.width(4.dp))
                val cnt = msg.commentCount
                Text(
                    if (cnt > 0) "$cnt" else "0",
                    fontSize = 12.sp,
                    fontWeight = if (cnt > 0) FontWeight.Medium else FontWeight.Normal,
                    color = if (cnt > 0) colors.accent else colors.textSecondary
                )
            }
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
    tracked: Boolean,
    onTrackedY: (Float) -> Unit,
    compact: Boolean = false,
) {
    val giftAtt = msg.attachment?.takeIf { it.type == "gift" }
    if (giftAtt != null) {
        GiftBubble(msg = msg, giftAtt = giftAtt, isOwn = isOwn, colors = colors, tracked = tracked, onTrackedY = onTrackedY, compact = compact, onLongClick = onLongClick)
        return
    }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp)
            .combinedClickable(onClick = onReply, onLongClick = onLongClick),
        horizontalAlignment = if (isOwn) Alignment.End else Alignment.Start
    ) {
        Box(
            modifier = Modifier.widthIn(max = 320.dp)
        ) {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .drawBehind {
                        val color = if (isOwn) colors.bubbleOwn else colors.bubbleOther
                        val path = Path().apply {
                            if (isOwn) {
                                moveTo(size.width - 14.dp.toPx(), size.height)
                                quadraticBezierTo(
                                    size.width - 6.dp.toPx(), size.height + 8.dp.toPx(),
                                    size.width - 2.dp.toPx(), size.height
                                )
                            } else {
                                moveTo(2.dp.toPx(), size.height)
                                quadraticBezierTo(
                                    6.dp.toPx(), size.height + 8.dp.toPx(),
                                    14.dp.toPx(), size.height
                                )
                            }
                            close()
                        }
                        drawPath(path, color)
                    }
            )
            Column(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(if (isOwn) colors.bubbleOwn else colors.bubbleOther)
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
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

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun GiftBubble(
    msg: Message,
    giftAtt: com.ms.messenger.models.Attachment,
    isOwn: Boolean,
    colors: com.ms.messenger.theme.AppThemeColors,
    tracked: Boolean,
    onTrackedY: (Float) -> Unit,
    compact: Boolean,
    onLongClick: () -> Unit,
) {
    if (tracked) {
        Box(
            modifier = Modifier
                .size(if (compact) 140.dp else 170.dp)
                .onGloballyPositioned { onTrackedY(it.positionInWindow().y) }
        )
        return
    }
    val giftItem = com.ms.messenger.ui.settings.giftItems.find { it.id == giftAtt.url }
    Box(
        modifier = Modifier.fillMaxWidth().combinedClickable(onClick = {}, onLongClick = onLongClick),
        contentAlignment = Alignment.Center
    ) {
        GiftCardColumn(
            msg = msg,
            giftAtt = giftAtt,
            giftItem = giftItem,
            colors = colors,
            compact = compact,
            squareModifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(
                    Brush.linearGradient(
                        listOf(
                            Color.White.copy(alpha = 0.28f),
                            Color.White.copy(alpha = 0.04f)
                        )
                    )
                )
        )
    }
}

@Composable
private fun GiftSquareOverlay(
    msg: Message,
    giftAtt: com.ms.messenger.models.Attachment,
    colors: com.ms.messenger.theme.AppThemeColors,
    modifier: Modifier = Modifier,
    compact: Boolean = false,
) {
    val giftItem = com.ms.messenger.ui.settings.giftItems.find { it.id == giftAtt.url }
    Box(
        modifier = modifier,
        contentAlignment = Alignment.TopCenter
    ) {
        GiftCardColumn(
            msg = msg,
            giftAtt = giftAtt,
            giftItem = giftItem,
            colors = colors,
            compact = compact,
            squareModifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(
                    Brush.linearGradient(
                        listOf(
                            Color.White.copy(alpha = 0.28f),
                            Color.White.copy(alpha = 0.04f)
                        )
                    )
                )
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GiftCardColumn(
    msg: Message,
    giftAtt: com.ms.messenger.models.Attachment,
    giftItem: com.ms.messenger.ui.settings.GiftItem?,
    colors: com.ms.messenger.theme.AppThemeColors,
    squareModifier: Modifier,
    compact: Boolean = false,
) {
    var showViewer by remember { mutableStateOf(false) }
    val emojiSize = if (compact) 56.dp else 72.dp
    val cardWidth = if (compact) 140.dp else 170.dp

    Column(
        modifier = Modifier
            .width(cardWidth)
            .padding(vertical = 2.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .width(cardWidth)
                .then(squareModifier)
                .clip(RoundedCornerShape(20.dp))
                .background(colors.card)
                .clickable { showViewer = true }
                .padding(vertical = if (compact) 14.dp else 18.dp, horizontal = 12.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                if (giftItem != null) {
                    Image(
                        painter = androidx.compose.ui.res.painterResource(giftItem.resId),
                        contentDescription = giftItem.name,
                        modifier = Modifier.size(emojiSize),
                        contentScale = ContentScale.Fit
                    )
                } else {
                    Text("🎁", fontSize = if (compact) 40.sp else 48.sp)
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    "Подарок от ${msg.senderName ?: "Неизвестный"}",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    giftItem?.name ?: giftAtt.url ?: "Подарок",
                    fontSize = 11.sp,
                    color = colors.textSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
        Box(
            modifier = Modifier
                .width(cardWidth)
                .padding(top = 6.dp)
                .clip(RoundedCornerShape(50))
                .background(colors.accent.copy(alpha = 0.15f))
                .clickable { showViewer = true }
                .padding(horizontal = 20.dp, vertical = 6.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                "Посмотреть",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = colors.accent
            )
        }
        Text(
            msg.time,
            fontSize = 11.sp,
            color = colors.textSecondary,
            modifier = Modifier.padding(top = 2.dp, end = 4.dp)
        )
    }

    if (showViewer) {
        androidx.compose.ui.window.Dialog(
            onDismissRequest = { showViewer = false },
            properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable(
                        indication = null,
                        interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                    ) { showViewer = false },
                contentAlignment = Alignment.BottomCenter
            ) {
                AnimatedVisibility(
                    visible = true,
                    enter = slideInVertically(tween(350)) { it } + fadeIn(tween(350))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 19.dp)
                            .clip(RoundedCornerShape(28.dp))
                            .background(
                                Brush.verticalGradient(
                                    listOf(Color(0xFF3A3A3E), Color(0xFF2A2A2E))
                                )
                            )
                            .clickable(
                                indication = null,
                                interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                            ) { }
                            .padding(horizontal = 24.dp, vertical = 28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        if (giftItem != null) {
                            Image(
                                painter = androidx.compose.ui.res.painterResource(giftItem.resId),
                                contentDescription = giftItem.name,
                                modifier = Modifier.size(140.dp),
                                contentScale = ContentScale.Fit
                            )
                        } else {
                            Text("🎁", fontSize = 96.sp)
                        }
                        Spacer(Modifier.height(14.dp))
                        Text(
                            giftItem?.name ?: giftAtt.url ?: "Подарок",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "Подарок от ${msg.senderName ?: "Аноним"}",
                            fontSize = 15.sp,
                            color = Color.White.copy(alpha = 0.85f)
                        )
                        Spacer(Modifier.height(10.dp))
                        val dateText = remember(msg.time) {
                            msg.time
                        }
                        Text(
                            dateText,
                            fontSize = 13.sp,
                            color = Color.White.copy(alpha = 0.6f)
                        )
                        Spacer(Modifier.height(16.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(50))
                                .background(Color.White.copy(alpha = 0.08f))
                                .padding(horizontal = 18.dp, vertical = 8.dp)
                        ) {
                            Text(
                                "${giftItem?.price ?: 0} MCoins",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color.White.copy(alpha = 0.9f)
                            )
                        }
                        Spacer(Modifier.height(20.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(50))
                                .background(colors.accent)
                                .clickable { showViewer = false }
                                .padding(vertical = 14.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "ОК",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun InputBar(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    onVoiceSend: (ByteArray, String) -> Unit = { _, _ -> },
    onMediaSend: (ByteArray, String) -> Unit = { _, _ -> },
    onGift: (() -> Unit)? = null,
    colors: com.ms.messenger.theme.AppThemeColors,
) {
    val hasText = value.isNotBlank()
    var showEmoji by remember { mutableStateOf(false) }
    val isDark = colors.isDark
    val textColor = if (isDark) Color.White else Color.Black
    val hintColor = if (isDark) Color.White.copy(alpha = 0.4f) else Color.Black.copy(alpha = 0.35f)
    val context = LocalContext.current
    var isRecording by remember { mutableStateOf(false) }
    var recordingTimer by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    var mediaRecorder by remember { mutableStateOf<android.media.MediaRecorder?>(null) }

    val mediaLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        scope.launch {
            val mimeType = context.contentResolver.getType(uri) ?: "image/*"
            val bytes = withContext(Dispatchers.IO) {
                context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            } ?: return@launch
            onMediaSend(bytes, mimeType)
        }
    }

    fun startRecording() {
        try {
            val file = java.io.File(context.cacheDir, "voice_${System.currentTimeMillis()}.ogg")
            val recorder = android.media.MediaRecorder().apply {
                setAudioSource(android.media.MediaRecorder.AudioSource.MIC)
                setOutputFormat(android.media.MediaRecorder.OutputFormat.OGG)
                setAudioEncoder(android.media.MediaRecorder.AudioEncoder.OPUS)
                setAudioSamplingRate(48000)
                setAudioEncodingBitRate(64000)
                setOutputFile(file.absolutePath)
                prepare()
                start()
            }
            mediaRecorder = recorder
            isRecording = true
            recordingTimer = 0
        } catch (_: Exception) {}
    }

    fun stopRecording() {
        try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
            isRecording = false
            val file = java.io.File(context.cacheDir, "voice_${System.currentTimeMillis()}.ogg")
            if (file.exists()) {
                val bytes = file.readBytes()
                file.delete()
                onVoiceSend(bytes, "audio/ogg")
            }
        } catch (_: Exception) {
            mediaRecorder = null
            isRecording = false
        }
    }

    LaunchedEffect(isRecording) {
        if (isRecording) {
            while (isRecording) {
                delay(1000)
                recordingTimer++
            }
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            mediaRecorder?.tryRelease()
        }
    }

    Column {
        AnimatedVisibility(
            visible = showEmoji,
            enter = expandVertically(tween(200)),
            exit = shrinkVertically(tween(200))
        ) {
            EmojiPicker(
                onEmojiClick = { emoji ->
                    onValueChange(value + emoji)
                }
            )
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
        ) {
            if (isRecording) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(Color.Red)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "Запись... ${recordingTimer / 60}:${String.format("%02d", recordingTimer % 60)}",
                        color = textColor,
                        fontSize = 15.sp
                    )
                    Spacer(Modifier.weight(1f))
                    Text(
                        "Отправить",
                        color = colors.accent,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.clickable { stopRecording() }
                    )
                }
            } else {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 10.dp)
                        .animateContentSize(animationSpec = tween(250)),
                    verticalAlignment = Alignment.Bottom
                ) {
                    LiquidButton(
                        onClick = { mediaLauncher.launch("*/*") },
                        backdrop = null,
                        surfaceColor = if (isDark) Color.White.copy(alpha = 0.12f) else Color.Unspecified,
                        modifier = Modifier.height(44.dp),
                    ) {
                        Icon(
                            Icons.Filled.Add,
                            contentDescription = "Прикрепить",
                            tint = textColor,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Spacer(Modifier.width(6.dp))
                    if (onGift != null) {
                        LiquidButton(
                            onClick = onGift,
                            backdrop = null,
                            surfaceColor = if (isDark) Color.White.copy(alpha = 0.12f) else Color.Unspecified,
                            modifier = Modifier.height(44.dp),
                        ) {
                            Text(
                                "🎁",
                                fontSize = 20.sp,
                                modifier = Modifier.padding(horizontal = 6.dp)
                            )
                        }
                        Spacer(Modifier.width(6.dp))
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                            .clip(RoundedCornerShape(22.dp))
                            .background(
                                if (isDark) Color.White.copy(alpha = 0.12f)
                                else Color.White.copy(alpha = 0.85f)
                            )
                            .padding(horizontal = 16.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        if (value.isEmpty()) {
                            Text(
                                "Сообщение",
                                color = hintColor,
                                fontSize = 15.sp
                            )
                        }
                        BasicTextField(
                            value = value,
                            onValueChange = onValueChange,
                            singleLine = false,
                            maxLines = 4,
                            textStyle = androidx.compose.ui.text.TextStyle(
                                color = textColor,
                                fontSize = 15.sp,
                            ),
                            cursorBrush = SolidColor(colors.accent),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    Spacer(Modifier.width(6.dp))
                    AnimatedVisibility(
                        visible = !hasText,
                        enter = fadeIn(animationSpec = tween(200)) + scaleIn(initialScale = 0.5f, animationSpec = tween(200)),
                        exit = fadeOut(animationSpec = tween(150)) + scaleOut(targetScale = 0.5f, animationSpec = tween(150))
                    ) {
                        Row(verticalAlignment = Alignment.Bottom) {
                            LiquidButton(
                                onClick = { showEmoji = !showEmoji },
                                backdrop = null,
                                surfaceColor = if (showEmoji) colors.accent.copy(alpha = 0.7f) else if (isDark) Color.White.copy(alpha = 0.12f) else Color.Unspecified,
                                modifier = Modifier.height(44.dp),
                            ) {
                                Icon(
                                    Icons.Filled.SentimentSatisfied,
                                    contentDescription = "Emoji",
                                    tint = textColor,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(Modifier.width(6.dp))
                            LiquidButton(
                                onClick = { startRecording() },
                                backdrop = null,
                                surfaceColor = if (isDark) Color.White.copy(alpha = 0.12f) else Color.Unspecified,
                                modifier = Modifier.height(44.dp),
                            ) {
                                Icon(
                                    Icons.Filled.Mic,
                                    contentDescription = "Голос",
                                    tint = textColor,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                        }
                    }
                    AnimatedVisibility(
                        visible = hasText,
                        enter = fadeIn(animationSpec = tween(200)) + scaleIn(initialScale = 0.5f, animationSpec = tween(200)),
                        exit = fadeOut(animationSpec = tween(150)) + scaleOut(targetScale = 0.5f, animationSpec = tween(150))
                    ) {
                        LiquidButton(
                            onClick = onSend,
                            backdrop = null,
                            surfaceColor = colors.accent.copy(alpha = 0.85f),
                            modifier = Modifier.height(44.dp),
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.Send,
                                contentDescription = "Отправить",
                                tint = Color.White,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun android.media.MediaRecorder.tryRelease() {
    try { stop() } catch (_: Exception) {}
    try { release() } catch (_: Exception) {}
}

private data class BurstParticle(val emoji: String, val angle: Float, val dist: Float, val delayMs: Int)

@Composable
private fun GiftBurstOverlay(giftResId: Int) {
    val particles = remember { List(16) { i ->
        BurstParticle(
            listOf("❤️", "🎁", "✨", "💖", "🎉", "🥳")[i % 6],
            -90f + (i * 24f),
            180f + (i % 4) * 90f,
            (i * 55) % 400
        )
    } }
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        val pop = remember { Animatable(0f) }
        LaunchedEffect(Unit) {
            pop.animateTo(1f, animationSpec = tween(700, easing = FastOutSlowInEasing))
        }
        Image(
            painter = androidx.compose.ui.res.painterResource(giftResId),
            contentDescription = null,
            modifier = Modifier
                .size(96.dp)
                .graphicsLayer {
                    val p = pop.value
                    val eased = if (p < 0.5f) p * 2f else 2f - p * 2f
                    scaleX = 0.3f + eased * 1.7f
                    scaleY = 0.3f + eased * 1.7f
                    alpha = 1f - p * p
                }
        )
        particles.forEach { (emoji, angle, dist, delayMs) ->
            GiftParticle(emoji, angle, dist, delayMs)
        }
    }
}

@Composable
private fun GiftParticle(emoji: String, angle: Float, dist: Float, delayMs: Int) {
    val anim = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        delay(delayMs.toLong())
        anim.animateTo(1f, animationSpec = tween(1500, easing = FastOutSlowInEasing))
    }
    val p = anim.value
    val rad = Math.toRadians(angle.toDouble())
    val dx = (Math.cos(rad) * dist * p).toFloat()
    val dy = (Math.sin(rad) * dist * p).toFloat() - 40f * p
    Text(
        emoji,
        fontSize = (22f + 12f * p).sp,
        modifier = Modifier
            .offset { IntOffset(dx.toInt(), dy.toInt()) }
            .graphicsLayer {
                alpha = (1f - p * p).coerceIn(0f, 1f)
                scaleX = 0.4f + p * 0.6f
                scaleY = 0.4f + p * 0.6f
            }
    )
}