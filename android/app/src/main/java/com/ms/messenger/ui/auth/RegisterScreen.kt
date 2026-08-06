package com.ms.messenger.ui.auth

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.ms.messenger.data.ApiClient
import com.ms.messenger.data.ApiException
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.theme.AppColors
import kotlinx.coroutines.launch

@Composable
fun RegisterScreen(
    onBack: () -> Unit,
    onLoggedIn: () -> Unit,
) {
    val colors = AppColors.current()
    var step by remember { mutableIntStateOf(0) }
    var phone by remember { mutableStateOf("") }
    var userId by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var bio by remember { mutableStateOf("") }
    var avatarUri by remember { mutableStateOf<Uri?>(null) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var idTaken by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    val photoLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri -> avatarUri = uri }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(16.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(24.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            Text(
                text = "\u2039 Назад",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = colors.accent,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable { if (step > 0) step-- else onBack() }
            )
        }

        Box(
            modifier = Modifier.weight(1f),
            contentAlignment = Alignment.Center
        ) {
            when (step) {
                0 -> PhoneStep(
                    phone = phone,
                    onPhoneChange = { phone = it },
                    onNext = { step = 1 },
                )
                1 -> IdPasswordStep(
                    userId = userId,
                    onUserIdChange = { userId = it.lowercase().replace(" ", "") },
                    password = password,
                    onPasswordChange = { password = it },
                    idTaken = idTaken,
                    loading = loading,
                    onNext = {
                        scope.launch {
                            loading = true
                            error = null
                            try {
                                val check = ApiClient.checkUserId(userId)
                                idTaken = !check.available
                                if (check.available) step = 2
                            } catch (_: ApiException) {
                                step = 2
                            }
                            loading = false
                        }
                    },
                )
                2 -> ProfileStep(
                    name = name,
                    onNameChange = { name = it },
                    bio = bio,
                    onBioChange = { bio = it },
                    avatarUri = avatarUri,
                    onPickPhoto = { photoLauncher.launch("image/*") },
                    loading = loading,
                    error = error,
                    onRegister = {
                        scope.launch {
                            loading = true
                            error = null
                            try {
                                val deviceId = PrefsHolder.session.deviceId
                                val resp = ApiClient.register(
                                    userId = userId,
                                    name = name,
                                    password = password,
                                    deviceId = deviceId,
                                    phone = if (phone.isNotBlank()) "+777$phone" else null,
                                    bio = bio.ifBlank { null },
                                )
                                if (resp.token != null) {
                                    PrefsHolder.session.token = resp.token
                                    PrefsHolder.session.userId = resp.user?.id
                                    PrefsHolder.session.myName = resp.user?.name
                                    avatarUri?.let { uri ->
                                        try {
                                            val inputStream = context.contentResolver.openInputStream(uri)
                                            val bytes = inputStream?.readBytes()
                                            inputStream?.close()
                                            if (bytes != null) {
                                                ApiClient.uploadAvatar(bytes)
                                            }
                                        } catch (_: Exception) {}
                                    }
                                    onLoggedIn()
                                } else {
                                    error = resp.message ?: "Не удалось зарегистрироваться"
                                }
                            } catch (e: ApiException) {
                                error = e.message ?: "Ошибка"
                            } catch (e: Exception) {
                                error = e.message ?: "Ошибка"
                            }
                            loading = false
                        }
                    },
                )
            }
        }

        error?.let {
            Text(it, color = colors.error, fontSize = 14.sp)
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun PhoneStep(
    phone: String,
    onPhoneChange: (String) -> Unit,
    onNext: () -> Unit,
) {
    val colors = AppColors.current()
    val digits = phone.filter { it.isDigit() }.take(8)

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = "Придумайте номер",
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            color = colors.textPrimary,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Номер начинается на +777 и будет\nпривязан к вашему аккаунту навсегда",
            fontSize = 14.sp,
            color = colors.textSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 20.sp,
        )
        Spacer(Modifier.height(28.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            PhoneBox(
                text = "+7\n77",
                isLabel = true,
                modifier = Modifier.weight(1f)
            )
            PhoneBox(
                text = digits.take(4).ifEmpty { "XXXX" },
                isActive = true,
                modifier = Modifier.weight(1f)
            )
            PhoneBox(
                text = digits.drop(4).take(4).ifEmpty { "XXXX" },
                isActive = true,
                modifier = Modifier.weight(1f)
            )
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(0.dp)
        ) {
            BasicTextField(
                value = phone,
                onValueChange = { onPhoneChange(it.filter { c -> c.isDigit() }.take(8)) },
                modifier = Modifier.fillMaxWidth(),
                textStyle = androidx.compose.ui.text.TextStyle(color = colors.textPrimary),
                cursorBrush = SolidColor(colors.accent),
                singleLine = true,
            )
        }

        Spacer(Modifier.height(24.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(if (digits.length >= 8) colors.accent else colors.card)
                .clickable(enabled = digits.length >= 8) { onNext() },
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Готово",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (digits.length >= 8) colors.accentText else colors.textSecondary
            )
        }
    }
}

@Composable
private fun PhoneBox(
    text: String,
    isLabel: Boolean = false,
    isActive: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val colors = AppColors.current()
    Box(
        modifier = modifier
            .height(52.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (isActive) colors.inputBg else colors.card),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            fontSize = 17.sp,
            fontWeight = FontWeight.Medium,
            color = if (isLabel) colors.accent else colors.textSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 21.sp,
        )
    }
}

@Composable
private fun IdPasswordStep(
    userId: String,
    onUserIdChange: (String) -> Unit,
    password: String,
    onPasswordChange: (String) -> Unit,
    idTaken: Boolean,
    loading: Boolean,
    onNext: () -> Unit,
) {
    val colors = AppColors.current()

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = "Создайте ID и пароль",
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            color = colors.textPrimary,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Уникальный ID для входа в приложение",
            fontSize = 14.sp,
            color = colors.textSecondary,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(28.dp))

        RegTextField(
            value = userId,
            onValueChange = onUserIdChange,
            placeholder = "ID (латиница, минимум 3 символа)",
        )
        Spacer(Modifier.height(12.dp))
        RegTextField(
            value = password,
            onValueChange = onPasswordChange,
            placeholder = "Пароль (минимум 6 символов)",
            visualTransformation = PasswordVisualTransformation(),
        )

        if (idTaken) {
            Spacer(Modifier.height(8.dp))
            Text("Этот ID уже занят", color = colors.error, fontSize = 14.sp)
        }

        Spacer(Modifier.height(20.dp))

        val enabled = userId.length >= 3 && password.length >= 6
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(if (enabled) colors.accent else colors.card)
                .clickable(enabled = enabled && !loading) { onNext() },
            contentAlignment = Alignment.Center
        ) {
            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = colors.accentText,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    text = "Далее",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (enabled) colors.accentText else colors.textSecondary
                )
            }
        }
    }
}

@Composable
private fun ProfileStep(
    name: String,
    onNameChange: (String) -> Unit,
    bio: String,
    onBioChange: (String) -> Unit,
    avatarUri: Uri?,
    onPickPhoto: () -> Unit,
    loading: Boolean,
    error: String?,
    onRegister: () -> Unit,
) {
    val colors = AppColors.current()

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = "Заполните профиль",
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            color = colors.textPrimary,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Расскажите о себе",
            fontSize = 14.sp,
            color = colors.textSecondary,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(28.dp))

        Box(
            modifier = Modifier
                .size(110.dp)
                .clip(CircleShape)
                .background(colors.card)
                .clickable { onPickPhoto() },
            contentAlignment = Alignment.Center
        ) {
            if (avatarUri != null) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(avatarUri)
                        .crossfade(true)
                        .build(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Text(
                    text = "\uD83D\uDCF7",
                    fontSize = 32.sp,
                    color = colors.textSecondary
                )
            }
        }

        Spacer(Modifier.height(20.dp))

        RegTextField(
            value = name,
            onValueChange = onNameChange,
            placeholder = "Имя",
        )
        Spacer(Modifier.height(12.dp))
        RegTextField(
            value = bio,
            onValueChange = onBioChange,
            placeholder = "О себе (необязательно)",
        )

        Spacer(Modifier.height(20.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(
                    if (name.isNotBlank() && !loading) colors.accent
                    else colors.card
                )
                .clickable(enabled = name.isNotBlank() && !loading) { onRegister() },
            contentAlignment = Alignment.Center
        ) {
            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = colors.accentText,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    text = "Зарегистрироваться",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (name.isNotBlank()) colors.accentText else colors.textSecondary
                )
            }
        }
    }
}

@Composable
private fun RegTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    val colors = AppColors.current()
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(color = colors.inputBg, shape = RoundedCornerShape(14.dp))
            .padding(horizontal = 16.dp, vertical = 16.dp)
    ) {
        if (value.isEmpty()) {
            Text(
                text = placeholder,
                color = colors.textSecondary,
                fontSize = 15.sp
            )
        }
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            textStyle = androidx.compose.ui.text.TextStyle(
                color = colors.textPrimary,
                fontSize = 15.sp,
            ),
            cursorBrush = SolidColor(colors.accent),
            visualTransformation = visualTransformation,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
