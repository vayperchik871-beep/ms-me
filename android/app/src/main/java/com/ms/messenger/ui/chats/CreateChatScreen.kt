package com.ms.messenger.ui.chats

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.lerp
import androidx.compose.ui.unit.sp
import coil.compose.rememberAsyncImagePainter
import com.kyant.backdrop.Backdrop
import com.ms.messenger.R
import com.ms.messenger.data.ApiClient
import com.ms.messenger.theme.AppColors
import kotlinx.coroutines.launch

@Composable
fun CreateChatScreen(
    type: String,
    onBack: () -> Unit,
    onCreated: (String) -> Unit,
    backdrop: Backdrop? = null,
) {
    val colors = AppColors.current()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var name by remember { mutableStateOf("") }
    var about by remember { mutableStateOf("") }
    var creating by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var avatarUri by remember { mutableStateOf<Uri?>(null) }
    var avatarBytes by remember { mutableStateOf<ByteArray?>(null) }

    var channelType by remember { mutableIntStateOf(0) }
    var enableDiscussion by remember { mutableStateOf(false) }
    var pinPosts by remember { mutableStateOf(false) }
    var showGroupForm by remember { mutableStateOf(false) }
    var discussionGroupId by remember { mutableStateOf<String?>(null) }

    var forwarding by remember { mutableStateOf(true) }
    var joinRequests by remember { mutableStateOf(false) }
    var publicUsername by remember { mutableStateOf("") }
    var businessUsername by remember { mutableStateOf("") }
    var businessLinks by remember { mutableStateOf(listOf("")) }

    val photoLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            avatarUri = it
            try {
                avatarBytes = context.contentResolver.openInputStream(it)?.use { stream -> stream.readBytes() }
            } catch (_: Exception) {}
        }
    }

    val isChannel = type == "channel"
    val accentColors = listOf(Color(0xFF34C759), Color(0xFF007AFF), Color(0xFFFF9500))

    if (showGroupForm) {
        DiscussionGroupForm(
            onBack = { showGroupForm = false },
            onCreated = { groupId ->
                discussionGroupId = groupId
                showGroupForm = false
            }
        )
    } else {
        Column(
            Modifier
                .fillMaxSize()
                .background(colors.bg)
                .navigationBarsPadding()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 4.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Spacer(Modifier.width(4.dp))
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(colors.card)
                        .clickable { onBack() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Назад", tint = colors.textPrimary, modifier = Modifier.size(20.dp))
                }
                Spacer(Modifier.weight(1f))
                Text("Новый канал", fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                Spacer(Modifier.weight(1f))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(colors.card)
                        .clickable {
                            val n = name.trim()
                            if (n.isEmpty()) { error = "Введите название"; return@clickable }
                            if (creating) return@clickable
                            creating = true
                            error = null
                            scope.launch {
                                try {
                                    val settings = mutableMapOf<String, Any?>(
                                        "discussion" to enableDiscussion,
                                        "pinPosts" to pinPosts,
                                        "forwarding" to forwarding,
                                        "joinRequests" to joinRequests,
                                        "channelType" to listOf("private", "public", "business")[channelType],
                                    )
                                    if (channelType == 1 && publicUsername.isNotBlank()) {
                                        settings["username"] = publicUsername.trim()
                                    }
                                    if (channelType == 2) {
                                        if (businessUsername.isNotBlank()) settings["username"] = businessUsername.trim()
                                        val validLinks = businessLinks.filter { it.isNotBlank() }
                                        if (validLinks.isNotEmpty()) settings["links"] = validLinks
                                    }
                                    val chatId = ApiClient.createChannel(n, about.trim(), settings)
                                    if (enableDiscussion && discussionGroupId != null) {
                                        try { ApiClient.linkChannelGroup(chatId, discussionGroupId) } catch (_: Exception) {}
                                    }
                                    val bytes = avatarBytes
                                    if (bytes != null) {
                                        try { ApiClient.uploadChatAvatar(chatId, bytes) } catch (_: Exception) {}
                                    }
                                    onCreated(chatId)
                                } catch (e: Exception) {
                                    error = e.message ?: "Ошибка"
                                    creating = false
                                }
                            }
                        }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(if (creating) "..." else "Далее", fontSize = 15.sp, fontWeight = FontWeight.Medium, color = colors.accentText)
                }
            }

            Spacer(Modifier.height(16.dp))

            Box(modifier = Modifier.align(Alignment.CenterHorizontally)) {
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .clip(CircleShape)
                        .background(colors.card)
                        .clickable { photoLauncher.launch("image/*") },
                    contentAlignment = Alignment.Center
                ) {
                    if (avatarUri != null) {
                        Image(
                            painter = rememberAsyncImagePainter(avatarUri),
                            contentDescription = "Аватар",
                            modifier = Modifier.fillMaxSize().clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Icon(Icons.Filled.CameraAlt, "Фото", tint = colors.textSecondary, modifier = Modifier.size(36.dp))
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(colors.card)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Lock, null, tint = colors.textSecondary, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(10.dp))
                    Box(modifier = Modifier.weight(1f)) {
                        BasicTextField(
                            value = name,
                            onValueChange = { name = it },
                            singleLine = true,
                            textStyle = androidx.compose.ui.text.TextStyle(color = colors.textPrimary, fontSize = 16.sp),
                            cursorBrush = SolidColor(colors.accent),
                            modifier = Modifier.fillMaxWidth()
                        )
                        if (name.isEmpty()) {
                            Text("Название канала", color = colors.textSecondary, fontSize = 16.sp)
                        }
                    }
                    Spacer(Modifier.width(8.dp))
                    Icon(Icons.Filled.Create, null, tint = colors.textSecondary, modifier = Modifier.size(16.dp))
                }
                HorizontalDivider(color = colors.divider, modifier = Modifier.padding(horizontal = 16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        BasicTextField(
                            value = about,
                            onValueChange = { about = it },
                            singleLine = true,
                            textStyle = androidx.compose.ui.text.TextStyle(color = colors.textPrimary, fontSize = 16.sp),
                            cursorBrush = SolidColor(colors.accent),
                            modifier = Modifier.fillMaxWidth()
                        )
                        if (about.isEmpty()) {
                            Text("Описание (необязательно)", color = colors.textSecondary, fontSize = 16.sp)
                        }
                    }
                    Spacer(Modifier.width(8.dp))
                    Icon(Icons.Filled.Create, null, tint = colors.textSecondary, modifier = Modifier.size(16.dp))
                }
            }

            Spacer(Modifier.height(12.dp))

            AnimatedVisibility(
                visible = channelType == 1,
                enter = expandVertically(spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessLow)) + fadeIn(tween(200)),
                exit = shrinkVertically(spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessLow)) + fadeOut(tween(150))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(colors.card)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("@", fontSize = 22.sp, color = colors.textSecondary, fontWeight = FontWeight.SemiBold)
                        Spacer(Modifier.width(6.dp))
                        Box(modifier = Modifier.weight(1f)) {
                            BasicTextField(
                                value = publicUsername,
                                onValueChange = { publicUsername = it.lowercase().replace(" ", "") },
                                singleLine = true,
                                textStyle = androidx.compose.ui.text.TextStyle(color = colors.textPrimary, fontSize = 20.sp),
                                cursorBrush = SolidColor(colors.accent),
                                modifier = Modifier.fillMaxWidth()
                            )
                            if (publicUsername.isEmpty()) {
                                Text("username", color = colors.textSecondary, fontSize = 20.sp)
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            AnimatedVisibility(
                visible = channelType == 2,
                enter = expandVertically(spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessLow)) + fadeIn(tween(200)),
                exit = shrinkVertically(spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessLow)) + fadeOut(tween(150))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(colors.card)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("@", fontSize = 22.sp, color = colors.textSecondary, fontWeight = FontWeight.SemiBold)
                        Spacer(Modifier.width(6.dp))
                        Box(modifier = Modifier.weight(1f)) {
                            BasicTextField(
                                value = businessUsername,
                                onValueChange = { businessUsername = it.lowercase().replace(" ", "") },
                                singleLine = true,
                                textStyle = androidx.compose.ui.text.TextStyle(color = colors.textPrimary, fontSize = 20.sp),
                                cursorBrush = SolidColor(colors.accent),
                                modifier = Modifier.fillMaxWidth()
                            )
                            if (businessUsername.isEmpty()) {
                                Text("username", color = colors.textSecondary, fontSize = 20.sp)
                            }
                        }
                    }
                    HorizontalDivider(color = colors.divider, modifier = Modifier.padding(horizontal = 16.dp))
                    businessLinks.forEachIndexed { index, link ->
                        if (index > 0) {
                            HorizontalDivider(color = colors.divider, modifier = Modifier.padding(horizontal = 16.dp))
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(modifier = Modifier.weight(1f)) {
                                BasicTextField(
                                    value = link,
                                    onValueChange = { newLink ->
                                        businessLinks = businessLinks.toMutableList().apply { set(index, newLink) }
                                    },
                                    singleLine = true,
                                    textStyle = androidx.compose.ui.text.TextStyle(color = colors.textPrimary, fontSize = 18.sp),
                                    cursorBrush = SolidColor(colors.accent),
                                    modifier = Modifier.fillMaxWidth()
                                )
                                if (link.isEmpty()) {
                                    Text("https://", color = colors.textSecondary, fontSize = 18.sp)
                                }
                            }
                            if (businessLinks.size > 1) {
                                Icon(
                                    Icons.Filled.Close,
                                    "Удалить",
                                    tint = colors.textSecondary,
                                    modifier = Modifier
                                        .size(20.dp)
                                        .clickable {
                                            businessLinks = businessLinks.toMutableList().apply { removeAt(index) }
                                        }
                                )
                            }
                        }
                    }
                    if (businessLinks.size < 3) {
                        HorizontalDivider(color = colors.divider, modifier = Modifier.padding(horizontal = 16.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { businessLinks = businessLinks + "" }
                                .padding(horizontal = 16.dp, vertical = 14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Filled.Add, null, tint = Color(0xFF34C759), modifier = Modifier.size(20.dp))
                            Spacer(Modifier.width(12.dp))
                            Text("Добавить ссылку", fontSize = 15.sp, color = Color(0xFF34C759))
                        }
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(colors.card)
            ) {
                ThemedSwitchRow(
                    label = "Создать группу для обсуждений",
                    icon = { Icon(painterResource(R.drawable.ic_nav_chats), null, tint = Color(0xFF34C759), modifier = Modifier.size(20.dp)) },
                    checked = enableDiscussion,
                    onToggle = { enableDiscussion = it }
                )

                if (enableDiscussion) {
                    HorizontalDivider(color = colors.divider, modifier = Modifier.padding(horizontal = 16.dp))

                    ThemedSwitchRow(
                        label = "Закреплять каждый пост",
                        icon = { Icon(Icons.Filled.PushPin, null, tint = Color(0xFF34C759), modifier = Modifier.size(20.dp)) },
                        checked = pinPosts,
                        onToggle = { pinPosts = it }
                    )

                    HorizontalDivider(color = colors.divider, modifier = Modifier.padding(horizontal = 16.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { showGroupForm = true }
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Filled.AddComment, null, tint = Color(0xFF34C759), modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(12.dp))
                        Text("Создать новый чат для обсуждения", fontSize = 15.sp, color = colors.textPrimary, modifier = Modifier.weight(1f))
                        if (discussionGroupId != null) {
                            Icon(Icons.Filled.Check, null, tint = Color(0xFF34C759), modifier = Modifier.size(20.dp))
                        } else {
                            Icon(Icons.Filled.ChevronRight, null, tint = colors.textSecondary, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(colors.card)
            ) {
                ThemedSwitchRow(
                    label = "Разрешение на пересылку",
                    icon = { Icon(Icons.Filled.Share, null, tint = colors.textSecondary, modifier = Modifier.size(20.dp)) },
                    checked = forwarding,
                    onToggle = { forwarding = it }
                )
                HorizontalDivider(color = colors.divider, modifier = Modifier.padding(horizontal = 16.dp))
                ThemedSwitchRow(
                    label = "Заявки на вступление",
                    icon = { Icon(Icons.Filled.HowToReg, null, tint = colors.textSecondary, modifier = Modifier.size(20.dp)) },
                    checked = joinRequests,
                    onToggle = { joinRequests = it }
                )
            }

            error?.let {
                Text(it, fontSize = 13.sp, color = Color(0xFFFF453A), modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp))
            }

            Spacer(Modifier.weight(1f))

            if (isChannel) {
                val tabLabels = listOf("Приватный", "Публичный", "Бизнес")
                val tabColors = listOf(Color(0xFF8E8E93), Color(0xFF007AFF), Color(0xFFFF9500))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 4.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(colors.card)
                        .padding(4.dp)
                ) {
                    Row(modifier = Modifier.fillMaxWidth()) {
                        tabLabels.forEachIndexed { idx, label ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (channelType == idx) tabColors[idx] else Color.Transparent)
                                    .clickable { channelType = idx },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    label,
                                    fontSize = 14.sp,
                                    fontWeight = if (channelType == idx) FontWeight.SemiBold else FontWeight.Normal,
                                    color = if (channelType == idx) Color.White else colors.textSecondary
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DiscussionGroupForm(
    onBack: () -> Unit,
    onCreated: (String) -> Unit,
) {
    val colors = AppColors.current()
    val scope = rememberCoroutineScope()
    var groupName by remember { mutableStateOf("") }
    var groupAbout by remember { mutableStateOf("") }
    var creating by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        Modifier
            .fillMaxSize()
            .background(colors.bg)
            .navigationBarsPadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 4.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Spacer(Modifier.width(4.dp))
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(colors.card)
                    .clickable { onBack() },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Назад", tint = colors.textPrimary, modifier = Modifier.size(20.dp))
            }
            Spacer(Modifier.weight(1f))
            Text("Новая группа", fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
            Spacer(Modifier.weight(1f))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(colors.card)
                    .clickable {
                        val n = groupName.trim()
                        if (n.isEmpty()) { error = "Введите название"; return@clickable }
                        if (creating) return@clickable
                        creating = true
                        error = null
                        scope.launch {
                            try {
                                val resp = ApiClient.createGroup(n, groupAbout.trim())
                                onCreated(resp)
                            } catch (e: Exception) {
                                error = e.message ?: "Ошибка"
                                creating = false
                            }
                        }
                    }
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Text(if (creating) "..." else "Далее", fontSize = 15.sp, fontWeight = FontWeight.Medium, color = colors.accentText)
            }
        }

        Spacer(Modifier.height(16.dp))

        Box(
            modifier = Modifier.align(Alignment.CenterHorizontally),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(colors.card)
                    .clickable { },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.CameraAlt, "Фото", tint = colors.textSecondary, modifier = Modifier.size(36.dp))
            }
        }

        Spacer(Modifier.height(20.dp))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(colors.card)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Filled.Lock, null, tint = colors.textSecondary, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(10.dp))
                Box(modifier = Modifier.weight(1f)) {
                    BasicTextField(
                        value = groupName,
                        onValueChange = { groupName = it },
                        singleLine = true,
                        textStyle = androidx.compose.ui.text.TextStyle(color = colors.textPrimary, fontSize = 16.sp),
                        cursorBrush = SolidColor(colors.accent),
                        modifier = Modifier.fillMaxWidth()
                    )
                    if (groupName.isEmpty()) {
                        Text("Название группы", color = colors.textSecondary, fontSize = 16.sp)
                    }
                }
                Spacer(Modifier.width(8.dp))
                Icon(Icons.Filled.Create, null, tint = colors.textSecondary, modifier = Modifier.size(16.dp))
            }
            HorizontalDivider(color = colors.divider, modifier = Modifier.padding(horizontal = 16.dp))
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(modifier = Modifier.weight(1f)) {
                    BasicTextField(
                        value = groupAbout,
                        onValueChange = { groupAbout = it },
                        singleLine = true,
                        textStyle = androidx.compose.ui.text.TextStyle(color = colors.textPrimary, fontSize = 16.sp),
                        cursorBrush = SolidColor(colors.accent),
                        modifier = Modifier.fillMaxWidth()
                    )
                    if (groupAbout.isEmpty()) {
                        Text("Описание (необязательно)", color = colors.textSecondary, fontSize = 16.sp)
                    }
                }
                Spacer(Modifier.width(8.dp))
                Icon(Icons.Filled.Create, null, tint = colors.textSecondary, modifier = Modifier.size(16.dp))
            }
        }

        error?.let {
            Text(it, fontSize = 13.sp, color = Color(0xFFFF453A), modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp))
        }
    }
}

@Composable
private fun ThemedSwitchRow(
    label: String,
    icon: @Composable (() -> Unit)? = null,
    checked: Boolean,
    onToggle: (Boolean) -> Unit,
) {
    val colors = AppColors.current()
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        icon?.invoke()
        Spacer(Modifier.width(12.dp))
        Text(label, fontSize = 15.sp, color = colors.textPrimary, modifier = Modifier.weight(1f))
        IOSSwitch(checked = checked, onCheckedChange = { onToggle(!checked) })
    }
}

@Composable
private fun IOSSwitch(checked: Boolean, onCheckedChange: () -> Unit) {
    val colors = AppColors.current()
    var isPressed by remember { mutableStateOf(false) }
    var wasDragged by remember { mutableStateOf(false) }
    var dragOffset by remember { mutableFloatStateOf(0f) }

    val density = LocalDensity.current
    val trackWidthPx = with(density) { 68.dp.toPx() }
    val thumbWidthPx = with(density) { 40.dp.toPx() }
    val maxDrag = trackWidthPx - thumbWidthPx - with(density) { 8.dp.toPx() }
    val minOffset = 2.dp
    val maxOffset = 26.dp

    val rawProgress = if (checked) 1f else 0f
    val animProgress = if (wasDragged) (dragOffset / maxDrag).coerceIn(0f, 1f) else rawProgress

    val progress by animateFloatAsState(
        targetValue = animProgress,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium)
    )

    val trackOn = if (colors.isDark) Color(0xFF8E8E93) else Color(0xFF34C759)
    val trackOff = if (colors.isDark) Color(0xFF39393D) else Color(0xFFE9E9EA)

    val trackColor by animateColorAsState(
        targetValue = if (progress > 0.5f) trackOn else trackOff,
        animationSpec = tween(250)
    )

    val lensScale by animateFloatAsState(
        targetValue = if (isPressed) 1.1f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium)
    )

    Box(
        modifier = Modifier
            .width(68.dp)
            .height(36.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(trackColor)
            .pointerInput(checked) {
                detectHorizontalDragGestures(
                    onDragStart = { isPressed = true; wasDragged = false; dragOffset = if (checked) maxDrag else 0f },
                    onDragEnd = {
                        isPressed = false
                        val finalProgress = (dragOffset / maxDrag).coerceIn(0f, 1f)
                        if (wasDragged && finalProgress > 0.3f && !checked) onCheckedChange()
                        else if (wasDragged && finalProgress < 0.7f && checked) onCheckedChange()
                        else if (!wasDragged) onCheckedChange()
                        wasDragged = false
                    },
                    onDragCancel = { isPressed = false; wasDragged = false },
                    onHorizontalDrag = { _, dragAmount -> wasDragged = true; dragOffset = (dragOffset + dragAmount).coerceIn(0f, maxDrag) }
                )
            },
        contentAlignment = Alignment.CenterStart
    ) {
        Box(
            modifier = Modifier
                .offset(x = lerp(minOffset, maxOffset, progress))
                .size(40.dp, 32.dp)
                .graphicsLayer { scaleX = lensScale; scaleY = lensScale }
                .shadow(3.dp, RoundedCornerShape(16.dp), ambientColor = Color.Black.copy(0.1f))
                .clip(RoundedCornerShape(16.dp))
                .background(Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.95f), Color.White.copy(alpha = 0.8f))))
                .border(1.5.dp, Color.White.copy(alpha = 0.6f), RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .padding(3.dp)
                    .fillMaxSize()
                    .clip(RoundedCornerShape(13.dp))
                    .background(Brush.verticalGradient(listOf(trackOn.copy(alpha = 0.15f * progress), trackOn.copy(alpha = 0.05f * progress))))
            )
        }
    }
}
