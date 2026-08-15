package com.ms.messenger.ui.chats

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ms.messenger.data.ApiClient
import com.ms.messenger.models.Chat
import com.ms.messenger.models.User
import com.ms.messenger.theme.AppColors
import com.ms.messenger.ui.Avatar
import kotlinx.coroutines.launch

@Composable
fun ChatSearchScreen(
    onBack: () -> Unit,
    onOpenChat: (String) -> Unit,
) {
    val colors = AppColors.current()
    val scope = rememberCoroutineScope()
    var query by remember { mutableStateOf("") }
    var chats by remember { mutableStateOf<List<Chat>>(emptyList()) }
    var users by remember { mutableStateOf<List<User>>(emptyList()) }
    var userSearching by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val resp = ApiClient.getChats()
            chats = resp.chats
        } catch (_: Exception) { }
        loading = false
    }

    val q = query.trim()

    LaunchedEffect(q) {
        if (q.length >= 2) {
            userSearching = true
            users = runCatching { ApiClient.searchUsers(q).users }.getOrDefault(emptyList())
            userSearching = false
        } else {
            users = emptyList()
        }
    }

    val filtered = remember(query, chats) {
        if (query.isBlank()) chats
        else chats.filter {
            it.name.contains(query, ignoreCase = true) ||
                    it.lastMessage.contains(query, ignoreCase = true)
        }
    }

    Column(Modifier.fillMaxSize().background(colors.bg)) {
        Spacer(Modifier.height(12.dp))

        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Назад",
                tint = colors.textPrimary,
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .clickable { onBack() }
                    .padding(2.dp)
            )
            Spacer(Modifier.width(8.dp))
            TextField(
                value = query,
                onValueChange = { query = it },
                placeholder = { Text("Поиск чатов и людей...", color = colors.textSecondary) },
                leadingIcon = {
                    Icon(Icons.Filled.Search, null, tint = colors.textSecondary, modifier = Modifier.size(20.dp))
                },
                trailingIcon = {
                    if (query.isNotEmpty()) {
                        Icon(
                            Icons.Filled.Clear,
                            contentDescription = "Очистить",
                            tint = colors.textSecondary,
                            modifier = Modifier
                                .size(20.dp)
                                .clip(CircleShape)
                                .clickable { query = "" }
                        )
                    }
                },
                singleLine = true,
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = colors.textPrimary.copy(alpha = 0.06f),
                    unfocusedContainerColor = colors.textPrimary.copy(alpha = 0.06f),
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                    cursorColor = colors.accent,
                    focusedTextColor = colors.textPrimary,
                    unfocusedTextColor = colors.textPrimary,
                ),
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
                    .clip(RoundedCornerShape(14.dp))
            )
        }

        Spacer(Modifier.height(8.dp))

        when {
            loading -> Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                androidx.compose.material3.CircularProgressIndicator(color = colors.accent)
            }
            query.isBlank() && filtered.isEmpty() -> Box(
                Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "Нет чатов",
                    fontSize = 16.sp,
                    color = colors.textSecondary
                )
            }
            query.isNotBlank() && users.isEmpty() && filtered.isEmpty() && !userSearching -> Box(
                Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "Ничего не найдено",
                    fontSize = 16.sp,
                    color = colors.textSecondary
                )
            }
            else -> LazyColumn(
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
            ) {
                if (users.isNotEmpty()) {
                    item(key = "users_header") {
                        Text(
                            "Люди",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textSecondary,
                            modifier = Modifier.padding(start = 8.dp, top = 8.dp, bottom = 4.dp)
                        )
                    }
                    items(users, key = { "user_${it.userId}" }) { user ->
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .clickable {
                                    scope.launch {
                                        try {
                                            val resp = ApiClient.addContact(user.userId)
                                            resp.chatId?.let { onOpenChat(it) }
                                        } catch (_: Exception) { }
                                    }
                                }
                                .padding(horizontal = 8.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Avatar(size = 44, name = user.name, avatarUrl = user.avatar)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(
                                    user.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = colors.textPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    "@${user.userId}",
                                    fontSize = 13.sp,
                                    color = colors.textSecondary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = null,
                                tint = colors.textSecondary,
                                modifier = Modifier.size(18.dp).graphicsLayer { rotationZ = 180f }
                            )
                        }
                    }
                }
                if (filtered.isNotEmpty()) {
                    item(key = "chats_header") {
                        Text(
                            "Чаты",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textSecondary,
                            modifier = Modifier.padding(start = 8.dp, top = 12.dp, bottom = 4.dp)
                        )
                    }
                    items(filtered, key = { it.id }) { chat ->
                        ChatRow(chat, colors, onClick = { onOpenChat(chat.id) })
                    }
                }
            }
        }
    }
}
