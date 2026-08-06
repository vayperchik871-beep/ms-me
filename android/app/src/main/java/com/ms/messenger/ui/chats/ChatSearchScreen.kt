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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ms.messenger.data.ApiClient
import com.ms.messenger.models.Chat
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
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val resp = ApiClient.getChats()
            chats = resp.chats
        } catch (_: Exception) { }
        loading = false
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
                placeholder = { Text("Поиск чатов...", color = colors.textSecondary) },
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
            filtered.isEmpty() -> Box(
                Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    if (query.isBlank()) "Нет чатов" else "Ничего не найдено",
                    fontSize = 16.sp,
                    color = colors.textSecondary
                )
            }
            else -> LazyColumn(
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
            ) {
                items(filtered, key = { it.id }) { chat ->
                    ChatRow(chat, colors, onClick = { onOpenChat(chat.id) })
                }
            }
        }
    }
}
