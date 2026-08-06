package com.ms.messenger.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ms.messenger.data.ApiClient
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.models.Gift
import com.ms.messenger.models.ReceivedGift
import com.ms.messenger.models.User
import com.ms.messenger.theme.AppColors
import com.ms.messenger.theme.parseHex
import com.ms.messenger.ui.Avatar
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen() {
    val colors = AppColors.current()
    val scope = rememberCoroutineScope()
    var user by remember { mutableStateOf<User?>(null) }
    var gifts by remember { mutableStateOf<List<ReceivedGift>>(emptyList()) }
    val myUserId = PrefsHolder.session.myUserId

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val resp = ApiClient.me()
                user = resp.user
                PrefsHolder.session.myUserId = resp.user.id
            } catch (e: Exception) { }
        }
        scope.launch {
            myUserId?.let { id ->
                try { gifts = ApiClient.getUserGifts(id).gifts } catch (e: Exception) { }
            }
        }
    }

    LazyColumn(Modifier.fillMaxSize().background(colors.bg)) {
        item {
            BannerHeader(user, colors)
        }
        if (user != null) {
            item {
                Column(
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.textPrimary.copy(alpha = if (colors.isDark) 0.06f else 0.04f))
                        .padding(16.dp)
                ) {
                    InfoRow("Телефон", user?.phone ?: "—", colors)
                    androidx.compose.material3.HorizontalDivider(
                        Modifier.padding(vertical = 8.dp),
                        color = colors.textPrimary.copy(alpha = 0.08f)
                    )
                    InfoRow("@username", "@${user?.userId}", colors)
                }
            }
            item {
                Text(
                    "Полученные подарки",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
                )
            }
            item {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 20.dp),
                    horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    itemsIndexed(gifts) { i, g ->
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(colors.textPrimary.copy(alpha = 0.06f))
                                .padding(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(androidx.compose.foundation.shape.CircleShape)
                                    .background(colors.card),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(giftIcon(g.giftId), fontSize = 22.sp)
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(g.fromUserName ?: "Подарок", fontSize = 11.sp, color = colors.textSecondary, maxLines = 1)
                        }
                    }
                }
            }
        }
        item { Spacer(Modifier.height(100.dp)) }
    }
}

private fun giftIcon(id: String): String = when (id) {
    "lisa" -> "🦊"
    "vapka" -> "😀"
    else -> "🎁"
}

@Composable
fun BannerHeader(user: User?, colors: com.ms.messenger.theme.AppThemeColors) {
    val bannerColor = parseHex(user?.profileColor) ?: colors.accent
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .background(
                Brush.verticalGradient(
                    listOf(bannerColor.copy(alpha = 0.6f), colors.bg)
                )
            )
    ) {
        Column(
            Modifier.align(Alignment.BottomStart).padding(20.dp)
        ) {
            Avatar(72, user?.name, user?.avatar, user?.profileColor, fontSize = 26)
            Spacer(Modifier.height(8.dp))
            Text(
                user?.name ?: "…",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary
            )
            if (user?.verified == true) {
                Text("✓ Верифицирован", fontSize = 13.sp, color = OnlineGreen)
            }
            Text(
                "@${user?.userId ?: ""} · ${user?.mcoins ?: 0} 🪙",
                fontSize = 14.sp,
                color = colors.textSecondary
            )
        }
    }
}

private val OnlineGreen = Color(0xFF34C759)

@Composable
fun InfoRow(label: String, value: String, colors: com.ms.messenger.theme.AppThemeColors) {
    Column {
        Text(label, fontSize = 12.sp, color = colors.textSecondary)
        Text(value, fontSize = 16.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
    }
}