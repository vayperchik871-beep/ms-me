package com.ms.messenger.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ms.messenger.data.ApiClient
import com.ms.messenger.data.ApiException
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.theme.AppColors
import com.ms.messenger.ui.iOSButton
import com.ms.messenger.ui.iOSTextField
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    onBack: () -> Unit,
    onLoggedIn: () -> Unit,
) {
    val colors = AppColors.current()
    var userId by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var needsVerify by remember { mutableStateOf<String?>(null) }
    var code by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bg)
            .padding(horizontal = 24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(16.dp))
        Text(
            text = "‹ Назад",
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium,
            color = colors.accent,
            modifier = Modifier
                .align(Alignment.Start)
                .clip(RoundedCornerShape(8.dp))
                .clickable { onBack() }
        )
        Spacer(Modifier.height(32.dp))
        Text("Вход", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
        Spacer(Modifier.height(8.dp))
        Text("Войдите в свой аккаунт", fontSize = 15.sp, color = colors.textSecondary)
        Spacer(Modifier.height(32.dp))

        if (needsVerify != null) {
            Text("Введите код подтверждения с устройства", fontSize = 14.sp, color = colors.textSecondary)
            Spacer(Modifier.height(12.dp))
            iOSTextField(
                value = code,
                onValueChange = { code = it },
                placeholder = "Код",
                monospace = true
            )
            Spacer(Modifier.height(12.dp))
            iOSButton(
                text = "Подтвердить",
                enabled = code.isNotEmpty(),
                loading = loading,
                onClick = {
                    val deviceId = PrefsHolder.session.deviceId
                    scope.launch {
                        loading = true
                        error = null
                        try {
                            val resp = ApiClient.verifyDevice(code.trim(), deviceId)
                            if (resp.token != null) {
                                PrefsHolder.session.token = resp.token
                                PrefsHolder.session.userId = resp.user?.id
                                onLoggedIn()
                            } else {
                                error = resp.message ?: "Ошибка"
                            }
                        } catch (e: ApiException) { error = e.message } catch (e: Exception) { error = e.message }
                        loading = false
                    }
                }
            )
        } else {
            iOSTextField(
                value = userId,
                onValueChange = { userId = it.lowercase() },
                placeholder = "Уникальный ID"
            )
            Spacer(Modifier.height(12.dp))
            iOSTextField(
                value = password,
                onValueChange = { password = it },
                placeholder = "Пароль",
                visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation()
            )
            Spacer(Modifier.height(24.dp))
            iOSButton(
                text = "Войти",
                enabled = userId.length >= 3 && password.length >= 6,
                loading = loading,
                onClick = {
                    val deviceId = PrefsHolder.session.deviceId
                    scope.launch {
                        loading = true
                        error = null
                        try {
                            val resp = ApiClient.login(userId.trim(), password, deviceId)
                            if (resp.needsSetup && resp.token != null) {
                                PrefsHolder.session.token = resp.token
                                PrefsHolder.session.userId = resp.user?.id
                                onLoggedIn()
                            } else if (resp.token != null) {
                                PrefsHolder.session.token = resp.token
                                PrefsHolder.session.userId = resp.user?.id
                                onLoggedIn()
                            } else if (resp.message?.contains("код", ignoreCase = true) == true || resp.message?.contains("подтвержден", ignoreCase = true) == true) {
                                needsVerify = resp.message
                            } else {
                                error = resp.message ?: "Не удалось войти"
                            }
                        } catch (e: ApiException) { error = e.message } catch (e: Exception) { error = e.message }
                        loading = false
                    }
                }
            )
        }

        error?.let {
            Spacer(Modifier.height(12.dp))
            Text(it, color = colors.error, fontSize = 14.sp)
        }
        Spacer(Modifier.height(32.dp))
    }
}