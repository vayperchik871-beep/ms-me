package com.ms.messenger.ui.contacts

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ms.messenger.data.ApiClient
import com.ms.messenger.models.User
import com.ms.messenger.theme.AppColors
import com.ms.messenger.ui.Avatar48
import kotlinx.coroutines.launch

@Composable
fun ContactsScreen(onOpenProfile: (String) -> Unit = {}) {
    val colors = AppColors.current()
    val scope = rememberCoroutineScope()
    var contacts by remember { mutableStateOf<List<User>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var query by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<User>>(emptyList()) }

    fun load() {
        scope.launch {
            loading = true
            try { contacts = ApiClient.getContacts().users } catch (e: Exception) { }
            loading = false
        }
    }

    LaunchedEffect(Unit) { load() }

    LaunchedEffect(query) {
        if (query.length >= 2) {
            scope.launch {
                try { searchResults = ApiClient.searchUsers(query).users } catch (e: Exception) { searchResults = emptyList() }
            }
        } else searchResults = emptyList()
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding()
    ) {
        Spacer(Modifier.height(12.dp))
        Text(
            "Контакты",
            fontSize = 17.sp,
            fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
            color = colors.textPrimary,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Spacer(Modifier.height(12.dp))

        // Search bar - gray capsule like chats
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

        val list = if (query.length >= 2) searchResults else contacts
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
        ) {
            items(list, key = { it.id }) { user ->
                ContactRow(user, colors, onProfile = { onOpenProfile(user.userId) })
            }
        }
    }
}

@Composable
fun ContactRow(user: User, colors: com.ms.messenger.theme.AppThemeColors, onProfile: () -> Unit = {}) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable { onProfile() }
            .padding(vertical = 8.dp, horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Avatar48(user.name, user.avatar, user.profileColor)
        Spacer(Modifier.width(12.dp))
        Column {
            Text(user.name, fontSize = 16.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Medium, color = colors.textPrimary)
            Text("@${user.userId}", fontSize = 14.sp, color = colors.textSecondary)
        }
    }
}
