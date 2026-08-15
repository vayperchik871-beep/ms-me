package com.ms.messenger.ui.settings

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ms.messenger.backdrop.components.LiquidCircleButton
import com.ms.messenger.data.ApiClient
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.i18n.Strings
import com.ms.messenger.theme.AppColors
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    onLogout: () -> Unit,
    onOpenProfile: (String?) -> Unit = {},
    onVerificationActive: (Boolean) -> Unit = {}
) {
    val colors = AppColors.current()
    var screen by remember { mutableStateOf("main") }

    LaunchedEffect(screen) {
        onVerificationActive(screen == "verification")
    }

    AnimatedContent(
        targetState = screen,
        transitionSpec = {
            if (targetState != "main") {
                slideInHorizontally(tween(300)) { it } + fadeIn(tween(250)) togetherWith
                    slideOutHorizontally(tween(300)) { -it / 4 } + fadeOut(tween(200))
            } else {
                slideInHorizontally(tween(300)) { -it / 4 } + fadeIn(tween(250)) togetherWith
                    slideOutHorizontally(tween(300)) { it } + fadeOut(tween(200))
            }
        },
        label = "settings_content"
    ) { current ->
        when (current) {
            "appearance" -> AppearanceScreen(onBack = { screen = "main" })
            "verification" -> VerificationScreen(onBack = { screen = "main" })
            "mcoins" -> MCoinsScreen(onBack = { screen = "main" })
            else -> SettingsMainContent(
                onOpenAppearance = { screen = "appearance" },
                onOpenVerification = { screen = "verification" },
                onOpenMCoins = { screen = "mcoins" },
                onOpenProfile = onOpenProfile,
                onDeleteAccount = onLogout,
            )
        }
    }
}

@Composable
private fun SettingsMainContent(
    onOpenAppearance: () -> Unit,
    onOpenVerification: () -> Unit = {},
    onOpenMCoins: () -> Unit = {},
    onOpenProfile: (String?) -> Unit = {},
    onDeleteAccount: () -> Unit = {},
) {
    val colors = AppColors.current()
    val myName = PrefsHolder.session.myName ?: "User"
    val myUserId = PrefsHolder.session.userId?.take(10) ?: ""
    val scope = rememberCoroutineScope()

    Column(
        Modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding()
    ) {
        Spacer(Modifier.height(12.dp))
        Text(
            Strings.titleSettings,
            fontSize = 17.sp,
            fontWeight = FontWeight.SemiBold,
            color = colors.textPrimary,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Spacer(Modifier.height(16.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(colors.card)
                .clickable { onOpenProfile(null) }
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            LiquidCircleButton(
                onClick = { onOpenProfile(null) },
                size = 56.dp,
            ) {
                Text(
                    myName.firstOrNull()?.uppercase() ?: "?",
                    color = colors.accent,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Spacer(Modifier.width(14.dp))
            Column {
                Text(myName, fontSize = 17.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
                Spacer(Modifier.height(2.dp))
                Text("@$myUserId", fontSize = 14.sp, color = colors.textSecondary)
            }
        }

        Spacer(Modifier.height(24.dp))

        Text(
            Strings.titleAppearance,
            fontSize = 14.sp,
            color = colors.textSecondary,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Spacer(Modifier.height(8.dp))
        SettingsItem(Strings.labelNavigationAndTheme, colors, onClick = onOpenAppearance)

        Spacer(Modifier.height(20.dp))

        Text(
            "Верификация",
            fontSize = 14.sp,
            color = colors.textSecondary,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Spacer(Modifier.height(8.dp))
        SettingsItem("MSMVerif / VerifiDev", colors, onClick = onOpenVerification)

        Spacer(Modifier.height(20.dp))

        Text(
            "MCoins",
            fontSize = 14.sp,
            color = colors.textSecondary,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Spacer(Modifier.height(8.dp))
        SettingsItem("MCoins", colors, onClick = onOpenMCoins)

        Spacer(Modifier.height(20.dp))

        Text(
            Strings.titlePrivacy,
            fontSize = 14.sp,
            color = colors.textSecondary,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Spacer(Modifier.height(8.dp))
        SettingsItem(Strings.labelPrivacyPolicy, colors)

        Spacer(Modifier.height(20.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(Color.Red.copy(alpha = 0.1f))
                .clickable {
                    scope.launch {
                        try { ApiClient.deleteAccount() } catch (_: Exception) {}
                        PrefsHolder.session.logout()
                        onDeleteAccount()
                    }
                }
                .padding(horizontal = 16.dp, vertical = 14.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            Text("Удалить аккаунт", fontSize = 16.sp, color = Color.Red)
        }

        Spacer(Modifier.weight(1f))
        Spacer(Modifier.height(80.dp))
    }
}

@Composable
fun SettingsItem(label: String, colors: com.ms.messenger.theme.AppThemeColors, onClick: () -> Unit = {}) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(colors.card)
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 16.sp, color = colors.textPrimary, modifier = Modifier.weight(1f))
        Icon(
            Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = colors.textSecondary,
            modifier = Modifier.size(20.dp)
        )
    }
}
